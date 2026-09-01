<div align="center">

# 🎓 Gzadm Navigator (广州大学智能招生问答与全景校园伴游系统)

> 🌟 **新一代高校智能招生决策大脑与全景空间伴游导览系统**  
> 深度融合 **分级自适应双 Agent 决策大脑**（0.2s 极速事实直出 vs 10 大专业思维分身同层并发推演）、**全景校园伴游导览**打造兼具极致响应速度与高维填报洞见的现代化高招数智咨询门户。

<p align="center">
  <a href="README.md"><b>English</b></a> •
  <a href="README_zh.md"><b>简体中文</b></a> •
  <a href="#-快速部署与使用指南"><b>部署与使用</b></a> •
  <a href="#-核心亮点一两大-agent-咨询推理机制深度剖析"><b>两大 Agent 机制</b></a> •
  <a href="#-核心亮点二全景手绘校园地图与伴游导览系统"><b>全景手绘地图</b></a> •
  <a href="#-核心亮点三独立本地化-rag-架构与对话自蒸馏记忆卡库"><b>本地 RAG 与记忆自蒸馏</b></a> •
  <a href="#-创新突破与应用前景"><b>创新与前景</b></a>
</p>

[![React](https://img.shields.io/badge/React-19.1-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-1.17-005CED?style=for-the-badge&logo=onnx)](https://onnxruntime.ai/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql)](https://github.com/pgvector/pgvector)
[![Ant Design X](https://img.shields.io/badge/@ant--design/x-AI_UI-1677ff?style=for-the-badge&logo=antdesign)](https://x.ant.design/)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg?style=for-the-badge)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

</div>

---

## 🚀 快速部署与使用指南

无论是本地快速体验、二次开发还是服务器生产部署，仅需以下 3 步即可轻松启动：

### 1. 环境准备与依赖要求
| 组件 | 最低要求 | 推荐版本 | 说明 |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.16.0+` | **`v20.x LTS`** | 必须支持 ESM (`type: "module"`) |
| **内存 (RAM)** | 2 GB | **4 GB ~ 8 GB** | 本地 BGE 中文向量模型冷启动约需 500MB |
| **默认占用端口** | `3001` (后端 API) + `4173` (前端 Web) | - | 启动脚本已内置端口自愈与清理工具 |

---

### 2. 三步极速运行

```bash
# ① 克隆项目代码仓库
git clone https://github.com/MrEiu/Gzadm-Navigator.git
cd "Gzadm Navigator"

# ② 安装全栈依赖包
npm install

# ③ 一键交互式初始化系统配置（自动检测端口、配置大模型并生成 .env）
npm run init
```

*💡 **说明**：运行 `npm run init` 后，终端会弹出友好的交互式问答向导，自动帮你测试大模型（DeepSeek / OpenAI 等）连通性并生成 `.env` 配置文件。若偏好手动配置，亦可直接 `cp .env.example .env` 并编辑。*

---

### 3. 启动与访问

```bash
# 全栈并发启动（同时拉起后端 3001 与前端 4173）
npm run dev
```

启动完成后，在浏览器打开：
👉 **`http://localhost:4173`** 即可立即进入系统进行招生咨询体验！

```bash
# 常用指令速查：
npm run build      # 生产环境全量编译打包
npm run start      # 仅启动生产后端服务
npm run clean      # 清理并释放 3001 与 4173 端口占用
```

---

## 🌟 核心亮点一：两大 Agent 咨询推理机制深度剖析

针对传统高校咨询 Bot“简单问题假装深思耗时太久”、“复杂报考决策又流于表面”的痛点，系统自主研发了**分级自适应双 Agent 决策大脑**，支持在界面顶部秒级无缝切换：

### 机制 A：⚡ 分级自适应极速轻量 RAG 引擎（Fast Lightweight Direct Inference）
专为高频、确定性的校方固定事实查询而生（如：“计算机学费多少？”、“宿舍几人间、上床下桌吗？”、“大学城校区怎么坐地铁？”）。
* **L0 级 · 黄金 FAQ 毫秒直出 (0-Token Deterministic Cache)**：基于向量初筛与二阶段语义核验，命中标准问答后直接输出权威答案与实景图片，**延迟 <10ms，消耗 0 Token**；
* **L1 级 · 本地 BGE 512 维密集向量检索 (Dense Retrieval)**：内置 `@xenova/transformers` 中文轻量向量模型（冷启动 0.09s），本地离线执行余弦相似度检索，0 外部网络通信开销；
* **L2 级 · 单核 LLM 事实直出 (Single-Core Synthesis)**：跳过多智能体推演，单核携带政策切片直奔主题，**首字延迟压缩在 150ms ~ 250ms 内**，百字以内干脆利落给出结论。

---

### 机制 B：🧠 深度思维分身协同推演管线（Deep Multi-Agent Thought Pipeline）
专为复杂的志愿填报推演、分数梯度风控、专业抉择与未来出路等复合决策问题而生。
* **设计哲学（多维独立发散，单一大脑收敛）**：彻底重构传统多智能体聊天室“互相对话耗时 10-20 秒”的缺陷，将其封装为后台专业思维分身内核（Thought Clone Workers），后台并发研判，前端统一收敛；
* **10 大专业思维分身矩阵与动态意图选派 (Dynamic Intent Routing)**：预置覆盖高招全链路的专业智囊（`选科政策法务`、`录取位次风控`、`行业薪资前景`、`体制考公考编`、`考研学术深造`、`课程学业难度`、`转专业退路`、`生活硬件住宿`、`学费资助政策`、`家庭诉求调解`），根据提问动态选派 1~3 个内核；
* **同层全异步并发推演 (Zero-Latency Layered Concurrency)**：在单个 `Promise.all` 中毫秒级并发运行【本地事实检索】+【3 位分身独立研判】+【三级多源联网搜索（2.5s 熔断保护）】，**全部分身与 RAG 检索在 300ms 内同步完成，0 额外串行等待**；
* **极简流式思维链与首字 Token 级对齐 (Token-Delta Stream Sync)**：单行胶囊动效丝滑推进 `分流下发` ➜ `事实检索` ➜ `分身研判` ➜ `专家商讨` ➜ `合规检测`，首字涌出瞬间无缝展开正文，回答完毕收拢归档；
* **Dr. Elena 首席顾问综合总装 (Synthesizer Orchestration)**：各分身论据作为后台内生论据，由 Dr. Elena 统一以权威亲切的长辈口吻融会贯通，第一句话直击靶心，给出具前瞻性且可落地的个性化指导。

---

## 🗺️ 核心亮点二：全景手绘校园地图与伴游导览系统

突破传统招生网纯文字列表的枯燥体验，系统内置了**大学城校区全景手绘地图伴游系统**，实现空间地标与 AI 问答的双向联动：

* **🚪 侧边栏常驻唤出**：入口固定于左侧历史抽屉最底部，随时一键弹出，不干扰正常对话流；
* **🗺️ 高精度手绘画布**：大学城校区超高清手绘底图，支持自由拖拽平移与多级手势滚轮平滑缩放；
* **📍 图钉实景与 AI 联动**：点击地标（图书馆、文俊楼、广大塔、红棉路、学生公寓等）即览实景照片与设施功能简介，支持“一键向 AI 咨询该地点”；
* **🛠️ 后台可视化点位工坊**：管理员可在地图上**直接鼠标拖拽图钉修改坐标**，支持批量缩放与漫游步道路线规划。

---

## 📚 核心亮点三：独立本地化 RAG 架构与对话自蒸馏记忆卡库

为了实现“既掌握全量校方权威政策，又深度理解每个考生的个性化长期诉求”，系统构建了高内聚的本地向量知识引擎与终身记忆沉淀系统：

### 1. 独立本地化高可用 RAG 知识底座 (Localized Hybrid RAG Base)
* **零外部依赖的密集向量引擎**：内嵌 `@xenova/transformers` BGE 512 维中文轻量向量模型，冷启动仅需 **0.09 秒**，无需额外部署 Milvus/Pinecone 等外部重型数据库；
* **混合检索与多模态重排 (Dense-Sparse Hybrid Retrieval)**：融合“向量余弦相似度 + BM25/Token 精确加权”双轨检索，彻底杜绝专业名词与招生代码失真；
* **多智能体知识逻辑隔离 (Domain Isolation)**：各条目配备 `targetAgent` 隔离标签，不同分身精准检索专属政策库，从根源消除多智能体幻觉。

### 2. 对话自蒸馏进个人 RAG 记忆卡库 (Personal Memory Self-Distillation)
* **意图与诉求动态自蒸馏 (Auto-Distillation)**：在多轮对话交互中，系统自动识别并提炼考生透露的分数位次、偏好专业、学费预算、考研倾向及家庭地域诉求，静默蒸馏为结构化“个人专属记忆卡片”；
* **跨会话长期上下文自适应召回 (Long-Term Context Recall)**：考生在后续任何咨询会话中发起提问，系统均会自动并行检索其专属记忆卡库，实现“无需反复自我介绍”的终身个性化认知；
* **后台专属记忆可视化审计**：管理员可在后台【用户与CRM管理】中，一键调阅任意考生的【专属记忆库】进行画像分析与记忆审计。

---

## 💡 创新突破与应用前景

| 维度 | 传统高校招生 Bot / 问答系统 | Gzadm Navigator 创新突破 |
| :--- | :--- | :--- |
| **推理架构** | 单一 Prompt 模板，生搬硬套 | **双 Agent 引擎**：简单问题 0.2s 轻量 RAG 直出，复杂报考 10 大专业分身同层并发推演 |
| **协同效率** | 多智能体串行思考，等待 10~20 秒 | **同层并发执行 + 毫秒级 Token 对齐**，流式思维链与首字无缝呈现 |
| **空间交互** | 仅纯文本回复或外部链接跳转 | **内置全景手绘地图伴游**，侧边栏常驻，图钉拖拽编辑，空间与问答双向联动 |
| **多模态能力** | 仅支持打字输入 | **统一附件上传引擎**：智能识别图片（VL 视觉大模型）与各类文档（PDF/Word/Excel 切片抽取） |
| **UI 表现力** | 简陋的基础对话框 | **开源 UI 组件库深度定制工坊**：支持 `@ant-design/x`、`@assistant-ui`、iOS 18 等 13+ 款皮肤与 24 款精选 GIF 动图 |
| **对外开放性** | 封闭系统，难以嵌入其他生态 | **纯无状态 REST API**：单次 POST 即可无缝接入微信、企业微信、飞书、钉钉与 Dify/FastGPT |

---

## 🎛️ 企业级后台管理控制台 (Admin Console)

系统提供功能完备的可视化后台管理面板（访问路径：顶栏点击管理员入口即可进入），赋能招办管理人员与系统运维人员进行全要素运营管控：

* **📊 运行总览与流量监控 (Dashboard)**：实时展示咨询总量、响应时延分布 (P50/P99)、Token 消耗、考生关注专业热词云与高频问题排行；
* **📚 RAG 招生知识库管理 (RAG Manager)**：支持对校方招生政策、历年录取分数、专业介绍条目进行在线增删改查，支持本地批量文档切片解析导入（PDF/Word/TXT）；
* **⚡ 黄金 FAQ 模板引擎 (FAQ Studio)**：针对高频核心问答配置确定性规则匹配，实现零 Token 消耗的毫秒级标准答案直出；
* **🧠 多智能体分身配置 (Thought Clones & Multi-Agent)**：在线热更新 10 大专业智囊分身的人设 Prompt、知识管辖范围及权重调优；
* **🗺️ 校园地图可视化点位工坊 (Campus Map Workshop)**：支持在高清手绘全景地图上**直接鼠标拖拽图钉修改坐标**、配置实景相册与规划漫游步道路线；
* **👥 考生用户档案与对话审计 (Users & CRM)**：支持查看注册考生高考档案画像（省份、总分、排位、选科）、历史对话全流程审计与权限管理；
* **⚙️ 系统环境与 AI 网关配置 (Settings)**：支持在后台热切换大模型服务商（DeepSeek / OpenAI / Qwen 等）、协议模式、TTS 语音引擎与联网搜索引擎配置。

---

## 📂 项目工程目录结构

```
.
├── server/                          # 后端 Express 引擎与服务模块
│   ├── app.mjs                      # Express 应用入口与路由挂载
│   ├── config/                      # AI 网关、环境变量与分身注册表
│   ├── routes/                      # 聊天、认证、RAG 与后台管理路由
│   └── services/                    # 思维分身管线、向量引擎、TTS 与联网搜索
├── src/                             # 前端 React 19 应用源码
│   ├── components/ui/               # 气泡组件、表情选择器、思维链组件
│   ├── constants/                   # 气泡主题、GIF 动图库、校园地标
│   ├── pages/                       # ChatPage、AdminLayout、CampusMapModal
│   └── types/                       # TypeScript 核心数据类型定义
├── data/                            # 校方招生政策库、FAQ 模板、SQLite 数据库
├── public/                          # 校园地图底图与上传静态资源
├── package.json
└── vite.config.ts
```

---

## 📄 开源许可证
本项目遵循 **[CC BY-NC-SA 4.0（署名-非商业性使用-相同方式共享 4.0 国际）](https://creativecommons.org/licenses/by-nc-sa/4.0/)** 许可证开源：
* **署名 (Attribution)**：必须给出适当的署名，提供指向本许可证的链接，并指明是否对原有内容进行了修改；
* **非商业性使用 (NonCommercial)**：不得将本软件及任何衍生版本用于商业盈利目的；
* **相同方式共享 (ShareAlike)**：若对本软件进行修改、转换或二次创作，必须以相同的许可证共享您的贡献。

详情请参阅 [LICENSE](LICENSE) 文件。

<div align="center">
  <b>Built with ❤️ by the Gzadm Navigator Team</b><br/>
  <i>广州大学智能招生决策大脑与全景校园伴游系统</i>
</div>
