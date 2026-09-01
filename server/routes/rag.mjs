import express from 'express';
import fs from 'fs';
import path from 'path';
import { uploadsDir, globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { pgPool, usePostgres, getRagStore, loadJsonRag, saveJsonRag } from '../services/postgres.mjs';
import { getEmbedding } from '../services/embedding.mjs';
import { getCache, setCache, invalidateRagCache } from '../services/redis.mjs';
import { searchRagEngine } from '../services/ragEngine.mjs';

const router = express.Router();

// --- Helper: Build Standardized RAG Document Chunk ---
function buildChunkItem(content, idx, titlePrefix = '文档', targetAgent = 'all', label = '切片') {
    const trimmed = (content || '').trim();
    if (!trimmed) return null;

    let title = `${titlePrefix} - ${label} ${idx + 1}`;
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = (lines[0] || '').replace(/^[#\s\-*【\d.、]+/, '').replace(/[】]/, '').trim();
    if (firstLine && firstLine.length <= 35) {
        title = `${titlePrefix} - ${firstLine}`;
    } else if (firstLine && firstLine.length > 35) {
        title = `${titlePrefix} - ${firstLine.slice(0, 30)}...`;
    }

    let category = '通用资料';
    if (/录取|分数|排位|省控|切线|选科|批次|投档/.test(trimmed)) category = '录取分数';
    else if (/宿舍|公寓|四人间|违章电器|门禁|宿管|空调|热水|电费|床位/.test(trimmed)) category = '宿舍规章';
    else if (/转专业|学籍|请假|处分|综测|退学|休学|毕业要求|学分/.test(trimmed)) category = '政策规定';
    else if (/校园卡|快递|顺丰|校园网|选课|校巴|食堂|充值|洗澡|外卖/.test(trimmed)) category = '生活经验';
    else if (/美食|探店|打卡|雕塑园|夜市|周边|景点|商业街|小吃/.test(trimmed)) category = '探店游玩';
    else if (/学费|奖学金|资助|助学金|国家奖学金|贷款|勤工助学/.test(trimmed)) category = '学费奖学金';
    else if (/专业|学院|培养方案|课程|师资|考研|就业|实验室/.test(trimmed)) category = '专业介绍';

    const tags = [titlePrefix, category];
    const words = trimmed.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    topWords.forEach(w => { if (!tags.includes(w)) tags.push(w); });

    return {
        id: `chunk-${label}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        title,
        category,
        targetAgent: targetAgent || 'all',
        type: 'text',
        content: trimmed,
        tableData: null,
        imageAttachments: [],
        tags
    };
}

// --- Smart Document Parsing & Automated Chunking API ---
router.post('/parse-document', async (req, res) => {
    const {
        text,
        filename,
        chunkSize = 400,
        mode = 'heading',
        targetAgent = 'all',
        customPrompt = '',
        separator = ''
    } = req.body || {};

    if (!text || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Text content is required' });
    }

    const rawText = text.trim();
    const titlePrefix = filename ? filename.replace(/\.[^/.]+$/, '') : '导入文档';
    const chunks = [];
    const { fastModel } = getAiConfig();

    // 1. AI 智能语义切片模式
    if (mode === 'ai') {
        if (globalOpenAIClient) {
            try {
                console.log(`🤖 [Fast Model: ${fastModel}] Sending document for AI Semantic Chunking (customPrompt: ${Boolean(customPrompt)})...`);
                
                let promptText = '';
                if (customPrompt && customPrompt.trim()) {
                    promptText = `${customPrompt.trim()}

【输出格式强制要求】：
必须直接返回严格符合 JSON 格式的数组，不要包含任何 Markdown 代码块标记（如 \`\`\`json）。每个对象必须包含：
[
  {
    "title": "切片标题",
    "category": "分类（如：录取分数、专业介绍、宿舍环境、学费奖学金、校园生活等）",
    "type": "text",
    "content": "提炼后的切片核心内容",
    "tags": ["关键词1", "关键词2"]
  }
]

待处理文档内容：
${rawText.slice(0, 6000)}`;
                } else {
                    promptText = `你是一位专业的 RAG 知识库构建与语义切片专家。请将以下文档内容拆分为 3~15 个逻辑独立、语义连贯的知识切片。

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
${rawText.slice(0, 6000)}`;
                }

                const completion = await globalOpenAIClient.chat.completions.create({
                    model: fastModel,
                    messages: [{ role: 'user', content: promptText }],
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
                                targetAgent: targetAgent || 'all',
                                type: c.type || 'text',
                                content: c.content || '',
                                tableData: c.tableData || null,
                                imageAttachments: [],
                                tags: Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : [titlePrefix, 'AI切片']
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

    // 2. 按行切片模式 (line)
    if (mode === 'line') {
        const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        rawLines.forEach((line, idx) => {
            const chunk = buildChunkItem(line, idx, titlePrefix, targetAgent, '行');
            if (chunk) chunks.push(chunk);
        });
        return res.json({ ok: true, count: chunks.length, chunks, source: 'line' });
    }

    // 3. 按标点符号切片模式 (punctuation)
    if (mode === 'punctuation') {
        // 按常见句子终结符切分：中文/英文句号、感叹号、问号、分号、换行
        const sentenceRegex = /[^。！？!?；;\n]+[。！？!?；;\n]*/g;
        const rawSentences = rawText.match(sentenceRegex) || [rawText];
        
        let currentMerged = '';
        let count = 0;
        for (let i = 0; i < rawSentences.length; i++) {
            const s = rawSentences[i].trim();
            if (!s) continue;
            
            if (currentMerged.length > 0 && currentMerged.length + s.length < 120) {
                currentMerged += (/[。！？!?；;]$/.test(currentMerged) ? '' : ' ') + s;
            } else {
                if (currentMerged.trim()) {
                    const chunk = buildChunkItem(currentMerged, count++, titlePrefix, targetAgent, '语句');
                    if (chunk) chunks.push(chunk);
                }
                currentMerged = s;
            }
        }
        if (currentMerged.trim()) {
            const chunk = buildChunkItem(currentMerged, count++, titlePrefix, targetAgent, '语句');
            if (chunk) chunks.push(chunk);
        }
        return res.json({ ok: true, count: chunks.length, chunks, source: 'punctuation' });
    }

    // 4. 按指定间隔符/自定义分隔符切片 (separator)
    if (mode === 'separator' && separator) {
        // 解析可能转义的换行符
        let unescapedSep = separator
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r');
        
        const rawParts = rawText.split(unescapedSep).map(p => p.trim()).filter(Boolean);
        rawParts.forEach((part, idx) => {
            const chunk = buildChunkItem(part, idx, titlePrefix, targetAgent, '分隔段');
            if (chunk) chunks.push(chunk);
        });
        return res.json({ ok: true, count: chunks.length, chunks, source: 'separator' });
    }

    // 5. 按 Markdown 标题或段落章节切片 (heading)
    if (mode === 'heading' || mode === 'ai') {
        let sections = rawText.split(/(?=(?:^|\n)\s*#{1,6}\s+)/).filter(s => s && s.trim());

        if (sections.length <= 1) {
            sections = rawText.split(/(?=(?:^|\n)\s*(?:#{1,6}\s*|第[一二三四五六七八九十0-9]+[章节篇]|【|\d+\.\s+))/).filter(s => s && s.trim());
        }

        if (sections.length <= 1) {
            sections = rawText.split(/\n\s*\n/).filter(s => s && s.trim());
        }

        if (sections.length > 1) {
            sections.forEach((sec, idx) => {
                const chunk = buildChunkItem(sec, idx, titlePrefix, targetAgent, '章节');
                if (chunk) chunks.push(chunk);
            });
            return res.json({ ok: true, count: chunks.length, chunks, source: 'heading' });
        }
    }

    // 6. 固定字数切片模式 (length) / 兜底按字数切片
    const size = parseInt(chunkSize, 10) || 400;
    const words = rawText.split('');
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i++) {
        currentChunk += words[i];
        if (currentChunk.length >= size && (/[。！？\n]/.test(words[i]) || currentChunk.length >= size + 50)) {
            const chunk = buildChunkItem(currentChunk, chunkIndex++, titlePrefix, targetAgent, '分段');
            if (chunk) chunks.push(chunk);
            currentChunk = '';
        }
    }
    if (currentChunk.trim()) {
        const chunk = buildChunkItem(currentChunk, chunkIndex++, titlePrefix, targetAgent, '分段');
        if (chunk) chunks.push(chunk);
    }

    res.json({
        ok: true,
        count: chunks.length,
        chunks,
        source: 'length'
    });
});

// --- Batch Save Chunked Items with Embeddings ---
router.post('/save-chunks', async (req, res) => {
    const { chunks } = req.body || {};
    if (!Array.isArray(chunks) || chunks.length === 0) {
        return res.status(400).json({ ok: false, error: 'chunks must be a non-empty array' });
    }

    const savedItems = [];
    for (const chunk of chunks) {
        const textToEmbed = `${chunk.title || ''} ${chunk.category || ''} ${chunk.content || ''} ${(chunk.tags || []).join(' ')}`;
        const vec = await getEmbedding(textToEmbed);

        const newItem = {
            id: chunk.id || `rag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: chunk.title || '无标题切片',
            category: chunk.category || '导入切片',
            targetAgent: chunk.targetAgent || 'all',
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
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE
           SET title = EXCLUDED.title, category = EXCLUDED.category, type = EXCLUDED.type, content = EXCLUDED.content, table_data = EXCLUDED.table_data, image_attachments = EXCLUDED.image_attachments, tags = EXCLUDED.tags, embedding = EXCLUDED.embedding, updated_at = EXCLUDED.updated_at`,
                [
                    newItem.id, newItem.title, newItem.category, newItem.type, newItem.content,
                    JSON.stringify(newItem.tableData), JSON.stringify(newItem.imageAttachments),
                    JSON.stringify(newItem.tags), vecStr, newItem.updatedAt
                ]
            );
        } else {
            const jsonStore = loadJsonRag();
            const existingIdx = jsonStore.findIndex(item => item.id === newItem.id);
            if (existingIdx >= 0) {
                jsonStore[existingIdx] = newItem;
            } else {
                jsonStore.unshift(newItem);
            }
            saveJsonRag(jsonStore);
        }

        savedItems.push(newItem);
    }

    await invalidateRagCache();
    res.json({ ok: true, count: savedItems.length, savedItems });
});

// --- RAG Knowledge Base Management APIs ---
router.get('/rag', async (req, res) => {
    const targetAgent = req.query?.targetAgent;
    const ragStore = await getRagStore();

    if (targetAgent && targetAgent !== 'all') {
        const filtered = ragStore.filter(item => {
            const agent = item.targetAgent || item.target_agent;
            return agent === targetAgent || agent === 'all';
        });
        return res.json({ ok: true, data: filtered, count: filtered.length });
    }

    res.json({ ok: true, data: ragStore, count: ragStore.length });
});

// Backward-compatible alias for /api/admin/rag/items
router.get('/rag/items', async (req, res) => {
    const targetAgent = req.query?.targetAgent;
    const ragStore = await getRagStore();

    if (targetAgent && targetAgent !== 'all') {
        const filtered = ragStore.filter(item => {
            const agent = item.targetAgent || item.target_agent;
            return agent === targetAgent || agent === 'all';
        });
        return res.json({ ok: true, items: filtered, count: filtered.length });
    }

    res.json({ ok: true, items: ragStore, count: ragStore.length });
});

router.post('/rag', async (req, res) => {
    const title = req.body.title || '新建知识项';
    const category = req.body.category || '通用';
    const targetAgent = req.body.targetAgent || 'all';
    const content = req.body.content || '';
    const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

    const textToEmbed = `${title} ${category} ${content} ${tags.join(' ')}`;
    const vec = await getEmbedding(textToEmbed);

    const newItem = {
        id: `rag-${Date.now()}`,
        title,
        category,
        targetAgent,
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
    const targetAgent = req.body.targetAgent || 'all';
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
                targetAgent,
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
    const targetAgent = req.body?.targetAgent || null;
    console.log(`🌐 [/api/admin/rag/search] Received search query: "${query}" (targetAgent: ${targetAgent || 'all'})`);
    const matches = await searchRagEngine(query, 5, targetAgent);
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
