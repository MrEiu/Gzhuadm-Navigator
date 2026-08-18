# 多源联网搜索引擎与智能体集成实施方案

本方案为智能体（Dr. Elena）集成统一的**多源联网搜索（Web Search）引擎**，支持 **Tavily**、**博查 AI (Bocha)** 与 **DuckDuckGo (免 Key 自动兜底)**，并在 `gzhu init` 中提供可视化配置。

---

## 1. 搜索引擎架构与自动降级机制

```mermaid
graph TD
    UserQuery[考生/家长提问] --> AgentDecision{Agent 自主判断}
    AgentDecision -->|本校专属事实| CampusRAG[校方 RAG 检索]
    AgentDecision -->|全国政策/跨校对比/行业就业| WebTool[webSearch 联网搜索工具]
    
    WebTool --> Router{搜索提供商路由}
    Router -->|配置了 Tavily| P1[Tavily API (@tavily/core)]
    Router -->|配置了 博查| P2[博查 AI (Bocha REST API)]
    Router -->|未配置或请求异常| P3[DuckDuckGo (duck-duck-scrape 自动兜底)]
    
    P1 --> Format[统一格式化: 标题 + 网页链接 + 正文摘要]
    P2 --> Format
    P3 --> Format
    Format --> AgentResponse[Agent 综合输出带来源引用的回答]
```

### 1.1 搜索提供商与优先级规则
1. **Tavily (`SEARCH_PROVIDER=tavily`)**：使用 `@tavily/core`，返回针对 LLM 精准清洗的 Markdown 摘要和链接。
2. **博查 AI (`SEARCH_PROVIDER=bocha`)**：国内中文互联网（阳光高考、高校官网、行业政策）深度检索。
3. **DuckDuckGo (`duck-duck-scrape`)**：
   * **免 Key 方案**：若用户未配置任何 Key，默认直接使用 DuckDuckGo；
   * **自动故障降级**：若 Tavily 或博查调用遇到配额耗尽/网络超时，自动无缝降级到 DuckDuckGo 抓取，保障搜索永不中断。

---

## 2. `gzhu init` 交互式配置升级 (`bin/gzhu.mjs`)

在完成模型配置后，新增 **步骤 3：联网搜索引擎配置**：
```
===============================================================
🌐 请选择联网搜索引擎 (用于查询全国政策、外部高校对比与实时资讯):
===============================================================

  [1] Tavily (推荐 · AI 原生搜索 · 需填 Key)
  [2] 博查 AI (国内中文政策优化 · 需填 Key)
  [3] DuckDuckGo (免 Key · 免费开箱即用)
  [4] 禁用联网搜索
```
- 选择 [1] 或 [2]：引导输入对应的 `TAVILY_API_KEY` 或 `BOCHA_API_KEY`；
- 选择 [3]（或直接回车）：配置 `SEARCH_PROVIDER=duckduckgo`（无需任何 Key）；
- 自动写入 `.env` 文件并完成一次搜索连通性验证。

---

## 3. 服务端与 Agent 工具封装 (`server.mjs`)

### 3.1 统一搜索服务函数 `performWebSearch(query, count = 3)`
* 输入：检索关键词 `query`
* 输出：`[{ title, url, snippet, source }]` 统一结构。
* 具备 3 重容灾（Tavily/Bocha -> DuckDuckGo -> 空保护）。

### 3.2 智能体工具 `webSearchTool`
* 注入 `createAdmissionsAgent` 的 tools 数组。
* 明确在 System Prompt 与 Description 中指引模型：
  * 查本校历史分数、宿舍环境配置与图片 -> 调用 `searchCampusKnowledge`；
  * 查全国政策、教育部新规、各行业就业薪资中位数、跨校对比 -> 调用 `webSearch`。

---

## Proposed Changes

### 1. 依赖管理 (`package.json`)
#### [MODIFY] [package.json](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/package.json)
* 安装依赖：`@tavily/core`、`duck-duck-scrape`。

### 2. 初始化指令升级 (`bin/gzhu.mjs`)
#### [MODIFY] [gzhu.mjs](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/bin/gzhu.mjs)
* 增加联网搜索引擎选择菜单（Tavily / 博查 / DuckDuckGo / 禁用）。
* 增加 `gzhu search <query>` 快捷测试命令。
* 更新 `.env` 保存逻辑（`SEARCH_PROVIDER`、`TAVILY_API_KEY`、`BOCHA_API_KEY`）。

### 3. 后端搜索与工具注入 (`server.mjs`)
#### [MODIFY] [server.mjs](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/server.mjs)
* 实现 `performWebSearch` 统一聚合与降级函数。
* 定义并导出 `webSearchTool`。
* 将 `webSearchTool` 添加至 `createAdmissionsAgent`。

---

## Verification Plan

### 1. CLI 初始化测试
* 运行 `node ./bin/gzhu.mjs --help` 验证新增指令；
* 运行搜索测试：验证 DuckDuckGo / Tavily / 博查 能正常返回结构化网页信息与链接。

### 2. Agent 问答多场景测试
* 提问 1（外部实时资讯）：“2025年全国高考报名人数是多少？目前计算机专业就业中位数情况如何？”
  * 验证：Agent 准确触发 `webSearch` 并输出包含参考来源链接的解答。
* 提问 2（校内权威事实）：“浙江考生报广州大学计算机科学与技术，历年分数线是多少？”
  * 验证：Agent 依然优先触发 `searchCampusKnowledge` 本地 RAG，两者互不干扰。
