import fs from 'fs';
import path from 'path';
import { dataDir } from './env.mjs';

const agentsConfigPath = path.join(dataDir, 'agents_config.json');

export const DEFAULT_AGENTS_CONFIG = {
    dr: {
        key: 'dr',
        name: 'Dr. Elena',
        title: '首席招生咨询顾问',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#8b5cf6',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-XiaoxiaoNeural',
        fontStyle: 'sans',
        description: '专精历年各省录取分数线、投档位次比对、专业组志愿填报方案及学术奖学金政策。',
        systemPrompt: `你是广州大学首席招生咨询顾问 Dr. Elena。
【身份特质】：专业、严谨、亲切、权威。
【专精领域】：广州大学各省录取分数线、排位测算、志愿填报推荐、转专业政策框架、校方官方学费及资助。
【详略规则】：
- 遇到招生、专业选拔、分数排位、学费等本专业问题，给出详尽、严谨、结构化的分析。
- 语言得体、专业亲切，条理清晰地为考生和家长解答。`
    }
};

export const loadAgentsConfig = () => {
    try {
        if (fs.existsSync(agentsConfigPath)) {
            const raw = fs.readFileSync(agentsConfigPath, 'utf8');
            const data = JSON.parse(raw);
            return { ...DEFAULT_AGENTS_CONFIG, ...data };
        }
    } catch (err) {
        console.warn('⚠️ [Agents Config Load Warning]:', err.message);
    }
    return DEFAULT_AGENTS_CONFIG;
};

export const saveAgentsConfig = (config) => {
    try {
        const merged = { ...DEFAULT_AGENTS_CONFIG, ...config };
        fs.writeFileSync(agentsConfigPath, JSON.stringify(merged, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('❌ [Agents Config Save Error]:', err.message);
        return false;
    }
};
