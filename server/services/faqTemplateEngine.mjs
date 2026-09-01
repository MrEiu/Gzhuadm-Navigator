import fs from 'fs';
import path from 'path';
import { dataDir, globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { getEmbedding, cosineSimilarity } from './embedding.mjs';

const faqTemplatesPath = path.join(dataDir, 'faq_templates.json');

// 6 Default Seed Templates
const DEFAULT_FAQ_TEMPLATES = [
    {
        id: 'faq_dorm_facilities',
        standardQuestion: '广州大学大学城校区宿舍条件怎么样？是几人间？有空调和独立卫浴吗？',
        similarQueries: [
            '大学城宿舍是上床下桌吗',
            '宿舍有空调吗',
            '宿舍有独立卫生间吗',
            '宿舍几人间',
            '宿舍提供热水和洗衣机吗',
            '宿舍用电限制多少瓦',
            '宿舍环境好不好',
            '宿舍住宿条件'
        ],
        category: '生活设施',
        tags: ['宿舍', '空调', '四人间', '大学城', '独立卫浴'],
        answer: '广州大学大学城校区学生宿舍为**标准 4 人间**（配备上床下桌、独立衣柜与书架）。\n\n### 🏢 宿舍核心配置：\n* **生活家电**：每间宿舍均配备**品牌冷暖空调**、**独立卫浴**与**24小时热水淋浴系统**；\n* **公共设施**：每栋宿舍楼均配备公共洗衣房（支持扫码洗衣/烘干）与开水器；\n* **网络宽带**：千兆校园网 + 5G 信号全覆盖；\n* **用电规范**：宿舍限额功率 800W，严禁使用大功率违章电器，电费可在微信企业号/校园卡一键充值。',
        imageAttachments: [],
        hitCount: 128,
        updatedAt: '2026-08-20T10:00:00Z'
    },
    {
        id: 'faq_tuition_fee',
        standardQuestion: '广州大学本科学费和住宿费收费标准是多少？',
        similarQueries: [
            '一年学费多少钱',
            '大学学费贵不贵',
            '住宿费一年多少',
            '学费怎么交',
            '艺术类专业学费多少',
            '中外合作学费多少',
            '普通专业一年收费'
        ],
        category: '学费资助',
        tags: ['学费', '收费标准', '住宿费', '中外合作'],
        answer: '广州大学严格执行广东省公办高校收费标准：\n\n### 💰 2024~2026年学费标准明细：\n1. **文史类专业**：约 **5,050 元/学年**；\n2. **理工、外语类专业**：约 **5,510 ~ 5,800 元/学年**；\n3. **艺术类专业**：约 **10,000 元/学年**；\n4. **中外联合培养/中外合作办学**：约 **28,000 ~ 45,000 元/学年**（详见招生简章）；\n5. **学生住宿费**：大学城校区四人间为 **1,500 ~ 1,700 元/生·学年**。',
        imageAttachments: [],
        hitCount: 96,
        updatedAt: '2026-08-20T10:00:00Z'
    },
    {
        id: 'faq_transfer_major',
        standardQuestion: '大一进校后可以转专业吗？转专业的条件和要求是什么？',
        similarQueries: [
            '大一怎么换专业',
            '转专业难不难',
            '转专业绩点要求多少',
            '调剂进冷门专业还能转吗',
            '转专业有几次机会',
            '转专业申请条件'
        ],
        category: '招生政策',
        tags: ['转专业', '大一', '跨学院', '绩点要求'],
        answer: '广州大学实行**“转出无门槛，转入有考核”**的极为人性化的转专业政策：\n\n### 🔄 转专业核心政策要点：\n1. **申请时间**：大一第一学期末及大一第二学期末均有申请机会；\n2. **免笔试直通**：大一第一学期学分绩点（GPA）位列本专业前 **20%** 的学生，可优先自主申请跨学院、跨专业转入；\n3. **考核要求**：各接收学院组织综合面试或专业基础测试；\n4. **限制条件**：艺术类与普通类之间不可互转，外语类保送生不可转入非外语类专业。',
        imageAttachments: [],
        hitCount: 142,
        updatedAt: '2026-08-20T10:00:00Z'
    },
    {
        id: 'faq_campus_metro',
        standardQuestion: '广州大学有几个校区？交通方便吗？附近有地铁站吗？',
        similarQueries: [
            '学校离地铁站近吗',
            '大学城校区在几号线',
            '桂花岗校区怎么去',
            '学校周围交通怎么样',
            '到广州南站多长时间',
            '大学城校区地址'
        ],
        category: '生活设施',
        tags: ['校区', '大学城', '桂花岗', '地铁4号线', '交通'],
        answer: '广州大学现有两大校区：**大学城校区（主校区）** 与 **桂花岗校区**：\n\n### 🚇 校区与地铁交通指引：\n* **大学城校区（主校区·番禺区大学城外环西路230号）**：\n  * 紧邻广州地铁 **4号线 / 7号线 大学城南站** 与 **大学城北站**；\n  * 校门口设有“广大生活区”与“广大正门”多路公交总站，15分钟可直达琶洲、珠江新城CBD；\n* **桂花岗校区（越秀区解放北路桂花岗东1号）**：\n  * 临近广州地铁 **2号线 越秀公园站 / 11号线（在建）**，紧邻广州火车站。',
        imageAttachments: [],
        hitCount: 75,
        updatedAt: '2026-08-20T10:00:00Z'
    },
    {
        id: 'faq_scholarship_green',
        standardQuestion: '学校有新生奖学金和国家助学贷款吗？家庭经济困难如何申请绿色通道？',
        similarQueries: [
            '贫困生怎么申请学费减免',
            '有助学贷款吗',
            '奖学金怎么评',
            '绿色通道怎么办理',
            '勤工助学岗位多吗',
            '国家助学金多少钱'
        ],
        category: '学费资助',
        tags: ['奖学金', '助学金', '绿色通道', '生源地贷款'],
        answer: '广州大学郑重承诺：**“决不让任何一名学生因家庭经济困难而辍学”**！\n\n### 🌟 资助与奖学金保障体系：\n1. **入学“绿色通道”**：家庭经济困难新生可通过“网上迎新系统”一键申请缓交学费与住宿费，先报到注册入学；\n2. **国家助学贷款**：全面支持生源地信用助学贷款，本专科生每人每年最高可贷 **16,000 元**（在校期间利息全部由财政贴息）；\n3. **奖助学金矩阵**：国家奖学金（8,000元）、国家励志奖学金（5,000元）、国家助学金（每年3,300~4,300元）及广州大学拔尖创新人才卓越奖学金。',
        imageAttachments: [],
        hitCount: 64,
        updatedAt: '2026-08-20T10:00:00Z'
    },
    {
        id: 'faq_registration_freshmen',
        standardQuestion: '新生报到需要带哪些材料？报到流程是怎样的？',
        similarQueries: [
            '大一开学要带什么',
            '录取通知书什么时候寄出',
            '报到要带团员档案吗',
            '新生什么时候开学',
            '迎新报到流程',
            '开学报到材料清单'
        ],
        category: '校园迎新',
        tags: ['新生报到', '录取通知书', '户口迁移', '团关系'],
        answer: '### 🎒 2026级新生报到材料准备清单：\n1. **核心证件**：广州大学本科《录取通知书》原件、本人身份证原件及复印件（正反面）、高考准考证；\n2. **党团与学籍档案**：高中纸质档案（密封加盖骑缝章，严禁私拆）、团员证及团组织关系介绍信（亦需在智慧团建系统转接）；\n3. **照片材料**：近期一寸/二寸白底免冠证件照各 8 张（备存电子版）；\n4. **网上迎新办理**：收到录取通知书后，可提前登录“广州大学迎新服务网”完成在线信息采集、宿舍床位预选与到校车次登记。',
        imageAttachments: [],
        hitCount: 52,
        updatedAt: '2026-08-20T10:00:00Z'
    }
];

// In-memory embeddings cache for templates
let faqEmbeddingsCache = new Map(); // id -> { standardVec, similarVecs: [] }

export const loadFaqTemplates = () => {
    if (!fs.existsSync(faqTemplatesPath)) {
        fs.writeFileSync(faqTemplatesPath, JSON.stringify(DEFAULT_FAQ_TEMPLATES, null, 2), 'utf8');
        return DEFAULT_FAQ_TEMPLATES;
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(faqTemplatesPath, 'utf8'));
        return Array.isArray(parsed) ? parsed : DEFAULT_FAQ_TEMPLATES;
    } catch {
        return DEFAULT_FAQ_TEMPLATES;
    }
};

export const saveFaqTemplates = (templates = []) => {
    fs.writeFileSync(faqTemplatesPath, JSON.stringify(templates, null, 2), 'utf8');
    // Invalidate cached vectors
    faqEmbeddingsCache.clear();
};

/**
 * Pre-cache vectors for all FAQ templates in background
 */
export const buildFaqEmbeddings = async () => {
    const templates = loadFaqTemplates();
    for (const t of templates) {
        if (!faqEmbeddingsCache.has(t.id)) {
            const standardVec = await getEmbedding(t.standardQuestion);
            const similarVecs = [];
            if (Array.isArray(t.similarQueries)) {
                for (const q of t.similarQueries) {
                    const v = await getEmbedding(q);
                    if (v) similarVecs.push(v);
                }
            }
            faqEmbeddingsCache.set(t.id, { standardVec, similarVecs });
        }
    }
};

/**
 * 2 阶段 FAQ 模板命中与意图二分类核验
 * 阶段 1: 向量余弦初筛 (>= 0.82)
 * 阶段 2: 极速 LLM 语义一致性判断 (输出 YES / NO)
 */
export const matchFaqTemplate = async (userQuery = '') => {
    const cleanQuery = String(userQuery || '').trim();
    if (!cleanQuery || cleanQuery.length < 2) return { matched: false };

    const queryVec = await getEmbedding(cleanQuery);
    if (!queryVec) return { matched: false };

    const templates = loadFaqTemplates();
    let bestMatch = null;
    let maxScore = -1;

    for (const item of templates) {
        let cached = faqEmbeddingsCache.get(item.id);
        if (!cached) {
            const standardVec = await getEmbedding(item.standardQuestion);
            const similarVecs = [];
            if (Array.isArray(item.similarQueries)) {
                for (const q of item.similarQueries) {
                    const v = await getEmbedding(q);
                    if (v) similarVecs.push(v);
                }
            }
            cached = { standardVec, similarVecs };
            faqEmbeddingsCache.set(item.id, cached);
        }

        // Test standard question similarity
        if (cached.standardVec) {
            const sim = cosineSimilarity(queryVec, cached.standardVec);
            if (sim > maxScore) {
                maxScore = sim;
                bestMatch = item;
            }
        }

        // Test similar queries similarity
        if (Array.isArray(cached.similarVecs)) {
            for (const sVec of cached.similarVecs) {
                const sim = cosineSimilarity(queryVec, sVec);
                if (sim > maxScore) {
                    maxScore = sim;
                    bestMatch = item;
                }
            }
        }
    }

    // 阶段 1 阈值检查：相似度必须达到 0.82 以上
    if (!bestMatch || maxScore < 0.82) {
        return { matched: false, topScore: maxScore, candidate: bestMatch?.standardQuestion };
    }

    // 阶段 2：极速 LLM 意图一致性核验 (仅需输出 YES 或 NO，耗时 ~80ms)
    if (!globalOpenAIClient) {
        // If offline, rely on high vector score
        if (maxScore >= 0.88) {
            incrementHitCount(bestMatch.id);
            return {
                matched: true,
                template: bestMatch,
                score: maxScore,
                verificationMode: 'vector-offline'
            };
        }
        return { matched: false };
    }

    const { fastModel, defaultModel } = getAiConfig();
    const modelToUse = fastModel || defaultModel || 'deepseek-chat';

    const verificationPrompt = `你是一个问答意图一致性判定器。请判断【用户提问】的核心诉求是否能被【标准问题与答案】完全涵盖并准确解答。
如果用户提问属于同义问法或核心就是咨询该事实，且没有特殊的个性化限定（如特定考生分数/特殊加分），请输出 YES；
如果用户提问有更复杂的附加诉求或概念偏差，请输出 NO。

【标准问题】：${bestMatch.standardQuestion}
【用户提问】：${cleanQuery}

请仅输出一个单词：YES 或 NO`;

    try {
        const verifyRes = await Promise.race([
            globalOpenAIClient.chat.completions.create({
                model: modelToUse,
                messages: [{ role: 'user', content: verificationPrompt }],
                temperature: 0.1,
                max_tokens: 10
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Verification Timeout')), 1500))
        ]);

        const decision = verifyRes?.choices?.[0]?.message?.content?.trim()?.toUpperCase() || '';
        const isYes = decision.includes('YES') || decision.includes('是');

        if (isYes) {
            incrementHitCount(bestMatch.id);
            return {
                matched: true,
                template: bestMatch,
                score: maxScore,
                verificationMode: 'llm-verified'
            };
        }

        return {
            matched: false,
            score: maxScore,
            rejectedByLlm: true,
            candidate: bestMatch.standardQuestion
        };
    } catch {
        // Fallback: If verification timed out but vector similarity is exceptionally high (>=0.89), accept match
        if (maxScore >= 0.89) {
            incrementHitCount(bestMatch.id);
            return {
                matched: true,
                template: bestMatch,
                score: maxScore,
                verificationMode: 'vector-high-confidence-fallback'
            };
        }
        return { matched: false };
    }
};

const incrementHitCount = (templateId) => {
    try {
        const templates = loadFaqTemplates();
        const item = templates.find(t => t.id === templateId);
        if (item) {
            item.hitCount = (item.hitCount || 0) + 1;
            item.updatedAt = new Date().toISOString();
            fs.writeFileSync(faqTemplatesPath, JSON.stringify(templates, null, 2), 'utf8');
        }
    } catch { }
};

/**
 * AI 智能扩写同义相似问法 (Admin 工具)
 */
export const expandSimilarQueriesWithAi = async (standardQuestion = '') => {
    if (!globalOpenAIClient || !standardQuestion) {
        return [
            `${standardQuestion} 相关情况`,
            `想了解一下 ${standardQuestion}`,
            `请问 ${standardQuestion} 怎么样`
        ];
    }

    const { defaultModel } = getAiConfig();
    const prompt = `你是高考招生问答优化专家。请根据以下【标准问题】，生成 6 条考生在咨询时常见的口语化同义提问变体（包含简写、口语化问法、痛点问法）。
【标准问题】：${standardQuestion}

【输出格式要求】：仅输出一个 JSON 字符串数组，例如 ["问法1", "问法2", "问法3", "问法4", "问法5", "问法6"]，严禁任何Markdown外框或多余解释。`;

    try {
        const res = await globalOpenAIClient.chat.completions.create({
            model: defaultModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 400
        });

        const raw = res?.choices?.[0]?.message?.content?.trim() || '[]';
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [
            `${standardQuestion} 怎么办理`,
            `请问 ${standardQuestion}`,
            `学校的 ${standardQuestion} 怎么样`
        ];
    }
};
