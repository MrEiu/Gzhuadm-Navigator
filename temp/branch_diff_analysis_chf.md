# 📊 `origin/chf` 分支差异对比与架构分析报告

> **生成时间**：2026-08-20  
> **对比分支**：`main` (本地开发主分支) vs `origin/chf` (远程功能分支)  
> **涉及文件**：
> - `server/routes/chat.mjs`
> - `server/services/agentService.mjs`
> - `server/services/postgres.mjs`
> - `server/services/ragEngine.mjs`

---

## 📌 一、核心改动概要 (What did `origin/chf` do?)

`origin/chf` 分支的核心目的是**针对【广州大学2025年广东省物理类各专业录取数据】做了一套专门的硬编码/定制化增强机制**：

```
origin/chf 改动全貌：
├── 1. postgres.mjs    -> 新增 loadPhysicsAdmissionsRagItem()，尝试读取 2025 广东物理类录取 json
├── 2. ragEngine.mjs   -> 新增 buildAdmissionSearchView()，正则提取提问中的分数/排位/专项并过滤表格
├── 3. agentService.mjs-> 在 System Prompt 中硬编码追加 2025 广东物理类招生数据优先级指令
└── 4. chat.mjs        -> 命中该特定 ID 时，直接截断并强行返回格式化表格
```

---

## 🔍 二、逐文件详细改动剖析

### 1. `server/services/postgres.mjs`
- **新增函数**：`loadPhysicsAdmissionsRagItem()`
  - 尝试读取本地文件 `data/gzhu_2025_guangdong_physics_admissions.json`；
  - 若文件存在，将其解析并组装为一个固定 ID 为 `gzhu-2025-guangdong-physics-admissions` 的 RAG 知识条目，包含完整 5 列 `tableData`（科类、类别、专业名称、最低分、最低分位次）；
- **生命周期挂载**：
  - 在 `initPostgres` 中，执行 `ON CONFLICT (id) DO UPDATE` 强制向 PostgreSQL 的 `rag_knowledge` 表插入该数据；
  - 在 `loadJsonRag` 中，优先将该条目置顶插入本地 JSON 知识库。

### 2. `server/services/ragEngine.mjs`
- **新增常量与正则匹配**：
  - `PHYSICS_ADMISSIONS_RAG_ID = 'gzhu-2025-guangdong-physics-admissions'`；
  - `ADMISSIONS_QUERY_PATTERN = /(广州大学|广大|2025|广东|物理类|专业|录取|最低分|分数线|位次|排位|排名|志愿|报考)/`；
- **新增检索过滤视图**：`buildAdmissionSearchView(item, query)`
  - 用正则表达式从用户问题中捕获具体的分数（如 `580分`）、位次（如 `排位 35000`）、报考类别（如 `普通文理`、`地方专项`、`教师专项`、`国际班`、`中外合作办学`、`高水平运动队`）以及专业关键词；
  - 自动对包含海量专业的大表格进行预先筛选与截断（默认按排位升序保留前 15~30 行）；
- **打分机制调整**：
  - 只要命中该特定 ID 且问题匹配招生模式，强制追加 **`+12.0` 分的绝对优先权重**（`priorityBonus`）；
- **输出格式化增强**：
  - 在 `formatRagContext` 中为该条目增加了专属的 Markdown 表格排版渲染逻辑与免责说明。

### 3. `server/services/agentService.mjs`
- **System Prompt 强约束指令追加**：
  - 在 `createAdmissionsAgent` 的提示词末尾硬编码追加了一段强约束指令：
    > `【2025广东物理类招生数据优先级】当问题涉及广州大学广东省物理类专业报考、最低分、最低分位次、专业对比或志愿参考时，必须优先调用 searchCampusKnowledge，并以“广州大学2025年广东省物理类各专业录取最低分与最低分位次”数据为事实依据。按普通文理、地方专项、教师专项、国际班、中外合作办学、高水平运动队分别比较，不得混用类别或编造缺失数据。`

### 4. `server/routes/chat.mjs`
- **直接拦截与短路返回**：
  - 在普通快速问答流中，只要首条命中的 RAG ID 是 `gzhu-2025-guangdong-physics-admissions`，直接 `return res.json({ ok: true, reply: ..., source: 'local-bge-rag-db' })`，绕过后续的大模型生成流程。

---

## ⚖️ 三、价值与亮点评估 (Pros)

1. **大表格细粒度预检索思想非常有价值**：
   - 对于包含几十甚至上百行专业的超大录取线表格，直接全量塞入 Prompt 容易超出上下文 Token 限制，或者导致大模型在长文本中遗漏具体专业。
   - `chf` 分支尝试在 RAG 检索阶段通过提取用户的分数、排位和意向类别，预先筛选出最相关的 15~30 行，**这种针对大表格的 Search View 预过滤思路非常值得肯定**。
2. **招生类别防混淆提示词设计合理**：
   - 明确指出普通文理、地方专项、中外合作等录取门槛完全不同，防止大模型将“地方专项的低分”误作为“普通类门槛”推荐给考生。

---

## ⚠️ 四、存在的问题与架构风险 (Cons & Risks)

1. ❌ **严重硬编码，破坏通用 RAG 架构**：
   - 在 4 个核心文件中到处写死了字符串 `'gzhu-2025-guangdong-physics-admissions'`；
   - 一旦管理员上传 2024 年数据、历史类数据、外省录取表或生活规章时，这套硬编码逻辑完全不生效，使系统退化为“单次针对性脚本”，破坏了通用扩展性。
2. ❌ **依赖的外部数据文件缺失**：
   - 该分支依赖的 `data/gzhu_2025_guangdong_physics_admissions.json` **并没有提交到 Git 中**；
   - 在没有此文件的情况下，代码运行时会直接命中 `if (!fs.existsSync) return null`，大部分改动沦为失效的死代码。
3. ❌ **暴力拦截破坏了智能体推理决策流**：
   - `chat.mjs` 中命中后直接 `return res.json(...)` 纯表格文本，完全绕过了 Agent 推理。当考生进行对比性追问（例如“我这个排位报计算机好还是软件工程好？”）时，系统无法进行多维度分析。
4. ❌ **版本落后与冲突风险**：
   - `origin/chf` 基于较早的代码底座，未包含当前主分支的 **5 位多智能体迎新群聊架构**、**开源 UI 气泡深度定制工坊**、**动图表情包** 等最新特性，直接合并（Merge）会导致严重代码冲突与功能回退。

---

## 💡 五、处理建议与演进路线

1. **不建议直接整分支合并（Merge）**；
2. **推荐处理方案**：
   - **数据录入**：将 2025 广东物理类录取线数据通过我们现有的【知识库管理 / 文档表格切片导入】功能录入到知识库中；
   - **架构抽象**：后续若需要对所有大型表格类知识（不局限于特定某一年某一类）进行前置过滤，可以在 `ragEngine.mjs` 中将该算法抽象为通用的 **`filterTableKnowledgeByQuery(tableData, query)`** 模块，从而让所有省份、年份的录取表格都能享受到细粒度预检索的好处。
