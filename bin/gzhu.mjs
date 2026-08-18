#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(projectRoot, '.env');
const dataDir = path.join(projectRoot, 'data');
const providersFilePath = path.join(dataDir, 'system_providers.json');

// ANSI Color Helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  white: '\x1b[37m',
};

// Preset AI Providers Catalog
const PRESET_PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    url: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    fastModel: 'deepseek-chat',
    docUrl: 'https://platform.deepseek.com'
  },
  {
    id: 'openai',
    name: 'OpenAI (Official)',
    url: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    fastModel: 'gpt-4o-mini',
    docUrl: 'https://platform.openai.com'
  },
  {
    id: 'dashscope',
    name: 'Aliyun DashScope (阿里通义千问)',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-max',
    fastModel: 'qwen-turbo',
    docUrl: 'https://bailian.console.aliyun.com'
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow (硅基流动)',
    url: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    fastModel: 'deepseek-ai/DeepSeek-V3',
    docUrl: 'https://cloud.siliconflow.cn'
  },
  {
    id: 'zhipu',
    name: 'Zhipu AI (智谱清言 GLM)',
    url: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-plus',
    fastModel: 'glm-4-flash',
    docUrl: 'https://open.bigmodel.cn'
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI (月之暗面 Kimi)',
    url: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    fastModel: 'moonshot-v1-8k',
    docUrl: 'https://platform.moonshot.cn'
  },
  {
    id: 'custom',
    name: 'OpenAI-Compatible (Custom Gateway / 自定义网关)',
    url: '',
    defaultModel: 'gpt-4o',
    fastModel: 'gpt-4o-mini',
    isCustom: true
  }
];

// Helper to fetch model list from OpenAI-compatible /models endpoint
const fetchRemoteModels = async (baseUrl, apiKey) => {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const candidateUrls = [
    `${cleanBase}/models`,
    `${cleanBase}/v1/models`,
  ];

  for (const targetUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json) ? json : (json?.data || []);
        const models = rawList
          .map(m => (typeof m === 'string' ? m : m?.id))
          .filter(Boolean)
          .sort();
        if (models.length > 0) {
          return { ok: true, models, endpoint: targetUrl };
        }
      }
    } catch {
      // try next candidate url
    }
  }

  return { ok: false, models: [] };
};

// Read existing .env into Map
const loadExistingEnv = () => {
  const map = new Map();
  if (fs.existsSync(envFilePath)) {
    const content = fs.readFileSync(envFilePath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        map.set(key, val);
      }
    });
  }
  return map;
};

// Save Map back to .env
const saveEnvFile = (config) => {
  const envMap = loadExistingEnv();

  // Primary Default Model configuration
  envMap.set('AI_BASE_URL', config.baseUrl);
  envMap.set('AI_API_KEY', config.apiKey);
  envMap.set('DEFAULT_MODEL', config.defaultModel);
  if (config.defaultProviderName) {
    envMap.set('DEFAULT_MODEL_PROVIDER', config.defaultProviderName);
  }

  // Fast Model configuration (can be from different provider)
  if (config.fastBaseUrl) {
    envMap.set('FAST_AI_BASE_URL', config.fastBaseUrl);
  }
  if (config.fastApiKey) {
    envMap.set('FAST_AI_API_KEY', config.fastApiKey);
  }
  envMap.set('FAST_MODEL', config.fastModel);
  if (config.fastProviderName) {
    envMap.set('FAST_MODEL_PROVIDER', config.fastProviderName);
  }

  // Web Search configuration
  if (config.searchProvider) {
    envMap.set('SEARCH_PROVIDER', config.searchProvider);
  }
  if (config.tavilyApiKey) {
    envMap.set('TAVILY_API_KEY', config.tavilyApiKey);
  }
  if (config.bochaApiKey) {
    envMap.set('BOCHA_API_KEY', config.bochaApiKey);
  }

  // Registration & Auth modes
  envMap.set('ADVANCED_AUTH_ENABLED', config.advancedAuthEnabled ? 'true' : 'false');
  if (config.authRegistrationMode) {
    envMap.set('AUTH_REGISTRATION_MODE', config.authRegistrationMode);
  }

  // Tencent SMS
  if (config.tencentSmsSecretId) envMap.set('TENCENT_SMS_SECRET_ID', config.tencentSmsSecretId);
  if (config.tencentSmsSecretKey) envMap.set('TENCENT_SMS_SECRET_KEY', config.tencentSmsSecretKey);
  if (config.tencentSmsSdkAppId) envMap.set('TENCENT_SMS_SDK_APP_ID', config.tencentSmsSdkAppId);
  if (config.tencentSmsSignName) envMap.set('TENCENT_SMS_SIGN_NAME', config.tencentSmsSignName);
  if (config.tencentSmsTemplateId) envMap.set('TENCENT_SMS_TEMPLATE_ID', config.tencentSmsTemplateId);

  // SMTP Email
  if (config.smtpHost) envMap.set('SMTP_HOST', config.smtpHost);
  if (config.smtpPort) envMap.set('SMTP_PORT', config.smtpPort);
  if (config.smtpUser) envMap.set('SMTP_USER', config.smtpUser);
  if (config.smtpPass) envMap.set('SMTP_PASS', config.smtpPass);

  if (!envMap.has('PORT')) {
    envMap.set('PORT', '3001');
  }

  let lines = [
    '# ===================================================',
    '# Gzadm Navigator AI Configuration (Generated by gzhu init)',
    `# Updated At: ${new Date().toISOString()}`,
    '# ===================================================',
    ''
  ];

  for (const [k, v] of envMap.entries()) {
    lines.push(`${k}=${v}`);
  }

  fs.writeFileSync(envFilePath, lines.join('\n') + '\n', 'utf8');

  // Also save system providers pool to JSON
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    if (config.providerPool && config.providerPool.length > 0) {
      fs.writeFileSync(providersFilePath, JSON.stringify(config.providerPool, null, 2), 'utf8');
    }
  } catch (e) {
    console.error('Failed to save system_providers.json:', e.message);
  }
};

const printBanner = () => {
  console.log(`
${c.cyan}${c.bold}===============================================================
       🎓 Gzadm Navigator · AI 引擎与多提供商初始化向导
===============================================================${c.reset}
`);
};

// Helper function to prompt a single provider selection
async function promptSingleProvider(rl, title) {
  console.log(`${c.bold}${title}${c.reset}\n`);
  PRESET_PROVIDERS.forEach((p, idx) => {
    const num = `${c.cyan}[${idx + 1}]${c.reset}`;
    const name = `${c.bold}${p.name}${c.reset}`;
    const note = p.isCustom 
      ? `${c.yellow}(需输入 Base URL 与 API Key)${c.reset}`
      : `${c.dim}URL: ${p.url}${c.reset}`;
    console.log(`  ${num} ${name.padEnd(42)} ${note}`);
  });
  console.log('');

  let choiceIdx = -1;
  while (choiceIdx < 0 || choiceIdx >= PRESET_PROVIDERS.length) {
    const answer = await rl.question(`${c.green}? 请输入选项编号 [1-${PRESET_PROVIDERS.length}] (默认 1): ${c.reset}`);
    const trimmed = answer.trim();
    if (!trimmed) {
      choiceIdx = 0;
      break;
    }
    const parsed = parseInt(trimmed, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= PRESET_PROVIDERS.length) {
      choiceIdx = parsed - 1;
    } else {
      console.log(`${c.red}⚠️ 无效选项，请输入 1 到 ${PRESET_PROVIDERS.length} 之间的数字${c.reset}`);
    }
  }

  const preset = PRESET_PROVIDERS[choiceIdx];
  let customLabel = preset.name;
  let baseUrl = preset.url;

  if (preset.isCustom) {
    while (!baseUrl) {
      const inputUrl = await rl.question(`${c.green}? 请输入 OpenAI 兼容的 Base URL (例如 https://api.openai.com/v1): ${c.reset}`);
      baseUrl = inputUrl.trim();
      if (!baseUrl) console.log(`${c.red}⚠️ Base URL 不能为空${c.reset}`);
    }
    const labelInput = await rl.question(`${c.green}? 请为此自定义提供商设置别名 (默认 自定义网关): ${c.reset}`);
    if (labelInput.trim()) customLabel = labelInput.trim();
  } else {
    console.log(`  👉 接口地址 (Base URL): ${c.dim}${baseUrl}${c.reset}`);
  }

  let apiKey = '';
  while (!apiKey) {
    const inputKey = await rl.question(`${c.green}? 请输入 ${customLabel} 的 API Key: ${c.reset}`);
    apiKey = inputKey.trim();
    if (!apiKey) console.log(`${c.red}⚠️ API Key 不能为空${c.reset}`);
  }

  return {
    id: `${preset.id}_${Date.now()}`,
    type: preset.id,
    name: customLabel,
    baseUrl,
    apiKey,
    defaultModel: preset.defaultModel,
    fastModel: preset.fastModel
  };
}

// Interactive CLI Runner
async function runInit() {
  printBanner();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    // =============================================================
    // STEP 1: Multi-Provider Pool Configuration (支持配置多个提供商)
    // =============================================================
    const providerPool = [];
    console.log(`${c.bold}【步骤 1/4】配置模型提供商池 (Provider Pool)：${c.reset}`);
    console.log(`${c.dim}您可以配置 1 个或多个大模型提供商（如 DeepSeek、通义千问、硅基流动等），并在下一步将不同模型自由分配给不同提供商。${c.reset}\n`);

    // Add Provider #1 (Primary)
    const firstProvider = await promptSingleProvider(rl, '➡️ 请配置第 1 个大模型提供商 (主提供商)：');
    providerPool.push(firstProvider);
    console.log(`${c.green}✅ 已添加提供商 [1]: ${firstProvider.name}${c.reset}\n`);

    // Optionally Add Additional Providers
    let addMore = true;
    while (addMore) {
      const moreAns = await rl.question(`${c.green}? 是否继续添加其他模型提供商？(供快速/备用模型调度) (y/N): ${c.reset}`);
      if (moreAns.trim().toLowerCase() === 'y') {
        console.log('');
        const extraProvider = await promptSingleProvider(rl, `➡️ 请配置第 ${providerPool.length + 1} 个大模型提供商：`);
        providerPool.push(extraProvider);
        console.log(`${c.green}✅ 已添加提供商 [${providerPool.length}]: ${extraProvider.name}${c.reset}\n`);
      } else {
        addMore = false;
      }
    }

    // Display Current Provider Pool
    console.log(`\n${c.bold}📋 当前已配置的提供商池 (${providerPool.length} 个)：${c.reset}`);
    providerPool.forEach((p, idx) => {
      console.log(`   ${c.cyan}[${idx + 1}]${c.reset} ${c.bold}${p.name}${c.reset} ${c.dim}(Base: ${p.baseUrl})${c.reset}`);
    });

    // =============================================================
    // STEP 2: Model Assignment (标准对话模型 & 快速模型绑定)
    // =============================================================
    console.log(`\n${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 2/4】分配标准对话模型与快速模型：${c.reset}\n`);

    // 2.1 Standard Model (DEFAULT_MODEL) Assignment
    let defaultProv = providerPool[0];
    if (providerPool.length > 1) {
      console.log(`${c.bold}请为【标准对话模型 (DEFAULT_MODEL)】选择提供商：${c.reset}`);
      providerPool.forEach((p, idx) => {
        console.log(`  ${c.cyan}[${idx + 1}]${c.reset} ${p.name}`);
      });
      const defProvAns = await rl.question(`${c.green}? 请输入提供商编号 [1-${providerPool.length}] (默认 1): ${c.reset}`);
      const defIdx = parseInt(defProvAns.trim(), 10);
      if (!isNaN(defIdx) && defIdx >= 1 && defIdx <= providerPool.length) {
        defaultProv = providerPool[defIdx - 1];
      }
    }

    console.log(`\n⏳ 正在拉取【${defaultProv.name}】的可用模型列表...`);
    const defFetch = await fetchRemoteModels(defaultProv.baseUrl, defaultProv.apiKey);
    let defaultModel = defaultProv.defaultModel || 'deepseek-chat';

    if (defFetch.ok && defFetch.models.length > 0) {
      console.log(`${c.green}✅ 成功获取到 ${defFetch.models.length} 个模型：${c.reset}\n`);
      defFetch.models.forEach((m, idx) => {
        console.log(`   ${c.dim}${String(idx + 1).padStart(3, ' ')}.${c.reset} ${c.bold}${m}${c.reset}`);
      });
      const defModelAns = await rl.question(`\n${c.green}? 请选择/输入 标准对话模型 (默认: ${defaultModel}): ${c.reset}`);
      const defTrimmed = defModelAns.trim();
      if (defTrimmed) {
        const num = parseInt(defTrimmed, 10);
        defaultModel = (!isNaN(num) && num >= 1 && num <= defFetch.models.length) ? defFetch.models[num - 1] : defTrimmed;
      }
    } else {
      console.log(`${c.yellow}ℹ️ 未能自动拉取模型列表，请手动输入模型名称：${c.reset}`);
      const defModelAns = await rl.question(`${c.green}? 请输入 标准对话模型 (DEFAULT_MODEL) (默认: ${defaultModel}): ${c.reset}`);
      if (defModelAns.trim()) defaultModel = defModelAns.trim();
    }
    console.log(`👉 标准对话模型确定为: ${c.cyan}${c.bold}${defaultModel}${c.reset} (提供商: ${defaultProv.name})\n`);

    // 2.2 Fast Model (FAST_MODEL) Assignment
    let fastProv = providerPool[0];
    let fastBaseUrl = defaultProv.baseUrl;
    let fastApiKey = defaultProv.apiKey;
    let fastModel = defaultProv.fastModel || defaultModel;

    if (providerPool.length > 1) {
      console.log(`${c.bold}请为【快速处理模型 (FAST_MODEL)】选择提供商：${c.reset}`);
      console.log(`${c.dim}(用于文档智能解析切片、表格处理与高并发任务，可选用轻量高速模型如 qwen-turbo / glm-4-flash / deepseek-chat)${c.reset}`);
      providerPool.forEach((p, idx) => {
        console.log(`  ${c.cyan}[${idx + 1}]${c.reset} ${p.name}`);
      });
      const fastProvAns = await rl.question(`${c.green}? 请输入提供商编号 [1-${providerPool.length}] (默认 1): ${c.reset}`);
      const fIdx = parseInt(fastProvAns.trim(), 10);
      if (!isNaN(fIdx) && fIdx >= 1 && fIdx <= providerPool.length) {
        fastProv = providerPool[fIdx - 1];
      }
      fastBaseUrl = fastProv.baseUrl;
      fastApiKey = fastProv.apiKey;
      fastModel = fastProv.fastModel || defaultModel;
    } else {
      fastProv = defaultProv;
    }

    console.log(`\n⏳ 正在拉取【${fastProv.name}】的模型列表...`);
    const fastFetch = await fetchRemoteModels(fastProv.baseUrl, fastProv.apiKey);
    if (fastFetch.ok && fastFetch.models.length > 0) {
      console.log(`${c.green}✅ 成功获取到 ${fastFetch.models.length} 个模型：${c.reset}\n`);
      fastFetch.models.forEach((m, idx) => {
        console.log(`   ${c.dim}${String(idx + 1).padStart(3, ' ')}.${c.reset} ${c.bold}${m}${c.reset}`);
      });
      const fastModelAns = await rl.question(`\n${c.green}? 请选择/输入 快速处理模型 (默认: ${fastModel}): ${c.reset}`);
      const fTrimmed = fastModelAns.trim();
      if (fTrimmed) {
        const num = parseInt(fTrimmed, 10);
        fastModel = (!isNaN(num) && num >= 1 && num <= fastFetch.models.length) ? fastFetch.models[num - 1] : fTrimmed;
      }
    } else {
      const fastModelAns = await rl.question(`${c.green}? 请输入 快速处理模型 (FAST_MODEL) (默认: ${fastModel}): ${c.reset}`);
      if (fastModelAns.trim()) fastModel = fastModelAns.trim();
    }
    console.log(`👉 快速处理模型确定为: ${c.magenta}${c.bold}${fastModel}${c.reset} (提供商: ${fastProv.name})\n`);

    // =============================================================
    // STEP 3: Configure Registration Modes & Verification Services
    // =============================================================
    console.log(`\n${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 3/4】考生注册方式与验证服务配置：${c.reset}\n`);

    console.log(`  ${c.cyan}[1]${c.reset} ${c.bold}普通账号密码注册${c.reset}           ${c.dim}(静态标准模式 · 零第三方依赖)${c.reset}`);
    console.log(`  ${c.cyan}[2]${c.reset} ${c.bold}手机号验证码注册${c.reset}           ${c.dim}(含手机 6 位验证码校验 · 支持腾讯云 SMS)${c.reset}`);
    console.log(`  ${c.cyan}[3]${c.reset} ${c.bold}邮箱验证码注册${c.reset}             ${c.dim}(含邮箱 6 位验证码校验 · 支持 SMTP 邮件直发)${c.reset}`);
    console.log(`  ${c.cyan}[4]${c.reset} ${c.bold}手机号 + 邮箱验证码注册${c.reset}    ${c.dim}(支持手机与邮箱双渠道验证码注册)${c.reset}`);
    console.log(`  ${c.cyan}[5]${c.reset} ${c.bold}全部开启 (推荐全功能模式)${c.reset}   ${c.green}(支持普通账号、手机号与邮箱多渠道注册)${c.reset}`);
    console.log('');

    let authChoice = 1;
    const authAns = await rl.question(`${c.green}? 请选择注册方式编号 [1-5] (默认 1): ${c.reset}`);
    if (authAns.trim()) {
      const parsed = parseInt(authAns.trim(), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) authChoice = parsed;
    }

    let advancedAuthEnabled = authChoice !== 1;
    let authRegistrationMode = 'username';
    if (authChoice === 2) authRegistrationMode = 'phone';
    else if (authChoice === 3) authRegistrationMode = 'email';
    else if (authChoice === 4) authRegistrationMode = 'phone,email';
    else if (authChoice === 5) authRegistrationMode = 'all';

    let tencentSmsSecretId = '';
    let tencentSmsSecretKey = '';
    let tencentSmsSdkAppId = '';
    let tencentSmsSignName = '';
    let tencentSmsTemplateId = '';

    let smtpHost = '';
    let smtpPort = '465';
    let smtpUser = '';
    let smtpPass = '';

    // Phone / Tencent Cloud SMS configuration
    if (authChoice === 2 || authChoice === 4 || authChoice === 5) {
      console.log(`\n${c.cyan}${c.bold}📱 [腾讯云 SMS 短信验证服务配置]${c.reset}`);
      console.log(`${c.dim}(若暂不填 SecretId，系统将自动进入 DevMock 模式并在控制台直接打印 6 位验证码)${c.reset}`);
      tencentSmsSecretId = (await rl.question(`${c.green}? 腾讯云 SecretId (可选): ${c.reset}`)).trim();
      if (tencentSmsSecretId) {
        tencentSmsSecretKey = (await rl.question(`${c.green}? 腾讯云 SecretKey: ${c.reset}`)).trim();
        tencentSmsSdkAppId = (await rl.question(`${c.green}? 短信 SdkAppId (可选): ${c.reset}`)).trim();
        tencentSmsSignName = (await rl.question(`${c.green}? 短信签名 SignName (可选): ${c.reset}`)).trim();
        tencentSmsTemplateId = (await rl.question(`${c.green}? 正文模板 TemplateId (可选): ${c.reset}`)).trim();
      }
    }

    // Email / SMTP configuration
    if (authChoice === 3 || authChoice === 4 || authChoice === 5) {
      console.log(`\n${c.cyan}${c.bold}✉️ [SMTP 发件邮箱服务配置]${c.reset}`);
      console.log(`${c.dim}(若暂不填 SMTP 主机，系统将自动进入 DevMock 模式并在控制台打印验证码)${c.reset}`);
      smtpHost = (await rl.question(`${c.green}? SMTP 服务器主机 (如 smtp.qq.com / smtp.163.com, 可选): ${c.reset}`)).trim();
      if (smtpHost) {
        smtpPort = (await rl.question(`${c.green}? SMTP 端口 (默认 465): ${c.reset}`)).trim() || '465';
        smtpUser = (await rl.question(`${c.green}? 发件账号 (如 admissions@gzhu.edu.cn): ${c.reset}`)).trim();
        smtpPass = (await rl.question(`${c.green}? 发件授权码 / 密码: ${c.reset}`)).trim();
      }
    }

    // =============================================================
    // STEP 4: Configure Web Search Engine
    // =============================================================
    console.log(`\n${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 4/4】请选择联网搜索引擎 (用于全国高校招生录取与政策实时查询)：${c.reset}\n`);

    console.log(`  ${c.cyan}[1]${c.reset} ${c.bold}Tavily${c.reset}          ${c.dim}(推荐 · AI 优化结构化搜索 · 需填 API Key)${c.reset}`);
    console.log(`  ${c.cyan}[2]${c.reset} ${c.bold}博查 AI (Bocha)${c.reset}  ${c.dim}(国内中文政策深度搜索 · 需填 API Key)${c.reset}`);
    console.log(`  ${c.cyan}[3]${c.reset} ${c.bold}DuckDuckGo${c.reset}       ${c.green}(免 Key · 开箱即用 · 自动兜底)${c.reset}`);
    console.log(`  ${c.cyan}[4]${c.reset} ${c.dim}暂不启用联网搜索${c.reset}`);
    console.log('');

    let searchChoice = 3;
    const searchAns = await rl.question(`${c.green}? 请输入选项编号 [1-4] (默认 3 - DuckDuckGo): ${c.reset}`);
    if (searchAns.trim()) {
      const parsed = parseInt(searchAns.trim(), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) searchChoice = parsed;
    }

    let searchProvider = 'duckduckgo';
    let tavilyApiKey = '';
    let bochaApiKey = '';

    if (searchChoice === 1) {
      searchProvider = 'tavily';
      while (!tavilyApiKey) {
        const inputKey = await rl.question(`${c.green}? 请输入 Tavily API Key (tvly-...): ${c.reset}`);
        tavilyApiKey = inputKey.trim();
        if (!tavilyApiKey) console.log(`${c.red}⚠️ Key 不能为空${c.reset}`);
      }
    } else if (searchChoice === 2) {
      searchProvider = 'bocha';
      while (!bochaApiKey) {
        const inputKey = await rl.question(`${c.green}? 请输入 博查 (Bocha) API Key: ${c.reset}`);
        bochaApiKey = inputKey.trim();
        if (!bochaApiKey) console.log(`${c.red}⚠️ Key 不能为空${c.reset}`);
      }
    } else if (searchChoice === 3) {
      searchProvider = 'duckduckgo';
    } else {
      searchProvider = 'none';
    }

    // =============================================================
    // SAVE CONFIGURATION
    // =============================================================
    const configResult = {
      baseUrl: defaultProv.baseUrl,
      apiKey: defaultProv.apiKey,
      defaultModel,
      defaultProviderName: defaultProv.name,
      fastBaseUrl: fastProv.baseUrl,
      fastApiKey: fastProv.apiKey,
      fastModel,
      fastProviderName: fastProv.name,
      searchProvider,
      tavilyApiKey,
      bochaApiKey,
      advancedAuthEnabled,
      authRegistrationMode,
      tencentSmsSecretId,
      tencentSmsSecretKey,
      tencentSmsSdkAppId,
      tencentSmsSignName,
      tencentSmsTemplateId,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      providerPool
    };

    saveEnvFile(configResult);

    console.log(`
${c.green}${c.bold}===============================================================
🎉 Gzadm Navigator 初始化配置已成功保存！
===============================================================${c.reset}

  ${c.bold}提供商池数量:${c.reset}          ${c.cyan}${providerPool.length} 个模型提供商${c.reset}
  ${c.bold}标准对话模型 (DEFAULT):${c.reset} ${c.cyan}${defaultModel}${c.reset} 【${defaultProv.name}】
  ${c.bold}快速处理模型 (FAST):${c.reset}   ${c.magenta}${fastModel}${c.reset} 【${fastProv.name}】
  ${c.bold}联网搜索引擎:${c.reset}          ${c.green}${searchProvider.toUpperCase()}${c.reset}
  ${c.bold}考生注册鉴权方式:${c.reset}      ${c.bold}${authRegistrationMode.toUpperCase()}${c.reset} (${advancedAuthEnabled ? '已开启高级注册通道' : '普通账号密码注册'})
  ${c.bold}环境配置文件路径:${c.reset}      ${path.relative(process.cwd(), envFilePath)}

${c.dim}您可以随时运行 ${c.cyan}npm run dev${c.dim} 启动智能招生问答平台，或在后台管理页面的【系统配置】实时调整！${c.reset}
`);
  } catch (err) {
    console.error(`\n${c.red}❌ 初始化出错: ${err.message}${c.reset}`);
  } finally {
    rl.close();
  }
}

// CLI Routing
const args = process.argv.slice(2);
const command = args[0] || 'init';

if (command === 'init') {
  runInit();
} else if (command === '--help' || command === '-h' || command === 'help') {
  console.log(`
${c.cyan}${c.bold}Gzadm Navigator CLI (gzhu)${c.reset}

${c.bold}用法:${c.reset}
  gzhu init           交互式配置多模型提供商池、绑定标准/快速模型、配置搜索引擎与注册方式
  gzhu --help         查看帮助信息
`);
} else {
  runInit();
}
