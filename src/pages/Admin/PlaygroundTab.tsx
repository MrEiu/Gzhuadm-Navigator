import React, { useState } from 'react';
import {
    FlaskConical, Search, Globe, Database, Sparkles,
    RefreshCw, ExternalLink, CheckCircle2, ArrowRight, Table as TableIcon, Layers
} from 'lucide-react';
import { API_BASE } from '../../api/config';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';

interface PlaygroundTabProps {
    playgroundTab: 'rag' | 'web' | 'compare';
    setPlaygroundTab: React.Dispatch<React.SetStateAction<'rag' | 'web' | 'compare'>>;
    ragTestQuery: string;
    setRagTestQuery: React.Dispatch<React.SetStateAction<string>>;
    ragTestResults: any[] | null;
    isRagTesting: boolean;
    onRunRagTest: () => void;
    webTestQuery: string;
    setWebTestQuery: React.Dispatch<React.SetStateAction<string>>;
    webTestProvider: string;
    setWebTestProvider: React.Dispatch<React.SetStateAction<string>>;
    webTestResults: any | null;
    isWebTesting: boolean;
    onRunWebSearchTest: () => void;
}

export const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
    playgroundTab,
    setPlaygroundTab,
    ragTestQuery,
    setRagTestQuery,
    ragTestResults,
    isRagTesting,
    onRunRagTest,
    webTestQuery,
    setWebTestQuery,
    webTestProvider,
    setWebTestProvider,
    webTestResults,
    isWebTesting,
    onRunWebSearchTest
}) => {
    const recommendedRagQueries = [
        '浙江 计算机 录取分数线与位次',
        '四人间 宿舍 枫林星级公寓 空调',
        '广州大学 学费 奖学金',
        '转专业 政策 申请条件'
    ];

    const recommendedWebQueries = [
        '2025 全国高考报考人数 趋势',
        '广东省 高考一分一段表 物理类',
        '广州大学 综合实力 全国排名 软科'
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Sub-Tab Switcher Bar */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-3.5 border border-white shadow-xs flex items-center justify-between">
                <div className="flex bg-[#f8f6fc] p-1 rounded-2xl border border-purple-50">
                    <button
                        onClick={() => setPlaygroundTab('rag')}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${playgroundTab === 'rag' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500'
                            }`}
                    >
                        <Database size={14} className="text-purple-600" />
                        <span>校方 RAG 向量检索诊断</span>
                    </button>
                    <button
                        onClick={() => setPlaygroundTab('web')}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${playgroundTab === 'web' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500'
                            }`}
                    >
                        <Globe size={14} className="text-blue-600" />
                        <span>全网多源搜索引擎测试</span>
                    </button>
                    <button
                        onClick={() => setPlaygroundTab('compare')}
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${playgroundTab === 'compare' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500'
                            }`}
                    >
                        <Layers size={14} className="text-pink-600" />
                        <span>RAG vs 联网同屏比对</span>
                    </button>
                </div>

                <div className="text-[11.5px] text-gray-400 font-bold hidden sm:block">
                    诊断校方私有知识库与全网资讯的召回率与时延
                </div>
            </div>

            {/* 2. Mode A: RAG Diagnostic Mode */}
            {playgroundTab === 'rag' && (
                <div className="space-y-4">
                    <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-[#4a4365] text-[14px]">校方 RAG 向量检索与自适应截断诊断</h4>
                            <span className="text-[11px] text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full">
                                向量阈值 ≥0.5 · 70% 自适应动态截断
                            </span>
                        </div>

                        {/* Search Input & Button */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ragTestQuery}
                                onChange={(e) => setRagTestQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onRunRagTest()}
                                placeholder="输入考生咨询测试 Query..."
                                className="flex-1 bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[13px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                            <button
                                onClick={onRunRagTest}
                                disabled={isRagTesting}
                                className="bg-[#4a4365] hover:bg-[#342e49] text-white px-6 py-2.5 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                <RefreshCw size={15} className={isRagTesting ? 'animate-spin' : ''} />
                                <span>{isRagTesting ? '诊断中...' : '运行诊断'}</span>
                            </button>
                        </div>

                        {/* Query Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] text-gray-400 font-bold">推荐诊断词:</span>
                            {recommendedRagQueries.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setRagTestQuery(q)}
                                    className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Display */}
                    {ragTestResults && (
                        <div className="space-y-3">
                            <div className="text-[12px] font-bold text-gray-500">
                                诊断命中 <span className="text-purple-600">{ragTestResults.length}</span> 条有效知识切片
                            </div>

                            {ragTestResults.length === 0 ? (
                                <div className="bg-white/80 p-8 rounded-3xl text-center text-gray-400">
                                    未达到最低相似度阈值（≥0.50），触发自适应过滤拦截保护。
                                </div>
                            ) : (
                                ragTestResults.map((res, idx) => {
                                    const item = res.item || res;
                                    const score = typeof res.score === 'number' ? res.score : 0.88;
                                    const isTop = idx === 0;

                                    return (
                                        <div
                                            key={idx}
                                            className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3"
                                        >
                                            <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center ${isTop ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <h5 className="font-bold text-[#4a4365] text-[14px]">{item.title}</h5>
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                                        {item.category}
                                                    </span>
                                                </div>

                                                {/* Detailed Score Breakdown */}
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[11px] font-mono font-bold bg-[#f8f6fc] px-2.5 py-1 rounded-xl text-purple-700">
                                                        综合得分: {(score * 100).toFixed(1)}%
                                                    </div>
                                                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                                                        ✓ 自适应截断通过
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-[12.5px] text-gray-600 leading-relaxed">
                                                {item.content}
                                            </p>

                                            {item.tableData && (
                                                <div className="text-[11px] text-indigo-600 bg-indigo-50 p-2 rounded-xl flex items-center gap-1.5">
                                                    <TableIcon size={13} />
                                                    <span>包含结构化表格数据 ({item.tableData.columns?.length} 列 × {item.tableData.rows?.length} 行)</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Mode B: Multi-Source Web Search Mode */}
            {playgroundTab === 'web' && (
                <div className="space-y-4">
                    <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-[#4a4365] text-[14px]">全网多源实时搜索引擎诊断</h4>
                            <div className="flex gap-1.5">
                                {['duckduckgo', 'tavily', 'bocha'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setWebTestProvider(p)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${webTestProvider === p
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'bg-[#f8f6fc] text-gray-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {p === 'duckduckgo' ? 'DuckDuckGo (免Key)' : p === 'tavily' ? 'Tavily AI' : '博查 AI'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={webTestQuery}
                                onChange={(e) => setWebTestQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onRunWebSearchTest()}
                                placeholder="输入全网资讯搜索 Query..."
                                className="flex-1 bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[13px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                            <button
                                onClick={onRunWebSearchTest}
                                disabled={isWebTesting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-[13px] font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                <RefreshCw size={15} className={isWebTesting ? 'animate-spin' : ''} />
                                <span>{isWebTesting ? '搜索中...' : '开始联网检索'}</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] text-gray-400 font-bold">推荐热搜词:</span>
                            {recommendedWebQueries.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setWebTestQuery(q)}
                                    className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Web Search Results */}
                    {webTestResults && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[12px] font-bold text-gray-500">
                                <div>
                                    引擎: <span className="text-blue-600">{webTestResults.provider}</span> · 耗时: <b className="text-emerald-600 font-mono">{webTestResults.elapsedMs} ms</b>
                                </div>
                                <div>找到 {webTestResults.count} 条资讯</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {(webTestResults.results || []).map((res: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-white shadow-xs space-y-2 flex flex-col justify-between"
                                    >
                                        <div className="space-y-1">
                                            <a
                                                href={res.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-bold text-[#4a4365] text-[13px] hover:text-blue-600 transition-colors flex items-center gap-1 leading-snug"
                                            >
                                                <span>{res.title}</span>
                                                <ExternalLink size={12} className="shrink-0 text-gray-400" />
                                            </a>
                                            <p className="text-[11.5px] text-gray-600 line-clamp-3 leading-relaxed">
                                                {res.snippet || res.content}
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-gray-400 truncate pt-1 border-t border-purple-50">
                                            {res.url}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. Mode C: Side-by-Side Comparison Mode */}
            {playgroundTab === 'compare' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: RAG */}
                    <div className="space-y-3">
                        <div className="p-4 bg-purple-50/80 rounded-3xl border border-purple-100 flex items-center justify-between">
                            <span className="font-bold text-[13px] text-purple-900 flex items-center gap-1.5">
                                <Database size={15} /> 校内 RAG 知识库召回
                            </span>
                            <button
                                onClick={onRunRagTest}
                                className="text-[11px] font-bold text-purple-700 bg-white px-3 py-1 rounded-xl shadow-2xs cursor-pointer"
                            >
                                测试 RAG
                            </button>
                        </div>
                        {ragTestResults && ragTestResults.map((r, i) => (
                            <div key={i} className="bg-white/85 p-4 rounded-2xl border border-white shadow-2xs space-y-1">
                                <div className="font-bold text-[12.5px] text-[#4a4365]">{r.item?.title || r.title}</div>
                                <div className="text-[11px] text-gray-600 line-clamp-2">{r.item?.content || r.content}</div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Web Search */}
                    <div className="space-y-3">
                        <div className="p-4 bg-blue-50/80 rounded-3xl border border-blue-100 flex items-center justify-between">
                            <span className="font-bold text-[13px] text-blue-900 flex items-center gap-1.5">
                                <Globe size={15} /> 全网实时资讯抓取
                            </span>
                            <button
                                onClick={onRunWebSearchTest}
                                className="text-[11px] font-bold text-blue-700 bg-white px-3 py-1 rounded-xl shadow-2xs cursor-pointer"
                            >
                                测试联网
                            </button>
                        </div>
                        {webTestResults && (webTestResults.results || []).map((r: any, i: number) => (
                            <div key={i} className="bg-white/85 p-4 rounded-2xl border border-white shadow-2xs space-y-1">
                                <div className="font-bold text-[12.5px] text-[#4a4365] truncate">{r.title}</div>
                                <div className="text-[11px] text-gray-600 line-clamp-2">{r.snippet || r.content}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
