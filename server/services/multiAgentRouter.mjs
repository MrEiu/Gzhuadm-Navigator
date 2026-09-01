import { globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { loadAgentsConfig } from '../config/agentsConfig.mjs';
import { searchAgentRag, formatRagContext } from './ragEngine.mjs';

/**
 * Classifies user message to choose the single most appropriate Agent
 */
export const classifyTargetAgent = (text = '', agentsConfig) => {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Explicit @ Mentions
    if (lower.includes('@宿管') || lower.includes('@张阿姨') || lower.includes('@阿姨')) {
        return 'dorm';
    }
    if (lower.includes('@李导') || lower.includes('@辅导员') || lower.includes('@导员')) {
        return 'counselor';
    }
    if (lower.includes('@浩哥') || lower.includes('@学长') || lower.includes('@师兄')) {
        return 'senior_boy';
    }
    if (lower.includes('@丽丽') || lower.includes('@学姐') || lower.includes('@师姐')) {
        return 'senior_girl';
    }
    if (lower.includes('@elena') || lower.includes('@dr') || lower.includes('@顾问') || lower.includes('@招生')) {
        return 'dr';
    }

    // 2. Keyword Rule-Based Routing
    // Dorm Auntie Keywords
    const dormKeywords = ['宿舍', '寝室', '吹风机', '电磁炉', '电饭煲', '热得快', '限电', '瓦数', '800w', '查寝', '门禁', '几点锁门', '报修', '水龙头', '洗衣机', '热水', '宿管', '违章电器', '公寓', '床铺', '四人间', '4人间', '六人间', '6人间'];
    if (dormKeywords.some(kw => lower.includes(kw))) {
        return 'dorm';
    }

    // Counselor Keywords
    const counselorKeywords = ['转专业', '转系', '转院', '绩点', 'gpa', '挂科', '处分', '通报', '请假', '休学', '复学', '退学', '综测', '综合测评', '加分', '入党', '党支部', '保研', '推免', '选调生', '违纪', '免试'];
    if (counselorKeywords.some(kw => lower.includes(kw))) {
        return 'counselor';
    }

    // Senior Boy (Life & Campus Hack) Keywords
    const boyKeywords = ['校园卡', '一卡通', 'nfc', '充值', '饭卡', '热水卡', '快递', '菜鸟', '顺丰', '京东派', '校园网', 'dr.com', 'wifi', '网络认证', '宽带', '选课', '抢课', '避坑', '水课', '通识课', '外卖', '自习室', '图书馆预约'];
    if (boyKeywords.some(kw => lower.includes(kw))) {
        return 'senior_boy';
    }

    // Senior Girl (Food & Attractions & Club) Keywords
    const girlKeywords = ['美食', '好吃的', 'gogo', '新天地', '贝岗', '南亭', '夜市', '小吃', '螺蛳粉', '烤猪蹄', '奶茶', '拍照', '打卡', '机位', '雕塑园', '中心湖', '落羽杉', '百团大战', '社团', '舞协', '校车', '地铁', '大学城南', '大学城北'];
    if (girlKeywords.some(kw => lower.includes(kw))) {
        return 'senior_girl';
    }

    // Admissions / Scores Keywords -> Dr. Elena
    const admissionsKeywords = ['分数线', '录取分', '投档', '排位', '位次', '多少分能上', '招生计划', '专业组', '学费多少', '专业代码', '高校对比'];
    if (admissionsKeywords.some(kw => lower.includes(kw))) {
        return 'dr';
    }

    // Default Fallback: If casually greeting or asking general campus vibe, pick Senior Girl or Senior Boy
    if (lower.includes('你好') || lower.includes('在吗') || lower.includes('大家') || lower.includes('新人')) {
        return 'senior_girl';
    }

    return 'senior_boy';
};

/**
 * Dispatches a Multi-Agent Group Chat message
 */
export const dispatchGroupChatMessage = async ({ username, incomingMessages, attachments = [], userProfile, lastUserMsg }) => {
    const agentsConfig = loadAgentsConfig();
    const { defaultModel, aiApiKey } = getAiConfig();

    const selectedAgentKey = classifyTargetAgent(lastUserMsg, agentsConfig);
    const agentInfo = agentsConfig[selectedAgentKey] || agentsConfig.dr;

    console.log(`👥 [Group Chat Router] Selected Agent: "${agentInfo.name}" (${selectedAgentKey}) for query: "${lastUserMsg.slice(0, 30)}"`);

    // 1. Retrieve Isolated RAG Knowledge for Selected Agent
    const ragMatches = await searchAgentRag(selectedAgentKey, lastUserMsg, 2);
    let ragContextText = '';
    if (ragMatches && ragMatches.length > 0) {
        ragContextText = `\n\n【${agentInfo.name} 的专属参考资料规章】：\n${formatRagContext(ragMatches)}`;
    }

    // 2. Prepare System Instructions
    let instructions = agentInfo.systemPrompt || '';
    if (userProfile) {
        instructions += `\n\n【提问学生信息】：姓名：${userProfile.name || username || '同学'}，省份：${userProfile.province || '未填'}，高考分：${userProfile.score || '未填'}`;
    }

    instructions += `\n\n【广大新生群聊互动规范】：
1. 你正在一个名为“广大2026级新生咨询大群”的群聊中，以【${agentInfo.name}（${agentInfo.title}）】的身份发言。
2. 保持你的独特身份特征与人设口吻，用亲切自然的口吻回答同学的问题。
3. **详略原则**：对于属于你专业领域的问题，给出详细且权威的步骤/规定/攻略；遇到属于其他群友（如 @宿管张阿姨、@李导、@浩哥、@丽丽学姐、@Dr. Elena）管辖的领域，简要说明并主动 @ 对应的群友作答，不要抢其他人的专业领域。
4. **自然语气**：可在回复中适度使用 Emoji 表情符号（如 😄, 👏, 🎉, 💯, ☕, 🌟, ✨）增强聊天亲切感。`;

    let enrichedLastMsg = lastUserMsg;
    if (Array.isArray(attachments) && attachments.length > 0) {
        attachments.forEach(att => {
            if (att.extractedText) {
                enrichedLastMsg += `\n\n【群友随附文档 (${att.name}) 内容】：\n${att.extractedText}`;
            } else if (att.type === 'image') {
                enrichedLastMsg += `\n\n【群友随附图片】：${att.name}`;
            }
        });
    }

    const messages = incomingMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ''
    }));

    if (messages.length === 0 && enrichedLastMsg) {
        messages.push({ role: 'user', content: enrichedLastMsg });
    } else if (messages.length > 0 && enrichedLastMsg !== lastUserMsg) {
        messages[messages.length - 1].content = enrichedLastMsg;
    }

    const startTime = Date.now();

    // If no remote API key, provide smart local response
    if (!globalOpenAIClient || !aiApiKey) {
        let reply = '';
        if (ragMatches && ragMatches.length > 0) {
            const top = ragMatches[0].item;
            reply = `同学你好呀！我是【${agentInfo.name}】✨\n\n根据校方规章指引：\n\n### 📌 ${top.title}\n${top.content}`;
        } else {
            reply = `同学你好呀！我是【${agentInfo.name}】✨\n\n关于你问的“${lastUserMsg}”，请随时向我咨询！在群里你还可以 @宿管张阿姨、@李导、@浩哥、@丽丽学姐 哦！ [sticker:gzu_cheer]`;
        }

        const latencyMs = Date.now() - startTime;
        const diagnostics = {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            mode: 'group',
            targetAgent: {
                key: selectedAgentKey,
                name: agentInfo.name,
                title: agentInfo.title,
                color: agentInfo.bubbleColor
            },
            routingDecision: {
                selectedKey: selectedAgentKey,
                selectedName: agentInfo.name,
                ruleType: '本地离线意图分发规则',
                matchedCategory: selectedAgentKey === 'dorm' ? '宿舍与违章电器' : selectedAgentKey === 'counselor' ? '转专业与推免规章' : selectedAgentKey === 'senior_boy' ? '校园卡与选课网络' : selectedAgentKey === 'senior_girl' ? '文旅打卡与美食社团' : '招生政策'
            },
            requestPayload: {
                model: 'local-bge-rag-mock',
                protocol: 'chat_completions',
                systemPrompt: instructions + ragContextText,
                messages: messages
            },
            ragRetrieval: {
                query: lastUserMsg,
                retrievedCount: ragMatches?.length || 0,
                matches: (ragMatches || []).map(m => ({
                    id: m.item?.id,
                    title: m.item?.title,
                    category: m.item?.category,
                    similarityScore: m.score ? Number(m.score.toFixed(4)) : 0.9,
                    hasTableData: Boolean(m.item?.tableData)
                }))
            },
            userProfileContext: userProfile ? {
                username: userProfile.name || username || '未填',
                province: userProfile.province || '未填',
                score: userProfile.score || '未填'
            } : null,
            performance: {
                totalLatencyMs: latencyMs,
                estimatedPromptTokens: Math.round(((instructions + ragContextText).length + messages.reduce((acc, m) => acc + (m.content?.length || 0), 0)) / 3.5),
                estimatedCompletionTokens: Math.round(reply.length / 3.5),
                estimatedTotalTokens: Math.round(((instructions + ragContextText).length + messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) + reply.length) / 3.5)
            }
        };

        return {
            ok: true,
            reply,
            agentKey: selectedAgentKey,
            agentName: agentInfo.name,
            agentTitle: agentInfo.title,
            agentAvatar: agentInfo.avatar,
            agentColor: agentInfo.bubbleColor,
            agentTextColor: agentInfo.bubbleTextColor,
            agentVoice: agentInfo.voice,
            source: 'multi-agent-local-mock',
            diagnostics
        };
    }

    // Call OpenAI API for the selected Agent
    try {
        const fullMessages = [
            { role: 'system', content: instructions + ragContextText },
            ...messages
        ];

        const completion = await globalOpenAIClient.chat.completions.create({
            model: defaultModel,
            messages: fullMessages,
            temperature: 0.7,
            max_tokens: 1200
        });

        const reply = completion.choices?.[0]?.message?.content || '我刚刚走神了，同学可以再说一次吗？';
        const latencyMs = Date.now() - startTime;

        const diagnostics = {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            mode: 'group',
            targetAgent: {
                key: selectedAgentKey,
                name: agentInfo.name,
                title: agentInfo.title,
                color: agentInfo.bubbleColor
            },
            routingDecision: {
                selectedKey: selectedAgentKey,
                selectedName: agentInfo.name,
                ruleType: '5-Agent 智能体意图识别与规则分发',
                matchedCategory: selectedAgentKey === 'dorm' ? '宿舍生活与违章电器管理' : selectedAgentKey === 'counselor' ? '学业规划、保研转专业与规章' : selectedAgentKey === 'senior_boy' ? '一卡通充值、选课抢课与网络' : selectedAgentKey === 'senior_girl' ? '大学城美食、拍照打卡与社团' : '招生政策与分数线'
            },
            requestPayload: {
                model: defaultModel,
                protocol: 'chat_completions',
                temperature: 0.7,
                max_tokens: 1200,
                systemPrompt: instructions + ragContextText,
                messages: fullMessages
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
                subjects: userProfile.subjects || '未填'
            } : null,
            performance: {
                totalLatencyMs: latencyMs,
                estimatedPromptTokens: completion.usage?.prompt_tokens || Math.round(((instructions + ragContextText).length + messages.reduce((acc, m) => acc + (m.content?.length || 0), 0)) / 3.5),
                estimatedCompletionTokens: completion.usage?.completion_tokens || Math.round(reply.length / 3.5),
                estimatedTotalTokens: completion.usage?.total_tokens || Math.round(((instructions + ragContextText).length + messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) + reply.length) / 3.5)
            }
        };

        return {
            ok: true,
            reply,
            agentKey: selectedAgentKey,
            agentName: agentInfo.name,
            agentTitle: agentInfo.title,
            agentAvatar: agentInfo.avatar,
            agentColor: agentInfo.bubbleColor,
            agentTextColor: agentInfo.bubbleTextColor,
            agentVoice: agentInfo.voice,
            source: `multi-agent-${selectedAgentKey}`,
            diagnostics
        };
    } catch (err) {
        console.error(`❌ [Multi-Agent Execution Error (${selectedAgentKey})]:`, err);
        return {
            ok: true,
            reply: `抱歉同学，【${agentInfo.name}】网络响应稍慢，请再次发送重试！`,
            agentKey: selectedAgentKey,
            agentName: agentInfo.name,
            agentAvatar: agentInfo.avatar,
            agentColor: agentInfo.bubbleColor,
            agentVoice: agentInfo.voice,
            source: 'multi-agent-fallback'
        };
    }
};
