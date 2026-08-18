# 后台管理系统 UI 深度优化与功能重构实施方案

本方案为 **Gzadm Navigator 后台管理系统** 进行全新设计与升级，打造现代化、高颜值的全功能管理控制台（Admin Management Console）。

---

## 1. 整体布局与视觉架构

```mermaid
graph TD
    subgraph AdminLayout[后台全屏管理控制台]
        Sidebar[左侧固定侧边栏]
        MainContent[右侧内容呈现区]
        
        Sidebar --> TopAdmin[顶部: 管理员头像 + 状态点 + 超管标识]
        Sidebar --> NavMenu[功能导航: 数据大盘 / 知识库 / 考生档案 / 词频分析 / 测试中心]
        Sidebar --> BottomConfig[左下角: 系统配置中心 + 退出登录]
        
        MainContent --> PageDashboard[1. 📊 数据大盘 (KPI卡片 + 状态监控 + 快捷操作)]
        MainContent --> PageRAG[2. 📚 知识库管理 (卡片/表格/智能切片/图片管理)]
        MainContent --> PageUsers[3. 👥 考生档案库 (高考分数/排位/偏好档案)]
        MainContent --> PageAnalytics[4. 📈 词频与对话分析 (意向词云 + 对话记录)]
        MainContent --> PagePlayground[5. 🧪 检索测试中心 (RAG精确打分测试 + 联网搜索实时测试)]
        MainContent --> PageSettings[6. ⚙️ 系统配置中心 (网关/APIKey/一键拉取双模型/搜索引擎选配)]
    end
```

---

## 2. 核心功能模块设计

### 2.1 现代化左侧边栏 (Sidebar)
* **顶部管理员卡片**：渐变发光管理员头像、`Admin` 名称、`● 系统超级管理员 (在线)` 状态指示灯。
* **核心导航列表**：
  1. `📊 数据大盘 (Dashboard)`
  2. `📚 知识库管理 (Knowledge Base)`
  3. `👥 考生档案库 (Student Profiles)`
  4. `📈 词频与对话 (Analytics)`
  5. `🧪 检索与测试中心 (Test Playground)`
* **底部固定设置区**：
  * `⚙️ 模型与网关配置 (Settings)`（高亮入口）
  * `🚪 退出管理 (Logout)`

---

### 2.2 📊 数据大盘 (Dashboard)
* **4 大核心 KPI 统计卡片**：
  * **知识库条目总数**（含表格/图文/图集分类标签分布）；
  * **注册考生总数 & VIP 保障用户数**（>580分高分考生画像）；
  * **本地 BGE 向量模型状态**（512 维 ONNX 引擎、本地模型缓存命中）；
  * **当前 AI 网关 & 快速模型状态**（当前模型名称、Redis 缓存状态）。
* **知识分布与分类占比卡片**（录取分数、宿舍生活、学费资助、专业介绍等）。
* **快速操作面板**（一键新建知识、一键 AI 文档切片、进入测试中心、进入配置中心）。

---

### 2.3 🧪 检索与测试中心 (Test Playground)
* **Tab 1: RAG 知识库检索精测**：
  * 输入测试查询（如“浙江 计算机”、“宿舍四人间配置”）；
  * 实时展示：**分词 Token 拆解**、**向量余弦相似度**、**最终得分加权**、**自适应 Top-K 截断状态**；
  * 渲染命中条目的标题、分类、表格预览与图片附件，并支持查看原始 JSON Payload。
* **Tab 2: 联网搜索实时测试**：
  * 输入搜索词（如“2025 全国高考报考人数趋势”、“人工智能与计算机就业中位数”）；
  * 支持自由切换搜索引擎（Tavily / 博查 AI / DuckDuckGo）；
  * 即时发起网络搜索，展示搜索耗时、标题、外部真实 URL 链接、清洗后正文摘要与来源标签。

---

### 2.4 ⚙️ 系统模型与引擎配置中心 (Settings)
* **AI 大模型网关配置**：
  * 服务商快捷预设（DeepSeek、OpenAI、阿里通义千问、硅基流动、智谱GLM、月之暗面Kimi、自定义 OpenAI-Compatible）；
  * Base URL 与 API Key 输入；
  * **一键获取模型列表按钮**：点击直接调用 `${baseUrl}/models` 动态更新模型下拉框；
  * **默认对话模型 (`DEFAULT_MODEL`)** 与 **快速模型 (`FAST_MODEL`)** 下拉选择。
* **联网搜索引擎配置**：
  * 提供商选择（Tavily / 博查 Bocha / DuckDuckGo 免Key / 禁用）；
  * 填入 `TAVILY_API_KEY` 或 `BOCHA_API_KEY`；
* **在线一键保存**：点击保存立即持久化写入 `.env` 并即时刷新服务端内存实例。

---

## 3. 后端 API 扩展 (`server.mjs`)
1. `GET /api/admin/dashboard-stats`：汇总大盘数据（知识库条目、用户统计、模型状态、分类统计）。
2. `POST /api/admin/web-search`：提供给测试中心的即时联网搜索 API（支持指定搜索引擎调试）。
3. `GET /api/admin/config` & `POST /api/admin/config`：读取与在线保存系统配置。

---

## Proposed Changes

### 后端 API 扩展
#### [MODIFY] [server.mjs](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/server.mjs)
* 增加 `/api/admin/dashboard-stats`、`/api/admin/config` (GET & POST) 与完善 `/api/admin/web-search`。

### 前端 UI 重构
#### [MODIFY] [aurasense.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/aurasense.tsx)
* 将原有简单的 Admin Tab 模式升级为**全屏自适应现代化管理控制台**：
  * 左侧常驻高颜值侧边栏（管理员头像、名称、状态灯、分类导航、左下角配置入口）；
  * 实现完整的 **Dashboard 大盘组件**；
  * 实现 **Playground 测试中心组件**（RAG 精测 + 联网搜索测试）；
  * 实现 **Settings 配置中心组件**（可视化模型网关、一键拉取模型、双模型与搜索引擎配置）。
