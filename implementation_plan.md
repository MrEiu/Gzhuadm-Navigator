# ☁️ 独立云端数据库微服务与本地智能去重同步方案 (Cloud Sync Ecosystem)

本文档规划了用于 **Gzadm Navigator** 知识库的「独立云端数据库微服务 (`cloud-sync-server`)」与「本地智能去重同步客户端」的完整技术与交互实现方案。

---

## 🎯 方案目标与核心理念

1. **独立云端服务**：在独立文件夹 `cloud-sync-server/` 中构建一个轻量 Express/SQLite 微服务（监听 `0.0.0.0:3800`），可独立部署在任意云服务器、Docker 或内网主机上作为中央知识库。
2. **智能去重推送 (Push)**：本地向云端推送数据时，采用 **SHA-256 内容指纹批量握手**。云端已存在的数据自动跳过，仅上传缺失的增量条目，避免逐条全量比对与网络开销。
3. **增量下拉同步 (Pull)**：基于**高水位时间戳 (`since`)** 毫秒级检索，仅下载本地没有的或他人最新上传的知识并合并。
4. **开机自动无感同步**：本地服务启动时，根据开关配置自动静默同步一次云端数据。
5. **后台可视化工作台**：在管理控制台提供地址配置、密钥管理、连通性探测、数据量看板、一键推送/拉取及实时同步日志流。

---

## 🏗️ 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│  ☁️ 独立云端同步微服务 (cloud-sync-server)                    │
│  - 监听: 0.0.0.0:3800                                       │
│  - 存储: SQLite (cloud_knowledge.sqlite) / JSON 兜底         │
│  - 接口:                                                    │
│    • GET  /api/health            (探活与版本状态)            │
│    • POST /api/sync/check-hashes (指纹批量比对 O(1))         │
│    • POST /api/sync/push         (增量写入缺失知识)          │
│    • GET  /api/sync/pull         (按时间戳增量拉取)          │
│    • GET  /api/sync/stats        (总条数与同步统计)          │
└──────────────────────────────▲──────────────────────────────┘
                               │
               HTTP / JSON 通信 (公网 / 局域网)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  💻 本地节点 (Gzadm Navigator)                               │
│  - 本地启动时: 自动发起 GET /sync/pull?since={last_synced_at}  │
│  - 本地推送时: 计算 SHA-256 指纹 -> 发送缺失项 -> 完成去重推送 │
│  - 管理后台: 【☁️ 云端数据同步】可视化工作台                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 新增与集成文件清单

### 1. 独立云端微服务 (`cloud-sync-server/`)
- `cloud-sync-server/package.json`：独立依赖配置（express, cors, dotenv）。
- `cloud-sync-server/server.mjs`：独立服务端入口，监听 `0.0.0.0:3800`，实现 check-hashes / push / pull / health 等接口。
- `cloud-sync-server/db.mjs`：持久化与哈希索引管理。
- `cloud-sync-server/README.md`：独立云端部署说明（Linux / PM2 / Docker）。
- `cloud-sync-server/.env.example`：端口与安全密钥配置模版。

### 2. 本地主项目同步引擎与 API
- `server/services/cloudSyncClient.mjs`：SHA-256 紧凑指纹算法与 push/pull/testConnection/autoSync 逻辑。
- `server/routes/sync.mjs`：本地同步 API 接口。
- `server/app.mjs`：挂载 `/api/sync`。

### 3. 前端管理后台 UI
- `src/pages/Admin/CloudSyncTab.tsx`：云端连接卡片、数据仪表盘、三大同步操作按钮与实时日志流。
- `src/pages/Admin/AdminLayout.tsx`：集成云端同步与多智能体管理选项卡。
