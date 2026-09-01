export interface User {
    username: string;
    role: 'admin' | 'user' | 'guest';
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    profile?: UserProfile;
}

export interface UserProfile {
    name?: string;
    gender?: string;
    phone?: string;
    email?: string;
    province?: string;
    category?: 'physics' | 'history' | 'comprehensive' | 'art' | 'sports' | 'other';
    score?: number | string;
    rank?: number | string;
    targetMajor?: string;
    hobbies?: string;
    subjects?: string;
    specialConditions?: string;
    avatar?: string;
    notes?: string;
}

export interface RagItem {
    id: string | number;
    category: string;
    title: string;
    type?: 'text' | 'table';
    content: string;
    tableData?: any;
    imageAttachments?: Array<{ url: string; name?: string; caption?: string } | any>;
    targetAgent?: string; // 'all' | 'score_risk' | 'subject_rule' | 'career_market' | 'civil_service' | 'postgrad_study' | 'curriculum_study' | 'transfer_policy' | 'campus_life' | 'finance_aid' | 'psych_family' | 'lili_guide'
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface DocumentChunk {
    id: string;
    title: string;
    category: string;
    type?: 'text' | 'table';
    targetAgent?: string;
    content: string;
    tableData?: any;
    imageAttachments?: Array<{ url: string; name?: string; caption?: string } | any>;
    tags?: string[];
    saved?: boolean;
}

export type PersonalRagItem = PersonalRagMemory;

export interface CampusLocation {
    id: string;
    name: string;
    category: string;
    x?: number; // Percentage on map (0-100)
    y?: number; // Percentage on map (0-100)
    coordinates?: { x: number; y: number };
    description: string;
    images?: Array<string | { url: string; name?: string; caption?: string } | any>;
    terms?: string[];
    highlights?: string[];
    openingHours?: string;
    liliNarrative?: string;
    liliTips?: string[];
    tags?: string[];
}

export interface WebSearchSettings {
    enableBing: boolean;
    enableDuckDuckGo: boolean;
    enableAggregator: boolean;
    bingApiKey?: string;
    searchTopK: number;
    timeoutMs: number;
}

export interface PersonalRagMemory {
    id: string;
    category: 'academic' | 'preference' | 'inquiry' | 'activity';
    title: string;
    content: string;
    createdAt: string;
}

export interface ChatAttachment {
    name: string;
    type: 'image' | 'file';
    url: string;
    size?: number;
    mimeType?: string;
    extractedText?: string;
    base64?: string;
}

export type ChatMode = 'admissions' | 'group';

export type BubbleThemeId =
    | 'antdesign_filled'
    | 'antdesign_outlined'
    | 'antdesign_shadow'
    | 'antdesign_borderless'
    | 'chatscope_tail'
    | 'chatscope_notail'
    | 'wechat_classic'
    | 'assistant_linear'
    | 'assistant_card'
    | 'ios_liquid'
    | 'shadcn_minimal'
    | 'discord_card'
    | 'neoglass_glow'
    | 'chatscope'
    | 'antdesign'
    | 'assistant'
    | 'ios'
    | 'shadcn'
    | 'discord'
    | 'neoglass';

export type MarkdownStyleId = 
    | 'crystal' 
    | 'aurora_purple' 
    | 'claude_clean' 
    | 'ocean_cyan' 
    | 'emerald_academic' 
    | 'linear_geek' 
    | 'notion_doc' 
    | 'amber_warm';

export interface BubbleCustomSettings {
    themeId: BubbleThemeId;
    markdownStyle?: MarkdownStyleId;
    borderRadius: number; // 8 to 36
    padding: 'compact' | 'standard' | 'spacious';
    borderWidth: number; // 0, 1, 2, 3
    shadowDepth: 'none' | 'subtle' | 'medium' | 'glow';
    showTail: boolean;
    showActions: boolean;
    showThinkingBox: boolean;
    accentBarWidth: number; // 0, 2, 3.5, 5
}

export interface AgentProfile {
    key: string;
    name: string;
    title: string;
    avatar: string;
    bubbleColor: string;
    bubbleTextColor: string;
    voice: string;
    fontStyle?: string;
    description?: string;
    systemPrompt?: string;
    accentBarWidth?: number;
}

export interface ThoughtCloneConfig {
    roleId: string;
    name: string;
    tag: string;
    keywords: string[];
    systemPrompt: string;
    enabled?: boolean;
}

export interface ApiDiagnostics {
    requestId: string;
    timestamp: string;
    mode: 'admissions' | 'group';
    targetAgent?: {
        key: string;
        name: string;
        title: string;
        color?: string;
    };
    routingDecision?: {
        type?: string;
        details?: string;
        selectedKey?: string;
        selectedName?: string;
        ruleType?: string;
        matchedCategory?: string;
        confidence?: number;
    };
    requestPayload: {
        model: string;
        protocol: string;
        temperature?: number;
        max_tokens?: number;
        stream?: boolean;
        systemPrompt?: string;
        messages: Array<{
            role: string;
            content: string;
        }>;
        tools?: Array<{
            name: string;
            description: string;
        }>;
    };
    ragRetrieval?: {
        query: string;
        retrievedCount: number;
        matches: Array<{
            id?: string | number;
            title?: string;
            category?: string;
            similarityScore?: number;
            hasTableData?: boolean;
        }>;
    };
    userProfileContext?: {
        username?: string;
        province?: string;
        score?: number | string;
        rank?: number | string;
        subjects?: string;
        specialConditions?: string;
    } | null;
    performance: {
        totalLatencyMs: number;
        ragSearchLatencyMs?: number;
        estimatedPromptTokens?: number;
        estimatedCompletionTokens?: number;
        estimatedTotalTokens?: number;
    };
}

export type AdvisorMode = 'lightweight' | 'agent';

export interface ChatMessage {
    id: number | string;
    sender: 'user' | 'bot';
    text: string;
    attachments?: ChatAttachment[];
    senderAgentKey?: string;
    senderName?: string;
    senderTitle?: string;
    senderAvatar?: string;
    senderColor?: string;
    senderTextColor?: string;
    senderVoice?: string;
    instant?: boolean;
    createdAt?: string;
    source?: string;
    mode?: AdvisorMode;
    activeClones?: Array<{ roleId: string; name: string; tag: string }>;
    reasoningText?: string;
    diagnostics?: ApiDiagnostics;
}

export interface ChatSession {
    id: string;
    title: string;
    mode?: ChatMode;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt?: string;
}

export type MultiAgentRoster = Record<string, AgentProfile>;

export interface DashboardStats {
    totalUsers?: number;
    vipUsers?: number;
    totalRagItems?: number;
    todayQueriesCount?: number;
    totalMessagesCount?: number;
    provinceDistribution?: Array<{ province: string; count: number; percentage: number }>;
    popularMajors?: Array<{ major: string; count: number }>;
    aiGateway?: {
        defaultModel?: string;
        fastModel?: string;
        provider?: string;
    };
    systemHealth?: {
        postgres?: { status?: string; latencyMs?: number };
        redis?: { status?: string; type?: string };
        onnx?: { status?: string; latencyMs?: number };
    };
    searchEngine?: {
        provider?: string;
    };
}

export interface RagSearchResult {
    id?: string | number;
    title?: string;
    category?: string;
    content?: string;
    similarityScore?: number;
    score?: number;
    targetAgent?: string;
    tags?: string[];
    tableData?: any;
    imageAttachments?: any[];
    item?: any;
    breakdown?: any;
}

export interface WebSearchResultItem {
    title: string;
    url: string;
    snippet: string;
    source?: string;
    images?: string[];
}

export interface QaRecord {
    id: string | number;
    question: string;
    answer: string;
    sessionTitle?: string;
    timestamp?: string;
    createdAt?: string;
    username?: string;
    agentName?: string;
    category?: string;
    sources?: any[];
}

export interface WordAnalyticsDb {
    wordCounts?: Record<string, number>;
    totalTokens?: number;
    lastUpdated?: string;
}

export interface SettingsConfig {
    aiBaseUrl?: string;
    aiApiKey?: string;
    defaultModel?: string;
    fastModel?: string;
    aiProtocolMode?: string;
    enableNativeSearch?: boolean;
    searchProvider?: string;
    tavilyApiKey?: string;
    bochaApiKey?: string;
    authRegistrationMode?: 'username' | 'phone' | 'email';
    tencentSmsSecretId?: string;
    tencentSmsSecretKey?: string;
    tencentSmsSdkAppId?: string;
    tencentSmsSignName?: string;
    tencentSmsTemplateId?: string;
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPass?: string;
    mailFrom?: string;
    mailFromName?: string;
    smtpSecureEnabled?: string;
    ttsEngine?: string;
    msedgeVoice?: string;
    onnxModelPath?: string;
    onnxSpeed?: string | number;
    ttsApiUrl?: string;
    ttsApiKey?: string;
    ttsApiModel?: string;
    ttsApiVoice?: string;
    systemPrompt?: string;
    drPersona?: {
        name?: string;
        title?: string;
        avatar?: string;
        systemPrompt?: string;
    };
    liliPersona?: {
        name?: string;
        title?: string;
        avatar?: string;
        welcomeSpeech?: string;
        prompt?: string;
        voice?: string;
        speed?: number;
    };
    campusMap?: {
        pinScale?: number;
    };
    providerPool?: any[];
}

export interface TTSPresetVoice {
    id: string;
    name: string;
    role?: string;
    gender?: string;
    desc?: string;
    sampleText?: string;
}

export interface CampusTourRoute {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    color?: string;
    duration: string;
    description: string;
    locationIds: string[];
}

export interface ThoughtCloneConfig {
    roleId: string;
    name: string;
    tag: string;
    color?: string;
    icon?: string;
    description?: string;
    keywords: string[];
    systemPrompt: string;
    enabled?: boolean;
    isCustom?: boolean;
}
