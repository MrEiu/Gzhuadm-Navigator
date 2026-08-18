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
            text += `\n`;
        });
        return text;
    },
});

export const createAdmissionsAgent = (userProfile, username) => {
    const { defaultModel } = getAiConfig();
    let instructions = ADMISSIONS_SYSTEM_PROMPT;
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
${userProfile.isVip || (typeof userProfile.score === 'number' && userProfile.score > 580) ? '✨ 该学生为 VIP 优先保障咨询用户 (高考成绩 > 580分)，请针对其高考位次及个性化喜好提供定制化报考方案！' : ''}`;
    }

    instructions += `\n\n【智能体自主决策与工具调用指引】：
1. **按需 RAG 检索（校内事实与校方数据）**：
   - 遇到询问广州大学具体省份录取分数线、排位比对、特定专业详情、宿舍环境配置与实景图片、学费标准与奖助学金政策等具体事实时，**必须主动调用 searchCampusKnowledge 工具**查询校方真实数据，严禁凭空编造事实或数据。
2. **按需联网搜索（全网资讯与宏观动态）**：
   - 遇到询问全国性高考政策新规、其他高校对比、各行业最新中位数薪资与考研就业趋势等外部资讯时，**调用 webSearch 工具**获取互联网实时数据并在回复中引用来源。
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
        tools: [searchCampusKnowledgeTool, webSearchTool, searchPersonalMemoryTool, saveUserPreferenceTool],
    });
};
