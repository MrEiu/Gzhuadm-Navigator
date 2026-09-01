export interface User {
    username: string;
    role: 'admin' | 'guest';
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
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
    imageAttachments?: string[];
    targetAgent?: string; // 'all' | 'dr' | 'dorm' | 'counselor' | 'senior_boy' | 'senior_girl'
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
    imageAttachments?: string[];
    tags?: string[];
    saved?: boolean;
}

export type PersonalRagItem = PersonalRagMemory;

export interface CampusLocation {
    id: string;
    name: string;
    category: 'teaching' | 'dorm' | 'canteen' | 'sports' | 'scenic' | 'facility';
    x: number; // Percentage on map (0-100)
    y: number; // Percentage on map (0-100)
    description: string;
    openingHours?: string;
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
