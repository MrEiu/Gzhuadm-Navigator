import express from 'express';
import fs from 'fs';
import path from 'path';
import { uploadsDir, globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { pgPool, usePostgres, getRagStore, loadJsonRag, saveJsonRag } from '../services/postgres.mjs';
import { getEmbedding } from '../services/embedding.mjs';
import { getCache, setCache, invalidateRagCache } from '../services/redis.mjs';
import { searchRagEngine } from '../services/ragEngine.mjs';

const router = express.Router();

// --- Smart Document Parsing & Automated Chunking API ---
router.post('/parse-document', async (req, res) => {
    const { text, filename, chunkSize = 400, mode = 'heading' } = req.body || {};
    if (!text || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Text content is required' });
    }

    const rawText = text.trim();
    const titlePrefix = filename ? filename.replace(/\.[^/.]+$/, '') : '导入文档';
    const chunks = [];
    const { fastModel } = getAiConfig();

    let sections = [];
    if (mode === 'ai') {
        if (globalOpenAIClient) {
            try {
                console.log(`🤖 [Fast Model: ${fastModel}] Sending document for AI Smart Semantic Chunking...`);
                const prompt = `你是一位专业的 RAG 知识库构建与语义切片专家。请将以下文档内容拆分为 3~15 个逻辑独立、语义连贯的知识切片。

对于每一个切片，必须提取：
1. title: 简洁切片标题
2. category: 分类（如：录取分数、专业介绍、宿舍环境、学费奖学金、校园生活等）
3. type: 'text' 或 'table'
4. content: 提炼后的核心内容
5. tags: 3~6 个适合向量检索的检索关键词数组

必须直接返回严格符合 JSON 格式的数组，不要包含 Markdown 代码块标记。格式如下：
[
  {
    "title": "标题",
    "category": "分类",
    "type": "text",
    "content": "核心内容",
    "tags": ["关键词1", "关键词2"]
  }
]

文档内容：
${rawText.slice(0, 4500)}`;

                const completion = await globalOpenAIClient.chat.completions.create({
                    model: fastModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3
                });

                const replyText = completion?.choices?.[0]?.message?.content?.trim() || '';
                const jsonMatch = replyText.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const aiChunks = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(aiChunks) && aiChunks.length > 0) {
                        aiChunks.forEach((c, i) => {
                            chunks.push({
                                id: `chunk-ai-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                                title: c.title || `${titlePrefix} - AI切片 ${i + 1}`,
                                category: c.category || 'AI切片',
                                type: c.type || 'text',
                                content: c.content || '',
                                tableData: c.tableData || null,
                                imageAttachments: [],
                                tags: Array.isArray(c.tags) ? c.tags : [titlePrefix, 'AI切片']
                            });
                        });

                        return res.json({ ok: true, count: chunks.length, chunks, source: 'ai-gateway' });
                    }
                }
            } catch (err) {
                console.warn('⚠️ AI chunking failed, falling back to heuristic chunker:', err.message);
            }
        }
    }

    if (mode === 'heading' || mode === 'ai') {
        sections = rawText.split(/(?=(?:^|\n)\s*#{1,6}\s+)/).filter(s => s && s.trim());

        if (sections.length <= 1) {
            sections = rawText.split(/(?=(?:^|\n)\s*(?:#{1,6}\s*|第[一二三四五六七八九十0-9]+[章节篇]|【|\d+\.\s+))/).filter(s => s && s.trim());
        }

        if (sections.length <= 1) {
            sections = rawText.split(/\n\s*\n/).filter(s => s && s.trim());
        }
    }

    if (sections.length > 1) {
        sections.forEach((sec, idx) => {
            const trimmed = sec.trim();
            if (!trimmed) return;

            const lines = trimmed.split('\n');
            let title = `${titlePrefix} - 切片 ${idx + 1}`;
            let content = trimmed;

            const firstLine = lines[0].trim();
            if (/^(?:#{1,6}\s*|第[一二三四五六七八九十0-9]+[章节篇]|【|\d+\.\s+)/.test(firstLine)) {
                title = firstLine.replace(/^(?:#{1,6}\s*|【|】)/g, '').trim();
                content = lines.slice(1).join('\n').trim();
            }

            if (!content) content = trimmed;

            const tags = Array.from(new Set([
                titlePrefix,
                ...title.split(/[\s:：,，\-]+/).filter(w => w.length > 1),
                '文档切片'
            ]));

            chunks.push({
                id: `chunk-temp-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                title: title || `${titlePrefix} - 切片 ${idx + 1}`,
                category: '文档切片',
                type: 'text',
                content,
                tableData: null,
                imageAttachments: [],
                tags
            });
        });
    } else {
        let currentIdx = 0;
        let chunkCount = 1;
        const effChunkSize = Math.max(100, Number(chunkSize) || 400);
        while (currentIdx < rawText.length) {
            const slice = rawText.slice(currentIdx, currentIdx + effChunkSize);
            const title = `${titlePrefix} (第 ${chunkCount} 部分)`;
            chunks.push({
                id: `chunk-temp-${Date.now()}-${chunkCount}-${Math.floor(Math.random() * 1000)}`,
                title,
                category: '文档切片',
                type: 'text',
                content: slice.trim(),
                tableData: null,
                imageAttachments: [],
                tags: [titlePrefix, `切片${chunkCount}`, '文档切片']
            });
            currentIdx += effChunkSize;
            chunkCount++;
        }
    }

    res.json({ ok: true, count: chunks.length, chunks });
});

// --- Smart CSV/Table Parser API ---
router.post('/parse-table', (req, res) => {
    const { csvText, filename } = req.body || {};
    if (!csvText || !csvText.trim()) {
        return res.status(400).json({ ok: false, error: 'CSV/Table content required' });
    }

    const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) return res.status(400).json({ ok: false, error: 'Empty table' });

    const columns = lines[0].split(/[,,\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1).map(line =>
        line.split(/[,,\t]/).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
    );

    res.json({
        ok: true,
        title: filename ? filename.replace(/\.[^/.]+$/, '') : '导入表格',
        tableData: { columns, rows }
    });
});

// --- Batch Save Edited Chunks API ---
router.post('/rag/batch', async (req, res) => {
    const { chunks } = req.body || {};
    if (!Array.isArray(chunks) || !chunks.length) {
        return res.status(400).json({ ok: false, error: 'Chunks array required' });
    }

    const savedItems = [];
    for (const chunk of chunks) {
        const textToEmbed = `${chunk.title} ${chunk.category} ${chunk.content} ${(chunk.tags || []).join(' ')}`;
        const vec = await getEmbedding(textToEmbed);

        const newItem = {
            id: `rag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: chunk.title || '新建切片',
            category: chunk.category || '通用',
            type: chunk.type || 'text',
            content: chunk.content || '',
            tableData: chunk.tableData || null,
            imageAttachments: Array.isArray(chunk.imageAttachments) ? chunk.imageAttachments : [],
            tags: Array.isArray(chunk.tags) ? chunk.tags : [],
            embedding: vec,
            updatedAt: new Date().toISOString()
        };

        if (usePostgres) {
            const vecStr = vec ? `[${vec.join(',')}]` : null;
            await pgPool.query(
                `INSERT INTO rag_knowledge (id, title, category, type, content, table_data, image_attachments, tags, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    newItem.id, newItem.title, newItem.category, newItem.type, newItem.content,
                    JSON.stringify(newItem.tableData), JSON.stringify(newItem.imageAttachments),
                    JSON.stringify(newItem.tags), vecStr, newItem.updatedAt
                ]
            );
        } else {
            const jsonStore = loadJsonRag();
            jsonStore.unshift(newItem);
            saveJsonRag(jsonStore);
        }
        savedItems.push(newItem);
    }

    await invalidateRagCache();
    res.json({ ok: true, count: savedItems.length, savedItems });
});

// --- RAG Knowledge Base Management APIs ---
router.get('/rag', async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    const cacheKey = 'rag:knowledge:all';
    const cached = await getCache(cacheKey);
    if (cached) {
        return res.json({ ok: true, data: cached, source: 'cache' });
    }

    const ragStore = await getRagStore();
    await setCache(cacheKey, ragStore, 600);
    res.json({ ok: true, data: ragStore, source: 'db' });
});

// Backward-compatible alias for /api/admin/rag/items
router.get('/rag/items', async (_req, res) => {
    const ragStore = await getRagStore();
    res.json({ ok: true, items: ragStore });
});

router.post('/rag', async (req, res) => {
    const title = req.body.title || '新建知识项';
    const category = req.body.category || '通用';
    const content = req.body.content || '';
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    const textToEmbed = `${title} ${category} ${content} ${tags.join(' ')}`;
    const vec = await getEmbedding(textToEmbed);

    const newItem = {
        id: `rag-${Date.now()}`,
        title,
        category,
        type: req.body.type || 'text',
        content,
        tableData: req.body.tableData || null,
        imageAttachments: Array.isArray(req.body.imageAttachments) ? req.body.imageAttachments : [],
        tags,
        embedding: vec,
        updatedAt: new Date().toISOString()
    };

    if (usePostgres) {
        const vecStr = vec ? `[${vec.join(',')}]` : null;
        await pgPool.query(
            `INSERT INTO rag_knowledge (id, title, category, type, content, table_data, image_attachments, tags, embedding, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                newItem.id, newItem.title, newItem.category, newItem.type, newItem.content,
                JSON.stringify(newItem.tableData), JSON.stringify(newItem.imageAttachments),
                JSON.stringify(newItem.tags), vecStr, newItem.updatedAt
            ]
        );
    } else {
        const jsonStore = loadJsonRag();
        jsonStore.unshift(newItem);
        saveJsonRag(jsonStore);
    }

    await invalidateRagCache();
    res.json({ ok: true, data: newItem });
});

router.put('/rag/:id', async (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const category = req.body.category;
    const content = req.body.content;
    const tags = req.body.tags;

    const textToEmbed = `${title || ''} ${category || ''} ${content || ''} ${(tags || []).join(' ')}`;
    const vec = await getEmbedding(textToEmbed);

    if (usePostgres) {
        const vecStr = vec ? `[${vec.join(',')}]` : null;
        await pgPool.query(
            `UPDATE rag_knowledge
       SET title = $1, category = $2, type = $3, content = $4, table_data = $5, image_attachments = $6, tags = $7, embedding = $8, updated_at = $9
       WHERE id = $10`,
            [
                req.body.title, req.body.category, req.body.type, req.body.content,
                JSON.stringify(req.body.tableData), JSON.stringify(req.body.imageAttachments),
                JSON.stringify(req.body.tags), vecStr, new Date().toISOString(), id
            ]
        );
    } else {
        const jsonStore = loadJsonRag();
        const index = jsonStore.findIndex(item => item.id === id);
        if (index !== -1) {
            jsonStore[index] = {
                ...jsonStore[index],
                ...req.body,
                embedding: vec,
                updatedAt: new Date().toISOString()
            };
            saveJsonRag(jsonStore);
        }
    }

    await invalidateRagCache();
    res.json({ ok: true });
});

router.delete('/rag/:id', async (req, res) => {
    const id = req.params.id;
    if (usePostgres) {
        await pgPool.query('DELETE FROM rag_knowledge WHERE id = $1', [id]);
    } else {
        const jsonStore = loadJsonRag().filter(item => item.id !== id);
        saveJsonRag(jsonStore);
    }

    await invalidateRagCache();
    res.json({ ok: true });
});

// Backward-compatible alias for /api/admin/rag/items/:id
router.delete('/rag/items/:id', async (req, res) => {
    const id = req.params.id;
    if (usePostgres) {
        await pgPool.query('DELETE FROM rag_knowledge WHERE id = $1', [id]);
    } else {
        const jsonStore = loadJsonRag().filter(item => item.id !== id);
        saveJsonRag(jsonStore);
    }

    await invalidateRagCache();
    res.json({ ok: true });
});

router.post('/rag/search', async (req, res) => {
    const query = req.body?.query || '';
    console.log(`🌐 [/api/admin/rag/search] Received search query: "${query}"`);
    const matches = await searchRagEngine(query, 5);
    console.log(`📤 [/api/admin/rag/search] Returning ${matches.length} matches`);
    res.json({ ok: true, matches });
});

router.post('/upload-image', (req, res) => {
    const { base64Data, filename } = req.body || {};
    if (!base64Data || !filename) {
        return res.status(400).json({ ok: false, error: 'base64Data and filename required' });
    }

    try {
        const cleanFilename = `${Date.now()}_${filename.replace(/[^\w.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, cleanFilename);
        const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');

        fs.writeFileSync(filePath, buffer);
        const fileUrl = `http://localhost:${process.env.PORT || 3001}/uploads/${cleanFilename}`;

        res.json({
            ok: true,
            attachment: {
                name: filename,
                url: fileUrl,
                caption: filename.replace(/\.[^/.]+$/, '')
            }
        });
    } catch (err) {
        console.error('Image upload failed:', err);
        res.status(500).json({ ok: false, error: 'Upload failed' });
    }
});

export default router;
