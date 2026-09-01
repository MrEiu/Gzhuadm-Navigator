import React from 'react';
import {
    Users, MessageSquare, Cpu, Sparkles, MapPin,
    TrendingUp, Activity, CheckCircle2, AlertCircle, Database,
    Server, ArrowRight, BookOpen, Sliders
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface DashboardTabProps {
    stats: DashboardStats | null;
    loading: boolean;
    onNavigateTab: (tabId: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    stats,
    loading,
    onNavigateTab
}) => {
    if (loading && !stats) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400 text-[13px] gap-3">
                <div className="w-9 h-9 border-3 border-[#a494e8] border-t-transparent rounded-full animate-spin" />
                <span>正在加载数据大盘实时监控指标...</span>
            </div>
        );
    }

    const totalUsers = stats?.totalUsers ?? 0;
    const vipUsers = stats?.vipUsers ?? 0;
    const vipPercentage = totalUsers > 0 ? Math.round((vipUsers / totalUsers) * 100) : 0;
    const todayQueries = stats?.todayQueriesCount ?? 0;
    const totalMessages = stats?.totalMessagesCount ?? 0;

    const provinceDist = stats?.provinceDistribution || [];
    const popularMajors = stats?.popularMajors || [];

    const health = stats?.systemHealth;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">

            {/* 1. Core Application KPI Monitoring Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Card 1: Users & VIP */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#8a84a4]">注册考生总数</span>
                        <div className="w-9 h-9 rounded-2xl bg-purple-50 text-[#a494e8] flex items-center justify-center shadow-xs">
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="text-[28px] font-black text-[#4a4365] tracking-tight font-mono">
                            {totalUsers} <span className="text-[13px] font-bold text-gray-400 font-sans">人</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-50">
                        <span className="text-[#8a84a4]">个人 RAG 已建档</span>
                        <span className="font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md">
                            全员默认已开启
                        </span>
                    </div>
                </div>

                {/* Card 2: Q&A Traffic */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#8a84a4]">问答交互总量</span>
                        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#f296b2] flex items-center justify-center shadow-xs">
                            <MessageSquare size={18} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="text-[28px] font-black text-[#4a4365] tracking-tight font-mono">
                            {totalMessages} <span className="text-[13px] font-bold text-gray-400 font-sans">条</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-50">
                        <span className="text-[#8a84a4]">今日实时咨询</span>
                        <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            +{todayQueries} 条
                        </span>
                    </div>
                </div>

                {/* Card 3: Vector Engine */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#8a84a4]">向量语义计算引擎</span>
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-xs">
                            <Cpu size={18} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="text-[18px] font-black text-[#4a4365] tracking-tight truncate">
                            BGE-small-zh
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">512 维本地 ONNX 向量化</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-50">
                        <span className="text-[#8a84a4]">响应延迟</span>
                        <span className="font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md font-mono">
                            ~{health?.onnx?.latencyMs ?? 1} ms
                        </span>
                    </div>
                </div>

                {/* Card 4: AI Model Gateway */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#8a84a4]">AI 模型网关</span>
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-xs">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <div className="my-2">
                        <div className="text-[17px] font-black text-[#4a4365] tracking-tight truncate">
                            {stats?.aiGateway?.defaultModel || 'deepseek-chat'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                            快速切片：{stats?.aiGateway?.fastModel || 'deepseek-chat'}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-purple-50">
                        <span className="text-[#8a84a4]">服务商状态</span>
                        <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            {stats?.aiGateway?.provider || 'DeepSeek API'}
                        </span>
                    </div>
                </div>

            </div>

            {/* 2. Middle Row: Province Distribution & Popular Majors Ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Province Distribution */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                <MapPin size={16} />
                            </div>
                            <h3 className="font-black text-[#4a4365] text-[15px]">考生生源省份分布 Top 5</h3>
                        </div>
                        <span className="text-[11px] text-[#8a84a4]">基于考生档案画像统计</span>
                    </div>

                    <div className="space-y-3 pt-2">
                        {provinceDist.length > 0 ? (
                            provinceDist.map((item, idx) => (
                                <div key={item.province} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[12.5px] font-bold">
                                        <span className="text-[#4a4365] flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-mono">
                                                {idx + 1}
                                            </span>
                                            {item.province}
                                        </span>
                                        <span className="text-[#8a84a4] font-mono">
                                            {item.count} 人 ({item.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-purple-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#b3a4ed] to-[#f296b2] rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(item.percentage, 8)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-gray-400 text-[12px]">暂无省份分布数据</div>
                        )}
                    </div>
                </div>

                {/* Popular Majors Ranking */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-rose-50 text-rose-500">
                                <TrendingUp size={16} />
                            </div>
                            <h3 className="font-black text-[#4a4365] text-[15px]">热门意向专业关注排行</h3>
                        </div>
                        <span className="text-[11px] text-[#8a84a4]">咨询频次自动聚合</span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                        {popularMajors.length > 0 ? (
                            popularMajors.map((item, idx) => (
                                <div
                                    key={item.major}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f6fc] border border-purple-50 hover:bg-white transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${idx === 0 ? 'bg-amber-400 text-white shadow-xs' :
                                            idx === 1 ? 'bg-slate-300 text-slate-700' :
                                                idx === 2 ? 'bg-amber-600 text-white' :
                                                    'bg-purple-100 text-purple-700'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-[13px] font-bold text-[#4a4365]">{item.major}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-[#a494e8] bg-purple-50 px-2.5 py-1 rounded-xl">
                                        {item.count} 次咨询提及
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-gray-400 text-[12px]">暂无专业热度统计</div>
                        )}
                    </div>
                </div>

            </div>

            {/* 3. System Infrastructure Health Panel */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                            <Activity size={16} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[15px]">系统基础设施健康度监控面板</h3>
                            <p className="text-[11px] text-[#8a84a4]">实时检测数据库连接、缓存层、向量计算与联网搜索容灾状态</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        所有核心服务运行正常
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">

                    {/* PostgreSQL */}
                    <div className="p-4 rounded-2xl bg-[#fbf9fe] border border-purple-100/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <Database size={14} className="text-purple-600" /> PostgreSQL pgvector
                            </span>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-[#8a84a4]">
                            {health?.postgres?.status || 'JSON 本地持久化降级'}
                        </div>
                        <div className="text-[10px] font-mono text-purple-700">
                            延迟: {health?.postgres?.latencyMs ?? 1} ms
                        </div>
                    </div>

                    {/* Redis Cache */}
                    <div className="p-4 rounded-2xl bg-[#fbf9fe] border border-purple-100/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <Server size={14} className="text-rose-500" /> 高速缓存策略
                            </span>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-[#8a84a4]">
                            {health?.redis?.status || '内存 Map 降级缓存 (TTL 30m)'}
                        </div>
                        <div className="text-[10px] font-mono text-rose-700">
                            类型: {health?.redis?.type || 'Memory Cache'}
                        </div>
                    </div>

                    {/* ONNX Embedding */}
                    <div className="p-4 rounded-2xl bg-[#fbf9fe] border border-purple-100/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <Cpu size={14} className="text-indigo-500" /> ONNX Runtime
                            </span>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-[#8a84a4]">
                            {health?.onnx?.status || '模型加载完成'}
                        </div>
                        <div className="text-[10px] font-mono text-indigo-700">
                            极速召回耗时: {health?.onnx?.latencyMs ?? 1} ms
                        </div>
                    </div>

                    {/* Multi-Source Search */}
                    <div className="p-4 rounded-2xl bg-[#fbf9fe] border border-purple-100/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-500" /> 多源联网搜索容灾
                            </span>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div className="text-[11px] text-[#8a84a4]">
                            默认引擎: {stats?.searchEngine?.provider || 'duckduckgo'}
                        </div>
                        <div className="text-[10px] font-mono text-amber-700">
                            支持: DDG + Tavily + 博查
                        </div>
                    </div>

                </div>
            </div>

            {/* 4. Quick Action Entries */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <button
                    onClick={() => onNavigateTab('rag')}
                    className="p-4 bg-white/70 hover:bg-white rounded-2xl border border-white/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition-transform">
                            <BookOpen size={16} />
                        </div>
                        <div className="text-left">
                            <div className="text-[12.5px] font-bold text-[#4a4365]">知识库管理</div>
                            <div className="text-[10px] text-[#8a84a4]">维护 RAG 向量条目</div>
                        </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-purple-600 transition-colors" />
                </button>

                <button
                    onClick={() => onNavigateTab('users')}
                    className="p-4 bg-white/70 hover:bg-white rounded-2xl border border-white/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                            <Users size={16} />
                        </div>
                        <div className="text-left">
                            <div className="text-[12.5px] font-bold text-[#4a4365]">考生档案库</div>
                            <div className="text-[10px] text-[#8a84a4]">高考画像与个人专属档案</div>
                        </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                </button>

                <button
                    onClick={() => onNavigateTab('playground')}
                    className="p-4 bg-white/70 hover:bg-white rounded-2xl border border-white/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                            <Cpu size={16} />
                        </div>
                        <div className="text-left">
                            <div className="text-[12.5px] font-bold text-[#4a4365]">测试诊断中心</div>
                            <div className="text-[10px] text-[#8a84a4]">检索与联网探活</div>
                        </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-amber-600 transition-colors" />
                </button>

                <button
                    onClick={() => onNavigateTab('settings')}
                    className="p-4 bg-white/70 hover:bg-white rounded-2xl border border-white/80 shadow-xs flex items-center justify-between transition-all group cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                            <Sliders size={16} />
                        </div>
                        <div className="text-left">
                            <div className="text-[12.5px] font-bold text-[#4a4365]">系统模型配置</div>
                            <div className="text-[10px] text-[#8a84a4]">网关与提示词调试</div>
                        </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-rose-600 transition-colors" />
                </button>
            </div>

        </div>
    );
};
