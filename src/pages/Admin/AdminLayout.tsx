import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Database, User as UserIcon, MessageSquare,
    FlaskConical, Settings, LogOut, ChevronRight, Cpu, Globe,
    RefreshCw, ShieldCheck, Sparkles, Sliders
} from 'lucide-react';
import { User, RagItem, DashboardStats, SettingsConfig, WordAnalyticsDb, DocumentChunk } from '../../types';
import { API_BASE } from '../../api/config';

import { DashboardTab } from './DashboardTab';
import { RagManageTab } from './RagManageTab';
import { UsersTab } from './UsersTab';
import { AnalyticsTab } from './AnalyticsTab';
import { PlaygroundTab } from './PlaygroundTab';
import { SettingsTab } from './SettingsTab';

import { RagItemModal } from '../RagKnowledge/RagItemModal';
import { DocChunkImportModal } from '../RagKnowledge/DocChunkImportModal';
import { PersonalRagModal } from '../UserProfile/PersonalRagModal';
import { AdminEditUserModal } from './AdminEditUserModal';
import { AdminResetPasswordModal } from './AdminResetPasswordModal';
import { UserChatHistoryModal } from './UserChatHistoryModal';

interface AdminLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout }) => {
    const [adminTab, setAdminTab] = useState<'dashboard' | 'rag' | 'users' | 'analytics' | 'playground' | 'settings'>('dashboard');
    const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

    // --- RAG States ---
    const [ragItems, setRagItems] = useState<RagItem[]>([]);
    const [ragSearchQuery, setRagSearchQuery] = useState('');
    const [ragCategoryFilter, setRagCategoryFilter] = useState('ALL');
    const [chunkPreviewMode, setChunkPreviewMode] = useState<'list' | 'table'>('list');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDocumentChunkModalOpen, setIsDocumentChunkModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<RagItem> | null>(null);

    // --- Users & Strategy States ---
    const [registeredUsersList, setRegisteredUsersList] = useState<User[]>([]);
    const [adminUserSearch, setAdminUserSearch] = useState('');
    const [interceptionEnabled, setInterceptionEnabled] = useState(true);
    const [lowScoreThreshold, setLowScoreThreshold] = useState(450);
    const [vipScoreThreshold, setVipScoreThreshold] = useState(580);
    const [adminTargetUser, setAdminTargetUser] = useState<string | null>(null);
    const [isPersonalRagOpen, setIsPersonalRagOpen] = useState(false);
    const [chatHistoryTargetUser, setChatHistoryTargetUser] = useState<string | null>(null);
    const [editingUserModal, setEditingUserModal] = useState<User | null>(null);
    const [passwordResetModal, setPasswordResetModal] = useState<User | null>(null);

    // --- Dashboard States ---
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

    // --- Analytics States ---
    const [adminMessageSearch, setAdminMessageSearch] = useState('');
    const [allUserDialogues, setAllUserDialogues] = useState<any[]>([]);
    const [wordAnalyticsDb, setWordAnalyticsDb] = useState<WordAnalyticsDb>({
        analyzedMessageIds: [],
        wordCounts: {},
        totalAnalyzedCount: 0,
        lastAnalyzedAt: null
    });

    // --- Playground States ---
    const [playgroundTab, setPlaygroundTab] = useState<'rag' | 'web' | 'compare'>('rag');
    const [ragTestQuery, setRagTestQuery] = useState('浙江 计算机 录取分数');
    const [ragTestResults, setRagTestResults] = useState<any[] | null>(null);
    const [isRagTesting, setIsRagTesting] = useState(false);
    const [webTestQuery, setWebTestQuery] = useState('2025 全国高考报考人数');
    const [webTestProvider, setWebTestProvider] = useState('duckduckgo');
    const [webTestResults, setWebTestResults] = useState<any | null>(null);
    const [isWebTesting, setIsWebTesting] = useState(false);

    // --- Settings States ---
    const [settingsConfig, setSettingsConfig] = useState<SettingsConfig>({
        baseUrl: 'https://api.deepseek.com',
        apiKey: '',
        defaultModel: 'deepseek-chat',
        fastModel: 'deepseek-chat',
        searchProvider: 'duckduckgo',
        tavilyApiKey: '',
        bochaApiKey: '',
        advancedAuthEnabled: true,
        authRegistrationMode: 'username',
        systemPrompt: ''
    });
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

    // --- Data Fetchers ---
    const fetchRagKnowledge = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/items`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.items)) {
                setRagItems(data.items);
            }
        } catch (e) {
            console.error('Failed to fetch RAG items', e);
        }
    };

    const fetchDashboardStats = async () => {
        setIsLoadingDashboard(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`);
            const data = await res.json();
            if (data.ok) {
                setDashboardStats(data.stats);
            }
        } catch (e) {
            console.error('Failed to fetch dashboard stats', e);
        } finally {
            setIsLoadingDashboard(false);
        }
    };

    const fetchRegisteredUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/users`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.users)) {
                setRegisteredUsersList(data.users);
            }
        } catch (err) {
            console.error('Failed to fetch registered users list', err);
        }
    };

    const fetchSettingsConfig = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/config`);
            const data = await res.json();
            if (data.ok && data.config) {
                setSettingsConfig((prev: SettingsConfig) => ({
                    ...prev,
                    baseUrl: data.config.aiBaseUrl || prev.baseUrl,
                    defaultModel: data.config.defaultModel || prev.defaultModel,
                    fastModel: data.config.fastModel || prev.fastModel,
                    searchProvider: data.config.searchProvider || prev.searchProvider,
                    systemPrompt: data.config.systemPrompt || '',
                    advancedAuthEnabled: data.config.advancedAuthEnabled !== undefined ? data.config.advancedAuthEnabled : prev.advancedAuthEnabled,
                    authRegistrationMode: data.config.authRegistrationMode || prev.authRegistrationMode,
                    tencentSmsSecretId: data.config.tencentSmsSecretId || '',
                    smtpHost: data.config.smtpHost || '',
                    smtpUser: data.config.smtpUser || ''
                }));
            }
        } catch (e) {
            console.error('Failed to fetch settings config', e);
        }
    };

    const handleFetchModelsList = async () => {
        setIsLoadingModels(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/models`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.models) && data.models.length > 0) {
                setAvailableModels(data.models);
            } else if (data.models) {
                setAvailableModels(data.models);
            }
        } catch (e) {
            console.error('Failed to fetch models list', e);
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        setSettingsSaveMsg(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsConfig)
            });
            const data = await res.json();
            if (data.ok) {
                setSettingsSaveMsg(data.message || '配置已成功保存并立即生效！');
                fetchDashboardStats();
            } else {
                setSettingsSaveMsg(`保存失败: ${data.error}`);
            }
        } catch (e: any) {
            setSettingsSaveMsg(`网络错误: ${e.message}`);
        } finally {
            setIsSavingSettings(false);
            setTimeout(() => setSettingsSaveMsg(null), 4000);
        }
    };

    const fetchAllUserDialogues = async () => {
        try {
            // Aggregate from user accounts sessions
            const res = await fetch(`${API_BASE}/api/admin/users`);
            const uData = await res.json();
            const users = uData.ok && Array.isArray(uData.users) ? uData.users : [{ username: 'admin' }];
            const usernames = Array.from(new Set(['admin', ...users.map((u: any) => u.username)]));

            let aggregatedDialogues: any[] = [];
            for (const uname of usernames) {
                try {
                    const sRes = await fetch(`${API_BASE}/api/user/sessions?username=${encodeURIComponent(uname)}`);
                    const sData = await sRes.json();
                    if (sData.ok && Array.isArray(sData.sessions)) {
                        sData.sessions.forEach((session: any) => {
                            const msgs = session.messages || [];
                            for (let i = 0; i < msgs.length; i++) {
                                if (msgs[i].sender === 'user') {
                                    const question = msgs[i].text;
                                    const botReply = (msgs[i + 1] && msgs[i + 1].sender === 'bot') ? msgs[i + 1].text : '';
                                    aggregatedDialogues.push({
                                        id: `dialogue-${uname}-${session.id}-${i}`,
                                        username: uname,
                                        sessionTitle: session.title || '招生咨询对话',
                                        question,
                                        reply: botReply,
                                        timestamp: msgs[i].createdAt || session.updatedAt || new Date().toISOString()
                                    });
                                }
                            }
                        });
                    }
                } catch { }
            }

            if (aggregatedDialogues.length === 0) {
                aggregatedDialogues = [
                    {
                        id: 'd-sample-1',
                        username: 'student_zhang',
                        sessionTitle: '浙江高考招生咨询',
                        question: '请问今年计算机科学与技术专业在浙江省的预计录取分数线和位次是多少？有宿舍图吗？',
                        reply: '同学您好！根据校方往年录取数据，计算机科学与技术专业在浙江省位次大约在全省 12000-15000 名左右（对应分数为 635-645 分）。枫林星级公寓配备 4 人间上床下桌、独立卫浴与空调！',
                        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
                    }
                ];
            }

            setAllUserDialogues(aggregatedDialogues);
            return aggregatedDialogues;
        } catch (err) {
            console.error('Failed to aggregate user dialogues:', err);
            return [];
        }
    };

    const fetchWordAnalyticsDb = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/word-analytics`);
            const payload = await res.json();
            if (payload.ok && payload.data) {
                setWordAnalyticsDb(payload.data);
                return payload.data;
            }
        } catch { }
        return null;
    };

    const performIncrementalAnalysis = async (currentDbState: WordAnalyticsDb, dialogues: any[]) => {
        if (!dialogues || dialogues.length === 0) return;
        const analyzedIds = new Set(currentDbState.analyzedMessageIds || []);
        const newDialogues = dialogues.filter(d => !analyzedIds.has(d.id));
        if (newDialogues.length === 0) return;

        const commonAdmissionsKeywords = [
            '录取线', '分数线', '专业', '学费', '宿舍', '奖学金', '位次',
            '排名', '选科', '保研', '转专业', '食堂', '图书馆', '计算机',
            '软件工程', '人工智能', '考研', '就业', '环境', '独立卫浴', '单招'
        ];

        const updatedCounts = { ...(currentDbState.wordCounts || {}) };
        const updatedAnalyzedIds = [...(currentDbState.analyzedMessageIds || [])];

        newDialogues.forEach(item => {
            const combinedText = `${item.question} ${item.reply}`;
            commonAdmissionsKeywords.forEach(kw => {
                const reg = new RegExp(kw, 'gi');
                const matches = combinedText.match(reg);
                if (matches) {
                    updatedCounts[kw] = (updatedCounts[kw] || 0) + matches.length;
                }
            });

            const cleanQ = item.question.replace(/[^\u4e00-\u9fa5]/g, ' ');
            const tokens = cleanQ.split(/\s+/).filter(t => t.length >= 2 && t.length <= 4);
            tokens.forEach(t => {
                if (!['请问', '今年', '什么', '怎么', '多少', '可以', '有没有', '怎么样', '怎样', '如果'].includes(t)) {
                    updatedCounts[t] = (updatedCounts[t] || 0) + 1;
                }
            });

            updatedAnalyzedIds.push(item.id);
        });

        const updatedDb: WordAnalyticsDb = {
            analyzedMessageIds: updatedAnalyzedIds,
            wordCounts: updatedCounts,
            totalAnalyzedCount: (currentDbState.totalAnalyzedCount || 0) + newDialogues.length,
            lastAnalyzedAt: new Date().toISOString()
        };

        setWordAnalyticsDb(updatedDb);

        try {
            await fetch(`${API_BASE}/api/admin/word-analytics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: updatedDb })
            });
        } catch { }
    };

    // Load data on Tab Switch
    useEffect(() => {
        if (adminTab === 'dashboard') fetchDashboardStats();
        if (adminTab === 'rag') fetchRagKnowledge();
        if (adminTab === 'users') fetchRegisteredUsers();
        if (adminTab === 'settings') {
            fetchSettingsConfig();
            handleFetchModelsList();
        }
        if (adminTab === 'analytics') {
            (async () => {
                const dbState = await fetchWordAnalyticsDb() || {
                    analyzedMessageIds: [],
                    wordCounts: {},
                    totalAnalyzedCount: 0,
                    lastAnalyzedAt: null
                };
                const dialogues = await fetchAllUserDialogues();
                performIncrementalAnalysis(dbState, dialogues);
            })();
        }
    }, [adminTab]);

    // Global Manual Refresh
    const handleGlobalRefresh = async () => {
        setIsGlobalRefreshing(true);
        try {
            await Promise.all([
                fetchDashboardStats(),
                fetchRagKnowledge(),
                fetchRegisteredUsers(),
                fetchSettingsConfig()
            ]);
        } finally {
            setTimeout(() => setIsGlobalRefreshing(false), 500);
        }
    };

    const highFrequencyWords = useMemo(() => {
        const counts = wordAnalyticsDb.wordCounts || {};
        return Object.entries(counts)
            .map(([word, count]) => ({ word, count: Number(count) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [wordAnalyticsDb]);

    // --- Action Handlers ---
    const handleSaveRagItem = async (itemData: Partial<RagItem>) => {
        try {
            const url = itemData.id ? `${API_BASE}/api/admin/rag/${itemData.id}` : `${API_BASE}/api/admin/rag`;
            const method = itemData.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setEditingItem(null);
                fetchRagKnowledge();
            }
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const handleDeleteKnowledge = async (id: string) => {
        if (!confirm('确定要删除此条知识库切片吗？')) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/items/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.ok) fetchRagKnowledge();
        } catch (e) {
            console.error('Failed to delete RAG item', e);
        }
    };

    const handleBatchSaveChunks = async (chunksToSave: DocumentChunk[]) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunks: chunksToSave })
            });

            const data = await res.json();
            if (data.ok) {
                setIsDocumentChunkModalOpen(false);
                fetchRagKnowledge();
                alert(`🎉 成功保存 ${data.count} 个知识切片并完成本地 512 维向量计算！`);
            }
        } catch (err) {
            console.error('Batch save failed:', err);
        }
    };

    const handleToggleUserVip = async (targetUsername: string) => {
        const u = registeredUsersList.find(x => x.username === targetUsername);
        if (!u) return;
        const currentVip = u.profile?.isVip || false;
        const updatedProfile = { ...(u.profile || {}), isVip: !currentVip };

        try {
            await fetch(`${API_BASE}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: targetUsername, profile: updatedProfile })
            });
            fetchRegisteredUsers();
        } catch (err) {
            console.error('Failed to toggle VIP status', err);
        }
    };

    const handleToggleUserRole = async (targetUser: User) => {
        if (targetUser.username === 'admin') return;
        const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
        const actionLabel = newRole === 'admin' ? '提拔为超级管理员' : '降级为普通考生';
        if (!confirm(`确定将用户 @${targetUser.username} ${actionLabel} 吗？`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUsername: targetUser.username, role: newRole })
            });
            const data = await res.json();
            if (data.ok) {
                fetchRegisteredUsers();
            } else {
                alert(`操作失败: ${data.error}`);
            }
        } catch (e: any) {
            alert(`网络错误: ${e.message}`);
        }
    };

    const handleAdminSaveUserUpdate = async (updatedData: any) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/users/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const data = await res.json();
            if (data.ok) {
                fetchRegisteredUsers();
                setEditingUserModal(null);
                setPasswordResetModal(null);
            } else {
                alert(`修改失败: ${data.error}`);
            }
        } catch (e: any) {
            alert(`网络错误: ${e.message}`);
        }
    };

    const handleDeleteUserAccount = async (username: string) => {
        if (username === 'admin') {
            alert('无法删除系统默认超级管理员');
            return;
        }
        if (!confirm(`确定要彻底删除用户【${username}】及其所有画像数据吗？`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.ok) {
                fetchRegisteredUsers();
            } else {
                alert(`删除失败: ${data.error}`);
            }
        } catch (e: any) {
            alert(`网络错误: ${e.message}`);
        }
    };

    const handleRunRagTest = async () => {
        if (!ragTestQuery.trim()) return;
        setIsRagTesting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: ragTestQuery.trim() })
            });
            const data = await res.json();
            setRagTestResults(data.matches || []);
        } catch (e) {
            console.error('RAG test failed', e);
        } finally {
            setIsRagTesting(false);
        }
    };

    const handleRunWebSearchTest = async () => {
        if (!webTestQuery.trim()) return;
        setIsWebTesting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/web-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: webTestQuery.trim(), count: 4 })
            });
            const data = await res.json();
            setWebTestResults(data);
        } catch (e) {
            console.error('Web search test failed', e);
        } finally {
            setIsWebTesting(false);
        }
    };

    const handleConvertToRag = (dialogue: { question: string; reply: string }) => {
        setEditingItem({
            title: dialogue.question.slice(0, 30),
            category: '常规问答',
            type: 'text',
            content: dialogue.reply,
            tags: dialogue.question.split(/[\s:：,，\-]+/).filter(w => w.length >= 2).slice(0, 4)
        });
        setIsAddModalOpen(true);
    };

    return (
        <div className="w-full h-full sm:max-w-[1360px] sm:max-h-[920px] bg-white/70 backdrop-blur-3xl border border-white/80 flex flex-col sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500">
            {/* Top Global Header Bar */}
            <header className="pt-7 pb-3 px-4 sm:px-8 flex items-center justify-between z-10 bg-white/40 backdrop-blur-md border-b border-white/60 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[16px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.4)] border-2 border-white">
                        <Database className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="font-black text-[#4a4365] text-[15px] sm:text-[17px] tracking-tight">
                            Gzadm Navigator
                        </h1>
                        <p className="text-[9px] sm:text-[10px] text-[#a494e8] font-black uppercase tracking-widest">
                            RAG Admissions Admin Console
                        </p>
                    </div>
                </div>

                {/* Right Status Bar & Actions */}
                <div className="flex items-center gap-2">
                    {/* Active Model Badge */}
                    <div className="hidden md:flex items-center gap-1.5 bg-purple-50/80 px-2.5 py-1.5 rounded-xl border border-purple-100/60 text-[11px] font-bold text-purple-700">
                        <Cpu size={13} />
                        <span>{settingsConfig.defaultModel || 'DeepSeek-V3'}</span>
                    </div>

                    {/* Search Engine Badge */}
                    <div className="hidden lg:flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100/60 text-[11px] font-bold text-blue-700">
                        <Globe size={13} />
                        <span>{settingsConfig.searchProvider || 'DuckDuckGo'}</span>
                    </div>

                    {/* Global Manual Refresh Button */}
                    <button
                        onClick={handleGlobalRefresh}
                        disabled={isGlobalRefreshing}
                        title="全局刷新数据"
                        className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-500 hover:text-purple-700 transition-all border border-purple-50 shadow-2xs cursor-pointer"
                    >
                        <RefreshCw size={15} className={isGlobalRefreshing ? 'animate-spin text-purple-600' : ''} />
                    </button>

                    {/* Admin Profile Info */}
                    <div className="flex items-center gap-1.5 bg-white/80 px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white text-[12px] font-bold text-[#4a4365] shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="max-w-[70px] sm:max-w-[120px] truncate">{currentUser.username}</span>
                        <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700">
                            超级管理员
                        </span>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        title="退出管理后台"
                        className="p-2 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 cursor-pointer"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Admin Body Container */}
            <div className="flex-1 flex overflow-hidden w-full h-full bg-white/40">
                {/* 1. Left Sidebar Navigation */}
                <aside className="w-56 sm:w-60 md:w-64 shrink-0 bg-white/80 backdrop-blur-xl border-r border-white/80 flex flex-col justify-between p-3.5 sm:p-4 z-20 shadow-xs">
                    <div className="space-y-4">
                        {/* Admin Badge Header */}
                        <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-purple-50/70 to-pink-50/70 rounded-2xl border border-purple-100/60 shadow-xs">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b3a4ed] via-[#c7b8f9] to-[#f296b2] flex items-center justify-center text-white shadow-md font-black border-2 border-white">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <div className="font-black text-[#4a4365] text-[13px] leading-tight truncate">超级管理员</div>
                                <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>系统在线 (admin)</span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="space-y-1">
                            {[
                                { id: 'dashboard', label: '数据大盘', icon: LayoutDashboard, desc: '指标监控与概览' },
                                { id: 'rag', label: '知识库管理', icon: Database, desc: 'RAG 向量与切片', badge: ragItems.length },
                                { id: 'users', label: '考生档案库', icon: UserIcon, desc: '画像与 VIP 策略', badge: registeredUsersList.length },
                                { id: 'analytics', label: '消息与词频', icon: MessageSquare, desc: '意向与问答明细' },
                                { id: 'playground', label: '测试中心', icon: FlaskConical, desc: 'RAG 与搜索诊断' },
                                { id: 'settings', label: '系统配置', icon: Settings, desc: '模型网关与提示词' },
                            ].map(tab => {
                                const Icon = tab.icon;
                                const isActive = adminTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setAdminTab(tab.id as any)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${isActive
                                                ? 'bg-[#4a4365] text-white shadow-md font-bold'
                                                : 'text-[#6d648b] hover:bg-white/90 hover:text-[#4a4365] font-semibold'
                                            }`}
                                    >
                                        <Icon size={16} className={isActive ? 'text-[#c7b8f9]' : 'text-[#a494e8]'} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12.5px] leading-none flex items-center justify-between">
                                                <span>{tab.label}</span>
                                                {typeof tab.badge === 'number' && (
                                                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>
                                                        {tab.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-[10px] truncate mt-1 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                                                {tab.desc}
                                            </div>
                                        </div>
                                        {isActive && <ChevronRight size={13} className="text-[#c7b8f9]" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Quick Info */}
                    <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-50/80 text-[10.5px] text-[#6d648b] space-y-1">
                        <div className="font-bold text-[#4a4365]">广州大学招生系统</div>
                        <div className="text-[9.5px] text-gray-400">向量维度: 512 维 · ONNX 本地</div>
                    </div>
                </aside>

                {/* 2. Main Content Tab View Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar">
                    {adminTab === 'dashboard' && (
                        <DashboardTab
                            dashboardStats={dashboardStats}
                            registeredUsersList={registeredUsersList}
                            onNavigateTab={(tab) => setAdminTab(tab)}
                        />
                    )}

                    {adminTab === 'rag' && (
                        <RagManageTab
                            ragItems={ragItems}
                            ragSearchQuery={ragSearchQuery}
                            setRagSearchQuery={setRagSearchQuery}
                            ragCategoryFilter={ragCategoryFilter}
                            setRagCategoryFilter={setRagCategoryFilter}
                            chunkPreviewMode={chunkPreviewMode}
                            setChunkPreviewMode={setChunkPreviewMode}
                            onOpenAddModal={() => {
                                setEditingItem(null);
                                setIsAddModalOpen(true);
                            }}
                            onOpenImportModal={() => setIsDocumentChunkModalOpen(true)}
                            onEditItem={(item) => {
                                setEditingItem(item);
                                setIsAddModalOpen(true);
                            }}
                            onDeleteItem={handleDeleteKnowledge}
                        />
                    )}

                    {adminTab === 'users' && (
                        <UsersTab
                            registeredUsersList={registeredUsersList}
                            adminUserSearch={adminUserSearch}
                            setAdminUserSearch={setAdminUserSearch}
                            interceptionEnabled={interceptionEnabled}
                            setInterceptionEnabled={setInterceptionEnabled}
                            lowScoreThreshold={lowScoreThreshold}
                            setLowScoreThreshold={setLowScoreThreshold}
                            vipScoreThreshold={vipScoreThreshold}
                            setVipScoreThreshold={setVipScoreThreshold}
                            onToggleVip={handleToggleUserVip}
                            onOpenEditUser={(user) => setEditingUserModal(user)}
                            onOpenResetPassword={(user) => setPasswordResetModal(user)}
                            onOpenPersonalRag={(username) => {
                                setAdminTargetUser(username);
                                setIsPersonalRagOpen(true);
                            }}
                            onOpenChatHistory={(username) => setChatHistoryTargetUser(username)}
                            onToggleRole={handleToggleUserRole}
                            onDeleteUser={handleDeleteUserAccount}
                        />
                    )}

                    {adminTab === 'analytics' && (
                        <AnalyticsTab
                            highFrequencyWords={highFrequencyWords}
                            allUserDialogues={allUserDialogues}
                            adminMessageSearch={adminMessageSearch}
                            setAdminMessageSearch={setAdminMessageSearch}
                            onConvertToRag={handleConvertToRag}
                        />
                    )}

                    {adminTab === 'playground' && (
                        <PlaygroundTab
                            playgroundTab={playgroundTab}
                            setPlaygroundTab={setPlaygroundTab}
                            ragTestQuery={ragTestQuery}
                            setRagTestQuery={setRagTestQuery}
                            ragTestResults={ragTestResults}
                            isRagTesting={isRagTesting}
                            onRunRagTest={handleRunRagTest}
                            webTestQuery={webTestQuery}
                            setWebTestQuery={setWebTestQuery}
                            webTestProvider={webTestProvider}
                            setWebTestProvider={setWebTestProvider}
                            webTestResults={webTestResults}
                            isWebTesting={isWebTesting}
                            onRunWebSearchTest={handleRunWebSearchTest}
                        />
                    )}

                    {adminTab === 'settings' && (
                        <SettingsTab
                            settingsConfig={settingsConfig}
                            setSettingsConfig={setSettingsConfig}
                            availableModels={availableModels}
                            isLoadingModels={isLoadingModels}
                            isSavingSettings={isSavingSettings}
                            settingsSaveMsg={settingsSaveMsg}
                            onFetchModelsList={handleFetchModelsList}
                            onSaveSettings={handleSaveSettings}
                        />
                    )}
                </main>
            </div>

            {/* Modals Mounting */}
            {isAddModalOpen && (
                <RagItemModal
                    item={editingItem}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingItem(null);
                    }}
                    onSave={handleSaveRagItem}
                />
            )}

            {isDocumentChunkModalOpen && (
                <DocChunkImportModal
                    onClose={() => setIsDocumentChunkModalOpen(false)}
                    onSaveChunks={handleBatchSaveChunks}
                />
            )}

            {isPersonalRagOpen && adminTargetUser && (
                <PersonalRagModal
                    username={adminTargetUser}
                    onClose={() => {
                        setIsPersonalRagOpen(false);
                        setAdminTargetUser(null);
                    }}
                />
            )}

            {chatHistoryTargetUser && (
                <UserChatHistoryModal
                    username={chatHistoryTargetUser}
                    onClose={() => setChatHistoryTargetUser(null)}
                />
            )}

            {editingUserModal && (
                <AdminEditUserModal
                    user={editingUserModal}
                    onClose={() => setEditingUserModal(null)}
                    onSave={handleAdminSaveUserUpdate}
                />
            )}

            {passwordResetModal && (
                <AdminResetPasswordModal
                    user={passwordResetModal}
                    onClose={() => setPasswordResetModal(null)}
                    onSave={handleAdminSaveUserUpdate}
                />
            )}
        </div>
    );
};
