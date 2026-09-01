import express from 'express';
import fs from 'fs';
import path from 'path';
import { uploadsDir, globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { loadAgentsConfig } from '../config/agentsConfig.mjs';
import { getUserProfile } from '../services/personalRag.mjs';
import { searchRagEngine, formatRagContext } from '../services/ragEngine.mjs';
import { dispatchAdmissionsChat } from '../services/agentService.mjs';
import { dispatchGroupChatMessage } from '../services/multiAgentRouter.mjs';

const router = express.Router();

const chatUploadsDir = path.join(uploadsDir, 'chat');
if (!fs.existsSync(chatUploadsDir)) {
    fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Check whether image and file upload is allowed by Administrator
router.get(['/media-config', '/chat/media-config'], (_req, res) => {
    const allowUserMediaUpload = process.env.ALLOW_USER_MEDIA_UPLOAD !== 'false';
    res.json({ ok: true, allowUserMediaUpload });
});

// Get Public Multi-Agent Config
router.get(['/agents-config', '/chat/agents-config'], (_req, res) => {
    const configs = loadAgentsConfig();
    res.json({ ok: true, data: configs });
});

// Upload Image / Document Attachment for Chat
router.post(['/upload-attachment', '/chat/upload-attachment'], async (req, res) => {
    const allowUserMediaUpload = process.env.ALLOW_USER_MEDIA_UPLOAD !== 'false';
    if (!allowUserMediaUpload) {
        return res.status(403).json({ ok: false, error: '管理员已关闭考生图片与文件上传功能' });
    }

    const { base64, filename = 'attachment', fileType = 'image' } = req.body || {};
    if (!base64) {
        return res.status(400).json({ ok: false, error: '缺少附件文件数据 (base64 required)' });
    }

    try {
        const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        let mimeType = 'application/octet-stream';
        let buffer;

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(base64, 'base64');
        }

        const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(filename);
        const ext = path.extname(filename) || (isImage ? '.jpg' : '.bin');
        const safeName = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        const savePath = path.join(chatUploadsDir, safeName);

        fs.writeFileSync(savePath, buffer);

        let extractedText = '';
        if (!isImage && (mimeType.includes('text') || mimeType.includes('csv') || ext === '.txt' || ext === '.csv' || ext === '.json' || ext === '.md')) {
            extractedText = buffer.toString('utf8').slice(0, 4000);
        }

        const url = `/uploads/chat/${safeName}`;
        console.log(`📎 [Chat Upload] Attachment saved: ${url} (${isImage ? 'Image' : 'File'}, ${buffer.length} bytes)`);

        res.json({
            ok: true,
            attachment: {
                type: isImage ? 'image' : 'file',
                url,
                name: filename,
                size: buffer.length,
                mimeType,
                extractedText: extractedText || undefined,
                base64: isImage && buffer.length < 2 * 1024 * 1024 ? base64 : undefined
            }
        });
    } catch (err) {
        console.error('❌ [Chat Upload Error]:', err);
        res.status(500).json({ ok: false, error: `上传失败: ${err.message}` });
    }
});

import { executeLightweightChat, executeAgentThoughtPipeline } from '../services/thoughtClonesPipeline.mjs';

// --- Mode 1: Admissions Counseling (1-on-1 with Dr. Elena) ---
router.post(['/chat', '/admissions'], async (req, res) => {
    const username = req.body?.username || '';
    const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    const lastUserMsg = [...incomingMessages].reverse().find(m => m.role === 'user')?.content || '';
    const advisorMode = req.body?.advisorMode || 'agent'; // 'lightweight' | 'agent'

    // Retrieve user background profile
    let userProfile = req.body?.userProfile || null;
    if (username && !userProfile) {
        userProfile = await getUserProfile(username);
    }

    const hasRemoteKey = Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY);

    // 2. If no remote API key, serve local response using RAG context
    if (!hasRemoteKey) {
        const ragMatches = await searchRagEngine(lastUserMsg, 3, 'dr');
        if (ragMatches.length) {
            const topMatch = ragMatches[0].item;
            let reply = `根据校方数据库核对：\n\n### 📌 ${topMatch.title}\n${topMatch.content}\n\n`;

            if (topMatch.tableData && topMatch.tableData.columns && topMatch.tableData.rows) {
                reply += `| ${topMatch.tableData.columns.join(' | ')} |\n`;
                reply += `| ${topMatch.tableData.columns.map(() => '---').join(' | ')} |\n`;
                topMatch.tableData.rows.forEach(r => {
                    reply += `| ${r.join(' | ')} |\n`;
                });
                reply += `\n`;
            }

            if (topMatch.imageAttachments && topMatch.imageAttachments.length) {
                topMatch.imageAttachments.forEach(img => {
                    reply += `![${img.caption || img.name}](${img.url})\n`;
                });
            }

            return res.json({ ok: true, reply, source: 'local-bge-rag-db', mode: advisorMode });
        }

        return res.json({
            ok: true,
            reply: `同学/家长您好！我是招生咨询顾问 **Dr. Elena**。✨\n\n关于您咨询的“${lastUserMsg}”，您可以向我询问广州大学热门专业录取分数线、四人间宿舍环境配置或学费与资助政策，我会随时为您解答！`,
            source: 'local-fallback',
            mode: advisorMode
        });
    }

    // 3. Dispatch to Lightweight Fast Mode or Deep Agent Thought Clones Pipeline
    try {
        let result;
        if (advisorMode === 'lightweight') {
            result = await executeLightweightChat({
                username,
                incomingMessages,
                attachments,
                userProfile,
                lastUserMsg
            });
        } else {
            result = await executeAgentThoughtPipeline({
                username,
                incomingMessages,
                attachments,
                userProfile,
                lastUserMsg
            });
        }

        res.json(result);
    } catch (error) {
        console.error('⚠️ [Pipeline Execution Error]:', error);

        const ragMatches = await searchRagEngine(lastUserMsg, 3, 'dr');
        const ragContext = formatRagContext(ragMatches);
        const reply = ragContext ? `根据校方数据库为您查找到以下信息：\n\n${ragContext}` : '服务响应稍慢，请再次发送请求。';

        const fallbackDiagnostics = {
            requestId: `req_fallback_${Date.now()}`,
            timestamp: new Date().toISOString(),
            mode: 'admissions',
            targetAgent: { key: 'dr', name: 'Dr. Elena', title: '招生咨询顾问', color: '#a494e8' },
            routingDecision: { type: 'Fallback Error Recovery', details: `调用异常降级: ${error.message}` },
            requestPayload: {
                model: process.env.DEFAULT_MODEL || 'deepseek-chat',
                protocol: 'chat_completions',
                messages: incomingMessages
            },
            ragRetrieval: {
                query: lastUserMsg,
                retrievedCount: ragMatches?.length || 0,
                matches: (ragMatches || []).map(m => ({
                    id: m.item?.id,
                    title: m.item?.title,
                    category: m.item?.category,
                    similarityScore: m.score ? Number(m.score.toFixed(4)) : 0.88,
                    hasTableData: Boolean(m.item?.tableData)
                }))
            },
            userProfileContext: userProfile ? { username: userProfile.name || username || '未填' } : null,
            performance: {
                totalLatencyMs: 120,
                estimatedTotalTokens: Math.round(reply.length / 3.5)
            }
        };

        res.json({
            ok: true,
            reply,
            source: 'rag-fallback',
            diagnostics: fallbackDiagnostics
        });
    }
});

// --- Mode 2: Campus Freshers Multi-Agent Group Chat ---
router.post(['/group', '/chat/group'], async (req, res) => {
    const username = req.body?.username || '';
    const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];
    const lastUserMsg = [...incomingMessages].reverse().find(m => m.role === 'user')?.content || '';

    let userProfile = req.body?.userProfile || null;
    if (username && !userProfile) {
        userProfile = await getUserProfile(username);
    }

    try {
        const result = await dispatchGroupChatMessage({
            username,
            incomingMessages,
            attachments,
            userProfile,
            lastUserMsg
        });

        res.json(result);
    } catch (err) {
        console.error('❌ [Group Chat Error]:', err);
        res.json({
            ok: true,
            reply: '群聊服务正在刷新中，请稍后再试！',
            agentKey: 'senior_girl',
            agentName: '丽丽学姐',
            agentColor: '#ec4899',
            source: 'group-error-fallback'
        });
    }
});

// --- Mode 3: Intelligent Chat Title Summarization ---
router.post(['/summarize-title', '/chat/summarize-title'], async (req, res) => {
    const { userText = '', botReply = '' } = req.body || {};
    if (!userText && !botReply) {
        return res.json({ ok: false, error: 'Empty prompt' });
    }

    const cleanUserText = userText.replace(/@[^\s]+\s?/g, '').trim();

    try {
        const { aiApiKey, defaultModel } = getAiConfig();
        if (globalOpenAIClient && aiApiKey) {
            const completion = await globalOpenAIClient.chat.completions.create({
                model: defaultModel,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个对话标题提炼专家。请根据用户的提问和回答内容，用 4 到 8 个字极其精炼地概括这段对话的主题。要求：仅输出标题本身，绝对不要包含书名号、双引号、句号、Emoji或多余的前缀后缀，不要换行。'
                    },
                    {
                        role: 'user',
                        content: `用户提问: ${cleanUserText}\n回答摘要: ${botReply.slice(0, 100)}`
                    }
                ],
                max_tokens: 20,
                temperature: 0.3
            });

            let title = completion.choices?.[0]?.message?.content?.trim();
            if (title) {
                title = title.replace(/^["'《「『\s]+|["'》」』\s.]+$/g, '');
                if (title.length > 0 && title.length <= 15) {
                    return res.json({ ok: true, title });
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ [Title Summarization LLM Error]:', err.message);
    }

    // Rule-based Fallback Title Generation
    let fallbackTitle = cleanUserText
        .replace(/^(请问|我想问|你知道|查一下|帮我|怎么|如何|有什么|是不是)/g, '')
        .replace(/[?？!！,，.。]/g, '')
        .trim();

    if (!fallbackTitle) fallbackTitle = cleanUserText;
    if (fallbackTitle.length > 12) {
        fallbackTitle = fallbackTitle.slice(0, 12);
    }

    res.json({ ok: true, title: fallbackTitle || '新咨询对话' });
});

export default router;
