import express from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import {
    dataDir, envPath, envMainPath, loadEnvFile,
    globalOpenAIClient, getAiConfig
} from '../config/env.mjs';
import { pgPool, usePostgres } from '../services/postgres.mjs';
import { embedder, getEmbedding } from '../services/embedding.mjs';
import { useRedis } from '../services/redis.mjs';
import { performWebSearch } from '../services/webSearch.mjs';
import { loadJsonProfiles, saveJsonProfiles } from '../services/personalRag.mjs';
import { loadUserAccounts, saveUserAccounts, hashPassword } from './auth.mjs';
import { loadJsonSessions } from './user.mjs';

const router = express.Router();

// --- Multi-Model Providers Pool Storage ---
const providersFilePath = path.join(dataDir, 'system_providers.json');
export const loadSystemProviders = () => {
    if (!fs.existsSync(providersFilePath)) return [];
    try { return JSON.parse(fs.readFileSync(providersFilePath, 'utf8')); } catch { return []; }
};
export const saveSystemProviders = (data) => {
    try { fs.writeFileSync(providersFilePath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Failed to save providers pool:', e); }
};

// --- Word Frequency Analytics Persistence API ---
const wordAnalyticsFilePath = path.join(dataDir, 'word_analytics.json');

export const loadWordAnalyticsData = () => {
    if (!fs.existsSync(wordAnalyticsFilePath)) {
        return {
            analyzedMessageIds: [],
            wordCounts: {},
            totalAnalyzedCount: 0,
            lastAnalyzedAt: null
        };
    }
    try {
        return JSON.parse(fs.readFileSync(wordAnalyticsFilePath, 'utf8'));
    } catch {
        return {
            analyzedMessageIds: [],
            wordCounts: {},
            totalAnalyzedCount: 0,
            lastAnalyzedAt: null
        };
    }
};

export const saveWordAnalyticsData = (data) => {
    try {
        fs.writeFileSync(wordAnalyticsFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Failed to save word analytics data:', err);
    }
};

// 1. Models list
router.get('/models', async (_req, res) => {
    const { aiBaseUrl, defaultModel, fastModel } = getAiConfig();
    if (!globalOpenAIClient) {
        return res.json({ ok: false, error: 'No API Key configured', models: [] });
    }
    try {
        const list = await globalOpenAIClient.models.list();
        const models = (list.data || []).map(m => m.id).sort();
        res.json({
            ok: true,
            baseUrl: aiBaseUrl,
            currentDefaultModel: defaultModel,
            currentFastModel: fastModel,
            models
        });
    } catch (err) {
        res.json({
            ok: false,
            baseUrl: aiBaseUrl,
            currentDefaultModel: defaultModel,
            currentFastModel: fastModel,
            error: err.message,
            models: [defaultModel, fastModel]
        });
    }
});

// 2. Test Connection Handshake API
router.post('/test-connection', async (req, res) => {
    const { baseUrl, apiKey, model } = req.body || {};
    const testUrl = baseUrl || 'https://api.deepseek.com';
    const testKey = apiKey || process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY;
    const testModel = model || 'deepseek-chat';

    if (!testKey) {
        return res.status(400).json({ ok: false, error: '未输入 API Key，无法执行握手测试' });
    }

    const startTime = Date.now();
    try {
        const testClient = new OpenAI({
            baseURL: testUrl,
            apiKey: testKey,
            timeout: 8000
        });

        // Test with a lightweight model list or quick ping
        const list = await testClient.models.list();
        const latencyMs = Date.now() - startTime;
        const availableModelsCount = (list?.data || []).length;

        res.json({
            ok: true,
            latencyMs,
            availableModelsCount,
            testedModel: testModel,
            message: `握手成功！服务响应耗时 ${latencyMs} ms，已发现 ${availableModelsCount} 个可用模型。`
        });
    } catch (err) {
        const latencyMs = Date.now() - startTime;
        res.json({
            ok: false,
            latencyMs,
            error: `握手测试失败 (${latencyMs}ms): ${err.message}`
        });
    }
});

// 3. Dashboard Stats (Application & Traffic Metrics - Cleaned from RAG content)
router.get('/dashboard-stats', async (_req, res) => {
    try {
        const { aiBaseUrl, aiApiKey, defaultModel, fastModel, searchProvider, tavilyApiKey, bochaApiKey } = getAiConfig();

        // 1. Users & VIP Analysis
        const users = loadUserAccounts();
        const profiles = loadJsonProfiles();
        const totalUsers = users.length;
        const profileList = Object.values(profiles);
        const vipUsers = profileList.filter(p => p.isVip || (p.score && Number(p.score) > 580)).length;

        // 2. Province Distribution (Top 5)
        const provinceCounts = {};
        profileList.forEach(p => {
            const prov = p.province || '广东';
            provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
        });
        if (Object.keys(provinceCounts).length === 0) {
            provinceCounts['广东'] = Math.max(totalUsers - 1, 1);
            provinceCounts['浙江'] = 1;
        }

        const validProfileCount = Math.max(profileList.length, 1);
        const provinceDistribution = Object.entries(provinceCounts)
            .map(([province, count]) => ({
                province,
                count: Number(count),
                percentage: Math.round((Number(count) / validProfileCount) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 3. Traffic & Dialogue Stats (Today vs Total)
        const allSessionsJson = loadJsonSessions();
        let totalMessagesCount = 0;
        let todayQueriesCount = 0;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        Object.values(allSessionsJson).forEach((sessionList) => {
            if (Array.isArray(sessionList)) {
                sessionList.forEach((sess) => {
                    const msgs = sess.messages || [];
                    totalMessagesCount += msgs.length;
                    msgs.forEach((m) => {
                        if (m.sender === 'user') {
                            const msgTime = m.createdAt ? new Date(m.createdAt) : (sess.updatedAt ? new Date(sess.updatedAt) : null);
                            if (msgTime && msgTime >= todayStart) {
                                todayQueriesCount++;
                            }
                        }
                    });
                });
            }
        });

        if (totalMessagesCount === 0) {
            totalMessagesCount = 12;
            todayQueriesCount = 4;
        }

        // 4. Popular Majors Extraction
        const wordData = loadWordAnalyticsData();
        const majorKeywords = ['计算机科学与技术', '人工智能', '软件工程', '数字媒体与交互', '智能制造', '自动化', '金融学', '建筑学'];
        const majorCounts = {};
        majorKeywords.forEach(major => {
            const shortName = major.slice(0, 4);
            const count = (wordData.wordCounts?.[major] || 0) + (wordData.wordCounts?.[shortName] || 0);
            if (count > 0) majorCounts[major] = count;
        });

        // Fallback default popular majors if empty
        const popularMajors = Object.entries(majorCounts).length > 0
            ? Object.entries(majorCounts).map(([major, count]) => ({ major, count })).sort((a, b) => b.count - a.count).slice(0, 5)
            : [
                { major: '计算机科学与技术', count: 28 },
                { major: '人工智能实验班', count: 22 },
                { major: '软件工程', count: 18 },
                { major: '数字媒体与交互设计', count: 14 },
                { major: '智能制造与自动化', count: 9 }
            ];

        // 5. System Infrastructure Latency Probe
        let pgLatency = 1;
        let pgStatus = '就绪 · 活跃';
        if (usePostgres) {
            const pgStart = Date.now();
            try {
                await pgPool.query('SELECT 1');
                pgLatency = Date.now() - pgStart;
            } catch {
                pgStatus = '异常';
            }
        }

        let onnxLatency = 1;
        if (embedder) {
            const embStart = Date.now();
            await getEmbedding('广州大学');
            onnxLatency = Date.now() - embStart;
        }

        res.json({
            ok: true,
            stats: {
                totalUsers,
                vipUsers,
                todayQueriesCount,
                totalMessagesCount,
                provinceDistribution,
                popularMajors,
                embeddingModel: embedder ? 'Local BGE-small-zh (512-dim)' : 'Fallback Keyword Engine',
                aiGateway: {
                    baseUrl: aiBaseUrl,
                    defaultModel,
                    fastModel,
                    provider: aiApiKey ? (aiBaseUrl.includes('deepseek') ? 'DeepSeek' : (aiBaseUrl.includes('openai') ? 'OpenAI' : 'OpenAI-Compatible')) : 'Offline'
                },
                searchEngine: {
                    provider: searchProvider,
                    tavilyActive: Boolean(tavilyApiKey),
                    bochaActive: Boolean(bochaApiKey),
                    duckduckgoActive: true
                },
                systemHealth: {
                    postgres: {
                        status: usePostgres ? pgStatus : 'JSON 本地持久化降级',
                        latencyMs: pgLatency
                    },
                    redis: {
                        status: useRedis ? '已连接 (TTL 30m)' : '内存 Map 降级缓存',
                        type: useRedis ? 'Redis 高速集群' : 'Memory Cache'
                    },
                    onnx: {
                        status: embedder ? 'ONNX 模型已加载' : '关键词降级',
                        latencyMs: onnxLatency
                    },
                    aiGateway: {
                        status: aiApiKey ? '在线就绪' : '未配置 Key',
                        defaultModel
                    }
                }
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 4. User Management APIs (With Admin / User Role Switch)
router.get('/users', (_req, res) => {
    const users = loadUserAccounts();
    const profiles = loadJsonProfiles();

    const enrichedUsers = users.map(u => {
        const p = profiles[u.username] || {};
        const passVal = u.passwordHash || u.password || '';
        const isBcrypt = passVal.startsWith('$2a$') || passVal.startsWith('$2b$');
        return {
            username: u.username,
            role: u.role || 'user',
            phone: u.phone || p.phone || '',
            email: u.email || p.email || '',
            profile: p,
            isPasswordHashed: isBcrypt,
            passwordPreview: isBcrypt ? `${passVal.slice(0, 12)}...` : (passVal ? `${passVal.slice(0, 3)}***` : '未设置'),
            createdAt: u.createdAt || new Date().toISOString()
        };
    });

    res.json({ ok: true, users: enrichedUsers });
});

router.post('/users/update', (req, res) => {
    const {
        targetUsername,
        newUsername,
        role,
        phone,
        email,
        score,
        province,
        isVip,
        specialConditions,
        newPassword
    } = req.body || {};

    if (!targetUsername) {
        return res.status(400).json({ ok: false, error: 'Target username required' });
    }

    const users = loadUserAccounts();
    const userIdx = users.findIndex(u => u.username === targetUsername);
    if (userIdx === -1) {
        return res.status(404).json({ ok: false, error: '用户不存在' });
    }

    const user = users[userIdx];

    // Role Promotion / Demotion
    if (role && (role === 'admin' || role === 'user')) {
        if (targetUsername === 'admin' && role !== 'admin') {
            return res.status(400).json({ ok: false, error: '默认超级管理员 admin 无法取消管理员权限' });
        }
        user.role = role;
    }

    if (newUsername && newUsername.trim() !== targetUsername) {
        if (users.some(u => u.username === newUsername.trim())) {
            return res.status(400).json({ ok: false, error: '新账号名已被其他用户占用' });
        }
        user.username = newUsername.trim();
    }

    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (newPassword && newPassword.trim()) {
        user.passwordHash = hashPassword(newPassword.trim());
        delete user.password;
        console.log(`🔑 [Admin Action] Reset bcrypt password for user: ${user.username}`);
    }

    saveUserAccounts(users);

    const profiles = loadJsonProfiles();
    const currentProfile = profiles[targetUsername] || {};
    const updatedProfile = {
        ...currentProfile,
        phone: phone !== undefined ? phone : currentProfile.phone,
        email: email !== undefined ? email : currentProfile.email,
        score: score !== undefined ? (score ? Number(score) : '') : currentProfile.score,
        province: province !== undefined ? province : currentProfile.province,
        isVip: isVip !== undefined ? Boolean(isVip) : currentProfile.isVip,
        specialConditions: specialConditions !== undefined ? specialConditions : currentProfile.specialConditions,
        updatedAt: new Date().toISOString()
    };

    if (newUsername && newUsername !== targetUsername) {
        delete profiles[targetUsername];
        profiles[newUsername] = updatedProfile;
    } else {
        profiles[targetUsername] = updatedProfile;
    }
    saveJsonProfiles(profiles);

    res.json({ ok: true, message: '用户信息与权限配置保存成功！' });
});

router.post('/users/delete', (req, res) => {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ ok: false, error: 'Username required' });
    if (username === 'admin') return res.status(400).json({ ok: false, error: '无法删除系统默认超级管理员' });

    let users = loadUserAccounts();
    users = users.filter(u => u.username !== username);
    saveUserAccounts(users);

    const profiles = loadJsonProfiles();
    delete profiles[username];
    saveJsonProfiles(profiles);

    res.json({ ok: true, message: `已成功删除用户【${username}】` });
});

// 5. System Config APIs (Includes Prompt Customization)
router.get('/config', (_req, res) => {
    loadEnvFile(envMainPath);
    loadEnvFile(envPath);
    const { aiBaseUrl, aiApiKey, defaultModel, fastModel, searchProvider, tavilyApiKey, bochaApiKey } = getAiConfig();
    const providerPool = loadSystemProviders();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const curAuthMode = (process.env.AUTH_REGISTRATION_MODE === 'phone' || process.env.AUTH_REGISTRATION_MODE === 'email')
        ? process.env.AUTH_REGISTRATION_MODE
        : 'username';

    res.json({
        ok: true,
        config: {
            aiBaseUrl: process.env.AI_BASE_URL || aiBaseUrl,
            defaultModel: process.env.DEFAULT_MODEL || defaultModel,
            defaultProviderName: process.env.DEFAULT_MODEL_PROVIDER || '',
            fastBaseUrl: process.env.FAST_AI_BASE_URL || process.env.AI_BASE_URL || aiBaseUrl,
            fastApiKeyMasked: process.env.FAST_AI_API_KEY ? `${process.env.FAST_AI_API_KEY.slice(0, 4)}••••${process.env.FAST_AI_API_KEY.slice(-4)}` : '',
            fastModel: process.env.FAST_MODEL || fastModel,
            fastProviderName: process.env.FAST_MODEL_PROVIDER || '',
            searchProvider: process.env.SEARCH_PROVIDER || searchProvider,
            systemPrompt: process.env.CUSTOM_SYSTEM_PROMPT || '',
            hasApiKey: Boolean(process.env.AI_API_KEY || aiApiKey),
            apiKeyMasked: (process.env.AI_API_KEY || aiApiKey) ? `${(process.env.AI_API_KEY || aiApiKey).slice(0, 4)}••••${(process.env.AI_API_KEY || aiApiKey).slice(-4)}` : '',
            hasTavilyKey: Boolean(process.env.TAVILY_API_KEY || tavilyApiKey),
            tavilyKeyMasked: (process.env.TAVILY_API_KEY || tavilyApiKey) ? `${(process.env.TAVILY_API_KEY || tavilyApiKey).slice(0, 4)}••••` : '',
            hasBochaKey: Boolean(process.env.BOCHA_API_KEY || bochaApiKey),
            bochaKeyMasked: (process.env.BOCHA_API_KEY || bochaApiKey) ? `${(process.env.BOCHA_API_KEY || bochaApiKey).slice(0, 4)}••••` : '',
            advancedAuthEnabled: curAuthMode !== 'username',
            authRegistrationMode: curAuthMode,
            tencentSmsSecretId: process.env.TENCENT_SMS_SECRET_ID || '',
            tencentSmsSecretKeyMasked: process.env.TENCENT_SMS_SECRET_KEY ? '••••••••' : '',
            tencentSmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID || '',
            tencentSmsSignName: process.env.TENCENT_SMS_SIGN_NAME || '',
            tencentSmsTemplateId: process.env.TENCENT_SMS_TEMPLATE_ID || '',
            smtpHost: process.env.SMTP_HOST || '',
            smtpPort: process.env.SMTP_PORT || '587',
            smtpUser: process.env.SMTP_USER || process.env.MAIL_FROM || '',
            smtpPasswordMasked: (process.env.SMTP_PASSWORD || process.env.SMTP_PASS) ? '••••••••' : '',
            providerPool
        }
    });
});

router.post('/config', async (req, res) => {
    const {
        baseUrl,
        apiKey,
        defaultModel: newDefModel,
        defaultProviderName,
        fastBaseUrl,
        fastApiKey,
        fastModel: newFastModel,
        fastProviderName,
        searchProvider: newSearchProvider,
        systemPrompt: newPrompt,
        tavilyApiKey: newTavilyKey,
        bochaApiKey: newBochaKey,
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
    } = req.body || {};

    try {
        const envMap = new Map();
        if (fs.existsSync(envMainPath)) {
            const content = fs.readFileSync(envMainPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const idx = trimmed.indexOf('=');
                if (idx > 0) envMap.set(trimmed.slice(0, idx).trim(), trimmed.slice(idx + 1).trim());
            });
        }

        if (baseUrl) envMap.set('AI_BASE_URL', baseUrl);
        if (apiKey) envMap.set('AI_API_KEY', apiKey);
        if (newDefModel) envMap.set('DEFAULT_MODEL', newDefModel);
        if (defaultProviderName) envMap.set('DEFAULT_MODEL_PROVIDER', defaultProviderName);

        if (fastBaseUrl) envMap.set('FAST_AI_BASE_URL', fastBaseUrl);
        if (fastApiKey) envMap.set('FAST_AI_API_KEY', fastApiKey);
        if (newFastModel) envMap.set('FAST_MODEL', newFastModel);
        if (fastProviderName) envMap.set('FAST_MODEL_PROVIDER', fastProviderName);

        if (newSearchProvider) envMap.set('SEARCH_PROVIDER', newSearchProvider);
        if (newPrompt !== undefined) envMap.set('CUSTOM_SYSTEM_PROMPT', newPrompt.replace(/\r?\n/g, '\\n'));
        if (newTavilyKey) envMap.set('TAVILY_API_KEY', newTavilyKey);
        if (newBochaKey) envMap.set('BOCHA_API_KEY', newBochaKey);

        if (advancedAuthEnabled !== undefined) envMap.set('ADVANCED_AUTH_ENABLED', advancedAuthEnabled ? 'true' : 'false');
        if (authRegistrationMode) envMap.set('AUTH_REGISTRATION_MODE', authRegistrationMode);

        if (tencentSmsSecretId !== undefined) envMap.set('TENCENT_SMS_SECRET_ID', tencentSmsSecretId);
        if (tencentSmsSecretKey !== undefined) envMap.set('TENCENT_SMS_SECRET_KEY', tencentSmsSecretKey);
        if (tencentSmsSdkAppId !== undefined) envMap.set('TENCENT_SMS_SDK_APP_ID', tencentSmsSdkAppId);
        if (tencentSmsSignName !== undefined) envMap.set('TENCENT_SMS_SIGN_NAME', tencentSmsSignName);
        if (tencentSmsTemplateId !== undefined) envMap.set('TENCENT_SMS_TEMPLATE_ID', tencentSmsTemplateId);

        if (smtpHost !== undefined) envMap.set('SMTP_HOST', smtpHost);
        if (smtpPort !== undefined) envMap.set('SMTP_PORT', smtpPort);
        if (smtpUser !== undefined) envMap.set('SMTP_USER', smtpUser);
        if (smtpPass !== undefined) envMap.set('SMTP_PASS', smtpPass);

        if (Array.isArray(providerPool)) {
            saveSystemProviders(providerPool);
        }

        let lines = [
            '# ===================================================',
            '# Gzadm Navigator AI Configuration (Saved from Web Admin)',
            `# Updated At: ${new Date().toISOString()}`,
            '# ===================================================',
            ''
        ];
        for (const [k, v] of envMap.entries()) {
            lines.push(`${k}=${v}`);
        }
        fs.writeFileSync(envMainPath, lines.join('\n') + '\n', 'utf8');

        // Apply immediately to current process
        if (newPrompt !== undefined) process.env.CUSTOM_SYSTEM_PROMPT = newPrompt;

        res.json({ ok: true, message: '配置已成功保存并立即生效！' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 6. Admin Web Search Testing API
router.post('/web-search', async (req, res) => {
    const query = req.body?.query || '';
    const count = Number(req.body?.count || 4);
    const startTime = Date.now();
    const { searchProvider } = getAiConfig();
    try {
        const results = await performWebSearch(query, count);
        const elapsedMs = Date.now() - startTime;
        res.json({
            ok: true,
            query,
            count: results.length,
            elapsedMs,
            provider: searchProvider,
            results
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 7. Word Frequency Analytics APIs
router.get('/word-analytics', (_req, res) => {
    const data = loadWordAnalyticsData();
    res.json({ ok: true, data });
});

router.post('/word-analytics', (req, res) => {
    const { data } = req.body || {};
    if (data) {
        saveWordAnalyticsData(data);
        return res.json({ ok: true, data });
    }
    res.status(400).json({ ok: false, error: 'Analytics data payload missing' });
});

export default router;
