import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from '@openai/agents';

// Disable default tracing telemetry exporter
setTracingDisabled(true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

export const dataDir = path.join(rootDir, 'data');
export const uploadsDir = path.join(rootDir, 'public', 'uploads');
export const distDir = path.join(rootDir, 'dist');
export const ragFilePath = path.join(dataDir, 'rag_knowledge.json');
export const modelsCacheDir = path.join(dataDir, 'models_cache');

export const envPath = path.join(rootDir, '.env.local');
export const envMainPath = path.join(rootDir, '.env');

export const loadEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;
        const separatorIndex = trimmedLine.indexOf('=');
        if (separatorIndex === -1) continue;
        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1).trim();
        if (key && value !== undefined) {
            process.env[key] = value;
        }
    }
};

loadEnvFile(envMainPath);
loadEnvFile(envPath);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(modelsCacheDir, { recursive: true });

// AI Gateway Settings
export const resolveEffectiveProtocol = (baseUrl = '', requestedMode = 'auto') => {
    if (requestedMode === 'responses' || requestedMode === 'chat_completions') {
        return requestedMode;
    }
    // Auto Mode: Detect if endpoint is OpenAI official or supports Responses API
    const isOfficialOpenAI = baseUrl.includes('api.openai.com') && !baseUrl.includes('deepseek') && !baseUrl.includes('siliconflow');
    return isOfficialOpenAI ? 'responses' : 'chat_completions';
};

// Native Search Provider Resolver
export const getProviderNativeSearchConfig = (baseUrl = '', modelName = '') => {
    const url = (baseUrl || '').toLowerCase();
    const model = (modelName || '').toLowerCase();

    if (url.includes('dashscope.aliyuncs.com') || model.includes('qwen')) {
        return {
            supported: true,
            provider: 'qwen',
            name: '通义千问 (DashScope)',
            extraBody: { enable_search: true }
        };
    }

    if (url.includes('bigmodel.cn') || model.includes('glm')) {
        return {
            supported: true,
            provider: 'zhipu',
            name: '智谱清言 (GLM)',
            tools: [
                {
                    type: "web_search",
                    web_search: {
                        enable: true,
                        search_result: true
                    }
                }
            ]
        };
    }

    if (url.includes('moonshot.cn') || model.includes('moonshot') || model.includes('kimi')) {
        return {
            supported: true,
            provider: 'moonshot',
            name: '月之暗面 (Kimi)',
            tools: [
                {
                    type: "builtin_function",
                    function: {
                        name: "$web_search"
                    }
                }
            ]
        };
    }

    if (url.includes('api.openai.com') && !url.includes('deepseek') && !url.includes('siliconflow')) {
        return {
            supported: true,
            provider: 'openai',
            name: 'OpenAI 官方 (Bing)',
            tools: [
                { type: "web_search_preview" }
            ]
        };
    }

    if (url.includes('baichuan-ai.com') || model.includes('baichuan')) {
        return {
            supported: true,
            provider: 'baichuan',
            name: '百川智能',
            tools: [
                {
                    type: "web_search",
                    web_search: { enable: true }
                }
            ]
        };
    }

    return {
        supported: false,
        provider: 'generic',
        name: '标准大模型 (DeepSeek/通用)',
        message: '该服务商无内置引擎，由系统多源容灾外挂搜索工具 (必应/DDG/Tavily/博查) 无缝承接'
    };
};

export const getAiConfig = () => {
    const aiBaseUrl = process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
    const aiApiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const defaultModel = process.env.DEFAULT_MODEL || process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || 'deepseek-v4-flash';
    const fastModel = process.env.FAST_MODEL || defaultModel;
    const aiProtocolMode = process.env.AI_PROTOCOL_MODE || 'auto'; // 'auto' | 'chat_completions' | 'responses'
    const enableNativeSearch = process.env.ENABLE_NATIVE_SEARCH === 'true' || process.env.ENABLE_NATIVE_SEARCH === '1';
    const searchProvider = process.env.SEARCH_PROVIDER || (process.env.TAVILY_API_KEY ? 'tavily' : (process.env.BOCHA_API_KEY ? 'bocha' : 'multi'));
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const bochaApiKey = process.env.BOCHA_API_KEY;

    const effectiveProtocol = resolveEffectiveProtocol(aiBaseUrl, aiProtocolMode);
    const nativeSearchConfig = getProviderNativeSearchConfig(aiBaseUrl, defaultModel);

    return {
        aiBaseUrl,
        aiApiKey,
        defaultModel,
        fastModel,
        aiProtocolMode,
        effectiveProtocol,
        enableNativeSearch,
        nativeSearchConfig,
        searchProvider,
        tavilyApiKey,
        bochaApiKey
    };
};

export let globalOpenAIClient = null;

export const initAiClient = () => {
    const { aiBaseUrl, aiApiKey, defaultModel, fastModel, effectiveProtocol } = getAiConfig();
    if (aiApiKey) {
        globalOpenAIClient = new OpenAI({
            baseURL: aiBaseUrl,
            apiKey: aiApiKey,
        });
        setDefaultOpenAIClient(globalOpenAIClient);
        setOpenAIAPI('chat_completions');
        console.log(`🤖 [AI Gateway Ready] Connected to: ${aiBaseUrl}`);
        console.log(`  👉 Protocol Mode (PROTOCOL_MODE): ${effectiveProtocol} (Configured: ${process.env.AI_PROTOCOL_MODE || 'auto'})`);
        console.log(`  👉 Default Model (DEFAULT_MODEL):  ${defaultModel} (for student advisory dialogs)`);
        console.log(`  👉 Fast Model (FAST_MODEL):        ${fastModel} (for document parsing & background tasks)`);
    } else {
        console.log('ℹ️ [AI Gateway] No remote API Key detected. Local BGE RAG offline fallback active.');
    }
    return globalOpenAIClient;
};

initAiClient();

