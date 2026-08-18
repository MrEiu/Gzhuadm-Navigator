import React, { useState } from 'react';
import {
    Sparkles, Search, Globe, Cpu, ArrowRight, CheckCircle2,
    ExternalLink, Layers, Split, Clock, Image as ImageIcon, Zap
} from 'lucide-react';
import { RagSearchResult, WebSearchResultItem } from '../../types';
import { API_BASE } from '../../api/config';

export const PlaygroundTab: React.FC = () => {
    // Mode: 'rag' | 'web' | 'compare'
    const [viewMode, setViewMode] = useState<'rag' | 'web' | 'compare'>('compare');

    // RAG Search State
    const [ragQuery, setRagQuery] = useState('浙江 计算机 分数线');
    const [ragResults, setRagResults] = useState<RagSearchResult[]>([]);
    const [ragLoading, setRagLoading] = useState(false);
    const [ragElapsedMs, setRagElapsedMs] = useState<number | null>(null);

    // Web Search State
    const [webQuery, setWebQuery] = useState('广州大学 计算机科学与技术 专业实力 录取分数线');
    const [webProvider, setWebProvider] = useState<'duckduckgo' | 'tavily' | 'bocha'>('duckduckgo');
    const [webResults, setWebResults] = useState<WebSearchResultItem[]>([]);
    const [webLoading, setWebLoading] = useState(false);
    const [webElapsedMs, setWebElapsedMs] = useState<number | null>(null);

    // Common query chips
    const ragQueryChips = [
        '浙江 计算机 分数线',
        '宿舍四人间 空调 独卫',
        '学费 奖学金 减免政策',
        '转专业 考核 流程 条件',
        '桂花岗校区 食堂 环境',
        '人工智能 实验班 选科要求'
    ];

    const webQueryChips = [
        '2025 广州大学 招生章程 简章',
        '广州大学 大学城校区 宿舍图片',
        '广州大学 计算机科学 保研率 排名',
        '广州大学 国际交流 本硕贯通'
    ];

    const handleExecuteRagSearch = async (queryToSearch = ragQuery) => {
        if (!queryToSearch.trim()) return;
        setRagLoading(true);
        const startTime = Date.now();
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryToSearch })
            });
            const data = await res.json();
            setRagElapsedMs(Date.now() - startTime);
            if (data.ok && Array.isArray(data.matches)) {
                setRagResults(data.matches);
            }
        } catch (err) {
            console.error('RAG search err:', err);
        } finally {
            setRagLoading(false);
        }
    };

    const handleExecuteWebSearch = async (queryToSearch = webQuery) => {
        if (!queryToSearch.trim()) return;
        setWebLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/web-search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryToSearch, count: 4 })
            });
            const data = await res.json();
            if (data.ok) {
                setWebElapsedMs(data.elapsedMs || 0);
                setWebResults(data.results || []);
            }
        } catch (err) {
            console.error('Web search err:', err);
        } finally {
            setWebLoading(false);
        }
    };

    const handleExecuteBoth = (queryText: string) => {
        setRagQuery(queryText);
        setWebQuery(queryText);
        handleExecuteRagSearch(queryText);
        handleExecuteWebSearch(queryText);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">

            {/* Top Mode Selector */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-4 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white shadow-xs">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[15px] tracking-tight">
                            检索与联网测试诊断中心
                        </h3>
                        <p className="text-[11px] text-[#8a84a4]">向量召回可解释性拆解 · 自适应截断过滤 · 多源搜索引擎实时探活</p>
                    </div>
                </div>

                <div className="flex bg-[#f8f6fc] p-1 rounded-2xl border border-purple-100 text-[12px] font-bold">
                    <button
                        onClick={() => setViewMode('compare')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'compare' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Split size={14} /> 并排对比模式
                    </button>
                    <button
                        onClick={() => setViewMode('rag')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'rag' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Layers size={14} /> 校方 RAG 诊断
                    </button>
                    <button
                        onClick={() => setViewMode('web')}
                        className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'web' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Globe size={14} /> 全网搜索测试
                    </button>
                </div>
            </div>

            {/* Diagnostic Panels Grid */}
            <div className={`grid gap-5 ${viewMode === 'compare' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

                {/* Sub-module A: RAG Diagnostic Panel */}
                {(viewMode === 'rag' || viewMode === 'compare') && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                        <Layers size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#4a4365] text-[15px]">校方 RAG 知识检索精准度诊断</h4>
                                        <div className="text-[10.5px] text-[#8a84a4]">稠密向量 + 词频 + 省份实体加权 + 自适应截断</div>
                                    </div>
                                </div>

                                {ragElapsedMs !== null && (
                                    <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                                        <Clock size={11} /> {ragElapsedMs} ms
                                    </span>
                                )}
                            </div>

                            {/* Query Chips */}
                            <div className="flex flex-wrap gap-1.5">
                                {ragQueryChips.map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => {
                                            setRagQuery(chip);
                                            handleExecuteRagSearch(chip);
                                        }}
                                        className="text-[11px] font-medium bg-[#f8f6fc] hover:bg-purple-100/70 text-[#6d648b] hover:text-purple-900 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-purple-50"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={ragQuery}
                                        onChange={(e) => setRagQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleExecuteRagSearch()}
                                        placeholder="输入测试问题（如：浙江 计算机 分数线）"
                                        className="w-full bg-[#f8f6fc] rounded-2xl pl-9 pr-4 py-2.5 text-[12.5px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleExecuteRagSearch()}
                                    disabled={ragLoading || !ragQuery.trim()}
                                    className="px-5 py-2.5 bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white text-[12px] font-bold rounded-2xl shadow-[0_4px_12px_rgba(179,164,237,0.35)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Zap size={14} /> {ragLoading ? '检索中...' : '测试召回'}
                                </button>
                            </div>

                            {/* RAG Results List */}
                            <div className="space-y-3 pt-2">
                                {ragLoading ? (
                                    <div className="py-12 text-center text-gray-400 text-[12.5px] space-y-2">
                                        <div className="w-7 h-7 border-2 border-[#a494e8] border-t-transparent rounded-full animate-spin mx-auto" />
                                        <span>正在执行 512 维 BGE 稠密向量余弦计算与实体加权...</span>
                                    </div>
                                ) : ragResults.length > 0 ? (
                                    ragResults.map(({ item, score, breakdown }, idx) => (
                                        <div
                                            key={item.id || idx}
                                            className="bg-[#f8f6fc] rounded-2xl p-4 border border-purple-100 space-y-2.5"
                                        >
                                            {/* Item Header & Score Breakdown */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                                                            #{idx + 1}
                                                        </span>
                                                        <h5 className="font-bold text-[#4a4365] text-[13.5px]">{item.title}</h5>
                                                    </div>
                                                    <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                                                        {item.category || '通用'}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-[14px] font-black text-purple-800 font-mono">
                                                        {score.toFixed(1)} <span className="text-[10px] text-gray-400 font-sans">分</span>
                                                    </div>
                                                    <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5 justify-end">
                                                        <CheckCircle2 size={9} /> 突破自适应截断
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Explainable Score Breakdown Bar */}
                                            {breakdown && (
                                                <div className="p-2 bg-white rounded-xl border border-purple-50 text-[10.5px] text-[#6d648b] flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>稠密向量分: <strong className="text-purple-700 font-mono">+{breakdown.vectorScore}</strong></span>
                                                    <span>词频匹配: <strong className="text-indigo-600 font-mono">+{breakdown.tokenScore}</strong></span>
                                                    {Boolean(breakdown.provinceBonus) && (
                                                        <span>省份实体加权: <strong className="text-emerald-600 font-mono">{breakdown.provinceBonus > 0 ? `+${breakdown.provinceBonus}` : breakdown.provinceBonus}</strong></span>
                                                    )}
                                                    {Boolean(breakdown.categoryBonus) && (
                                                        <span>意向类目加权: <strong className="text-amber-600 font-mono">+{breakdown.categoryBonus}</strong></span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Content snippet */}
                                            <p className="text-[12px] text-[#6d648b] leading-relaxed line-clamp-3">
                                                {item.content || (item.tableData ? `包含表格数据：${item.tableData.columns?.join(' | ')}` : '')}
                                            </p>

                                            {/* Attachments preview */}
                                            {(item.imageAttachments || []).length > 0 && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-[#a494e8] pt-1">
                                                    <ImageIcon size={12} /> 关联 {item.imageAttachments!.length} 张 PNG 附件图表
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-400 text-[12px]">
                                        点击上方测试按钮查看诊断召回结果
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-module B: Web Search Diagnostic Panel */}
                {(viewMode === 'web' || viewMode === 'compare') && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                        <Globe size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-[#4a4365] text-[15px]">全网多源搜索引擎实时测试</h4>
                                        <div className="text-[10.5px] text-[#8a84a4]">支持 DuckDuckGo / Tavily AI / 博查多源容灾</div>
                                    </div>
                                </div>

                                {webElapsedMs !== null && (
                                    <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                                        <Clock size={11} /> {webElapsedMs} ms
                                    </span>
                                )}
                            </div>

                            {/* Query Chips */}
                            <div className="flex flex-wrap gap-1.5">
                                {webQueryChips.map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => {
                                            setWebQuery(chip);
                                            handleExecuteWebSearch(chip);
                                        }}
                                        className="text-[11px] font-medium bg-[#f8f6fc] hover:bg-amber-100/70 text-[#6d648b] hover:text-amber-900 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-amber-50"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input & Provider Selector */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={webQuery}
                                        onChange={(e) => setWebQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleExecuteWebSearch()}
                                        placeholder="输入全网检索问题..."
                                        className="w-full bg-[#f8f6fc] rounded-2xl pl-9 pr-4 py-2.5 text-[12.5px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => handleExecuteWebSearch()}
                                    disabled={webLoading || !webQuery.trim()}
                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[12px] font-bold rounded-2xl shadow-[0_4px_12px_rgba(245,158,11,0.35)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Zap size={14} /> {webLoading ? '抓取中...' : '全网检索'}
                                </button>
                            </div>

                            {/* Web Results List */}
                            <div className="space-y-3 pt-2">
                                {webLoading ? (
                                    <div className="py-12 text-center text-gray-400 text-[12.5px] space-y-2">
                                        <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        <span>正在调用联网搜索引擎抓取清洗数据...</span>
                                    </div>
                                ) : webResults.length > 0 ? (
                                    webResults.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#f8f6fc] rounded-2xl p-4 border border-amber-100/60 space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-bold text-[#4a4365] text-[13.5px] hover:text-purple-700 hover:underline flex items-center gap-1 line-clamp-1"
                                                >
                                                    {item.title} <ExternalLink size={12} className="shrink-0 text-gray-400" />
                                                </a>
                                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md shrink-0">
                                                    全网抓取
                                                </span>
                                            </div>

                                            <p className="text-[12px] text-[#6d648b] leading-relaxed line-clamp-3">
                                                {item.snippet}
                                            </p>

                                            <div className="text-[10px] text-gray-400 font-mono truncate">
                                                {item.url}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-400 text-[12px]">
                                        点击上方全网检索按钮查看实时联网结果
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

        </div>
    );
};
