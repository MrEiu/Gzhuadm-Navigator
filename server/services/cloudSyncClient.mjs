import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { dataDir } from '../config/env.mjs';
import { getRagStore, saveJsonRag, loadJsonRag, pgPool, usePostgres } from './postgres.mjs';
import { getEmbedding } from './embedding.mjs';
import { loadAgentsConfig, saveAgentsConfig } from '../config/agentsConfig.mjs';
import { loadThoughtClonesConfig, saveThoughtClonesConfig } from '../config/thoughtClonesRegistry.mjs';
import { loadCampusMapData, saveCampusMapData } from '../routes/admin.mjs';
import { loadJsonProfiles, saveJsonProfiles } from './personalRag.mjs';
import { loadJsonSessions } from '../routes/user.mjs';
import { loadTtsConfig, saveTtsConfig } from './ttsService.mjs';

const syncConfigPath = path.join(dataDir, 'cloud_sync_config.json');
const backupsDir = path.join(dataDir, 'backups');

export const ensureBackupsDir = () => {
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }
};

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
    const logs = [newLog, ...(config.syncLogs || [])].slice(0, 60);
    saveSyncConfig({ syncLogs: logs });
    return newLog;
};

// -------------------------------------------------------------
// 3. Local Auto-Backup & Restore System (Safety Guarantee)
// -------------------------------------------------------------

export const createLocalBackup = async (reason = '自动快照备份') => {
    try {
        ensureBackupsDir();
        const now = new Date();
        const timestamp = now.toISOString();
        const id = 'backup_' + now.getTime() + '_' + Math.random().toString(36).slice(2, 6);

        const allDomains = ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'];
        const payload = {};
        const domainStats = {};

        for (const dom of allDomains) {
            const data = await getLocalDomainData(dom);
            payload[dom] = data;
            domainStats[dom] = Array.isArray(data) ? data.length : (typeof data === 'object' && data ? Object.keys(data).length : 1);
        }

        const backupRecord = {
            id,
            timestamp,
            timeStr: now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            reason,
            domainStats,
            payload
        };

        const filePath = path.join(backupsDir, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(backupRecord, null, 2), 'utf8');

        // Prune older backups (> 20)
        try {
            const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('backup_') && f.endsWith('.json'));
            if (files.length > 20) {
                files.sort().slice(0, files.length - 20).forEach(f => {
                    try { fs.unlinkSync(path.join(backupsDir, f)); } catch { }
                });
            }
        } catch { }

        return { ok: true, id, timeStr: backupRecord.timeStr, reason };
    } catch (err) {
        console.error('Failed to create local backup:', err);
        return { ok: false, error: err.message };
    }
};

export const listLocalBackups = () => {
    ensureBackupsDir();
    try {
        const files = fs.readdirSync(backupsDir).filter(f => f.startsWith('backup_') && f.endsWith('.json'));
        const backups = [];
        for (const file of files) {
            try {
                const fullPath = path.join(backupsDir, file);
                const raw = fs.readFileSync(fullPath, 'utf8');
                const parsed = JSON.parse(raw);
                backups.push({
                    id: parsed.id || file.replace('.json', ''),
                    timestamp: parsed.timestamp,
                    timeStr: parsed.timeStr,
                    reason: parsed.reason || '自动备份',
                    domainStats: parsed.domainStats || {}
                });
            } catch { }
        }
        backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return backups;
    } catch (err) {
        return [];
    }
};

export const restoreLocalBackup = async (backupId) => {
    ensureBackupsDir();
    const filePath = path.join(backupsDir, `${backupId}.json`);
    if (!fs.existsSync(filePath)) {
        return { ok: false, error: '指定的本地备份快照不存在或已被清理' };
    }

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        const payload = parsed.payload || {};

        for (const [dom, data] of Object.entries(payload)) {
            if (data !== undefined && data !== null) {
                await saveLocalDomainData(dom, data, true); // Force overwrite from backup
            }
        }

        addSyncLog('⏪ 本地还原', `成功从备份 [${parsed.timeStr} - ${parsed.reason}] 还原了本地数据`, true);
        return { ok: true, message: `成功恢复至备份快照 [${parsed.timeStr}]！`, restoredAt: parsed.timestamp };
    } catch (err) {
        console.error('Failed to restore local backup:', err);
        return { ok: false, error: err.message };
    }
};

// -------------------------------------------------------------
// 4. Local Domain Data Loaders & Smart Savers
// -------------------------------------------------------------

export const getLocalDomainData = async (domain) => {
    switch (domain) {
        case 'rag': {
            const items = await getRagStore();
            return items.map(item => ({ ...item, hash: computeItemHash(item) }));
        }
        case 'agents': {
            const core = loadAgentsConfig() || {};
            const clones = loadThoughtClonesConfig() || {};
            return {
                ...core,
                thoughtClones: clones
            };
        }
        case 'campusMap': {
            const mapData = loadCampusMapData() || { locations: [], routes: [], pinScale: 0.8 };
            const locations = Array.isArray(mapData.locations) ? mapData.locations : (Array.isArray(mapData) ? mapData : []);
            const routes = Array.isArray(mapData.routes) ? mapData.routes : [];
            const pinScale = typeof mapData.pinScale === 'number' ? mapData.pinScale : 0.8;
            return {
                locations: locations.map(p => ({ ...p, hash: computeMapItemHash(p) })),
                routes,
                pinScale
            };
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

export const saveLocalDomainData = async (domain, data, isForceOverwrite = false) => {
    if (!data) return;

    switch (domain) {
        case 'rag': {
            if (Array.isArray(data)) {
                if (isForceOverwrite) {
                    saveJsonRag(data);
                } else {
                    // Smart Incremental Merge:
                    // 1. If both exist, compare updatedAt. Newer wins.
                    // 2. If local exists and cloud doesn't, keep local.
                    // 3. If cloud is new, append it.
                    let local = loadJsonRag() || [];
                    for (const cloudItem of data) {
                        const idx = local.findIndex(k => k.id === cloudItem.id || (cloudItem.hash && k.hash === cloudItem.hash));
                        if (idx >= 0) {
                            const cloudTime = new Date(cloudItem.updatedAt || cloudItem.cloudReceivedAt || 0).getTime();
                            const localTime = new Date(local[idx].updatedAt || local[idx].lastModified || 0).getTime();
                            if (cloudTime >= localTime || !localTime) {
                                local[idx] = { ...local[idx], ...cloudItem };
                            }
                        } else {
                            local.unshift(cloudItem);
                        }
                    }
                    saveJsonRag(local);
                }
            }
            break;
        }

        case 'agents': {
            if (typeof data === 'object' && data) {
                if (isForceOverwrite) {
                    const core = { ...data };
                    delete core.thoughtClones;
                    saveAgentsConfig(core);
                    if (data.thoughtClones && typeof data.thoughtClones === 'object') {
                        saveThoughtClonesConfig(data.thoughtClones);
                    }
                } else {
                    // Smart Merge: Preserve local custom agents & merge clones by roleId
                    const localAgents = loadAgentsConfig() || {};
                    const localClones = loadThoughtClonesConfig() || {};

                    const incomingCore = { ...data };
                    delete incomingCore.thoughtClones;
                    saveAgentsConfig({ ...localAgents, ...incomingCore });

                    const incomingClones = data.thoughtClones || {};
                    const mergedClones = { ...localClones };

                    for (const [roleId, clone] of Object.entries(incomingClones)) {
                        if (mergedClones[roleId]) {
                            const cloudTime = new Date(clone.updatedAt || 0).getTime();
                            const localTime = new Date(mergedClones[roleId].updatedAt || 0).getTime();
                            if (cloudTime >= localTime || !localTime) {
                                mergedClones[roleId] = { ...mergedClones[roleId], ...clone };
                            }
                        } else {
                            mergedClones[roleId] = clone;
                        }
                    }
                    saveThoughtClonesConfig(mergedClones);
                }
            }
            break;
        }

        case 'campusMap': {
            if (isForceOverwrite) {
                saveCampusMapData(data);
            } else {
                // Smart Merge: Preserve local unique landmarks and merge routes by id
                const localMap = loadCampusMapData() || { locations: [], routes: [], pinScale: 0.8 };
                const localLocs = Array.isArray(localMap.locations) ? localMap.locations : (Array.isArray(localMap) ? localMap : []);
                const incomingLocs = Array.isArray(data.locations) ? data.locations : (Array.isArray(data) ? data : []);

                const mergedLocs = [...localLocs];
                for (const inLoc of incomingLocs) {
                    const idx = mergedLocs.findIndex(l => l.id === inLoc.id);
                    if (idx >= 0) {
                        mergedLocs[idx] = { ...mergedLocs[idx], ...inLoc };
                    } else {
                        mergedLocs.push(inLoc);
                    }
                }

                const localRoutes = Array.isArray(localMap.routes) ? localMap.routes : [];
                const incomingRoutes = Array.isArray(data.routes) ? data.routes : [];
                const mergedRoutes = [...localRoutes];
                for (const inRoute of incomingRoutes) {
                    const idx = mergedRoutes.findIndex(r => r.id === inRoute.id);
                    if (idx >= 0) {
                        mergedRoutes[idx] = { ...mergedRoutes[idx], ...inRoute };
                    } else {
                        mergedRoutes.push(inRoute);
                    }
                }

                const pinScale = typeof data.pinScale === 'number' ? data.pinScale : (typeof localMap.pinScale === 'number' ? localMap.pinScale : 0.8);
                saveCampusMapData({ locations: mergedLocs, routes: mergedRoutes, pinScale });
            }
            break;
        }

        case 'bubble': {
            if (typeof data === 'object' && data) {
                const bubblePath = path.join(dataDir, 'bubble_settings.json');
                if (isForceOverwrite) {
                    fs.writeFileSync(bubblePath, JSON.stringify(data, null, 2), 'utf8');
                } else {
                    let localBubble = {};
                    if (fs.existsSync(bubblePath)) {
                        try { localBubble = JSON.parse(fs.readFileSync(bubblePath, 'utf8')); } catch { }
                    }
                    fs.writeFileSync(bubblePath, JSON.stringify({ ...localBubble, ...data }, null, 2), 'utf8');
                }
            }
            break;
        }

        case 'memes': {
            if (Array.isArray(data)) {
                const memePath = path.join(dataDir, 'custom_memes.json');
                if (isForceOverwrite) {
                    fs.writeFileSync(memePath, JSON.stringify(data, null, 2), 'utf8');
                } else {
                    let localMemes = DEFAULT_MEMES;
                    if (fs.existsSync(memePath)) {
                        try {
                            const parsed = JSON.parse(fs.readFileSync(memePath, 'utf8'));
                            if (Array.isArray(parsed)) localMemes = parsed;
                        } catch { }
                    }
                    const mergedMemes = [...localMemes];
                    for (const inMeme of data) {
                        const idx = mergedMemes.findIndex(m => m.id === inMeme.id);
                        if (idx >= 0) mergedMemes[idx] = { ...mergedMemes[idx], ...inMeme };
                        else mergedMemes.push(inMeme);
                    }
                    fs.writeFileSync(memePath, JSON.stringify(mergedMemes, null, 2), 'utf8');
                }
            }
            break;
        }

        case 'tts': {
            if (typeof data === 'object' && data) {
                if (isForceOverwrite) {
                    saveTtsConfig(data);
                } else {
                    const localTts = loadTtsConfig() || {};
                    saveTtsConfig({ ...localTts, ...data });
                }
            }
            break;
        }

        case 'userProfiles': {
            if (typeof data === 'object' && data) {
                if (isForceOverwrite) {
                    saveJsonProfiles(data);
                } else {
                    const localProfiles = loadJsonProfiles() || {};
                    saveJsonProfiles({ ...localProfiles, ...data });
                }
            }
            break;
        }

        case 'chatSessions': {
            if (Array.isArray(data)) {
                const sessPath = path.join(dataDir, 'user_sessions.json');
                if (isForceOverwrite) {
                    fs.writeFileSync(sessPath, JSON.stringify(data, null, 2), 'utf8');
                } else {
                    let localSessions = loadJsonSessions() || [];
                    const merged = [...localSessions];
                    for (const inSess of data) {
                        const idx = merged.findIndex(s => s.id === inSess.id);
                        if (idx >= 0) {
                            const inCount = Array.isArray(inSess.messages) ? inSess.messages.length : 0;
                            const localCount = Array.isArray(merged[idx].messages) ? merged[idx].messages.length : 0;
                            if (inCount >= localCount) merged[idx] = inSess;
                        } else {
                            merged.push(inSess);
                        }
                    }
                    fs.writeFileSync(sessPath, JSON.stringify(merged, null, 2), 'utf8');
                }
            }
            break;
        }
    }
};

// -------------------------------------------------------------
// 5. Test Connection with Cloud Server
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// 6. Multi-Domain Smart Incremental Push
// -------------------------------------------------------------

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

            if (dom === 'rag' || dom === 'memes' || dom === 'chatSessions') {
                hashes[dom] = Array.isArray(data) ? data.map(i => i.hash || computeItemHash(i)) : [];
            } else if (dom === 'campusMap') {
                hashes[dom] = Array.isArray(data?.locations) ? data.locations.map(i => i.hash || computeMapItemHash(i)) : [];
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
            if (dom === 'rag' || dom === 'memes' || dom === 'chatSessions') {
                const missingHashSet = new Set(missing[dom] || []);
                const itemsToPush = (localData[dom] || []).filter(item => missingHashSet.has(item.hash));
                payloadToPush[dom] = itemsToPush;
                totalPushedItems += itemsToPush.length;
                totalSkippedItems += (localData[dom] || []).length - itemsToPush.length;
            } else if (dom === 'campusMap') {
                const missingHashSet = new Set(missing[dom] || []);
                const locsToPush = (localData[dom]?.locations || []).filter(item => missingHashSet.has(item.hash));
                payloadToPush[dom] = {
                    locations: locsToPush,
                    routes: localData[dom]?.routes || [],
                    pinScale: localData[dom]?.pinScale || 0.8
                };
                totalPushedItems += locsToPush.length;
                totalSkippedItems += (localData[dom]?.locations || []).length - locsToPush.length;
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
                    commitMessage: `增量推送: ${activeDomains.join(', ')}`
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

        addSyncLog('⬆️ 增量上传', `成功推送更新 ${totalPushedItems} 项，智能跳过 ${totalSkippedItems} 项已同步数据`, true);

        return {
            ok: true,
            pushedCount: totalPushedItems,
            skippedCount: totalSkippedItems,
            domains: activeDomains,
            cloudResult: pushResult
        };
    } catch (err) {
        addSyncLog('⬆️ 增量上传', `推送异常: ${err.message}`, false);
        return { ok: false, error: err.message };
    }
};

// -------------------------------------------------------------
// 7. Multi-Domain Smart Incremental Pull (Non-Destructive)
// -------------------------------------------------------------

export const pullFromCloud = async (requestedDomains = [], customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    const allDomains = ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'];
    const activeDomains = requestedDomains.length > 0 ? requestedDomains : (config.selectedDomains || allDomains);

    try {
        // Automatic local snapshot before applying any incoming changes
        await createLocalBackup('增量拉取前自动快照');

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

        // Apply pulled data into local domains with smart non-destructive merge
        for (const dom of activeDomains) {
            const data = incomingData[dom];
            if (data !== undefined && data !== null) {
                await saveLocalDomainData(dom, data, false); // Smart Merge mode
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

        addSyncLog('⬇️ 增量下载', `从云端智能合并了 ${totalPulledItems} 项最新权威数据（本地独有配置已完好保留）`, true);

        return {
            ok: true,
            pulledCount: totalPulledItems,
            domains: activeDomains,
            serverData: pullData
        };
    } catch (err) {
        addSyncLog('⬇️ 增量下载', `拉取异常: ${err.message}`, false);
        return { ok: false, error: err.message };
    }
};

// -------------------------------------------------------------
// 8. 🚨 Force Overwrite Cloud (Force Push)
// -------------------------------------------------------------

export const forcePushToCloud = async (requestedDomains = [], customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    const allDomains = ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'];
    const activeDomains = requestedDomains.length > 0 ? requestedDomains : (config.selectedDomains || allDomains);

    try {
        const payload = {};
        const hashes = {};

        for (const dom of activeDomains) {
            const data = await getLocalDomainData(dom);
            payload[dom] = data;
            hashes[dom] = computeObjectHash(data);
        }

        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const res = await fetch(`${targetUrl}/api/sync/force-push`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                payload,
                hashes,
                author: '管理员',
                commitMessage: `覆盖上传: ${activeDomains.join(', ')}`
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) {
            throw new Error(`Cloud force-push failed with HTTP ${res.status}`);
        }

        const result = await res.json();
        const now = new Date().toISOString();
        saveSyncConfig({
            lastSyncedAt: now,
            lastSyncStats: {
                action: 'force_push',
                domains: activeDomains,
                time: now
            }
        });

        addSyncLog('🚨 覆盖上传', `已将本地全部选定领域数据【强制覆盖】同步至云端基准`, true);

        return { ok: true, domains: activeDomains, result };
    } catch (err) {
        addSyncLog('🚨 覆盖上传', `覆盖上传异常: ${err.message}`, false);
        return { ok: false, error: err.message };
    }
};

// -------------------------------------------------------------
// 9. 🚨 Force Overwrite Local (Force Pull)
// -------------------------------------------------------------

export const forcePullFromCloud = async (requestedDomains = [], customUrl, customSecret) => {
    const config = loadSyncConfig();
    const targetUrl = (customUrl || config.cloudServerUrl || 'http://localhost:3800').replace(/\/+$/, '');
    const secret = customSecret !== undefined ? customSecret : config.syncSecret;

    const allDomains = ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'];
    const activeDomains = requestedDomains.length > 0 ? requestedDomains : (config.selectedDomains || allDomains);

    try {
        // Automatically create safety backup before force pull
        await createLocalBackup('覆盖下载前强制备份');

        const headers = { 'Content-Type': 'application/json' };
        if (secret) headers['X-Sync-Secret'] = secret;

        const domainsParam = activeDomains.join(',');
        const pullRes = await fetch(`${targetUrl}/api/sync/pull?since=0&domains=${domainsParam}`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(20000)
        });

        if (!pullRes.ok) {
            throw new Error(`Cloud force-pull failed with HTTP ${pullRes.status}`);
        }

        const pullData = await pullRes.json();
        const incomingData = pullData.data || {};
        let totalOverwrittenItems = 0;

        for (const dom of activeDomains) {
            const data = incomingData[dom];
            if (data !== undefined && data !== null) {
                await saveLocalDomainData(dom, data, true); // Force overwrite mode
                totalOverwrittenItems += Array.isArray(data) ? data.length : 1;
            }
        }

        const now = new Date().toISOString();
        saveSyncConfig({
            lastSyncedAt: now,
            lastSyncStats: {
                action: 'force_pull',
                domains: activeDomains,
                overwritten: totalOverwrittenItems,
                time: now
            }
        });

        addSyncLog('🚨 覆盖下载', `已从云端完整拉取并【强制覆盖重置】本地数据（覆盖前已自动生成本地安全快照）`, true);

        return {
            ok: true,
            overwrittenCount: totalOverwrittenItems,
            domains: activeDomains,
            serverData: pullData
        };
    } catch (err) {
        addSyncLog('🚨 覆盖下载', `覆盖下载异常: ${err.message}`, false);
        return { ok: false, error: err.message };
    }
};

// -------------------------------------------------------------
// 10. True Smart Bidirectional Union Sync
// -------------------------------------------------------------

export const fullBidirectionalSync = async (requestedDomains = [], customUrl, customSecret) => {
    // 1. Auto backup
    await createLocalBackup('双向智能合并前自动快照');

    // 2. Step 1: Pull & Smart Merge from cloud into local (local keeps unique items + resolves timestamp conflicts)
    const pullRes = await pullFromCloud(requestedDomains, customUrl, customSecret);

    // 3. Step 2: Push the complete merged union back to cloud (so cloud also has the complete picture)
    const pushRes = await pushToCloud(requestedDomains, customUrl, customSecret);

    return {
        ok: pullRes.ok && pushRes.ok,
        pull: pullRes,
        push: pushRes,
        timestamp: new Date().toISOString()
    };
};

// -------------------------------------------------------------
// 11. Cloud Snapshots Inspection & Rollback
// -------------------------------------------------------------

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
        if (data.ok) {
            await pullFromCloud();
        }
        return data;
    } catch (err) {
        return { ok: false, error: err.message };
    }
};

// -------------------------------------------------------------
// 12. Auto Sync on Startup Hook
// -------------------------------------------------------------

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
            console.log(`✅ [Cloud Sync Ready] Startup smart sync complete! (Pulled: ${pullRes.pulledCount || 0} items)`);
        }
    } catch (err) {
        console.warn('⚠️ [Cloud Sync] Startup sync error:', err.message);
    }
};
