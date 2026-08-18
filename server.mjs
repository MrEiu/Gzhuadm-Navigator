import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from 'redis';
import { env, pipeline } from '@xenova/transformers';
import { Agent, tool, run, setDefaultOpenAIClient, setOpenAIAPI, user, assistant, setTracingDisabled } from '@openai/agents';
import { z } from 'zod';
import OpenAI from 'openai';

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Unhandled Rejection]:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('⚠️ [Uncaught Exception]:', error);
});

// Disable default tracing telemetry exporter if not configured
setTracingDisabled(true);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const distDir = path.join(__dirname, 'dist');
const ragFilePath = path.join(dataDir, 'rag_knowledge.json');
const modelsCacheDir = path.join(dataDir, 'models_cache');

const envPath = path.join(__dirname, '.env.local');
const envMainPath = path.join(__dirname, '.env');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(envPath);
loadEnvFile(envMainPath);

// Initialize OpenAI-Compatible client configuration (DeepSeek, OpenAI, DashScope, SiliconFlow, GLM, Moonshot, Custom Gateway)
const aiBaseUrl = process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com';
const aiApiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const defaultModel = process.env.DEFAULT_MODEL || process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';
const fastModel = process.env.FAST_MODEL || defaultModel;

let globalOpenAIClient = null;
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

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(modelsCacheDir, { recursive: true });

// Configure persistent local cache directory & HF Mirror for Transformers.js ONNX models
env.cacheDir = modelsCacheDir;
env.remoteHost = 'https://hf-mirror.com';
env.remotePathTemplate = '{model}/resolve/{revision}/';


// ==========================================
// 1. Local BGE Embedding Pipeline (512-dim)
// ==========================================
let embedder = null;
const initEmbedder = async () => {
  const modelName = 'Xenova/bge-small-zh-v1.5';
  console.log(`⏳ [ONNX Model] Checking local model cache in: ${modelsCacheDir}`);
  try {
    const startTime = Date.now();
    embedder = await pipeline('feature-extraction', modelName, {
      progress_callback: (info) => {
        if (info.status === 'initiate') {
          console.log(`  🔍 [Model Check] Initiating ${info.file || info.name || ''}...`);
        } else if (info.status === 'downloading') {
          const pct = typeof info.progress === 'number' ? info.progress.toFixed(1) : '0.0';
          console.log(`  📥 [Model Downloading] ${info.file || ''}: ${pct}%`);
        } else if (info.status === 'done') {
          console.log(`  ✅ [Model File Loaded] ${info.file || ''}`);
        }
      }
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [ONNX Model Ready] Local BGE 512-dim embedding loaded in ${elapsed}s! (Cache: ./data/models_cache)`);
  } catch (err) {
    console.warn(`⚠️ [ONNX Model Warning] Failed to load ${modelName}:`, err.message);
    console.warn(`  👉 Fallback keyword similarity engine will be used.`);
  }
};

// initEmbedder will be called asynchronously after app.listen



const getEmbedding = async (text = '') => {
  if (!embedder) return null;
  try {
    const cleanText = String(text || '').replace(/\s+/g, ' ').slice(0, 500);
    if (!cleanText) return null;
    const output = await embedder(cleanText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Embedding generation error:', err);
    return null;
  }
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// --- Seed RAG Knowledge Base ---
const DEFAULT_RAG_KNOWLEDGE = [
  {
    id: "rag-001",
    title: "历年高考录取分数线与排位对照表",
    category: "录取分数",
    type: "table",
    content: "招生办发布的近年重点省份本科批次最低录取分数线与全省排位对照参考。",
    tableData: {
      columns: ["省份", "专业", "2025录取线", "2024录取线", "参考排位"],
      rows: [
        ["浙江", "计算机科学与技术", "645分", "642分", "12000名"],
        ["江苏", "人工智能实验班", "638分", "635分", "10500名"],
        ["广东", "数字媒体与交互设计", "612分", "608分", "22000名"],
        ["四川", "智能制造与自动化", "605分", "601分", "25000名"]
      ]
    },
    imageAttachments: [
      {
        name: "score_cutoff_chart.png",
        url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop",
        caption: "高考录取分数趋势图"
      }
    ],
    tags: ["录取分数", "分数线", "排位", "浙江", "江苏", "广东", "四川", "计算机"],
    updatedAt: new Date().toISOString()
  },
  {
    id: "rag-002",
    title: "标准学生公寓与宿舍生活环境配置",
    category: "宿舍环境",
    type: "image",
    content: "本校学生公寓统一配备标准4人间/6人间，每间宿舍均含独卫、空调、24小时热水及上床下桌独立书桌。",
    tableData: null,
    imageAttachments: [
      {
        name: "dorm_4person_room.png",
        url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop",
        caption: "标准4人间公寓实景图"
      }
    ],
    tags: ["宿舍", "四人间", "空调", "独卫", "住宿环境", "dorm_4person_room.png"],
    updatedAt: new Date().toISOString()
  },
  {
    id: "rag-003",
    title: "学费标准与各类奖助学金对照表",
    category: "学费奖学金",
    type: "table",
    content: "本校学费标准及“奖、助、贷、勤、补”全方位资助体系明细。",
    tableData: {
      columns: ["专业类别", "学费标准", "奖学金项目", "资助金额"],
      rows: [
        ["普通文理科专业", "5,500元/学年", "国家奖学金", "8,000元/人/年"],
        ["工科与AI热门专业", "6,500元/学年", "新生卓越奖学金", "免全额学费 + 1万元补贴"],
        ["艺术与设计类", "10,000元/学年", "综合素质特等奖", "5,000元/人/年"]
      ]
    },
    imageAttachments: [],
    tags: ["学费", "奖学金", "助学金", "学费标准", "资助"],
    updatedAt: new Date().toISOString()
  }
];

// ==========================================
// 2. PostgreSQL Database Layer (psql + pgvector)
// ==========================================
const { Pool } = pg;
let pgPool = null;
let usePostgres = false;

const initPostgres = async () => {
  let targetPort = Number(process.env.POSTGRES_PORT || process.env.PGPORT || 35432);
  const pgConfig = {
    host: process.env.POSTGRES_HOST || process.env.PGHOST || 'localhost',
    port: targetPort,
    user: process.env.POSTGRES_USER || process.env.PGUSER || 'aurasense',
    password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || 'aurasensepass',
    database: process.env.POSTGRES_DB || process.env.PGDATABASE || 'aurasense',
    connectionTimeoutMillis: 3000,
  };

  console.log(`⏳ [PostgreSQL] Connecting to ${pgConfig.user}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}...`);
  try {
    pgPool = new Pool(pgConfig);
    let client;
    try {
      client = await pgPool.connect();
    } catch (firstErr) {
      if (!process.env.POSTGRES_PORT && targetPort === 35432) {
        console.warn(`  ⚠️ Host port 35432 failed (${firstErr.message}). Retrying default port 5432...`);
        pgConfig.port = 5432;
        pgPool = new Pool(pgConfig);
        client = await pgPool.connect();
      } else {
        throw firstErr;
      }
    }
    client.release();
    usePostgres = true;
    console.log(`✅ [PostgreSQL Ready] Successfully connected to ${pgConfig.host}:${pgConfig.port}/${pgConfig.database} (pgvector active)`);



    // Create Extension & Tables
    await pgPool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        profile JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile JSONB;

      CREATE TABLE IF NOT EXISTS user_personal_rag (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT '个人偏好',
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        content TEXT NOT NULL,
        tags JSONB,
        embedding vector(512),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_personal_rag_username ON user_personal_rag(username);

      CREATE TABLE IF NOT EXISTS rag_knowledge (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        content TEXT,
        table_data JSONB,
        image_attachments JSONB,
        tags JSONB,
        embedding vector(512),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        messages JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_username ON chat_sessions(username);
    `);

    // Seed admin user
    await pgPool.query(`
      INSERT INTO users (username, password, role)
      VALUES ('admin', 'admin123', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);

    // Seed RAG items with embeddings
    const countRes = await pgPool.query('SELECT COUNT(*) FROM rag_knowledge');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const item of DEFAULT_RAG_KNOWLEDGE) {
        const textToEmbed = `${item.title} ${item.category} ${item.content} ${item.tags.join(' ')}`;
        const vec = await getEmbedding(textToEmbed);
        const vecStr = vec ? `[${vec.join(',')}]` : null;

        await pgPool.query(
          `INSERT INTO rag_knowledge (id, title, category, type, content, table_data, image_attachments, tags, embedding, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            item.id, item.title, item.category, item.type, item.content,
            JSON.stringify(item.tableData), JSON.stringify(item.imageAttachments),
            JSON.stringify(item.tags), vecStr, item.updatedAt
          ]
        );
      }
    }
  } catch (err) {
    console.warn(`⚠️ PostgreSQL connection failed (${err.message}). Falling back to local JSON persistence.`);
    usePostgres = false;
  }
};

// initPostgres will be called asynchronously after app.listen


// Local JSON fallback helpers
const loadJsonRag = () => {
  if (!fs.existsSync(ragFilePath)) {
    fs.writeFileSync(ragFilePath, JSON.stringify(DEFAULT_RAG_KNOWLEDGE, null, 2), 'utf8');
    return DEFAULT_RAG_KNOWLEDGE;
  }
  try {
    return JSON.parse(fs.readFileSync(ragFilePath, 'utf8'));
  } catch {
    return DEFAULT_RAG_KNOWLEDGE;
  }
};

const saveJsonRag = (data) => {
  fs.writeFileSync(ragFilePath, JSON.stringify(data, null, 2), 'utf8');
};

const getRagStore = async () => {
  if (usePostgres) {
    try {
      const res = await pgPool.query('SELECT * FROM rag_knowledge ORDER BY updated_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        type: r.type,
        content: r.content,
        tableData: r.table_data,
        imageAttachments: r.image_attachments || [],
        tags: r.tags || [],
        embedding: r.embedding ? (typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding) : null,
        updatedAt: r.updated_at
      }));
    } catch (e) {
      console.error('PostgreSQL query error, using JSON fallback:', e);
      return loadJsonRag();
    }
  }
  return loadJsonRag();
};

// ==========================================
// 3. Redis Backend Caching Layer (re)
// ==========================================
let redisClient = null;
let useRedis = false;
const memoryCache = new Map();

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`⏳ [Redis Cache] Connecting to ${redisUrl}...`);
  try {
    redisClient = createClient({ url: redisUrl, socket: { connectTimeout: 3000 } });
    redisClient.on('error', (err) => console.warn('  ⚠️ [Redis Socket Warning]:', err.message));
    await redisClient.connect();
    useRedis = true;
    console.log(`✅ [Redis Cache Ready] High-speed cache active at ${redisUrl}`);
  } catch (err) {
    console.warn(`⚠️ [Redis Cache Warning] Failed to connect to ${redisUrl} (${err.message}).`);
    console.warn(`  👉 Fallback in-memory Map cache activated.`);
    useRedis = false;
  }
};


// initRedis will be called asynchronously after app.listen


const withTimeout = (promise, ms = 250) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis operation timed out')), ms))
  ]);
};

const getCache = async (key) => {
  if (useRedis && redisClient?.isOpen) {
    try {
      const val = await withTimeout(redisClient.get(key), 250);
      return val ? JSON.parse(val) : null;
    } catch {
      // fallback to memory cache seamlessly
    }
  }
  const mem = memoryCache.get(key);
  if (mem && mem.expire > Date.now()) return mem.value;
  return null;
};

const setCache = async (key, val, ttlSeconds = 600) => {
  if (useRedis && redisClient?.isOpen) {
    try {
      await withTimeout(redisClient.set(key, JSON.stringify(val), { EX: ttlSeconds }), 250);
    } catch {}
  }
  memoryCache.set(key, { value: val, expire: Date.now() + ttlSeconds * 1000 });
};

const invalidateRagCache = async () => {
  if (useRedis && redisClient?.isOpen) {
    try {
      const keys = await withTimeout(redisClient.keys('rag:*'), 250);
      if (keys && keys.length) await withTimeout(redisClient.del(keys), 250);
    } catch {}
  }
  memoryCache.clear();
};

// ==========================================
// 4. Dense Vector + Token-Weighted Hybrid Search Engine (with Adaptive Cutoff)
// ==========================================

const PROVINCES = ['浙江', '江苏', '广东', '四川', '湖北', '湖南', '山东', '河南', '河北', '安徽', '福建', '江西', '陕西', '山西', '辽宁', '吉林', '黑龙江', '广西', '海南', '贵州', '云南', '重庆', '北京', '上海', '天津'];

const CATEGORY_KEYWORDS = {
  '录取分数': ['分数', '录取', '排位', '位次', '投档', '省控', '分数线', '切线'],
  '宿舍环境': ['宿舍', '四人间', '4人间', '六人间', '6人间', '独卫', '空调', '热水', '住宿', '上床下桌', '公寓', '宿舍图', '环境'],
  '学费奖学金': ['学费', '奖学金', '助学金', '资助', '补贴', '多少钱', '费用', '减免', '国家奖学金'],
  '专业介绍': ['专业', '计算机', '人工智能', '设计', '自动化', '工科', '理科', '文科', '实验班']
};

const extractMeaningfulTokens = (text = '') => {
  if (!text) return [];
  const cleaned = String(text).toLowerCase();
  
  // 1. Extract alphanumeric/Chinese words of 2 or more characters, numbers with units
  const tokens = cleaned.match(/[\u4e00-\u9fa5a-z0-9]{2,}|\d+[分人名本硕博]/g) || [];
  
  // 2. Extract 2-gram bigrams from contiguous Chinese characters
  const chineseChunks = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
  chineseChunks.forEach(chunk => {
    if (chunk.length >= 2) {
      for (let i = 0; i < chunk.length - 1; i++) {
        const bi = chunk.slice(i, i + 2);
        if (!tokens.includes(bi)) tokens.push(bi);
      }
    }
  });

  return tokens.filter(t => t.length >= 2);
};

const searchRagEngine = async (query = '', topK = 3) => {
  if (!query || !query.trim()) return [];
  console.log(`🔎 [searchRagEngine] Starting search for query: "${query}" (topK=${topK})`);
  const queryHash = crypto.createHash('md5').update(query.trim()).digest('hex');
  const cacheKey = `rag:search:v3:${queryHash}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`⚡ [searchRagEngine] Cache HIT for: "${query}" (${cached.length} results)`);
    return cached;
  }

  const queryVector = await getEmbedding(query);
  const ragStore = await getRagStore();
  const qTokens = extractMeaningfulTokens(query);
  const qLower = query.toLowerCase();

  // Detect specific province entities in query
  const queryProvinces = PROVINCES.filter(p => qLower.includes(p));

  const scored = ragStore.map((item) => {
    let score = 0;
    const docTitle = (item.title || '').toLowerCase();
    const docCategory = (item.category || '').toLowerCase();
    const docContent = (item.content || '').toLowerCase();
    const docTags = (item.tags || []).map(t => String(t).toLowerCase());
    const docText = `${docTitle} ${docCategory} ${docContent} ${docTags.join(' ')}`;
    const docTokens = extractMeaningfulTokens(docText);

    // 1. Calibrated Dense Vector Cosine Similarity (Threshold >= 0.50)
    if (queryVector && item.embedding) {
      const vecSim = cosineSimilarity(queryVector, item.embedding);
      if (vecSim >= 0.50) {
        // Linear scale mapping [0.50, 1.0] -> [0, 8.0]
        score += ((vecSim - 0.50) / 0.50) * 8.0;
      }
    }

    // 2. High-precision Token Overlap (Length >= 2, no single-character false positives)
    let matchedTokenCount = 0;
    for (const qt of qTokens) {
      if (docTokens.includes(qt) || docTitle.includes(qt)) {
        matchedTokenCount++;
      }
    }
    score += matchedTokenCount * 2.5;

    // 3. Exact Title or Category alignment
    if (docTitle.includes(qLower) || qLower.includes(docTitle)) {
      score += 4.0;
    }
    if (qLower.includes(docCategory)) {
      score += 3.5;
    }

    // 4. Entity Specificity & Conflict Check
    if (queryProvinces.length > 0) {
      const docHasQueriedProvince = queryProvinces.some(p => docText.includes(p));
      if (docHasQueriedProvince) {
        score += 6.0; // High reward for matching specified province
      } else if (item.category === '录取分数') {
        score -= 4.0; // Suppress scores of other non-queried provinces
      }
    }

    // 5. Category Keyword Match Boost
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const queryHasKw = keywords.some(kw => qLower.includes(kw));
      const docIsCat = docCategory.includes(catName) || docText.includes(catName);
      if (queryHasKw && docIsCat) {
        score += 3.0;
      }
    }

    return { item, score: Math.max(0, score) };
  });

  // Dynamic Adaptive Cutoff:
  const MIN_ABSOLUTE_THRESHOLD = 5.0; // Must have reliable semantic and/or token match
  const validMatches = scored
    .filter(s => s.score >= MIN_ABSOLUTE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (validMatches.length === 0) {
    await setCache(cacheKey, [], 1800);
    return [];
  }

  const maxScore = validMatches[0].score;
  // Retain only results whose score is at least 70% of the top match (drops sharp drop-offs)
  const results = validMatches
    .filter(s => s.score >= maxScore * 0.70)
    .slice(0, topK);

  await setCache(cacheKey, results, 1800);
  return results;
};

const formatRagContext = (ragResults) => {
  if (!ragResults.length) return '';

  let ctx = `【知识库（RAG）匹配到的参考信息】：\n\n`;
  ragResults.forEach(({ item, score }, index) => {
    ctx += `${index + 1}. **${item.title}** (${item.category}) [相似度: ${(score * 10).toFixed(1)}%]\n`;
    if (item.content) ctx += `   说明：${item.content}\n`;

    if (item.tableData && item.tableData.columns && item.tableData.rows) {
      ctx += `   数据表格：\n`;
      ctx += `   | ${item.tableData.columns.join(' | ')} |\n`;
      ctx += `   | ${item.tableData.columns.map(() => '---').join(' | ')} |\n`;
      item.tableData.rows.forEach(row => {
        ctx += `   | ${row.join(' | ')} |\n`;
      });
    }

    if (item.imageAttachments && item.imageAttachments.length) {
      ctx += `   包含图片附件：\n`;
      item.imageAttachments.forEach(img => {
        ctx += `   ![${img.caption || img.name}](${img.url})\n`;
      });
    }
    ctx += `\n`;
  });

  return ctx;
};

const ADMISSIONS_SYSTEM_PROMPT = `
你是 Gzadm Navigator 智能入学咨询系统的 AI 招生与专业选择顾问。你拥有张雪峰式的实用主义思维框架与接地气的决策DNA。
你的职责是为广大学子及家长评估高校（默认以【广州大学】等粤港澳大湾区高校为代表）不同专业的选择、优势劣势、就业中位数、考研保研率与志愿填报防调剂策略。

表达与决策规则：
1. 始终使用中文回答，态度直截了当、大实话、接地气、用中位数就业数据和真凭实据说话。
2. 答案第一句直接给出核心判断（Headline），不讲废话铺垫。
3. 遇到选专业问题，主动问清：学生的预估分数/位次、家庭经济条件、以及未来想留大湾区还是回老家发展。
4. 当系统提供了【知识库（RAG）匹配到的参考信息】时，请**优先依据知识库中的准确数据（如表格分数线、学费、宿舍图片）**进行解答。
5. 如果知识库中包含相关图片附件（如宿舍图、分数线图），请直接在回复中用 Markdown 图片语法（\`![caption](url)\`）展现给用户。
6. 排版清晰，善用列表和粗体高亮。
`.trim();

// ==========================================
// 5. Express Server & APIs
// ==========================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
}, express.static(uploadsDir));

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    system: 'Gzadm Navigator Admissions AI + Local BGE RAG DB',
    embeddingModel: embedder ? 'Local BGE-small-zh 512-dim' : 'Fallback Keyword Engine',
    database: usePostgres ? 'PostgreSQL pgvector' : 'JSON Persistence',
    cache: useRedis ? 'Redis' : 'Memory Cache'
  });
});

// --- Smart Document Parsing & Automated Chunking API ---
app.post('/api/admin/parse-document', async (req, res) => {
  const { text, filename, chunkSize = 400, mode = 'heading' } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Text content is required' });
  }

  const rawText = text.trim();
  const titlePrefix = filename ? filename.replace(/\.[^/.]+$/, '') : '导入文档';
  const chunks = [];

  let sections = [];
  if (mode === 'ai') {
    if (globalOpenAIClient) {
      try {
        console.log(`🤖 [Fast Model: ${fastModel}] Sending document for AI Smart Semantic Chunking...`);
        const prompt = `你是一位专业的 RAG 知识库构建与语义切片专家。请将以下文档内容拆分为 3~15 个逻辑独立、语义连贯的知识切片。

对于每一个切片，必须提取：
1. title: 简洁切片标题
2. category: 分类（如：录取分数、专业介绍、宿舍环境、学费奖学金、校园生活等）
3. type: 'text' 或 'table'
4. content: 提炼后的核心内容
5. tags: 3~6 个适合向量检索的检索关键词数组

必须直接返回严格符合 JSON 格式的数组，不要包含 Markdown 代码块标记。格式如下：
[
  {
    "title": "标题",
    "category": "分类",
    "type": "text",
    "content": "核心内容",
    "tags": ["关键词1", "关键词2"]
  }
]

文档内容：
${rawText.slice(0, 4500)}`;

        const completion = await globalOpenAIClient.chat.completions.create({
          model: fastModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        });

        const replyText = completion?.choices?.[0]?.message?.content?.trim() || '';
        const jsonMatch = replyText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const aiChunks = JSON.parse(jsonMatch[0]);
          if (Array.isArray(aiChunks) && aiChunks.length > 0) {
            aiChunks.forEach((c, i) => {
              chunks.push({
                id: `chunk-ai-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
                title: c.title || `${titlePrefix} - AI切片 ${i+1}`,
                category: c.category || 'AI切片',
                type: c.type || 'text',
                content: c.content || '',
                tableData: c.tableData || null,
                imageAttachments: [],
                tags: Array.isArray(c.tags) ? c.tags : [titlePrefix, 'AI切片']
              });
            });

            return res.json({ ok: true, count: chunks.length, chunks, source: 'ai-gateway' });
          }
        }
      } catch (err) {
        console.warn('⚠️ AI chunking failed, falling back to heuristic chunker:', err.message);
      }
    }
  }

  if (mode === 'heading' || mode === 'ai') {
    // 1. Try splitting by Markdown Headings (#, ##, ###)
    sections = rawText.split(/(?=(?:^|\n)\s*#{1,6}\s+)/).filter(s => s && s.trim());

    // 2. If no Markdown headings, fallback to Chinese chapter titles or numbered headings (e.g. ## 第一章, 第一节, 1.)
    if (sections.length <= 1) {
      sections = rawText.split(/(?=(?:^|\n)\s*(?:#{1,6}\s*|第[一二三四五六七八九十0-9]+[章节篇]|【|\d+\.\s+))/).filter(s => s && s.trim());
    }

    // 3. If still no headings found, fallback to double-newline paragraphs
    if (sections.length <= 1) {
      sections = rawText.split(/\n\s*\n/).filter(s => s && s.trim());
    }
  }


  // Perform chunk building
  if (sections.length > 1) {
    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;
      
      const lines = trimmed.split('\n');
      let title = `${titlePrefix} - 切片 ${idx + 1}`;
      let content = trimmed;

      const firstLine = lines[0].trim();
      if (/^(?:#{1,6}\s*|第[一二三四五六七八九十0-9]+[章节篇]|【|\d+\.\s+)/.test(firstLine)) {
        title = firstLine.replace(/^(?:#{1,6}\s*|【|】)/g, '').trim();
        content = lines.slice(1).join('\n').trim();
      }

      if (!content) content = trimmed;

      const tags = Array.from(new Set([
        titlePrefix,
        ...title.split(/[\s:：,，\-]+/).filter(w => w.length > 1),
        '文档切片'
      ]));


      chunks.push({
        id: `chunk-temp-${Date.now()}-${idx}-${Math.floor(Math.random()*1000)}`,
        title: title || `${titlePrefix} - 切片 ${idx + 1}`,
        category: '文档切片',
        type: 'text',
        content,
        tableData: null,
        imageAttachments: [],
        tags
      });
    });
  } else {
    // Length-based fixed character slicing fallback
    let currentIdx = 0;
    let chunkCount = 1;
    const effChunkSize = Math.max(100, Number(chunkSize) || 400);
    while (currentIdx < rawText.length) {
      const slice = rawText.slice(currentIdx, currentIdx + effChunkSize);
      const title = `${titlePrefix} (第 ${chunkCount} 部分)`;
      chunks.push({
        id: `chunk-temp-${Date.now()}-${chunkCount}-${Math.floor(Math.random()*1000)}`,
        title,
        category: '文档切片',
        type: 'text',
        content: slice.trim(),
        tableData: null,
        imageAttachments: [],
        tags: [titlePrefix, `切片${chunkCount}`, '文档切片']
      });
      currentIdx += effChunkSize;
      chunkCount++;
    }
  }

  res.json({ ok: true, count: chunks.length, chunks });
});


// --- Smart CSV/Table Parser API ---
app.post('/api/admin/parse-table', (req, res) => {
  const { csvText, filename } = req.body || {};
  if (!csvText || !csvText.trim()) {
    return res.status(400).json({ ok: false, error: 'CSV/Table content required' });
  }

  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return res.status(400).json({ ok: false, error: 'Empty table' });

  const columns = lines[0].split(/[,,\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => 
    line.split(/[,,\t]/).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  res.json({
    ok: true,
    title: filename ? filename.replace(/\.[^/.]+$/, '') : '导入表格',
    tableData: { columns, rows }
  });
});

// --- Batch Save Edited Chunks API ---
app.post('/api/admin/rag/batch', async (req, res) => {
  const { chunks } = req.body || {};
  if (!Array.isArray(chunks) || !chunks.length) {
    return res.status(400).json({ ok: false, error: 'Chunks array required' });
  }

  const savedItems = [];
  for (const chunk of chunks) {
    const textToEmbed = `${chunk.title} ${chunk.category} ${chunk.content} ${(chunk.tags || []).join(' ')}`;
    const vec = await getEmbedding(textToEmbed);

    const newItem = {
      id: `rag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: chunk.title || '新建切片',
      category: chunk.category || '通用',
      type: chunk.type || 'text',
      content: chunk.content || '',
      tableData: chunk.tableData || null,
      imageAttachments: Array.isArray(chunk.imageAttachments) ? chunk.imageAttachments : [],
      tags: Array.isArray(chunk.tags) ? chunk.tags : [],
      embedding: vec,
      updatedAt: new Date().toISOString()
    };

    if (usePostgres) {
      const vecStr = vec ? `[${vec.join(',')}]` : null;
      await pgPool.query(
        `INSERT INTO rag_knowledge (id, title, category, type, content, table_data, image_attachments, tags, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newItem.id, newItem.title, newItem.category, newItem.type, newItem.content,
          JSON.stringify(newItem.tableData), JSON.stringify(newItem.imageAttachments),
          JSON.stringify(newItem.tags), vecStr, newItem.updatedAt
        ]
      );
    } else {
      const jsonStore = loadJsonRag();
      jsonStore.unshift(newItem);
      saveJsonRag(jsonStore);
    }
    savedItems.push(newItem);
  }

  await invalidateRagCache();
  res.json({ ok: true, count: savedItems.length, savedItems });
});

// --- RAG Knowledge Base Management APIs ---
app.get('/api/admin/rag', async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const cacheKey = 'rag:knowledge:all';
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ ok: true, data: cached, source: 'cache' });
  }

  const ragStore = await getRagStore();
  await setCache(cacheKey, ragStore, 600);
  res.json({ ok: true, data: ragStore, source: 'db' });
});

app.post('/api/admin/rag', async (req, res) => {
  const title = req.body.title || '新建知识项';
  const category = req.body.category || '通用';
  const content = req.body.content || '';
  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];

  const textToEmbed = `${title} ${category} ${content} ${tags.join(' ')}`;
  const vec = await getEmbedding(textToEmbed);

  const newItem = {
    id: `rag-${Date.now()}`,
    title,
    category,
    type: req.body.type || 'text',
    content,
    tableData: req.body.tableData || null,
    imageAttachments: Array.isArray(req.body.imageAttachments) ? req.body.imageAttachments : [],
    tags,
    embedding: vec,
    updatedAt: new Date().toISOString()
  };

  if (usePostgres) {
    const vecStr = vec ? `[${vec.join(',')}]` : null;
    await pgPool.query(
      `INSERT INTO rag_knowledge (id, title, category, type, content, table_data, image_attachments, tags, embedding, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newItem.id, newItem.title, newItem.category, newItem.type, newItem.content,
        JSON.stringify(newItem.tableData), JSON.stringify(newItem.imageAttachments),
        JSON.stringify(newItem.tags), vecStr, newItem.updatedAt
      ]
    );
  } else {
    const jsonStore = loadJsonRag();
    jsonStore.unshift(newItem);
    saveJsonRag(jsonStore);
  }

  await invalidateRagCache();
  res.json({ ok: true, data: newItem });
});

app.put('/api/admin/rag/:id', async (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const category = req.body.category;
  const content = req.body.content;
  const tags = req.body.tags;

  const textToEmbed = `${title || ''} ${category || ''} ${content || ''} ${(tags || []).join(' ')}`;
  const vec = await getEmbedding(textToEmbed);

  if (usePostgres) {
    const vecStr = vec ? `[${vec.join(',')}]` : null;
    await pgPool.query(
      `UPDATE rag_knowledge
       SET title = $1, category = $2, type = $3, content = $4, table_data = $5, image_attachments = $6, tags = $7, embedding = $8, updated_at = $9
       WHERE id = $10`,
      [
        req.body.title, req.body.category, req.body.type, req.body.content,
        JSON.stringify(req.body.tableData), JSON.stringify(req.body.imageAttachments),
        JSON.stringify(req.body.tags), vecStr, new Date().toISOString(), id
      ]
    );
  } else {
    const jsonStore = loadJsonRag();
    const index = jsonStore.findIndex(item => item.id === id);
    if (index !== -1) {
      jsonStore[index] = {
        ...jsonStore[index],
        ...req.body,
        embedding: vec,
        updatedAt: new Date().toISOString()
      };
      saveJsonRag(jsonStore);
    }
  }

  await invalidateRagCache();
  res.json({ ok: true });
});

app.delete('/api/admin/rag/:id', async (req, res) => {
  const id = req.params.id;
  if (usePostgres) {
    await pgPool.query('DELETE FROM rag_knowledge WHERE id = $1', [id]);
  } else {
    const jsonStore = loadJsonRag().filter(item => item.id !== id);
    saveJsonRag(jsonStore);
  }

  await invalidateRagCache();
  res.json({ ok: true });
});

app.post('/api/admin/rag/search', async (req, res) => {
  const query = req.body?.query || '';
  console.log(`🌐 [/api/admin/rag/search] Received search query: "${query}"`);
  const matches = await searchRagEngine(query, 5);
  console.log(`📤 [/api/admin/rag/search] Returning ${matches.length} matches`);
  res.json({ ok: true, matches });
});

app.get('/api/admin/models', async (_req, res) => {
  if (!globalOpenAIClient) {
    return res.json({ ok: false, error: 'No API Key configured', models: [] });
  }
  try {
    const list = await globalOpenAIClient.models.list();
    const models = (list.data || []).map(m => m.id).sort();
    res.json({
      ok: true,
      baseUrl: aiBaseUrl,
      currentDefaultModel: defaultModel,
      currentFastModel: fastModel,
      models
    });
  } catch (err) {
    res.json({
      ok: false,
      baseUrl: aiBaseUrl,
      currentDefaultModel: defaultModel,
      currentFastModel: fastModel,
      error: err.message,
      models: [defaultModel, fastModel]
    });
  }
});

app.post('/api/admin/upload-image', (req, res) => {
  const { base64Data, filename } = req.body || {};
  if (!base64Data || !filename) {
    return res.status(400).json({ ok: false, error: 'base64Data and filename required' });
  }

  try {
    const cleanFilename = `${Date.now()}_${filename.replace(/[^\w.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, cleanFilename);
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    fs.writeFileSync(filePath, buffer);
    const fileUrl = `http://localhost:${process.env.PORT || 3001}/uploads/${cleanFilename}`;
    
    res.json({
      ok: true,
      attachment: {
        name: filename,
        url: fileUrl,
        caption: filename.replace(/\.[^/.]+$/, '')
      }
    });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

// --- Word Frequency Analytics Persistence API ---
const wordAnalyticsFilePath = path.join(dataDir, 'word_analytics.json');

const loadWordAnalyticsData = () => {
  if (!fs.existsSync(wordAnalyticsFilePath)) {
    return {
      analyzedMessageIds: [],
      wordCounts: {},
      totalAnalyzedCount: 0,
      lastAnalyzedAt: null
    };
  }
  try {
    return JSON.parse(fs.readFileSync(wordAnalyticsFilePath, 'utf8'));
  } catch {
    return {
      analyzedMessageIds: [],
      wordCounts: {},
      totalAnalyzedCount: 0,
      lastAnalyzedAt: null
    };
  }
};

const saveWordAnalyticsData = (data) => {
  try {
    fs.writeFileSync(wordAnalyticsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save word analytics data:', err);
  }
};

app.get('/api/admin/word-analytics', (_req, res) => {
  const data = loadWordAnalyticsData();
  res.json({ ok: true, data });
});

app.post('/api/admin/word-analytics', (req, res) => {
  const { data } = req.body || {};
  if (data) {
    saveWordAnalyticsData(data);
    return res.json({ ok: true, data });
  }
  res.status(400).json({ ok: false, error: 'Analytics data payload missing' });
});

// --- User Sessions Persistence & Cache APIs ---
const sessionsFilePath = path.join(dataDir, 'user_sessions.json');

const loadJsonSessions = () => {
  if (!fs.existsSync(sessionsFilePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(sessionsFilePath, 'utf8'));
  } catch {
    return {};
  }
};

const saveJsonSessions = (data) => {
  try {
    fs.writeFileSync(sessionsFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save user sessions JSON:', e);
  }
};

app.get('/api/user/sessions', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username is required' });

  if (usePostgres) {
    try {
      const dbRes = await pgPool.query(
        'SELECT id, title, messages, created_at AS "createdAt", updated_at AS "updatedAt" FROM chat_sessions WHERE username = $1 ORDER BY updated_at DESC',
        [username]
      );
      return res.json({ ok: true, sessions: dbRes.rows });
    } catch (e) {
      console.error('PostgreSQL session fetch error, fallback to JSON:', e);
    }
  }

  const allJson = loadJsonSessions();
  const userSessions = allJson[username] || [];
  res.json({ ok: true, sessions: userSessions });
});

app.post('/api/user/sessions', async (req, res) => {
  const { username, sessions } = req.body || {};
  if (!username || !Array.isArray(sessions)) {
    return res.status(400).json({ ok: false, error: 'Username and sessions array required' });
  }

  if (usePostgres) {
    try {
      for (const s of sessions) {
        await pgPool.query(
          `INSERT INTO chat_sessions (id, username, title, messages, updated_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE
           SET title = EXCLUDED.title, messages = EXCLUDED.messages, updated_at = EXCLUDED.updated_at`,
          [s.id, username, s.title, JSON.stringify(s.messages), s.updatedAt || new Date().toISOString()]
        );
      }
    } catch (e) {
      console.error('PostgreSQL session save error:', e);
    }
  }

  const allJson = loadJsonSessions();
  allJson[username] = sessions;
  saveJsonSessions(allJson);

  res.json({ ok: true, count: sessions.length });
});

app.delete('/api/user/sessions/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  const username = req.query.username;
  if (!username || !sessionId) {
    return res.status(400).json({ ok: false, error: 'Username and sessionId are required' });
  }

  if (usePostgres) {
    try {
      await pgPool.query('DELETE FROM chat_sessions WHERE id = $1 AND username = $2', [sessionId, username]);
    } catch (e) {
      console.error('PostgreSQL session delete error:', e);
    }
  }

  const allJson = loadJsonSessions();
  if (allJson[username]) {
    allJson[username] = allJson[username].filter(s => s.id !== sessionId);
    saveJsonSessions(allJson);
  }

  res.json({ ok: true });
});

// ==========================================
// User Background Profile & Personal RAG Memory Layer
// ==========================================
const userProfilesFilePath = path.join(dataDir, 'user_profiles.json');
const userPersonalRagFilePath = path.join(dataDir, 'user_personal_rag.json');

const loadJsonProfiles = () => {
  if (!fs.existsSync(userProfilesFilePath)) return {};
  try { return JSON.parse(fs.readFileSync(userProfilesFilePath, 'utf8')); } catch { return {}; }
};
const saveJsonProfiles = (data) => {
  try { fs.writeFileSync(userProfilesFilePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Profile save err:', e); }
};

const loadJsonPersonalRag = () => {
  if (!fs.existsSync(userPersonalRagFilePath)) return {};
  try { return JSON.parse(fs.readFileSync(userPersonalRagFilePath, 'utf8')); } catch { return {}; }
};
const saveJsonPersonalRag = (data) => {
  try { fs.writeFileSync(userPersonalRagFilePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Personal RAG save err:', e); }
};

const getUserProfile = async (username) => {
  if (!username) return null;
  if (usePostgres) {
    try {
      const res = await pgPool.query('SELECT profile FROM users WHERE username = $1', [username]);
      if (res.rows.length && res.rows[0].profile) {
        return res.rows[0].profile;
      }
    } catch (e) {
      console.warn('PG profile fetch error, fallback:', e.message);
    }
  }
  const profiles = loadJsonProfiles();
  return profiles[username] || null;
};

const searchUserPersonalRagEngine = async (username, query = '', topK = 3) => {
  if (!username || !query || !query.trim()) return [];
  const queryVector = await getEmbedding(query);
  const qTokens = extractMeaningfulTokens(query);
  
  let personalStore = [];
  if (usePostgres) {
    try {
      const res = await pgPool.query('SELECT * FROM user_personal_rag WHERE username = $1 ORDER BY created_at DESC', [username]);
      personalStore = res.rows.map(r => ({
        id: r.id,
        username: r.username,
        title: r.title,
        category: r.category,
        type: r.type,
        content: r.content,
        tags: r.tags || [],
        embedding: r.embedding ? (typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding) : null,
        createdAt: r.created_at
      }));
    } catch (e) {
      const allRag = loadJsonPersonalRag();
      personalStore = allRag[username] || [];
    }
  } else {
    const allRag = loadJsonPersonalRag();
    personalStore = allRag[username] || [];
  }

  if (!personalStore.length) return [];

  const scored = personalStore.map(item => {
    let score = 0;
    if (queryVector && item.embedding) {
      const vecSim = cosineSimilarity(queryVector, item.embedding);
      if (vecSim >= 0.50) {
        score += ((vecSim - 0.50) / 0.50) * 8.0;
      }
    }
    const docTokens = extractMeaningfulTokens(`${item.title} ${item.content}`);
    let matchedTokenCount = 0;
    for (const qt of qTokens) {
      if (docTokens.includes(qt)) matchedTokenCount++;
    }
    score += matchedTokenCount * 2.5;

    return { item, score: Math.max(0, score) };
  });

  const MIN_ABSOLUTE_SCORE = 4.5;
  const validMatches = scored
    .filter(s => s.score >= MIN_ABSOLUTE_SCORE)
    .sort((a, b) => b.score - a.score);

  if (validMatches.length === 0) return [];

  const maxScore = validMatches[0].score;
  return validMatches
    .filter(s => s.score >= maxScore * 0.70)
    .slice(0, topK);
};

const saveUserPersonalMemory = async (username, content, title = '对话偏好提炼', category = '个人偏好') => {
  if (!username || !content || content.length < 5) return;
  const textToEmbed = `${title} ${category} ${content}`;
  const vec = await getEmbedding(textToEmbed);

  const newItem = {
    id: `personal-rag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username,
    title,
    category,
    type: 'text',
    content,
    tags: ['个人档案', category],
    embedding: vec,
    createdAt: new Date().toISOString()
  };

  if (usePostgres) {
    try {
      const vecStr = vec ? `[${vec.join(',')}]` : null;
      await pgPool.query(
        `INSERT INTO user_personal_rag (id, username, title, category, type, content, tags, embedding, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [newItem.id, username, newItem.title, newItem.category, newItem.type, newItem.content, JSON.stringify(newItem.tags), vecStr, newItem.createdAt]
      );
    } catch (e) {
      console.warn('PG personal RAG insert warning:', e.message);
    }
  }

  const allRag = loadJsonPersonalRag();
  if (!allRag[username]) allRag[username] = [];
  allRag[username].unshift(newItem);
  saveJsonPersonalRag(allRag);
  return newItem;
};

// --- Profile APIs ---
app.get('/api/user/profile', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username required' });
  const profile = await getUserProfile(username);
  res.json({ ok: true, profile });
});

app.post('/api/user/profile', async (req, res) => {
  const { username, profile } = req.body || {};
  if (!username || !profile) return res.status(400).json({ ok: false, error: 'Username and profile required' });

  const scoreNum = Number(profile.score) || 0;
  const rankNum = Number(profile.rank) || 0;
  const isVip = scoreNum > 580;

  const updatedProfile = {
    ...profile,
    score: scoreNum,
    rank: rankNum,
    isVip,
    updatedAt: new Date().toISOString()
  };

  if (usePostgres) {
    try {
      await pgPool.query(
        `UPDATE users SET profile = $1 WHERE username = $2`,
        [JSON.stringify(updatedProfile), username]
      );
    } catch (e) {
      console.error('PG profile update err:', e);
    }
  }

  const profiles = loadJsonProfiles();
  profiles[username] = updatedProfile;
  saveJsonProfiles(profiles);

  // If VIP (>580), auto create initial background memory snippet in personal RAG
  if (isVip) {
    saveUserPersonalMemory(
      username,
      `学生个人基础背景资料：姓名【${updatedProfile.name || username}】，省份【${updatedProfile.province}】，高考成绩【${updatedProfile.score}分】，全省排名【第${updatedProfile.rank}名】，选科【${updatedProfile.subjects}】，特殊情况说明【${updatedProfile.specialConditions || '无'}】`,
      '个人基础背景档案',
      'VIP基本资料'
    ).catch(() => {});
  }

  res.json({ ok: true, profile: updatedProfile });
});

// --- Personal RAG API ---
app.get('/api/user/personal-rag', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username required' });
  let items = [];
  if (usePostgres) {
    try {
      const dbRes = await pgPool.query('SELECT * FROM user_personal_rag WHERE username = $1 ORDER BY created_at DESC', [username]);
      items = dbRes.rows;
    } catch {
      items = (loadJsonPersonalRag()[username]) || [];
    }
  } else {
    items = (loadJsonPersonalRag()[username]) || [];
  }
  res.json({ ok: true, items });
});

// ==========================================
// OpenAI Agents SDK Tool Definitions
// ==========================================

// 1. Campus Fact & RAG Knowledge Search Tool
const searchCampusKnowledgeTool = tool({
  name: 'searchCampusKnowledge',
  description: '查询广州大学及校方权威事实数据库（RAG）。当考生或家长询问具体省份的历年高考录取分数线、排位对照、各专业特色与要求、宿舍环境配置与实景图片、学费标准及“奖助贷勤补”资助政策等校方权威事实数据时，必须调用此工具获取准确数据。日常寒暄、问候、常规通识分析切勿调用此工具。',
  parameters: z.object({
    query: z.string().describe('用于校方知识库检索的高密度核心关键词。请去除用户口语中的废话（如“我想了解”、“请问”），提取精准实体与属性词，例如：“浙江 计算机 录取分数线”、“四人间宿舍配置 空调 独卫”、“工科 学费 奖学金”'),
  }),
  execute: async ({ query }) => {
    console.log(`🔍 [Agent Tool Call] searchCampusKnowledge with query: "${query}"`);
    const ragMatches = await searchRagEngine(query, 3);
    if (!ragMatches || ragMatches.length === 0) {
      return '校方数据库中暂未检索到直接匹配的条目。请结合通用招生指导常识进行解答，并提示学生关注招生办官方发布。';
    }
    return formatRagContext(ragMatches);
  },
});

// 2. VIP Personal Memory Search Tool
const searchPersonalMemoryTool = tool({
  name: 'searchPersonalMemory',
  description: '查询当前考生的专属历史咨询偏好与背景记忆档案（仅在需要回顾该考生的历史诉求、家庭经济偏好、特殊意向时调用）。',
  parameters: z.object({
    username: z.string().describe('当前考生的用户名'),
    query: z.string().describe('需要检索的历史偏好关键词，如“意向城市”、“目标专业”、“家庭预算”'),
  }),
  execute: async ({ username, query }) => {
    if (!username) return '未提供考生用户名';
    console.log(`🧠 [Agent Tool Call] searchPersonalMemory for "${username}" with query: "${query}"`);
    const matches = await searchUserPersonalRagEngine(username, query, 3);
    if (!matches || matches.length === 0) return '暂无该考生的历史偏好记录。';
    return matches.map(m => `- ${m.item.title} (${m.item.category}): ${m.item.content}`).join('\n');
  },
});

// 3. Save User Preference Tool
const saveUserPreferenceTool = tool({
  name: 'saveUserPreference',
  description: '当考生在对话中表达了明确的志愿意向、专业兴趣、目标城市、家庭预算或特殊报考诉求时，调用此工具将该偏好沉淀记录到考生专属档案中。',
  parameters: z.object({
    username: z.string().describe('考生的用户名'),
    preference: z.string().describe('提炼出的考生具体偏好内容，例如“倾向留在大湾区就业，优先考虑计算机或人工智能专业”'),
    category: z.string().default('志愿偏好').describe('偏好分类，如“专业偏好”、“地域偏好”、“家庭经济”'),
  }),
  execute: async ({ username, preference, category }) => {
    if (!username || !preference) return '保存失败：缺少用户名或偏好内容';
    console.log(`💾 [Agent Tool Call] saveUserPreference for "${username}": "${preference}" (${category})`);
    await saveUserPersonalMemory(username, preference, '考生偏好沉淀', category);
    return '已成功记录考生的报考偏好。';
  },
});

const defaultAgentModel = defaultModel;

const createAdmissionsAgent = (userProfile, username) => {
  let instructions = ADMISSIONS_SYSTEM_PROMPT;
  if (userProfile) {
    instructions += `\n\n【当前咨询学生背景资料】：
- 姓名：${userProfile.name || username || '未填'}
- 性别：${userProfile.gender || '未填'}
- 手机号：${userProfile.phone || '未填'}
- 高考省份：${userProfile.province || '未填'}
- 高考分数：${userProfile.score || '未填'} 分
- 全省排名：${userProfile.rank ? `第 ${userProfile.rank} 名` : '未填'}
- 选科情况：${userProfile.subjects || '未填'}
- 特殊情况说明：${userProfile.specialConditions || '无'}
${userProfile.isVip || (typeof userProfile.score === 'number' && userProfile.score > 580) ? '✨ 该学生为 VIP 优先保障咨询用户 (高考成绩 > 580分)，请针对其高考位次及个性化喜好提供定制化报考方案！' : ''}`;
  }

  instructions += `\n\n【智能体自主决策与工具调用指引】：
1. **按需 RAG 检索（核心原则）**：
   - 遇到询问具体省份录取分数线、排位比对、特定专业详情、宿舍环境配置与实景图片、学费标准与奖助学金政策等具体事实时，**必须主动调用 searchCampusKnowledge 工具**查询校方真实数据，严禁凭空编造事实或数据。
2. **日常对话零工具**：
   - 遇到打招呼（如“你好”、“在吗”）、礼貌问候、或者通识性选专业方法论（如张雪峰式实用分析方法、冷热门专业宏观趋势）等通用咨询时，**直接依据知识储备进行解答，绝不调用 searchCampusKnowledge 工具**。
3. **偏好沉淀**：
   - 考生在对话中表明了明确的报考诉求或家庭情况（例如“我只想去广州读大学”、“以后想考公或者进国企”），可主动调用 saveUserPreference 工具沉淀记录。
4. **图片展示规范**：
   - 若知识检索工具返回中包含 Markdown 图片链接（\`![caption](url)\`），请在回复中原样保留并自然展现给用户。`;

  return new Agent({
    name: 'Dr. Elena - Admissions Advisor',
    instructions,
    model: defaultAgentModel,
    tools: [searchCampusKnowledgeTool, searchPersonalMemoryTool, saveUserPreferenceTool],
  });
};

// --- Chat Endpoint with Agent Workflow Integration ---
app.post('/api/aura/chat', async (req, res) => {
  const username = req.body?.username || '';
  const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const lastUserMsg = [...incomingMessages].reverse().find(m => m.role === 'user')?.content || '';

  // Retrieve user background profile
  let userProfile = req.body?.userProfile || null;
  if (username && !userProfile) {
    userProfile = await getUserProfile(username);
  }

  // 1. Check Low Score Rule (< 450 -> Service Busy Lock)
  if (userProfile && typeof userProfile.score === 'number' && userProfile.score > 0 && userProfile.score < 450) {
    return res.json({
      ok: true,
      isBusy: true,
      reply: `⚠️ **系统通知**：当前招生咨询队列正忙，请稍后再试。\n\n您目前填报的高考分数为 **${userProfile.score} 分**（低于450分基础咨询段），系统正优先分配计算资源处理高并发位次咨询，感谢您的理解与配合！`,
      source: 'low-score-busy-lock'
    });
  }

  const hasRemoteKey = Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);

  // 2. If no remote API key, serve local response using RAG context
  if (!hasRemoteKey) {
    const ragMatches = await searchRagEngine(lastUserMsg, 3);
    if (ragMatches.length) {
      const topMatch = ragMatches[0].item;
      let reply = `根据校方数据库核对：\n\n### 📌 ${topMatch.title}\n${topMatch.content}\n\n`;

      if (topMatch.tableData && topMatch.tableData.columns && topMatch.tableData.rows) {
        reply += `| ${topMatch.tableData.columns.join(' | ')} |\n`;
        reply += `| ${topMatch.tableData.columns.map(() => '---').join(' | ')} |\n`;
        topMatch.tableData.rows.forEach(r => {
          reply += `| ${r.join(' | ')} |\n`;
        });
        reply += `\n`;
      }

      if (topMatch.imageAttachments && topMatch.imageAttachments.length) {
        topMatch.imageAttachments.forEach(img => {
          reply += `![${img.caption || img.name}](${img.url})\n`;
        });
      }

      return res.json({ ok: true, reply, source: 'local-bge-rag-db' });
    }

    return res.json({
      ok: true,
      reply: `同学/家长您好！我是招生咨询顾问 **Dr. Elena**。✨\n\n关于您咨询的“${lastUserMsg}”，您可以向我询问广州大学热门专业录取分数线、四人间宿舍环境配置或学费与资助政策，我会随时为您解答！`,
      source: 'local-fallback'
    });
  }

  // 3. Run @openai/agents Autonomous Agent Workflow
  try {
    const agent = createAdmissionsAgent(userProfile, username);

    const inputItems = incomingMessages
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .map((m) => {
        if (m.role === 'assistant') return assistant(m.content);
        return user(m.content);
      });

    if (inputItems.length === 0 && lastUserMsg) {
      inputItems.push(user(lastUserMsg));
    }

    console.log(`🤖 [Agent Run] Executing Admissions Agent for user: ${username || 'anonymous'}`);
    const runResult = await run(agent, inputItems);

    const reply = runResult.finalOutput || '我刚刚有点走神了，您可以再说一次吗？';

    let calledRagTool = false;
    if (Array.isArray(runResult.newItems)) {
      calledRagTool = runResult.newItems.some(item => {
        const name = item.name || item.toolName || item.tool?.name || item.function?.name || item.rawItem?.name;
        return name === 'searchCampusKnowledge' || JSON.stringify(item).includes('searchCampusKnowledge');
      });
    }

    res.json({
      ok: true,
      reply,
      source: calledRagTool ? 'openai-agents-rag-tool' : 'openai-agents-direct'
    });
  } catch (error) {
    console.error('⚠️ [Agent Run Error]:', error);

    // Fallback to local RAG knowledge match on failure
    const ragMatches = await searchRagEngine(lastUserMsg, 3);
    const ragContext = formatRagContext(ragMatches);

    res.json({
      ok: true,
      reply: ragContext ? `根据校方数据库为您查找到以下信息：\n\n${ragContext}` : '服务响应稍慢，请再次发送请求。',
      source: 'rag-fallback'
    });
  }
});

if (fs.existsSync(distDir)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}



const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`🚀 Gzadm Navigator Admissions AI Engine listening instantly on http://localhost:${port} & http://127.0.0.1:${port}`);

  // Asynchronous background initializations so port 3001 is open IMMEDIATELY (< 50ms)
  (async () => {
    await initEmbedder();
    await initPostgres();
    await initRedis();
  })();
});



setInterval(() => {}, 1000 * 60 * 60);