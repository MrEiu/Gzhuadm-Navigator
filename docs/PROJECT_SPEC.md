# 📖 Gzadm Navigator · 架构与自动化技术规范 (System Specification)

> 🤖 **本文件由自动化脚本 `scripts/generate-docs.mjs` 从源码与配置中动态提取生成**  
> 🕒 **最后同步构建时间**：`2026-09-01 09:40:15`  
> 📦 **当前工程版本**：`v2.0.0` · **运行环境**：`Node.js >=18.0.0`

---

## 🌟 一、 项目概览与技术栈规格

```mermaid
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
```

### 依赖技术栈速览
- **前端核心**：`react@^19.1.0`、`vite@^6.3.5`、`lucide-react`
- **后端核心**：`express@^5.1.0`、`msedge-tts`、`openai`、`pg`、`ioredis`、`onnxruntime-node`
- **构建工具**：`typescript`、`tailwindcss`

---

## ⚙️ 二、 全局环境变量字典 (.env Specification)

从 `.env.example` 自动提取的最新环境变量规格表：

### 📌 基础服务端口与网关配置

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `PORT` | `3001` |

### 📌 大语言模型 (LLM) 网关与双模型协同配置

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `AI_BASE_URL` | `https://api.deepseek.com` |
| `AI_API_KEY` | `your_deepseek_or_openai_api_key_here` |
| `DEFAULT_MODEL` | `deepseek-chat` |
| `DEFAULT_MODEL_PROVIDER` | `DeepSeek (深度求索)` |
| `FAST_AI_BASE_URL` | `https://api.deepseek.com` |
| `FAST_AI_API_KEY` | `your_fast_model_api_key_here` |
| `FAST_MODEL` | `deepseek-chat` |
| `AI_PROTOCOL_MODE` | `auto` |

### 📌 校园伴游语音合成 (TTS Engine) 方案配置

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `TTS_ENGINE` | `msedge` |
| `MSEDGE_VOICE` | `zh-CN-XiaoyiNeural` |
| `ONNX_TTS_MODEL_PATH` | `data/models/tts_vits_zh.onnx` |
| `ONNX_TTS_SPEED` | `1.0` |
| `TTS_API_URL` | `https://api.openai.com/v1` |
| `TTS_API_KEY` | `*(可选留空)*` |
| `TTS_API_MODEL` | `tts-1` |
| `TTS_API_VOICE` | `nova` |

### 📌 招生实时联网搜索引擎 (Web Search Provider)

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `SEARCH_PROVIDER` | `multi` |
| `ENABLE_NATIVE_SEARCH` | `true` |
| `TAVILY_API_KEY` | `*(可选留空)*` |
| `BOCHA_API_KEY` | `*(可选留空)*` |

### 📌 考生注册登录方式 (三选一单选)

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `AUTH_REGISTRATION_MODE` | `username` |
| `ADVANCED_AUTH_ENABLED` | `false` |
| `TENCENT_SMS_SECRET_ID` | `*(可选留空)*` |
| `TENCENT_SMS_SECRET_KEY` | `*(可选留空)*` |
| `TENCENT_SMS_SDK_APP_ID` | `*(可选留空)*` |
| `TENCENT_SMS_SIGN_NAME` | `*(可选留空)*` |
| `TENCENT_SMS_TEMPLATE_ID` | `*(可选留空)*` |
| `SMTP_HOST` | `smtp.qq.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE_ENABLED` | `0` |
| `SMTP_USER` | `*(可选留空)*` |
| `SMTP_PASS` | `*(可选留空)*` |
| `MAIL_FROM` | `*(可选留空)*` |
| `MAIL_FROM_NAME` | `Gzadm-Navigator` |

### 📌 多模态视觉与附件上传 (Vision & File Attachment)

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `ALLOW_USER_MEDIA_UPLOAD` | `true` |

### 📌 云端全要素数据同步微服务 (Cloud Sync Server)

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `CLOUD_SYNC_URL` | `http://localhost:3800` |
| `CLOUD_SYNC_SECRET` | `gzadm_sync_secret_2026` |
| `AUTO_SYNC_ON_STARTUP` | `false` |

### 📌 极速纯净启动模式 (Fast Startup Mode)

| 配置键名 (Key) | 默认示例值 (Default) |
| :--- | :--- |
| `FAST_STARTUP` | `false` |

---

## 📡 三、 核心后端 REST API 接口清单

从后端网关路由自动生成的最新服务接口列表：

| 请求方法 | 路由路径 (Endpoint) | 接口功能与描述 |
| :---: | :--- | :--- |
| 🔵 `POST` | `/api/auth/register` | 考生注册 (普通账号 / 手机号短信 / 邮箱验证码) |
| 🔵 `POST` | `/api/auth/login` | 考生与管理员登录认证 |
| 🔵 `POST` | `/api/auth/send-code` | 触发发送手机短信或邮箱 6 位随机验证码 |
| 🔵 `POST` | `/api/aura/chat` | 招生大模型流式对话 (Dual-LLM 协同 + RAG + 联网检索) |
| 🟢 `GET` | `/api/user/profile` | 获取考生高考背景档案 (分数/省份/位次/头像) |
| 🔵 `POST` | `/api/user/profile` | 更新考生高考画像与偏好设定 |
| 🔵 `POST` | `/api/user/upload-avatar` | 上传考生自定义头像图片 |
| 🟢 `GET` | `/api/user/sessions` | 拉取历史咨询会话记录列表 |
| 🔵 `POST` | `/api/user/sessions` | 同步保存咨询会话与多轮消息 |
| 🟢 `GET` | `/api/campus-map` | 获取校园全景地图坐标、路线与图集 |
| 🟢 `GET` | `/api/agent-config` | 拉取招生百事通 (Dr.) 与伴游导览 (丽丽) 形象与头像 |
| 🟢 `GET` | `/api/tts-config` | 拉取伴游语音合成当前引擎 (Edge/ONNX/API) 及音色列表 |
| 🔵 `POST` | `/api/tts/synthesize` | 即时流式合成伴游导览高保真 MP3 语音音频 |
| 🔵 `POST` | `/api/admin/config` | 管理员更新 AI 网关、双模型调度与搜索配置 |
| 🔵 `POST` | `/api/admin/campus-map` | 管理员更新地图导览点、连线与标注比例 |
| 🔵 `POST` | `/api/admin/agent-config` | 管理员定制智能体人设、名称与头像 |
| 🔵 `POST` | `/api/admin/tts-config` | 管理员调整 TTS 引擎方案、音调语速与参数 |
| 🔵 `POST` | `/api/admin/rag/upload` | 知识库导入招生简章与专业 PDF/TXT 文件 |
| 🟢 `GET` | `/api/admin/dashboard-stats` | 仪表盘系统统计指标 (考生数/会话量/检索性能) |

---

## 🎙️ 四、 语音合成 (TTS) 多引擎参数规格

| 方案模式 | 引擎标识 | 依赖要求 | 特点与适用场景 |
| :--- | :---: | :---: | :--- |
| **方案 1 (推荐)** | `msedge` | `msedge-tts` | 免 Key 微软高保真 Neural 神经网络女声，拟真度高 |
| **方案 2** | `onnx` | `onnxruntime-node` | 纯离线轻量模型推理，0 外部网络调用依赖 |
| **方案 4** | `api` | OpenAI 兼容网关 | 云端高并发定制语音网关 (如 SiliconFlow / 豆包) |

---

## 🛠️ 五、 自动化脚本使用方法

本工程已集成自动生成技术文档的 CLI 命令：

```bash
# 每次修改了路由、环境变量或发布新功能后，运行以下命令即可秒级刷新本文件：
npm run docs:generate
```
