import { globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { loadAgentsConfig } from '../config/agentsConfig.mjs';
import { searchRagEngine, searchAgentRag, formatRagContext } from './ragEngine.mjs';
import { performWebSearch } from './webSearch.mjs';
import { loadThoughtClonesConfig, selectActiveRoleIds } from '../config/thoughtClonesRegistry.mjs';
import { matchFaqTemplate } from './faqTemplateEngine.mjs';

const withTimeout = (promise, ms = 2500, fallbackValue = null) => {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))
    ]);
};

/**
 * 运行单个思维分身 (Thought Clone Worker)
 * 结合专属隔离知识库进行极速审视研判，输出极短 (<=60字)，并发耗时 ~200-400ms
 */
export const runThoughtClone = async ({ roleId, userQuery, userProfile }) => {
    const clonesRegistry = loadThoughtClonesConfig();
    const config = clonesRegistry[roleId] || clonesRegistry.career_market;
    const { defaultModel, fastModel } = getAiConfig();
    const modelToUse = fastModel || defaultModel || 'deepseek-chat';

    if (!globalOpenAIClient) {
        return {
            roleId,
            name: config.name,
            tag: config.tag,
            thoughtText: `基于${config.name}视角：建议结合广州大学历年专业数据及考生省份位次进行理性审视。`
        };
    }

    // 专属领域 RAG 知识检索 (Domain-Isolated Retrieval)
    let domainRagContext = '';
    try {
        const domainMatches = await searchAgentRag(roleId, userQuery, 1);
        if (domainMatches && domainMatches.length > 0) {
            const first = domainMatches[0];
            domainRagContext = `\n【${config.name}专属知识库参考】：${first.title || ''} - ${(first.content || '').slice(0, 150)}`;
        }
    } catch (e) {
        // Fallback silently if RAG search encounters an issue
    }

    const profileText = userProfile ? `【考生画像】：省份${userProfile.province || '未填'}，高考分${userProfile.score || '未填'}分，排位${userProfile.rank ? `第${userProfile.rank}名` : '未填'}，选科${userProfile.subjects || '未填'}。` : '';

    const clonePrompt = `${config.systemPrompt}
${domainRagContext}
${profileText}

【用户提问】：${userQuery}

请直接输出 1~2 句话的核心硬核研判（字数必须 <= 60 字，严禁客套）：`;

    try {
        const response = await withTimeout(
            globalOpenAIClient.chat.completions.create({
                model: modelToUse,
                messages: [{ role: 'user', content: clonePrompt }],
                temperature: 0.3,
                max_tokens: 120
            }),
            2000,
            null
        );

        const thoughtText = response?.choices?.[0]?.message?.content?.trim() || '需结合校内录取线与个人诉求综合权衡。';
        return {
            roleId,
            name: config.name,
            tag: config.tag,
            thoughtText
        };
    } catch (err) {
        return {
            roleId,
            name: config.name,
            tag: config.tag,
            thoughtText: '需结合校方招生章程及位次梯队审慎评估。'
        };
    }
};

/**
 * 判断当前问题是否需要联网搜索
 */
const checkRequiresWebSearch = (text = '') => {
    const raw = text.toLowerCase();
    const webKeywords = ['全国', '教育部', '其他大学', '对比', '中山大学', '华南理工', '暨南大学', '外校', '考研国家线', '行业薪资', '最新政策', '新闻'];
    return webKeywords.some(kw => raw.includes(kw));
};

/**
 * 极速轻量模式 (Pure Fast Direct Mode)
 * 0. 优先检测 FAQ 黄金问题模板库 -> 命中直接秒级直出
 * 1. 未命中则走 本地 RAG + 考生画像，单核直出
 */
export const executeLightweightChat = async ({ username, userProfile, incomingMessages, attachments = [], lastUserMsg }) => {
    const startTime = Date.now();
    const { defaultModel } = getAiConfig();

    // 0. FAQ 黄金模板库 2 阶段命中核验 (向量初筛 + 极速 LLM 语义判断)
    const faqMatch = await matchFaqTemplate(lastUserMsg);
    if (faqMatch.matched && faqMatch.template) {
        const template = faqMatch.template;
        let directReply = template.answer;

        if (Array.isArray(template.imageAttachments) && template.imageAttachments.length > 0) {
            directReply += '\n\n' + template.imageAttachments.map(img => `![${img.name || '附图'}](${img.url})`).join('\n');
        }

        const latencyMs = Date.now() - startTime;
        console.log(`⚡ [FAQ Fast Match Hit] Standard QA: "${template.standardQuestion}" (${latencyMs}ms, Score: ${faqMatch.score?.toFixed(3)})`);

        const agents = loadAgentsConfig();
        const drConfig = agents.dr || {};

        return {
            ok: true,
            reply: directReply,
            mode: 'lightweight',
            agentKey: 'dr',
            agentName: drConfig.name || 'Dr. Elena',
            agentTitle: drConfig.title || '首席招生咨询顾问',
            agentAvatar: drConfig.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
            agentColor: drConfig.bubbleColor || '#8b5cf6',
            agentVoice: drConfig.voice || 'zh-CN-XiaoxiaoNeural',
            source: 'faq-template-direct',
            faqTemplate: {
                id: template.id,
                standardQuestion: template.standardQuestion,
                category: template.category,
                score: faqMatch.score
            },
            diagnostics: {
                requestId: `req_faq_${Date.now()}`,
                timestamp: new Date().toISOString(),
                mode: 'lightweight',
                targetAgent: { key: 'dr', name: 'Dr. Elena', title: '招生咨询顾问 (FAQ黄金直出)', color: '#f59e0b' },
                routingDecision: { type: 'FAQ 黄金模板直出', details: `命中标准问题: ${template.standardQuestion} (相似度: ${faqMatch.score?.toFixed(3)})` },
                requestPayload: {
                    model: 'FAQ-Golden-Cache',
                    protocol: 'direct_cache',
                    messages: [{ role: 'user', content: lastUserMsg }]
                },
                performance: {
                    totalLatencyMs: latencyMs,
                    estimatedTotalTokens: Math.round(directReply.length / 3)
                },
                ragRetrieval: {
                    query: lastUserMsg,
                    retrievedCount: 1,
                    matches: [{ id: template.id, title: template.standardQuestion, category: template.category, similarityScore: faqMatch.score }]
                },
                userProfileContext: userProfile ? { username: userProfile.name || username || '同学', score: userProfile.score, province: userProfile.province } : null,
                latencyMs,
                source: 'faq-golden-template-direct',
                matchedTemplate: template.standardQuestion,
                similarityScore: faqMatch.score,
                verificationMode: faqMatch.verificationMode,
                activeClones: []
            }
        };
    }

    // 1. 本地 RAG 事实检索 (Top 2，10ms)
    const ragMatches = await searchRagEngine(lastUserMsg, 2);
    let ragContext = '';
    if (ragMatches && ragMatches.length > 0) {
        ragContext = `\n\n【校方知识库权威参考】：\n${formatRagContext(ragMatches)}`;
    }

    const profileText = userProfile ? `\n\n【咨询考生画像】：姓名${userProfile.name || username || '同学'}，省份${userProfile.province || '未填'}，高考分${userProfile.score || '未填'}分，排位${userProfile.rank ? `第${userProfile.rank}名` : '未填'}，选科${userProfile.subjects || '未填'}。` : '';

    const systemPrompt = `你是广州大学智能招生咨询顾问 Dr. Elena。
请结合校方权威参考资料与考生画像，以亲切、权威、简洁自然的口吻回答考生的问题。
【要求】：直接给出事实结论或报考分析，语言亲切，排版清晰美观。${profileText}${ragContext}`;

    let enrichedLastMsg = lastUserMsg;
    if (Array.isArray(attachments) && attachments.length > 0) {
        attachments.forEach(att => {
            if (att.extractedText) enrichedLastMsg += `\n\n【用户附件正文】：\n${att.extractedText}`;
        });
    }

    const messages = incomingMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
    }));
    if (messages.length === 0) {
        messages.push({ role: 'user', content: enrichedLastMsg });
    } else if (enrichedLastMsg !== lastUserMsg) {
        messages[messages.length - 1].content = enrichedLastMsg;
    }

    let reply = '抱歉，暂时未能生成回复，请重试。';
    if (globalOpenAIClient) {
        const res = await globalOpenAIClient.chat.completions.create({
            model: defaultModel,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            temperature: 0.5,
            max_tokens: 1500
        });
        reply = res.choices?.[0]?.message?.content || reply;
    }

    const latencyMs = Date.now() - startTime;
    const agents = loadAgentsConfig();
    const drConfig = agents.dr || {};

    return {
        ok: true,
        reply,
        mode: 'lightweight',
        agentKey: 'dr',
        agentName: drConfig.name || 'Dr. Elena',
        agentTitle: drConfig.title || '首席招生咨询顾问',
        agentAvatar: drConfig.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
        agentColor: drConfig.bubbleColor || '#8b5cf6',
        agentVoice: drConfig.voice || 'zh-CN-XiaoxiaoNeural',
        source: 'lightweight-fast-rag',
        diagnostics: {
            requestId: `req_light_${Date.now()}`,
            timestamp: new Date().toISOString(),
            mode: 'lightweight',
            targetAgent: { key: 'dr', name: 'Dr. Elena', title: '招生咨询顾问 (极速轻量)', color: '#f59e0b' },
            routingDecision: { type: '极速轻量 RAG 直出', details: '检索校方数据库并单核直接解答' },
            requestPayload: {
                model: defaultModel || 'deepseek-chat',
                protocol: 'chat_completions',
                messages
            },
            performance: {
                totalLatencyMs: latencyMs,
                estimatedTotalTokens: Math.round((reply.length + lastUserMsg.length) / 3)
            },
            ragRetrieval: {
                query: lastUserMsg,
                retrievedCount: ragMatches?.length || 0,
                matches: (ragMatches || []).map(m => ({
                    id: m.item?.id,
                    title: m.item?.title,
                    category: m.item?.category,
                    similarityScore: m.score ? Number(m.score.toFixed(4)) : 0.85
                }))
            },
            userProfileContext: userProfile ? { username: userProfile.name || username || '同学', score: userProfile.score, province: userProfile.province } : null,
            latencyMs,
            ragRetrievedCount: ragMatches?.length || 0,
            activeClones: []
        }
    };
};

/**
 * 深度智能体模式 (Deep Agent Thought Pipeline)
 * 同层并发 (RAG + 1~3个思维分身 + 可选联网) -> Synthesizer 综合总装输出
 */
export const executeAgentThoughtPipeline = async ({ username, userProfile, incomingMessages, attachments = [], lastUserMsg }) => {
    const startTime = Date.now();
    const { defaultModel, enableNativeSearch } = getAiConfig();

    // 1. 动态挑选 1 ~ 3 个最匹配的思维分身角色 ID
    const activeRoleIds = selectActiveRoleIds(lastUserMsg, 3);

    // 2. 检查网络搜索配置 (.env 控制 + 意图需要)
    const isWebSearchConfigured = process.env.ENABLE_WEB_SEARCH === 'true' && process.env.SEARCH_PROVIDER !== 'none';
    const shouldRunWebSearch = isWebSearchConfigured && checkRequiresWebSearch(lastUserMsg);

    console.log(`🧠 [Thought Clones Pipeline] Active Roles: [${activeRoleIds.join(', ')}] | WebSearch: ${shouldRunWebSearch ? 'Active' : 'Skipped'}`);

    // 3. 【同层高并发执行】：FAQ 黄金标准问答 + 本地 RAG + 思维分身推演 + (可选) 联网搜索
    const [faqMatch, ragMatches, cloneThoughts, webResults] = await Promise.all([
        // 任务 A: FAQ 黄金标准模板快速判定
        matchFaqTemplate(lastUserMsg).catch(() => ({ matched: false })),

        // 任务 B: 本地 RAG 事实检索
        searchRagEngine(lastUserMsg, 3),

        // 任务 C: 并发运行选中的思维分身
        Promise.all(activeRoleIds.map(roleId => runThoughtClone({ roleId, userQuery: lastUserMsg, userProfile }))),

        // 任务 D: 联网搜索 (可选)
        shouldRunWebSearch ? withTimeout(performWebSearch(lastUserMsg, 3), 2500, []) : Promise.resolve(null)
    ]);

    // 4. 构建 Synthesizer 聚合提示词
    let faqContext = '';
    let faqImages = [];
    if (faqMatch && faqMatch.matched && faqMatch.template) {
        const t = faqMatch.template;
        faqContext = `\n【🌟 校方最高优先级核准标准问答 (FAQ Golden Standard)】：\n* 标准问题：${t.standardQuestion}\n* 官方核准权威标准解答：\n${t.answer}\n`;
        if (Array.isArray(t.imageAttachments) && t.imageAttachments.length > 0) {
            faqImages = t.imageAttachments;
        }
    }

    const ragContext = formatRagContext(ragMatches);
    const profileText = userProfile ? `\n【咨询考生画像】：姓名${userProfile.name || username || '同学'}，省份${userProfile.province || '未填'}，高考分${userProfile.score || '未填'}分，全省排位${userProfile.rank ? `第${userProfile.rank}名` : '未填'}，选科${userProfile.subjects || '未填'}。` : '';

    let clonesContext = '\n【后台专业思维分身独立研判成果】：\n';
    cloneThoughts.forEach(c => {
        clonesContext += `- **${c.name} (${c.tag})**：${c.thoughtText}\n`;
    });

    let webContext = '';
    if (webResults && Array.isArray(webResults) && webResults.length > 0) {
        webContext = `\n【互联网实时背景参考】：\n` + webResults.map((r, i) => `${i + 1}. [${r.title}] ${r.snippet}`).join('\n') + '\n';
    }

    const synthesizerSystemPrompt = `你是广州大学招生咨询首席顾问 Dr. Elena。
你掌握了校方权威数据资料，并汇集了后台专业思维分身从【风控、发展、退路、学业】等多维度的独立深度研判。

【🔥 核心准则 · 靶向锚定考生问题】：
1. **第一句话直击靶心，正面回答**：
   - 考生的核心提问是：【${lastUserMsg}】；
   - 你的第一句话必须直接、明确地给出核心结论或确切答案，绝不绕弯子、绝不答非所问；
2. **权威事实标准与分身观点融会贯通**：
   - 若提供了【🌟 校方最高优先级核准标准问答 (FAQ Golden Standard)】，其内容为校方逐字核准的最高事实基准，必须以其准确数据与规定为解答基石；
   - 思维分身的研判作为你回答该问题的“后台论据库”，严禁机械报菜名（不要写成“风控审查员说...就业分析师说...”）；
   - 必须以你 Dr. Elena 自己的权威亲切口吻，将权威数据与多维洞察融会贯通为一段连贯、扎实、令人信服的专业指导；
3. **自适应详略收敛**：
   - 若考生仅询问单一事实（如学费、宿舍几人间、上床下桌、校区分布）：直接基于权威数据给结论，干脆利落答完；
   - 若考生询问志愿推演、专业抉择或复合决策问题：自然融合多维视角，分层给出有前瞻性且可落地的建议；
4. **语言自然亲切、富有同理心**：
   - 彻底摆脱机械死板的 AI 腔调，像一位坐在考生对面、既懂全套招生政策又真心为考生前途着想的亲切长辈/资深学长；
   - 关键数据加粗，排版清晰美观，适度给予暖心鼓励。

${profileText}
${faqContext}
${ragContext ? `\n【校方权威参考资料 (RAG)】：\n${ragContext}` : ''}
${clonesContext}
${webContext}`;

    let enrichedLastMsg = lastUserMsg;
    if (Array.isArray(attachments) && attachments.length > 0) {
        attachments.forEach(att => {
            if (att.extractedText) enrichedLastMsg += `\n\n【用户附件正文】：\n${att.extractedText}`;
        });
    }

    const messages = incomingMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
    }));
    if (messages.length === 0) {
        messages.push({ role: 'user', content: enrichedLastMsg });
    } else if (enrichedLastMsg !== lastUserMsg) {
        messages[messages.length - 1].content = enrichedLastMsg;
    }

    let finalReply = '抱歉，我刚刚在整理思路，请您再试一次。';
    if (globalOpenAIClient) {
        const response = await globalOpenAIClient.chat.completions.create({
            model: defaultModel,
            messages: [{ role: 'system', content: synthesizerSystemPrompt }, ...messages],
            temperature: 0.65,
            max_tokens: 2048
        });
        finalReply = response.choices?.[0]?.message?.content || finalReply;
    }

    // 若命中了 FAQ 附带权威图片，且正文中尚未包含，则平滑自动追加
    if (faqImages && faqImages.length > 0) {
        const missingImgs = faqImages.filter(img => !finalReply.includes(img.url));
        if (missingImgs.length > 0) {
            finalReply += '\n\n' + missingImgs.map(img => `![${img.name || '参考图解'}](${img.url})`).join('\n');
        }
    }

    const totalLatencyMs = Date.now() - startTime;
    const agents = loadAgentsConfig();
    const drConfig = agents.dr || {};

    return {
        ok: true,
        reply: finalReply,
        mode: 'agent',
        agentKey: 'dr',
        agentName: drConfig.name || 'Dr. Elena',
        agentTitle: drConfig.title || '首席招生咨询顾问',
        agentAvatar: drConfig.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
        agentColor: drConfig.bubbleColor || '#8b5cf6',
        agentVoice: drConfig.voice || 'zh-CN-XiaoxiaoNeural',
        source: 'agent-thought-clones-pipeline',
        activeClones: cloneThoughts.map(c => ({ roleId: c.roleId, name: c.name, tag: c.tag, color: c.color })),
        diagnostics: {
            requestId: `req_agent_${Date.now()}`,
            timestamp: new Date().toISOString(),
            mode: 'agent',
            targetAgent: { key: 'dr', name: 'Dr. Elena', title: '招生首席顾问 (思维分身协同)', color: '#a494e8' },
            routingDecision: {
                type: '同层并发多思维分身推演',
                details: `调度分身: ${cloneThoughts.map(c => c.name).join(', ')}${faqMatch?.matched ? ' + 融入官方FAQ标准基准' : ''}`
            },
            requestPayload: {
                model: defaultModel || 'deepseek-chat',
                protocol: 'chat_completions',
                messages
            },
            performance: {
                totalLatencyMs,
                estimatedTotalTokens: Math.round((finalReply.length + lastUserMsg.length) / 3)
            },
            faqMatch: faqMatch?.matched && faqMatch?.template ? {
                id: faqMatch.template.id,
                standardQuestion: faqMatch.template.standardQuestion,
                score: faqMatch.score
            } : null,
            ragRetrieval: {
                query: lastUserMsg,
                retrievedCount: ragMatches?.length || 0,
                matches: (ragMatches || []).map(m => ({
                    id: m.item?.id,
                    title: m.item?.title,
                    category: m.item?.category,
                    similarityScore: m.score ? Number(m.score.toFixed(4)) : 0.88
                }))
            },
            userProfileContext: userProfile ? { username: userProfile.name || username || '同学', score: userProfile.score, province: userProfile.province } : null,
            totalLatencyMs,
            activeRoles: activeRoleIds,
            activeClones: cloneThoughts,
            ragRetrievedCount: ragMatches?.length || 0,
            webSearchRan: shouldRunWebSearch
        }
    };
};
