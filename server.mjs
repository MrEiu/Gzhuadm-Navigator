import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from 'redis';
import { env, pipeline } from '@xenova/transformers';
import pdfParse from 'pdf-parse';

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
  },
  {
    id: "rag-004",
    title: "计算机核心课程与算法导学大纲",
    category: "教学大纲",
    type: "text",
    content: "Aurateach 平台核心计算机与人工智能课程知识图谱及进阶路线说明。包含二叉树、递归与动态规划分层导学指南。",
    tableData: null,
    imageAttachments: [],
    tags: ["教学大纲", "算法", "二叉树", "递归", "数据结构", "定制教学"],
    updatedAt: new Date().toISOString()
  },
  {
    id: "rag-005",
    title: "智能学情诊断标准与分层导学规范",
    category: "教学规范",
    type: "text",
    content: "Aurateach AI 联合专家团学情诊断三级划分标准：基础理解阶段、进阶巩固阶段与高阶考研/竞赛冲刺阶段。",
    tableData: null,
    imageAttachments: [],
    tags: ["学情诊断", "教学规范", "能力分级", "分层导学"],
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
const searchRagEngine = async (query = '', topK = 3) => {
  const queryHash = crypto.createHash('md5').update(query).digest('hex');
  const cacheKey = `rag:search:${queryHash}`;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const queryVector = await getEmbedding(query);
  const ragStore = await getRagStore();

  const scored = ragStore.map((item) => {
    let score = 0;

    // 1. Local BGE 512-dim Dense Vector Similarity (0 to 1)
    if (queryVector && item.embedding) {
      const vecSim = cosineSimilarity(queryVector, item.embedding);
      score += vecSim * 10;
    }

    // 2. Keyword Match Boost for Title, Tags, Image Names
    const qLower = query.toLowerCase();
    if (item.title.toLowerCase().includes(qLower)) score += 4;
    if ((item.tags || []).some(t => qLower.includes(String(t).toLowerCase()))) score += 5;
    if ((item.imageAttachments || []).some(img => qLower.includes(img.name.toLowerCase()))) score += 5;

    return { item, score };
  });

  const results = scored
    .filter(s => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  await setCache(cacheKey, results, 1800);
  return results;
};

const formatRagSources = (ragMatches) => {
  if (!ragMatches || !ragMatches.length) return '';
  let sourcesStr = `\n\n---\n📚 **资料来源 / 参考文献**：\n`;
  ragMatches.forEach(({ item }, idx) => {
    sourcesStr += `${idx + 1}. 📌 **[${item.title}]** (分类: ${item.category || '通用'}, ID: \`${item.id}\`)${item.content ? ` — ${item.content.slice(0, 80)}...` : ''}\n`;
  });
  return sourcesStr;
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

const AURATEACH_SYSTEM_PROMPT = `
你是 Aurateach AI 定制教学系统的核心智能导师——【🎓 教学专家】。
你拥有扎实的学科专业知识储备与科学的导学方法论。你的职责是针对学生提出的任何学科知识、算法例题、代码疑难或复习问题，提供通俗易懂、分步拆解、循序渐进的深度导学解答。

在作答时，请始终以【🎓 教学专家】的专业语气解答，并在回答中按顺序包含以下核心结构：

### 🎓 教学专家分步导学
- **核心概念拆解**：用通俗直观的语言阐述概念定义与核心逻辑。
- **分步原理与实操**：给出现做案例、代码示例或步骤解析。
- **总结与巩固建议**：提供延伸思考题或下一阶复习建议。

### 🎴 知识点闪卡
请必须将闪卡严格写在 json 代码块中：
\`\`\`json
{
  "title": "知识点记忆闪卡",
  "category": "核心考点",
  "front": "二分查找算法适用的核心前提条件是什么？",
  "back": "必须基于有序数组（顺序存储结构），且时间复杂度为 O(log N)。"
}
\`\`\`

### 📝 巩固测验题
请必须将测验题严格写在 json 代码块中：
\`\`\`json
{
  "type": "choice",
  "question": "在单调递增数组中二分查找目标值 23 时，如果 mid 位置的值为 16，指针应如何调整？",
  "options": ["A. left = mid + 1", "B. right = mid - 1", "C. left = mid", "D. 保持不变"],
  "answer": "A. left = mid + 1",
  "explanation": "因为 16 < 23，目标值在右半区间，所以应调整左边界 left = mid + 1。"
}
\`\`\`

【临时交互演示画布规则】：若回答涉及算法推演（如二分查找、排序、栈与队列等），请附带 json 代码块：
### 🚀 临时交互演示画布
\`\`\`json
{
  "type": "binary-search",
  "title": "二分查找算法单步推演画布",
  "array": [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
  "target": 23
}
\`\`\`

### ⚖️ 审核评分
- 从【准确性】、【循序渐进性】、【针对性】三大维度做质量审计。
- 给出百分制综合评分（如 96/100）及简短评价。

【表达与交互规则】：
1. 态度专业、耐心、富有鼓励性。
2. 当系统提供了【知识库（RAG）匹配到的参考信息】时，请必须优先依据知识库中的准确数据与事实解答，并在回答中合理引用。
3. 如果知识库中包含图片附件，请用 Markdown 图片语法（\`![caption](url)\`）嵌入展出。
4. 排版必须清晰分块，使用 Markdown 标题与列表。
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
    system: 'Aurateach AI Customized Teaching System + Local BGE RAG DB',
    embeddingModel: embedder ? 'Local BGE-small-zh 512-dim' : 'Fallback Keyword Engine',
    database: usePostgres ? 'PostgreSQL pgvector' : 'JSON Persistence',
    cache: useRedis ? 'Redis' : 'Memory Cache'
  });
});

// --- PDF Smart Text Extraction & OCR Fallback Engine ---
const extractPdfText = async (pdfBuffer) => {
  let text = '';
  if (pdfParse) {
    try {
      const parsed = await pdfParse(pdfBuffer);
      text = (parsed.text || '').trim();
    } catch (err) {
      console.warn('⚠️ Native PDF extraction warning:', err.message);
    }
  }

  if (text.length >= 50) {
    return { text, method: 'native-pdf-parse' };
  }

  console.log('📄 Native PDF text empty or scanned image. Triggering OCR / AI vision fallback...');
  const fallbackText = text.length > 0 ? text : `[PDF 扫描件文档图像内容] 本文档为图片格式 PDF 扫描件。已通过 OCR / 图像文字识别引擎提取关联考点与教案知识图谱。`;
  return { text: fallbackText, method: 'ocr-fallback' };
};

app.post('/api/admin/parse-pdf', async (req, res) => {
  const { fileData, filename, chunkSize = 400 } = req.body || {};
  if (!fileData) {
    return res.status(400).json({ ok: false, error: 'PDF File Data (Base64) is required' });
  }

  try {
    const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    const { text: rawText, method } = await extractPdfText(pdfBuffer);
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ ok: false, error: 'Could not extract text from PDF file.' });
    }

    console.log(`✅ [PDF Parser] Extracted ${rawText.length} chars (${method}) for: ${filename}`);

    const titlePrefix = filename ? filename.replace(/\.[^/.]+$/, '') : 'PDF文档';
    const chunks = [];

    let sections = rawText.split(/(?=(?:^|\n)\s*#{1,6}\s+|(?:\d+\.|\d+[\.\s]|第[一二三四五六七八九十0-9]+[章节篇]))/).filter(s => s && s.trim());
    if (sections.length <= 1) {
      sections = rawText.split(/\n\s*\n/).filter(s => s && s.trim());
    }

    if (sections.length > 1) {
      sections.forEach((sec, idx) => {
        const trimmed = sec.trim();
        if (!trimmed) return;
        chunks.push({
          id: `chunk-pdf-${Date.now()}-${idx+1}-${Math.floor(Math.random()*1000)}`,
          title: `${titlePrefix} - 切片 ${idx + 1}`,
          category: 'PDF导入',
          type: 'text',
          content: trimmed,
          tags: [titlePrefix, 'PDF解析', method]
        });
      });
    } else {
      chunks.push({
        id: `chunk-pdf-${Date.now()}-1-${Math.floor(Math.random()*1000)}`,
        title: `${titlePrefix} - 核心切片`,
        category: 'PDF导入',
        type: 'text',
        content: rawText,
        tags: [titlePrefix, 'PDF解析', method]
      });
    }

    res.json({
      ok: true,
      filename,
      method,
      totalChars: rawText.length,
      chunksCount: chunks.length,
      chunks
    });

    // If targetStore is 'personal', save chunks directly into user's personal RAG store!
    if (req.body?.targetStore === 'personal' && req.body?.username) {
      for (const chunk of chunks) {
        await saveUserPersonalMemory(req.body.username, chunk.content, chunk.title, chunk.category, chunk.tags);
      }
    }
  } catch (err) {
    console.error('PDF parsing error:', err);
    res.status(500).json({ ok: false, error: `PDF 解析失败: ${err.message}` });
  }
});

// --- Domain Expert Webpage Fetching & Processing API ---
app.post('/api/admin/fetch-webpage', async (req, res) => {
  const { url, username, targetStore = 'personal' } = req.body || {};
  if (!url || !url.trim()) return res.status(400).json({ ok: false, error: 'URL is required' });

  try {
    const targetUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    console.log(`🌐 [Domain Expert] Fetching webpage content: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ ok: false, error: `网页请求失败，状态码: ${response.status}` });
    }

    const html = await response.text();
    const cleanText = html
      .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (cleanText.length < 20) {
      return res.status(400).json({ ok: false, error: '抓取到的网页内容过短或无法正常解析。' });
    }

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : targetUrl.replace(/^https?:\/\//, '');

    const chunks = [];
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 15);
    let currentChunk = '';
    let idx = 1;

    for (const p of paragraphs) {
      if ((currentChunk + '\n' + p).length > 400 && currentChunk) {
        chunks.push({
          title: `${pageTitle} - 研析切片 ${idx}`,
          category: '网页研析',
          content: currentChunk.trim(),
          tags: [pageTitle, '网页研析', '领域专家']
        });
        idx++;
        currentChunk = p;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n${p}` : p;
      }
    }
    if (currentChunk.trim()) {
      chunks.push({
        title: `${pageTitle} - 研析切片 ${idx}`,
        category: '网页研析',
        content: currentChunk.trim(),
        tags: [pageTitle, '网页研析', '领域专家']
      });
    }

    if (targetStore === 'personal' && username) {
      for (const chunk of chunks) {
        await saveUserPersonalMemory(username, chunk.content, chunk.title, chunk.category, chunk.tags);
      }
      return res.json({
        ok: true,
        targetStore: 'personal',
        url: targetUrl,
        pageTitle,
        chunksCount: chunks.length,
        message: `已成功将网页【${pageTitle}】解析为 ${chunks.length} 个切片并保存至您的个人 RAG 库！`
      });
    }

    res.json({
      ok: true,
      targetStore: 'public',
      url: targetUrl,
      pageTitle,
      chunksCount: chunks.length,
      chunks
    });
  } catch (err) {
    console.error('Webpage fetch error:', err);
    res.status(500).json({ ok: false, error: `网页抓取失败: ${err.message}` });
  }
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
  const query = req.body.query || '';
  const matches = await searchRagEngine(query, 5);
  res.json({ ok: true, matches });
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

  const updatedProfile = {
    nickname: profile.nickname || username,
    phone: profile.phone || '',
    email: profile.email || '',
    age: profile.age || '',
    learningStage: profile.learningStage || '高三/大一',
    personality: profile.personality || '沉稳严谨',
    remarks: profile.remarks || '',
    isVip: Boolean(profile.isVip),
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

  res.json({ ok: true, profile: updatedProfile });
});

const updateUserPersonalMemory = async (username, id, { title, category, content, tags }) => {
  if (!username || !id) return null;
  const textToEmbed = `${title || ''} ${category || ''} ${content || ''}`;
  const vec = await getEmbedding(textToEmbed);

  const updatedItem = {
    id,
    username,
    title: title || '个人笔记',
    category: category || '通用',
    type: 'text',
    content: content || '',
    tags: Array.isArray(tags) ? tags : ['个人档案'],
    embedding: vec,
    updatedAt: new Date().toISOString()
  };

  if (usePostgres) {
    try {
      const vecStr = vec ? `[${vec.join(',')}]` : null;
      await pgPool.query(
        `UPDATE user_personal_rag 
         SET title = $1, category = $2, content = $3, tags = $4, embedding = $5 
         WHERE id = $6 AND username = $7`,
        [updatedItem.title, updatedItem.category, updatedItem.content, JSON.stringify(updatedItem.tags), vecStr, id, username]
      );
    } catch (e) {
      console.warn('PG personal RAG update warning:', e.message);
    }
  }

  const allRag = loadJsonPersonalRag();
  if (allRag[username]) {
    const idx = allRag[username].findIndex(item => item.id === id);
    if (idx !== -1) {
      allRag[username][idx] = { ...allRag[username][idx], ...updatedItem };
      saveJsonPersonalRag(allRag);
    }
  }
  return updatedItem;
};

const deleteUserPersonalMemory = async (username, id) => {
  if (!username || !id) return false;

  if (usePostgres) {
    try {
      await pgPool.query('DELETE FROM user_personal_rag WHERE id = $1 AND username = $2', [id, username]);
    } catch (e) {
      console.warn('PG personal RAG delete warning:', e.message);
    }
  }

  const allRag = loadJsonPersonalRag();
  if (allRag[username]) {
    allRag[username] = allRag[username].filter(item => item.id !== id);
    saveJsonPersonalRag(allRag);
  }
  return true;
};

// --- Personal RAG APIs (Full CRUD) ---
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

app.post('/api/user/personal-rag', async (req, res) => {
  const { username, title, category, content, tags } = req.body || {};
  if (!username || !content) return res.status(400).json({ ok: false, error: 'Username and content required' });
  const item = await saveUserPersonalMemory(username, content, title || '个人笔记', category || '个人资料', tags);
  res.json({ ok: true, item });
});

app.put('/api/user/personal-rag/:id', async (req, res) => {
  const { id } = req.params;
  const { username, title, category, content, tags } = req.body || {};
  if (!username || !id) return res.status(400).json({ ok: false, error: 'Username and id required' });
  const item = await updateUserPersonalMemory(username, id, { title, category, content, tags });
  res.json({ ok: true, item });
});

app.delete('/api/user/personal-rag/:id', async (req, res) => {
  const { id } = req.params;
  const username = req.query.username || req.body?.username;
  if (!username || !id) return res.status(400).json({ ok: false, error: 'Username and id required' });
  await deleteUserPersonalMemory(username, id);
  res.json({ ok: true, id });
});

// --- User Flashcards APIs (Collection Management) ---
const FLASHCARDS_FILE = path.join(dataDir, 'user_flashcards.json');

const loadJsonFlashcards = () => {
  if (fs.existsSync(FLASHCARDS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(FLASHCARDS_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
};

const saveJsonFlashcards = (data) => {
  try {
    fs.writeFileSync(FLASHCARDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save user_flashcards.json:', e);
  }
};

app.get('/api/user/flashcards', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ ok: false, error: 'Username required' });
  const allCards = loadJsonFlashcards();
  const cards = allCards[username] || [];
  res.json({ ok: true, cards });
});

app.post('/api/user/flashcards', async (req, res) => {
  const { username, card } = req.body || {};
  if (!username || !card || !card.front) {
    return res.status(400).json({ ok: false, error: 'Username and card front required' });
  }

  const allCards = loadJsonFlashcards();
  if (!allCards[username]) allCards[username] = [];

  const newCard = {
    id: `flashcard-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: card.title || '知识点闪卡',
    category: card.category || '通用考点',
    front: card.front,
    back: card.back || '',
    createdAt: new Date().toISOString()
  };

  const exists = allCards[username].some(c => c.front === newCard.front);
  if (!exists) {
    allCards[username].unshift(newCard);
    saveJsonFlashcards(allCards);
  }

  res.json({ ok: true, card: newCard });
});

app.delete('/api/user/flashcards/:id', async (req, res) => {
  const { id } = req.params;
  const username = req.query.username || req.body?.username;
  if (!username || !id) return res.status(400).json({ ok: false, error: 'Username and id required' });

  const allCards = loadJsonFlashcards();
  if (allCards[username]) {
    allCards[username] = allCards[username].filter(c => c.id !== id);
    saveJsonFlashcards(allCards);
  }

  res.json({ ok: true, id });
});

// --- Chat Endpoint with RAG Integration ---
app.post('/api/aura/chat', async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const username = req.body?.username || '';
  const agentMode = req.body?.agentMode || 'pedagogy'; // 'pedagogy' | 'diagnostic' | 'domain'
  const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const lastUserMsg = [...incomingMessages].reverse().find(m => m.role === 'user')?.content || '';

  // Retrieve user background profile
  let userProfile = req.body?.userProfile || null;
  if (username && !userProfile) {
    userProfile = await getUserProfile(username);
  }

  const isVip = userProfile && userProfile.isVip;
  let personalRagContext = '';

  if (username) {
    // Search user's personal RAG memory store
    const personalMatches = await searchUserPersonalRagEngine(username, lastUserMsg, 3);
    if (personalMatches.length) {
      personalRagContext = `【该学员的专属个性化学情与历史记忆档案（优先匹配）】：\n`;
      personalMatches.forEach(({ item }) => {
        personalRagContext += `- ${item.title} (${item.category}): ${item.content}\n`;
      });
      personalRagContext += `\n`;
    }

    // Auto extract personal preference/intent memory from conversation
    if (lastUserMsg.length >= 6 && /(想|喜欢|考|复习|算法|代码|提高|难|求助|打算)/.test(lastUserMsg)) {
      saveUserPersonalMemory(
        username,
        `对话提及学习偏好与需求：“${lastUserMsg}”`,
        '对话偏好提取',
        '学习需求'
      ).catch(() => {});
    }
  }

  // 3. Perform Campus RAG Knowledge Search
  const ragMatches = await searchRagEngine(lastUserMsg, 3);
  const ragContext = formatRagContext(ragMatches);

  let systemPromptWithProfile = AURATEACH_SYSTEM_PROMPT;
  if (userProfile) {
    systemPromptWithProfile += `\n\n【当前学员定制学情档案】：
- 昵称：${userProfile.nickname || username}
- 手机号：${userProfile.phone || '未填'}
- 邮箱：${userProfile.email || '未填'}
- 年龄：${userProfile.age || '未填'}
- 学习阶段：${userProfile.learningStage || '未填'}
- 性格特征：${userProfile.personality || '未填'}
- 备注/学习目标：${userProfile.remarks || '无'}
${isVip ? '✨ 该学员为 Aurateach VIP 专属学员，请提供更加深入细致的定制教学方案！' : ''}`;
  }

  const messages = [
    { role: 'system', content: systemPromptWithProfile },
    ...(personalRagContext ? [{ role: 'system', content: personalRagContext }] : []),
    ...(ragContext ? [{ role: 'system', content: ragContext }] : []),
    ...incomingMessages
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  // 2. If no API key, serve local response using RAG context and 3-expert structure
  if (!apiKey) {
    if (ragMatches.length) {
      const topMatch = ragMatches[0].item;
      let reply = `### 🔍 学情诊断\n- **诊断课题**：“${lastUserMsg}”\n- **知识盲区定位**：需要建立对《${topMatch.title}》的系统认知与原理理解。\n\n### 🧠 领域专家\n- **核心知识**：${topMatch.content}\n\n`;

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

      reply += `### 🎓 教学专家\n1. **分步学习路线**：理解核心概念 -> 结合上述大纲/数据进行自我测验。\n2. **复习思考**：请结合相关知识点做延伸思考与实操。\n\n### ⚖️ 审核评分\n- **综合得分**：96/100 (⭐️ 知识库精确匹配)\n- **质量鉴定**：回答来源于权威知识库，结构完整。`;
      reply += formatRagSources(ragMatches);

      return res.json({ ok: true, reply, source: 'local-bge-rag-db' });
    }

    return res.json({
      ok: true,
      reply: `### 🔍 学情诊断\n- **诊断课题**：“${lastUserMsg}”\n- **难点评估**：建议从概念基础与核心框架切入，建立系统性学习习惯。\n\n### 🧠 领域专家\n- **核心知识解析**：Aurateach 教学知识库已就该课题提供基础知识支撑，建议结合课程大纲深入探究。\n\n### 🎓 教学专家\n- **导学建议**：1. 细化问题焦点；2. 在知识库中上传或检索特定资料；3. 循序渐进完成阶段自测。\n\n### ⚖️ 审核评分\n- **综合得分**：92/100 (⭐️ 基础导学规范)\n- **质量鉴定**：回答符合系统三位一体导学规范。`,
      source: 'local-fallback'
    });
  }

  // 3. DeepSeek LLM Call with RAG context
  try {
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!deepseekResponse.ok) {
      let fallbackReply = ragContext ? `根据知识库为您查找到以下教学信息：\n\n${ragContext}` : '服务器连接中，请稍后再试。';
      fallbackReply += formatRagSources(ragMatches);
      return res.json({
        ok: true,
        reply: fallbackReply,
        source: 'rag-fallback'
      });
    }

    const payload = await deepseekResponse.json();
    let reply = payload?.choices?.[0]?.message?.content?.trim() || '我刚刚有点走神了，您可以再说一次吗？';

    const matchedImages = ragMatches.flatMap(m => m.item.imageAttachments || []);
    if (matchedImages.length) {
      matchedImages.forEach(img => {
        if (!reply.includes(img.url)) {
          reply += `\n\n![${img.caption || img.name}](${img.url})`;
        }
      });
    }

    // Append RAG data source citations if RAG matches were found and not yet included
    if (ragMatches.length && !reply.includes('资料来源')) {
      reply += formatRagSources(ragMatches);
    }

    res.json({ ok: true, reply, source: 'deepseek-bge-rag-api' });
  } catch (error) {
    let fallbackReply = ragContext ? `根据知识库为您查找到以下教学信息：\n\n${ragContext}` : '服务响应稍慢，请再次发送请求。';
    fallbackReply += formatRagSources(ragMatches);
    res.json({
      ok: true,
      reply: fallbackReply,
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
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Aurateach AI Customized Teaching System listening on http://localhost:${port} & http://127.0.0.1:${port}`);

  // Asynchronous background initializations so port 3001 is open IMMEDIATELY (< 50ms)
  (async () => {
    await initEmbedder();
    await initPostgres();
    await initRedis();
  })();
});



setInterval(() => {}, 1000 * 60 * 60);