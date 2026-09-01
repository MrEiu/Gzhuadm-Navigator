import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { dataDir } from '../config/env.mjs';
import { getRagStore, saveJsonRag, loadJsonRag, pgPool, usePostgres } from './postgres.mjs';
import { getEmbedding } from './embedding.mjs';
import { loadAgentsConfig, saveAgentsConfig } from '../config/agentsConfig.mjs';
import { loadCampusMapData, saveCampusMapData } from '../routes/admin.mjs';
import { loadJsonProfiles, saveJsonProfiles } from './personalRag.mjs';
import { loadJsonSessions } from '../routes/user.mjs';
import { loadTtsConfig, saveTtsConfig } from './ttsService.mjs';

const syncConfigPath = path.join(dataDir, 'cloud_sync_config.json');

// Helper: Compute SHA-256 for string
export const computeStringHash = (str = '') => {
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 24);
};

// Helper: Compute SHA-256 for objects
export const computeObjectHash = (obj = {}) => {
    try {
        const canonical = JSON.stringify(obj, Object.keys(obj || {}).sort());
        return computeStringHash(canonical);
    } catch {
        return computeStringHash(JSON.stringify(obj || {}));
    }
};

// 1. Content Hash Generators for Array Domains
export const computeItemHash = (item) => {
    if (!item) return '';
    const tableText = item.tableData?.rows ? JSON.stringify(item.tableData.rows) : '';
    const raw = `${(item.title || '').trim()}|${(item.category || '').trim()}|${(item.content || '').trim()}|${item.targetAgent || 'all'}|${tableText}`;
    return computeStringHash(raw);
};

export const computeMapItemHash = (pin) => {
    if (!pin) return '';
    const raw = `${(pin.id || '').trim()}|${(pin.name || '').trim()}|${(pin.category || '').trim()}|${pin.x}|${pin.y}|${(pin.description || '').trim()}`;
    return computeStringHash(raw);
};

export const computeMemeItemHash = (meme) => {
    if (!meme) return '';
    const raw = `${(meme.id || '').trim()}|${(meme.title || '').trim()}|${(meme.url || '').trim()}|${(meme.type || 'gif')}`;
    return computeStringHash(raw);
};

export const computeSessionItemHash = (session) => {
    if (!session) return '';
    const msgCount = Array.isArray(session.messages) ? session.messages.length : 0;
    const raw = `${(session.id || '').trim()}|${(session.username || '').trim()}|${(session.mode || '').trim()}|${msgCount}|${session.updatedAt || ''}`;
    return computeStringHash(raw);
};

// 12 Default Meme Stickers Seed
const DEFAULT_MEMES = [
    { id: 'meme_cat_eat', title: '猫猫炫饭', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif', type: 'gif' },
    { id: 'meme_dog_cheer', title: '柴犬点赞', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', type: 'gif' },
    { id: 'meme_study', title: '疯狂复习', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', type: 'gif' },
    { id: 'meme_toast', title: '干杯庆祝', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', type: 'gif' },
    { id: 'meme_heart', title: '比心点赞', url: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif', type: 'gif' },
    { id: 'meme_cry', title: '嚎啕大哭', url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif', type: 'gif' },
    { id: 'meme_shock', title: '震惊目瞪口呆', url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif', type: 'gif' },
    { id: 'meme_running', title: '赶早八狂奔', url: 'https://media.giphy.com/media/3o7ZetIsjgoYKlVe9y/giphy.gif', type: 'gif' },
    { id: 'meme_nod', title: '频频点头', url: 'https://media.giphy.com/media/10Jpr9KSaXLchW/giphy.gif', type: 'gif' },
    { id: 'meme_confused', title: '满头问号', url: 'https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif', type: 'gif' },
    { id: 'meme_bye', title: '挥手再见', url: 'https://media.giphy.com/media/m9eG1qVjvNsfK/giphy.gif', type: 'gif' },
    { id: 'meme_party', title: '录取庆祝', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', type: 'gif' }
];

// 2. Default Configuration
const getDefaultConfig = () => ({
    cloudServerUrl: process.env.CLOUD_SYNC_URL || 'http://localhost:3800',
    syncSecret: process.env.CLOUD_SYNC_SECRET || 'gzadm_sync_secret_2026',
    autoSyncOnStartup: process.env.AUTO_SYNC_ON_STARTUP === 'true',
    selectedDomains: ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'],
    lastSyncedAt: null,
    lastSyncStats: null,
    syncLogs: []
});

export const loadSyncConfig = () => {
    const defaults = getDefaultConfig();
    if (!fs.existsSync(syncConfigPath)) {
        fs.writeFileSync(syncConfigPath, JSON.stringify(defaults, null, 2), 'utf8');
        return { ...defaults };
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(syncConfigPath, 'utf8'));
        return { ...defaults, ...parsed };
    } catch {
        return { ...defaults };
    }
};

export const saveSyncConfig = (config) => {
    try {
        const current = loadSyncConfig();
        const merged = { ...current, ...config };
        fs.writeFileSync(syncConfigPath, JSON.stringify(merged, null, 2), 'utf8');
        return merged;
    } catch (e) {
        console.error('Failed to save cloud sync config:', e);
        return config;
    }
};

// Activity Log
const addSyncLog = (action, details, success = true) => {
    const config = loadSyncConfig();
    const newLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        action,
        details,
        success,
        timestamp: new Date().toISOString()
    };
    const logs = [newLog, ...(config.syncLogs || [])].slice(0, 50);
    saveSyncConfig({ syncLogs: logs });
    return newLog;
};

// 3. Local Domain Data Loaders & Savers
export const getLocalDomainData = async (domain) => {
    switch (domain) {
        case 'rag': {
            const items = await getRagStore();
            return items.map(item => ({ ...item, hash: computeItemHash(item) }));
        }
        case 'agents': {
            return loadAgentsConfig();
        }
        case 'campusMap': {
            const mapData = loadCampusMapData() || [];
            const list = Array.isArray(mapData) ? mapData : (mapData.locations || []);
            return list.map(p => ({ ...p, hash: computeMapItemHash(p) }));
        }
        case 'bubble': {
            const bubblePath = path.join(dataDir, 'bubble_settings.json');
            if (fs.existsSync(bubblePath)) {
                try { return JSON.parse(fs.readFileSync(bubblePath, 'utf8')); } catch { }
            }
            return { themeId: 'antdesign_filled', borderRadius: 20, accentBarWidth: 0, showTail: false, showActions: true, showThinkingBox: true };
        }
        case 'memes': {
            const memePath = path.join(dataDir, 'custom_memes.json');
            let memes = DEFAULT_MEMES;
            if (fs.existsSync(memePath)) {
                try {
                    const parsed = JSON.parse(fs.readFileSync(memePath, 'utf8'));
                    if (Array.isArray(parsed) && parsed.length > 0) memes = parsed;
                } catch { }
            }
            return memes.map(m => ({ ...m, hash: computeMemeItemHash(m) }));
        }
        case 'tts': {
            return loadTtsConfig();
        }
        case 'userProfiles': {
            return loadJsonProfiles();
        }
        case 'chatSessions': {
            const sessions = loadJsonSessions() || [];
            return (Array.isArray(sessions) ? sessions : []).map(s => ({ ...s, hash: computeSessionItemHash(s) }));
        }
        default:
            return null;
    }
};

export const saveLocalDomainData = async (domain, data) => {
    if (!data) return;
    switch (domain) {
        case 'rag': {
            if (Array.isArray(data)) {
                let local = loadJsonRag();
                for (const item of data) {
                    const idx = local.findIndex(k => k.id === item.id || (item.hash && k.hash === item.hash));
                    if (idx >= 0) local[idx] = { ...local[idx], ...item };
                    else local.unshift(item);
                }
                saveJsonRag(local);
            }
            break;
        }
        case 'agents': {
            if (typeof data === 'object') saveAgentsConfig(data);
            break;
        }
        case 'campusMap': {
            if (Array.isArray(data) || typeof data === 'object') {
                saveCampusMapData(data);
            }
            break;
        }
        case 'bubble': {
            if (typeof data === 'object') {
                const bubblePath = path.join(dataDir, 'bubble_settings.json');
                fs.writeFileSync(bubblePath, JSON.stringify(data, null, 2), 'utf8');
            }
            break;
        }
        case 'memes': {
            if (Array.isArray(data)) {
                const memePath = path.join(dataDir, 'custom_memes.json');
                fs.writeFileSync(memePath, JSON.stringify(data, null, 2), 'utf8');
            }
            break;
        }
        case 'tts': {
            if (typeof data === 'object') {
                saveTtsConfig(data);
            }
            break;
        }
        case 'userProfiles': {
            if (typeof data === 'object') {
                saveJsonProfiles(data);
            }
            break;
        }
        case 'chatSessions': {
            if (Array.isArray(data)) {
                const sessPath = path.join(dataDir, 'user_sessions.json');
                fs.writeFileSync(sessPath, JSON.stringify(data, null, 2), 'utf8');
            }
            break;
        }
    }
};

// 4. Test Connection with Cloud Server
export const testCloudConnection = async (customUrl, customSecret, timeoutMs = 3000) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    const startTime = Date.now();
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const res = await fetch(`${targetUrl}/api/health`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(timeoutMs)
        });

        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Server returned HTTP ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        return {
            ok: true,
            latencyMs,
            targetUrl,
            serverData: data
        };
    } catch (err) {
        return {
            ok: false,
            latencyMs: Date.now() - startTime,
            targetUrl,
            error: err.message || 'Connection failed'
        };
    }
};

// 5. Multi-Domain Smart Deduplication Push
export const pushToCloud = async (requestedDomains = [], customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    const allDomains = ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'];
    const activeDomains = requestedDomains.length > 0 ? requestedDomains : (config.selectedDomains || allDomains);

    try {
        const localData = {};
        const hashes = {};

        // 1. Gather data & compute hashes for all active domains
        for (const dom of activeDomains) {
            const data = await getLocalDomainData(dom);
            localData[dom] = data;

            if (['rag', 'campusMap', 'memes', 'chatSessions'].includes(dom)) {
                hashes[dom] = Array.isArray(data) ? data.map(i => i.hash || computeItemHash(i)) : [];
            } else {
                hashes[dom] = computeObjectHash(data);
            }
        }

        // 2. Batch Hash Check with Cloud
        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const checkRes = await fetch(`${targetUrl}/api/sync/check-hashes`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ domains: activeDomains, hashes }),
            signal: AbortSignal.timeout(10000)
        });

        if (!checkRes.ok) {
            throw new Error(`Cloud check-hashes failed with HTTP ${checkRes.status}`);
        }

        const checkData = await checkRes.json();
        const missing = checkData.missing || {};

        // 3. Assemble only the missing payload
        const payloadToPush = {};
        let totalPushedItems = 0;
        let totalSkippedItems = 0;

        for (const dom of activeDomains) {
            if (['rag', 'campusMap', 'memes', 'chatSessions'].includes(dom)) {
                const missingHashSet = new Set(missing[dom] || []);
                const itemsToPush = (localData[dom] || []).filter(item => missingHashSet.has(item.hash));
                payloadToPush[dom] = itemsToPush;
                totalPushedItems += itemsToPush.length;
                totalSkippedItems += (localData[dom] || []).length - itemsToPush.length;
            } else {
                if (missing[dom] === true) {
                    payloadToPush[dom] = localData[dom];
                    totalPushedItems += 1;
                } else {
                    totalSkippedItems += 1;
                }
            }
        }

        // 4. Send Payload to Cloud
        let pushResult = {};
        if (totalPushedItems > 0) {
            const pushRes = await fetch(`${targetUrl}/api/sync/push`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    payload: payloadToPush,
                    hashes,
                    author: '管理员',
                    commitMessage: `同步更新: ${activeDomains.join(', ')}`
                }),
                signal: AbortSignal.timeout(20000)
            });

            if (!pushRes.ok) {
                throw new Error(`Cloud push failed with HTTP ${pushRes.status}`);
            }
            pushResult = await pushRes.json();
        }

        const now = new Date().toISOString();
        saveSyncConfig({
            lastSyncedAt: now,
            lastSyncStats: {
                action: 'push',
                domains: activeDomains,
                pushed: totalPushedItems,
                skipped: totalSkippedItems,
                time: now
            }
        });

        addSyncLog('⬆️ 云端推送', `成功推送更新 ${totalPushedItems} 项，智能跳过 ${totalSkippedItems} 项已同步数据`, true);

        return {
            ok: true,
            pushedCount: totalPushedItems,
            skippedCount: totalSkippedItems,
            domains: activeDomains,
            cloudResult: pushResult
        };
    } catch (err) {
        addSyncLog('⬆️ 云端推送', `推送异常: ${err.message}`, false);
        return { ok: false, error: err.message };
    }
};

// 6. Multi-Domain Incremental Pull
export const pullFromCloud = async (requestedDomains = [], customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    const allDomains = ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'];
    const activeDomains = requestedDomains.length > 0 ? requestedDomains : (config.selectedDomains || allDomains);

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const since = config.lastSyncedAt ? new Date(config.lastSyncedAt).getTime() : 0;
        const domainsParam = activeDomains.join(',');

        const pullRes = await fetch(`${targetUrl}/api/sync/pull?since=${since}&domains=${domainsParam}`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000)
        });

        if (!pullRes.ok) {
            throw new Error(`Cloud pull failed with HTTP ${pullRes.status}`);
        }

        const pullData = await pullRes.json();
        const incomingData = pullData.data || {};
        let totalPulledItems = 0;

        // Apply pulled data into local domains
        for (const dom of activeDomains) {
            const data = incomingData[dom];
            if (data !== undefined && data !== null) {
                await saveLocalDomainData(dom, data);
                totalPulledItems += Array.isArray(data) ? data.length : 1;
            }
        }

        const now = new Date().toISOString();
        saveSyncConfig({
            lastSyncedAt: now,
            lastSyncStats: {
                action: 'pull',
                domains: activeDomains,
                pulled: totalPulledItems,
                time: now
            }
        });

        addSyncLog('⬇️ 增量拉取', `从云端同步了 ${totalPulledItems} 项最新权威数据`, true);

        return {
            ok: true,
            pulledCount: totalPulledItems,
            domains: activeDomains,
            serverData: pullData
        };
    } catch (err) {
        addSyncLog('⬇️ 增量拉取', `拉取异常: ${err.message}`, false);
        return { ok: false, error: err.message };
    }
};

// 7. Full Bidirectional Sync
export const fullBidirectionalSync = async (requestedDomains = [], customUrl, customSecret) => {
    const pullRes = await pullFromCloud(requestedDomains, customUrl, customSecret);
    const pushRes = await pushToCloud(requestedDomains, customUrl, customSecret);

    return {
        ok: pullRes.ok && pushRes.ok,
        pull: pullRes,
        push: pushRes,
        timestamp: new Date().toISOString()
    };
};

// 8. Fetch Snapshot History from Cloud
export const fetchCloudSnapshotHistory = async (customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const res = await fetch(`${targetUrl}/api/snapshots/history`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        return { ok: false, error: err.message, snapshots: [] };
    }
};

// 9. Rollback to Snapshot
export const rollbackToCloudSnapshot = async (snapshotId, customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const res = await fetch(`${targetUrl}/api/snapshots/rollback`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ snapshotId, author: '管理员' }),
            signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Immediately pull the restored version locally
        if (data.ok) {
            await pullFromCloud();
        }
        return data;
    } catch (err) {
        return { ok: false, error: err.message };
    }
};

// 10. Auto Sync on Startup Hook
export const autoSyncOnStartup = async () => {
    const config = loadSyncConfig();
    if (!config.autoSyncOnStartup) {
        return;
    }

    console.log(`☁️ [Cloud Sync] Probing cloud server at ${config.cloudServerUrl} (600ms timeout)...`);
    try {
        const testRes = await testCloudConnection(undefined, undefined, 600);
        if (!testRes.ok) {
            console.log(`⚠️ [Cloud Sync] Cloud server unreachable (${testRes.error}). Skipping startup sync.`);
            return;
        }

        const pullRes = await pullFromCloud();
        if (pullRes.ok) {
            console.log(`✅ [Cloud Sync Ready] Startup sync complete! (Pulled: ${pullRes.pulledCount || 0} items)`);
        }
    } catch (err) {
        console.warn('⚠️ [Cloud Sync] Startup sync error:', err.message);
    }
};
