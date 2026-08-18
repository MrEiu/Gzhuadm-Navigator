import React, { useState, useEffect } from 'react';
import {
    BarChart3, BookOpen, Users, MessageSquare,
    Cpu, Sliders, Shield, LogOut, RefreshCw,
    BrainCircuit, Sparkles, Globe, ChevronRight
} from 'lucide-react';
import { User, DashboardStats } from '../../types';
import { THEME } from '../../constants/theme';
import { API_BASE } from '../../api/config';

import { DashboardTab } from './DashboardTab';
import { RagManageTab } from './RagManageTab';
import { UsersTab } from './UsersTab';
import { AnalyticsTab } from './AnalyticsTab';
import { PlaygroundTab } from './PlaygroundTab';
import { SettingsTab } from './SettingsTab';

interface AdminLayoutProps {
    currentUser: User;
    onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'rag' | 'users' | 'analytics' | 'playground' | 'settings'>('dashboard');
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
            id: 'rag',
            label: '知识库管理',
            subtitle: 'RAG 向量与文档切片',
            icon: BookOpen,
            badge: stats?.totalRagItems !== undefined ? `${stats.totalRagItems}` : null
        },
        {
            id: 'users',
            label: '考生档案库',
            subtitle: '高考画像与 VIP 策略',
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
            label: '系统配置',
            subtitle: '网关模型与提示词',
            icon: Sliders,
            badge: null
        }
    ];

    return (
        <div className={`w-full max-w-7xl h-full flex flex-col md:flex-row ${THEME.glass} rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl relative border-4 border-white`}>

            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white/60 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/80 p-4 md:p-5 flex flex-col justify-between shrink-0">

                {/* Brand & System Logo */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(179,164,237,0.4)] border-2 border-white">
                            <BrainCircuit size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-[#4a4365] text-[15.5px] tracking-tight leading-none">
                                Gzadm Admin
                            </h2>
                            <p className="text-[9.5px] text-[#a494e8] font-black uppercase tracking-wider mt-1">
                                Control Center
                            </p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${isActive
                                        ? 'bg-[#4a4365] text-white shadow-[0_6px_16px_rgba(74,67,101,0.25)] border-[#4a4365]'
                                        : 'hover:bg-white/80 text-[#6d648b] border-transparent hover:border-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-[#a494e8]'}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-[13px] leading-snug">
                                                {item.label}
                                            </div>
                                            <div className={`text-[10px] ${isActive ? 'text-purple-200' : 'text-[#8a84a4]'}`}>
                                                {item.subtitle}
                                            </div>
                                        </div>
                                    </div>

                                    {item.badge && (
                                        <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Bottom: Admin info & Logout */}
                <div className="pt-4 border-t border-purple-100/60 space-y-2 mt-4 md:mt-0">
                    <div className="flex items-center justify-between px-2 text-[12px]">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-[#4a4365]">管理员 @{currentUser.username}</span>
                        </div>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                            在线
                        </span>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-white/70 hover:bg-rose-50 text-gray-500 hover:text-rose-600 border border-gray-100 hover:border-rose-200 text-[12px] font-bold transition-all cursor-pointer"
                    >
                        <LogOut size={14} /> 安全退出登录
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white/30 backdrop-blur-md">

                {/* Global Top Status Bar */}
                <header className="px-6 py-4 border-b border-white/60 bg-white/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">

                    {/* Active Tab Title & Breadcrumb */}
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#4a4365]">
                        <Shield size={16} className="text-[#a494e8]" />
                        <span>管理后台</span>
                        <ChevronRight size={14} className="text-gray-400" />
                        <span className="text-purple-700 font-extrabold">
                            {navItems.find(n => n.id === activeTab)?.label}
                        </span>
                    </div>

                    {/* Dynamic System Status Badges */}
                    <div className="flex items-center gap-2">
                        {/* Default Model Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-xl border border-white text-[11px] font-bold text-[#4a4365] shadow-xs">
                            <Sparkles size={13} className="text-purple-600" />
                            <span>模型:</span>
                            <span className="font-mono text-purple-700">
                                {stats?.aiGateway?.defaultModel || 'deepseek-chat'}
                            </span>
                        </div>

                        {/* Search Engine Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-xl border border-white text-[11px] font-bold text-[#4a4365] shadow-xs">
                            <Globe size={13} className="text-amber-500" />
                            <span>搜索:</span>
                            <span className="font-mono text-amber-700">
                                {stats?.searchEngine?.provider || 'duckduckgo'}
                            </span>
                        </div>

                        {/* Global Manual Refresh Button */}
                        <button
                            onClick={handleGlobalRefresh}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-purple-50 rounded-xl border border-white text-[11px] font-bold text-purple-700 shadow-xs transition-all cursor-pointer"
                            title="重新获取当前页面所有最新服务端数据"
                        >
                            <RefreshCw size={12} className={loadingStats ? 'animate-spin' : ''} />
                            <span>刷新数据</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Main Views */}
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    {activeTab === 'dashboard' && (
                        <DashboardTab
                            stats={stats}
                            loading={loadingStats}
                            onNavigateTab={(tab) => setActiveTab(tab as any)}
                        />
                    )}

                    {activeTab === 'rag' && (
                        <RagManageTab onRefreshStats={fetchStats} />
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
                </div>

            </main>

        </div>
    );
};
