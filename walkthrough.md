# 广州大学招生智能问答系统 - 多模型提供商与注册配置初始化向导升级

本次更新全面升级了系统的命令行初始化向导 **`gzhu init`**（`npm run init`），支持**多模型提供商池配置**、**标准与快速模型分派至不同提供商**以及**多渠道注册模式选择与密钥配置**。

---

## 🌟 核心功能与升级亮点

### 1. 🔀 多模型提供商池 (Provider Pool) 独立配置
* **多服务商连续录入**：初始化向导支持配置 1 个或多个大模型提供商（DeepSeek、OpenAI、阿里云通义千问 DashScope、硅基流动 SiliconFlow、智谱 GLM、月之暗面 Kimi、自定义 OpenAI 兼容网关）。
* **不同模型绑定不同提供商**：
  * **标准对话模型 (`DEFAULT_MODEL`)**：可绑定高质量思考/对话模型（如 `deepseek-chat`、`gpt-4o`、`qwen-max`）。
  * **快速处理模型 (`FAST_MODEL`)**：可独立绑定至其他快速模型提供商（如通义千问 `qwen-turbo`、智谱 `glm-4-flash` 或硅基流动），实现高并发文档解析与提炼任务的高速低成本处理。

---

### 2. 📲 考生注册方式与鉴权服务全面交互配置
* **注册模式自由选择**：
  * `[1] 普通账号密码注册 (静态标准模式 · 零第三方依赖)`
  * `[2] 手机号验证码注册 (腾讯云 SMS 短信服务)`
  * `[3] 邮箱验证码注册 (SMTP 邮件直发)`
  * `[4] 手机号 + 邮箱验证码注册 (支持双渠道验证码注册)`
  * `[5] 全部开启 (推荐全功能模式)`
* **交互式服务密钥录入**：
  * 选择手机号注册时，引导录入腾讯云 SMS `SecretId`、`SecretKey`、`SdkAppId`、`SignName`、`TemplateId`（留空自动进入终端 DevMock 仿真打印）。
  * 选择邮箱注册时，引导录入 SMTP 邮件服务器主机、端口、发件账号与授权码。

---

### 3. 💾 配置文件结构化生成
* 自动生成并更新 `.env` 环境配置文件与 `data/system_providers.json` 提供商池配置。
* 环境变量涵盖 `AI_BASE_URL`、`DEFAULT_MODEL`、`FAST_AI_BASE_URL`、`FAST_MODEL`、`AUTH_REGISTRATION_MODE`、`ADVANCED_AUTH_ENABLED`、腾讯云 SMS 与 SMTP 密钥。

---

## 🚀 运行与体验方式
在终端中执行：
```bash
npm run init
# 或
node ./bin/gzhu.mjs init
```
即刻体验全新的多模型提供商与注册配置交互向导！
