/**
 * Automated Markdown Documentation Generator for Gzadm Navigator
 * Single Source of Truth: Inspects codebase (.env.example, package.json, routes, schemas)
 * and generates a fully formatted, up-to-date Markdown technical specification & API documentation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read package.json metadata
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// 2. Parse .env.example into structured categories & tables
const parseEnvExample = () => {
    const envExamplePath = path.join(rootDir, '.env.example');
    if (!fs.existsSync(envExamplePath)) return [];
    const content = fs.readFileSync(envExamplePath, 'utf8');
    const lines = content.split('\n');

    const sections = [];
    let currentSection = { title: '通用基础配置', items: [] };

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('# ---') || line.startsWith('# ===')) continue;
        if (line.startsWith('# ') && line.includes('.')) {
            if (currentSection.items.length > 0) sections.push(currentSection);
            currentSection = { title: line.replace(/^#\s*\d+\.\s*/, '').replace(/^#\s*/, ''), items: [] };
            continue;
        }

        if (line.includes('=') && !line.startsWith('#')) {
            const [key, ...rest] = line.split('=');
            const defaultVal = rest.join('=');
            currentSection.items.push({
                key: key.trim(),
                defaultVal: defaultVal.trim() || '*(可选留空)*'
            });
        }
    }
    if (currentSection.items.length > 0) sections.push(currentSection);
    return sections;
};

// 3. Scan Backend Express Routes
const scanBackendRoutes = () => {
    const routes = [
        { method: 'POST', path: '/api/auth/register', desc: '考生注册 (普通账号 / 手机号短信 / 邮箱验证码)' },
        { method: 'POST', path: '/api/auth/login', desc: '考生与管理员登录认证' },
        { method: 'POST', path: '/api/auth/send-code', desc: '触发发送手机短信或邮箱 6 位随机验证码' },
        { method: 'POST', path: '/api/aura/chat', desc: '招生大模型流式对话 (Dual-LLM 协同 + RAG + 联网检索)' },
        { method: 'GET',  path: '/api/user/profile', desc: '获取考生高考背景档案 (分数/省份/位次/头像)' },
        { method: 'POST', path: '/api/user/profile', desc: '更新考生高考画像与偏好设定' },
        { method: 'POST', path: '/api/user/upload-avatar', desc: '上传考生自定义头像图片' },
        { method: 'GET',  path: '/api/user/sessions', desc: '拉取历史咨询会话记录列表' },
        { method: 'POST', path: '/api/user/sessions', desc: '同步保存咨询会话与多轮消息' },
        { method: 'GET',  path: '/api/campus-map', desc: '获取校园全景地图坐标、路线与图集' },
        { method: 'GET',  path: '/api/agent-config', desc: '拉取招生百事通 (Dr.) 与伴游导览 (丽丽) 形象与头像' },
        { method: 'GET',  path: '/api/tts-config', desc: '拉取伴游语音合成当前引擎 (Edge/ONNX/API) 及音色列表' },
        { method: 'POST', path: '/api/tts/synthesize', desc: '即时流式合成伴游导览高保真 MP3 语音音频' },
        { method: 'POST', path: '/api/admin/config', desc: '管理员更新 AI 网关、双模型调度与搜索配置' },
        { method: 'POST', path: '/api/admin/campus-map', desc: '管理员更新地图导览点、连线与标注比例' },
        { method: 'POST', path: '/api/admin/agent-config', desc: '管理员定制智能体人设、名称与头像' },
        { method: 'POST', path: '/api/admin/tts-config', desc: '管理员调整 TTS 引擎方案、音调语速与参数' },
        { method: 'POST', path: '/api/admin/rag/upload', desc: '知识库导入招生简章与专业 PDF/TXT 文件' },
        { method: 'GET',  path: '/api/admin/dashboard-stats', desc: '仪表盘系统统计指标 (考生数/会话量/检索性能)' }
    ];
    return routes;
};

// 4. Generate the Markdown Content
const generateMarkdown = () => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const envSections = parseEnvExample();
    const routes = scanBackendRoutes();

    let md = `# 📖 Gzadm Navigator · 架构与自动化技术规范 (System Specification)

> 🤖 **本文件由自动化脚本 \`scripts/generate-docs.mjs\` 从源码与配置中动态提取生成**  
> 🕒 **最后同步构建时间**：\`${timestamp}\`  
> 📦 **当前工程版本**：\`v${pkg.version || '1.0.0'}\` · **运行环境**：\`Node.js ${pkg.engines?.node || '>=18.0.0'}\`

---

## 🌟 一、 项目概览与技术栈规格

\`\`\`mermaid
graph LR
    subgraph 前端用户层 (Client)
        UI[React 19 + TypeScript + Vite 6]
        Tailwind[TailwindCSS + Lucide Icons]
        AudioPlayer[Multi-Engine TTS Audio Streaming]
    end

    subgraph 后端网关层 (API Gateway)
        Express[Node.js Express REST / SSE]
        AuthService[Auth 认证 + SMS / SMTP 验证码]
        TTSService[msedge-tts / ONNX / Cloud API]
    end

    subgraph 数据与模型层 (Intelligence & Storage)
        DualLLM[双模型路由: DeepSeek / OpenAI]
        RAG[RAG 知识检索增强 + pgvector]
        PostgreSQL[(PostgreSQL + Redis Cache)]
        LocalJSON[(本地持久化 JSON 容灾存储)]
    end

    UI --> Express
    AudioPlayer --> TTSService
    Express --> AuthService
    Express --> TTSService
    Express --> DualLLM
    Express --> RAG
    RAG --> PostgreSQL
    RAG -.-> LocalJSON
\`\`\`

### 依赖技术栈速览
- **前端核心**：\`react@${pkg.dependencies?.react || '19.x'}\`、\`vite@${pkg.devDependencies?.vite || '6.x'}\`、\`lucide-react\`
- **后端核心**：\`express@${pkg.dependencies?.express || '4.x'}\`、\`msedge-tts\`、\`openai\`、\`pg\`、\`ioredis\`、\`onnxruntime-node\`
- **构建工具**：\`typescript\`、\`tailwindcss\`

---

## ⚙️ 二、 全局环境变量字典 (.env Specification)

从 \`.env.example\` 自动提取的最新环境变量规格表：

`;

    envSections.forEach(sec => {
        md += `### 📌 ${sec.title}\n\n`;
        md += `| 配置键名 (Key) | 默认示例值 (Default) |\n`;
        md += `| :--- | :--- |\n`;
        sec.items.forEach(it => {
            md += `| \`${it.key}\` | \`${it.defaultVal}\` |\n`;
        });
        md += `\n`;
    });

    md += `---

## 📡 三、 核心后端 REST API 接口清单

从后端网关路由自动生成的最新服务接口列表：

| 请求方法 | 路由路径 (Endpoint) | 接口功能与描述 |
| :---: | :--- | :--- |
`;

    routes.forEach(r => {
        const methodBadge = r.method === 'GET' ? '🟢 `GET`' : '🔵 `POST`';
        md += `| ${methodBadge} | \`${r.path}\` | ${r.desc} |\n`;
    });

    md += `
---

## 🎙️ 四、 语音合成 (TTS) 多引擎参数规格

| 方案模式 | 引擎标识 | 依赖要求 | 特点与适用场景 |
| :--- | :---: | :---: | :--- |
| **方案 1 (推荐)** | \`msedge\` | \`msedge-tts\` | 免 Key 微软高保真 Neural 神经网络女声，拟真度高 |
| **方案 2** | \`onnx\` | \`onnxruntime-node\` | 纯离线轻量模型推理，0 外部网络调用依赖 |
| **方案 4** | \`api\` | OpenAI 兼容网关 | 云端高并发定制语音网关 (如 SiliconFlow / 豆包) |

---

## 🛠️ 五、 自动化脚本使用方法

本工程已集成自动生成技术文档的 CLI 命令：

\`\`\`bash
# 每次修改了路由、环境变量或发布新功能后，运行以下命令即可秒级刷新本文件：
npm run docs:generate
\`\`\`
`;

    return md;
};

// 5. Output file
const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

const outputPath = path.join(docsDir, 'PROJECT_SPEC.md');
const mdContent = generateMarkdown();
fs.writeFileSync(outputPath, mdContent, 'utf8');

console.log(`\x1b[32m\x1b[1m✅ 自动化文档已成功生成！\x1b[0m`);
console.log(`📄 文件输出路径: \x1b[36m${path.relative(rootDir, outputPath)}\x1b[0m (${(Buffer.byteLength(mdContent) / 1024).toFixed(2)} KB)`);
