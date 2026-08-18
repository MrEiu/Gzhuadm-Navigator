#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';
import { tavily } from '@tavily/core';
import { search as ddgSearch, SafeSearchType } from 'duck-duck-scrape';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envFilePath = path.join(projectRoot, '.env');

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

// Preset AI Providers
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
      const timeout = setTimeout(() => controller.abort(), 7000);
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
    } catch (err) {
      // try next candidate url
    }
  }

  return { ok: false, models: [] };
};

// Helper to test chat completion connectivity
const testChatConnectivity = async (baseUrl, apiKey, model) => {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const targetUrl = cleanBase.endsWith('/v1') ? `${cleanBase}/chat/completions` : `${cleanBase}/chat/completions`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      return { ok: true };
    }
    const errText = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 120)}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// Helper for testing web search
const testSearchConnectivity = async (provider, key) => {
  if (provider === 'tavily' && key) {
    try {
      const tvly = tavily({ apiKey: key });
      const res = await tvly.search('2026 高考招生', { maxResults: 1 });
      return { ok: res?.results?.length > 0 };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  } else if (provider === 'bocha' && key) {
    try {
      const res = await fetch('https://api.bochaai.com/v1/web-search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '2026 高考招生', count: 1 })
      });
      return { ok: res.ok };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  } else if (provider === 'duckduckgo') {
    try {
      const res = await ddgSearch('2026 高考招生', { safeSearch: SafeSearchType.STRICT });
      return { ok: res?.results?.length > 0 };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  return { ok: true };
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

  // Set AI Model configuration
  envMap.set('AI_BASE_URL', config.baseUrl);
  envMap.set('AI_API_KEY', config.apiKey);
  envMap.set('DEFAULT_MODEL', config.defaultModel);
  envMap.set('FAST_MODEL', config.fastModel);

  // Set Web Search configuration
  if (config.searchProvider) {
    envMap.set('SEARCH_PROVIDER', config.searchProvider);
  }
  if (config.tavilyApiKey) {
    envMap.set('TAVILY_API_KEY', config.tavilyApiKey);
  }
  if (config.bochaApiKey) {
    envMap.set('BOCHA_API_KEY', config.bochaApiKey);
  }

  // Maintain backward compatibility
  if (config.providerId === 'deepseek') {
    envMap.set('DEEPSEEK_API_KEY', config.apiKey);
    envMap.set('DEEPSEEK_BASE_URL', config.baseUrl);
    envMap.set('DEEPSEEK_MODEL', config.defaultModel);
  } else if (config.providerId === 'openai') {
    envMap.set('OPENAI_API_KEY', config.apiKey);
    envMap.set('OPENAI_BASE_URL', config.baseUrl);
    envMap.set('OPENAI_MODEL', config.defaultModel);
  }

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
};

const printBanner = () => {
  console.log(`
${c.cyan}${c.bold}===============================================================
       🎓 Gzadm Navigator · AI 引擎与模型配置初始化向导
===============================================================${c.reset}
`);
};

// Interactive CLI Runner
async function runInit() {
  printBanner();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    // -------------------------------------------------------------
    // STEP 1: Select AI Model Provider
    // -------------------------------------------------------------
    console.log(`${c.bold}【步骤 1/2】请选择大语言模型服务商：${c.reset}\n`);
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
        choiceIdx = 0; // Default to DeepSeek
        break;
      }
      const parsed = parseInt(trimmed, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= PRESET_PROVIDERS.length) {
        choiceIdx = parsed - 1;
      } else {
        console.log(`${c.red}⚠️ 无效选项，请输入 1 到 ${PRESET_PROVIDERS.length} 之间的数字${c.reset}`);
      }
    }

    const provider = PRESET_PROVIDERS[choiceIdx];
    console.log(`\n已选择: ${c.cyan}${c.bold}${provider.name}${c.reset}`);

    let baseUrl = provider.url;
    if (provider.isCustom) {
      while (!baseUrl) {
        const inputUrl = await rl.question(`${c.green}? 请输入 OpenAI 兼容的 Base URL (例如 https://api.openai.com/v1): ${c.reset}`);
        baseUrl = inputUrl.trim();
        if (!baseUrl) console.log(`${c.red}⚠️ Base URL 不能为空${c.reset}`);
      }
    } else {
      console.log(`  👉 接口地址 (Base URL): ${c.dim}${baseUrl}${c.reset}`);
    }

    let apiKey = '';
    while (!apiKey) {
      const inputKey = await rl.question(`${c.green}? 请输入 ${provider.name} 的 API Key: ${c.reset}`);
      apiKey = inputKey.trim();
      if (!apiKey) console.log(`${c.red}⚠️ API Key 不能为空${c.reset}`);
    }

    // Step 1.2: Auto-fetch model list
    console.log(`\n⏳ 正在连接服务商 (${baseUrl}) 获取模型列表...`);
    const modelFetchRes = await fetchRemoteModels(baseUrl, apiKey);

    let defaultModel = provider.defaultModel || 'deepseek-chat';
    let fastModel = provider.fastModel || 'deepseek-chat';

    if (modelFetchRes.ok && modelFetchRes.models.length > 0) {
      const models = modelFetchRes.models;
      console.log(`${c.green}✅ 成功获取到 ${models.length} 个可用模型：${c.reset}\n`);

      models.forEach((m, idx) => {
        const idxStr = String(idx + 1).padStart(3, ' ');
        console.log(`   ${c.dim}${idxStr}.${c.reset} ${c.bold}${m}${c.reset}`);
      });
      console.log('');

      // Pick Default Model
      console.log(`${c.cyan}💬 【默认模型 (DEFAULT_MODEL)】${c.reset} 用于回复考生与家长消息（智能体主对话、录取分析）。`);
      const defAns = await rl.question(`${c.green}? 请输入编号或模型名称 (默认: ${defaultModel}): ${c.reset}`);
      const defTrimmed = defAns.trim();
      if (defTrimmed) {
        const num = parseInt(defTrimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= models.length) {
          defaultModel = models[num - 1];
        } else {
          defaultModel = defTrimmed;
        }
      } else if (!models.includes(defaultModel)) {
        defaultModel = models[0];
      }

      // Pick Fast Model
      console.log(`\n${c.cyan}⚡ 【快速模型 (FAST_MODEL)】${c.reset} 用于后端处理轻量任务（文档智能切片、意图识别）。`);
      const fastAns = await rl.question(`${c.green}? 请输入编号或模型名称 (默认: ${defaultModel}): ${c.reset}`);
      const fastTrimmed = fastAns.trim();
      if (fastTrimmed) {
        const num = parseInt(fastTrimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= models.length) {
          fastModel = models[num - 1];
        } else {
          fastModel = fastTrimmed;
        }
      } else {
        fastModel = defaultModel;
      }
    } else {
      console.log(`${c.yellow}ℹ️ 未能从 /models 接口自动拉取模型列表，转为手动指定：${c.reset}\n`);
      const defAns = await rl.question(`${c.green}? 请输入 默认对话模型 (DEFAULT_MODEL) (默认: ${defaultModel}): ${c.reset}`);
      if (defAns.trim()) defaultModel = defAns.trim();

      const fastAns = await rl.question(`${c.green}? 请输入 快速处理模型 (FAST_MODEL) (默认: ${fastModel}): ${c.reset}`);
      if (fastAns.trim()) fastModel = fastAns.trim();
    }

    // Connectivity Test
    console.log(`\n⏳ 正在验证模型连通性 [${defaultModel}]...`);
    const testRes = await testChatConnectivity(baseUrl, apiKey, defaultModel);
    if (testRes.ok) {
      console.log(`${c.green}✅ 大语言模型连通性测试通过！${c.reset}`);
    } else {
      console.log(`${c.yellow}⚠️ 连通性提示: ${testRes.error}${c.reset}`);
    }

    // -------------------------------------------------------------
    // STEP 2: Configure Web Search Engine
    // -------------------------------------------------------------
    console.log(`\n${c.bold}===============================================================${c.reset}`);
    console.log(`${c.bold}【步骤 2/2】请选择联网搜索引擎 (用于查询全国政策、外部高校对比与实时资讯)：${c.reset}\n`);

    console.log(`  ${c.cyan}[1]${c.reset} ${c.bold}Tavily${c.reset}          ${c.dim}(推荐 · AI 原生搜索 · 需填 API Key)${c.reset}`);
    console.log(`  ${c.cyan}[2]${c.reset} ${c.bold}博查 AI (Bocha)${c.reset}  ${c.dim}(国内中文政策深度优化 · 需填 API Key)${c.reset}`);
    console.log(`  ${c.cyan}[3]${c.reset} ${c.bold}DuckDuckGo${c.reset}       ${c.green}(免 Key · 免费开箱即用 · 自动兜底)${c.reset}`);
    console.log(`  ${c.cyan}[4]${c.reset} ${c.dim}暂不启用联网搜索${c.reset}`);
    console.log('');

    let searchChoice = 3;
    const searchAns = await rl.question(`${c.green}? 请输入选项编号 [1-4] (默认 3 - DuckDuckGo 免Key): ${c.reset}`);
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
      console.log(`  👉 已启用 ${c.green}DuckDuckGo 免 Key 搜索引擎${c.reset}`);
    } else {
      searchProvider = 'none';
      console.log(`  👉 已禁用联网搜索`);
    }

    // Step 4: Write .env
    const configResult = {
      providerId: provider.id,
      baseUrl,
      apiKey,
      defaultModel,
      fastModel,
      searchProvider,
      tavilyApiKey,
      bochaApiKey
    };

    saveEnvFile(configResult);

    console.log(`
${c.green}${c.bold}===============================================================
🎉 Gzadm Navigator 全部配置初始化成功！
===============================================================${c.reset}

  ${c.bold}模型服务商:${c.reset}   ${provider.name}
  ${c.bold}Base URL:${c.reset}     ${baseUrl}
  ${c.bold}默认模型:${c.reset}     ${c.cyan}${defaultModel}${c.reset} (用于回复用户咨询)
  ${c.bold}快速模型:${c.reset}     ${c.magenta}${fastModel}${c.reset} (用于后端文档切片/分析)
  ${c.bold}联网搜索:${c.reset}     ${c.green}${searchProvider.toUpperCase()}${c.reset} (未配置/故障时自动由 DuckDuckGo 兜底)
  ${c.bold}配置文件:${c.reset}     ${path.relative(process.cwd(), envFilePath)}

${c.dim}您现在可以运行 ${c.cyan}npm run dev${c.dim} 启动智能入学咨询系统！${c.reset}
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
} else if (command === 'models' || command === 'list') {
  const envMap = loadExistingEnv();
  const baseUrl = envMap.get('AI_BASE_URL') || envMap.get('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com';
  const apiKey = envMap.get('AI_API_KEY') || envMap.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    console.log(`${c.red}⚠️ 未检测到 API Key，请先运行 gzhu init 初始化配置。${c.reset}`);
  } else {
    console.log(`⏳ 正在获取 ${baseUrl} 的模型列表...`);
    fetchRemoteModels(baseUrl, apiKey).then(res => {
      if (res.ok) {
        console.log(`${c.green}✅ 可用模型列表 (${res.models.length}):${c.reset}`);
        res.models.forEach((m, i) => console.log(` [${i+1}] ${m}`));
      } else {
        console.log(`${c.red}❌ 获取模型列表失败${c.reset}`);
      }
    });
  }
} else if (command === 'search') {
  const query = args.slice(1).join(' ') || '2026 计算机专业就业趋势';
  console.log(`⏳ 正在联网搜索: "${query}"...`);
  ddgSearch(query, { safeSearch: SafeSearchType.STRICT }).then(res => {
    if (res?.results?.length) {
      console.log(`${c.green}✅ 搜索成功 (前 3 条结果)：${c.reset}\n`);
      res.results.slice(0, 3).forEach((r, i) => {
        console.log(`${c.bold}${i+1}. [${r.title}](${r.url})${c.reset}`);
        console.log(`   ${c.dim}${r.description}${c.reset}\n`);
      });
    } else {
      console.log(`${c.yellow}未找到搜索结果${c.reset}`);
    }
  }).catch(err => {
    console.error(`${c.red}搜索失败: ${err.message}${c.reset}`);
  });
} else if (command === '--help' || command === '-h' || command === 'help') {
  console.log(`
${c.cyan}${c.bold}Gzadm Navigator CLI (gzhu)${c.reset}

${c.bold}用法:${c.reset}
  gzhu init           交互式配置 API Key、网关地址、获取模型并配置搜索引擎
  gzhu models         一键列出当前配置服务商的所有可用模型
  gzhu search <词>    测试联网搜索功能
  gzhu --help         查看帮助信息
`);
} else {
  runInit();
}
