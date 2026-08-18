# RAG 检索精准度优化实施方案

本方案针对当前 RAG 检索出现的 **“搜索消息过多”** 与 **“混杂无关噪声”** 问题，实施 4 项核心算法与工程级修复：

---

## 4 大核心修复项与技术方案

```mermaid
graph TD
    Query[Agent 提炼后的检索词] --> Step1[1. Token 化分词与实体提取<br/>(过滤单字与停用词)]
    Step1 --> Step2[2. 初筛: 向量相似度(阈值>=0.55) + Token重合度]
    Step2 --> Step3[3. Cross-Encoder (BGE Reranker) 深度重排]
    Step3 --> Step4[4. 自适应相对分差截断<br/>(保留 >= Top1 * 75% 的高分项)]
    Step4 --> Result[输出 1~2 条高纯度权威知识]
```

### 1. 修复绝对阈值偏低（提高向量过滤门槛）
* **现状痛点**：原逻辑 `score > 0.5`（相当于余弦相似度 $>0.05$），导致不相干内容也全部通过。
* **修复策略**：
  * 设置基础余弦相似度门槛 `MIN_COSINE_SIM = 0.50`（低于 0.50 向量分直接归零）。
  * 向量得分转换为高区分度区间：当 $\text{sim} \ge 0.50$ 时，$\text{vecScore} = (\text{sim} - 0.50) \times 20$（范围 $0 \sim 10$ 分）。

### 2. 修复粗暴子串匹配（重构关键词与标签匹配）
* **现状痛点**：`qLower.includes(tag)` 会因短字（如“广”、“省”、“学”）发生大量单字误匹配并强行 $+5$ 分。
* **修复策略**：
  * **禁止单字匹配**：严格要求检索词与 Tag 长度 $\ge 2$。
  * **Token 级重合度（Token Overlap）**：将 Query 和 Document 的 Title/Tags 拆分为规范词元集合（Token Set），计算 Jaccard / Overlap 比例，替代简单的子串 `includes`。
  * **实体排他性校验**：避免“问浙江匹配到四川、广东”的跨省份误加分。

### 3. 修复固定 Top-K 缺少相对分差截断（自适应相对阈值）
* **现状痛点**：无脑 `slice(0, 3)`，哪怕第 2、3 名只有 1 分也被强行塞给 AI。
* **修复策略**：
  * 计算最高得分 $S_{\max}$。若 $S_{\max} < 5.0$，判定为“无足够置信度的匹配”，直接返回空数组 `[]`。
  * **相对分差截断**：只保留得分 $\ge S_{\max} \times 0.75$ 的条目，断崖式下跌的弱相关条目直接丢弃，动态返回 $1 \sim 2$ 条最强相关结果。

### 4. 引入 Cross-Encoder (BGE Reranker) 重排精筛
* **技术实现**：
  * 利用现有的 `@xenova/transformers` 本地加载 **`Xenova/bge-reranker-base`** (或轻量版 `bge-reranker-small`)。
  * 初筛召回 Top 5 候选条目后，由 Reranker 对 `[query, doc]` 进行交叉编码深度打分。
  * 具备平滑 Fallback：若 Reranker 仍在初始化或不可用，自动使用增强版加权评分引擎。

---

## Proposed Changes

### 后端核心检索逻辑 (`server.mjs`)
#### [MODIFY] [server.mjs](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/server.mjs)
1. **初始化 BGE Reranker 模型**：加载 `Xenova/bge-reranker-base`。
2. **重构 `searchRagEngine` 函数**：
   * 规范化分词与 Token 提取函数（剔除停用单字）。
   * 提高向量余弦相似度门槛（$\ge 0.50$）。
   * 采用 Token 级加权与实体匹配。
   * 接入 Reranker 交叉打分。
   * 实现自适应相对分差截断（$S \ge S_{\max} \times 0.75$）。

---

## Verification Plan

### 场景测试用例
1. **精准查询测试（单条极强相关）**：
   - 提问：“浙江 计算机 录取线”
   - 验证：仅返回浙江计算机分数线（1条），不再带出其他无关省份或杂项。
2. **无关提问/模糊提问测试（零召回保护）**：
   - 提问：“请问广州今天天气怎么样？” / “食堂好不好吃？”（库里无相关条目）
   - 验证：返回 `[]`，触发 Agent 的常识解答或提示关注招生网，不再强行塞入低分宿舍/学费数据。
3. **多意图精准组合测试**：
   - 提问：“宿舍是几人间的？有空调吗？”
   - 验证：精准命中宿舍条目，带出图片，排除录取分数线与学费条目。
