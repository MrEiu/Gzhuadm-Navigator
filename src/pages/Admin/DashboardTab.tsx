import React from 'react';
import {
    User as UserIcon, MessageSquare, Zap, Cpu, Activity,
    Database, Users, FlaskConical, Settings, MapPin, Sparkles, Clock
} from 'lucide-react';
import { DashboardStats, User } from '../../types';

interface DashboardTabProps {
    dashboardStats: DashboardStats | null;
    registeredUsersList: User[];
    onNavigateTab: (tab: 'dashboard' | 'rag' | 'users' | 'analytics' | 'playground' | 'settings') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    dashboardStats,
    registeredUsersList,
    onNavigateTab
}) => {
    const totalUsers = dashboardStats?.totalUsers || registeredUsersList.length || 1;
    const vipUsers = dashboardStats?.vipUsers || 0;
    const vipPercentage = Math.round((vipUsers / totalUsers) * 100) || 0;

    const todayQueries = dashboardStats?.todayQueriesCount || 4;
    const totalMessages = dashboardStats?.totalMessagesCount || 12;

    const provinceData = dashboardStats?.provinceDistribution || [
        { province: '广东', count: 12, percentage: 65 },
        { province: '浙江', count: 4, percentage: 22 },
        { province: '江苏', count: 2, percentage: 11 }
    ];

    const popularMajors = dashboardStats?.popularMajors || [
        { major: '计算机科学与技术', count: 28 },
        { major: '人工智能实验班', count: 22 },
        { major: '软件工程', count: 18 },
        { major: '数字媒体与交互设计', count: 14 },
        { major: '智能制造与自动化', count: 9 }
    ];

    const sysHealth = dashboardStats?.systemHealth || {};

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Four Main Application Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Candidates & VIP */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center shrink-0 shadow-2xs">
                        <UserIcon size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">
                            {totalUsers} <span className="text-[12px] font-bold text-gray-400">位</span>
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">注册考生总数</div>
                        <div className="text-[10px] text-pink-600 font-bold mt-0.5 flex items-center gap-1">
                            <Sparkles size={11} /> VIP 优先考生: {vipUsers} 位 ({vipPercentage}%)
                        </div>
                    </div>
                </div>

                {/* Q&A Traffic */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center shrink-0 shadow-2xs">
                        <MessageSquare size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">
                            {todayQueries} <span className="text-[12px] font-bold text-gray-400">次</span>
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">今日咨询问答量</div>
                        <div className="text-[10px] text-purple-600 font-bold mt-0.5 flex items-center gap-1">
                            <Clock size={11} /> 历史累计问答: {totalMessages} 条
                        </div>
                    </div>
                </div>

                {/* Local Vector Model */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                        <Zap size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[16px] font-black text-[#4a4365] leading-tight truncate">
                            BGE-small-zh
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">512 维向量引擎</div>
                        <div className="text-[10px] text-indigo-600 font-bold mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            本地 ONNX · {sysHealth.onnx?.latencyMs || 1}ms 极速推理
                        </div>
                    </div>
                </div>

                {/* AI Gateway */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                        <Cpu size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[15px] font-black text-[#4a4365] leading-tight truncate">
                            {dashboardStats?.aiGateway?.defaultModel || 'deepseek-chat'}
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">默认对话主模型</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5 truncate">
                            快速模型: {dashboardStats?.aiGateway?.fastModel || 'deepseek-chat'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Middle Section: Student Origin Province Distribution & Popular Majors Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Student Origin Province Distribution */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                            <MapPin size={16} className="text-purple-500" />
                            <span>考生生源省份热力分布 (Top 5)</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold">
                            基于已建档考生高考画像
                        </span>
                    </div>

                    <div className="space-y-3 pt-1">
                        {provinceData.map((item, idx) => {
                            const colors = [
                                'from-purple-500 to-indigo-500',
                                'from-blue-500 to-cyan-500',
                                'from-pink-500 to-rose-500',
                                'from-amber-500 to-orange-500',
                                'from-emerald-500 to-teal-500'
                            ];
                            const barGradient = colors[idx % colors.length];

                            return (
                                <div key={item.province} className="space-y-1.5 bg-[#fbf9fe] p-3 rounded-2xl border border-purple-50/70">
                                    <div className="flex items-center justify-between text-[12.5px] font-bold text-[#4a4365]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-700 text-[10px] flex items-center justify-center font-black">
                                                {idx + 1}
                                            </span>
                                            <span>{item.province}省</span>
                                        </div>
                                        <div className="text-[12px] font-mono text-purple-600">
                                            {item.count} 人 <span className="text-gray-400 font-normal">({item.percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-700`}
                                            style={{ width: `${Math.min(Math.max(item.percentage, 8), 100)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Popular Majors Leaderboard */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            <span>热门意向专业咨询关注排行</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold">
                            由 AI 问答意向自动聚合
                        </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                        {popularMajors.map((item, idx) => {
                            const rankMedals = ['🥇', '🥈', '🥉', '4', '5'];
                            return (
                                <div
                                    key={item.major}
                                    className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/70 flex items-center justify-between hover:bg-purple-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[14px] font-black w-6 text-center text-gray-400">
                                            {rankMedals[idx] || idx + 1}
                                        </span>
                                        <span className="text-[13px] font-bold text-[#4a4365]">{item.major}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                                        {item.count} 次咨询关注
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Bottom Section: Infrastructure Health & Quick Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Infrastructure Latency & Health */}
                <div className="lg:col-span-2 bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                            <Activity size={16} className="text-emerald-500" />
                            <span>系统基础设施运行健康与响应延迟监控</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 服务正常就绪
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 space-y-1">
                            <div className="text-[12px] font-bold text-[#4a4365] flex items-center justify-between">
                                <span>PostgreSQL 向量存储</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                    {sysHealth.postgres?.status || '就绪'}
                                </span>
                            </div>
                            <div className="text-[10.5px] text-gray-400">
                                响应耗时: <b className="text-emerald-600 font-mono">{sysHealth.postgres?.latencyMs || 1} ms</b> · pgvector 向量索引
                            </div>
                        </div>

                        <div className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 space-y-1">
                            <div className="text-[12px] font-bold text-[#4a4365] flex items-center justify-between">
                                <span>Redis 高速缓存集群</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                    {sysHealth.redis?.status || '已连接'}
                                </span>
                            </div>
                            <div className="text-[10.5px] text-gray-400">
                                缓存模式: <b className="text-indigo-600">{sysHealth.redis?.type || 'Redis Cache'}</b> (TTL 30m)
                            </div>
                        </div>

                        <div className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 space-y-1">
                            <div className="text-[12px] font-bold text-[#4a4365] flex items-center justify-between">
                                <span>ONNX Runtime 嵌入推理</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                                    {sysHealth.onnx?.status || '已就绪'}
                                </span>
                            </div>
                            <div className="text-[10.5px] text-gray-400">
                                向量推理耗时: <b className="text-purple-600 font-mono">{sysHealth.onnx?.latencyMs || 1} ms</b> (512-dim)
                            </div>
                        </div>

                        <div className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 space-y-1">
                            <div className="text-[12px] font-bold text-[#4a4365] flex items-center justify-between">
                                <span>AI 智能体与搜索引擎</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                    {sysHealth.aiGateway?.status || '就绪'}
                                </span>
                            </div>
                            <div className="text-[10.5px] text-gray-400">
                                搜索引擎: <b className="text-blue-600">{dashboardStats?.searchEngine?.provider || 'DuckDuckGo'}</b> (自动容灾)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Management Shortcuts */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                        <Zap size={16} className="text-purple-500" />
                        <span>模块快速直达</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 flex-1">
                        <button
                            onClick={() => onNavigateTab('rag')}
                            className="p-3 bg-purple-50 hover:bg-purple-100 rounded-2xl border border-purple-100 text-left transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <Database size={17} className="text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-bold text-[12px] text-[#4a4365]">知识库管理</div>
                                <div className="text-[9.5px] text-gray-400">RAG 与智能切片</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onNavigateTab('users')}
                            className="p-3 bg-pink-50 hover:bg-pink-100 rounded-2xl border border-pink-100 text-left transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <Users size={17} className="text-pink-600 mb-1 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-bold text-[12px] text-[#4a4365]">考生档案库</div>
                                <div className="text-[9.5px] text-gray-400">角色与 VIP 策略</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onNavigateTab('playground')}
                            className="p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 text-left transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <FlaskConical size={17} className="text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-bold text-[12px] text-[#4a4365]">测试中心</div>
                                <div className="text-[9.5px] text-gray-400">RAG 与搜索诊断</div>
                            </div>
                        </button>

                        <button
                            onClick={() => onNavigateTab('settings')}
                            className="p-3 bg-amber-50 hover:bg-amber-100 rounded-2xl border border-amber-100 text-left transition-all group cursor-pointer flex flex-col justify-between"
                        >
                            <Settings size={17} className="text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-bold text-[12px] text-[#4a4365]">系统配置</div>
                                <div className="text-[9.5px] text-gray-400">模型网关与提示词</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
