import React from 'react';
import { Database, Globe, Search, RefreshCw, Play, ExternalLink } from 'lucide-react';

interface PlaygroundTabProps {
    playgroundTab: 'rag' | 'web';
    setPlaygroundTab: (tab: 'rag' | 'web') => void;
    ragTestQuery: string;
    setRagTestQuery: (q: string) => void;
    ragTestResults: any[] | null;
    isRagTesting: boolean;
    onRunRagTest: () => void;
    webTestQuery: string;
    setWebTestQuery: (q: string) => void;
    webTestProvider: string;
    setWebTestProvider: (p: string) => void;
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
    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            {/* Sub-tab switcher */}
            <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-white shadow-2xs w-fit">
                <button
                    onClick={() => setPlaygroundTab('rag')}
                    className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${playgroundTab === 'rag'
                            ? 'bg-[#4a4365] text-white shadow-sm'
                            : 'text-[#6d648b] hover:bg-white'
                        }`}
                >
                    <Database size={15} /> 1. 校方 RAG 知识库检索诊断
                </button>
                <button
                    onClick={() => setPlaygroundTab('web')}
                    className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${playgroundTab === 'web'
                            ? 'bg-[#4a4365] text-white shadow-sm'
                            : 'text-[#6d648b] hover:bg-white'
                        }`}
                >
                    <Globe size={15} /> 2. 全网多源联网搜索实时测试
                </button>
            </div>

            {/* Sub-view A: RAG Diagnostic Testing */}
            {playgroundTab === 'rag' && (
                <div className="space-y-5">
                    <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[14px]">校方 RAG 检索精准度与自适应截断诊断</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                测试分词 Token 拆解、512 维向量余弦相似度门槛（≥0.50）以及相对最高分差（≥70%）动态截断
                            </p>
                        </div>

                        {/* Quick Search Chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-400 font-bold">推荐测试查询:</span>
                            {['浙江 计算机 分数线', '宿舍四人间 空调 独卫', '工科 学费 奖学金', '计算机 选科要求', '转专业 政策'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setRagTestQuery(q); }}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar Input */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={ragTestQuery}
                                    onChange={(e) => setRagTestQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onRunRagTest()}
                                    placeholder="输入要测试的知识库查询词，例如“浙江 计算机 录取分数”..."
                                    className="w-full bg-[#f8f6fc] pl-10 pr-4 py-2.5 rounded-2xl text-[13px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>
                            <button
                                onClick={onRunRagTest}
                                disabled={isRagTesting}
                                className="bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white px-5 py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                {isRagTesting ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
                                <span>{isRagTesting ? '正在诊断...' : '执行诊断'}</span>
                            </button>
                        </div>
                    </div>

                    {/* RAG Test Results */}
                    {ragTestResults && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[12px] font-bold text-[#4a4365]">
                                    检索命中结果 ({ragTestResults.length} 条高相关项)
                                </span>
                                <span className="text-[11px] text-purple-600 font-bold">
                                    {ragTestResults.length > 0 ? '✅ 顺利通过绝对阈值与自适应截断' : '⚠️ 未命中高相关条目 (自适应过滤生效)'}
                                </span>
                            </div>

                            {ragTestResults.length === 0 ? (
                                <div className="bg-white/80 rounded-3xl p-8 text-center text-gray-400 font-bold border border-white">
                                    未检索到匹配的校方知识条目（已自动过滤弱相关与无关内容，防止大模型幻觉污染）。
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ragTestResults.map((match, idx) => (
                                        <div key={idx} className="bg-white/90 rounded-3xl p-5 border border-white shadow-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="font-bold text-[#4a4365] text-[14px]">
                                                        {match.item?.title || match.title}
                                                    </span>
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                                                        {match.item?.category || match.category}
                                                    </span>
                                                </div>
                                                <span className="text-[12px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                                                    综合得分: {typeof match.score === 'number' ? match.score.toFixed(2) : match.score}
                                                </span>
                                            </div>

                                            <p className="text-[12px] text-gray-600 leading-relaxed bg-[#fbf9fe] p-3 rounded-2xl border border-purple-50/60">
                                                {match.item?.content || match.content}
                                            </p>

                                            {((match.item?.imageAttachments || match.imageAttachments || []).length > 0) && (
                                                <div className="flex items-center gap-2 pt-1">
                                                    {(match.item?.imageAttachments || match.imageAttachments).map((img: any, i: number) => (
                                                        <img key={i} src={img.url} alt={img.caption} className="w-16 h-16 object-cover rounded-xl border" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Sub-view B: Live Web Search Testing */}
            {playgroundTab === 'web' && (
                <div className="space-y-5">
                    <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[14px]">全网多源搜索引擎实时测试</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                测试 Tavily、博查 AI 与 DuckDuckGo（免 Key 自动容灾兜底）的实时互联网抓取与内容清洗
                            </p>
                        </div>

                        {/* Quick Search Chips */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-400 font-bold">推荐热搜词:</span>
                            {['2025 全国高考报考人数', '计算机专业最新就业薪资中位数', '大湾区 高校 优势专业', '教育部 选科 新政策'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setWebTestQuery(q); }}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Engine Provider & Input Bar */}
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <select
                                value={webTestProvider}
                                onChange={(e) => setWebTestProvider(e.target.value)}
                                className="bg-[#f8f6fc] text-[#4a4365] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold outline-none cursor-pointer border border-purple-50 w-full sm:w-auto"
                            >
                                <option value="duckduckgo">DuckDuckGo (免 Key 默认兜底)</option>
                                <option value="tavily">Tavily (AI 原生深度搜索)</option>
                                <option value="bocha">博查 AI (国内中文政策优化)</option>
                            </select>

                            <div className="relative flex-1 w-full">
                                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={webTestQuery}
                                    onChange={(e) => setWebTestQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onRunWebSearchTest()}
                                    placeholder="输入要联网搜索的关键词..."
                                    className="w-full bg-[#f8f6fc] pl-10 pr-4 py-2.5 rounded-2xl text-[13px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>

                            <button
                                onClick={onRunWebSearchTest}
                                disabled={isWebTesting}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center cursor-pointer"
                            >
                                {isWebTesting ? <RefreshCw size={15} className="animate-spin" /> : <Globe size={15} />}
                                <span>{isWebTesting ? '正在全网搜索...' : '发起搜索'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Web Search Results */}
                    {webTestResults && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-[#4a4365]">
                                        搜索结果 ({webTestResults.count || (webTestResults.results || []).length} 条)
                                    </span>
                                    <span className="text-[10.5px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                                        引擎: {webTestResults.provider}
                                    </span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-bold">
                                    耗时: {webTestResults.elapsedMs} ms
                                </span>
                            </div>

                            <div className="space-y-3">
                                {(webTestResults.results || []).map((res: any, idx: number) => (
                                    <div key={idx} className="bg-white/90 rounded-3xl p-4.5 border border-white shadow-xs space-y-2 hover:border-blue-200 transition-all">
                                        <div className="flex items-start justify-between gap-3">
                                            <a
                                                href={res.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-bold text-[#4a4365] text-[13.5px] hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                            >
                                                <span>{idx + 1}. {res.title}</span>
                                                <ExternalLink size={13} className="text-gray-400 shrink-0" />
                                            </a>
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md shrink-0 font-medium">
                                                {res.source || 'web'}
                                            </span>
                                        </div>

                                        <p className="text-[12px] text-gray-600 leading-relaxed bg-[#f8faff] p-3 rounded-2xl border border-blue-50/60">
                                            {res.snippet || '暂无摘要'}
                                        </p>

                                        <div className="text-[10px] text-blue-500 truncate">
                                            {res.url}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
