import React, { useState, useEffect, useRef } from 'react';
import {
    Sliders, Sparkles, KeyRound, Globe, Server, Check,
    RefreshCw, Eye, EyeOff, ShieldCheck, Mail, Smartphone,
    Bot, MessageSquare, ArrowRight, Zap, CheckCircle2,
    Upload, Compass, Image as ImageIcon, Link as LinkIcon,
    Volume2, Mic, Play, Settings, Radio
} from 'lucide-react';
import { SettingsConfig, TTSPresetVoice } from '../../types';
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

    // 1. Agent Personas & Avatars (Dr & Lili)
    const [drName, setDrName] = useState('Dr. Elena');
    const [drTitle, setDrTitle] = useState('招生咨询顾问');
    const [drAvatar, setDrAvatar] = useState('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop');

    const [liliName, setLiliName] = useState('丽丽学姐');
    const [liliTitle, setLiliTitle] = useState('校园智能伴游');
    const [liliAvatar, setLiliAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop');

    const [uploadingDrAvatar, setUploadingDrAvatar] = useState(false);
    const [uploadingLiliAvatar, setUploadingLiliAvatar] = useState(false);
    const drFileInputRef = useRef<HTMLInputElement>(null);
    const liliFileInputRef = useRef<HTMLInputElement>(null);

    // 2. Gateway and Models
    const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com');
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    const [defaultModel, setDefaultModel] = useState('deepseek-chat');
    const [fastModel, setFastModel] = useState('deepseek-chat');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);

    // 3. Multi-Engine TTS Configuration States
    const [ttsEngine, setTtsEngine] = useState<'msedge' | 'onnx' | 'api' | 'web-speech'>('msedge');
    const [msedgeVoice, setMsedgeVoice] = useState('zh-CN-XiaoyiNeural');
    const [msedgeRate, setMsedgeRate] = useState('+0%');
    const [msedgePitch, setMsedgePitch] = useState('+0Hz');
    const [msedgeVolume, setMsedgeVolume] = useState('+0%');

    const [onnxModelPath, setOnnxModelPath] = useState('data/models/tts_vits_zh.onnx');
    const [onnxSpeed, setOnnxSpeed] = useState(1.0);
    const [onnxNoiseScale, setOnnxNoiseScale] = useState(0.667);
    const [onnxThreads, setOnnxThreads] = useState(4);

    const [ttsApiUrl, setTtsApiUrl] = useState('https://api.openai.com/v1');
    const [ttsApiKey, setTtsApiKey] = useState('');
    const [ttsApiModel, setTtsApiModel] = useState('tts-1');
    const [ttsApiVoice, setTtsApiVoice] = useState('nova');
    const [ttsApiSpeed, setTtsApiSpeed] = useState(1.0);

    const [testingTts, setTestingTts] = useState(false);
    const [ttsTestPhrase, setTtsTestPhrase] = useState('同学们好呀，我是你们的导览伴游丽丽学姐，欢迎来到广州大学！');

    // 4. Search Engine
    const [searchProvider, setSearchProvider] = useState<'multi' | 'bing' | 'tavily' | 'bocha' | 'duckduckgo' | 'none'>('multi');
    const [tavilyApiKey, setTavilyApiKey] = useState('');
    const [bochaApiKey, setBochaApiKey] = useState('');

    // 5. Registration Mode & Security Channels
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

    const MSEDGE_PRESET_VOICES: TTSPresetVoice[] = [
        { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (Xiaoyi)', desc: '青春活泼 · 女大学生 · 推荐', gender: '女' },
        { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (Xiaoxiao)', desc: '亲切知性 · 温柔自然', gender: '女' },
        { id: 'zh-CN-liaoning-XiaobeiNeural', name: '晓北 (Xiaobei)', desc: '东北风趣 · 幽默活力', gender: '女' },
        { id: 'zh-HK-HiuGaaiNeural', name: '晓佳 (HiuGaai)', desc: '粤语自然 · 广府特色', gender: '女' },
        { id: 'zh-CN-YunxiNeural', name: '云希 (Yunxi)', desc: '阳光少年 · 活力充沛', gender: '男' },
        { id: 'zh-CN-YunjianNeural', name: '云健 (Yunjian)', desc: '成熟稳重 · 磁性解说', gender: '男' },
        { id: 'zh-TW-HsiaoChenNeural', name: '晓臻 (HsiaoChen)', desc: '温婉甜美 · 台湾国语', gender: '女' }
    ];

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

            // Load Agent Avatars
            const agentRes = await fetch(`${API_BASE}/api/agent-config`);
            const agentData = await agentRes.json();
            if (agentData.ok && agentData.data) {
                if (agentData.data.dr) {
                    setDrName(agentData.data.dr.name || 'Dr. Elena');
                    setDrTitle(agentData.data.dr.title || '招生咨询顾问');
                    setDrAvatar(agentData.data.dr.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop');
                }
                if (agentData.data.lili) {
                    setLiliName(agentData.data.lili.name || '丽丽学姐');
                    setLiliTitle(agentData.data.lili.title || '校园智能伴游');
                    setLiliAvatar(agentData.data.lili.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop');
                }
            }

            // Load TTS Config
            const ttsRes = await fetch(`${API_BASE}/api/tts-config`);
            const ttsData = await ttsRes.json();
            if (ttsData.ok && ttsData.data) {
                const tc = ttsData.data;
                setTtsEngine(tc.engine || 'msedge');
                if (tc.msedge) {
                    setMsedgeVoice(tc.msedge.voice || 'zh-CN-XiaoyiNeural');
                    setMsedgeRate(tc.msedge.rate || '+0%');
                    setMsedgePitch(tc.msedge.pitch || '+0Hz');
                    setMsedgeVolume(tc.msedge.volume || '+0%');
                }
                if (tc.onnx) {
                    setOnnxModelPath(tc.onnx.modelPath || 'data/models/tts_vits_zh.onnx');
                    setOnnxSpeed(typeof tc.onnx.speed === 'number' ? tc.onnx.speed : 1.0);
                    setOnnxNoiseScale(typeof tc.onnx.noiseScale === 'number' ? tc.onnx.noiseScale : 0.667);
                    setOnnxThreads(typeof tc.onnx.threads === 'number' ? tc.onnx.threads : 4);
                }
                if (tc.api) {
                    setTtsApiUrl(tc.api.apiUrl || 'https://api.openai.com/v1');
                    setTtsApiKey(tc.api.apiKey || '');
                    setTtsApiModel(tc.api.model || 'tts-1');
                    setTtsApiVoice(tc.api.voice || 'nova');
                    setTtsApiSpeed(typeof tc.api.speed === 'number' ? tc.api.speed : 1.0);
                }
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

    // Presets for AI Providers
    const presets = [
        {
            name: 'DeepSeek 官方',
            url: 'https://api.deepseek.com',
            defaultM: 'deepseek-chat',
            fastM: 'deepseek-chat',
            tag: '推荐 · 超高性价比'
        },
        {
            name: '硅基流动 (SiliconFlow)',
            url: 'https://api.siliconflow.cn/v1',
            defaultM: 'deepseek-ai/DeepSeek-V3',
            fastM: 'deepseek-ai/DeepSeek-V3',
            tag: '国内高速大模型平台'
        },
        {
            name: 'OpenAI 官方',
            url: 'https://api.openai.com/v1',
            defaultM: 'gpt-4o',
            fastM: 'gpt-4o-mini',
            tag: '全球通用高性能'
        },
        {
            name: 'Ollama 本地大模型',
            url: 'http://localhost:11434/v1',
            defaultM: 'deepseek-r1:8b',
            fastM: 'llama3.2:3b',
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
                    message: `连通失败：${data.error || '无法连接该端点'}`
                });
            }
        } catch (err: any) {
            setTestResult({
                ok: false,
                message: `请求异常：${err.message || '网络连接被拒绝'}`
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleFetchModels = async () => {
        setFetchingModels(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/fetch-models`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baseUrl, apiKey: apiKey || undefined })
            });
            const data = await res.json();
            if (data.ok && Array.isArray(data.models) && data.models.length > 0) {
                setAvailableModels(data.models);
                setTestResult({
                    ok: true,
                    message: `成功从远程端点拉取到 ${data.models.length} 个可用模型！`
                });
            } else {
                setTestResult({
                    ok: false,
                    message: `获取失败：${data.error || '该服务端点不支持动态获取模型列表'}`
                });
            }
        } catch (err: any) {
            setTestResult({
                ok: false,
                message: `拉取异常：${err.message}`
            });
        } finally {
            setFetchingModels(false);
        }
    };

    // Avatar Upload Helper for Dr
    const handleDrAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingDrAvatar(true);
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
            const base64Data = loadEvent.target?.result as string;
            try {
                const res = await fetch(`${API_BASE}/api/user/upload-avatar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Data, filename: file.name })
                });
                const data = await res.json();
                if (data.ok && data.url) {
                    const fullUrl = data.url.startsWith('http') ? data.url : `${API_BASE}${data.url}`;
                    setDrAvatar(fullUrl);
                } else {
                    setDrAvatar(base64Data);
                }
            } catch {
                setDrAvatar(base64Data);
            } finally {
                setUploadingDrAvatar(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Avatar Upload Helper for Lili
    const handleLiliAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLiliAvatar(true);
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
            const base64Data = loadEvent.target?.result as string;
            try {
                const res = await fetch(`${API_BASE}/api/user/upload-avatar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Data, filename: file.name })
                });
                const data = await res.json();
                if (data.ok && data.url) {
                    const fullUrl = data.url.startsWith('http') ? data.url : `${API_BASE}${data.url}`;
                    setLiliAvatar(fullUrl);
                } else {
                    setLiliAvatar(base64Data);
                }
            } catch {
                setLiliAvatar(base64Data);
            } finally {
                setUploadingLiliAvatar(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Audition TTS Voice Synthesis
    const handleAuditionTTS = async () => {
        setTestingTts(true);
        try {
            const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: ttsTestPhrase,
                    engine: ttsEngine,
                    voice: ttsEngine === 'msedge' ? msedgeVoice : ttsApiVoice,
                    rate: msedgeRate,
                    pitch: msedgePitch,
                    options: {
                        apiUrl: ttsApiUrl,
                        apiKey: ttsApiKey,
                        model: ttsApiModel,
                        modelPath: onnxModelPath,
                        speed: ttsEngine === 'api' ? ttsApiSpeed : onnxSpeed
                    }
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const audio = new Audio(URL.createObjectURL(blob));
                await audio.play();
            } else {
                const err = await res.json().catch(() => ({ error: '语音合成失败' }));
                alert(`试听失败: ${err.error || '合成异常'}`);
            }
        } catch (err: any) {
            alert(`试听请求异常: ${err.message}`);
        } finally {
            setTestingTts(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveSuccess(false);

        try {
            // Save main gateway config
            const res = await fetch(`${API_BASE}/api/admin/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    baseUrl,
                    apiKey,
                    defaultModel,
                    fastModel,
                    searchProvider,
                    tavilyApiKey,
                    bochaApiKey,
                    systemPrompt,
                    authRegistrationMode: authMode,
                    tencentSmsSecretId,
                    tencentSmsSecretKey,
                    tencentSmsSdkAppId,
                    tencentSmsSignName,
                    tencentSmsTemplateId,
                    smtpHost,
                    smtpPort,
                    smtpUser,
                    smtpPass
                })
            });

            // Save Agent Personas & Avatars
            await fetch(`${API_BASE}/api/admin/agent-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dr: { name: drName, title: drTitle, avatar: drAvatar },
                    lili: { name: liliName, title: liliTitle, avatar: liliAvatar }
                })
            });

            // Save TTS Multi-Engine Config
            await fetch(`${API_BASE}/api/admin/tts-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    engine: ttsEngine,
                    msedge: {
                        voice: msedgeVoice,
                        rate: msedgeRate,
                        pitch: msedgePitch,
                        volume: msedgeVolume
                    },
                    onnx: {
                        modelPath: onnxModelPath,
                        speed: onnxSpeed,
                        noiseScale: onnxNoiseScale,
                        threads: onnxThreads
                    },
                    api: {
                        apiUrl: ttsApiUrl,
                        apiKey: ttsApiKey,
                        model: ttsApiModel,
                        voice: ttsApiVoice,
                        speed: ttsApiSpeed
                    }
                })
            });

            const data = await res.json();
            if (data.ok) {
                setSaveSuccess(true);
                onConfigSaved?.();
                setTimeout(() => setSaveSuccess(false), 3500);
            } else {
                alert(`保存失败：${data.error || '未知错误'}`);
            }
        } catch (err: any) {
            alert(`保存配置请求异常：${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header & Save Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100/80 pb-4">
                <div>
                    <h3 className="font-black text-[#4a4365] text-[18px] tracking-tight flex items-center gap-2">
                        <Sliders size={20} className="text-[#a494e8]" /> 全局系统配置与智能体形象定制
                    </h3>
                    <p className="text-[12px] text-[#7a7398] font-medium mt-0.5">
                        可视化管理 AI 网关、双模型协同分配、TTS 语音引擎 (Edge/ONNX/API) 与伴游形象
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {saveSuccess && (
                        <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                            <CheckCircle2 size={15} /> 全部配置已成功保存并立即生效！
                        </span>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#a494e8] hover:opacity-95 text-white font-bold text-[13px] shadow-[0_6px_20px_rgba(179,164,237,0.35)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                    >
                        <Check size={16} />
                        <span>{saving ? '保存中...' : '保存全部系统配置'}</span>
                    </button>
                </div>
            </div>

            {/* 1. AI Agent Personas & Avatar Customization Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                            <Bot size={18} className="text-purple-600" /> AI 智能体人设与头像形象定制 (Dr. 与 丽丽学姐)
                        </h4>
                        <p className="text-[11.5px] text-[#8a84a4] mt-0.5">
                            支持自定义招生百事通与导览学姐的头像（本地上传或网络 URL）、显示名称与头衔
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    
                    {/* Agent 1: Dr. Elena (广大招生导师) */}
                    <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 p-5 rounded-3xl border border-purple-100 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black text-purple-950 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-purple-600" />
                                <span>广大招生咨询顾问 (Dr.)</span>
                            </span>
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                                问答对话主角色
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Avatar Preview */}
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0 bg-purple-100">
                                <img
                                    src={drAvatar}
                                    alt="Dr. Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop";
                                    }}
                                />
                            </div>

                            <div className="flex-1 space-y-2">
                                <input
                                    ref={drFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleDrAvatarUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => drFileInputRef.current?.click()}
                                    disabled={uploadingDrAvatar}
                                    className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 text-[11.5px] font-bold rounded-xl border border-purple-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <Upload size={12} className={uploadingDrAvatar ? 'animate-bounce' : ''} />
                                    <span>{uploadingDrAvatar ? '上传中...' : '上传本地图片作为头像'}</span>
                                </button>

                                <div className="relative">
                                    <LinkIcon size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={drAvatar}
                                        onChange={(e) => setDrAvatar(e.target.value)}
                                        placeholder="或输入外部图片链接 URL..."
                                        className="w-full bg-white/90 border border-purple-100 rounded-xl pl-7 pr-2.5 py-1 text-[11px] text-[#4a4365] outline-none focus:ring-1 focus:ring-purple-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 mb-1 block">顾问名称</label>
                                <input
                                    type="text"
                                    value={drName}
                                    onChange={(e) => setDrName(e.target.value)}
                                    placeholder="如：Dr. Elena"
                                    className="w-full bg-white border border-purple-100 rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#4a4365] outline-none focus:ring-1 focus:ring-purple-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 mb-1 block">顾问头衔</label>
                                <input
                                    type="text"
                                    value={drTitle}
                                    onChange={(e) => setDrTitle(e.target.value)}
                                    placeholder="如：招生咨询专家"
                                    className="w-full bg-white border border-purple-100 rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#4a4365] outline-none focus:ring-1 focus:ring-purple-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Agent 2: 丽丽学姐 (校园导览伴游) */}
                    <div className="bg-gradient-to-br from-pink-50/60 via-white to-amber-50/40 p-5 rounded-3xl border border-pink-100 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-black text-pink-950 flex items-center gap-1.5">
                                <Compass size={14} className="text-pink-600" />
                                <span>校园智能伴游 (丽丽学姐)</span>
                            </span>
                            <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md">
                                地图导览与语音主角色
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Avatar Preview */}
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0 bg-pink-100">
                                <img
                                    src={liliAvatar}
                                    alt="Lili Avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";
                                    }}
                                />
                            </div>

                            <div className="flex-1 space-y-2">
                                <input
                                    ref={liliFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLiliAvatarUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => liliFileInputRef.current?.click()}
                                    disabled={uploadingLiliAvatar}
                                    className="px-3 py-1.5 bg-white hover:bg-pink-50 text-pink-700 text-[11.5px] font-bold rounded-xl border border-pink-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <Upload size={12} className={uploadingLiliAvatar ? 'animate-bounce' : ''} />
                                    <span>{uploadingLiliAvatar ? '上传中...' : '上传本地图片作为头像'}</span>
                                </button>

                                <div className="relative">
                                    <LinkIcon size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={liliAvatar}
                                        onChange={(e) => setLiliAvatar(e.target.value)}
                                        placeholder="或输入外部图片链接 URL..."
                                        className="w-full bg-white/90 border border-pink-100 rounded-xl pl-7 pr-2.5 py-1 text-[11px] text-[#4a4365] outline-none focus:ring-1 focus:ring-pink-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 mb-1 block">伴游名称</label>
                                <input
                                    type="text"
                                    value={liliName}
                                    onChange={(e) => setLiliName(e.target.value)}
                                    placeholder="如：丽丽学姐"
                                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#4a4365] outline-none focus:ring-1 focus:ring-pink-400"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 mb-1 block">伴游头衔</label>
                                <input
                                    type="text"
                                    value={liliTitle}
                                    onChange={(e) => setLiliTitle(e.target.value)}
                                    placeholder="如：校园智能伴游"
                                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-1.5 text-[12px] font-bold text-[#4a4365] outline-none focus:ring-1 focus:ring-pink-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. NEW: Multi-Engine TTS Voice Customization Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                            <Volume2 size={18} className="text-pink-600" /> 🎙️ 校园伴游语音合成 (TTS) 引擎与音色定制
                        </h4>
                        <p className="text-[11.5px] text-[#8a84a4] mt-0.5">
                            支持微软 Edge Neural 神经网络超拟真女声、本地 ONNX 离线模型与云端 API
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleAuditionTTS}
                            disabled={testingTts}
                            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-95 text-white text-[12px] font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <Play size={13} className={testingTts ? 'animate-spin' : ''} fill="currentColor" />
                            <span>{testingTts ? '合成试听中...' : '🔊 试听丽丽学姐发音'}</span>
                        </button>
                    </div>
                </div>

                {/* TTS Engine Selector (Radio Tabs) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Option 1: msedge */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${ttsEngine === 'msedge' ? 'bg-pink-50/80 border-pink-300 shadow-xs ring-2 ring-pink-400/20' : 'bg-[#fbf9fe] border-purple-50 hover:bg-white'}`}>
                        <input
                            type="radio"
                            name="ttsEngine"
                            checked={ttsEngine === 'msedge'}
                            onChange={() => setTtsEngine('msedge')}
                            className="mt-1 accent-pink-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px] flex items-center gap-1.5">
                                微软 Edge Neural <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-1.5 py-0.5 rounded">方案 1 · 推荐</span>
                            </div>
                            <div className="text-[11px] text-[#8a84a4]">免 Key 高保真神经网络女声 · 媲美真人女大</div>
                        </div>
                    </label>

                    {/* Option 2: onnx */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${ttsEngine === 'onnx' ? 'bg-indigo-50/80 border-indigo-300 shadow-xs ring-2 ring-indigo-400/20' : 'bg-[#fbf9fe] border-purple-50 hover:bg-white'}`}>
                        <input
                            type="radio"
                            name="ttsEngine"
                            checked={ttsEngine === 'onnx'}
                            onChange={() => setTtsEngine('onnx')}
                            className="mt-1 accent-indigo-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px] flex items-center gap-1.5">
                                本地 ONNX 离线模型 <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">方案 2</span>
                            </div>
                            <div className="text-[11px] text-[#8a84a4]">纯离线本地推理 · 0 网络外发依赖</div>
                        </div>
                    </label>

                    {/* Option 3: api */}
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${ttsEngine === 'api' ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-2 ring-amber-400/20' : 'bg-[#fbf9fe] border-purple-50 hover:bg-white'}`}>
                        <input
                            type="radio"
                            name="ttsEngine"
                            checked={ttsEngine === 'api'}
                            onChange={() => setTtsEngine('api')}
                            className="mt-1 accent-amber-500 cursor-pointer"
                        />
                        <div>
                            <div className="font-bold text-[#4a4365] text-[13px] flex items-center gap-1.5">
                                自定义 Cloud TTS API <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">方案 4</span>
                            </div>
                            <div className="text-[11px] text-[#8a84a4]">OpenAI / 硅基流动 / 豆包语音网关</div>
                        </div>
                    </label>
                </div>

                {/* Sub-Panel 1: msedge Configuration */}
                {ttsEngine === 'msedge' && (
                    <div className="bg-[#fbf9fe] p-4 sm:p-5 rounded-2xl border border-pink-100 space-y-4 animate-in fade-in">
                        <div className="text-[12px] font-bold text-pink-900 flex items-center gap-1.5">
                            <Mic size={14} className="text-pink-600" /> 微软 Neural 音色与声调微调
                        </div>

                        {/* Voice Presets Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {MSEDGE_PRESET_VOICES.map((v) => {
                                const isSelected = msedgeVoice === v.id;
                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => setMsedgeVoice(v.id)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-white border-pink-400 shadow-xs ring-1 ring-pink-400 font-bold text-pink-900'
                                                : 'bg-white/60 border-purple-50 hover:bg-white text-gray-700'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-[12px] font-bold flex items-center gap-1">
                                                <span>{v.name}</span>
                                                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${v.gender === '女' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {v.gender}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{v.desc}</div>
                                        </div>
                                        {isSelected && <Check size={14} className="text-pink-600 shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pitch & Rate Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">语速调整 (Rate)</label>
                                <select
                                    value={msedgeRate}
                                    onChange={(e) => setMsedgeRate(e.target.value)}
                                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-[12px] outline-none"
                                >
                                    <option value="-20%">较慢 (-20%)</option>
                                    <option value="-10%">稍慢 (-10%)</option>
                                    <option value="+0%">标准语速 (+0%) · 推荐</option>
                                    <option value="+10%">生动稍快 (+10%)</option>
                                    <option value="+20%">快速 (+20%)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">音调调整 (Pitch)</label>
                                <select
                                    value={msedgePitch}
                                    onChange={(e) => setMsedgePitch(e.target.value)}
                                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-[12px] outline-none"
                                >
                                    <option value="-10Hz">稍低沉 (-10Hz)</option>
                                    <option value="+0Hz">标准音调 (+0Hz)</option>
                                    <option value="+10Hz">甜美清脆 (+10Hz) · 推荐</option>
                                    <option value="+20Hz">高亮活力 (+20Hz)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">音量增益 (Volume)</label>
                                <select
                                    value={msedgeVolume}
                                    onChange={(e) => setMsedgeVolume(e.target.value)}
                                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-[12px] outline-none"
                                >
                                    <option value="+0%">标准音量 (+0%)</option>
                                    <option value="+15%">适度增强 (+15%)</option>
                                    <option value="+30%">高音量广播 (+30%)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-Panel 2: ONNX Configuration */}
                {ttsEngine === 'onnx' && (
                    <div className="bg-[#fbf9fe] p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in">
                        <div className="text-[12px] font-bold text-indigo-900 flex items-center gap-1.5">
                            <Settings size={14} className="text-indigo-600" /> 本地 ONNX 离线推理模型参数
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">ONNX 模型文件存放路径</label>
                                <input
                                    type="text"
                                    value={onnxModelPath}
                                    onChange={(e) => setOnnxModelPath(e.target.value)}
                                    placeholder="如：data/models/tts_vits_zh.onnx"
                                    className="w-full bg-white border border-indigo-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">语速倍率 (Speed)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.5"
                                    max="2.0"
                                    value={onnxSpeed}
                                    onChange={(e) => setOnnxSpeed(Number(e.target.value))}
                                    className="w-full bg-white border border-indigo-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">噪声因子 (Noise Scale: 0.1 ~ 1.0)</label>
                                <input
                                    type="number"
                                    step="0.05"
                                    min="0.1"
                                    max="1.0"
                                    value={onnxNoiseScale}
                                    onChange={(e) => setOnnxNoiseScale(Number(e.target.value))}
                                    className="w-full bg-white border border-indigo-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">CPU 推理线程数 (Threads)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="16"
                                    value={onnxThreads}
                                    onChange={(e) => setOnnxThreads(Number(e.target.value))}
                                    className="w-full bg-white border border-indigo-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-Panel 3: Cloud API Configuration */}
                {ttsEngine === 'api' && (
                    <div className="bg-[#fbf9fe] p-4 sm:p-5 rounded-2xl border border-amber-100 space-y-4 animate-in fade-in">
                        <div className="text-[12px] font-bold text-amber-900 flex items-center gap-1.5">
                            <Radio size={14} className="text-amber-600" /> 第三方 Cloud TTS API 接口配置 (OpenAI 协议兼容)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">API Base URL</label>
                                <input
                                    type="text"
                                    value={ttsApiUrl}
                                    onChange={(e) => setTtsApiUrl(e.target.value)}
                                    placeholder="如：https://api.openai.com/v1 或 https://api.siliconflow.cn/v1"
                                    className="w-full bg-white border border-amber-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">API Key</label>
                                <input
                                    type="password"
                                    value={ttsApiKey}
                                    onChange={(e) => setTtsApiKey(e.target.value)}
                                    placeholder="sk-••••••••••••••••"
                                    className="w-full bg-white border border-amber-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">模型名称 (Model)</label>
                                <input
                                    type="text"
                                    value={ttsApiModel}
                                    onChange={(e) => setTtsApiModel(e.target.value)}
                                    placeholder="如：tts-1 / tts-1-hd / cosyvoice-v1"
                                    className="w-full bg-white border border-amber-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-gray-600 block mb-1">发音人角色 (Voice)</label>
                                <input
                                    type="text"
                                    value={ttsApiVoice}
                                    onChange={(e) => setTtsApiVoice(e.target.value)}
                                    placeholder="如：nova / alloy / shimmer"
                                    className="w-full bg-white border border-amber-100 rounded-xl px-3.5 py-2 text-[12px] font-mono outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Model Presets Quick Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                        <Sparkles size={16} className="text-[#a494e8]" /> 主流大模型服务商一键配置预设 (One-Click Presets)
                    </h4>
                    <span className="text-[11px] text-[#8a84a4] font-medium">点击自动填入推荐参数</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {presets.map((p) => {
                        const isCurrent = baseUrl === p.url;
                        return (
                            <div
                                key={p.name}
                                onClick={() => handleApplyPreset(p)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                    isCurrent
                                        ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-300 shadow-xs ring-2 ring-purple-400/20'
                                        : 'bg-[#fbf9fe] border-purple-50 hover:bg-white hover:border-purple-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-black text-[13px] text-[#4a4365]">{p.name}</div>
                                    {isCurrent && <Check size={14} className="text-purple-600 font-bold" />}
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

            {/* 4. AI Gateway & Dual Model Allocation */}
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
                            className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5">
                            API Key (留空则沿用现有 Key)
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-••••••••••••••••"
                                className="w-full bg-[#f8f6fc] rounded-2xl pl-4 pr-10 py-2.5 text-[13px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4a4365]"
                            >
                                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dual Models */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Default Reasoning Model */}
                    <div className="bg-[#fbf9fe] p-4 rounded-2xl border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[12px] font-bold text-purple-900 flex items-center gap-1.5">
                                <Bot size={14} className="text-purple-600" /> 主力深度推理模型 (Default Model)
                            </label>
                            <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                                负责招生复杂问答与多轮 Agent
                            </span>
                        </div>
                        <input
                            type="text"
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                            placeholder="如：deepseek-chat / gpt-4o"
                            list="model-options"
                            className="w-full bg-white rounded-xl px-3.5 py-2 text-[12.5px] font-mono text-[#4a4365] outline-none border border-purple-100 focus:border-[#a494e8]"
                        />
                    </div>

                    {/* Fast Model */}
                    <div className="bg-[#fbf9fe] p-4 rounded-2xl border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[12px] font-bold text-purple-900 flex items-center gap-1.5">
                                <Zap size={14} className="text-amber-500" /> 高速轻量模型 (Fast Model)
                            </label>
                            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                                负责文档智能切片与轻量意图分类
                            </span>
                        </div>
                        <input
                            type="text"
                            value={fastModel}
                            onChange={(e) => setFastModel(e.target.value)}
                            placeholder="如：deepseek-chat / gpt-4o-mini"
                            list="model-options"
                            className="w-full bg-white rounded-xl px-3.5 py-2 text-[12.5px] font-mono text-[#4a4365] outline-none border border-purple-100 focus:border-[#a494e8]"
                        />
                    </div>

                    {/* Datalist for available models */}
                    <datalist id="model-options">
                        {availableModels.map(m => (
                            <option key={m} value={m} />
                        ))}
                    </datalist>
                </div>
            </div>

            {/* 5. Admissions AI Expert System Prompt */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                        <MessageSquare size={16} className="text-purple-600" /> 招生百事通全局人设提示词 (System Prompt)
                    </h4>
                    <button
                        type="button"
                        onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                        className="text-[11.5px] font-bold text-[#a494e8] hover:text-purple-700 transition-colors cursor-pointer"
                    >
                        恢复官方默认人设
                    </button>
                </div>

                <textarea
                    rows={6}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full bg-[#f8f6fc] rounded-2xl p-4 text-[12.5px] text-[#4a4365] leading-relaxed font-sans outline-none border border-transparent focus:border-[#a494e8]"
                />
            </div>

            {/* 6. Web Search Engine Selection */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-black text-[#4a4365] text-[15px] flex items-center gap-2">
                        <Globe size={16} className="text-amber-500" /> 招生实时联网搜索引擎模式
                    </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${searchProvider === 'multi' || searchProvider === 'duckduckgo' ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-[#fbf9fe] border-purple-50'}`}>
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
                            <div className="text-[11px] text-[#8a84a4]">百度图集 + 必应 + DDG 三级容灾</div>
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
                            <div className="text-[11px] text-[#8a84a4]">AI 优化结构化搜索 (需 Key)</div>
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
                            <div className="text-[11px] text-[#8a84a4]">国内政策与招生深度检索 (需 Key)</div>
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

            {/* 7. Registration Mode & Security Channels */}
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
