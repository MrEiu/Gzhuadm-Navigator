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
export const getAiConfig = () => {
    const aiBaseUrl = process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
    const aiApiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const defaultModel = process.env.DEFAULT_MODEL || process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';
    const fastModel = process.env.FAST_MODEL || defaultModel;
    const searchProvider = process.env.SEARCH_PROVIDER || (process.env.TAVILY_API_KEY ? 'tavily' : (process.env.BOCHA_API_KEY ? 'bocha' : 'duckduckgo'));
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    const bochaApiKey = process.env.BOCHA_API_KEY;

    return {
        aiBaseUrl,
        aiApiKey,
        defaultModel,
        fastModel,
        searchProvider,
        tavilyApiKey,
        bochaApiKey
    };
};

export let globalOpenAIClient = null;
const { aiBaseUrl, aiApiKey, defaultModel, fastModel } = getAiConfig();

if (aiApiKey) {
    globalOpenAIClient = new OpenAI({
        baseURL: aiBaseUrl,
        apiKey: aiApiKey,
    });
    setDefaultOpenAIClient(globalOpenAIClient);
    setOpenAIAPI('chat_completions');
    console.log(`🤖 [AI Gateway Ready] Connected to: ${aiBaseUrl}`);
    console.log(`  👉 Default Model (DEFAULT_MODEL): ${defaultModel} (for student advisory dialogs)`);
    console.log(`  👉 Fast Model (FAST_MODEL):       ${fastModel} (for document parsing & background tasks)`);
} else {
    console.log('ℹ️ [AI Gateway] No remote API Key detected. Local BGE RAG offline fallback active.');
}
