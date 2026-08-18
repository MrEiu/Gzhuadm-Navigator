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
    name?: string;
    gender?: '男' | '女';
    avatar?: string;
    phone?: string;
    email?: string;
    province?: string;
    score?: number | string;
    rank?: number | string;
    subjects?: string;
    specialConditions?: string;
    isVip?: boolean;
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

// --- Campus Map Location Types ---
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
    searchProvider: 'duckduckgo' | 'tavily' | 'bocha';
    tavilyApiKey?: string;
    bochaApiKey?: string;
    advancedAuthEnabled?: boolean;
    authRegistrationMode?: 'email' | 'phone' | 'none';
    tencentSmsSecretId?: string;
    smtpHost?: string;
    smtpUser?: string;
}

export interface DashboardStats {
    totalRagItems?: number;
    totalUsers?: number;
    vipUsers?: number;
    categoryBreakdown?: { [key: string]: number };
    aiGateway?: {
        defaultModel: string;
        fastModel: string;
    };
    searchEngine?: {
        provider: string;
    };
}
