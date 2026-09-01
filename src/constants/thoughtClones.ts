export interface ThoughtCloneMeta {
    id: string;
    name: string;
    tag: string;
    icon: string;
    color: string;
    borderColor: string;
    bgColor: string;
    description: string;
    defaultKeywords: string[];
    defaultPrompt: string;
}

export const THOUGHT_CLONES_CATALOG: ThoughtCloneMeta[] = [
    {
        id: 'score_risk',
        name: '录取位次与风控审查员',
        tag: '📊 录取风控',
        icon: 'BarChart3',
        color: '#8b5cf6',
        borderColor: 'border-purple-200',
        bgColor: 'bg-purple-50 text-purple-700',
        description: '精准测算冲/稳/保录取概率与位次波动，严防压线滑档风险',
        defaultKeywords: ['分', '分数', '录取', '排位', '位次', '多少分', '冲', '稳', '保', '能上吗', '压线', '投档', '差距', '几率', '把握', '高分', '低分', '滑档'],
        defaultPrompt: '你是专注【录取位次与风控】的审视内核。请基于考生省份、分数、排位与目标专业，精准评估“冲/稳/保”区间与压线滑档风险。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'subject_rule',
        name: '选科限制与招考政策法务',
        tag: '📜 选科政策',
        icon: 'ShieldAlert',
        color: '#ef4444',
        borderColor: 'border-rose-200',
        bgColor: 'bg-rose-50 text-rose-700',
        description: '严格核验选科门槛、体检视力限制、专项计划及加分政策',
        defaultKeywords: ['选科', '物化', '历史', '物理', '化学', '生物', '地理', '政治', '限制', '必选', '视力', '体检', '色弱', '色盲', '加分', '专项计划', '提前批', '专业组'],
        defaultPrompt: '你是专注【选科与招考限制】的审视内核。请基于考生选科组合与身体/政策条件，严格排查专业组准入限制与潜在门槛阻碍。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'career_market',
        name: '企业就业与行业薪资分析师',
        tag: '💼 就业前景',
        icon: 'Briefcase',
        color: '#0284c7',
        borderColor: 'border-sky-200',
        bgColor: 'bg-sky-50 text-sky-700',
        description: '研判大湾区及全国校招需求、起薪待遇与行业发展天花板',
        defaultKeywords: ['就业', '工作', '薪资', '薪酬', '待遇', '工资', '好找工作吗', '大厂', '互联网', '行业', '企事业', '招聘', '校招', '前景', '去向'],
        defaultPrompt: '你是专注【企业就业与行业薪酬】的审视内核。请基于目标专业，分析大湾区及全国企事业单位校招需求、起薪水平与长远职业发展空间。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'civil_service',
        name: '考公考编与体制内发展专员',
        tag: '🏛️ 体制考公',
        icon: 'Building2',
        color: '#2563eb',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50 text-blue-700',
        description: '剖析国考省考岗位供给、选调生招录与体制内专业目录匹配',
        defaultKeywords: ['考公', '公务员', '考编', '事业单位', '编制', '国考', '省考', '选调', '选调生', '铁饭碗', '街道办', '税务局', '体制内', '公职'],
        defaultPrompt: '你是专注【体制内考公考编】的审视内核。请深入分析目标专业在国考、省考及事业单位招录中的岗位供给量、专业目录匹配度与竞争优劣势。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'postgrad_study',
        name: '考研保研与学术深造导师',
        tag: '🎓 升学深造',
        icon: 'GraduationCap',
        color: '#4f46e5',
        borderColor: 'border-indigo-200',
        bgColor: 'bg-indigo-50 text-indigo-700',
        description: '评估保研推免比例、对口硕士点学科评估与双一流深造路径',
        defaultKeywords: ['考研', '保研', '读研', '升学', '硕士', '博士', '推免', '985', '211', '双一流', '学科评估', '实验室', '深造', '研究生'],
        defaultPrompt: '你是专注【考研保研与升学深造】的审视内核。请基于目标专业的学科实力，分析本科保研名额比例、考研对口学科优势及深造双一流高校前景。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'curriculum_study',
        name: '课程难度与学业体验学长',
        tag: '📚 课业难度',
        icon: 'BookOpen',
        color: '#d97706',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50 text-amber-700',
        description: '揭秘核心课程硬核难度、实验实训压力与挂科避坑指南',
        defaultKeywords: ['难学', '难吗', '累吗', '高数', '编程', '代码', '数学', '挂科', '课程', '实验', '实训', '吃力', '学不会', '学分', '绩点'],
        defaultPrompt: '你是专注【课程体验与学习难度】的审视内核。请分析目标专业核心必修课难度（高数/代码/理论）、学业压力负担及挂科避坑要点。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'transfer_policy',
        name: '转专业与备选退路军师',
        tag: '🔄 备选退路',
        icon: 'Shuffle',
        color: '#059669',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50 text-emerald-700',
        description: '规划降分曲线救国策略、大一转专业考核门槛与辅修双学位',
        defaultKeywords: ['转专业', '调剂', '冷门', '备选', '退路', '替代', '辅修', '双学位', '换专业', '不喜欢', '降分', '不合适'],
        defaultPrompt: '你是专注【博弈填报与转专业退路】的审视内核。请评估降分录取的备选专业组性价比，以及大一转专业、辅修双学位的可行退路。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'campus_life',
        name: '生活设施与硬件住宿向导',
        tag: '🏕️ 校园生活',
        icon: 'Home',
        color: '#db2777',
        borderColor: 'border-pink-200',
        bgColor: 'bg-pink-50 text-pink-700',
        description: '介绍校区分布、宿舍空调独卫、食堂美食与周边生活配套',
        defaultKeywords: ['宿舍', '寝室', '空调', '独卫', '几人间', '上床下桌', '洗衣机', '热水', '饭堂', '食堂', '外卖', '校区', '地铁', '大学城', '桂花岗', '环境', '交通'],
        defaultPrompt: '你是专注【校园生活与设施环境】的审视内核。请针对目标专业所在校区分布、宿舍条件（空调/独卫/几人间）及食堂交通给出真实中肯的研判。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'finance_aid',
        name: '学费开销与资助政策顾问',
        tag: '💰 学费资助',
        icon: 'Coins',
        color: '#ca8a04',
        borderColor: 'border-yellow-200',
        bgColor: 'bg-yellow-50 text-yellow-700',
        description: '核算常规/中外合作学费、住宿杂费与奖助贷勤免绿色通道',
        defaultKeywords: ['学费', '费用', '住宿费', '多少钱', '一年多少', '中外合作', '贵', '奖学金', '助学金', '贷款', '贫困', '资助', '开销'],
        defaultPrompt: '你是专注【学费开销与资助保障】的审视内核。请明确常规专业与中外合作高收费差异、住宿费明细及“奖助贷勤补”绿色通道支持力度。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    },
    {
        id: 'psych_family',
        name: '志愿焦虑与家庭诉求调解员',
        tag: '🤝 家庭沟通',
        icon: 'HeartHandshake',
        color: '#0d9488',
        borderColor: 'border-teal-200',
        bgColor: 'bg-teal-50 text-teal-700',
        description: '平衡个人志向与父母期望冲突，化解填报焦虑与地域取舍',
        defaultKeywords: ['父母', '家里', '爸妈', '意见', '冲突', '纠结', '焦虑', '压力', '喜欢', '兴趣', '离家', '城市', '广州', '留省内', '出省'],
        defaultPrompt: '你是专注【志愿抉择与家庭平衡】的审视内核。请针对考生个人兴趣与家庭诉求的冲突点、城市地域价值及填报焦虑给出理性平衡研判。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。'
    }
];

// 知识库分库筛选选项
export const RAG_DOMAIN_OPTIONS = [
    { key: 'all', label: '🌐 全部知识库', desc: '全库统一召回' },
    { key: 'score_risk', label: '📊 录取分与位次 (score_risk)', desc: '历年投档分/位次/冲稳保' },
    { key: 'subject_rule', label: '📜 选科与招考政策 (subject_rule)', desc: '选考科目/体检/专项计划' },
    { key: 'career_market', label: '💼 就业与行业薪酬 (career_market)', desc: '大厂校招/薪资/就业报告' },
    { key: 'civil_service', label: '🏛️ 考公考编体制内 (civil_service)', desc: '公务员/事业编/选调生' },
    { key: 'postgrad_study', label: '🎓 考研保研深造 (postgrad_study)', desc: '推免保研/硕士点/985深造' },
    { key: 'curriculum_study', label: '📚 课业难度体验 (curriculum_study)', desc: '课程设置/难度/实训挂科' },
    { key: 'transfer_policy', label: '🔄 转专业与退路 (transfer_policy)', desc: '转专业细则/GPA/辅修双学位' },
    { key: 'campus_life', label: '🏕️ 校园生活设施 (campus_life)', desc: '校区/宿舍/食堂/空调门禁' },
    { key: 'finance_aid', label: '💰 学费与资助政策 (finance_aid)', desc: '专业学费/中外合作/奖助贷' },
    { key: 'psych_family', label: '🤝 志愿与家庭诉求 (psych_family)', desc: '父母沟通/兴趣平衡/地域抉择' },
    { key: 'lili_guide', label: '🌸 校园地图伴游导览 (lili_guide)', desc: '大学城全景点位/手绘地图/丽丽伴游' },
];
