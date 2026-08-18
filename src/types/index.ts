// --- User & Auth Types ---
export interface User {
    username: string;
    role: 'user' | 'admin';
    phone?: string;
    email?: string;
    registeredAt?: string;
    profile?: UserProfile;
}

export interface UserProfile {
    name?: string; // 用户昵称 (Nickname)
    gender?: '男' | '女';
    avatar?: string; // 支持 Emoji / 本地上传路径 / 外部图片 URL
    phone?: string;
    email?: string;
    province?: string;
    score?: number | string;
    rank?: number | string;
    subjects?: string;
    specialConditions?: string;
    isVip?: boolean;
}

export interface AgentPersonaConfig {
    name: string;
    title: string;
    avatar: string;
}

export interface AgentConfigData {
    dr: AgentPersonaConfig;
    lili: AgentPersonaConfig;
    updatedAt?: string;
}

// --- Chat & Message Types ---
export interface ChatMessage {
    id: number | string;
    sender: 'user' | 'bot';
    text: string;
    instant?: boolean;
    createdAt?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

// --- Campus Map Location & Tour Guide Types ---
export interface CampusLocation {
    id: string;
    name: string;
    category: string;
    images: string[];
    description: string;
    terms?: string[];
    coordinates: { x: number; y: number };
    highlights?: string[];
    openingHours?: string;
    liliNarrative?: string;   // 学姐“丽丽”的专属伴游语音解说词
    liliTips?: string[];       // 学姐实测避坑与打卡秘籍
}

export interface CampusTourRoute {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    duration: string;
    description: string;
    locationIds: string[];
}

// --- RAG Knowledge Base Types ---
export interface ImageAttachment {
    url: string;
    name?: string;
    caption?: string;
}

export interface RagItem {
    id: string;
    title: string;
    category: string;
    type?: 'text' | 'table' | 'image';
    content: string;
    tableData?: {
        columns: string[];
        rows: string[][];
    };
    imageAttachments?: ImageAttachment[];
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface DocumentChunk {
    id: string;
    title: string;
    category?: string;
    type?: 'text' | 'table';
    content: string;
    tableData?: {
        columns: string[];
        rows: string[][];
    };
    imageAttachments?: ImageAttachment[];
    tags?: string[];
}

export interface PersonalRagItem {
    id?: string;
    title: string;
    category?: string;
    content: string;
    createdAt?: string;
}

// --- Admin Analytics & Settings Types ---
export interface WordAnalyticsDb {
    analyzedMessageIds: string[];
    wordCounts: { [key: string]: number };
    totalAnalyzedCount: number;
    lastAnalyzedAt: string | null;
}

export interface SettingsConfig {
    baseUrl: string;
    apiKey: string;
    defaultModel: string;
    fastModel: string;
    searchProvider: 'multi' | 'bing' | 'tavily' | 'bocha' | 'duckduckgo' | 'none';
    tavilyApiKey?: string;
    bochaApiKey?: string;
    advancedAuthEnabled?: boolean;
    authRegistrationMode?: 'email' | 'phone' | 'none' | 'username';
    systemPrompt?: string;
    tencentSmsSecretId?: string;
    smtpHost?: string;
    smtpUser?: string;
}

export interface ProvinceDistributionItem {
    province: string;
    count: number;
    percentage: number;
}

export interface PopularMajorItem {
    major: string;
    count: number;
}

export interface DashboardStats {
    totalUsers: number;
    vipUsers: number;
    todayQueriesCount: number;
    totalMessagesCount: number;
    provinceDistribution: ProvinceDistributionItem[];
    popularMajors: PopularMajorItem[];
    embeddingModel: string;
    aiGateway: {
        baseUrl: string;
        defaultModel: string;
        fastModel: string;
        provider: string;
    };
    searchEngine: {
        provider: string;
        tavilyActive?: boolean;
        bochaActive?: boolean;
        duckduckgoActive?: boolean;
    };
    systemHealth?: {
        postgres?: { status: string; latencyMs: number };
        redis?: { status: string; type: string };
        onnx?: { status: string; latencyMs: number };
        aiGateway?: { status: string; defaultModel: string };
    };
    categoryBreakdown?: { [key: string]: number };
    totalRagItems?: number;
}

export interface RagScoreBreakdown {
    totalScore: number;
    vectorScore: number;
    tokenScore: number;
    titleCategoryBonus?: number;
    provinceBonus: number;
    categoryBonus: number;
}

export interface RagSearchResult {
    item: RagItem;
    score: number;
    breakdown?: RagScoreBreakdown;
}

export interface QaRecord {
    id: string;
    sessionId: string;
    sessionTitle?: string;
    username: string;
    question: string;
    answer: string;
    createdAt: string;
}

export interface StrategyConfig {
    cutoffScore: number; // 压线风险拦截阈值 (e.g. 450)
    vipScore: number;    // VIP 专属定制通道阈值 (e.g. 580)
    enabled: boolean;    // 分流策略一键启用/暂停开关
}

export interface WebSearchResultItem {
    title: string;
    url: string;
    snippet: string;
    source?: string;
    score?: number;
    images?: { url: string; title?: string }[];
}

