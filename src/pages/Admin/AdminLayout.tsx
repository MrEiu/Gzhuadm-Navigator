import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
    BarChart3, BookOpen, Users, MessageSquare,
    Cpu, Sliders, Shield, LogOut, RefreshCw,
    BrainCircuit, Sparkles, Globe, ChevronRight,
    GraduationCap, Compass, Bot, Cloud, Zap
} from 'lucide-react';
import { User, DashboardStats } from '../../types';
import { THEME } from '../../constants/theme';
import { API_BASE } from '../../api/config';

const DashboardTab = lazy(() => import('./DashboardTab').then(m => ({ default: m.DashboardTab })));
const RagManageTab = lazy(() => import('./RagManageTab').then(m => ({ default: m.RagManageTab })));
const FaqTemplatesTab = lazy(() => import('./FaqTemplatesTab').then(m => ({ default: m.FaqTemplatesTab })));
const MultiAgentTab = lazy(() => import('./MultiAgentTab').then(m => ({ default: m.MultiAgentTab })));
const UsersTab = lazy(() => import('./UsersTab').then(m => ({ default: m.UsersTab })));
const AnalyticsTab = lazy(() => import('./AnalyticsTab').then(m => ({ default: m.AnalyticsTab })));
const PlaygroundTab = lazy(() => import('./PlaygroundTab').then(m => ({ default: m.PlaygroundTab })));
const SettingsTab = lazy(() => import('./SettingsTab').then(m => ({ default: m.SettingsTab })));
const CampusMapTab = lazy(() => import('./CampusMapTab').then(m => ({ default: m.CampusMapTab })));
const CloudSyncTab = lazy(() => import('./CloudSyncTab').then(m => ({ default: m.CloudSyncTab })));

const TabLoadingFallback: React.FC = () => (
    <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400 text-xs gap-3">
        <div className="w-8 h-8 border-3 border-[#a494e8] border-t-transparent rounded-full animate-spin" />
        <span className="font-bold text-[#7a7398]">正在极速装载控制台模块...</span>
    </div>
);

interface AdminLayoutProps {
    currentUser: User;
    onLogout: () => void;
    onSwitchPortal?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout, onSwitchPortal }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'multiAgent' | 'rag' | 'faqTemplates' | 'sync' | 'campusMap' | 'users' | 'analytics' | 'playground' | 'settings'>('dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`);
            const data = await res.json();
            if (data.ok && data.stats) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [refreshTrigger]);

    const handleGlobalRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Navigation Items
    const navItems = [
        {
            id: 'dashboard',
            label: '数据大盘',
            subtitle: '应用运行与流量监控',
            icon: BarChart3,
            badge: null
        },
        {
            id: 'multiAgent',
            label: '多智能体管理',
            subtitle: '5大角色人设/语音/气泡',
            icon: Bot,
            badge: '5'
        },
        {
            id: 'rag',
            label: '知识库管理',
            subtitle: 'RAG 向量与文档切片',
            icon: BookOpen,
            badge: stats?.totalRagItems !== undefined ? `${stats.totalRagItems}` : null
        },
        {
            id: 'faqTemplates',
            label: '高频问答模板库',
            subtitle: '极速轻量问答与意图匹配',
            icon: Zap,
            badge: '⚡极速'
        },
        {
            id: 'sync',
            label: '云端数据同步',
            subtitle: '独立微服务与智能去重',
            icon: Cloud,
            badge: null
        },
        {
            id: 'campusMap',
            label: '地图导览管理',
            subtitle: '地标标注与路线规划',
            icon: Compass,
            badge: null
        },
        {
            id: 'users',
            label: '考生档案库',
            subtitle: '高考画像与个人档案',
            icon: Users,
            badge: stats?.totalUsers !== undefined ? `${stats.totalUsers}` : null
        },
        {
            id: 'analytics',
            label: '消息与词频',
            subtitle: '咨询热词与问答明细',
            icon: MessageSquare,
            badge: null
        },
        {
            id: 'playground',
            label: '测试中心',
            subtitle: '检索诊断与联网探活',
            icon: Cpu,
            badge: null
        },
        {
            id: 'settings',
            label: '系统与模型',
            subtitle: 'AI 网关、检索与 TTS',
            icon: Sliders,
            badge: null
        }
    ];

    return (
        <div className={`w-full h-full sm:max-w-[1400px] sm:max-h-[920px] ${THEME.glass} flex flex-col md:flex-row sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500`}>

            {/* Left Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white/70 backdrop-blur-2xl border-r border-white/60 flex flex-col justify-between p-4 sm:p-6 shrink-0">

                <div className="space-y-6">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9d8ee0] via-[#c4b5fd] to-[#f9a8d4] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(157,142,224,0.35)] border-2 border-white">
                            <GraduationCap size={22} />
                        </div>
                        <div>
                            <h2 className="font-black text-[#4a4365] text-[16px] tracking-tight leading-none">
                                Gzadm Admin
                            </h2>
                            <p className="text-[10px] text-[#a494e8] font-bold tracking-wider mt-1 uppercase">
                                全景招生控制台
                            </p>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 scrollbar-none">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group text-left ${
                                        isActive
                                            ? 'bg-white shadow-[0_8px_25px_rgba(164,148,232,0.22)] border border-purple-100/80'
                                            : 'hover:bg-white/60 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                                isActive
                                                    ? 'bg-gradient-to-tr from-[#9d8ee0] to-[#c4b5fd] text-white shadow-sm'
                                                    : 'bg-[#f4f0fb] text-[#8a84a4] group-hover:text-purple-600 group-hover:bg-purple-50'
                                            }`}
                                        >
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <div
                                                className={`text-[13px] font-black tracking-tight leading-tight ${
                                                    isActive ? 'text-[#4a4365]' : 'text-[#6b6488] group-hover:text-[#4a4365]'
                                                }`}
                                            >
                                                {item.label}
                                            </div>
                                            <div className="text-[10px] text-[#a494e8] font-medium leading-tight mt-0.5">
                                                {item.subtitle}
                                            </div>
                                        </div>
                                    </div>

                                    {item.badge && (
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                                                isActive
                                                    ? 'bg-purple-100 text-purple-700 font-black'
                                                    : 'bg-purple-50 text-[#a494e8] group-hover:bg-purple-100 group-hover:text-purple-600'
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer User Card & Switch to Student View */}
                <div className="pt-4 border-t border-purple-100/60 space-y-2">
                    {onSwitchPortal && (
                        <button
                            type="button"
                            onClick={onSwitchPortal}
                            className="w-full py-2.5 px-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border border-purple-200/50"
                        >
                            <Globe size={14} />
                            <span>返回考生前台咨询</span>
                        </button>
                    )}

                    <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                                AD
                            </div>
                            <div>
                                <div className="text-xs font-black text-[#4a4365]">管理员</div>
                                <div className="text-[10px] text-[#a494e8]">admin@gzhu.edu</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onLogout}
                            title="退出登录"
                            className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full bg-[#fbf9fe]/70 overflow-hidden">
                {/* Header Bar */}
                <header className="h-16 border-b border-purple-100/60 bg-white/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#a494e8]">控制台</span>
                        <ChevronRight size={14} className="text-gray-300" />
                        <span className="text-xs font-black text-[#4a4365]">
                            {navItems.find(n => n.id === activeTab)?.label || '数据大盘'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleGlobalRefresh}
                            className="p-2 rounded-xl bg-white/80 hover:bg-white text-purple-600 border border-purple-100 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                        >
                            <RefreshCw size={13} className={loadingStats ? 'animate-spin' : ''} />
                            <span>刷新状态</span>
                        </button>
                    </div>
                </header>

                {/* Content Views */}
                <div className="flex-1 overflow-y-auto">
                    <Suspense fallback={<TabLoadingFallback />}>
                        {activeTab === 'dashboard' && (
                            <DashboardTab
                                stats={stats}
                                loading={loadingStats}
                                onNavigateTab={(tab) => setActiveTab(tab as any)}
                            />
                        )}

                        {activeTab === 'multiAgent' && (
                            <MultiAgentTab />
                        )}

                        {activeTab === 'rag' && (
                            <RagManageTab onRefreshStats={fetchStats} />
                        )}

                        {activeTab === 'faqTemplates' && (
                            <FaqTemplatesTab />
                        )}

                        {activeTab === 'sync' && (
                            <CloudSyncTab />
                        )}

                        {activeTab === 'campusMap' && (
                            <CampusMapTab />
                        )}

                        {activeTab === 'users' && (
                            <UsersTab onRefreshStats={fetchStats} />
                        )}

                        {activeTab === 'analytics' && (
                            <AnalyticsTab onRefreshStats={fetchStats} />
                        )}

                        {activeTab === 'playground' && (
                            <PlaygroundTab />
                        )}

                        {activeTab === 'settings' && (
                            <SettingsTab onConfigSaved={fetchStats} />
                        )}
                    </Suspense>
                </div>
            </main>
        </div>
    );
};
