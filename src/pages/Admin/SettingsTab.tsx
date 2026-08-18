import React, { useState, useEffect } from 'react';
import {
    Sliders, Sparkles, KeyRound, Globe, Server, Check,
    RefreshCw, Eye, EyeOff, ShieldCheck, Mail, Smartphone,
    Bot, MessageSquare, ArrowRight, Zap, CheckCircle2
} from 'lucide-react';
import { SettingsConfig } from '../../types';
import { API_BASE } from '../../api/config';

interface SettingsTabProps {
    onConfigSaved?: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `你是广州大学招生咨询专家顾问 Dr. Elena，专注于为高考考生及家长提供权威、专业、温和且富有洞察力的报考咨询。

【核心原则与行为准则】：
1. 优先依据知识库（RAG）中的校方官方录取分数、位次、招生简章与专业培养方案进行精准解答；
2. 若涉及全网招生最新资讯，结合联网搜索最新结果提供综合分析；
3. 对于考生的高考总分与排名位次，进行客观理性的冲/稳/保梯度分析与建议；
4. 语言风格严谨、亲切、鼓励考生，提供清晰易懂的数据支撑。`;

export const SettingsTab: React.FC<SettingsTabProps> = ({ onConfigSaved }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

    // Form fields
    const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com');
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    const [defaultModel, setDefaultModel] = useState('deepseek-chat');
    const [fastModel, setFastModel] = useState('deepseek-chat');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);

    // Search Engine
    const [searchProvider, setSearchProvider] = useState<'multi' | 'bing' | 'tavily' | 'bocha' | 'duckduckgo' | 'none'>('multi');
    const [tavilyApiKey, setTavilyApiKey] = useState('');
    const [bochaApiKey, setBochaApiKey] = useState('');

    // Registration Mode & Security Channels
    const [authMode, setAuthMode] = useState<'username' | 'phone' | 'email'>('username');
    const [tencentSmsSecretId, setTencentSmsSecretId] = useState('');
    const [tencentSmsSecretKey, setTencentSmsSecretKey] = useState('');
    const [tencentSmsSdkAppId, setTencentSmsSdkAppId] = useState('');
    const [tencentSmsSignName, setTencentSmsSignName] = useState('');
    const [tencentSmsTemplateId, setTencentSmsTemplateId] = useState('');

    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPass, setSmtpPass] = useState('');

    // Fetch existing configuration
    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/config`);
            const data = await res.json();
            if (data.ok && data.config) {
                const c = data.config;
                setBaseUrl(c.baseUrl || c.aiBaseUrl || 'https://api.deepseek.com');
                setApiKey(c.apiKey || '');
                setDefaultModel(c.defaultModel || 'deepseek-chat');
                setFastModel(c.fastModel || 'deepseek-chat');
                setSearchProvider(c.searchProvider || 'multi');
                setTavilyApiKey(c.tavilyApiKey || '');
                setBochaApiKey(c.bochaApiKey || '');
                if (c.systemPrompt) {
                    setSystemPrompt(c.systemPrompt.replace(/\\n/g, '\n'));
                }

                setAuthMode(c.authRegistrationMode || 'username');
                setTencentSmsSecretId(c.tencentSmsSecretId || '');
                setTencentSmsSecretKey(c.tencentSmsSecretKey || '');
                setTencentSmsSdkAppId(c.tencentSmsSdkAppId || '');
                setTencentSmsSignName(c.tencentSmsSignName || '');
                setTencentSmsTemplateId(c.tencentSmsTemplateId || '');

                setSmtpHost(c.smtpHost || '');
                setSmtpPort(c.smtpPort || '587');
                setSmtpUser(c.smtpUser || '');
                setSmtpPass(c.smtpPass || '');
            }
        } catch (err) {
            console.error('Fetch config err:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    // Presets
    const presets = [
        {
            name: 'DeepSeek 官方',
            url: 'https://api.deepseek.com',
            defaultM: 'deepseek-chat',
            fastM: 'deepseek-chat',
            tag: '推荐 · 超高性价比'
        },
        {
            name: 'OpenAI Official',
            url: 'https://api.openai.com/v1',
            defaultM: 'gpt-4o',
            fastM: 'gpt-4o-mini',
            tag: '旗舰通用'
        },
        {
            name: '阿里通义千问',
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            defaultM: 'qwen-plus',
            fastM: 'qwen-turbo',
            tag: '国内低延迟'
        },
        {
            name: '硅基流动 SiliconFlow',
            url: 'https://api.siliconflow.cn/v1',
            defaultM: 'deepseek-ai/DeepSeek-V3',
            fastM: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
            tag: '算力矩阵'
        },
        {
            name: '智谱清言 GLM',
            url: 'https://open.bigmodel.cn/api/paas/v4',
            defaultM: 'glm-4-plus',
            fastM: 'glm-4-flash',
            tag: '清华系大模型'
        },
        {
            name: '月之暗面 Kimi',
            url: 'https://api.moonshot.cn/v1',
            defaultM: 'moonshot-v1-32k',
            fastM: 'moonshot-v1-8k',
            tag: '超长上下文'
        },
        {
            name: '本地网关 (Ollama)',
            url: 'http://localhost:11434/v1',
            defaultM: 'qwen2.5:7b',
            fastM: 'qwen2.5:1.5b',
            tag: '完全私有化离线'
        }
    ];

    const handleApplyPreset = (p: typeof presets[0]) => {
        setBaseUrl(p.url);
        setDefaultModel(p.defaultM);
        setFastModel(p.fastM);
        setTestResult(null);
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseUrl,
                    apiKey: apiKey || undefined,
                    model: defaultModel
                })
            });
            const data = await res.json();
            if (data.ok) {
                setTestResult({
                    ok: true,
                    message: data.message || `握手成功！服务响应延迟 ${data.latencyMs} ms`
                });
            } else {
                setTestResult({
                    ok: false,
                    message: data.error || '连通握手失败'
                });
            }
        } catch (err: any) {
            setTestResult({
                ok: false,
                message: err.message || '网络连接超时'
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleFetchModels = async () => {
        setFetchingModels(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/models`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.models) && data.models.length > 0) {
                setAvailableModels(data.models);
                alert(`🎉 成功从服务商远程拉取到 ${data.models.length} 个可用模型！`);
            } else {
                alert('未获取到可用模型列表：' + (data.error || '请先配置正确的 API Key'));
            }
        } catch (err) {
            console.error('Fetch models err:', err);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveSuccess(false);

        try {
            const payload: any = {
                baseUrl,
                defaultModel,
                fastModel,
                searchProvider,
                systemPrompt,
                authRegistrationMode: authMode,
                advancedAuthEnabled: authMode !== 'username',
                tencentSmsSecretId,
                tencentSmsSdkAppId,
                tencentSmsSignName,
                tencentSmsTemplateId,
                smtpHost,
                smtpPort,
                smtpUser
            };

            if (apiKey) payload.apiKey = apiKey;
            if (tavilyApiKey) payload.tavilyApiKey = tavilyApiKey;
            if (bochaApiKey) payload.bochaApiKey = bochaApiKey;
            if (tencentSmsSecretKey) payload.tencentSmsSecretKey = tencentSmsSecretKey;
            if (smtpPass) payload.smtpPass = smtpPass;

            const res = await fetch(`${API_BASE}/api/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                onConfigSaved?.();
            } else {
                alert('保存配置失败：' + (data.error || '未知错误'));
            }
        } catch (err: any) {
            alert('保存异常：' + (err.message || '网络连接错误'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSaveConfig} className="space-y-6 animate-in fade-in duration-300 pb-12">

            {/* Top Info Banner */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.35)]">
                        <Sliders size={22} />
                    </div>
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[16px] tracking-tight">
                            系统模型与引擎配置中心
                        </h3>
                        <p className="text-[11.5px] text-[#8a84a4]">
                            支持一键切换服务商预设 · 双模型协同分流 · 提示词热更新 · 联网搜索引擎与短信邮箱配置
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white text-[13px] font-bold shadow-[0_4px_14px_rgba(179,164,237,0.4)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {saveSuccess ? <CheckCircle2 size={16} className="text-white" /> : <Check size={16} />}
                        <span>{saving ? '正在写入环境配置...' : saveSuccess ? '配置已保存并立即生效' : '保存并应用新配置'}</span>
                    </button>
                </div>
            </div>

            {/* 1. Large Model Provider Presets Strip */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-3.5">
                <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#4a4365] flex items-center gap-1.5">
                        <Sparkles size={15} className="text-purple-600" /> 主流大模型服务商一键快捷预设
                    </span>
                    <span className="text-[11px] text-[#8a84a4]">点击卡片即可一键填充对应网关地址与推荐模型</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {presets.map((p) => {
                        const isCurrent = baseUrl === p.url;
                        return (
                            <div
                                key={p.name}
                                onClick={() => handleApplyPreset(p)}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${isCurrent
                                    ? 'bg-purple-50/90 border-purple-300 shadow-xs'
                                    : 'bg-[#fbf9fe] border-purple-50 hover:bg-white hover:border-purple-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#4a4365] text-[13px]">{p.name}</span>
                                    {isCurrent && <span className="text-[10px] font-bold text-purple-700 bg-purple-200/80 px-1.5 py-0.5 rounded-md">当前选中</span>}
                                </div>
                                <div className="text-[10px] font-mono text-purple-600 font-bold truncate">
                                    {p.defaultM}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                    {p.tag}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. AI Gateway & Dual Model Allocation */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                        <Server size={16} className="text-indigo-600" /> AI 网关地址与双模型协同分配
                    </h4>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleFetchModels}
                            disabled={fetchingModels}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11.5px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={fetchingModels ? 'animate-spin' : ''} />
                            {fetchingModels ? '拉取中...' : '拉取远程可用模型列表'}
                        </button>

                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11.5px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                            <Zap size={13} className={testingConnection ? 'animate-spin' : ''} />
                            {testingConnection ? '连通握手中...' : '连通性实时测试 (Test Connection)'}
                        </button>
                    </div>
                </div>

                {/* Test Result Bar */}
                {testResult && (
                    <div className={`p-3 rounded-2xl text-[12px] font-bold flex items-center gap-2 ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {testResult.ok ? <CheckCircle2 size={16} /> : <Zap size={16} />}
                        <span>{testResult.message}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Base URL */}
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5">
                            接口 Base URL
                        </label>
                        <input
                            type="text"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="如：https://api.deepseek.com"
                            className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8] transition-all"
                        />
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5">
                            API Key（若留空则保持服务端既有秘钥）
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-••••••••••••••••••••••••"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8] transition-all pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Default Model */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-[#4a4365]">
                                默认主对话模型 (<span className="font-mono text-purple-600">DEFAULT_MODEL</span>)
                            </label>
                            <span className="text-[10.5px] text-[#8a84a4]">用于考生核心问答</span>
                        </div>
                        {availableModels.length > 0 ? (
                            <select
                                value={defaultModel}
                                onChange={(e) => setDefaultModel(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono font-bold outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={defaultModel}
                                onChange={(e) => setDefaultModel(e.target.value)}
                                placeholder="如：deepseek-chat / gpt-4o"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        )}
                    </div>

                    {/* Fast Model */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-[#4a4365]">
                                快速处理模型 (<span className="font-mono text-indigo-600">FAST_MODEL</span>)
                            </label>
                            <span className="text-[10.5px] text-[#8a84a4]">用于文档语义切片与后台分析</span>
                        </div>
                        {availableModels.length > 0 ? (
                            <select
                                value={fastModel}
                                onChange={(e) => setFastModel(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono font-bold outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={fastModel}
                                onChange={(e) => setFastModel(e.target.value)}
                                placeholder="如：deepseek-chat / gpt-4o-mini"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 3. System Prompt Customization */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                        <Bot size={16} className="text-purple-600" /> AI 咨询顾问 Dr. Elena 系统提示词 (System Prompt) 自定义
                    </h4>
                    <button
                        type="button"
                        onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                    >
                        恢复默认提示词
                    </button>
                </div>
                <textarea
                    rows={5}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="请输入 Dr. Elena 咨询顾问人设、表达风格与决策规则..."
                    className="w-full bg-[#f8f6fc] rounded-2xl p-4 text-[12.5px] text-[#4a4365] leading-relaxed outline-none border border-transparent focus:border-[#a494e8] transition-all font-mono"
                />
            </div>

            {/* 4. Search Engine Configuration */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                    <Globe size={16} className="text-amber-500" /> 联网搜索引擎选配
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${(searchProvider === 'multi' || searchProvider === 'duckduckgo') ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="searchProvider"
                            checked={searchProvider === 'multi' || searchProvider === 'duckduckgo'}
                            onChange={() => setSearchProvider('multi')}
                            className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px] flex items-center gap-1.5">
                                多源智能容灾 <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-black">推荐</span>
                            </div>
                            <div className="text-[11px] text-[#8a84a4]">免 Key 必应直连 + DDG + 招生快照三级容灾</div>
                        </div>
                    </label>

                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${searchProvider === 'bing' ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="searchProvider"
                            checked={searchProvider === 'bing'}
                            onChange={() => setSearchProvider('bing')}
                            className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px]">必应全网 (Bing CN)</div>
                            <div className="text-[11px] text-[#8a84a4]">免 Key 国内毫秒级网页直连抓取</div>
                        </div>
                    </label>

                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${searchProvider === 'tavily' ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="searchProvider"
                            checked={searchProvider === 'tavily'}
                            onChange={() => setSearchProvider('tavily')}
                            className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px]">Tavily AI Search</div>
                            <div className="text-[11px] text-[#8a84a4]">AI 优化结构化搜索 (需 API Key)</div>
                        </div>
                    </label>

                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${searchProvider === 'bocha' ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="searchProvider"
                            checked={searchProvider === 'bocha'}
                            onChange={() => setSearchProvider('bocha')}
                            className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px]">博查 AI (Bocha)</div>
                            <div className="text-[11px] text-[#8a84a4]">国内政策与高校招生深度检索 (需 Key)</div>
                        </div>
                    </label>
                </div>

                {searchProvider === 'tavily' && (
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">Tavily API Key</label>
                        <input
                            type="password"
                            value={tavilyApiKey}
                            onChange={(e) => setTavilyApiKey(e.target.value)}
                            placeholder="tvly-••••••••••••••••"
                            className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>
                )}

                {searchProvider === 'bocha' && (
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">博查 API Key</label>
                        <input
                            type="password"
                            value={bochaApiKey}
                            onChange={(e) => setBochaApiKey(e.target.value)}
                            placeholder="bocha-••••••••••••••••"
                            className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[12.5px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>
                )}
            </div>

            {/* 5. Registration Mode & Security Channels */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" /> 考生注册方式与安全通道
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${authMode === 'username' ? 'bg-emerald-50/80 border-emerald-300' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="authMode"
                            checked={authMode === 'username'}
                            onChange={() => setAuthMode('username')}
                            className="mt-1 accent-emerald-600 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px]">普通账号密码</div>
                            <div className="text-[11px] text-[#8a84a4]">无需手机/邮箱验证码，直接注册</div>
                        </div>
                    </label>

                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${authMode === 'phone' ? 'bg-emerald-50/80 border-emerald-300' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="authMode"
                            checked={authMode === 'phone'}
                            onChange={() => setAuthMode('phone')}
                            className="mt-1 accent-emerald-600 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px]">手机短信验证码</div>
                            <div className="text-[11px] text-[#8a84a4]">基于腾讯云 SMS 验证注册</div>
                        </div>
                    </label>

                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${authMode === 'email' ? 'bg-emerald-50/80 border-emerald-300' : 'bg-[#fbf9fe] border-purple-50'}`}>
                        <input
                            type="radio"
                            name="authMode"
                            checked={authMode === 'email'}
                            onChange={() => setAuthMode('email')}
                            className="mt-1 accent-emerald-600 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px]">邮箱验证码注册</div>
                            <div className="text-[11px] text-[#8a84a4]">基于 SMTP 邮件服务发送验证码</div>
                        </div>
                    </label>
                </div>

                {/* SMS settings if phone */}
                {authMode === 'phone' && (
                    <div className="p-4 bg-[#fbf9fe] rounded-2xl border border-purple-100 space-y-3">
                        <div className="text-[12px] font-bold text-purple-800 flex items-center gap-1.5">
                            <Smartphone size={14} /> 腾讯云短信服务参数配置
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={tencentSmsSecretId}
                                onChange={(e) => setTencentSmsSecretId(e.target.value)}
                                placeholder="Tencent SMS SecretId"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                            <input
                                type="password"
                                value={tencentSmsSecretKey}
                                onChange={(e) => setTencentSmsSecretKey(e.target.value)}
                                placeholder="Tencent SMS SecretKey"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                            <input
                                type="text"
                                value={tencentSmsSdkAppId}
                                onChange={(e) => setTencentSmsSdkAppId(e.target.value)}
                                placeholder="SdkAppId (如 1400000000)"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                            <input
                                type="text"
                                value={tencentSmsSignName}
                                onChange={(e) => setTencentSmsSignName(e.target.value)}
                                placeholder="短信签名 (SignName)"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                        </div>
                    </div>
                )}

                {/* SMTP settings if email */}
                {authMode === 'email' && (
                    <div className="p-4 bg-[#fbf9fe] rounded-2xl border border-purple-100 space-y-3">
                        <div className="text-[12px] font-bold text-purple-800 flex items-center gap-1.5">
                            <Mail size={14} /> SMTP 邮箱服务配置
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={smtpHost}
                                onChange={(e) => setSmtpHost(e.target.value)}
                                placeholder="SMTP Host (如 smtp.qq.com / smtp.163.com)"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                            <input
                                type="text"
                                value={smtpPort}
                                onChange={(e) => setSmtpPort(e.target.value)}
                                placeholder="SMTP Port (如 465 / 587)"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                            <input
                                type="text"
                                value={smtpUser}
                                onChange={(e) => setSmtpUser(e.target.value)}
                                placeholder="邮箱账号 (如 admissions@gzhu.edu.cn)"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                            <input
                                type="password"
                                value={smtpPass}
                                onChange={(e) => setSmtpPass(e.target.value)}
                                placeholder="授权码 / 邮箱密码"
                                className="bg-white rounded-xl px-3.5 py-2 text-[12px] outline-none border border-purple-100"
                            />
                        </div>
                    </div>
                )}
            </div>

        </form>
    );
};
