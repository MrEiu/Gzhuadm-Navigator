import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env.local');
const envMainPath = path.join(__dirname, '.env');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(envPath);
loadEnvFile(envMainPath);

const ADMISSIONS_SYSTEM_PROMPT = `
你是 AuraSense 智能入学咨询系统的 AI 招生顾问与辅导团队。
你的职责是为广大学子及家长解答关于高等学校/学院的入学招生、专业设置、录取要求、学费与奖学金、校园生活以及报名流程等方面的问题。

系统内置三位专业顾问角色：
1. 【Elena 老师 - 招生咨询顾问】：权威解答招生政策、报考要求、录取分数线参考、学费标准、奖学金与助学贷款。
2. 【张教授 - 学术与专业导师】：深入解答专业培养方案、课程设置、科研项目、考研升学与就业发展前景。
3. 【Flora - 校园生活助手】：亲切解答宿舍设施（如空调、独卫）、食堂餐饮、校园交通、社团活动与周边环境。

通用回答规则：
1. 始终使用中文回答，态度亲切、专业、客观、有条理。
2. 使用 Markdown 格式进行排版（如加粗、列表、分段），提高信息可读性。
3. 对关于专业、录取、学费、宿舍等常见问题，提供结构清晰、条理分明的步骤或点状回答。
4. 如果用户询问的具体分数或专业未明确指定，给出合理的参考指引，并建议关注官方招生网或联系招生办。
5. 鼓励用户进一步提问，提供有针对性的后续咨询建议。
`.trim();

const getMockResponse = (userPrompt = '', role = 'professional') => {
  const q = userPrompt.toLowerCase();
  
  if (q.includes('专业') || q.includes('学科') || q.includes('课程')) {
    return `### 🎓 热门专业与学科建设

我们学校目前拥有多个优势学科与特色专业，涵盖工学、理学、管理学、艺术学等多个领域：

1. **人工智能与计算机科学** 🚀
   - **核心课程**：机器学习、深度学习、数据结构、高维数据分析、软件工程
   - **就业去向**：互联网巨头、AI研发机构、金融科技公司、科研院所

2. **数字媒体与交互设计** 🎨
   - **核心课程**：UI/UX设计、三维动画、虚拟现实（VR）、视听语言
   - **就业去向**：游戏大厂、设计咨询公司、影视特效团队

3. **智能制造与自动化** ⚙️
   - **核心课程**：机器人控制、嵌入式系统、物联网工程

您对哪个方向更感兴趣呢？我可以为您提供详细的**培养方案与选科建议**！`;
  }

  if (q.includes('宿舍') || q.includes('生活') || q.includes('食堂') || q.includes('环境')) {
    return `### 🏫 校园生活与住宿环境

欢迎关注我们的校园环境！学校致力于为每一位学子打造舒适温馨的生活空间：

- 🛏️ **宿舍配置**：标准 **4人间/6人间**，配有**独立卫浴、冷暖双制空调、24小时热水**及上床下桌独立书桌。
- 📶 **网络设施**：全园区百兆WiFi覆盖，每床位配备千兆网线插口。
- 🍲 **餐饮美食**：拥有 3 个大型综合食堂，提供川粤鲁豫等各地风味美食、清真餐厅及星巴克/瑞幸校园咖啡角。
- ⚽ **体育设施**：标准400米跑道体育场、室内羽毛球馆、健身房及恒温游泳池。

有什么关于校园生活细节想了解的吗？小助手 Flora 随时为您答疑！🌸`;
  }

  if (q.includes('学费') || q.includes('奖学金') || q.includes('助学金') || q.includes('费用')) {
    return `### 💰 学费标准与奖助学金体系

学校建立了完善的**“奖、助、贷、勤、补、减”**全方位资助体系，确保绝不让任何一位优秀学子因家庭经济困难而失学：

1. **学费标准**：
   - 普通文理科专业：约 **5,000 - 6,500元 / 学年**
   - 艺术与热门工科专业：约 **8,000 - 12,000元 / 学年**
   - 住宿费：**1,200元 / 学年** (含空调与水电基础额度)

2. **奖学金体系**：
   - **国家奖学金**：8,000元/人/年
   - **新生卓越奖学金**：最高可免除全额学费并奖励10,000元生活补贴
   - **综合素质特等奖学金**：5,000元/人/年

3. **绿色通道**：
   - 提供生源地信用助学贷款对接及校内勤工助学岗位（按月发放津贴）。`;
  }

  if (q.includes('分数') || q.includes('录取') || q.includes('要求') || q.includes('条件') || q.includes('高考')) {
    return `### 📈 录取要求与历年分数线参考

针对不同省份及考生的实际情况，我们的录取原则如下：

1. **录取原则**：
   - 遵循“**分数优先、遵循志愿**”原则，不设专业级差。
   - 认可各省（自治区、直辖市）招生主管部门规定的加分政策。

2. **历年录取区间参考**：
   - **特控线/一本线上 20-40分**：可优先冲刺计算机、AI及双学位实验班。
   - **一本线/特控线上 5-20分**：录取希望极大，可稳妥报考主流工科与经管类专业。

建议您告知所在的**省份、科类（或选考科目）及预估成绩/位次**，Elena 老师可以为您做更加精准的评估！✨`;
  }

  if (q.includes('报名') || q.includes('流程') || q.includes('时间') || q.includes('申请')) {
    return `### 📅 报名流程与重要时间节点

为方便考生及家长高效办理入学咨询与报名，请参考以下全流程指引：

1. 📝 **在线预报名/意向登记**：在本系统或官方招生网登记考生基本信息与意向专业。
2. 🏫 **校园开放日体验**：每年 6月-7月 开放校园现场参观与导师面对面交流。
3. 🎯 **志愿填报指导**：高考成绩公布后，招生办提供 1v1 填报一对一辅导。
4. ✉️ **录取通知书寄送**：预计 7月中下旬 陆续通过 EMS 快递寄发录取通知书及入学指南。

您目前处于哪个阶段呢？随时告诉我，我来为您指导下一步！`;
  }

  return `同学/家长您好！我是 **AuraSense 入学咨询 AI 助手**。✨

我可以为您解答以下方面的疑问：
- 🎓 **热门专业与培养特色**
- 📈 **录取分数线与报考建议**
- 💰 **学费标准与奖助学金**
- 🏫 **宿舍环境与校园生活**
- 📅 **报名流程与开放日预约**

请随时告诉我您关心的内容，或者从上方快捷问题卡片中点击询问！`;
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, system: 'AuraSense Admissions AI' });
});

const handleChatRequest = async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const role = req.body?.role || 'professional';

  let roleContext = '';
  if (role === 'academic') {
    roleContext = '当前请以【张教授 - 学术与专业导师】的身份回答，侧重专业培养、科研、课程与职业前景。';
  } else if (role === 'care') {
    roleContext = '当前请以【Flora - 校园生活助手】的身份回答，语气亲切活泼，侧重宿舍、餐饮、社团与校园生活。';
  } else {
    roleContext = '当前请以【Elena 老师 - 招生咨询顾问】的身份回答，严谨专业，侧重招生政策、录取分数、学费与报名流程。';
  }

  const messages = [
    { role: 'system', content: ADMISSIONS_SYSTEM_PROMPT },
    { role: 'system', content: roleContext },
    ...incomingMessages
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  const lastUserMsg = [...incomingMessages].reverse().find(m => m.role === 'user')?.content || '';

  if (!apiKey) {
    const mockReply = getMockResponse(lastUserMsg, role);
    return res.json({ ok: true, reply: mockReply, source: 'local-knowledge' });
  }

  try {
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!deepseekResponse.ok) {
      console.warn('DeepSeek API returned error status:', deepseekResponse.status);
      const mockReply = getMockResponse(lastUserMsg, role);
      return res.json({ ok: true, reply: mockReply, source: 'fallback-knowledge' });
    }

    const payload = await deepseekResponse.json();
    const reply = payload?.choices?.[0]?.message?.content?.trim() || getMockResponse(lastUserMsg, role);

    res.json({ ok: true, reply, source: 'deepseek-api' });
  } catch (error) {
    console.error('API call failed, serving local response:', error.message);
    const mockReply = getMockResponse(lastUserMsg, role);
    res.json({ ok: true, reply: mockReply, source: 'fallback-knowledge' });
  }
};

app.post('/api/aura/chat', handleChatRequest);
app.post('/api/chat', handleChatRequest);

// Dummy endpoints for backward compatibility
app.post('/api/answers/batch', (_req, res) => res.json({ ok: true }));
app.post('/api/questionnaire2/answers/batch', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`AuraSense Admissions AI API listening on http://localhost:${port}`);
});