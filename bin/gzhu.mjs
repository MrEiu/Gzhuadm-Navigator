#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(projectRoot, '.env');
const envLocalFilePath = path.join(projectRoot, '.env.local');
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

// Read existing configuration from .env / .env.local
const loadAllExistingEnv = () => {
  const map = new Map();
  const readOne = (p) => {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
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
  };
  readOne(envFilePath);
  readOne(envLocalFilePath);
  return map;
};

// Load saved providers pool from JSON
const loadExistingProviders = () => {
  if (fs.existsSync(providersFilePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(providersFilePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return [];
};

// Helper to fetch model list from OpenAI-compatible /models endpoint
const fetchRemoteModels = async (baseUrl, apiKey) => {
  if (!baseUrl || !apiKey) return { ok: false, models: [] };
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
    } catch {}
  }

  return { ok: false, models: [] };
};

// Save Map to both .env and .env.local
const saveEnvFile = (config) => {
  const envMap = loadAllExistingEnv();

  // Primary Default Model configuration
  if (config.baseUrl) envMap.set('AI_BASE_URL', config.baseUrl);
  if (config.apiKey) envMap.set('AI_API_KEY', config.apiKey);
  if (config.defaultModel) envMap.set('DEFAULT_MODEL', config.defaultModel);
  if (config.defaultProviderName) envMap.set('DEFAULT_MODEL_PROVIDER', config.defaultProviderName);

  // Fast Model configuration
  if (config.fastBaseUrl) envMap.set('FAST_AI_BASE_URL', config.fastBaseUrl);
  if (config.fastApiKey) envMap.set('FAST_AI_API_KEY', config.fastApiKey);
  if (config.fastModel) envMap.set('FAST_MODEL', config.fastModel);
  if (config.fastProviderName) envMap.set('FAST_MODEL_PROVIDER', config.fastProviderName);

  // Web Search configuration
  if (config.searchProvider) envMap.set('SEARCH_PROVIDER', config.searchProvider);
  if (config.tavilyApiKey !== undefined) envMap.set('TAVILY_API_KEY', config.tavilyApiKey);
  if (config.bochaApiKey !== undefined) envMap.set('BOCHA_API_KEY', config.bochaApiKey);

  // Registration & Auth mode (STRICT SINGLE MODE)
  envMap.set('AUTH_REGISTRATION_MODE', config.authRegistrationMode || 'username');
  envMap.set('ADVANCED_AUTH_ENABLED', config.authRegistrationMode === 'username' ? 'false' : 'true');

  // Tencent SMS
  if (config.tencentSmsSecretId !== undefined) envMap.set('TENCENT_SMS_SECRET_ID', config.tencentSmsSecretId);
  if (config.tencentSmsSecretKey !== undefined) envMap.set('TENCENT_SMS_SECRET_KEY', config.tencentSmsSecretKey);
  if (config.tencentSmsSdkAppId !== undefined) envMap.set('TENCENT_SMS_SDK_APP_ID', config.tencentSmsSdkAppId);
  if (config.tencentSmsSignName !== undefined) envMap.set('TENCENT_SMS_SIGN_NAME', config.tencentSmsSignName);
  if (config.tencentSmsTemplateId !== undefined) envMap.set('TENCENT_SMS_TEMPLATE_ID', config.tencentSmsTemplateId);

  // SMTP Email
  if (config.smtpHost !== undefined) envMap.set('SMTP_HOST', config.smtpHost);
  if (config.smtpPort !== undefined) envMap.set('SMTP_PORT', config.smtpPort);
  if (config.smtpUser !== undefined) envMap.set('SMTP_USER', config.smtpUser);
  if (config.smtpPass !== undefined) {
    envMap.set('SMTP_PASS', config.smtpPass);
    envMap.set('SMTP_PASSWORD', config.smtpPass);
  }
  if (config.mailFrom !== undefined) envMap.set('MAIL_FROM', config.mailFrom);
  if (config.mailFromName !== undefined) envMap.set('MAIL_FROM_NAME', config.mailFromName);
  if (config.smtpSecureEnabled !== undefined) envMap.set('SMTP_SECURE_ENABLED', config.smtpSecureEnabled);

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

  const outputContent = lines.join('\n') + '\n';
  fs.writeFileSync(envFilePath, outputContent, 'utf8');
  fs.writeFileSync(envLocalFilePath, outputContent, 'utf8');

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
       🎓 Gzadm Navigator · AI 引擎与系统初始化向导
===============================================================${c.reset}
`);
};

// Helper function to prompt a single provider
async function promptSingleProvider(rl, title, initialData = null) {
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

  let defaultPresetIdx = 0;
  if (initialData?.type) {
    const foundIdx = PRESET_PROVIDERS.findIndex(p => p.id === initialData.type);
    if (foundIdx !== -1) defaultPresetIdx = foundIdx;
  }

  let choiceIdx = -1;
  while (choiceIdx < 0 || choiceIdx >= PRESET_PROVIDERS.length) {
    const promptMsg = `${c.green}? 请输入提供商编号 [1-${PRESET_PROVIDERS.length}] (默认 ${defaultPresetIdx + 1}): ${c.reset}`;
    const answer = await rl.question(promptMsg);
    const trimmed = answer.trim();
    if (!trimmed) {
      choiceIdx = defaultPresetIdx;
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
  let customLabel = initialData?.name || preset.name;
  let baseUrl = preset.isCustom ? (initialData?.baseUrl || '') : preset.url;

  if (preset.isCustom) {
    while (!baseUrl) {
      const defUrlText = initialData?.baseUrl ? ` (当前: ${initialData.baseUrl})` : '';
      const inputUrl = await rl.question(`${c.green}? 请输入 OpenAI 兼容的 Base URL (如 https://api.openai.com/v1)${defUrlText}: ${c.reset}`);
      baseUrl = inputUrl.trim() || initialData?.baseUrl || '';
      if (!baseUrl) console.log(`${c.red}⚠️ Base URL 不能为空${c.reset}`);
    }
    const defLabelText = initialData?.name ? ` (当前: ${initialData.name})` : ' (默认 自定义网关)';
    const labelInput = await rl.question(`${c.green}? 请为此自定义提供商设置别名${defLabelText}: ${c.reset}`);
    if (labelInput.trim()) customLabel = labelInput.trim();
  } else {
    console.log(`  👉 接口地址 (Base URL): ${c.dim}${baseUrl}${c.reset}`);
  }

  let apiKey = initialData?.apiKey || '';
  const defKeyText = apiKey ? ` (已存在: ${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}, 回车保持不变)` : '';
  while (!apiKey) {
    const inputKey = await rl.question(`${c.green}? 请输入 ${customLabel} 的 API Key${defKeyText}: ${c.reset}`);
    const trimmedKey = inputKey.trim();
    if (trimmedKey) {
      apiKey = trimmedKey;
    } else if (initialData?.apiKey) {
      apiKey = initialData.apiKey;
    } else {
      console.log(`${c.red}⚠️ API Key 不能为空${c.reset}`);
    }
  }

  return {
    id: initialData?.id || `${preset.id}_${Date.now()}`,
    type: preset.id,
    name: customLabel,
    baseUrl,
    apiKey,
    defaultModel: initialData?.defaultModel || preset.defaultModel,
    fastModel: initialData?.fastModel || preset.fastModel
  };
}

// Main Interactive CLI Runner
async function runInit() {
  printBanner();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const existingEnv = loadAllExistingEnv();
    const existingProviders = loadExistingProviders();
    const hasExistingConfig = existingEnv.size > 0 || existingProviders.length > 0;

    // =============================================================
    // 0. Existing Config Detection & Fast Skip / Resume Options
    // =============================================================
    if (hasExistingConfig) {
      console.log(`${c.yellow}${c.bold}🔍 检测到本地已存在历史配置：${c.reset}`);
      const currBase = existingEnv.get('AI_BASE_URL') || '(未配置)';
      const currDef = existingEnv.get('DEFAULT_MODEL') || '(未配置)';
      const currFast = existingEnv.get('FAST_MODEL') || '(未配置)';
      const currAuth = existingEnv.get('AUTH_REGISTRATION_MODE') || 'username';
      const currSearch = existingEnv.get('SEARCH_PROVIDER') || 'none';

      console.log(`  • 主模型地址 (Base URL): ${c.cyan}${currBase}${c.reset}`);
      console.log(`  • 标准对话模型:          ${c.cyan}${currDef}${c.reset}`);
      console.log(`  • 快速处理模型:          ${c.magenta}${currFast}${c.reset}`);
      console.log(`  • 考生注册方式:          ${c.bold}${currAuth.toUpperCase()}${c.reset}`);
      console.log(`  • 联网搜索引擎:          ${c.green}${currSearch.toUpperCase()}${c.reset}\n`);

      console.log(`  ${c.cyan}[1]${c.reset} ${c.bold}读取并基于现有配置更新${c.reset}   ${c.dim}(推荐 · 回车即可保留历史已填选项)${c.reset}`);
      console.log(`  ${c.cyan}[2]${c.reset} ${c.bold}跳过配置并直接退出${c.reset}       ${c.green}(保持现有配置直接启动应用)${c.reset}`);
      console.log(`  ${c.cyan}[3]${c.reset} ${c.bold}重新全新配置${c.reset}             ${c.dim}(清空并重新开始向导)${c.reset}\n`);

      const initChoice = await rl.question(`${c.green}? 请选择操作 [1-3] (默认 1): ${c.reset}`);
      const trimmedChoice = initChoice.trim();

      if (trimmedChoice === '2') {
        console.log(`\n${c.green}✅ 已跳过配置向导，保持当前环境不变！${c.reset}`);
        console.log(`${c.dim}运行 ${c.cyan}npm run dev${c.dim} 即可即刻启动服务。${c.reset}\n`);
        return;
      }
      if (trimmedChoice === '3') {
        existingEnv.clear();
        existingProviders.length = 0;
        console.log(`\n${c.yellow}🧹 已清空历史缓存，进入全新配置流程...${c.reset}\n`);
      } else {
        console.log(`\n${c.green}✅ 已加载现有配置，每项回车即可保留原值。${c.reset}\n`);
      }
    }

    // =============================================================
    // STEP 1: Multi-Provider Pool Configuration (多模型提供商池)
    // =============================================================
    const providerPool = [];
    console.log(`${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 1/4】配置模型提供商池 (Provider Pool)：${c.reset}`);
    console.log(`${c.dim}您可以配置 1 个或多个大模型提供商（如 DeepSeek、通义千问、硅基流动等），后续可为不同模型指派不同提供商。${c.reset}\n`);

    // Add Provider #1 (Primary)
    const initialProv1 = existingProviders[0] || (existingEnv.get('AI_BASE_URL') ? {
      name: existingEnv.get('DEFAULT_MODEL_PROVIDER') || '主模型提供商',
      baseUrl: existingEnv.get('AI_BASE_URL'),
      apiKey: existingEnv.get('AI_API_KEY'),
      defaultModel: existingEnv.get('DEFAULT_MODEL'),
      fastModel: existingEnv.get('FAST_MODEL')
    } : null);

    const firstProvider = await promptSingleProvider(rl, '➡️ 请配置第 1 个大模型提供商 (主提供商)：', initialProv1);
    providerPool.push(firstProvider);
    console.log(`${c.green}✅ 已添加提供商 [1]: ${firstProvider.name}${c.reset}\n`);

    // Load remaining existing providers if any
    if (existingProviders.length > 1) {
      for (let i = 1; i < existingProviders.length; i++) {
        providerPool.push(existingProviders[i]);
      }
    }

    // Optionally Add More Providers
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

    // Display Provider Pool Summary
    console.log(`\n${c.bold}📋 当前已配置的提供商池 (${providerPool.length} 个)：${c.reset}`);
    providerPool.forEach((p, idx) => {
      console.log(`   ${c.cyan}[${idx + 1}]${c.reset} ${c.bold}${p.name}${c.reset} ${c.dim}(Base: ${p.baseUrl})${c.reset}`);
    });

    // =============================================================
    // STEP 2: Model Assignment (标准对话模型 & 快速模型自由绑定)
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

    let defaultModel = existingEnv.get('DEFAULT_MODEL') || defaultProv.defaultModel || 'deepseek-chat';
    console.log(`\n⏳ 正在拉取【${defaultProv.name}】的可用模型列表...`);
    const defFetch = await fetchRemoteModels(defaultProv.baseUrl, defaultProv.apiKey);

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
      console.log(`${c.yellow}ℹ️ 未能自动拉取模型列表，请手动确认模型名称：${c.reset}`);
      const defModelAns = await rl.question(`${c.green}? 请输入 标准对话模型 (DEFAULT_MODEL) (默认: ${defaultModel}): ${c.reset}`);
      if (defModelAns.trim()) defaultModel = defModelAns.trim();
    }
    console.log(`👉 标准对话模型确定为: ${c.cyan}${c.bold}${defaultModel}${c.reset} (提供商: ${defaultProv.name})\n`);

    // 2.2 Fast Model (FAST_MODEL) Assignment
    let fastProv = providerPool[0];
    let fastBaseUrl = defaultProv.baseUrl;
    let fastApiKey = defaultProv.apiKey;
    let fastModel = existingEnv.get('FAST_MODEL') || defaultProv.fastModel || defaultModel;

    if (providerPool.length > 1) {
      console.log(`${c.bold}请为【快速处理模型 (FAST_MODEL)】选择提供商：${c.reset}`);
      console.log(`${c.dim}(用于文档智能切片、表格结构化与高并发任务，可指派轻量极速模型)${c.reset}`);
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
    // STEP 3: Single-Choice Registration Mode (登录与注册方式单选互斥)
    // =============================================================
    console.log(`\n${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 3/4】考生注册与登录方式选择 (三选一 · 互斥单选)：${c.reset}\n`);

    console.log(`  ${c.cyan}[1]${c.reset} ${c.bold}普通账号密码注册${c.reset}   ${c.dim}(静态标准模式 · 账号名+密码 · 零第三方依赖)${c.reset}`);
    console.log(`  ${c.cyan}[2]${c.reset} ${c.bold}手机号验证码注册${c.reset}   ${c.dim}(需手机 6 位短信验证码校验 · 接入腾讯云 SMS)${c.reset}`);
    console.log(`  ${c.cyan}[3]${c.reset} ${c.bold}邮箱验证码注册${c.reset}     ${c.dim}(需邮箱 6 位验证码校验 · 接入 SMTP 邮件直发)${c.reset}`);
    console.log('');

    let defaultAuthChoice = 1;
    const currAuthMode = existingEnv.get('AUTH_REGISTRATION_MODE');
    if (currAuthMode === 'phone') defaultAuthChoice = 2;
    else if (currAuthMode === 'email') defaultAuthChoice = 3;

    let authChoice = defaultAuthChoice;
    const authAns = await rl.question(`${c.green}? 请选择注册方式编号 [1-3] (默认 ${defaultAuthChoice}): ${c.reset}`);
    if (authAns.trim()) {
      const parsed = parseInt(authAns.trim(), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) authChoice = parsed;
    }

    let authRegistrationMode = 'username';
    if (authChoice === 2) authRegistrationMode = 'phone';
    else if (authChoice === 3) authRegistrationMode = 'email';

    let tencentSmsSecretId = existingEnv.get('TENCENT_SMS_SECRET_ID') || '';
    let tencentSmsSecretKey = existingEnv.get('TENCENT_SMS_SECRET_KEY') || '';
    let tencentSmsSdkAppId = existingEnv.get('TENCENT_SMS_SDK_APP_ID') || '';
    let tencentSmsSignName = existingEnv.get('TENCENT_SMS_SIGN_NAME') || '';
    let tencentSmsTemplateId = existingEnv.get('TENCENT_SMS_TEMPLATE_ID') || '';

    let smtpHost = existingEnv.get('SMTP_HOST') || '';
    let smtpPort = existingEnv.get('SMTP_PORT') || '587';
    let smtpUser = existingEnv.get('SMTP_USER') || existingEnv.get('MAIL_FROM') || '';
    let smtpPass = existingEnv.get('SMTP_PASS') || existingEnv.get('SMTP_PASSWORD') || '';
    let mailFrom = existingEnv.get('MAIL_FROM') || smtpUser;
    let mailFromName = existingEnv.get('MAIL_FROM_NAME') || '广州大学招生问答平台';
    let smtpSecureEnabled = existingEnv.get('SMTP_SECURE_ENABLED') || '0';

    // Mode 2: Phone / Tencent Cloud SMS configuration
    if (authChoice === 2) {
      console.log(`\n${c.cyan}${c.bold}📱 [腾讯云 SMS 手机短信服务配置]${c.reset}`);
      console.log(`${c.dim}(若留空 SecretId，系统将自动进入 DevMock 本地终端打印 6 位验证码)${c.reset}`);
      
      const defSidText = tencentSmsSecretId ? ` (当前: ${tencentSmsSecretId})` : '';
      const sidInput = await rl.question(`${c.green}? 腾讯云 SecretId (可选)${defSidText}: ${c.reset}`);
      tencentSmsSecretId = sidInput.trim() || tencentSmsSecretId;

      if (tencentSmsSecretId) {
        const defKeyText = tencentSmsSecretKey ? ' (已有已保存密钥，回车保留)' : '';
        const keyInput = await rl.question(`${c.green}? 腾讯云 SecretKey${defKeyText}: ${c.reset}`);
        tencentSmsSecretKey = keyInput.trim() || tencentSmsSecretKey;

        const defAppText = tencentSmsSdkAppId ? ` (当前: ${tencentSmsSdkAppId})` : '';
        const appInput = await rl.question(`${c.green}? 短信 SdkAppId (可选)${defAppText}: ${c.reset}`);
        tencentSmsSdkAppId = appInput.trim() || tencentSmsSdkAppId;

        const defSignText = tencentSmsSignName ? ` (当前: ${tencentSmsSignName})` : '';
        const signInput = await rl.question(`${c.green}? 短信签名 SignName (可选)${defSignText}: ${c.reset}`);
        tencentSmsSignName = signInput.trim() || tencentSmsSignName;

        const defTplText = tencentSmsTemplateId ? ` (当前: ${tencentSmsTemplateId})` : '';
        const tplInput = await rl.question(`${c.green}? 正文模板 TemplateId (可选)${defTplText}: ${c.reset}`);
        tencentSmsTemplateId = tplInput.trim() || tencentSmsTemplateId;
      }
    }

    // Mode 3: Email / SMTP configuration
    if (authChoice === 3) {
      console.log(`\n${c.cyan}${c.bold}✉️ [SMTP 发件邮箱服务配置]${c.reset}`);
      console.log(`${c.dim}(如 smtp.qq.com / smtp.163.com，若留空将自动在控制台打印验证码)${c.reset}`);

      const defHostText = smtpHost ? ` (当前: ${smtpHost})` : ' (例如 smtp.qq.com)';
      const hostInput = await rl.question(`${c.green}? SMTP 服务器主机${defHostText}: ${c.reset}`);
      smtpHost = hostInput.trim() || smtpHost;

      if (smtpHost) {
        const defPortText = ` (默认: ${smtpPort})`;
        const portInput = await rl.question(`${c.green}? SMTP 端口 (常见: 465 或 587)${defPortText}: ${c.reset}`);
        smtpPort = portInput.trim() || smtpPort;

        const defUserText = smtpUser ? ` (当前: ${smtpUser})` : '';
        const userInput = await rl.question(`${c.green}? 发件账号 (邮箱地址)${defUserText}: ${c.reset}`);
        smtpUser = userInput.trim() || smtpUser;

        const defPassText = smtpPass ? ' (已有已保存授权码/密码，回车保留)' : '';
        const passInput = await rl.question(`${c.green}? 发件授权码 / 密码${defPassText}: ${c.reset}`);
        smtpPass = passInput.trim() || smtpPass;

        mailFrom = smtpUser;
        const defNameText = ` (默认: ${mailFromName})`;
        const nameInput = await rl.question(`${c.green}? 发件人显示名称${defNameText}: ${c.reset}`);
        if (nameInput.trim()) mailFromName = nameInput.trim();
      }
    }

    // =============================================================
    // STEP 4: Configure Web Search Engine
    // =============================================================
    console.log(`\n${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 4/4】请选择联网搜索引擎 (用于高考录取政策实时查询)：${c.reset}\n`);

    console.log(`  ${c.cyan}[1]${c.reset} ${c.bold}Tavily${c.reset}          ${c.dim}(推荐 · AI 优化结构化搜索 · 需填 API Key)${c.reset}`);
    console.log(`  ${c.cyan}[2]${c.reset} ${c.bold}博查 AI (Bocha)${c.reset}  ${c.dim}(国内高校与招生深度搜索 · 需填 API Key)${c.reset}`);
    console.log(`  ${c.cyan}[3]${c.reset} ${c.bold}DuckDuckGo${c.reset}       ${c.green}(免 Key · 开箱即用 · 自动兜底)${c.reset}`);
    console.log(`  ${c.cyan}[4]${c.reset} ${c.dim}暂不启用联网搜索${c.reset}`);
    console.log('');

    let defaultSearchIdx = 3;
    const currSearch = existingEnv.get('SEARCH_PROVIDER');
    if (currSearch === 'tavily') defaultSearchIdx = 1;
    else if (currSearch === 'bocha') defaultSearchIdx = 2;
    else if (currSearch === 'duckduckgo') defaultSearchIdx = 3;
    else if (currSearch === 'none') defaultSearchIdx = 4;

    let searchChoice = defaultSearchIdx;
    const searchAns = await rl.question(`${c.green}? 请输入选项编号 [1-4] (默认 ${defaultSearchIdx}): ${c.reset}`);
    if (searchAns.trim()) {
      const parsed = parseInt(searchAns.trim(), 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) searchChoice = parsed;
    }

    let searchProvider = 'duckduckgo';
    let tavilyApiKey = existingEnv.get('TAVILY_API_KEY') || '';
    let bochaApiKey = existingEnv.get('BOCHA_API_KEY') || '';

    if (searchChoice === 1) {
      searchProvider = 'tavily';
      const defTavText = tavilyApiKey ? ` (当前: ${tavilyApiKey.slice(0, 6)}••••)` : '';
      while (!tavilyApiKey) {
        const inputKey = await rl.question(`${c.green}? 请输入 Tavily API Key (tvly-...)${defTavText}: ${c.reset}`);
        tavilyApiKey = inputKey.trim() || tavilyApiKey;
        if (!tavilyApiKey) console.log(`${c.red}⚠️ Key 不能为空${c.reset}`);
      }
    } else if (searchChoice === 2) {
      searchProvider = 'bocha';
      const defBocText = bochaApiKey ? ` (当前: ${bochaApiKey.slice(0, 6)}••••)` : '';
      while (!bochaApiKey) {
        const inputKey = await rl.question(`${c.green}? 请输入 博查 (Bocha) API Key${defBocText}: ${c.reset}`);
        bochaApiKey = inputKey.trim() || bochaApiKey;
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
      mailFrom,
      mailFromName,
      smtpSecureEnabled,
      providerPool
    };

    saveEnvFile(configResult);

    const modeLabels = {
      username: '普通账号密码注册 (零依赖)',
      phone: '手机短信验证码注册 (腾讯云 SMS)',
      email: '邮箱验证码注册 (SMTP 邮件直发)'
    };

    console.log(`
${c.green}${c.bold}===============================================================
🎉 Gzadm Navigator 配置已成功保存！
===============================================================${c.reset}

  ${c.bold}提供商池数量:${c.reset}          ${c.cyan}${providerPool.length} 个模型提供商${c.reset}
  ${c.bold}标准对话模型 (DEFAULT):${c.reset} ${c.cyan}${defaultModel}${c.reset} 【${defaultProv.name}】
  ${c.bold}快速处理模型 (FAST):${c.reset}   ${c.magenta}${fastModel}${c.reset} 【${fastProv.name}】
  ${c.bold}联网搜索引擎:${c.reset}          ${c.green}${searchProvider.toUpperCase()}${c.reset}
  ${c.bold}考生注册与登录模式:${c.reset}    ${c.bold}${modeLabels[authRegistrationMode] || authRegistrationMode}${c.reset}
  ${c.bold}环境配置文件路径:${c.reset}      ${path.relative(process.cwd(), envFilePath)} / .env.local

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
  gzhu init           交互式配置多模型提供商池、绑定标准/快速模型、配置搜索引擎与注册方式 (支持读取历史/跳过)
  gzhu --help         查看帮助信息
`);
} else {
  runInit();
}
