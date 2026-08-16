import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from 'redis';
import { env, pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const distDir = path.join(__dirname, 'dist');
const ragFilePath = path.join(dataDir, 'rag_knowledge.json');
const usersFilePath = path.join(dataDir, 'users.json');
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

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(modelsCacheDir, { recursive: true });

const AUTH_PASSWORD_SALT = process.env.AUTH_PASSWORD_SALT || 'gzadm-navigator-auth-salt-v1';
const AUTH_PASSWORD_ITERATIONS = 120000;

const normalizeUsername = (value) => String(value ?? '').trim();
const normalizePassword = (value) => String(value ?? '').trim();
const hashPassword = (password) => {
  const digest = crypto.pbkdf2Sync(normalizePassword(password), AUTH_PASSWORD_SALT, AUTH_PASSWORD_ITERATIONS, 64, 'sha512').toString('hex');
  return `pbkdf2$${AUTH_PASSWORD_ITERATIONS}$${digest}`;
};

const verifyPassword = (password, storedHash) => {
  if (!storedHash) return { valid: false, legacy: false, hash: hashPassword(password) };
  if (!String(storedHash).startsWith('pbkdf2$')) {
    const hash = hashPassword(password);
    return { valid: storedHash === normalizePassword(password), legacy: true, hash };
  }

  const hash = hashPassword(password);
  const expected = Buffer.from(hash.split('$')[2], 'hex');
  const actual = Buffer.from(String(storedHash).split('$')[2] || '', 'hex');
  return {
    valid: expected.length === actual.length && crypto.timingSafeEqual(expected, actual),
    legacy: false,
    hash
  };
};

const sanitizeAuthUser = (user) => ({
  username: normalizeUsername(user.username),
  role: user.role || 'user',
  createdAt: user.created_at || user.createdAt || null
});

const loadJsonUsers = () => {
  const defaultUsers = [{ username: 'admin', password: hashPassword('admin123'), role: 'admin', createdAt: new Date().toISOString() }];
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify(defaultUsers, null, 2), 'utf8');
    return defaultUsers;
  }
  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    return Array.isArray(users) ? users : defaultUsers;
  } catch {
    return defaultUsers;
  }
};

const saveJsonUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
};

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
    topic: '招生录取',
    intentTags: ['录取', '分数线', '排位', '招生政策'],
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
    topic: '食宿',
    intentTags: ['宿舍', '住宿', '房型', '生活服务'],
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
    topic: '学费资助',
    intentTags: ['学费', '奖学金', '助学金', '资助'],
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
let databaseReady = Promise.resolve();

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
        topic VARCHAR(50),
        intent_tags JSONB,
        type VARCHAR(50) NOT NULL DEFAULT 'text',
        content TEXT,
        table_data JSONB,
        image_attachments JSONB,
        tags JSONB,
        embedding vector(512),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE rag_knowledge ADD COLUMN IF NOT EXISTS topic VARCHAR(50);
      ALTER TABLE rag_knowledge ADD COLUMN IF NOT EXISTS intent_tags JSONB;

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

    // Seed admin user with the same hash format used by registration and login.
    await pgPool.query(`
      INSERT INTO users (username, password, role)
      VALUES ('admin', $1, 'admin')
      ON CONFLICT (username) DO NOTHING;
    `, [hashPassword('admin123')]);
    await pgPool.query(
      `UPDATE users SET password = $1 WHERE username = 'admin' AND password = 'admin123'`,
      [hashPassword('admin123')]
    );

    // Seed RAG items with embeddings
    const countRes = await pgPool.query('SELECT COUNT(*) FROM rag_knowledge');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      for (const item of DEFAULT_RAG_KNOWLEDGE) {
        const textToEmbed = `${item.title} ${item.category} ${item.content} ${item.tags.join(' ')}`;
        const vec = await getEmbedding(textToEmbed);
        const vecStr = vec ? `[${vec.join(',')}]` : null;

        await pgPool.query(
          `INSERT INTO rag_knowledge (id, title, category, topic, intent_tags, type, content, table_data, image_attachments, tags, embedding, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            item.id, item.title, item.category, item.topic, JSON.stringify(item.intentTags), item.type, item.content,
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
    const parsed = JSON.parse(fs.readFileSync(ragFilePath, 'utf8'));
    const normalized = Array.isArray(parsed) ? parsed.map(normalizeRagItem) : DEFAULT_RAG_KNOWLEDGE;
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      fs.writeFileSync(ragFilePath, JSON.stringify(normalized, null, 2), 'utf8');
    }
    return normalized;
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
        topic: r.topic || null,
        intentTags: r.intent_tags || [],
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


const getCache = async (key) => {
  if (useRedis && redisClient?.isOpen) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }
  const mem = memoryCache.get(key);
  if (mem && mem.expire > Date.now()) return mem.value;
  return null;
};

const setCache = async (key, val, ttlSeconds = 600) => {
  if (useRedis && redisClient?.isOpen) {
    try {
      await redisClient.set(key, JSON.stringify(val), { EX: ttlSeconds });
      return;
    } catch {}
  }
  memoryCache.set(key, { value: val, expire: Date.now() + ttlSeconds * 1000 });
};

const invalidateRagCache = async () => {
  if (useRedis && redisClient?.isOpen) {
    try {
      const keys = await redisClient.keys('rag:*');
      if (keys.length) await redisClient.del(keys);
    } catch {}
  }
  memoryCache.clear();
};

// ==========================================
// 4. Dense Vector + Hybrid Search Engine
// ==========================================
const RAG_TOPICS = Object.freeze({
  TRAVEL: '校园出行',
  MAJOR: '学院专业',
  HOUSING: '食宿',
  TUITION: '学费资助',
  ADMISSIONS: '招生录取',
  CAMPUS_LIFE: '校园生活',
  GENERAL: '综合'
});

const RAG_TOPIC_RULES = [
  {
    topic: RAG_TOPICS.MAJOR,
    // Explicit major/department wording wins over the generic word "交通".
    patterns: [/交通工程|交通运输|交通专业|交通学院|轨道交通专业|道路桥梁/, /学院|专业|学科|就业|考研|培养方案|课程体系/],
    tags: ['学院', '专业', '学科', '就业', '考研', '课程']
  },
  {
    topic: RAG_TOPICS.TRAVEL,
    patterns: [/交通怎么样|交通方便|怎么去|如何到校|地铁|公交|通勤|出行|校内代步|骑行|自行车|路况|停车|打车|接驳|进校|校门|交通安全/],
    tags: ['交通', '地铁', '公交', '通勤', '出行', '路况', '停车', '接驳', '进校']
  },
  {
    topic: RAG_TOPICS.HOUSING,
    patterns: [/宿舍|住宿|房型|床位|洗衣|热水|食堂|餐厅|吃饭|就餐|食宿|生活区/],
    tags: ['宿舍', '住宿', '房型', '食堂', '餐厅', '生活服务']
  },
  {
    topic: RAG_TOPICS.TUITION,
    patterns: [/学费|奖学金|助学金|资助|贷款|收费|缴费/],
    tags: ['学费', '奖学金', '助学金', '资助', '收费']
  },
  {
    topic: RAG_TOPICS.ADMISSIONS,
    patterns: [/录取|分数|排位|招生|志愿|报考|录取线|报名|政策/],
    tags: ['录取', '分数', '排位', '招生', '志愿', '报考', '政策']
  },
  {
    topic: RAG_TOPICS.CAMPUS_LIFE,
    patterns: [/社团|校园生活|快递|医疗|体育|运动|图书馆|自习|校园卡|办事|校区/],
    tags: ['社团', '校园生活', '快递', '医疗', '体育', '图书馆', '校园卡']
  }
];

const normalizeRagText = (value) => String(value || '').toLowerCase().replace(/\s+/g, ' ');

const classifyRagIntent = (query = '') => {
  const normalized = normalizeRagText(query);
  // Check explicit major language before generic travel language so
  // "交通专业" is never treated as a question about commuting.
  for (const rule of RAG_TOPIC_RULES) {
    if (rule.patterns.some(pattern => pattern.test(normalized))) {
      return { topic: rule.topic, tags: rule.tags, confidence: rule.topic === RAG_TOPICS.MAJOR ? 'high' : 'medium' };
    }
  }
  return { topic: RAG_TOPICS.GENERAL, tags: [], confidence: 'low' };
};

const inferRagTopic = (item = {}) => {
  if (Object.values(RAG_TOPICS).includes(item.topic)) return item.topic;
  const titleTagsText = normalizeRagText(`${item.title || ''} ${(item.tags || []).join(' ')} ${item.category || ''}`);
  // Prefer the document title/tags. Content often quotes unrelated examples
  // and must not move a document into the wrong intent bucket.
  const titleRules = [
    [RAG_TOPICS.MAJOR, /交通工程|交通运输|交通专业|交通学院|轨道交通专业|道路桥梁|学院|专业|考研|就业率|升学率/],
    [RAG_TOPICS.TRAVEL, /交通|进校|校门|接驳|通勤|出行|路况|停车/],
    [RAG_TOPICS.HOUSING, /宿舍|住宿|房型|食堂|餐厅|食宿|生活区|楼栋|公共服务|生活设施/],
    [RAG_TOPICS.TUITION, /学费|奖学金|助学金|资助|收费/],
    [RAG_TOPICS.ADMISSIONS, /录取|分数|排位|招生|志愿填报|报考|报名|政策/],
    [RAG_TOPICS.CAMPUS_LIFE, /社团|选课|校园生活|快递|医疗|体育|运动|图书馆|校园卡|办事|校区|景点|商圈|夜市|防骗|历史/]
  ];
  const titleMatch = titleRules.find(([, pattern]) => pattern.test(titleTagsText));
  if (titleMatch) return titleMatch[0];
  const text = normalizeRagText(`${titleTagsText} ${item.content || ''}`);
  for (const rule of RAG_TOPIC_RULES.filter(rule => rule.topic !== RAG_TOPICS.MAJOR)) {
    if (rule.patterns.some(pattern => pattern.test(text))) return rule.topic;
  }
  return RAG_TOPICS.GENERAL;
};

const normalizeRagItem = (item = {}) => {
  const topic = inferRagTopic(item);
  const topicRule = RAG_TOPIC_RULES.find(rule => rule.topic === topic);
  const intentTags = Array.from(new Set([
    ...(Array.isArray(item.intentTags) ? item.intentTags : []),
    ...(topicRule?.tags || [])
  ]));
  return { ...item, topic, intentTags };
};

const searchRagEngine = async (query = '', topK = 3) => {
  const intent = classifyRagIntent(query);
  const queryHash = crypto.createHash('md5').update(`${intent.topic}:${query}`).digest('hex');
  const cacheKey = `rag:search:v2:${queryHash}`;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const queryVector = await getEmbedding(query);
  const ragStore = (await getRagStore()).map(normalizeRagItem);
  const candidates = intent.topic === RAG_TOPICS.GENERAL
    ? ragStore
    : ragStore.filter(item => item.topic === intent.topic || item.intentTags.some(tag => intent.tags.includes(tag)));
  const queryTerms = Array.from(new Set([
    ...intent.tags,
    ...normalizeRagText(query).split(/[，。！？、\s]+/).filter(term => term.length >= 2)
  ]));

  const scored = candidates.map((item) => {
    let score = 0;
    const itemText = normalizeRagText(`${item.title} ${item.category} ${item.content} ${(item.tags || []).join(' ')} ${(item.intentTags || []).join(' ')}`);

    // 1. Local BGE 512-dim Dense Vector Similarity (0 to 1)
    if (queryVector && item.embedding) {
      const vecSim = cosineSimilarity(queryVector, item.embedding);
      score += vecSim * 10;
    }

    // 2. Keyword Match Boost for Title, Tags, Image Names
    const qLower = normalizeRagText(query);
    if (item.title.toLowerCase().includes(qLower)) score += 4;
    if ((item.tags || []).some(t => qLower.includes(String(t).toLowerCase()))) score += 5;
    if ((item.imageAttachments || []).some(img => qLower.includes(img.name.toLowerCase()))) score += 5;
    score += queryTerms.filter(term => itemText.includes(normalizeRagText(term))).length * 1.25;
    if (item.topic === intent.topic && intent.topic !== RAG_TOPICS.GENERAL) score += 2;

    return { item, score };
  });

  const results = scored
    .filter(s => s.score >= (intent.topic === RAG_TOPICS.GENERAL ? 1.25 : 2.25))
    .sort((a, b) => b.score - a.score)
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

// Build a useful answer even when the LLM is unavailable. Keep the same
// structure as the prompted answer so the experience stays consistent.
const buildLocalRagReply = (query, ragResults) => {
  if (!ragResults.length) {
    return `## 核心结论\n\n抱歉，我目前的知识库中暂未收录关于“${query}”的具体信息。\n\n## 参考信息与数据\n\n当前没有足够的、可直接引用的资料，我不会用其他主题的信息代替回答。\n\n## 报考/咨询建议\n\n如果你愿意，请补充更具体的对象、时间或地区，我再帮你继续核对。`;
  }

  // The no-LLM path should still answer directly and avoid exposing retrieval mechanics.
  const topResult = ragResults[0]?.item;
  const relevantResults = ragResults
    .filter(({ score }, index) => index === 0 || score >= ragResults[0].score * 0.72)
    .slice(0, 3);
  let reply = `## 核心结论\n\n${topResult?.content || topResult?.title || '我找到了相关资料，但其中缺少可直接引用的正文。'}\n\n`;
  reply += `## 参考信息与数据\n\n`;

  relevantResults.forEach(({ item }, index) => {
    reply += `### ${index + 1}. ${item.title}\n`;
    if (item.content) reply += `${item.content}\n\n`;

    if (item.tableData?.columns?.length && item.tableData?.rows?.length) {
      reply += `| ${item.tableData.columns.join(' | ')} |\n`;
      reply += `| ${item.tableData.columns.map(() => '---').join(' | ')} |\n`;
      item.tableData.rows.forEach(row => {
        reply += `| ${row.join(' | ')} |\n`;
      });
      reply += '\n';
    }

    if (item.imageAttachments?.length) {
      item.imageAttachments.forEach(img => {
        reply += `![${img.caption || img.name}](${img.url})\n`;
      });
      reply += '\n';
    }
  });

  reply += `## 报考/咨询建议\n\n- 先用**省份 + 分数/位次 + 选科**核对是否满足专业要求，再比较不同专业的培养方向和就业出口。\n- 分数线只能作为参考，填报时建议按“冲、稳、保”分层，并预留专业调剂风险。\n- 学费、奖助和宿舍标准可能按年度调整，最终以当年招生章程和校方通知为准。\n\n## 继续帮你细化\n\n你可以告诉我所在省份、预估分数/位次、意向专业和预算，我会进一步给出匹配度、风险点和下一步清单。`;
  return reply;
};

const ADMISSIONS_SYSTEM_PROMPT = `
# 角色与目标
你是 Gzadm Navigator 的招生咨询 AI 顾问。你的任务是像一位有经验、耐心且会认真听问题的真人客服一样，帮助学生和家长理解广州大学及相关招生、专业、校园生活信息，并给出有依据的下一步建议。
始终使用自然、清楚、亲切的中文；先回应用户真正关心的事情，再补充必要背景。不要为了显得专业而堆砌资料或术语。

# 四项不可违反的回答原则
1. **拒绝机械模板**：直接回答问题，禁止使用“围绕XX，知识库检索到X条资料，下面整理出来……”及任何暴露检索过程的生硬开场。不要把“我检索了什么”当成回答内容。
2. **深度提炼与融合**：先理解用户的真实意图，再从参考资料中挑选有用事实，用自己的话综合成连贯答案。禁止把多条资料原样逐条拼接，也不要为了覆盖资料而重复同义内容。
3. **严格过滤无关噪音**：把参考资料视为待筛选的证据。逐条判断其是否直接回答当前问题；仅因共享一个关键词、属于邻近主题或与用户问题无关的资料必须丢弃，绝不能写入最终回答。资料之间有冲突时，指出冲突并优先采用时间更新、来源明确的内容。
4. **优雅的兜底机制**：如果筛选后没有足够资料准确回答，必须诚恳地说“抱歉，我目前的知识库中暂未收录关于XX的具体信息”（将 XX 替换为用户问题的简短主题），并说明需要补充什么；禁止编造、猜测精确数字或拿无关资料凑字数。

# 内部回答流程（不要向用户展示推理过程）
1. 判断问题意图、范围和时间要求；必要时识别用户是在问校园出行、学院专业、招生录取、学费资助、食宿，还是其他主题。
2. 审阅所有提供的知识库、个人资料和联网结果，只保留能直接支撑答案的证据；没有证据的判断标为不确定或省略。
3. 组织一段先给结论、再给关键依据、最后给行动建议的自然回复。简单问题保持简短，不强行套满所有小节。
4. 输出前做一次相关性自检：删除答非所问、重复、无来源推断和与当前主题无关的段落。

# 事实边界与格式
- 知识库中的事实、联网来源和经验建议必须明确区分；录取概率、就业、费用、政策等没有可靠数据时直说不确定。
- 相关图片附件可以使用 Markdown 图片语法 \`![说明](url)\`，但只能展示与当前问题直接相关的图片。
- 保持产品现有 Markdown 结构：适合时使用“## 核心结论”“## 参考信息与数据”“## 报考/咨询建议”等标题；标题是为了清晰，不是为了填充内容。
- 结尾最多提出 1~3 个真正有助于继续解决问题的补充问题，不要使用泛泛的客套话。
`.trim();

const ADMISSIONS_INTENT_GUARDRAILS = `
【问题意图与知识库使用规则】
1. 先判断用户真正想解决的问题，再使用知识库。用户说“交通怎么样”“交通方便吗”“怎么去学校”时，默认指校园通勤出行，只回答地铁、公交、到校路线、校内代步、路况、停车和接驳；不要引入学院、专业或电信学院内容。
2. 只有用户明确提到“交通工程、交通运输、交通专业、交通学院、轨道交通专业、道路桥梁”等专业语义时，才把问题归为学院专业并介绍学院或课程。
3. 回答前执行相关性自检：逐条检查参考资料是否直接服务于当前问题；不相关、仅共享一个泛词或属于其他主题的资料必须丢弃，不能写进答案。若没有足够相关资料，明确说明信息不足，不要用相邻主题补答案。
4. 对于校园出行问题，优先使用主题为“校园出行”的资料；学院专业、食宿、学费资助和招生录取资料不得混入，除非用户明确同时询问这些主题。
5. 保持既有输出结构，仍使用“核心结论”“参考信息与数据”“报考/咨询建议”等小节；结构不代表可以填入无关内容。
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

const findAuthUser = async (username) => {
  if (usePostgres) {
    const result = await pgPool.query(
      'SELECT id, username, password, role, created_at FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }
  return loadJsonUsers().find(user => normalizeUsername(user.username) === username) || null;
};

const migrateLegacyPassword = async (username, passwordHash) => {
  if (usePostgres) {
    await pgPool.query('UPDATE users SET password = $1 WHERE username = $2', [passwordHash, username]);
    return;
  }
  const users = loadJsonUsers();
  const index = users.findIndex(user => normalizeUsername(user.username) === username);
  if (index >= 0) {
    users[index].password = passwordHash;
    saveJsonUsers(users);
  }
};

app.post('/api/auth/register', async (req, res) => {
  await databaseReady;
  const username = normalizeUsername(req.body?.username);
  const password = normalizePassword(req.body?.password);
  if (!username || !password) {
    return res.status(400).json({ ok: false, code: 'MISSING_FIELDS', error: '账号和密码不能为空' });
  }
  if (username.toLowerCase() === 'admin') {
    return res.status(409).json({ ok: false, code: 'RESERVED_ACCOUNT', error: 'admin 为系统预设管理员保留账号' });
  }

  const passwordHash = hashPassword(password);
  console.debug(`[AUTH DEBUG] register username=${username} passwordHash=${passwordHash}`);

  try {
    if (usePostgres) {
      const result = await pgPool.query(
        `INSERT INTO users (username, password, role)
         VALUES ($1, $2, 'user')
         RETURNING username, role, created_at`,
        [username, passwordHash]
      );
      if (result.rowCount !== 1) {
        return res.status(500).json({ ok: false, code: 'PERSISTENCE_FAILED', error: '注册信息未成功写入数据库' });
      }
      return res.status(201).json({ ok: true, persisted: true, user: sanitizeAuthUser(result.rows[0]) });
    }

    const users = loadJsonUsers();
    if (users.some(user => normalizeUsername(user.username) === username)) {
      return res.status(409).json({ ok: false, code: 'ACCOUNT_EXISTS', error: '该账号名已被注册，请更换账号名' });
    }
    const newUser = { username, password: passwordHash, role: 'user', createdAt: new Date().toISOString() };
    users.push(newUser);
    saveJsonUsers(users);
    const persisted = loadJsonUsers().some(user => user.username === username && user.password === passwordHash);
    if (!persisted) {
      return res.status(500).json({ ok: false, code: 'PERSISTENCE_FAILED', error: '注册信息未成功保存' });
    }
    return res.status(201).json({ ok: true, persisted: true, user: sanitizeAuthUser(newUser) });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ ok: false, code: 'ACCOUNT_EXISTS', error: '该账号名已被注册，请更换账号名' });
    }
    console.error('[AUTH] registration persistence failed:', error);
    return res.status(500).json({ ok: false, code: 'PERSISTENCE_FAILED', error: '注册保存失败，请稍后重试' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  await databaseReady;
  const username = normalizeUsername(req.body?.username);
  const password = normalizePassword(req.body?.password);
  if (!username || !password) {
    return res.status(400).json({ ok: false, code: 'MISSING_FIELDS', error: '请输入账号和密码' });
  }

  try {
    const user = await findAuthUser(username);
    if (!user) {
      console.debug(`[AUTH DEBUG] login username=${username} accountHash=NOT_FOUND`);
      return res.status(404).json({ ok: false, code: 'ACCOUNT_NOT_FOUND', error: '账号不存在' });
    }

    const verification = verifyPassword(password, user.password);
    console.debug(`[AUTH DEBUG] login username=${username} passwordHash=${verification.hash} storedHash=${user.password}`);
    if (!verification.valid) {
      return res.status(401).json({ ok: false, code: 'PASSWORD_INVALID', error: '密码错误' });
    }

    if (verification.legacy) {
      await migrateLegacyPassword(username, verification.hash);
      console.debug(`[AUTH DEBUG] migrated legacy password username=${username} passwordHash=${verification.hash}`);
    }
    return res.json({ ok: true, authenticated: true, user: sanitizeAuthUser(user) });
  } catch (error) {
    console.error('[AUTH] login persistence failure:', error);
    return res.status(503).json({ ok: false, code: 'AUTH_SERVICE_UNAVAILABLE', error: '登录服务暂不可用，请稍后重试' });
  }
});

// --- Configurable model registry and lightweight web-search tool ---
const DEFAULT_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', endpoint: 'https://api.deepseek.com/chat/completions', apiKeyEnv: 'DEEPSEEK_API_KEY', supportsVision: false, temperature: 0.7, maxTokens: 4096 },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek', endpoint: 'https://api.deepseek.com/chat/completions', apiKeyEnv: 'DEEPSEEK_API_KEY', supportsVision: false, temperature: 0.4, maxTokens: 4096 },
  { id: 'openai-gpt-4o-mini', name: 'GPT-4o mini (OpenAI-compatible)', provider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', apiKeyEnv: 'OPENAI_API_KEY', supportsVision: true, temperature: 0.7, maxTokens: 4096 }
];
const modelConfigFilePath = path.join(dataDir, 'model_config.json');

const loadModelConfig = () => {
  try {
    const configured = process.env.MODEL_CONFIG_JSON ? JSON.parse(process.env.MODEL_CONFIG_JSON) : null;
    if (Array.isArray(configured) && configured.length) return configured;
  } catch {}
  try {
    const fileConfig = JSON.parse(fs.readFileSync(modelConfigFilePath, 'utf8'));
    if (Array.isArray(fileConfig) && fileConfig.length) return fileConfig;
  } catch {}
  return DEFAULT_MODELS;
};

const getModelConfig = (modelId) => {
  const models = loadModelConfig();
  return models.find(m => m.id === modelId) || models.find(m => m.id === process.env.DEFAULT_MODEL) || models[0];
};

const publicModel = (model) => ({
  id: model.id, name: model.name || model.id, provider: model.provider || 'openai-compatible',
  supportsVision: Boolean(model.supportsVision), temperature: Number(model.temperature ?? 0.7),
  maxTokens: Number(model.maxTokens ?? 4096), enabled: model.enabled !== false
});

app.get('/api/models', (_req, res) => res.json({ ok: true, models: loadModelConfig().filter(m => m.enabled !== false).map(publicModel), defaultModel: getModelConfig().id }));
app.get('/api/admin/models', (_req, res) => res.json({ ok: true, models: loadModelConfig() }));
app.put('/api/admin/models', (req, res) => {
  const models = req.body?.models;
  if (!Array.isArray(models) || !models.length) return res.status(400).json({ ok: false, error: 'A non-empty models array is required' });
  const sanitized = models.map(model => ({
    ...model,
    id: String(model.id || '').trim(),
    endpoint: String(model.endpoint || '').trim(),
    apiKey: undefined
  })).filter(model => model.id && model.endpoint);
  if (!sanitized.length) return res.status(400).json({ ok: false, error: 'Every model needs an id and endpoint' });
  try {
    fs.writeFileSync(modelConfigFilePath, JSON.stringify(sanitized, null, 2), 'utf8');
    res.json({ ok: true, models: sanitized });
  } catch { res.status(500).json({ ok: false, error: 'Failed to persist model configuration' }); }
});

const webSearch = async (query, limit = 5) => {
  const cleanQuery = String(query || '').trim().slice(0, 300);
  if (!cleanQuery) return [];
  const configuredUrl = process.env.WEB_SEARCH_URL;
  try {
    let payload;
    if (configuredUrl) {
      const url = configuredUrl.replace('{query}', encodeURIComponent(cleanQuery));
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: process.env.WEB_SEARCH_API_KEY ? { Authorization: `Bearer ${process.env.WEB_SEARCH_API_KEY}` } : {} });
      if (!response.ok) throw new Error(`web search ${response.status}`);
      payload = await response.json();
      const items = payload.results || payload.organic_results || payload.data || [];
      return items.slice(0, limit).map(item => ({ title: item.title || item.name || '', url: item.url || item.link || '', snippet: item.snippet || item.description || item.content || '' })).filter(item => item.title || item.snippet);
    }
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&no_redirect=1`, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Gzadm-Navigator/1.0' } });
    if (!response.ok) throw new Error(`DuckDuckGo ${response.status}`);
    payload = await response.json();
    const results = [];
    if (payload.AbstractText) results.push({ title: payload.Heading || cleanQuery, url: payload.AbstractURL || '', snippet: payload.AbstractText });
    (payload.RelatedTopics || []).forEach(topic => {
      if (topic.Text) results.push({ title: topic.Text.split(' - ')[0], url: topic.FirstURL || '', snippet: topic.Text });
      (topic.Topics || []).forEach(child => { if (child.Text) results.push({ title: child.Text.split(' - ')[0], url: child.FirstURL || '', snippet: child.Text }); });
    });
    return results.slice(0, limit);
  } catch (error) {
    console.warn('Web search unavailable:', error.message);
    return [];
  }
};

app.get('/api/search/web', async (req, res) => {
  const query = req.query.q || req.query.query || '';
  if (!String(query).trim()) return res.status(400).json({ ok: false, error: 'Query is required' });
  res.json({ ok: true, query, results: await webSearch(query, Number(req.query.limit) || 5) });
});
app.post('/api/search/web', async (req, res) => {
  const query = req.body?.query || req.body?.q || '';
  if (!String(query).trim()) return res.status(400).json({ ok: false, error: 'Query is required' });
  res.json({ ok: true, query, results: await webSearch(query, Number(req.body?.limit) || 5) });
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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      try {
        console.log('🤖 Sending document to DeepSeek LLM for AI Smart Semantic Chunking...');
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

        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3
          })
        });

        if (response.ok) {
          const payload = await response.json();
          const replyText = payload?.choices?.[0]?.message?.content?.trim() || '';
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

              return res.json({ ok: true, count: chunks.length, chunks, source: 'deepseek-ai' });
            }
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

    const newItem = normalizeRagItem({
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
    });

    if (usePostgres) {
      const vecStr = vec ? `[${vec.join(',')}]` : null;
      await pgPool.query(
        `INSERT INTO rag_knowledge (id, title, category, topic, intent_tags, type, content, table_data, image_attachments, tags, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newItem.id, newItem.title, newItem.category, newItem.topic, JSON.stringify(newItem.intentTags), newItem.type, newItem.content,
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

  const newItem = normalizeRagItem({
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
  });

  if (usePostgres) {
    const vecStr = vec ? `[${vec.join(',')}]` : null;
    await pgPool.query(
      `INSERT INTO rag_knowledge (id, title, category, topic, intent_tags, type, content, table_data, image_attachments, tags, embedding, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newItem.id, newItem.title, newItem.category, newItem.topic, JSON.stringify(newItem.intentTags), newItem.type, newItem.content,
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
  const normalizedItem = normalizeRagItem({ ...req.body, id, title, category, content, tags });

  const textToEmbed = `${title || ''} ${category || ''} ${content || ''} ${(tags || []).join(' ')}`;
  const vec = await getEmbedding(textToEmbed);

  if (usePostgres) {
    const vecStr = vec ? `[${vec.join(',')}]` : null;
    await pgPool.query(
      `UPDATE rag_knowledge
       SET title = $1, category = $2, topic = $3, intent_tags = $4, type = $5, content = $6, table_data = $7, image_attachments = $8, tags = $9, embedding = $10, updated_at = $11
       WHERE id = $12`,
      [
        req.body.title, req.body.category, normalizedItem.topic, JSON.stringify(normalizedItem.intentTags), req.body.type, req.body.content,
        JSON.stringify(req.body.tableData), JSON.stringify(req.body.imageAttachments),
        JSON.stringify(req.body.tags), vecStr, new Date().toISOString(), id
      ]
    );
  } else {
    const jsonStore = loadJsonRag();
    const index = jsonStore.findIndex(item => item.id === id);
    if (index !== -1) {
      jsonStore[index] = normalizeRagItem({
        ...jsonStore[index],
        ...req.body,
        embedding: vec,
        updatedAt: new Date().toISOString()
      });
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
  const query = req.body.query || '';
  const matches = await searchRagEngine(query, 5);
  res.json({ ok: true, matches });
});

const handleImageUpload = (req, res) => {
  const { base64Data, filename } = req.body || {};
  if (!base64Data || !filename) {
    return res.status(400).json({ ok: false, error: 'base64Data and filename required' });
  }

  try {
    const match = String(base64Data).match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return res.status(400).json({ ok: false, error: 'Only PNG, JPEG, WEBP and GIF images are supported' });
    const cleanFilename = `${Date.now()}_${filename.replace(/[^\w.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, cleanFilename);
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > 4 * 1024 * 1024) return res.status(413).json({ ok: false, error: 'Image must be smaller than 4MB' });

    fs.writeFileSync(filePath, buffer);
    const origin = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${origin}/uploads/${cleanFilename}`;
    
    res.json({
      ok: true,
      attachment: {
        name: filename,
        url: fileUrl,
        type: 'image',
        mimeType: match[1],
        caption: filename.replace(/\.[^/.]+$/, '')
      }
    });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ ok: false, error: 'Upload failed' });
  }
};

app.post('/api/admin/upload-image', handleImageUpload);
app.post('/api/user/upload-image', handleImageUpload);

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
const sessionPreferencesFilePath = path.join(dataDir, 'session_preferences.json');

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

const loadSessionPreferences = () => {
  if (!fs.existsSync(sessionPreferencesFilePath)) return {};
  try { return JSON.parse(fs.readFileSync(sessionPreferencesFilePath, 'utf8')); } catch { return {}; }
};
const saveSessionPreferences = (data) => fs.writeFileSync(sessionPreferencesFilePath, JSON.stringify(data, null, 2), 'utf8');

const normalizeAttachment = (attachment) => ({
  name: String(attachment?.name || 'image'),
  url: String(attachment?.url || ''),
  type: String(attachment?.type || 'image'),
  caption: String(attachment?.caption || attachment?.name || 'image')
});

const normalizeMessage = (message = {}) => ({
  id: message.id || `msg-${Date.now()}-${crypto.randomUUID()}`,
  sender: message.sender === 'bot' || message.role === 'assistant' ? 'bot' : 'user',
  text: String(message.text ?? message.content ?? ''),
  attachments: Array.isArray(message.attachments) ? message.attachments.map(normalizeAttachment).filter(a => a.url) : [],
  createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
  source: message.source || undefined,
  model: message.model || undefined
});

const normalizeSession = (session = {}) => {
  const now = new Date().toISOString();
  return {
    id: String(session.id || `session-${Date.now()}-${crypto.randomUUID()}`),
    title: String(session.title || '新咨询对话').slice(0, 120),
    messages: Array.isArray(session.messages) ? session.messages.map(normalizeMessage) : [],
    createdAt: session.createdAt || now,
    updatedAt: session.updatedAt || now,
    model: session.model || undefined
  };
};

const persistSession = async (username, session) => {
  const normalized = normalizeSession(session);
  if (usePostgres) {
    await pgPool.query(
      `INSERT INTO chat_sessions (id, username, title, messages, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, messages = EXCLUDED.messages, updated_at = EXCLUDED.updated_at`,
      [normalized.id, username, normalized.title, JSON.stringify(normalized.messages), normalized.createdAt, normalized.updatedAt]
    );
  }
  const allJson = loadJsonSessions();
  const sessions = allJson[username] || [];
  const index = sessions.findIndex(item => item.id === normalized.id);
  if (index >= 0) sessions[index] = normalized; else sessions.unshift(normalized);
  allJson[username] = sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  saveJsonSessions(allJson);
  return normalized;
};

const readUserSessions = async (username) => {
  if (usePostgres) {
    try {
      const dbRes = await pgPool.query(
        'SELECT id, title, messages, created_at AS "createdAt", updated_at AS "updatedAt" FROM chat_sessions WHERE username = $1 ORDER BY updated_at DESC',
        [username]
      );
      return dbRes.rows.map(normalizeSession);
    } catch (e) {
      console.error('PostgreSQL session fetch error, fallback to JSON:', e);
    }
  }
  return (loadJsonSessions()[username] || []).map(normalizeSession).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

app.get('/api/user/sessions', async (req, res) => {
  const username = req.query.username || req.body?.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username is required' });
  const query = String(req.query.q || '').trim().toLowerCase();
  let sessions = await readUserSessions(username);
  if (query) sessions = sessions.filter(session => session.title.toLowerCase().includes(query) || session.messages.some(message => message.text.toLowerCase().includes(query)));
  res.json({ ok: true, sessions, activeSessionId: loadSessionPreferences()[username]?.activeSessionId || null });
});

app.post('/api/user/sessions', async (req, res) => {
  const { username, session, sessions } = req.body || {};
  if (!username || (!session && !Array.isArray(sessions))) return res.status(400).json({ ok: false, error: 'Username and session payload required' });
  try {
    if (session) return res.status(201).json({ ok: true, session: await persistSession(username, session) });
    const saved = [];
    for (const item of sessions) saved.push(await persistSession(username, item));
    return res.json({ ok: true, count: saved.length, sessions: saved });
  } catch (e) {
    console.error('Session save error:', e);
    return res.status(500).json({ ok: false, error: 'Failed to persist session' });
  }
});

app.get('/api/user/sessions/:sessionId', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username is required' });
  const session = (await readUserSessions(username)).find(item => item.id === req.params.sessionId);
  if (!session) return res.status(404).json({ ok: false, error: 'Session not found' });
  res.json({ ok: true, session });
});

app.get('/api/user/sessions/:sessionId/search', async (req, res) => {
  const username = req.query.username;
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!username || !query) return res.status(400).json({ ok: false, error: 'Username and query are required' });
  const session = (await readUserSessions(username)).find(item => item.id === req.params.sessionId);
  if (!session) return res.status(404).json({ ok: false, error: 'Session not found' });
  const messages = session.messages.filter(message => message.text.toLowerCase().includes(query));
  res.json({ ok: true, sessionId: session.id, query, messages });
});

const updateSession = async (req, res) => {
  const username = req.body?.username || req.query.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username is required' });
  const existing = (await readUserSessions(username)).find(item => item.id === req.params.sessionId);
  if (!existing) return res.status(404).json({ ok: false, error: 'Session not found' });
  const updated = { ...existing, ...req.body, id: existing.id, messages: req.body.messages || existing.messages, updatedAt: new Date().toISOString() };
  try { res.json({ ok: true, session: await persistSession(username, updated) }); }
  catch { res.status(500).json({ ok: false, error: 'Failed to update session' }); }
};
app.patch('/api/user/sessions/:sessionId', updateSession);
app.put('/api/user/sessions/:sessionId', updateSession);

app.post('/api/user/sessions/:sessionId/messages', async (req, res) => {
  const username = req.body?.username;
  if (!username || !req.body?.message) return res.status(400).json({ ok: false, error: 'Username and message are required' });
  const existing = (await readUserSessions(username)).find(item => item.id === req.params.sessionId);
  if (!existing) return res.status(404).json({ ok: false, error: 'Session not found' });
  const message = normalizeMessage(req.body.message);
  existing.messages.push(message);
  existing.updatedAt = new Date().toISOString();
  const session = await persistSession(username, existing);
  res.status(201).json({ ok: true, message, session });
});

app.put('/api/user/sessions/:sessionId/activate', async (req, res) => {
  const username = req.body?.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username is required' });
  const exists = (await readUserSessions(username)).some(item => item.id === req.params.sessionId);
  if (!exists) return res.status(404).json({ ok: false, error: 'Session not found' });
  const preferences = loadSessionPreferences();
  preferences[username] = { activeSessionId: req.params.sessionId, updatedAt: new Date().toISOString() };
  saveSessionPreferences(preferences);
  res.json({ ok: true, activeSessionId: req.params.sessionId });
});

app.delete('/api/user/sessions/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;
  const username = req.query.username || req.body?.username;
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
    if (allJson[username].length === 0) delete allJson[username];
    saveJsonSessions(allJson);
  }

  const preferences = loadSessionPreferences();
  if (preferences[username]?.activeSessionId === sessionId) {
    const fallbackSessionId = allJson[username]?.[0]?.id;
    if (fallbackSessionId) preferences[username] = { activeSessionId: fallbackSessionId, updatedAt: new Date().toISOString() };
    else delete preferences[username];
    saveSessionPreferences(preferences);
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
  if (!username) return [];
  const queryVector = await getEmbedding(query);
  
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
      score += cosineSimilarity(queryVector, item.embedding) * 10;
    }
    const qLower = query.toLowerCase();
    if (item.title.toLowerCase().includes(qLower)) score += 4;
    if (item.content.toLowerCase().includes(qLower)) score += 3;
    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
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

// --- Chat Endpoint with RAG Integration ---
app.post('/api/aura/chat', async (req, res) => {
  const modelConfig = getModelConfig(req.body?.model);
  const apiKey = modelConfig.apiKey || process.env[modelConfig.apiKeyEnv || 'DEEPSEEK_API_KEY'];
  const username = req.body?.username || '';
  const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const contentToText = (content) => Array.isArray(content)
    ? content.map(part => typeof part === 'string' ? part : (part?.text || '')).join(' ')
    : String(content || '');
  const lastUserMsg = contentToText([...incomingMessages].reverse().find(m => m.role === 'user')?.content);

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

  // 2. VIP User Rule (> 580 -> Personal RAG Memory Search & Auto Save)
  const isVip = userProfile && (userProfile.isVip || (typeof userProfile.score === 'number' && userProfile.score > 580));
  let personalRagContext = '';

  if (isVip && username) {
    // Search user's personal RAG memory store
    const personalMatches = await searchUserPersonalRagEngine(username, lastUserMsg, 3);
    if (personalMatches.length) {
      personalRagContext = `【该 VIP 用户的专属个人背景与历史记忆档案（优先匹配）】：\n`;
      personalMatches.forEach(({ item }) => {
        personalRagContext += `- ${item.title} (${item.category}): ${item.content}\n`;
      });
      personalRagContext += `\n`;
    }

    // Auto extract personal preference/intent memory from conversation
    if (lastUserMsg.length >= 6 && /(想|喜欢|考|专业|地区|分数|冲|稳|保|大学|城市|预算|家庭|打算)/.test(lastUserMsg)) {
      saveUserPersonalMemory(
        username,
        `对话提及咨询诉求与偏好：“${lastUserMsg}”`,
        '对话偏好提取',
        '兴趣与意向'
      ).catch(() => {});
    }
  }

  // 3. Perform Campus RAG Knowledge Search
  // Keep several related records so answers can compare data instead of
  // repeating only the single highest-scoring knowledge item.
  const ragMatches = await searchRagEngine(lastUserMsg, 5);
  const ragContext = formatRagContext(ragMatches);
  const agentEnabled = req.body?.agent !== false;
  const webSearchEnabled = req.body?.webSearch === true;
  const webResults = agentEnabled && webSearchEnabled ? await webSearch(lastUserMsg, 5) : [];
  const webContext = webResults.length ? `【联网搜索工具返回（信息可能变化，请标注来源并提醒用户核验）】：\n${webResults.map((item, index) => `${index + 1}. ${item.title}\n${item.snippet}\n来源：${item.url}`).join('\n\n')}` : '';
  const agentTrace = [
    { tool: 'profile', status: userProfile ? 'used' : 'skipped' },
    { tool: 'personal-memory', status: personalRagContext ? 'used' : 'skipped' },
    { tool: 'campus-rag', status: ragMatches.length ? 'used' : 'empty', count: ragMatches.length },
    { tool: 'web-search', status: webSearchEnabled ? (webResults.length ? 'used' : 'empty') : 'disabled', count: webResults.length }
  ];
  const buildFallbackReply = () => {
    let reply = buildLocalRagReply(lastUserMsg, ragMatches);
    if (webResults.length) {
      reply += `\n\n## 联网检索参考\n\n${webResults.map(item => `- [${item.title || item.url}](${item.url})${item.snippet ? `：${item.snippet}` : ''}`).join('\n')}`;
    }
    return reply;
  };

  let systemPromptWithProfile = `${ADMISSIONS_SYSTEM_PROMPT}\n\n${ADMISSIONS_INTENT_GUARDRAILS}`;
  if (userProfile) {
    systemPromptWithProfile += `\n\n【当前咨询学生背景资料】：
- 姓名：${userProfile.name || username}
- 性别：${userProfile.gender || '未填'}
- 手机号：${userProfile.phone || '未填'}
- 高考省份：${userProfile.province || '未填'}
- 高考分数：${userProfile.score || '未填'} 分
- 全省排名：${userProfile.rank ? `第 ${userProfile.rank} 名` : '未填'}
- 选科情况：${userProfile.subjects || '未填'}
- 特殊情况说明：${userProfile.specialConditions || '无'}
${isVip ? '✨ 该学生为 VIP 优先保障咨询用户 (高考成绩 > 580分)，系统已启用专属个人 RAG 记忆检索！请针对其高考位次及个性化喜好提供定制化报考方案！' : ''}`;
  }

  const messages = [
    { role: 'system', content: systemPromptWithProfile },
    ...(agentEnabled ? [{ role: 'system', content: '你正在以招生咨询 Agent 模式工作。先判断问题所需工具，再综合用户画像、个人记忆、校内知识库和联网搜索证据；事实冲突时优先采用时间更新且来源明确的信息，并明确不确定性。' }] : []),
    ...(personalRagContext ? [{ role: 'system', content: personalRagContext }] : []),
    ...(ragContext ? [{ role: 'system', content: ragContext }] : []),
    ...(webContext ? [{ role: 'system', content: webContext }] : []),
    ...incomingMessages
      .filter((m) => m && typeof m.role === 'string' && (typeof m.content === 'string' || Array.isArray(m.content)))
      .map((m) => {
        const attachments = Array.isArray(m.attachments) ? m.attachments.filter(a => a?.url) : [];
        if (!attachments.length) return { role: m.role, content: m.content };
        if (modelConfig.supportsVision) {
          return { role: m.role, content: [{ type: 'text', text: contentToText(m.content) }, ...attachments.map(a => ({ type: 'image_url', image_url: { url: a.dataUrl || a.url } }))] };
        }
        return { role: m.role, content: `${contentToText(m.content)}\n\n用户附图：${attachments.map(a => a.url).join('、')}` };
      }),
  ];

  // 2. If no API key, serve local response using RAG context
  if (!apiKey) {
    return res.json({
      ok: true,
      reply: buildFallbackReply(),
      source: ragMatches.length ? 'local-bge-rag-db' : 'local-fallback',
      model: modelConfig.id,
      agent: { enabled: agentEnabled, trace: agentTrace, webResults }
    });
  }

  // 3. OpenAI-compatible model call with Agent/RAG context
  try {
    const modelResponse = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelConfig.model || modelConfig.id.replace(/^openai-/, ''),
        messages,
        temperature: Math.max(0, Math.min(2, Number(req.body?.modelParams?.temperature ?? modelConfig.temperature ?? 0.7))),
        max_tokens: Math.max(128, Math.min(16384, Number(req.body?.modelParams?.maxTokens ?? modelConfig.maxTokens ?? 4096))),
        stream: false,
      }),
    });

    if (!modelResponse.ok) {
      return res.json({
        ok: true,
        reply: buildFallbackReply(),
        source: 'rag-fallback', model: modelConfig.id,
        agent: { enabled: agentEnabled, trace: agentTrace, webResults }
      });
    }

    const payload = await modelResponse.json();
    let reply = payload?.choices?.[0]?.message?.content?.trim() || '我刚刚有点走神了，您可以再说一次吗？';

    const matchedImages = ragMatches.flatMap(m => m.item.imageAttachments || []);
    if (matchedImages.length) {
      matchedImages.forEach(img => {
        if (!reply.includes(img.url)) {
          reply += `\n\n![${img.caption || img.name}](${img.url})`;
        }
      });
    }

    const source = modelConfig.id.startsWith('deepseek') ? 'deepseek-bge-rag-api' : `${modelConfig.provider || 'model'}-agent-rag-api`;
    res.json({ ok: true, reply, source, model: modelConfig.id, agent: { enabled: agentEnabled, trace: agentTrace, webResults } });
  } catch (error) {
    res.json({
      ok: true,
      reply: buildFallbackReply(),
      source: 'rag-fallback', model: modelConfig.id,
      agent: { enabled: agentEnabled, trace: agentTrace, webResults }
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
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Gzadm Navigator Admissions AI Engine listening instantly on http://localhost:${port} & http://127.0.0.1:${port}`);

  // Asynchronous background initializations so port 3001 is open IMMEDIATELY (< 50ms)
  (async () => {
    databaseReady = initPostgres();
    await initEmbedder();
    await databaseReady;
    await initRedis();
  })();
});



setInterval(() => {}, 1000 * 60 * 60);
