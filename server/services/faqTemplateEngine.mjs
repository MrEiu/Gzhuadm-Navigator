import fs from 'fs';
import path from 'path';
import { dataDir, globalOpenAIClient, getAiConfig } from '../config/env.mjs';
import { getEmbedding, cosineSimilarity } from './embedding.mjs';

const faqTemplatesPath = path.join(dataDir, 'faq_templates.json');

// 3 Verified Core Seed FAQ Templates
const DEFAULT_FAQ_TEMPLATES = [
    {
        id: 'faq_transfer_major',
        standardQuestion: '大一进校后可以申请转专业吗？具体考核条件和通过率如何？',
        similarQueries: [
            '大一进校后可以转专业吗',
            '转专业有什么要求和条件',
            '转专业难不难',
            '转专业通过率是多少',
            '第一学期末怎么转专业',
            '大一换专业规则'
        ],
        category: '学业发展',
        tags: ['转专业', '大一', '转出无门槛', '专业组内转专业', '考核选拔'],
        answer: '广州大学转专业政策相对灵活，实行“转出相对宽松、转入有条件”的机制。第一、第二、第三学期末均存在相应的专业调整机会：第一学期末可申请专业组内转专业，第一学期课程加权成绩排名达到本专业前50%的学生可申请；第二学期末可申请学院内专业调整，非师范专业原则上不设转入限制；第三学期末还可参加全校公开转专业，通过公开选拔择优录取。学校未公布统一的全校转专业通过率，具体以当年学校及学院实施方案为准。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:36:00Z'
    },
    {
        id: 'faq_dorm_facilities',
        standardQuestion: '广州大学大学城校区宿舍是几人间？有独立卫浴和空调吗？用电功率限制是多少？',
        similarQueries: [
            '大学城宿舍是几人间',
            '宿舍有空调和独立卫浴吗',
            '宿舍是上床下桌吗',
            '宿舍限电多少瓦',
            '宿舍可以用大功率电器吗',
            '学生宿舍环境怎么样'
        ],
        category: '生活设施',
        tags: ['宿舍', '大学城校区', '四人间', '空调', '独立卫浴', '限电4000W'],
        answer: '广州大学大学城校区宿舍以4人间为主，近年来新建宿舍以4人间、2人间为主，新建4人间主要采用上床下桌布局。宿舍配备空调，但不同宿舍楼的卫浴条件存在差异，不能统一表述为全部独立卫浴，具体住宿楼栋和房型以学校当年实际安排为准。宿舍用电须遵守学校安全用电及宿舍管理规定，广州大学学生宿舍限电功率标准通常为4000W，严禁使用大功率违章电器。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:36:00Z'
    },
    {
        id: 'faq_postgraduate_recommendation',
        standardQuestion: '广州大学有推免保研资格吗？各专业保研率大概多少？考研去向如何？',
        similarQueries: [
            '广州大学可以保研吗',
            '保研去985容易吗',
            '各专业保研率是多少',
            '广大每年有多少推免名额',
            '考研升学前景怎么样',
            '保研综合评价怎么算'
        ],
        category: '升学深造',
        tags: ['保研推免', '考研', '升学深造', '推免名额', '综合评价'],
        answer: '广州大学具有教育部认可的推荐免试攻读硕士研究生资格。不同学院、专业的推免遴选条件和名额有所不同，不能简单用固定百分比概括。以2025年为例，广州大学研究生院公示拟录取推免生61人；部分学院要求前三学年成绩排名进入专业前15%或前30%等，同时结合科研、竞赛、志愿服务等进行综合评价。取得推免资格后，学生可以申请包括其他高校在内的研究生项目，但最终录取取决于目标院校的招生与复试考核情况。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:36:00Z'
    },
    {
        id: 'faq_teacher_education',
        standardQuestion: '广州大学师范类专业在广东认可度高吗？考公办编制教师优势大吗？',
        similarQueries: [
            '师范类专业在广东认可度高吗',
            '考公办编制教师优势大吗',
            '广大师范专业好就业吗',
            '英语师范就业前景',
            '广大师范考编制难不难',
            '公费定向师范生有编制吗'
        ],
        category: '就业前景',
        tags: ['师范类', '教师编制', '珠三角教育', '微格教学', '公费定向'],
        answer: '广州大学师范教育在广东具有较好的区域认可度，尤其在广州及珠三角基础教育领域有较深的培养和就业基础。学校设有多个师范专业，并建设教师教育综合技能训练平台，师范生可接受微格教学、试教试讲、教育实习等实践训练，部分师范专业在全国师范生教学技能竞赛中也取得较好成绩。学校近年来持续与广州、佛山等地教育部门和中小学开展师范生培养、就业合作。需要注意的是，普通师范生毕业后并非直接获得教师编制，能否进入公办学校主要取决于当地招聘政策、教师资格证、专业匹配以及笔试面试等条件；公费定向师范生则属于特殊培养类型，按协议享受相应的就业安排。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:39:00Z'
    },
    {
        id: 'faq_minor_micro_degree',
        standardQuestion: '本科期间可以跨学科辅修双学士学位或微专业吗？报名门槛和证书是什么？',
        similarQueries: [
            '本科期间可以跨学科辅修双学士学位或微专业吗',
            '大学可以辅修第二专业吗',
            '微专业和辅修专业有什么区别',
            '辅修学士学位发单独证书吗',
            '申请微专业绩点要求多少',
            '微专业要修多少学分'
        ],
        category: '学业发展',
        tags: ['微专业', '辅修专业', '辅修学士学位', '跨学科', '学分绩点'],
        answer: '可以。广州大学支持本科生修读微专业、辅修专业及符合条件的辅修学士学位，鼓励跨学科培养复合型人才。以2025年为例，学校开设16个微专业和2个辅修专业。申请微专业或辅修专业通常要求已修课程平均学分绩点达到2.5及以上且无处分记录，部分项目还会组织面试、择优录取。微专业属于非学历教育，完成规定课程后获得微专业证书，不授予学士学位；辅修专业完成相应要求可获得辅修专业证书，符合辅修学士学位条件的，还可获得辅修学士学位，该学位在主修学士学位证书中注明，不单独颁发学位证书。学生在校期间原则上可申请一个微专业或一个辅修专业。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:39:00Z'
    },
    {
        id: 'faq_tuition_aid',
        standardQuestion: '广州大学普通本科学费和住宿费一年是多少？家庭经济困难如何申请资助？',
        similarQueries: [
            '普通本科学费和住宿费一年是多少',
            '家庭经济困难怎么办',
            '大学城宿舍住宿费一年多少',
            '绿色通道怎么办理',
            '学费交不起可以缓交吗',
            '学校有助学贷款和勤工助学吗'
        ],
        category: '学费资助',
        tags: ['学费标准', '住宿费', '绿色通道', '助学贷款', '勤工助学'],
        answer: '广州大学本科收费按专业类别和学校当年公布的收费标准执行，住宿费则根据宿舍类型确定，大学城校区公开收费标准中2—4人间学生公寓为1700元/生·学年，6人以上宿舍为1000元/生·学年。家庭经济困难新生不用因为暂时筹不齐学费、住宿费而无法报到，学校设有“绿色通道”，可先办理入学手续，入校后再进行家庭经济困难认定并匹配相应资助。学校目前形成了奖学金、国家助学金、助学贷款、勤工助学、临时困难补助等多元资助体系，新生还可通过生源地信用助学贷款解决学费、住宿费压力。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:39:00Z'
    },
    {
        id: 'faq_campus_division_transit',
        standardQuestion: '大学城主校区、桂花岗校区和黄埔校区怎么划分？附近有地铁吗？',
        similarQueries: [
            '大学城主校区和桂花岗校区怎么划分',
            '学校附近有地铁吗',
            '桂花岗校区怎么坐车',
            '哪些学院在桂花岗校区',
            '黄埔校区有哪些学院',
            '大一在桂花岗大二回大学城吗'
        ],
        category: '生活设施',
        tags: ['大学城校区', '桂花岗校区', '黄埔校区', '地铁4号线', '大学城南站'],
        answer: '广州大学本科教学主要涉及大学城、桂花岗和黄埔等校区。大学城校区是学校主要本科教学和生活区域，地铁4号线、7号线、12号线均可到达大学城南站，再换乘公交前往校园；前往琶洲、天河等广州主要区域较为方便。桂花岗校区位于越秀区，可通过地铁2号线越秀公园站再换乘公交抵达。需要注意的是，部分学院本科一年级在桂花岗校区就读，之后返回大学城校区；人工智能学院、网络与空间安全学院则在黄埔校区就读，具体校区安排以当年招生政策为准。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:39:00Z'
    },
    {
        id: 'faq_canteen_commercial',
        standardQuestion: '校内食堂伙食怎么样？外卖能送进校园吗？周边有什么商圈？',
        similarQueries: [
            '校内食堂怎么样',
            '外卖能送到宿舍吗',
            '周边有什么商圈',
            '大学城校区有几个饭堂',
            '兰苑菊苑有什么特色菜',
            '学校商业中心买东西方便吗'
        ],
        category: '生活设施',
        tags: ['食堂', '梅苑', '兰苑', '菊苑', '竹苑', '商业中心', '外卖'],
        answer: '广州大学大学城校区拥有梅苑、兰苑、菊苑、竹苑等多个学生食堂，各食堂窗口风味丰富，包含特色烧腊、面食点心、大众快餐及清真风味等，能够满足各地学子的多样化餐饮口味需求。校园内设有商业中心，能够满足日常百货、文印、休闲生活需求，大学城周边商业配套也较为成熟。关于外卖配送，校内及大学城周边餐饮选择较多，外卖配送具体送达点以学校当期校园管理规定和骑手实际配送范围为准。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:39:00Z'
    },
    {
        id: 'faq_freshmen_registration',
        standardQuestion: '新生开学报到需要携带哪些必备材料？团组织关系和户口怎么办理？',
        similarQueries: [
            '新生开学需要带什么',
            '团关系和户口怎么办',
            '高中纸质档案能自己拆开吗',
            '开学必须带录取通知书原件吗',
            '户口必须迁到广州大学吗',
            '团员智慧团建怎么转接'
        ],
        category: '迎新指南',
        tags: ['新生报到', '录取通知书', '纸质档案', '户口迁移', '智慧团建'],
        answer: '新生报到须携带广州大学本科《录取通知书》原件及本人有效身份证件。高中阶段纸质档案务必保持密封完好（由原毕业中学密封并加盖骑缝章，严禁私自拆封，如破损应回原单位重新封签）。团员新生需按照学校及各学院通知办理团组织关系转接，通常通过“智慧团建”系统完成线上转接，并随身携带纸质团员档案与团员证。关于户口迁移，学校实行自愿原则，新生可根据个人及家庭实际情况自主选择是否将户口迁入学校集体户，并非强制要求迁移。',
        imageAttachments: [],
        hitCount: 0,
        updatedAt: '2026-09-02T23:39:00Z'
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
