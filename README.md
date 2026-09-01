<div align="center">

# 🎓 Gzadm Navigator (Guangzhou University Admissions & Campus Companion System)

> 🌟 **Next-Generation University Admissions Intelligence Decision Engine & Panoramic Campus Companion System**  
> Deeply integrates **Tiered Adaptive Dual-Agent Decision Architecture** (0.2s Fast Lightweight Fact RAG vs. 10 Specialized Thought Clones Layered Concurrency) and **Panoramic Campus Companion & Tour System** to build a modern admissions intelligence portal.

<p align="center">
  <a href="README.md"><b>English</b></a> •
  <a href="README_zh.md"><b>简体中文</b></a> •
  <a href="#-quick-deployment--usage-guide"><b>Deployment & Usage</b></a> •
  <a href="#-core-pillar-1-dual-agent-advisory-reasoning-engines"><b>Dual Agent Engines</b></a> •
  <a href="#-core-pillar-2-panoramic-hand-drawn-campus-map--tour-system"><b>Campus Map</b></a> •
  <a href="#-core-pillar-3-independent-localized-rag--personal-memory-self-distillation"><b>Local RAG & Memory Distillation</b></a> •
  <a href="#-innovations--future-outlook"><b>Innovations & Outlook</b></a>
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

## 🚀 Quick Deployment & Usage Guide

Get the system up and running for local testing, development, or server deployment in 3 simple steps:

### 1. Prerequisites & System Requirements
| Component | Minimum | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.16.0+` | **`v20.x LTS`** | ESM (`type: "module"`) required |
| **Memory (RAM)** | 2 GB | **4 GB ~ 8 GB** | Embedded BGE ONNX Chinese embedding takes ~500MB |
| **Default Ports** | `3001` (Backend API) + `4173` (Frontend Web) | - | Auto port-cleanup scripts included |

---

### 2. 3-Step Quick Start

```bash
# ① Clone the repository
git clone https://github.com/MrEiu/Gzadm-Navigator.git
cd "Gzadm Navigator"

# ② Install full-stack dependencies
npm install

# ③ Interactive system initialization (Tests LLM connectivity & generates .env)
npm run init
```

*💡 **Note**: Running `npm run init` launches an interactive terminal wizard that guides you through model selection (DeepSeek / OpenAI, etc.), port checks, and automatic `.env` generation. You can also manually `cp .env.example .env` if preferred.*

---

### 3. Run Locally

```bash
# Concurrently launch backend (3001) & frontend (4173)
npm run dev
```

Open your browser and visit:
👉 **`http://localhost:4173`** to begin the interactive admissions consultation experience!

```bash
# Handy scripts:
npm run build      # Build production bundle
npm run start      # Start backend in production mode
npm run clean      # Free occupied ports (3001 & 4173)
```

---

## 🌟 Core Pillar 1: Dual Agent Advisory Reasoning Engines

To overcome the pitfalls of traditional advisory bots—overthinking simple questions while giving shallow responses to complex decisions—the system introduces a **Tiered Adaptive Dual-Agent Decision Engine**:

### Engine A: ⚡ Tiered Adaptive Fast Lightweight RAG (Fast Direct Inference)
Optimized for frequent, deterministic university fact lookups (e.g., "Tuition fees for CS?", "Dorm configuration & air conditioning?", "Subway routes to Higher Education Mega Center?").
* **L0 · Golden FAQ Direct Cache (0-Token Deterministic Cache)**: Vector pre-filtering + 2-stage semantic verification outputs standard authoritative answers & photos with **<10ms latency and 0 Token consumption**;
* **L1 · Embedded BGE 512-dim Dense Vector Retrieval**: Embedded `@xenova/transformers` lightweight ONNX model (0.09s cold start) executes local cosine similarity search with 0 external network latency;
* **L2 · Single-Core LLM Fact Synthesis**: Bypasses multi-agent thought deduction, sending policy slices directly to the LLM to achieve **first-token latency under 150ms ~ 250ms**.

---

### Engine B: 🧠 Deep Multi-Agent Thought Clones Pipeline
Engineered for complex admissions planning, percentile rank risk assessment, and career path decisions.
* **Design Philosophy (Multi-Perspective Divergence, Unified Synthesis)**: Replaces clumsy 10-20s multi-bot chat rooms with background Thought Clone Workers—evaluating in parallel in the background and unifying on the frontend;
* **10 Specialized Thought Clones Matrix & Dynamic Intent Routing**: Pre-registered domain experts (`Policy & Legal`, `Cutoff & Risk Control`, `Career & Salary`, `Civil Service`, `Postgraduate Academic`, `Course Difficulty`, `Major Transfer`, `Campus Life`, `Tuition & Financial Aid`, `Family Counseling`) with 1~3 clones dynamically dispatched per query;
* **Zero-Latency Layered Parallelism**: A single `Promise.all` executes [Local RAG] + [3 Matched Clones] + [Web Search (2.5s timeout breaker)] concurrently, **finishing all clone deductions within 300ms without serial delays**;
* **Streamed Thought Chain Capsule & Token-Delta Alignment**: Displays smooth single-line animated step transitions (`Routing` ➜ `Fact Retrieval` ➜ `Clones Deduction` ➜ `Conference` ➜ `Compliance Check`), expanding the answer at the exact millisecond the first token streams out;
* **Empathetic Chief Synthesis (Dr. Elena)**: Specialist deductions serve as background evidence synthesized by Chief Advisor Dr. Elena into an authoritative, warm, and actionable strategic plan.

---

## 🗺️ Core Pillar 2: Panoramic Hand-Drawn Campus Map & Tour System

Moving beyond conventional static text directories, the system embeds an **Interactive Panoramic Hand-Drawn Campus Tour Engine** with dynamic spatial AI Q&A integration:

* **🚪 Permanent Sidebar Anchor**: Cleanly fixed at the footer of the session drawer for non-intrusive 1-click access;
* **🗺️ Ultra-HD Hand-Drawn Canvas**: Responsive vector-scaled hand-drawn map with gesture pan and smooth scroll zooming;
* **📍 Live Photo Cards & AI Linkage**: Click any pin (Library, Towers, Dorms) to view photo cards and start location-aware AI consultations;
* **🛠️ Visual Admin Workshop**: Administrators can **drag and drop pins directly on the live map** to reposition landmarks and plan walking routes.

---

## 📚 Core Pillar 3: Independent Localized RAG & Personal Memory Self-Distillation

To simultaneously master authoritative campus regulations and deeply remember each applicant's evolving long-term preferences:

### 1. Independent Localized High-Performance RAG Base
* **Zero-Dependency Dense Embedding**: Embedded `@xenova/transformers` BGE 512-dim ONNX model (0.09s cold start) executes local cosine similarity without heavy external vector DBs;
* **Hybrid Retrieval & Reranking**: Combines dense vector cosine similarity with BM25/Token keyword weighting to ensure 100% precision on course codes and subject requirements;
* **Multi-Agent Domain Isolation**: Knowledge records carry `targetAgent` tags, ensuring specialists retrieve rules strictly within their domain to eliminate multi-agent hallucinations.

### 2. Conversation Self-Distillation into Personal Memory Cards (Long-Term Context)
* **Real-time Semantic Self-Distillation**: Automatically extracts applicant scores, target majors, financial preferences, and family constraints from ongoing conversations, silently distilling them into structured "Personal Memory Cards";
* **Cross-Session Long-Term Context Recall**: Subsequent inquiries automatically retrieve the applicant's private memory repository in parallel with campus policies—no repeated self-introductions required;
* **Admin Visual Memory Audit**: Administrators can inspect and audit any applicant's distilled memory card repository via the backend CRM management tab.

---

## 💡 Innovations & Future Outlook

| Dimension | Traditional University Advisory Bots | Gzadm Navigator Innovation |
| :--- | :--- | :--- |
| **Reasoning Architecture** | Single static prompt template | **Dual Agent Architecture**: 0.2s Fast RAG for facts, 10 Thought Clones for admissions planning |
| **Multi-Agent Latency** | Serial agent execution (10-20s wait) | **Layered Full Concurrency + Millisecond Token Sync**, instant thought capsule flow |
| **Spatial Interaction** | Text only or external links | **Integrated Panoramic Hand-Drawn Map Canvas**, sidebar-anchored with location-linked AI Q&A |
| **Multimodal Upload** | Text-only input | **Unified Multimodal Upload**: Auto-routes images (VL model) & documents (PDF/Word/Excel text chunking) |
| **UI Aesthetics** | Basic chat window | **Enterprise UI Studio**: 13+ themes (@ant-design/x, @assistant-ui, iOS 18) & 24 animated GIF memes |
| **Open Integrations** | Closed monolithic system | **Stateless REST API**: Single POST enables instant integration with WeChat, Feishu, DingTalk, & Dify |

---

## 🎛️ Enterprise Admin Console & Management Studio

A fully featured visual admin control panel is accessible directly via the top navigation bar:

* **📊 Real-time Dashboard & Telemetry**: Live metrics for advisory volume, response latency distribution (P50/P99), Token throughput, hot keyword clouds, and trending question rankings;
* **📚 RAG Knowledge Base Manager**: Full CRUD operations on admissions policies, cutoffs, and programs with automated batch document chunking (PDF/Word/TXT);
* **⚡ Golden FAQ Templates Studio**: Configure deterministic question-answer rules for high-frequency queries to provide zero-token instant standard replies;
* **🧠 Multi-Agent Thought Clones Manager**: Live prompt engineering, persona weighting, and knowledge scope configuration for all 10 domain thought clones;
* **🗺️ Visual Campus Map Workshop**: **Drag and drop pins directly on the hand-drawn canvas** to adjust coordinates, manage photo albums, and plot recommended walking tours;
* **👥 Applicant CRM & Conversation Audit**: Manage applicant profiles (province, score, rank, subjects), audit historical chat trajectories, and control user access;
* **⚙️ AI Gateway & System Settings**: Live hot-swapping of LLM providers (DeepSeek / OpenAI / Qwen), protocol modes, TTS voice timbres, and web search engines.

---

## 📂 Project Structure

```
.
├── server/                          # Express backend engine & services
│   ├── app.mjs                      # Express application entry
│   ├── config/                      # AI gateway, environment, clones registry
│   ├── routes/                      # Chat, auth, RAG, and admin routes
│   └── services/                    # Thought pipeline, embedding, TTS, web search
├── src/                             # React 19 client application
│   ├── components/ui/               # Chat bubbles, sticker picker, thought chain
│   ├── constants/                   # Bubble themes, GIF memes, campus landmarks
│   ├── pages/                       # ChatPage, AdminLayout, CampusMapModal
│   └── types/                       # TypeScript definitions
├── data/                            # RAG knowledge base, FAQ templates, SQLite
├── public/                          # Campus map canvas & media uploads
├── package.json
└── vite.config.ts
```

---

## 📄 License
This project is licensed under the **[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)** License:
* **Attribution**: You must give appropriate credit, provide a link to the license, and indicate if changes were made;
* **NonCommercial**: You may not use the material for commercial purposes;
* **ShareAlike**: If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

See [LICENSE](LICENSE) for the full text.

<div align="center">
  <b>Built with ❤️ by the Gzadm Navigator Team</b><br/>
  <i>Guangzhou University Admissions Intelligence Engine & Panoramic Campus Companion System</i>
</div>
