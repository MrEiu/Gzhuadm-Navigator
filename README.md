# Aurateach - AI 定制教学系统与知识库管理平台

> **Aurateach** 是一款专为个性化教学与因材施教打造的高效、智能、三位一体的 AI 定制教学服务与知识库管理系统。通过“学情诊断”、“领域专家”与“教学专家”联合作答及“AI 审核员”评分，并在 RAG 知识库检索触发时自动标注资料来源。

---

## 目录
- [🏫 面向教学机构与学员（使用者指南）](#-面向教学机构与学员使用者指南)
  - [核心业务功能与亮点](#核心业务功能与亮点)
  - [控制台三大管理维度](#控制台三大管理维度)
- [💻 面向开发者（技术开发与部署指南）](#-面向开发者技术开发与部署指南)
  - [技术栈构成](#技术栈构成)
  - [系统架构与数据流](#系统架构与数据流)
  - [本地开发与部署运行](#本地开发与部署运行)
  - [生产环境构建与 Docker 部署](#生产环境构建与-docker-部署)

---

## 🏫 面向教学机构与学员（使用者指南）

### 核心业务功能与亮点

1. **三位一体教学专家团 (Aurateach Joint Expert Team)**
   - **🔍 学情诊断**：精准定位学员提问中的知识盲区、理解难点与能力阶段。
   - **🧠 领域专家**：提供硬核、严谨的知识点拆解、公式/算法原理推导与权威案例。
   - **🎓 教学专家**：制定分层导学路径、记忆卡片与巩固练习题。
   - **⚖️ AI 审核员**：实时进行准确性、循序渐进性与针对性三维鉴定，并给出综合评分。

2. **RAG 检索资料来源显式溯源**
   - 每次对话若调用知识库（RAG），AI 回复消息末尾均会自动附带结构化的 `📚 资料来源 / 参考文献` 标签，方便追溯权威教案与大纲。

---

### 控制台三大管理维度

管理员可通过系统预设账号（`admin` / `admin123`）登录管理控制台，全方位统筹知识库、用户群及咨询大数据：

#### 1. 知识库 RAG 管理 (RAG Knowledge Base)
- **文档智能切片与导入**：支持 Word、Markdown、TXT 文档一键切片，CSV 结构化表格解析，及 PNG 校园实景图片上传。
- **512维向量比对测试 console**：提供本地 BGE 向量语义比对测试工具，可实时校验提问与知识库切片的余弦相似度匹配得分。

#### 2. 用户管理与策略控制 (User Management & Policy Control)
- **全量注册用户大盘**：集中呈现所有注册考生的账号、真实姓名、高考省份、分数位次及选科背景。
- **全局低于拦截策略配置**：支持自定义低于拦截分值线（如 450 分），一键开启/暂停低分段算力控制策略。
- **VIP 特权管理**：可配置 VIP 自动晋级分值线（如 580 分），也可手动为指定考生授予/取消 VIP 资格。
- **查看个人 RAG 专属记忆**：管理员可调阅任意考生在对话中被 AI 自动提炼的偏好与个人背景档案。

#### 3. 消息与咨询分析 (Message Analytics & Word Frequency)
- **全网问答记录明细汇总**：自动归档呈现所有考生的真实提问与 AI 顾问解答记录，支持按账号、问题内容或回复关键字进行全局搜索。
- **全局增量高频词统计排行榜 (Top 15)**：
  - **增量分析引擎**：仅对全新的未处理消息进行增量分词与词频统计，坚决避免重复二次计算。
  - **数据库持久落盘**：分析结果落盘保存至数据库，重启或跨设备均可稳定载入。
  - **点击热词联动**：点击“录取线”、“宿舍”、“学费”等热词标签，可直接一键筛选出对应的全量问答记录。

---

## 💻 面向开发者（技术开发与部署指南）

### 技术栈构成

- **前端 (Frontend)**
  - 框架：React 18 + TypeScript + Vite
  - 样式：TailwindCSS + Vanilla CSS (Glassmorphism 玻璃拟态美学)
  - 组件与图标：Lucide Icons + React Markdown (`remark-gfm`)
- **后端 (Backend)**
  - 运行时：Node.js (ES Modules)
  - Web 框架：Express.js (CORS + JSON Body Parser)
- **AI & Embedding 引擎**
  - 本地 ONNX 特征提取：`@xenova/transformers` (模型 `Xenova/bge-small-zh-v1.5` 生成 512-dim 向量)
  - 大模型接口：集成 DeepSeek LLM API 实现智能语义切片与问答
- **数据持久化与缓存 (Storage & Database)**
  - 主数据库：PostgreSQL + `pgvector` 扩展（支持 512维向量存储与余弦距离检索）
  - 本地文件持久化备用 (Fallback)：JSON Store (`./data/rag_knowledge.json`, `./data/user_sessions.json`, `./data/word_analytics.json`)
  - 缓存层：Redis 缓存支持

---

### 本地开发与部署运行

#### 1. 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

#### 2. 安装依赖
```bash
npm install
```

#### 3. 配置环境变量
在根目录下新建 `.env.local` 或 `.env` 文件：
```env
PORT=3001
DATABASE_URL=postgres://postgres:password@localhost:5432/aurasense
REDIS_URL=redis://localhost:6379
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

#### 4. 启动服务

- **启动后端 API 服务**：
  ```bash
  node server.mjs
  ```
  后端运行在 `http://localhost:3001`。首次启动会自动下载/加载 BGE ONNX 本地向量模型并初始化 JSON / PostgreSQL 数据表。

- **启动前端 Vite 开发服务器**：
  ```bash
  npm run dev
  ```
  前端运行在 `http://localhost:5173`。

---

### 生产环境构建与 Docker 部署

#### 1. 静态前端打包
```bash
npm run build
```
打包输出目录为 `dist/`。

#### 2. Docker Compose 一键部署
项目根目录已配备 `Dockerfile` 及 `docker-compose.yml`：
```bash
docker-compose up -d --build
```
启动后访问 `http://localhost:3001` 即可体验全套服务。
