import express from 'express';
import {
    loadSyncConfig,
    saveSyncConfig,
    testCloudConnection,
    pushToCloud,
    pullFromCloud,
    fullBidirectionalSync,
    getLocalDomainData,
    fetchCloudSnapshotHistory,
    rollbackToCloudSnapshot
} from '../services/cloudSyncClient.mjs';

const router = express.Router();

// 1. Get Sync Configuration & Multi-Domain Summary
router.get('/config', async (_req, res) => {
    try {
        const config = loadSyncConfig();

        // Calculate real local counts for 8 domains
        const rag = await getLocalDomainData('rag');
        const agents = await getLocalDomainData('agents');
        const campusMap = await getLocalDomainData('campusMap');
        const bubble = await getLocalDomainData('bubble');
        const memes = await getLocalDomainData('memes');
        const tts = await getLocalDomainData('tts');
        const userProfiles = await getLocalDomainData('userProfiles');
        const chatSessions = await getLocalDomainData('chatSessions');

        const localDomainStats = {
            rag: Array.isArray(rag) ? rag.length : 0,
            agents: Object.keys(agents || {}).length,
            campusMap: Array.isArray(campusMap) ? campusMap.length : 0,
            bubble: Boolean(bubble?.themeId),
            memes: Array.isArray(memes) ? memes.length : 0,
            tts: Boolean(tts?.defaultVoice || tts?.engine),
            userProfiles: Object.keys(userProfiles || {}).length,
            chatSessions: Array.isArray(chatSessions) ? chatSessions.length : 0
        };

        res.json({
            ok: true,
            config,
            localStats: {
                totalLocalItems: localDomainStats.rag,
                domainCounts: localDomainStats,
                lastSyncedAt: config.lastSyncedAt,
                lastSyncStats: config.lastSyncStats
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 2. Save Sync Configuration
router.post('/config', (req, res) => {
    try {
        const { cloudServerUrl, syncSecret, autoSyncOnStartup, selectedDomains } = req.body || {};
        const updated = saveSyncConfig({
            cloudServerUrl: cloudServerUrl !== undefined ? cloudServerUrl.trim() : undefined,
            syncSecret: syncSecret !== undefined ? syncSecret.trim() : undefined,
            autoSyncOnStartup: autoSyncOnStartup !== undefined ? Boolean(autoSyncOnStartup) : undefined,
            selectedDomains: Array.isArray(selectedDomains) ? selectedDomains : undefined
        });
        res.json({ ok: true, message: '云端同步配置已成功保存！', config: updated });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 3. Test Cloud Server Connection
router.post('/test', async (req, res) => {
    const { cloudServerUrl, syncSecret } = req.body || {};
    const result = await testCloudConnection(cloudServerUrl, syncSecret);
    res.json(result);
});

// 4. Trigger Smart Push
router.post('/push', async (req, res) => {
    const { cloudServerUrl, syncSecret, domains } = req.body || {};
    const result = await pushToCloud(domains || [], cloudServerUrl, syncSecret);
    res.json(result);
});

// 5. Trigger Incremental Pull
router.post('/pull', async (req, res) => {
    const { cloudServerUrl, syncSecret, domains } = req.body || {};
    const result = await pullFromCloud(domains || [], cloudServerUrl, syncSecret);
    res.json(result);
});

// 6. Trigger Full Bidirectional Sync
router.post('/full', async (req, res) => {
    const { cloudServerUrl, syncSecret, domains } = req.body || {};
    const result = await fullBidirectionalSync(domains || [], cloudServerUrl, syncSecret);
    res.json(result);
});

// 7. Get Cloud Snapshot History Timeline
router.get('/snapshots', async (req, res) => {
    const { cloudServerUrl, syncSecret } = req.query || {};
    const result = await fetchCloudSnapshotHistory(cloudServerUrl, syncSecret);
    res.json(result);
});

// 8. Rollback to Snapshot
router.post('/snapshot-rollback', async (req, res) => {
    const { snapshotId, cloudServerUrl, syncSecret } = req.body || {};
    const result = await rollbackToCloudSnapshot(snapshotId, cloudServerUrl, syncSecret);
    res.json(result);
});

// 9. Get Activity Logs
router.get('/logs', (_req, res) => {
    const config = loadSyncConfig();
    res.json({
        ok: true,
        logs: config.syncLogs || []
    });
});

export default router;
