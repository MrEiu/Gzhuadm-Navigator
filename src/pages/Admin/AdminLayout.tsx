import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Database, User as UserIcon, MessageSquare,
    FlaskConical, Settings, LogOut, ChevronRight, Cpu, Globe,
    RefreshCw, ShieldCheck
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

interface AdminLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout }) => {
    const [adminTab, setAdminTab] = useState<'dashboard' | 'rag' | 'users' | 'analytics' | 'playground' | 'settings'>('dashboard');

    // --- RAG States ---
    const [ragItems, setRagItems] = useState<RagItem[]>([]);
    const [ragSearchQuery, setRagSearchQuery] = useState('');
    const [ragCategoryFilter, setRagCategoryFilter] = useState('ALL');
    const [chunkPreviewMode, setChunkPreviewMode] = useState<'list' | 'table'>('list');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDocumentChunkModalOpen, setIsDocumentChunkModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<RagItem> | null>(null);

    // --- Users & VIP States ---
    const [registeredUsersList, setRegisteredUsersList] = useState<User[]>([]);
    const [adminUserSearch, setAdminUserSearch] = useState('');
    const [interceptionEnabled, setInterceptionEnabled] = useState(true);
    const [lowScoreThreshold, setLowScoreThreshold] = useState(450);
    const [vipScoreThreshold, setVipScoreThreshold] = useState(580);
    const [adminTargetUser, setAdminTargetUser] = useState<string | null>(null);
    const [isPersonalRagOpen, setIsPersonalRagOpen] = useState(false);
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
    const [playgroundTab, setPlaygroundTab] = useState<'rag' | 'web'>('rag');
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
        authRegistrationMode: 'email'
    });
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

    // Fetchers
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

    const fetchRegisteredUsers = () => {
        try {
            const rawUsers = localStorage.getItem('aurasense_registered_users');
            const users = rawUsers ? JSON.parse(rawUsers) : [];
            const enriched = users.map((u: any) => {
                let profile = null;
                try {
                    const pRaw = localStorage.getItem(`aurasense_profile_${u.username}`);
                    if (pRaw) profile = JSON.parse(pRaw);
                } catch { }
                return {
                    ...u,
                    profile: profile || {}
                };
            });
            setRegisteredUsersList(enriched);
        } catch (err) {
            console.error('Failed to fetch registered users list', err);
        }
    };

    const handleFetchRegisteredUsersServer = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/users`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.users)) {
                setRegisteredUsersList(data.users);
            } else {
                fetchRegisteredUsers();
            }
        } catch {
            fetchRegisteredUsers();
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

    const fetchWordAnalyticsDb = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/word-analytics`);
            const payload = await res.json();
            if (payload.ok && payload.data) {
                setWordAnalyticsDb(payload.data);
                return payload.data;
            }
        } catch (e) { }

        try {
            const local = localStorage.getItem('aurasense_word_analytics_db');
            if (local) {
                const parsed = JSON.parse(local);
                setWordAnalyticsDb(parsed);
                return parsed;
            }
        } catch (e) { }

        return null;
    };

    const fetchAllUserDialogues = () => {
        try {
            const rawUsers = localStorage.getItem('aurasense_registered_users');
            let usersList = rawUsers ? JSON.parse(rawUsers) : [];
            const usernames = Array.from(new Set(['admin', ...usersList.map((u: any) => u.username)]));

            let aggregatedDialogues: any[] = [];

            usernames.forEach((uname: string) => {
                try {
                    const rawSessions = localStorage.getItem(`aurasense_sessions_${uname}`);
                    const sessions = rawSessions ? JSON.parse(rawSessions) : [];

                    sessions.forEach((session: any) => {
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
                } catch (e) { }
            });

            if (aggregatedDialogues.length === 0) {
                aggregatedDialogues = [
                    {
                        id: 'd-sample-1',
                        username: 'student_zhang',
                        sessionTitle: '浙江高考招生咨询',
                        question: '请问今年计算机科学与技术专业在浙江省的预计录取分数线和位次是多少？有宿舍图吗？',
                        reply: '同学习好！根据往年录取数据，计算机科学与技术专业在浙江省位次大约在全省 12000-15000 名左右（对应分数为 635-645 分）。枫林星级公寓配备 4 人间上床下桌、独立卫浴与空调！',
                        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
                    }
                ];
            }

            setAllUserDialogues(aggregatedDialogues);
            return aggregatedDialogues;
        } catch (err) {
            console.error('Failed to aggregate all user dialogues:', err);
            return [];
        }
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
            localStorage.setItem('aurasense_word_analytics_db', JSON.stringify(updatedDb));
        } catch (e) { }

        try {
            await fetch(`${API_BASE}/api/admin/word-analytics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: updatedDb })
            });
        } catch (e) { }
    };

    useEffect(() => {
        if (adminTab === 'dashboard') fetchDashboardStats();
        if (adminTab === 'rag') fetchRagKnowledge();
        if (adminTab === 'users') handleFetchRegisteredUsersServer();
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
                const dialogues = fetchAllUserDialogues();
                performIncrementalAnalysis(dbState, dialogues);
            })();
        }
    }, [adminTab]);

    const highFrequencyWords = useMemo(() => {
        const counts = wordAnalyticsDb.wordCounts || {};
        return Object.entries(counts)
            .map(([word, count]) => ({ word, count: Number(count) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [wordAnalyticsDb]);

    // Handlers for CRUD and Testing
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

    const handleToggleUserVip = (targetUsername: string) => {
        try {
            const pRaw = localStorage.getItem(`aurasense_profile_${targetUsername}`);
            let profile = pRaw ? JSON.parse(pRaw) : {};
            const newVip = !profile.isVip;
            profile = { ...profile, isVip: newVip };
            localStorage.setItem(`aurasense_profile_${targetUsername}`, JSON.stringify(profile));
            fetch(`${API_BASE}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: targetUsername, profile })
            }).catch(() => { });
            fetchRegisteredUsers();
        } catch (err) {
            console.error('Failed to toggle VIP status', err);
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
                handleFetchRegisteredUsersServer();
                setEditingUserModal(null);
                setPasswordResetModal(null);
            } else {
                alert(`修改失败: ${data.error}`);
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
                body: JSON.stringify({ query: webTestQuery.trim(), provider: webTestProvider })
            });
            const data = await res.json();
            setWebTestResults(data);
        } catch (e) {
            console.error('Web search test failed', e);
        } finally {
            setIsWebTesting(false);
        }
    };

    return (
        <div className="w-full h-full sm:max-w-[1360px] sm:max-h-[920px] bg-white/70 backdrop-blur-3xl border border-white/80 flex flex-col sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500">
            {/* Header */}
            <header className="pt-8 pb-3 px-4 sm:px-8 flex items-center justify-between z-10 bg-white/40 backdrop-blur-md border-b border-white/60 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[16px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.4)] border-2 border-white">
                        <Database className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="font-black text-[#4a4365] text-[15px] sm:text-[17px] tracking-tight">Gzadm Navigator</h1>
                        <p className="text-[9px] sm:text-[10px] text-[#a494e8] font-black uppercase tracking-widest">
                            RAG Admin Console
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 bg-white/80 px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white text-[12px] font-bold text-[#4a4365]">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="max-w-[70px] sm:max-w-[120px] truncate">{currentUser.username}</span>
                        <ShieldCheck size={14} className="sm:hidden text-purple-600" />
                        <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700">
                            超级管理员
                        </span>
                    </div>

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
                {/* 1. Left Fixed Admin Sidebar */}
                <aside className="w-56 sm:w-60 md:w-64 shrink-0 bg-white/80 backdrop-blur-xl border-r border-white/80 flex flex-col justify-between p-3.5 sm:p-4 z-20 shadow-xs">
                    <div className="space-y-4">
                        {/* Admin Profile Header */}
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
                                { id: 'rag', label: '知识库管理', icon: Database, desc: 'RAG 向量与数据', badge: ragItems.length },
                                { id: 'users', label: '考生档案库', icon: UserIcon, desc: '考生画像与 VIP', badge: registeredUsersList.length },
                                { id: 'analytics', label: '消息与词频', icon: MessageSquare, desc: '咨询意向分析' },
                                { id: 'playground', label: '测试中心', icon: FlaskConical, desc: 'RAG 与联网诊断' },
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

                    {/* Bottom: Settings & Logout */}
                    <div className="space-y-1.5 pt-3 border-t border-purple-100/60">
                        <button
                            onClick={() => setAdminTab('settings')}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${adminTab === 'settings'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-bold'
                                    : 'bg-purple-50/70 hover:bg-purple-100/70 text-[#4a4365] font-bold border border-purple-100/60'
                                }`}
                        >
                            <Settings size={16} className={adminTab === 'settings' ? 'text-white' : 'text-[#8b5cf6]'} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[12.5px] leading-none">系统与模型配置</div>
                                <div className={`text-[10px] truncate mt-1 ${adminTab === 'settings' ? 'text-purple-100' : 'text-[#8b5cf6]'}`}>
                                    API Key & 双模型网关
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-[11.5px] font-bold cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span>退出管理后台</span>
                        </button>
                    </div>
                </aside>

                {/* 2. Right Main Content Area */}
                <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-white/40 via-purple-50/15 to-pink-50/15">
                    {/* Top Bar Header */}
                    <div className="px-6 py-3.5 bg-white/70 backdrop-blur-md border-b border-white/80 flex items-center justify-between z-10 shrink-0">
                        <div>
                            <h2 className="text-[15px] sm:text-[16px] font-black text-[#4a4365] flex items-center gap-2">
                                {adminTab === 'dashboard' && <><LayoutDashboard size={18} className="text-purple-500" /> 系统数据大盘 (Dashboard)</>}
                                {adminTab === 'rag' && <><Database size={18} className="text-purple-500" /> 知识库 RAG 集中管理</>}
                                {adminTab === 'users' && <><UserIcon size={18} className="text-purple-500" /> 考生档案与 VIP 策略</>}
                                {adminTab === 'analytics' && <><MessageSquare size={18} className="text-purple-500" /> 咨询意向与高频词分析</>}
                                {adminTab === 'playground' && <><FlaskConical size={18} className="text-purple-500" /> 检索与联网测试中心 (Playground)</>}
                                {adminTab === 'settings' && <><Settings size={18} className="text-purple-500" /> 系统模型与引擎配置 (Settings)</>}
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {adminTab === 'dashboard' && '实时监控 RAG 知识库容量、考生画像、本地向量引擎与服务健康'}
                                {adminTab === 'rag' && '支持录取分数线、专业介绍、宿舍环境实景图文与结构化表格切片'}
                                {adminTab === 'users' && '查看考生高考成绩、全省位次、选科情况与个性化记忆档案'}
                                {adminTab === 'analytics' && '自动聚合考生历史咨询对话，实时提取报考核心高频关注词汇'}
                                {adminTab === 'playground' && '深度诊断 RAG 向量相似度打分与 Tavily/博查/DuckDuckGo 全网实时搜索'}
                                {adminTab === 'settings' && '一键配置大模型 Base URL、API Key、默认/快速模型与搜索引擎'}
                            </p>
                        </div>

                        {/* Status Badges & Refresh */}
                        <div className="flex items-center gap-2">
                            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl text-[11px] font-bold shadow-2xs">
                                <Cpu size={13} className="text-purple-500" />
                                <span>主模型: {dashboardStats?.aiGateway?.defaultModel || 'deepseek-chat'}</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-[11px] font-bold shadow-2xs">
                                <Globe size={13} className="text-blue-500" />
                                <span>搜索: {dashboardStats?.searchEngine?.provider || 'duckduckgo'}</span>
                            </span>
                            <button
                                onClick={() => {
                                    if (adminTab === 'dashboard') fetchDashboardStats();
                                    if (adminTab === 'rag') fetchRagKnowledge();
                                    if (adminTab === 'users') handleFetchRegisteredUsersServer();
                                    if (adminTab === 'settings') { fetchSettingsConfig(); handleFetchModelsList(); }
                                }}
                                className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 hover:text-purple-600 transition-all border border-white shadow-2xs cursor-pointer"
                                title="刷新当前数据"
                            >
                                <RefreshCw size={15} className={isLoadingDashboard || isLoadingModels ? 'animate-spin text-purple-500' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Tab Contents */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 hide-scrollbar">
                        {adminTab === 'dashboard' && (
                            <DashboardTab
                                dashboardStats={dashboardStats}
                                ragItems={ragItems}
                                registeredUsersList={registeredUsersList}
                                onNavigateTab={setAdminTab}
                                onOpenAddModal={() => { setEditingItem(null); setIsAddModalOpen(true); }}
                                onOpenChunkModal={() => setIsDocumentChunkModalOpen(true)}
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
                                onOpenAddModal={() => { setEditingItem(null); setIsAddModalOpen(true); }}
                                onOpenChunkModal={() => setIsDocumentChunkModalOpen(true)}
                                onEditItem={(item) => { setEditingItem(item); setIsAddModalOpen(true); }}
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
                                onToggleUserVip={handleToggleUserVip}
                                onOpenUserPersonalRag={(uname) => {
                                    setAdminTargetUser(uname);
                                    setIsPersonalRagOpen(true);
                                }}
                                onEditUser={(u) => setEditingUserModal(u)}
                                onResetPassword={(u) => setPasswordResetModal(u)}
                            />
                        )}

                        {adminTab === 'analytics' && (
                            <AnalyticsTab
                                wordAnalyticsDb={wordAnalyticsDb}
                                highFrequencyWords={highFrequencyWords}
                                adminMessageSearch={adminMessageSearch}
                                setAdminMessageSearch={setAdminMessageSearch}
                                allUserDialogues={allUserDialogues}
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
                    </div>
                </main>
            </div>

            {/* Admin Modals */}
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

            {isPersonalRagOpen && (
                <PersonalRagModal
                    username={adminTargetUser || currentUser.username}
                    isOpen={isPersonalRagOpen}
                    onClose={() => {
                        setIsPersonalRagOpen(false);
                        setAdminTargetUser(null);
                    }}
                />
            )}

            {isAddModalOpen && (
                <RagItemModal
                    item={editingItem || { title: '', category: '常规问答', type: 'text', content: '', tags: [] }}
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
                    onBatchSave={handleBatchSaveChunks}
                />
            )}
        </div>
    );
};
