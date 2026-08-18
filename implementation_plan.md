# 自定义模型网关与 `gzhu init` 实施方案（含厂商预设）

## 1. 厂商预设与自定义网关设计

在 `gzhu init` CLI 初始化时，提供清晰的选择菜单：

| 选项 | 厂商 / 网关类型 | 默认 Base URL | 需要输入的信息 |
| :--- | :--- | :--- | :--- |
| **1** | **DeepSeek** | `https://api.deepseek.com` | 仅需填 API Key |
| **2** | **OpenAI (Official)** | `https://api.openai.com/v1` | 仅需填 API Key |
| **3** | **Aliyun DashScope (阿里通义千问)** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 仅需填 API Key |
| **4** | **SiliconFlow (硅基流动)** | `https://api.siliconflow.cn/v1` | 仅需填 API Key |
| **5** | **Zhipu AI (智谱清言 GLM)** | `https://open.bigmodel.cn/api/paas/v4` | 仅需填 API Key |
| **6** | **Moonshot AI (月之暗面 Kimi)** | `https://api.moonshot.cn/v1` | 仅需填 API Key |
| **7** | **OpenAI-Compatible (Custom Gateway)** | 自定义输入（支持 OneAPI/NewAPI/Ollama/vLLM 等） | 输入 Base URL + API Key |

---

## 2. 一键获取模型列表与双模型配置

选择厂商并输入 API Key 后：
1. **自动拉取模型列表**：CLI 自动发起 `GET ${BASE_URL}/models`；
2. **编号展示模型清单**：格式化呈现所有可用模型 ID；
3. **设置双模型**：
   - **默认主模型 (`DEFAULT_MODEL`)**：用于回复考生及家长咨询（Agent 对话、工具调用、填报建议）；
   - **快速模型 (`FAST_MODEL`)**：用于后端快速任务（智能文档切片、意图判断、关键词提炼）；
4. **一键写入 `.env`**：保存所有配置，并进行快速连通性验证。
