import React, { useState, useEffect } from 'react';
import {
    Cloud, Server, Key, RefreshCw, ArrowDownToLine, ArrowUpFromLine,
    CheckCircle2, AlertCircle, ShieldCheck, Zap, Activity, Clock,
    Save, Wifi, WifiOff, Eye, EyeOff, Layers, FileText, Check, Database,
    Users, Compass, Palette, Smile, Mic, UserCheck, MessageSquareText,
    CheckSquare, Square, History, ExternalLink, RotateCcw, ArrowRightLeft,
    CheckCheck, AlertTriangle, ShieldAlert, Download, Upload, Undo2,
    Lock, Sparkles, Trash2, Camera
} from 'lucide-react';
import { API_BASE } from '../../api/config';

interface SyncConfig {
    cloudServerUrl: string;
    syncSecret: string;
    autoSyncOnStartup: boolean;
    selectedDomains?: string[];
    lastSyncedAt: string | null;
    lastSyncStats?: any;
    syncLogs?: Array<{
        id: string;
        action: string;
        details: string;
        success: boolean;
        timestamp: string;
    }>;
}

interface SnapshotItem {
    id: string;
    timestamp: string;
    timeStr: string;
    author: string;
    summary: string;
    updatedDomains?: string[];
}

interface LocalBackupItem {
    id: string;
    timestamp: string;
    timeStr: string;
    reason: string;
    domainStats?: Record<string, any>;
}

interface DomainItem {
    id: string;
    name: string;
    group: 'core' | 'appearance' | 'user';
    groupName: string;
    icon: React.ElementType;
    description: string;
    badge: string;
    color: string;
}

const DOMAINS: DomainItem[] = [
    // Group 1: 核心业务知识
    {
        id: 'rag',
        name: '招生与生活规章知识库',
        group: 'core',
        groupName: '📦 核心业务知识',
        icon: Database,
        description: '投档线、排位、转专业 GPA 规则、800W 限电条例及 512 维向量',
        badge: 'RAG 知识库',
        color: '#8b5cf6'
    },
    {
        id: 'agents',
        name: '智能体矩阵与决策分身人设配置',
        group: 'core',
        groupName: '📦 核心业务知识',
        icon: Users,
        description: 'Dr. Elena 首席顾问、地图向导丽丽与多智能体决策矩阵人设 Prompt',
        badge: 'Agent 矩阵',
        color: '#3b82f6'
    },
    {
        id: 'campusMap',
        name: '校园手绘地图与点位路线',
        group: 'core',
        groupName: '📦 核心业务知识',
        icon: Compass,
        description: '教学楼、宿舍、饭堂、景点的坐标 (x,y)、开放时间与推荐漫游路线',
        badge: '全景地图',
        color: '#10b981'
    },

    // Group 2: 视觉与表现配置
    {
        id: 'bubble',
        name: '气泡 UI 皮肤与工坊预设',
        group: 'appearance',
        groupName: '🎨 视觉与表现配置',
        icon: Palette,
        description: '@ant-design/x、@chatscope、iOS 18 变体及圆角、Accent 光柱参数',
        badge: '气泡工坊',
        color: '#ec4899'
    },
    {
        id: 'memes',
        name: '动图表情包与校园贴纸',
        group: 'appearance',
        groupName: '🎨 视觉与表现配置',
        icon: Smile,
        description: '12 款热门高清动图表情（猫猫炫饭、柴犬点赞等）与广大专属贴纸',
        badge: '表情包库',
        color: '#f59e0b'
    },
    {
        id: 'tts',
        name: 'TTS 神经网络发音人偏好',
        group: 'appearance',
        groupName: '🎨 视觉与表现配置',
        icon: Mic,
        description: 'Edge Neural / ONNX 默认发音人配置、语速 Rate、音调 Pitch 偏好',
        badge: 'TTS 音色',
        color: '#6366f1'
    },

    // Group 3: 考生画像与漫游
    {
        id: 'userProfiles',
        name: '考生高考画像与长效对话记忆',
        group: 'user',
        groupName: '👤 考生档案与漫游',
        icon: UserCheck,
        description: '考生高考总分、排位、意向专业画像与 AI 对话沉淀的学生偏好记忆',
        badge: '考生档案',
        color: '#14b8a6'
    },
    {
        id: 'chatSessions',
        name: '历史多轮问答聊天记录',
        group: 'user',
        groupName: '👤 考生档案与漫游',
        icon: MessageSquareText,
        description: '考生在【志愿填报顾问 (1对1)】与【广大新生大群】下的聊天记录',
        badge: '会话漫游',
        color: '#84cc16'
    }
];

export const CloudSyncTab: React.FC = () => {
    const [config, setConfig] = useState<SyncConfig>({
        cloudServerUrl: 'http://localhost:3800',
        syncSecret: '',
        autoSyncOnStartup: false,
        selectedDomains: ['rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'],
        lastSyncedAt: null,
        syncLogs: []
    });

    const [selectedDomains, setSelectedDomains] = useState<string[]>([
        'rag', 'agents', 'campusMap', 'bubble', 'memes', 'tts', 'userProfiles', 'chatSessions'
    ]);

    // Local vs Cloud Metrics State
    const [localDomainCounts, setLocalDomainCounts] = useState<Record<string, any>>({});
    const [cloudDomainCounts, setCloudDomainCounts] = useState<Record<string, any>>({});
    const [cloudServerStats, setCloudServerStats] = useState<any>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    // Snapshot & Local Backups State
    const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
    const [loadingSnapshots, setLoadingSnapshots] = useState<boolean>(false);
    const [localBackups, setLocalBackups] = useState<LocalBackupItem[]>([]);
    const [loadingBackups, setLoadingBackups] = useState<boolean>(false);

    // Test Connection State
    const [testingConnection, setTestingConnection] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        tested: boolean;
        ok: boolean;
        latencyMs?: number;
        serverData?: any;
        error?: string;
    }>({ tested: false, ok: false });

    // Action Running State
    const [syncingAction, setSyncingAction] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Show/Hide Secret & Show Danger Zone
    const [showSecret, setShowSecret] = useState<boolean>(false);
    const [showDangerZone, setShowDangerZone] = useState<boolean>(false);

    // Fetch local config & status
    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/sync/config`);
            const data = await res.json();
            if (data.ok) {
                setConfig(data.config);
                if (data.config.selectedDomains && Array.isArray(data.config.selectedDomains)) {
                    setSelectedDomains(data.config.selectedDomains);
                }
                if (data.localStats?.domainCounts) {
                    setLocalDomainCounts(data.localStats.domainCounts);
                }
            }
        } catch (err) {
            console.error('Fetch sync config error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Snapshot History
    const fetchSnapshots = async () => {
        setLoadingSnapshots(true);
        try {
            const res = await fetch(`${API_BASE}/api/sync/snapshots`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.snapshots)) {
                setSnapshots(data.snapshots);
            }
        } catch (err) {
            console.error('Fetch snapshots error:', err);
        } finally {
            setLoadingSnapshots(false);
        }
    };

    // Fetch Local Backups List
    const fetchLocalBackups = async () => {
        setLoadingBackups(true);
        try {
            const res = await fetch(`${API_BASE}/api/sync/backups`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.backups)) {
                setLocalBackups(data.backups);
            }
        } catch (err) {
            console.error('Fetch backups error:', err);
        } finally {
            setLoadingBackups(false);
        }
    };

    // Fetch Cloud Server Parameters & Probe
    const probeCloudMetrics = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/sync/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret
                })
            });
            const data = await res.json();
            if (data.ok && data.serverData) {
                setConnectionStatus({
                    tested: true,
                    ok: true,
                    latencyMs: data.latencyMs,
                    serverData: data.serverData
                });
                if (data.serverData.domains) {
                    setCloudDomainCounts(data.serverData.domains);
                }
                if (data.serverData.stats) {
                    setCloudServerStats(data.serverData.stats);
                }
            }
        } catch { }
    };

    useEffect(() => {
        fetchConfig();
        fetchSnapshots();
        fetchLocalBackups();
        probeCloudMetrics();
    }, []);

    // 1. Save Settings
    const handleSaveSettings = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch(`${API_BASE}/api/sync/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret,
                    autoSyncOnStartup: config.autoSyncOnStartup,
                    selectedDomains
                })
            });
            const data = await res.json();
            if (data.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert(data.error || '保存失败');
            }
        } catch (err) {
            console.error('Save sync config error:', err);
            alert('保存配置异常');
        } finally {
            setSaving(false);
        }
    };

    // 2. Test Connection Ping
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setActionMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/sync/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret
                })
            });
            const data = await res.json();
            setConnectionStatus({
                tested: true,
                ok: data.ok,
                latencyMs: data.latencyMs,
                serverData: data.serverData,
                error: data.error
            });
            if (data.ok && data.serverData) {
                if (data.serverData.domains) setCloudDomainCounts(data.serverData.domains);
                if (data.serverData.stats) setCloudServerStats(data.serverData.stats);
                fetchSnapshots();
            }
        } catch (err: any) {
            setConnectionStatus({
                tested: true,
                ok: false,
                error: err.message || '网络连接超时或无法访问该地址'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    // Domain Checkbox Toggles
    const toggleDomain = (id: string) => {
        setSelectedDomains(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        setSelectedDomains(DOMAINS.map(d => d.id));
    };

    const handleSelectCore = () => {
        setSelectedDomains(['rag', 'agents', 'campusMap']);
    };

    const handleClearAll = () => {
        setSelectedDomains([]);
    };

    // 3. Trigger Smart Incremental Push
    const handlePush = async () => {
        if (selectedDomains.length === 0) {
            alert('请至少勾选一个需要同步的数据模块！');
            return;
        }
        setSyncingAction('push');
        setActionMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/sync/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret,
                    domains: selectedDomains
                })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `✅ 增量上传成功！已向云端推送 ${data.pushedCount} 项更新，智能跳过 ${data.skippedCount} 项未变动数据。`
                });
                fetchConfig();
                fetchSnapshots();
                probeCloudMetrics();
            } else {
                setActionMessage({
                    type: 'error',
                    text: `❌ 增量上传失败: ${data.error || '云端服务异常'}`
                });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: `❌ 增量上传异常: ${err.message}` });
        } finally {
            setSyncingAction(null);
        }
    };

    // 4. Trigger Smart Incremental Pull (Non-destructive merge)
    const handlePull = async () => {
        if (selectedDomains.length === 0) {
            alert('请至少勾选一个需要同步的数据模块！');
            return;
        }
        setSyncingAction('pull');
        setActionMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/sync/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret,
                    domains: selectedDomains
                })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `✅ 增量下载完成！已智能合并 ${data.pulledCount} 项云端最新数据（本地独有自建配置完好保留，拉取前已自动生成本地安全快照）。`
                });
                fetchConfig();
                fetchLocalBackups();
                fetchSnapshots();
                probeCloudMetrics();
            } else {
                setActionMessage({
                    type: 'error',
                    text: `❌ 增量下载失败: ${data.error || '云端服务异常'}`
                });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: `❌ 增量下载异常: ${err.message}` });
        } finally {
            setSyncingAction(null);
        }
    };

    // 5. Trigger Smart Bidirectional Union Sync
    const handleFullSync = async () => {
        if (selectedDomains.length === 0) {
            alert('请至少勾选一个需要同步的数据模块！');
            return;
        }
        setSyncingAction('full');
        setActionMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/sync/full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret,
                    domains: selectedDomains
                })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `🎉 双向智能合并完成！两端数据取并集互补 (下载合并: ${data.pull?.pulledCount || 0} 项, 上传同步: ${data.push?.pushedCount || 0} 项)`
                });
                fetchConfig();
                fetchLocalBackups();
                fetchSnapshots();
                probeCloudMetrics();
            } else {
                setActionMessage({
                    type: 'error',
                    text: `❌ 双向同步过程中存在异常，请检查网络或密钥`
                });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: `❌ 双向同步异常: ${err.message}` });
        } finally {
            setSyncingAction(null);
        }
    };

    // 6. Trigger Force Overwrite Cloud (Force Push)
    const handleForcePush = async () => {
        if (selectedDomains.length === 0) {
            alert('请至少勾选一个需要覆盖上传的数据模块！');
            return;
        }
        const domainNames = selectedDomains.map(d => DOMAINS.find(item => item.id === d)?.badge || d).join('、');
        if (!confirm(`⚠️【危险操作警告 · 覆盖上传】\n\n确定要将本地当前【${domainNames}】的数据 100% 强制覆盖至云端基准吗？\n\n云端已有的独有数据将被重置为本地版本！`)) {
            return;
        }

        setSyncingAction('force_push');
        setActionMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/sync/force-push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret,
                    domains: selectedDomains
                })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `🚨 覆盖上传完成！已成功将本地选中领域的数据【强制覆盖】同步为云端最新基准。`
                });
                fetchConfig();
                fetchSnapshots();
                probeCloudMetrics();
            } else {
                setActionMessage({ type: 'error', text: `❌ 覆盖上传失败: ${data.error}` });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: `❌ 覆盖上传异常: ${err.message}` });
        } finally {
            setSyncingAction(null);
        }
    };

    // 7. Trigger Force Overwrite Local (Force Pull)
    const handleForcePull = async () => {
        if (selectedDomains.length === 0) {
            alert('请至少勾选一个需要覆盖下载的数据模块！');
            return;
        }
        const domainNames = selectedDomains.map(d => DOMAINS.find(item => item.id === d)?.badge || d).join('、');
        if (!confirm(`⚠️【危险操作警告 · 覆盖下载】\n\n确定要从云端拉取权威数据并 100% 强制覆盖本地【${domainNames}】吗？\n\n本地未同步的修改将被重置（系统会自动在此前生成一份本地备份快照，可随时撤销还原）。`)) {
            return;
        }

        setSyncingAction('force_pull');
        setActionMessage(null);
        try {
            const res = await fetch(`${API_BASE}/api/sync/force-pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudServerUrl: config.cloudServerUrl,
                    syncSecret: config.syncSecret,
                    domains: selectedDomains
                })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `🚨 覆盖下载完成！本地已完全镜像重置为云端权威数据 (重置 ${data.overwrittenCount} 项，覆盖前已自动生成本地安全快照)。`
                });
                fetchConfig();
                fetchLocalBackups();
                fetchSnapshots();
                probeCloudMetrics();
            } else {
                setActionMessage({ type: 'error', text: `❌ 覆盖下载失败: ${data.error}` });
            }
        } catch (err: any) {
            setActionMessage({ type: 'error', text: `❌ 覆盖下载异常: ${err.message}` });
        } finally {
            setSyncingAction(null);
        }
    };

    // 8. Create Manual Local Backup
    const handleCreateLocalBackup = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/sync/backups/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: '管理员手动备份快照' })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `📸 本地快照备份创建成功！[${data.timeStr}]`
                });
                fetchLocalBackups();
            } else {
                alert('创建备份失败: ' + data.error);
            }
        } catch (err: any) {
            alert('创建备份异常: ' + err.message);
        }
    };

    // 9. Restore Local Backup
    const handleRestoreLocalBackup = async (backup: LocalBackupItem) => {
        if (!confirm(`确定要将本地全部数据恢复至快照 [${backup.timeStr} · ${backup.reason}] 吗？`)) {
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/sync/backups/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backupId: backup.id })
            });
            const data = await res.json();
            if (data.ok) {
                setActionMessage({
                    type: 'success',
                    text: `🎉 成功还原至本地快照 [${backup.timeStr}]！`
                });
                fetchConfig();
                fetchLocalBackups();
            } else {
                alert('还原备份失败: ' + data.error);
            }
        } catch (err: any) {
            alert('还原备份异常: ' + err.message);
        }
    };

    // 10. Rollback Cloud Snapshot
    const handleRollbackCloudSnapshot = async (snapshot: SnapshotItem) => {
        if (!confirm(`确定要将云端中枢恢复至 [${snapshot.timeStr}] 的历史快照吗？`)) {
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/api/sync/snapshot-rollback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ snapshotId: snapshot.id })
            });
            const data = await res.json();
            if (data.ok) {
                alert(`🎉 云端中枢已成功恢复至 [${snapshot.timeStr}] 快照状态！`);
                fetchConfig();
                fetchSnapshots();
                probeCloudMetrics();
            } else {
                alert('恢复失败: ' + data.error);
            }
        } catch (err: any) {
            alert('恢复异常: ' + err.message);
        }
    };

    // Helper to format local count vs cloud count display
    const formatCountDisplay = (domainId: string) => {
        const local = localDomainCounts[domainId];
        const cloudObj = cloudDomainCounts[domainId];
        const cloud = cloudObj?.count !== undefined ? cloudObj.count : (cloudObj?.configured ? '已配置' : undefined);

        const localStr = local === undefined ? '-' : (typeof local === 'boolean' ? (local ? '已配置' : '默认') : `${local}`);
        const cloudStr = cloud === undefined ? '-' : (typeof cloud === 'boolean' ? (cloud ? '已配置' : '默认') : `${cloud}`);

        const isSynced = localStr === cloudStr && localStr !== '-';

        return { localStr, cloudStr, isSynced };
    };

    return (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header Title & Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/80 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-md">
                        <Cloud size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-[#4a4365] tracking-tight">云端数据中枢与多端同步工作台</h2>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center gap-1">
                                <History size={11} /> 智能增量合并与安全快照
                            </span>
                        </div>
                        <p className="text-xs text-[#8a84a4]">支持细粒度智能增量合并、覆盖上传、覆盖下载与本地自动快照一键撤销</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={config.cloudServerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-2xl border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <ExternalLink size={14} />
                        <span>打开云端 Web 后台</span>
                    </a>

                    <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        <span>保存同步配置</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {actionMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top-2 ${
                    actionMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                    {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Local vs Cloud Real-Time Parameter Comparison Banner */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-3">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft size={18} className="text-purple-600" />
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[15px]">本地与云端实时参数状态对照看板</h3>
                            <p className="text-[10.5px] text-[#8a84a4]">实时探活云端微服务，对比本地与云端 8 大领域的实体指标与同步状态</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
                            connectionStatus.ok
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {connectionStatus.ok ? <Wifi size={12} /> : <WifiOff size={12} />}
                            <span>{connectionStatus.ok ? `云端在线 (${connectionStatus.latencyMs}ms)` : '云端离线'}</span>
                        </span>

                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className="px-3.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11.5px] border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <Zap size={12} className={testingConnection ? 'animate-spin' : ''} />
                            <span>探活刷新</span>
                        </button>
                    </div>
                </div>

                {/* Cloud Server Info Summary */}
                {cloudServerStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-purple-50/50 text-xs text-[#4a4365]">
                        <div>
                            <span className="text-[#8a84a4] text-[10px]">云端总推送次数:</span>
                            <div className="font-bold text-purple-700 text-sm">{cloudServerStats.totalPushes || 0} 次</div>
                        </div>
                        <div>
                            <span className="text-[#8a84a4] text-[10px]">云端总拉取次数:</span>
                            <div className="font-bold text-indigo-700 text-sm">{cloudServerStats.totalPulls || 0} 次</div>
                        </div>
                        <div>
                            <span className="text-[#8a84a4] text-[10px]">云端服务架构:</span>
                            <div className="font-bold text-slate-700 text-sm">v2.5.0 (Smart Merge + Force Push/Pull)</div>
                        </div>
                        <div>
                            <span className="text-[#8a84a4] text-[10px]">通信协议鉴权:</span>
                            <div className="font-bold text-emerald-700 text-sm">{config.syncSecret ? '密钥保护' : '开放通信'}</div>
                        </div>
                    </div>
                )}

                {/* 8-Domain Local vs Cloud Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {DOMAINS.map(domain => {
                        const Icon = domain.icon;
                        const { localStr, cloudStr, isSynced } = formatCountDisplay(domain.id);

                        return (
                            <div
                                key={domain.id}
                                className="p-3.5 rounded-2xl bg-[#faf8fd] border border-purple-100 flex flex-col justify-between space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shadow-2xs"
                                            style={{ backgroundColor: domain.color }}
                                        >
                                            <Icon size={14} />
                                        </div>
                                        <span className="font-black text-[#4a4365] text-xs">{domain.badge}</span>
                                    </div>

                                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                        isSynced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {isSynced ? <CheckCheck size={10} /> : <AlertTriangle size={10} />}
                                        <span>{isSynced ? '完全对齐' : '待同步'}</span>
                                    </span>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between text-[#6b6488]">
                                        <span>💻 本地数据:</span>
                                        <span className="font-bold text-[#4a4365]">{localStr}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[#6b6488]">
                                        <span>☁️ 云端参数:</span>
                                        <span className="font-bold text-purple-700">{cloudStr}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Server Settings Card */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <h3 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                        <Server size={17} className="text-purple-600" />
                        <span>云端通信地址与安全密钥配置</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Server URL Input */}
                    <div className="space-y-1.5">
                        <label className="text-[11.5px] font-bold text-[#6b6488] flex items-center gap-1.5">
                            <Server size={13} /> 云端服务通信地址 (URL)
                        </label>
                        <input
                            type="text"
                            value={config.cloudServerUrl}
                            onChange={(e) => setConfig({ ...config, cloudServerUrl: e.target.value })}
                            placeholder="http://localhost:3800 或 公网 IP 地址"
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[13px] text-[#4a4365] font-mono outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <p className="text-[10px] text-[#a494e8]">默认微服务监听在 0.0.0.0:3800，可部署在局域网主机或云服务器</p>
                    </div>

                    {/* Secret Key Input */}
                    <div className="space-y-1.5">
                        <label className="text-[11.5px] font-bold text-[#6b6488] flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><Key size={13} /> 通信安全密钥 (Sync Secret)</span>
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="text-[10.5px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                                {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                                <span>{showSecret ? '隐藏' : '显示'}</span>
                            </button>
                        </label>
                        <input
                            type={showSecret ? 'text' : 'password'}
                            value={config.syncSecret}
                            onChange={(e) => setConfig({ ...config, syncSecret: e.target.value })}
                            placeholder="自动读取 .env 中的 CLOUD_SYNC_SECRET"
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[13px] text-[#4a4365] font-mono outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <p className="text-[10px] text-[#a494e8]">通过 X-Sync-Secret 请求头进行鉴权防篡改</p>
                    </div>
                </div>

                {/* Auto Sync on Startup Switch */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-50">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-purple-600" />
                        <div>
                            <div className="text-[12.5px] font-bold text-[#4a4365]">服务启动时自动无感增量合并权威配置</div>
                            <div className="text-[10px] text-[#8a84a4]">本地 Node 后端启动时静默向云端拉取最新的权威设置并平滑合并</div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.autoSyncOnStartup}
                            onChange={(e) => setConfig({ ...config, autoSyncOnStartup: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>

            {/* 8-Domain Selection Workbench */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-50 pb-3">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                            <Layers size={17} className="text-purple-600" />
                            <span>选择同步的数据模块范围 ({selectedDomains.length} / {DOMAINS.length})</span>
                        </h3>
                        <p className="text-[10.5px] text-[#8a84a4]">勾选需同步的模块进行精准推送与拉取</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                            全选
                        </button>
                        <button
                            type="button"
                            onClick={handleSelectCore}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                            仅核心业务
                        </button>
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                            清空
                        </button>
                    </div>
                </div>

                {/* Grid of Domain Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {DOMAINS.map(domain => {
                        const Icon = domain.icon;
                        const isChecked = selectedDomains.includes(domain.id);
                        const count = localDomainCounts[domain.id];

                        return (
                            <div
                                key={domain.id}
                                onClick={() => toggleDomain(domain.id)}
                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                                    isChecked
                                        ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-200'
                                        : 'bg-[#faf8fd] border-purple-100/70 hover:bg-white hover:border-purple-200 opacity-75'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                                            style={{ backgroundColor: domain.color }}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            isChecked ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {domain.badge}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="text-[13px] font-black text-[#4a4365] flex items-center gap-1.5">
                                            {isChecked ? (
                                                <CheckSquare size={14} className="text-purple-600 shrink-0" />
                                            ) : (
                                                <Square size={14} className="text-gray-400 shrink-0" />
                                            )}
                                            <span className="truncate">{domain.name}</span>
                                        </div>
                                        <p className="text-[10px] text-[#8a84a4] line-clamp-2 mt-1 leading-tight">
                                            {domain.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2.5 mt-2 border-t border-purple-50 flex items-center justify-between text-[10px] text-[#a494e8]">
                                    <span>本地数据:</span>
                                    <span className="font-bold text-[#6b6488]">
                                        {count === undefined
                                            ? '已就绪'
                                            : typeof count === 'boolean'
                                                ? (count ? '已配置' : '默认')
                                                : `${count} 条`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3 Safe Core Operations */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                            <Sparkles size={17} className="text-purple-600" />
                            <span>日常常用操作 · 智能增量同步 (非破坏性合并 · 安全推荐)</span>
                        </h3>
                        <p className="text-[10.5px] text-[#8a84a4]">采用时间戳细粒度比对，绝不抹除本地自建新条目与未上传修改</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Button 1: Incremental Pull */}
                    <button
                        type="button"
                        onClick={handlePull}
                        disabled={Boolean(syncingAction)}
                        className="p-5 rounded-[28px] bg-white hover:bg-purple-50/60 border-2 border-purple-100 hover:border-purple-300 shadow-sm transition-all text-left flex items-start gap-4 cursor-pointer disabled:opacity-50 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {syncingAction === 'pull' ? <RefreshCw size={22} className="animate-spin" /> : <ArrowDownToLine size={22} />}
                        </div>
                        <div>
                            <div className="font-black text-[#4a4365] text-sm flex items-center gap-1.5">
                                <span>⬇️ 增量下载 (智能合并)</span>
                            </div>
                            <div className="text-[11px] text-[#8a84a4] mt-1">
                                从云端拉取较新权威数据合并至本地，本地独有条目完好保留
                            </div>
                        </div>
                    </button>

                    {/* Button 2: Smart Deduplication Push */}
                    <button
                        type="button"
                        onClick={handlePush}
                        disabled={Boolean(syncingAction)}
                        className="p-5 rounded-[28px] bg-white hover:bg-indigo-50/60 border-2 border-indigo-100 hover:border-indigo-300 shadow-sm transition-all text-left flex items-start gap-4 cursor-pointer disabled:opacity-50 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {syncingAction === 'push' ? <RefreshCw size={22} className="animate-spin" /> : <ArrowUpFromLine size={22} />}
                        </div>
                        <div>
                            <div className="font-black text-[#4a4365] text-sm flex items-center gap-1.5">
                                <span>⬆️ 增量上传 (指纹去重)</span>
                            </div>
                            <div className="text-[11px] text-[#8a84a4] mt-1">
                                仅将本地新增或修改的条目推送到云端，自动跳过未修改项
                            </div>
                        </div>
                    </button>

                    {/* Button 3: Full Bidirectional Sync */}
                    <button
                        type="button"
                        onClick={handleFullSync}
                        disabled={Boolean(syncingAction)}
                        className="p-5 rounded-[28px] bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white shadow-md hover:shadow-lg transition-all text-left flex items-start gap-4 cursor-pointer disabled:opacity-50 group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            {syncingAction === 'full' ? <RefreshCw size={22} className="animate-spin" /> : <RefreshCw size={22} />}
                        </div>
                        <div>
                            <div className="font-black text-white text-sm flex items-center gap-1.5">
                                <span>🔄 双向智能互补合并</span>
                            </div>
                            <div className="text-[11px] text-white/80 mt-1">
                                先智能合并云端更新，再将完整并集推送回云端，两端完全一致
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* 🚨 Force Overwrite Actions (Danger Zone) */}
            <div className="bg-amber-50/50 rounded-[32px] p-6 border border-amber-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={18} className="text-amber-700" />
                        <div>
                            <h3 className="font-black text-amber-950 text-[15px]">高级控制区 · 强制覆盖通道 (Force Overwrite)</h3>
                            <p className="text-[10.5px] text-amber-800">用于初始化新设备或以某一端为唯一基准进行 100% 强制覆写（覆盖前系统会自动创建本地安全快照）</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDangerZone(!showDangerZone)}
                        className="text-[11px] px-3 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl font-bold cursor-pointer transition-colors"
                    >
                        {showDangerZone ? '收起通道' : '展开覆盖选项'}
                    </button>
                </div>

                {showDangerZone && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                        {/* Force Push Card */}
                        <div className="bg-white p-5 rounded-2xl border border-rose-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-black text-rose-950 text-sm flex items-center gap-2">
                                    <Upload size={16} className="text-rose-600" />
                                    <span>覆盖上传至云端 (Force Push)</span>
                                </div>
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">以本地为基准</span>
                            </div>
                            <p className="text-[11px] text-[#8a84a4] leading-relaxed">
                                将本地当前选定领域的数据<b> 100% 强制覆盖并重置云端数据库</b>。云端原有的独有数据将被覆盖。
                            </p>
                            <button
                                type="button"
                                onClick={handleForcePush}
                                disabled={Boolean(syncingAction)}
                                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {syncingAction === 'force_push' ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                                <span>强制覆盖上传至云端</span>
                            </button>
                        </div>

                        {/* Force Pull Card */}
                        <div className="bg-white p-5 rounded-2xl border border-rose-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="font-black text-rose-950 text-sm flex items-center gap-2">
                                    <Download size={16} className="text-rose-600" />
                                    <span>覆盖下载至本地 (Force Pull)</span>
                                </div>
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">以云端为基准</span>
                            </div>
                            <p className="text-[11px] text-[#8a84a4] leading-relaxed">
                                从云端拉取权威全量数据并<b> 100% 强制覆盖重置本地存储</b>。系统会自动在执行前产生一份本地备份快照，可随时撤销还原。
                            </p>
                            <button
                                type="button"
                                onClick={handleForcePull}
                                disabled={Boolean(syncingAction)}
                                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {syncingAction === 'force_pull' ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                                <span>强制覆盖下载至本地</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ⏪ Local Safety Backups Management */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                            <Undo2 size={16} className="text-indigo-600" />
                            <span>本地安全快照与一键撤销还原 (Local Safety Backups)</span>
                        </h3>
                        <p className="text-[10.5px] text-[#8a84a4]">每次增量拉取、双向合并或覆盖操作前系统均会自动生成秒级本地快照，防误触有后悔药</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCreateLocalBackup}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <Camera size={12} />
                            <span>手动创建快照</span>
                        </button>
                        <button
                            type="button"
                            onClick={fetchLocalBackups}
                            className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                            <RefreshCw size={12} className={loadingBackups ? 'animate-spin' : ''} />
                            <span>刷新</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {localBackups.length > 0 ? (
                        localBackups.map((b, idx) => (
                            <div
                                key={b.id}
                                className="p-3.5 rounded-2xl bg-[#f8f6fc] border border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="font-black text-[#4a4365] flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[11px]">
                                            {b.timeStr}
                                        </span>
                                        <span className="text-[12px]">{b.reason}</span>
                                        {idx === 0 && (
                                            <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9.5px] font-bold">
                                                最新快照
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[#8a84a4] text-[10.5px] flex items-center gap-3">
                                        <span>知识条目: <b className="text-[#6b6488]">{b.domainStats?.rag || 0} 条</b></span>
                                        <span>智能体矩阵: <b className="text-[#6b6488]">{b.domainStats?.agents || 0} 个</b></span>
                                        <span>地图点位: <b className="text-[#6b6488]">{b.domainStats?.campusMap || 0} 个</b></span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRestoreLocalBackup(b)}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                >
                                    <Undo2 size={12} />
                                    <span>一键还原此快照</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-xs text-[#a494e8]">
                            暂无本地快照记录，执行同步或点击上方“手动创建快照”后将自动记录
                        </div>
                    )}
                </div>
            </div>

            {/* Cloud Snapshot History Timeline */}
            <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
                    <h3 className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                        <History size={16} className="text-purple-600" />
                        <span>云端中枢版本快照时间线 (Cloud Snapshot Timeline)</span>
                    </h3>
                    <button
                        type="button"
                        onClick={fetchSnapshots}
                        className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                        <RefreshCw size={12} className={loadingSnapshots ? 'animate-spin' : ''} />
                        <span>刷新云端快照</span>
                    </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {snapshots.length > 0 ? (
                        snapshots.map((s, idx) => (
                            <div
                                key={s.id}
                                className="p-3.5 rounded-2xl bg-[#f8f6fc] border border-purple-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                                <div className="space-y-0.5">
                                    <div className="font-black text-[#4a4365] flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[11px]">
                                            {s.timeStr}
                                        </span>
                                        <span className="text-[12px]">{s.summary}</span>
                                        {idx === 0 && (
                                            <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9.5px] font-bold">
                                                当前最新
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[#8a84a4] text-[10.5px] flex items-center gap-3">
                                        <span>操作人: <b className="text-[#6b6488]">{s.author}</b></span>
                                        <span>涉及模块: {(s.updatedDomains || []).join('、')}</span>
                                    </div>
                                </div>

                                {idx !== 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRollbackCloudSnapshot(s)}
                                        className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                    >
                                        <RotateCcw size={12} />
                                        <span>恢复云端此节点</span>
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-xs text-[#a494e8]">
                            暂无云端快照记录，推送后将自动按时间展示
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
