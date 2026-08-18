# 模块化重构方案：拆分 aurasense.tsx 为可复用 UI 组件与功能页面

将 4,468 行的单文件 `aurasense.tsx` 拆分为结构清晰、职责单一的模块化工程，极大提升 AI 辅助编码的上下文精度与人工维护性。

## Proposed Changes

### 1. 基础架构与类型常量层

#### [NEW] [src/types/index.ts](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/types/index.ts)
- 定义 `User`, `UserProfile`, `ChatMessage`, `ChatSession`, `RagItem`, `CampusLocation`, `DashboardStats`, `SettingsConfig` 等核心接口。

#### [NEW] [src/constants/theme.ts](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/constants/theme.ts)
- 提取 `THEME` 配置（背景渐变、毛玻璃、气泡样式等）与 `ROLE` 顾问配置（Dr. Elena，头像，角色色值）。

#### [NEW] [src/constants/campusLocations.ts](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/constants/campusLocations.ts)
- 提取 `DEFAULT_CAMPUS_LOCATIONS` 校园地标数据数组（6 大地标、高精实景图、坐标、开放时间、亮点与关联词条）。

#### [NEW] [src/constants/initialMessages.ts](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/constants/initialMessages.ts)
- 提取 `INITIAL_MESSAGES` 初始对话与欢迎语。

#### [NEW] [src/api/config.ts](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/api/config.ts)
- 统一配置 `API_BASE` 端口与地址判断逻辑。

---

### 2. 可复用通用 UI 组件库 (`src/components/ui/`)

#### [NEW] [src/components/ui/BaseModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/components/ui/BaseModal.tsx)
- 毛玻璃背景、圆角、标题栏、关闭按钮及底部操作栏的通用弹窗容器。

#### [NEW] [src/components/ui/MarkdownViewer.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/components/ui/MarkdownViewer.tsx)
- 结合 `ReactMarkdown` + `remarkGfm`，支持 `sanitizeMarkdownContent` 防断裂语法，渲染排版、表格、图片附件与代码。

#### [NEW] [src/components/ui/ChatMessageBubble.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/components/ui/ChatMessageBubble.tsx)
- 消息气泡组件，支持用户/AI 身份切换、头像、颜色、思考中打字机动画。

#### [NEW] [src/components/ui/FilterTabs.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/components/ui/FilterTabs.tsx)
- 分类标签切换栏，在地图导览、RAG 列表等页面复用。

#### [NEW] [src/components/ui/SearchInput.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/components/ui/SearchInput.tsx)
- 带图标与清空按钮的通用输入框。

---

### 3. 按功能划分的业务页面与模块 (`src/pages/`)

#### [NEW] [src/pages/Auth/AuthModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/Auth/AuthModal.tsx)
- 账号登录、普通注册、手机/邮箱短信验证码 60s 倒计时高级注册。

#### [NEW] [src/pages/CampusMap/CampusMapModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/CampusMap/CampusMapModal.tsx)
- 校园 3D 虚拟地图打点坐标、Hover 气泡、卡片网格列表、地标详情抽屉（多图轮播与一键向 AI 咨询该地标）。

#### [NEW] [src/pages/UserProfile/UserProfileModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/UserProfile/UserProfileModal.tsx)
- 高考省份、选科、总分、排名档案画像配置，联系方式绑定，Bcrypt 密码重置。

#### [NEW] [src/pages/UserProfile/PersonalRagModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/UserProfile/PersonalRagModal.tsx)
- 个人 RAG 专属记忆数据库查看器。

#### [NEW] [src/pages/RagKnowledge/RagItemModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/RagKnowledge/RagItemModal.tsx)
- 单个知识条目新建/编辑弹窗，支持 PNG 附件上传与自动打标。

#### [NEW] [src/pages/RagKnowledge/DocChunkImportModal.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/RagKnowledge/DocChunkImportModal.tsx)
- 文档智能切片（AI/标题/字数）与 CSV/JSON 表格解析导入。

#### [NEW] [src/pages/RagKnowledge/ChunkSingleEditor.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/RagKnowledge/ChunkSingleEditor.tsx)
- 单个切片快速在线修改器。

#### [NEW] [src/pages/Chat/ChatPage.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/Chat/ChatPage.tsx)
- 招生咨询主界面，集成 `SessionDrawer`、消息流、输入框及联动地图导览。

#### [NEW] [src/pages/Admin/AdminLayout.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/pages/Admin/AdminLayout.tsx)
- 管理员后台框架（左侧导航、顶部状态条），内嵌 Tab 视图：
  - `DashboardTab.tsx` (KPI、分类占比、pgvector/redis/onnx 状态)
  - `RagManageTab.tsx` (知识库检索与 CRUD)
  - `UsersTab.tsx` (考生画像与 VIP 策略阈值)
  - `AnalyticsTab.tsx` (增量高频词云与问答明细)
  - `PlaygroundTab.tsx` (RAG 检索诊断与全网实时搜索测试)
  - `SettingsTab.tsx` (模型网关、厂商预设与 API Key 配置)
  - `AdminEditUserModal.tsx` & `AdminResetPasswordModal.tsx` (补全用户管理弹窗)

---

### 4. 根入口重构与替换

#### [MODIFY] [src/App.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/src/App.tsx)
- 改造为纯净入口：装配身份与顶层路由，仅 ~100 行。

#### [MODIFY] [aurasense.tsx](file:///c:/Users/meru6/Desktop/Gzadm%20Navigator/aurasense.tsx)
- 导出重构后的 `App`，保持已有导出的向后兼容。

---

## Verification Plan

### 自动化与构建验证
1. 运行 TypeScript 语法与编译检查：
   ```powershell
   npx tsc --noEmit
   ```
2. 验证前端 Vite 构建打包无报错：
   ```powershell
   npm run build
   ```

### 功能完整性验证
- 验证普通考生登录与对话流程（问答、历史会话切换、新建会话、资料修改、地图导览弹窗与一键提问）。
- 验证管理员登录（`admin`/`admin123`），各 Tab（Dashboard、RAG、Users、Analytics、Playground、Settings）正常切换与数据交互。
