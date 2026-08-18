<div align="center">

# 🎓 Gzadm Navigator (广州大学智能招生问答与全景校园伴游系统)

> **基于双大模型协同路由 (Dual-LLM Routing)、多引擎神经网络语音 (TTS) 与混合增强检索 (Hybrid RAG) 的新一代高校招生咨询与全景伴游平台**

<p align="center">
  <a href="README.md"><b>English</b></a> •
  <a href="README_zh.md"><b>简体中文</b></a> •
  <a href="#-快速开始-quick-start"><b>快速开始</b></a> •
  <a href="#-系统技术架构-architecture"><b>系统架构</b></a> •
  <a href="#-控制台管理维度-admin-suite"><b>管理控制台</b></a>
</p>

[![React](https://img.shields.io/badge/React-19.1-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-1.17-005CED?style=for-the-badge&logo=onnx)](https://onnxruntime.ai/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql)](https://github.com/pgvector/pgvector)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 核心突破与六大技术支柱

### 1. 🧠 双大模型协同路由体系 (Dual-LLM Collaborative Routing)
针对招生咨询中“重度推理”与“轻量高频处理”的不同算力成本诉求，业内首创双模型分层分发架构：
- **主力深度推理模型 (`DEFAULT_MODEL`)**：指派 **DeepSeek-Chat / GPT-4o** 等顶尖大模型，深度负责考生成绩位次研判、梯度专业梯队（冲/稳/保）建议与复杂政策解读。
- **高速轻量模型 (`FAST_MODEL`)**：指派极速大模型，专职负责用户实时意图分类、知识库文档自动切片、结构化实体提取与高并发轻量问答。
- **动态提供商池 (`Provider Pool`)**：支持同时接入 DeepSeek、SiliconFlow（硅基流动）、OpenAI 官方及本地 Ollama 实例，按需一键热切换与健康探活。

### 2. 🎙️ 全真多引擎神经网络伴游语音 (Multi-Engine Neural TTS)
为校园导览助手「丽丽学姐」量身定制三套语音合成引擎，打破机械单调的发音体验：
- **方案 1 · 微软 Edge Neural TTS (免 Key 推荐)**：零成本接入微软云端高保真神经网络女声，内置 `晓伊` (活泼女大)、`晓晓` (知性亲切)、`晓北` (东北幽默)、`晓佳` (广府粤语) 等丰富音色，支持语速（Rate）与音调（Pitch）微调。
- **方案 2 · 本地 ONNX 离线轻量模型**：集成 `onnxruntime-node` VITS 中文离线模型，纯本地毫秒级推理，0 外部网络请求依赖。
- **方案 4 · 自定义 Cloud TTS API**：完美兼容 OpenAI 协议标准，支持对接硅基流动 CosyVoice、字节豆包语音或私有部署网关。
- **双重播放兜底**：前端优先流式解码播放服务端 Neural MP3 高清音频流，弱网或离线时秒级平滑降级至浏览器本地 Web Speech API。

### 3. 🗺️ 高清全景手绘地图与伴游导览 (Interactive Campus Map Canvas)
- **自适应手绘底图画布**：支持超高清手绘校园全景图，自动等比缩放适配多端分辨率，支持自由拖拽平移与手势缩放。
- **可视化标记点位编辑器**：管理员可在后台地图上**直接拖动图钉修改坐标**，支持批量调整全体地标图钉比例、新建推荐漫游路线。
- **独立配置文件落盘**：地图坐标数据与路线持久化独立存放在 `data/campus_map.json`，确保版本迁移与配置热载入稳定可靠。

### 4. 📚 混合增强检索与多源容灾搜索 (Hybrid RAG + Triple-Tier Search)
- **本地极速 Embedding 特征提取**：内置 `@xenova/transformers` BGE 512 维中文向量模型，**0.08 秒**极速冷启动，纯本地离线分词向量化。
- **向量数据库与 JSON 双存储引擎**：支持 PostgreSQL + `pgvector` 高维余弦相似度检索，并内建轻量化 JSON 存储兜底，兼顾大型部署与零依赖一键拉起。
- **三级多源联网容灾检索**：必应全网直连抓取 + DuckDuckGo + 校方招生快照三级容灾调度，并支持按需接入 Tavily AI / 博查 (Bocha) 深度搜索引擎。

### 5. 🛡️ 企业级三选一互斥安全认证通道 (3-Choice Security Auth Channels)
系统提供灵活严谨的考生账户注册安全模式（单选互斥，可在向导或后台自由切换）：
1. **普通账号密码模式**：零外部依赖，采用 `bcryptjs` 加盐哈希加密存储。
2. **手机短信验证码模式**：接入腾讯云 SMS 短信 SDK，支持 6 位防刷短信验证码；内置 DevMock 终端控制台打印兜底，无 Key 也能快速调试。
3. **SMTP 邮箱验证码模式**：标准 SMTP 协议直连（支持 QQ 邮箱 / 163 邮箱 / 腾讯企业邮），免短信资费消耗。

### 6. 🎨 智能体形象定制与考生画像 CRM (AI Personas & Candidate CRM)
- **双角色形象可视化定制**：后台支持一键上传本地图片或输入网络 URL，自由更换 **Dr. Elena (招生专家顾问)** 与 **丽丽学姐 (伴游导览)** 的头像、名称与头衔。
- **多维度考生画像**：精准采集考生高考总分、全省位次、选科组合（物化生/史地政）、加分项及自定义头像，个性化定制推荐梯度。

---

## 🏗️ 系统技术架构 (Architecture)

```mermaid
graph TD
    subgraph 客户端层 (Responsive Client)
        PC[🖥️ 桌面端 Web / 宽屏毛玻璃双栏]
        Mobile[📱 移动端自适应 / 全屏触控]
        Audio[🔊 Multi-Engine TTS 流式播放器]
    end

    subgraph 后端接入层 (Express API Gateway)
        AuthRoute[🛡️ 注册认证: 账号 / SMS短信 / SMTP邮箱]
        ChatRoute[💬 对话总线: 流式多轮响应]
        TTSRoute[🎙️ 语音总线: Edge / ONNX / Cloud API]
        AdminRoute[⚙️ 管理总线: 数据大盘 / 知识库 / 地图编辑]
    end

    subgraph 智能路由与搜索层 (AI & Retrieval Engine)
        DualRouter[🧠 双模型智能路由池]
        DefaultLLM[主力推理: DeepSeek-Chat / GPT-4o]
        FastLLM[极速处理: Fast Model]
        WebSearch[🌐 必应 / DDG / Tavily / 博查多源搜索]
        BGEEmbedding[⚡ 本地 512维 BGE ONNX 向量化]
    end

    subgraph 数据与存储层 (Storage & Persistence)
        PGVector[(PostgreSQL + pgvector 向量检索)]
        RedisCache[(Redis / Valkey 高速缓存)]
        LocalData[(本地持久化 JSON 数据池)]
    end

    PC --> Express
    Mobile --> Express
    Express --> AuthRoute
    Express --> ChatRoute
    Express --> TTSRoute
    Express --> AdminRoute

    ChatRoute --> DualRouter
    DualRouter --> DefaultLLM
    DualRouter --> FastLLM
    ChatRoute --> WebSearch
    ChatRoute --> BGEEmbedding

    BGEEmbedding --> PGVector
    BGEEmbedding -.-> LocalData
    TTSRoute --> Audio
```

---

## 🎛️ 控制台管理维度 (Admin Suite)

管理员（默认账号密码 `admin` / `admin123`）拥有专属的 **7 大可视化工作区**：

| 工作台模块 | 核心功能 | 说明 |
| :--- | :--- | :--- |
| **📊 数据总览 (Dashboard)** | 实时全景大盘 | 监控累计注册考生、总对话轮次、平均检索延迟与 QPS 指标 |
| **📚 知识库管理 (RAG)** | 文档切片与向量检索 | 支持 PDF、Word、TXT、CSV 文档上传，提供 512 维向量比对测试 Console |
| **🗺️ 校园地图管理 (Campus Map)** | 手绘地图与点位标定 | 可视化拖拽修改地标经纬度、配置预设游览路线、自定义图标缩放比例 |
| **👥 考生档案库 (Users CRM)** | 考生画像与策略拦截 | 查看全量考生高考成绩、排位、选科，设置低于拦截分与 VIP 特权线 |
| **💬 消息与词频 (Analytics)** | 增量分词与咨询热词 | 增量统计高频咨询词排行榜（Top 15），一键热词反查真实问答记录 |
| **⚡ 测试中心 (Playground)** | 检索诊断与联网探活 | 实时测试知识库相似度命中率、AI 模型连通延迟与联网搜索抓取质量 |
| **⚙️ 系统全局配置 (Settings)** | 形象/模型/TTS 一站式调优 | 可视化管理 AI 网关、双模型绑定、发音人试听、智能体头像更换与注册通道 |

---

## 🚀 快速开始 (Quick Start)

### 1. 环境依赖
- **Node.js** `>= 18.0.0` (推荐 Node 20 LTS)
- **npm** `>= 9.0.0`
- **PostgreSQL** `>= 15` 带 `pgvector` 扩展（可选，系统内建轻量 JSON 存储双向容灾）

### 2. 克隆与依赖安装
```bash
git clone https://github.com/your-username/gzadm-navigator.git
cd gzadm-navigator
npm install
```

### 3. 一键交互式初始化向导 (`gzhu init`)
系统内置了开箱即用的交互式 CLI 向导，5 步自动引导完成环境部署：
```bash
npm run init
# 或运行 node ./bin/gzhu.mjs init
```
向导将依次协助您配置：
1. **模型提供商池**（DeepSeek / 硅基流动 / OpenAI / Ollama，支持追加与测试）
2. **标准对话模型与快速处理模型分配**（自动拉取远端模型列表供挑选）
3. **考生注册模式**（普通账号密码 / 腾讯云短信 / SMTP 邮件直发）
4. **联网搜索引擎**（多源智能容灾 / 必应全网 / Tavily / 博查）
5. **校园伴游语音 TTS 引擎**（微软 Edge Neural 音色挑选 / ONNX 离线 / 云端 API）

### 4. 启动本地全栈服务
```bash
npm run dev
```
- 前端交互界面：`http://localhost:5173`
- 后端 API 网关：`http://localhost:3001`

---

## ⚙️ 环境变量速查表 (.env Reference)

所有配置均可通过 `npm run init` 向导或后台【系统配置】修改，亦可手动编辑 `.env`：

<details>
<summary><b>🔍 点击展开查看完整配置项字典</b></summary>

```env
# 基础服务端口
PORT=3001

# 主力深度推理模型 (DEFAULT_MODEL)
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=sk-your-api-key-here
DEFAULT_MODEL=deepseek-chat
DEFAULT_MODEL_PROVIDER=DeepSeek (深度求索)

# 高速轻量模型 (FAST_MODEL)
FAST_AI_BASE_URL=https://api.deepseek.com
FAST_AI_API_KEY=sk-your-api-key-here
FAST_MODEL=deepseek-chat
FAST_MODEL_PROVIDER=DeepSeek (深度求索)

# 校园伴游 TTS 语音合成 (msedge | onnx | api)
TTS_ENGINE=msedge
MSEDGE_VOICE=zh-CN-XiaoyiNeural
ONNX_TTS_MODEL_PATH=data/models/tts_vits_zh.onnx
ONNX_TTS_SPEED=1.0

# 联网搜索引擎 (multi | bing | tavily | bocha | none)
SEARCH_PROVIDER=multi

# 考生注册模式 (username | phone | email)
AUTH_REGISTRATION_MODE=username
```

</details>

---

## 📁 项目目录结构 (Directory Tree)

```bash
Gzadm-Navigator/
├── bin/
│   └── gzhu.mjs                 # 交互式 CLI 初始化向导 (gzhu init)
├── data/                        # 数据持久化目录 (地图配置/会话/用户画像)
│   ├── campus_map.json          # 校园地图点位与路线数据
│   ├── agent_avatars.json       # Dr. 与 丽丽学姐头像及人设
│   └── tts_config.json          # TTS 语音引擎配置
├── docs/                        # 专题技术规范与文档
│   └── PROJECT_SPEC.md          # 自动化生成的全量接口与架构规范
├── scripts/
│   └── generate-docs.mjs        # 自动化文档生成脚本
├── server/                      # 后端 Express 微服务
│   ├── app.mjs                  # Express 核心应用实例与路由挂载
│   ├── config/                  # 环境变量与 OpenAI 客户端池
│   ├── routes/                  # 模块化路由 (auth/chat/user/admin/rag)
│   └── services/                # 核心业务服务 (TTS/Embedding/RAG/Search)
├── src/                         # 前端 React 19 SPA
│   ├── api/                     # 接口网络请求封装
│   ├── components/ui/           # 气泡/弹窗/图表等通用业务组件
│   ├── pages/                   # 核心视图
│   │   ├── Admin/               # 7 大管理控制台组件 (Dashboard/Map/RAG/Settings等)
│   │   ├── Auth/                # 认证弹窗与验证码交互
│   │   ├── CampusMap/           # 全景地图伴游与音频播放
│   │   ├── Chat/                # 对话主工作区与历史会话抽屉
│   │   └── UserProfile/         # 考生高考档案与头像设置
│   └── services/                # 前端音频/TTS 播放控制器
├── .env.example                 # 环境变量模板
├── LICENSE                      # MIT 开源授权文件
└── package.json                 # 项目依赖与 Scripts
```

---

## 📱 响应式多端自适应体系 (RWD Architecture)

平台针对桌面端与移动端进行了深度交互自适应优化：
- **桌面端 (Desktop/iPad)**：采用大屏毛玻璃悬浮卡片美学，支持双栏展开历史记录抽屉，地图与地点详情左右双栏并列。
- **移动端 (Mobile)**：自动占满全屏，对齐原生聊天 App 体验；会话抽屉自适应为全屏抽屉，**点击任意会话自动切换并收起侧栏**，输入栏自动适配移动端软键盘弹出。

---

## 🤝 贡献指南 (Contributing)

欢迎提交 PR 或创建 Issue 交流！
1. Fork 本仓库并新建分支 (`git checkout -b feature/MyAwesomeFeature`)
2. 提交代码更改 (`git commit -m 'feat: add some amazing feature'`)
3. 推送分支至远程 (`git push origin feature/MyAwesomeFeature`)
4. 开启一个 Pull Request

---

## 📄 开源协议 (License)

本项目基于 [MIT License](LICENSE) 协议开源发布。欢迎广大高校、开发者及开源爱好者自由使用、学习或二次开发。
