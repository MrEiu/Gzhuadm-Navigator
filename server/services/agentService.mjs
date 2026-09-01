import { Agent, tool } from '@openai/agents';
import { z } from 'zod';
import { ADMISSIONS_SYSTEM_PROMPT } from '../config/constants.mjs';
import { getAiConfig } from '../config/env.mjs';
import { searchRagEngine, formatRagContext } from './ragEngine.mjs';
import { searchUserPersonalRagEngine, saveUserPersonalMemory } from './personalRag.mjs';
import { performWebSearch } from './webSearch.mjs';

// 1. Campus Fact & RAG Knowledge Search Tool
export const searchCampusKnowledgeTool = tool({
    name: 'searchCampusKnowledge',
    description: '查询广州大学及校方权威事实数据库（RAG）。当考生或家长询问具体省份的历年高考录取分数线、排位对照、各专业特色与要求、宿舍环境配置与实景图片、学费标准及“奖助贷勤补”资助政策等校方权威事实数据时，必须调用此工具获取准确数据。日常寒暄、问候、常规通识分析切勿调用此工具。',
    parameters: z.object({
        query: z.string().describe('用于校方知识库检索的高密度核心关键词。请去除用户口语中的废话（如“我想了解”、“请问”），提取精准实体与属性词，例如：“浙江 计算机 录取分数线”、“四人间宿舍配置 空调 独卫”、“工科 学费 奖学金”'),
    }),
    execute: async ({ query }) => {
        console.log(`🔍 [Agent Tool Call] searchCampusKnowledge with query: "${query}"`);
        const ragMatches = await searchRagEngine(query, 3);
        if (!ragMatches || ragMatches.length === 0) {
            return '校方数据库中暂未检索到直接匹配的条目。请结合通用招生指导常识进行解答，并提示学生关注招生办官方发布。';
        }
        return formatRagContext(ragMatches);
    },
});

// 2. VIP Personal Memory Search Tool
export const searchPersonalMemoryTool = tool({
    name: 'searchPersonalMemory',
    description: '查询当前考生的专属历史咨询偏好与背景记忆档案（仅在需要回顾该考生的历史诉求、家庭经济偏好、特殊意向时调用）。',
    parameters: z.object({
        username: z.string().describe('当前考生的用户名'),
        query: z.string().describe('需要检索的历史偏好关键词，如“意向城市”、“目标专业”、“家庭预算”'),
    }),
    execute: async ({ username, query }) => {
        if (!username) return '未提供考生用户名';
        console.log(`🧠 [Agent Tool Call] searchPersonalMemory for "${username}" with query: "${query}"`);
        const matches = await searchUserPersonalRagEngine(username, query, 3);
        if (!matches || matches.length === 0) return '暂无该考生的历史偏好记录。';
        return matches.map(m => `- ${m.item.title} (${m.item.category}): ${m.item.content}`).join('\n');
    },
});

// 3. Save User Preference Tool
export const saveUserPreferenceTool = tool({
    name: 'saveUserPreference',
    description: '当考生在对话中表达了明确的志愿意向、专业兴趣、目标城市、家庭预算或特殊报考诉求时，调用此工具将该偏好沉淀记录到考生专属档案中。',
    parameters: z.object({
        username: z.string().describe('考生的用户名'),
        preference: z.string().describe('提炼出的考生具体偏好内容，例如“倾向留在大湾区就业，优先考虑计算机或人工智能专业”'),
        category: z.string().default('志愿偏好').describe('偏好分类，如“专业偏好”、“地域偏好”、“家庭经济”'),
    }),
    execute: async ({ username, preference, category }) => {
        if (!username || !preference) return '保存失败：缺少用户名或偏好内容';
        console.log(`💾 [Agent Tool Call] saveUserPreference for "${username}": "${preference}" (${category})`);
        await saveUserPersonalMemory(username, preference, '考生偏好沉淀', category);
        return '已成功记录考生的报考偏好。';
    },
});

// 4. Web Search Tool Definition for Agent
export const webSearchTool = tool({
    name: 'webSearch',
    description: '当校方内部数据库中未收录相关信息，或者考生/家长询问全国性高考宏观政策、教育部新规、全国其他高校专业对比、各行业最新就业薪资中位数、考研趋势等实时互联网资讯时，调用此工具进行全网搜索。',
    parameters: z.object({
        query: z.string().describe('用于联网检索的高密度核心关键词，例如“2025 计算机专业就业薪资 中位数”、“广东省高考选科最新限制政策”、“人工智能与软件工程 就业前景对比”'),
    }),
    execute: async ({ query }) => {
        console.log(`🌐 [Agent Tool Call] webSearch with query: "${query}"`);
        const results = await performWebSearch(query, 3);
        if (!results || results.length === 0) {
            return '全网搜索暂未获取到高相关的网页结果，请根据通用行业常识进行解答。';
        }
        let text = `【互联网实时检索结果】：\n\n`;
        results.forEach((r, idx) => {
            text += `${idx + 1}. **[${r.title}](${r.url})**\n`;
            if (r.snippet) text += `   摘要：${r.snippet}\n`;
            if (r.images && r.images.length > 0) {
                const imgMarkdown = r.images.map(img => `![${img.title || r.title}](${img.url || img})`).join(' ');
                text += `   相关配图（如对回答有帮助可直接在 Markdown 中引用）：${imgMarkdown}\n`;
            }
            text += `\n`;
        });
        return text;
    },
});

import { fetchWebPageDetails } from './webReader.mjs';

// 5. Deep Web Page Content Fetcher Tool
export const fetchWebPageTool = tool({
    name: 'fetchWebPage',
    description: '深度抓取指定网页 URL 的完整文章正文、招生简章详情、官方录取表格或通知原文。当通过 webSearch 检索到的网页摘要不够详细，或需要深入获取招生政策细则/表格数据时主动调用。',
    parameters: z.object({
        url: z.string().describe('需要抓取正文详情的目标网页完整 URL 地址（必须以 http:// 或 https:// 开头）'),
    }),
    execute: async ({ url }) => {
        console.log(`📄 [Agent Tool Call] fetchWebPage for URL: "${url}"`);
        const res = await fetchWebPageDetails(url, 3000);
        if (!res.ok) {
            return `抓取该网页详情失败（${res.error || '无法访问'}）。请根据现有搜索摘要及常识进行解答。`;
        }
        return `【网页真实正文详情 - 标题：${res.title}】（解析引擎：${res.source}）：\n\n${res.content}`;
    }
});

import { run, user, assistant } from '@openai/agents';
import { globalOpenAIClient } from '../config/env.mjs';

export const createAdmissionsAgent = (userProfile, username) => {
    const { defaultModel } = getAiConfig();
    const customPrompt = process.env.CUSTOM_SYSTEM_PROMPT;
    let instructions = customPrompt && customPrompt.trim() ? customPrompt.trim() : ADMISSIONS_SYSTEM_PROMPT;
    if (userProfile) {
        instructions += `\n\n【当前咨询学生背景资料】：
- 姓名：${userProfile.name || username || '未填'}
- 性别：${userProfile.gender || '未填'}
- 手机号：${userProfile.phone || '未填'}
- 高考省份：${userProfile.province || '未填'}
- 高考分数：${userProfile.score || '未填'} 分
- 全省排名：${userProfile.rank ? `第 ${userProfile.rank} 名` : '未填'}
- 选科情况：${userProfile.subjects || '未填'}
- 特殊情况说明：${userProfile.specialConditions || '无'}
✨ 请针对该学生的具体高考省份、位次成绩与选科偏好，提供贴合其个人情况的定制化报考方案！`;
    }

    instructions += `\n\n【智能体自主决策与工具调用指引】：
1. **按需 RAG 检索（校内事实与校方数据）**：
   - 遇到询问广州大学具体省份录取分数线、排位比对、特定专业详情、宿舍环境配置与实景图片、学费标准与奖助学金政策等具体事实时，**必须主动调用 searchCampusKnowledge 工具**查询校方真实数据，严禁凭空编造事实或数据。
2. **按需联网搜索与正文抓取（全网资讯与宏观动态）**：
   - 遇到询问全国性高考政策新规、其他高校对比、各行业最新中位数薪资与考研就业趋势等外部资讯时，**调用 webSearch 工具**获取互联网实时检索结果；
   - 若检索摘要不够详细或涉及长篇政策、招生细则，**可进一步调用 fetchWebPage 工具**抓取目标网页的完整 Markdown 正文与表格数据。
3. **日常对话零工具**：
   - 遇到打招呼（如“你好”、“在吗”）、礼貌问候、或者通识性选专业方法论等通用咨询时，**直接依据知识储备进行解答，不滥用工具**。
4. **偏好沉淀**：
   - 考生在对话中表明了明确的报考诉求或家庭情况（例如“我只想去广州读大学”、“以后想考公或者进国企”），可主动调用 saveUserPreference 工具沉淀记录。
5. **图片与链接规范**：
   - 若知识检索或搜索结果中包含 Markdown 图片链接（\`![caption](url)\`）或网页链接（\`[标题](url)\`），请在回复中自然展现给用户。`;

    return new Agent({
        name: 'Dr. Elena - Admissions Advisor',
        instructions,
        model: defaultModel,
        tools: [searchCampusKnowledgeTool, webSearchTool, fetchWebPageTool, searchPersonalMemoryTool, saveUserPreferenceTool],
    });
};

/**
 * Execute Chat using OpenAI's new Responses API (with native Web Search tools & Multimodal Vision)
 */
export const executeResponsesApiChat = async ({ username, incomingMessages, attachments = [], userProfile, lastUserMsg }) => {
    const { defaultModel, aiApiKey, enableNativeSearch } = getAiConfig();
    if (!globalOpenAIClient || !aiApiKey) {
        throw new Error('No AI client initialized');
    }

    const customPrompt = process.env.CUSTOM_SYSTEM_PROMPT;
    let instructions = customPrompt && customPrompt.trim() ? customPrompt.trim() : ADMISSIONS_SYSTEM_PROMPT;
    if (userProfile) {
        instructions += `\n\n【当前咨询学生背景资料】：
- 姓名：${userProfile.name || username || '未填'}
- 性别：${userProfile.gender || '未填'}
- 高考省份：${userProfile.province || '未填'}
- 高考分数：${userProfile.score || '未填'} 分
- 全省排名：${userProfile.rank ? `第 ${userProfile.rank} 名` : '未填'}
- 选科情况：${userProfile.subjects || '未填'}
- 特殊情况说明：${userProfile.specialConditions || '无'}`;
    }

    // Pre-check RAG context if user query mentions campus facts
    const ragMatches = await searchRagEngine(lastUserMsg, 2);
    let ragContextText = '';
    if (ragMatches && ragMatches.length > 0) {
        ragContextText = `\n\n【校方知识库参考资料】：\n${formatRagContext(ragMatches)}`;
    }

    let enrichedUserMsg = lastUserMsg;
    if (Array.isArray(attachments) && attachments.length > 0) {
        attachments.forEach(att => {
            if (att.extractedText) {
                enrichedUserMsg += `\n\n【用户上传附件文档 (${att.name}) 提取正文内容】：\n${att.extractedText}`;
            } else if (att.type === 'image') {
                enrichedUserMsg += `\n\n【用户上传附件图片】：${att.name} (已成功接收，请结合图片内容与问题进行分析)`;
            } else {
                enrichedUserMsg += `\n\n【用户上传附件】：${att.name}`;
            }
        });
    }

    const messages = incomingMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
    }));

    if (messages.length === 0 && enrichedUserMsg) {
        messages.push({ role: 'user', content: enrichedUserMsg });
    } else if (messages.length > 0 && enrichedUserMsg !== lastUserMsg) {
        messages[messages.length - 1].content = enrichedUserMsg;
    }

    console.log(`⚡ [Responses API] Dispatching query to ${defaultModel} (Native search: ${enableNativeSearch ? 'Enabled' : 'Disabled'}, Attachments: ${attachments.length})...`);

    const startTime = Date.now();
    const tools = enableNativeSearch ? [{ type: "web_search_preview" }] : [];

    const response = await globalOpenAIClient.responses.create({
        model: defaultModel,
        instructions: instructions + ragContextText,
        input: messages,
        ...(tools.length > 0 ? { tools } : {})
    });

    let reply = '';
    if (response.output_text) {
        reply = response.output_text;
    } else if (Array.isArray(response.output)) {
        for (const outItem of response.output) {
            if (outItem.type === 'message' && Array.isArray(outItem.content)) {
                for (const c of outItem.content) {
                    if (c.type === 'text') reply += c.text;
                }
            }
        }
    }

    if (!reply && response.choices?.[0]?.message?.content) {
        reply = response.choices[0].message.content;
    }

    const latencyMs = Date.now() - startTime;
    const finalReply = reply || '抱歉，暂时未能生成回复，请重试。';

    const diagnostics = {
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        mode: 'admissions',
        targetAgent: {
            key: 'dr',
            name: 'Dr. Elena',
            title: '广州大学高招政策与志愿填报顾问',
            color: '#a494e8'
        },
        routingDecision: {
            type: '1对1高招专属顾问模式',
            details: '基于考生高考省份、位次与选科的精准志愿推演',
            confidence: 1.0
        },
        requestPayload: {
            model: defaultModel,
            protocol: 'responses',
            temperature: 0.7,
            max_tokens: 2048,
            stream: false,
            systemPrompt: instructions + ragContextText,
            messages: messages,
            tools: enableNativeSearch ? [{ name: 'web_search_preview', description: 'OpenAI 官方原生联网检索' }] : []
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
        userProfileContext: userProfile ? {
            username: userProfile.name || username || '未填',
            province: userProfile.province || '未填',
            score: userProfile.score || '未填',
            rank: userProfile.rank || '未填',
            subjects: userProfile.subjects || '未填',
            specialConditions: userProfile.specialConditions || '无'
        } : null,
        performance: {
            totalLatencyMs: latencyMs,
            estimatedPromptTokens: Math.round(((instructions + ragContextText).length + messages.reduce((acc, m) => acc + (m.content?.length || 0), 0)) / 3.5),
            estimatedCompletionTokens: Math.round(finalReply.length / 3.5),
            estimatedTotalTokens: Math.round(((instructions + ragContextText).length + messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) + finalReply.length) / 3.5)
        }
    };

    return {
        ok: true,
        reply: finalReply,
        source: 'openai-responses-native-search',
        protocol: 'responses',
        diagnostics
    };
};

/**
 * Execute Chat using standard Chat Completions + @openai/agents
 */
export const executeChatCompletionsAgent = async ({ username, incomingMessages, attachments = [], userProfile, lastUserMsg }) => {
    const startTime = Date.now();
    const agent = createAdmissionsAgent(userProfile, username);

    let enrichedUserMsg = lastUserMsg;
    if (Array.isArray(attachments) && attachments.length > 0) {
        attachments.forEach(att => {
            if (att.extractedText) {
                enrichedUserMsg += `\n\n【用户上传附件文档 (${att.name}) 提取正文内容】：\n${att.extractedText}`;
            } else if (att.type === 'image') {
                enrichedUserMsg += `\n\n【用户随附图片】：${att.name} (图片已保存，请针对用户关于此图的提问进行解答)`;
            } else {
                enrichedUserMsg += `\n\n【用户上传附件】：${att.name}`;
            }
        });
    }

    const inputItems = incomingMessages
        .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
        .map((m, idx, arr) => {
            if (m.role === 'assistant') return assistant(m.content);
            const content = (idx === arr.length - 1 && enrichedUserMsg !== lastUserMsg) ? enrichedUserMsg : m.content;
            return user(content);
        });

    if (inputItems.length === 0 && enrichedUserMsg) {
        inputItems.push(user(enrichedUserMsg));
    }

    console.log(`🤖 [Agent Run] Executing Admissions Agent for user: ${username || 'anonymous'} (Attachments: ${attachments.length})`);
    
    // Quick Pre-fetch RAG context for diagnostics logging
    const ragMatches = await searchRagEngine(lastUserMsg, 2);

    const runResult = await run(agent, inputItems);
    const reply = runResult.finalOutput || '我刚刚有点走神了，您可以再说一次吗？';
    const latencyMs = Date.now() - startTime;

    let calledRagTool = false;
    let calledWebSearch = false;
    let calledFetchWebPage = false;
    if (Array.isArray(runResult.newItems)) {
        calledRagTool = runResult.newItems.some(item => {
            const name = item.name || item.toolName || item.tool?.name || item.function?.name || item.rawItem?.name;
            return name === 'searchCampusKnowledge' || JSON.stringify(item).includes('searchCampusKnowledge');
        });
        calledWebSearch = runResult.newItems.some(item => {
            const name = item.name || item.toolName || item.tool?.name || item.function?.name || item.rawItem?.name;
            return name === 'webSearch' || JSON.stringify(item).includes('webSearch');
        });
        calledFetchWebPage = runResult.newItems.some(item => {
            const name = item.name || item.toolName || item.tool?.name || item.function?.name || item.rawItem?.name;
            return name === 'fetchWebPage' || JSON.stringify(item).includes('fetchWebPage');
        });
    }

    let source = 'openai-agents-direct';
    if (calledFetchWebPage) source = 'openai-agents-web-reader';
    else if (calledRagTool && calledWebSearch) source = 'openai-agents-rag-and-websearch';
    else if (calledRagTool) source = 'openai-agents-rag-tool';
    else if (calledWebSearch) source = 'openai-agents-websearch-tool';

    const { defaultModel } = getAiConfig();

    const diagnostics = {
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        mode: 'admissions',
        targetAgent: {
            key: 'dr',
            name: 'Dr. Elena',
            title: '广州大学高招政策与志愿填报顾问',
            color: '#a494e8'
        },
        routingDecision: {
            type: '1对1高招专属顾问模式',
            details: 'OpenAI Agents 工具路由驱动 (RAG + 联网搜索 + 偏好记忆沉淀)',
            confidence: 1.0
        },
        requestPayload: {
            model: defaultModel,
            protocol: 'chat_completions',
            temperature: 0.7,
            max_tokens: 2048,
            stream: false,
            systemPrompt: agent.instructions || ADMISSIONS_SYSTEM_PROMPT,
            messages: inputItems.map(item => ({
                role: item.role || 'user',
                content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content)
            })),
            tools: [
                { name: 'searchCampusKnowledge', description: '查询广州大学及校方权威事实数据库（RAG）' },
                { name: 'webSearch', description: '全网搜索全国高考政策、行业薪资与考研趋势' },
                { name: 'fetchWebPage', description: '深度抓取指定网页 URL 的完整文章正文与招生细则' },
                { name: 'searchPersonalMemory', description: '查询考生的专属历史咨询偏好档案' },
                { name: 'saveUserPreference', description: '自动沉淀考生的报考志愿意向到专属档案' }
            ]
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
        userProfileContext: userProfile ? {
            username: userProfile.name || username || '未填',
            province: userProfile.province || '未填',
            score: userProfile.score || '未填',
            rank: userProfile.rank || '未填',
            subjects: userProfile.subjects || '未填',
            specialConditions: userProfile.specialConditions || '无'
        } : null,
        performance: {
            totalLatencyMs: latencyMs,
            estimatedPromptTokens: Math.round(((agent.instructions || '').length + inputItems.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0)) / 3.5),
            estimatedCompletionTokens: Math.round(reply.length / 3.5),
            estimatedTotalTokens: Math.round(((agent.instructions || '').length + inputItems.reduce((acc, m) => acc + (typeof m.content === 'string' ? m.content.length : 0), 0) + reply.length) / 3.5)
        }
    };

    return {
        ok: true,
        reply,
        source,
        protocol: 'chat_completions',
        diagnostics
    };
};

/**
 * Unified Dispatcher: Dual Protocol Selector & Auto-Fallback
 */
export const dispatchAdmissionsChat = async ({ username, incomingMessages, attachments = [], userProfile, lastUserMsg }) => {
    const { effectiveProtocol } = getAiConfig();

    if (effectiveProtocol === 'responses') {
        try {
            return await executeResponsesApiChat({ username, incomingMessages, attachments, userProfile, lastUserMsg });
        } catch (err) {
            console.warn('⚠️ [Responses API Fallback] Endpoint error, falling back to chat_completions:', err.message);
            return await executeChatCompletionsAgent({ username, incomingMessages, attachments, userProfile, lastUserMsg });
        }
    } else {
        return await executeChatCompletionsAgent({ username, incomingMessages, attachments, userProfile, lastUserMsg });
    }
};
