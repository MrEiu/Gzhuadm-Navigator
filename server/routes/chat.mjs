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

// Helper to classify API and gateway errors
export const classifyApiError = (error) => {
    const msg = (error?.message || error?.toString() || '').toLowerCase();
    const status = error?.status || error?.statusCode || error?.response?.status;
    const code = error?.code || error?.error?.code;

    // 1. API Key Invalid (401 / AuthenticationError)
    if (
        status === 401 ||
        code === 'invalid_api_key' ||
        msg.includes('api_key') ||
        msg.includes('authentication') ||
        msg.includes('unauthorized') ||
        msg.includes('incorrect api key') ||
        msg.includes('invalid api key') ||
        msg.includes('401')
    ) {
        return {
            type: 'api_key_invalid',
            title: '大模型 API Key 无效或未授权',
            message: '当前系统配置的 API Key 无法通过大模型厂商鉴权验证（可能已失效、被撤销或填写的 Base URL 不匹配）。请进入后台管理检查。',
            status: 401
        };
    }

    // 2. API Quota Exceeded / Arrears / Insufficient Balance (402 / 429 quota / insufficient_quota)
    if (
        status === 402 ||
        code === 'insufficient_quota' ||
        code === 'quota_exceeded' ||
        msg.includes('insufficient') ||
        msg.includes('quota') ||
        msg.includes('balance') ||
        msg.includes('欠费') ||
        msg.includes('余额不足') ||
        msg.includes('billing') ||
        msg.includes('exceeded your current quota') ||
        msg.includes('402')
    ) {
        return {
            type: 'api_quota_exceeded',
            title: '大模型 API 账户欠费或配额已耗尽',
            message: '上游大模型服务商提示当前账户余额已不足或 Token 额度耗尽（处于欠费停服状态）。请及时登录厂商控制台充值或在后台更换可用 Key。',
            status: 402
        };
    }

    // 3. Upstream Rate Limit (429)
    if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
        return {
            type: 'api_rate_limit',
            title: 'API 调用频率超限 (429 Rate Limit)',
            message: '大模型服务商触发了调用频率速率限制，请稍候再试或升级厂商并发配额。',
            status: 429
        };
    }

    // 4. Upstream Network / Timeout / Gateway Error
    if (
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'ETIMEDOUT' ||
        msg.includes('fetch failed') ||
        msg.includes('econnrefused') ||
        msg.includes('timeout')
    ) {
        return {
            type: 'network_error',
            title: '大模型上游端点网络连接超时',
            message: '无法连通指定的大模型 Base URL，请检查服务商域名是否正常或网络代理设置。',
            status: 502
        };
    }

    // 5. Generic API Error
    return {
        type: 'generic',
        title: '大模型服务网关响应异常',
        message: error?.message || '大模型上游返回未知错误',
        status: 500
    };
};

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
        const agents = loadAgentsConfig();
        const drConfig = agents.dr || {};
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

            return res.json({
                ok: true,
                reply,
                source: 'local-bge-rag-db',
                mode: advisorMode,
                agentKey: 'dr',
                agentName: drConfig.name || 'Dr. Elena',
                agentTitle: drConfig.title || '首席招生咨询顾问',
                agentAvatar: drConfig.avatar,
                agentColor: drConfig.bubbleColor || '#8b5cf6'
            });
        }

        return res.json({
            ok: true,
            reply: `同学/家长您好！我是招生咨询顾问 **${drConfig.name || 'Dr. Elena'}**。✨\n\n关于您咨询的“${lastUserMsg}”，您可以向我询问广州大学热门专业录取分数线、四人间宿舍环境配置或学费与资助政策，我会随时为您解答！`,
            source: 'local-fallback',
            mode: advisorMode,
            agentKey: 'dr',
            agentName: drConfig.name || 'Dr. Elena',
            agentTitle: drConfig.title || '首席招生咨询顾问',
            agentAvatar: drConfig.avatar,
            agentColor: drConfig.bubbleColor || '#8b5cf6'
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
        const classified = classifyApiError(error);

        return res.status(classified.status || 500).json({
            ok: false,
            errorCategory: classified.type,
            errorTitle: classified.title,
            errorMessage: classified.message,
            details: error?.message || '未知异常',
            status: classified.status,
            serviceMessage: '很抱歉，当前咨询服务正在升级维护中，请稍后再试。感谢您的理解与支持！'
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
        const classified = classifyApiError(err);
        return res.status(classified.status || 500).json({
            ok: false,
            errorCategory: classified.type,
            errorTitle: classified.title,
            errorMessage: classified.message,
            details: err?.message || '未知异常',
            status: classified.status,
            serviceMessage: '群聊咨询服务正在升级维护中，请稍后再试！'
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
