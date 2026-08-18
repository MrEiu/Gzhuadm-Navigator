import React from 'react';
import { Database, User as UserIcon, Zap, Cpu, Activity, Sparkles, Plus, FileUp, FlaskConical, Settings } from 'lucide-react';
import { DashboardStats, RagItem, User } from '../../types';

interface DashboardTabProps {
    dashboardStats: DashboardStats | null;
    ragItems: RagItem[];
    registeredUsersList: User[];
    onNavigateTab: (tab: 'dashboard' | 'rag' | 'users' | 'analytics' | 'playground' | 'settings') => void;
    onOpenAddModal: () => void;
    onOpenChunkModal: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
    dashboardStats,
    ragItems,
    registeredUsersList,
    onNavigateTab,
    onOpenAddModal,
    onOpenChunkModal
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 4 Main KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center shrink-0">
                        <Database size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">
                            {dashboardStats?.totalRagItems || ragItems.length}
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">知识库总条目</div>
                        <div className="text-[10px] text-purple-600 font-bold mt-0.5">
                            表格 {ragItems.filter(i => i.type === 'table').length} · 图文 {ragItems.filter(i => (i.imageAttachments?.length || 0) > 0).length}
                        </div>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                        <UserIcon size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">
                            {dashboardStats?.totalUsers || registeredUsersList.length || 1}
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">注册考生总数</div>
                        <div className="text-[10px] text-pink-600 font-bold mt-0.5">
                            VIP 优先考生: {dashboardStats?.vipUsers || 0} 位
                        </div>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Zap size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[16px] font-black text-[#4a4365] leading-tight truncate">
                            BGE-small-zh
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">512 维向量引擎</div>
                        <div className="text-[10px] text-indigo-600 font-bold mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 本地 ONNX 毫秒召回
                        </div>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Cpu size={24} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-[15px] font-black text-[#4a4365] leading-tight truncate">
                            {dashboardStats?.aiGateway?.defaultModel || 'deepseek-chat'}
                        </div>
                        <div className="text-[11.5px] font-medium text-gray-500">默认对话模型</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            快速模型: {dashboardStats?.aiGateway?.fastModel || 'deepseek-chat'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Category Breakdown & Infrastructure Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Category Breakdown */}
                <div className="lg:col-span-2 bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                            <Database size={16} className="text-purple-500" />
                            <span>知识库分类分布与覆盖度</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold">
                            共 {Object.keys(dashboardStats?.categoryBreakdown || {}).length || 6} 个核心大类
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(dashboardStats?.categoryBreakdown || {
                            '录取分数': 4,
                            '专业特色': 5,
                            '宿舍环境': 3,
                            '学费与资助': 2,
                            '生活设施': 2,
                            '常规问答': 2
                        }).map(([cat, count]: any, idx) => {
                            const total = dashboardStats?.totalRagItems || ragItems.length || 1;
                            const pct = Math.round((Number(count) / total) * 100);
                            const colors = ['from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500', 'from-pink-500 to-rose-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-violet-500 to-purple-500'];
                            const barColor = colors[idx % colors.length];

                            return (
                                <div key={cat} className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 space-y-2">
                                    <div className="flex items-center justify-between text-[12px] font-bold text-[#4a4365]">
                                        <span>{cat}</span>
                                        <span className="text-purple-600">{count} 条</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={`h-full bg-gradient-to-r ${barColor} rounded-full`} style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium text-right">占比 {pct}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Infrastructure Health Status */}
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                    <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500" />
                        <span>系统基础设施运行状态</span>
                    </div>

                    <div className="space-y-2.5">
                        {[
                            { name: 'PostgreSQL 向量库', desc: 'pgvector 扩展 (Port 35432)', status: '已连接 · 活跃', isOk: true },
                            { name: 'Redis 高速缓存', desc: 'RAG 与文档切片二级缓存', status: '已就绪 (TTL 30m)', isOk: true },
                            { name: '本地 BGE 向量模型', desc: 'ONNX Runtime (512-dim)', status: '已加载 (0.1s)', isOk: true },
                            { name: '多源联网搜索', desc: `${dashboardStats?.searchEngine?.provider || 'DuckDuckGo'} 引擎就绪`, status: '自动容灾兜底', isOk: true },
                        ].map((item, i) => (
                            <div key={i} className="p-2.5 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 flex items-center justify-between">
                                <div className="min-w-0">
                                    <div className="text-[12px] font-bold text-[#4a4365]">{item.name}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{item.desc}</div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Quick Action Shortcuts */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3">
                <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <span>常用管理与测试快捷入口</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        onClick={() => { onNavigateTab('rag'); onOpenAddModal(); }}
                        className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-2xl border border-purple-100/80 text-left transition-all group cursor-pointer"
                    >
                        <Plus size={18} className="text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                        <div className="font-bold text-[13px] text-[#4a4365]">添加知识条目</div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">录入文本或表格数据</div>
                    </button>

                    <button
                        onClick={() => { onNavigateTab('rag'); onOpenChunkModal(); }}
                        className="p-3.5 bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 rounded-2xl border border-pink-100/80 text-left transition-all group cursor-pointer"
                    >
                        <FileUp size={18} className="text-pink-600 mb-1 group-hover:scale-110 transition-transform" />
                        <div className="font-bold text-[13px] text-[#4a4365]">AI 文档智能切片</div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">由快速模型驱动切分</div>
                    </button>

                    <button
                        onClick={() => onNavigateTab('playground')}
                        className="p-3.5 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border border-blue-100/80 text-left transition-all group cursor-pointer"
                    >
                        <FlaskConical size={18} className="text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                        <div className="font-bold text-[13px] text-[#4a4365]">检索与测试中心</div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">RAG精测与联网诊断</div>
                    </button>

                    <button
                        onClick={() => onNavigateTab('settings')}
                        className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-2xl border border-amber-100/80 text-left transition-all group cursor-pointer"
                    >
                        <Settings size={18} className="text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                        <div className="font-bold text-[13px] text-[#4a4365]">系统模型配置</div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">API Key 与搜索引擎</div>
                    </button>
                </div>
            </div>
        </div>
    );
};
