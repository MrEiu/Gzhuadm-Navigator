import React, { useState } from 'react';
import {
    X,
    Copy,
    Check,
    Cpu,
    Clock,
    Zap,
    FileText,
    Database,
    Sliders,
    Layers,
    Bot,
    User as UserIcon,
    Code,
    Sparkles,
    ShieldAlert,
    Terminal,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { ApiDiagnostics } from '../../types';

interface ApiDiagnosticsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    diagnostics: ApiDiagnostics | null;
}

export const ApiDiagnosticsDrawer: React.FC<ApiDiagnosticsDrawerProps> = ({
    isOpen,
    onClose,
    diagnostics
}) => {
    const [activeTab, setActiveTab] = useState<'payload' | 'rag' | 'perf' | 'raw'>('payload');
    const [copied, setCopied] = useState<string | null>(null);
    const [expandedSystemPrompt, setExpandedSystemPrompt] = useState(false);

    if (!isOpen || !diagnostics) return null;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const generateCurl = () => {
        const payload = {
            model: diagnostics.requestPayload?.model || 'deepseek-chat',
            messages: diagnostics.requestPayload?.messages || [],
            temperature: diagnostics.requestPayload?.temperature ?? 0.7,
            max_tokens: diagnostics.requestPayload?.max_tokens ?? 2048
        };

        return `curl https://api.deepseek.com/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
    };

    const perf = diagnostics.performance || {} as any;
    const req = diagnostics.requestPayload || {} as any;
    const rag = diagnostics.ragRetrieval;
    const profile = diagnostics.userProfileContext;
    const agent = diagnostics.targetAgent;

    const totalLatency = perf.totalLatencyMs ?? (diagnostics as any).totalLatencyMs ?? (diagnostics as any).latencyMs ?? 0;
    const totalTokens = perf.estimatedTotalTokens ?? (diagnostics as any).estimatedTotalTokens ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Slide-over Container */}
            <div className="relative w-full max-w-2xl h-full bg-slate-900/95 text-slate-100 shadow-2xl border-l border-slate-700/60 backdrop-blur-xl flex flex-col z-10 animate-slideLeft">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                                    AI API 深度调试与参数审计
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                                        ADMIN DEBUG
                                    </span>
                                </h3>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Request ID: {diagnostics.requestId || `req_${Date.now()}`} · {diagnostics.timestamp ? new Date(diagnostics.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleCopy(JSON.stringify(diagnostics, null, 2), 'all_json')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700/80 cursor-pointer"
                        >
                            {copied === 'all_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied === 'all_json' ? '已复制抓包 JSON' : '复制抓包 JSON'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Quick KPI Bar */}
                <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs shrink-0">
                    <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/40">
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" /> 调用模型
                        </div>
                        <div className="font-mono font-bold text-white mt-0.5 truncate text-[11px]">
                            {req?.model || 'deepseek-chat'}
                        </div>
                    </div>
                    <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/40">
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" /> 响应延迟
                        </div>
                        <div className="font-mono font-bold text-emerald-400 mt-0.5 text-[11px]">
                            {totalLatency} ms
                        </div>
                    </div>
                    <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/40">
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <Layers className="w-3 h-3 text-purple-400" /> Token 预估
                        </div>
                        <div className="font-mono font-bold text-purple-300 mt-0.5 text-[11px]">
                            {totalTokens.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/40">
                        <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                            <Bot className="w-3 h-3 text-pink-400" /> 响应智能体
                        </div>
                        <div className="font-bold text-pink-300 mt-0.5 truncate text-[11px]">
                            {agent?.name || 'Dr. Elena'}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-2 shrink-0 bg-slate-900/60">
                    <button
                        onClick={() => setActiveTab('payload')}
                        className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'payload'
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Code className="w-3.5 h-3.5" />
                        API 请求体 (Payload)
                    </button>
                    <button
                        onClick={() => setActiveTab('rag')}
                        className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'rag'
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Database className="w-3.5 h-3.5" />
                        RAG 召回与画像
                    </button>
                    <button
                        onClick={() => setActiveTab('perf')}
                        className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'perf'
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Sliders className="w-3.5 h-3.5" />
                        性能与 cURL 复现
                    </button>
                    <button
                        onClick={() => setActiveTab('raw')}
                        className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'raw'
                                ? 'border-purple-500 text-purple-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        原始 JSON
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
                    
                    {/* Tab 1: API Request Payload */}
                    {activeTab === 'payload' && (
                        <div className="space-y-5">
                            {/* Key Parameters */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                                <div>
                                    <span className="text-[11px] text-slate-400">接口协议</span>
                                    <p className="font-mono font-bold text-slate-200 mt-0.5">{req.protocol || 'chat_completions'}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400">温度 (Temperature)</span>
                                    <p className="font-mono font-bold text-slate-200 mt-0.5">{req.temperature ?? 0.7}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400">最大 Token (Max)</span>
                                    <p className="font-mono font-bold text-slate-200 mt-0.5">{req.max_tokens ?? 2048}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400">对话轮次</span>
                                    <p className="font-mono font-bold text-purple-400 mt-0.5">{req.messages?.length || 0} 条</p>
                                </div>
                            </div>

                            {/* System Prompt Section */}
                            {req.systemPrompt && (
                                <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                            注入给大模型的 System Prompt ({req.systemPrompt.length} 字符)
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCopy(req.systemPrompt || '', 'sys_prompt')}
                                                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                                            >
                                                {copied === 'sys_prompt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                复制 Prompt
                                            </button>
                                            <button
                                                onClick={() => setExpandedSystemPrompt(!expandedSystemPrompt)}
                                                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                                            >
                                                {expandedSystemPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                {expandedSystemPrompt ? '收起' : '展开全文'}
                                            </button>
                                        </div>
                                    </div>
                                    <pre className={`p-3 bg-slate-900 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-hidden ${
                                        expandedSystemPrompt ? 'max-h-none' : 'max-h-36'
                                    }`}>
                                        {req.systemPrompt}
                                    </pre>
                                </div>
                            )}

                            {/* Registered Tools / Function Calls */}
                            {req.tools && req.tools.length > 0 && (
                                <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5 text-blue-400" />
                                        供给大模型调用的 Tools 工具清单 ({req.tools.length} 个)
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {req.tools.map((t, idx) => (
                                            <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                                <div className="font-mono font-bold text-purple-300 text-[11px]">
                                                    🛠️ {t.name}
                                                </div>
                                                <p className="text-[10px] text-slate-400 leading-snug">{t.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages History Array */}
                            <div className="space-y-3">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                                    实际传递给大模型的 messages[] 数组 ({req.messages?.length || 0})
                                </span>
                                <div className="space-y-2.5">
                                    {(req.messages || []).map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3.5 rounded-2xl border ${
                                                msg.role === 'user'
                                                    ? 'bg-blue-950/30 border-blue-800/40 text-blue-100'
                                                    : msg.role === 'system'
                                                    ? 'bg-purple-950/30 border-purple-800/40 text-purple-100'
                                                    : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/5">
                                                <span className="font-mono font-bold text-[11px] uppercase flex items-center gap-1.5">
                                                    {msg.role === 'user' ? (
                                                        <>
                                                            <UserIcon className="w-3 h-3 text-blue-400" />
                                                            <span className="text-blue-400">role: user</span>
                                                        </>
                                                    ) : msg.role === 'system' ? (
                                                        <>
                                                            <Sparkles className="w-3 h-3 text-purple-400" />
                                                            <span className="text-purple-400">role: system</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Bot className="w-3 h-3 text-emerald-400" />
                                                            <span className="text-emerald-400">role: assistant</span>
                                                        </>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    #{idx + 1} · {msg.content?.length || 0} 字符
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: RAG & Profile Routing */}
                    {activeTab === 'rag' && (
                        <div className="space-y-5">
                            {/* Routing Decision */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                        <Bot className="w-3.5 h-3.5 text-pink-400" />
                                        智能体意图路由决策 (Routing Decision)
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold text-[10px]">
                                        {agent?.name || 'Dr. Elena'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-slate-400 text-[10px]">路由触发规则:</span>
                                        <p className="font-bold text-white mt-0.5">{diagnostics.routingDecision?.ruleType || diagnostics.routingDecision?.type || '意图匹配'}</p>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                        <span className="text-slate-400 text-[10px]">命中主题分类:</span>
                                        <p className="font-bold text-purple-300 mt-0.5">{diagnostics.routingDecision?.matchedCategory || diagnostics.routingDecision?.details || '高招专属顾问'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* RAG Knowledge Retrieval */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                        <Database className="w-3.5 h-3.5 text-blue-400" />
                                        校方权威知识库 RAG 召回 ({rag?.retrievedCount || 0} 条命中)
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        检索词: "{rag?.query || '-'}"
                                    </span>
                                </div>

                                {(!rag?.matches || rag.matches.length === 0) ? (
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
                                        本次提问未触发 RAG 知识检索（基于通用大模型通识常识与人设回答）
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {rag.matches.map((item, idx) => (
                                            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-slate-200 text-[11px] flex items-center gap-2">
                                                        <span>{item.title}</span>
                                                        <span className="px-2 py-0.2 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-bold">{item.category}</span>
                                                        {item.hasTableData && <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px]">📊 含表格</span>}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-mono">ID: {item.id}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] text-slate-400 block">相似度得分</span>
                                                    <span className="font-mono font-bold text-emerald-400 text-xs">
                                                        {(item.similarityScore ? item.similarityScore * 100 : 88).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Student Profile Context */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                                    注入的考生高考画像记忆 (Profile Context)
                                </span>
                                {profile ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                            <span className="text-slate-400 text-[10px]">考生姓名</span>
                                            <p className="font-bold text-white mt-0.5">{profile.username || '未填'}</p>
                                        </div>
                                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                            <span className="text-slate-400 text-[10px]">高考省份</span>
                                            <p className="font-bold text-blue-300 mt-0.5">{profile.province || '未填'}</p>
                                        </div>
                                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                            <span className="text-slate-400 text-[10px]">高考分数</span>
                                            <p className="font-bold text-emerald-400 mt-0.5">{profile.score ? `${profile.score} 分` : '未填'}</p>
                                        </div>
                                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                            <span className="text-slate-400 text-[10px]">全省排位</span>
                                            <p className="font-bold text-purple-300 mt-0.5">{profile.rank ? `第 ${profile.rank} 名` : '未填'}</p>
                                        </div>
                                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 col-span-2">
                                            <span className="text-slate-400 text-[10px]">选科情况</span>
                                            <p className="font-bold text-amber-300 mt-0.5">{profile.subjects || '未指定'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-900 rounded-xl text-slate-400 text-xs">
                                        当前为匿名提问状态，未绑定考生高考画像。
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Performance & cURL */}
                    {activeTab === 'perf' && (
                        <div className="space-y-5">
                            {/* Latency Waterfall */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                    时延与性能审计 (Performance Waterfall)
                                </span>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-400">总端到端耗时:</span>
                                        <span className="font-mono font-bold text-emerald-400">{totalLatency} ms</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-purple-500" style={{ width: '20%' }} />
                                        <div className="h-full bg-blue-500" style={{ width: '75%' }} />
                                        <div className="h-full bg-emerald-500" style={{ width: '5%' }} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> RAG 向量匹配 (~20%)</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> 大模型推理生成 (~75%)</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 网络传输 (~5%)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Token Consumption */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-400">Prompt Tokens</span>
                                    <p className="font-mono font-bold text-blue-400 text-sm mt-1">{perf.estimatedPromptTokens?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-400">Completion Tokens</span>
                                    <p className="font-mono font-bold text-emerald-400 text-sm mt-1">{perf.estimatedCompletionTokens?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                                    <span className="text-[10px] text-slate-400">Total Tokens</span>
                                    <p className="font-mono font-bold text-purple-400 text-sm mt-1">{perf.estimatedTotalTokens?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            {/* cURL Reproducer */}
                            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                                        快速复现 (cURL Command for Postman / Terminal)
                                    </span>
                                    <button
                                        onClick={() => handleCopy(generateCurl(), 'curl')}
                                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                                    >
                                        {copied === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        复制 cURL
                                    </button>
                                </div>
                                <pre className="p-3 bg-slate-900 rounded-xl text-amber-300 font-mono text-[10px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
                                    {generateCurl()}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Raw JSON */}
                    {activeTab === 'raw' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                    <Code className="w-3.5 h-3.5 text-purple-400" />
                                    完整抓包结构体 (Diagnostics JSON Schema)
                                </span>
                                <button
                                    onClick={() => handleCopy(JSON.stringify(diagnostics, null, 2), 'raw_json')}
                                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                                >
                                    {copied === 'raw_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    复制代码
                                </button>
                            </div>
                            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-purple-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(diagnostics, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer Note */}
                <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1.5 text-slate-400">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        仅拥有管理员 (Admin) 权限可查看此诊断抽屉
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
