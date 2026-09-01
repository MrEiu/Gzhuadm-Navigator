import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Trash2, Edit3, Save, RefreshCw, Volume2, Sparkles, Check,
    AlertCircle, MessageSquare, Image, Sliders, Palette, Music, BookOpen,
    HelpCircle, Bot, Loader2, VolumeX, PackageCheck, SlidersHorizontal,
    CornerDownRight, Layers, Eye, CheckCircle2, BrainCircuit,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { AgentProfile, MultiAgentRoster, BubbleThemeId, BubbleCustomSettings } from '../../types';
import { BUBBLE_THEMES, DEFAULT_BUBBLE_SETTINGS } from '../../constants/bubbleThemes';
import { API_BASE } from '../../api/config';

const DEFAULT_VOICES = [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (温暖亲切女声)' },
    { id: 'zh-CN-YunxiNeural', name: '云希 (阳光活力男声)' },
    { id: 'zh-CN-YunjianNeural', name: '云健 (沉稳专业男声)' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (活泼热情女声)' },
    { id: 'zh-CN-YunyangNeural', name: '云扬 (新闻播报男声)' },
    { id: 'zh-CN-XiaohanNeural', name: '晓涵 (知性温柔女声)' }
];

const FALLBACK_DEFAULT_AGENTS: MultiAgentRoster = {
    dr: {
        key: 'dr',
        name: 'Dr. Elena',
        title: '首席招生咨询顾问',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#8b5cf6',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-XiaoxiaoNeural',
        systemPrompt: `你是广州大学首席招生咨询顾问 Dr. Elena。\n【身份特质】：专业、严谨、亲切、权威。\n【专精领域】：广州大学各省录取分数线、排位测算、志愿填报推荐、转专业政策框架、校方官方学费及资助。`
    },
    dorm: {
        key: 'dorm',
        name: '宿管张阿姨',
        title: '宿舍生活与安全管家',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#f97316',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-XiaoyiNeural',
        systemPrompt: `你是广州大学大学城校区学生宿舍楼栋宿管主管 张阿姨。\n【身份特质】：热心肠、接地气、关爱学生、注重用电消防安全与宿舍纪律。\n【专精领域】：限电 800W 规定、违章电器名录、23:30 锁门、宿舍报修。`
    },
    counselor: {
        key: 'counselor',
        name: '辅导员李导',
        title: '本科生年级辅导员',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#2563eb',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-YunjianNeural',
        systemPrompt: `你是广州大学本科生专职辅导员 李导。\n【身份特质】：负责、沉稳、严谨、关怀学生成长。\n【专精领域】：大一下转专业考核细则（GPA前30%）、学籍管理、综测评定、请假离校。`
    },
    senior_boy: {
        key: 'senior_boy',
        name: '学长浩哥',
        title: '计科大四学长 / 校园生活指南',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#10b981',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-YunxiNeural',
        systemPrompt: `你是广州大学计算机学院大四学长 浩哥。\n【身份特质】：热心、接地气、幽默、实战经验丰富。\n【专精领域】：手机 NFC 校园卡绑定、Dr.COM 校园网、菜鸟驿站、抢课避坑。`
    },
    senior_girl: {
        key: 'senior_girl',
        name: '学姐丽丽',
        title: '校园文旅探店 / 社团达人',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#ec4899',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-XiaohanNeural',
        systemPrompt: `你是广州大学大三学姐 丽丽。\n【身份特质】：活泼开朗、元气满满、热爱校园文化与美食。\n【专精领域】：大学城 GOGO 新天地美食探店、贝岗夜市、梁明诚雕塑园拍照打卡、社团百团大战。`
    }
};

export const MultiAgentTab: React.FC = () => {
    const [roster, setRoster] = useState<MultiAgentRoster>(FALLBACK_DEFAULT_AGENTS);
    const [selectedAgentKey, setSelectedAgentKey] = useState<string>('dorm');
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    // Profile Collapse State (折叠/展开智能体档案)
    const [isProfileCollapsed, setIsProfileCollapsed] = useState<boolean>(false);

    // Audio Test State
    const [testingVoice, setTestingVoice] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Deep Bubble Custom Settings State
    const [bubbleSettings, setBubbleSettings] = useState<BubbleCustomSettings>(() => {
        try {
            const savedSettings = localStorage.getItem('gzadm_bubble_settings');
            if (savedSettings) return JSON.parse(savedSettings);
            const savedTheme = localStorage.getItem('gzadm_bubble_theme');
            if (savedTheme) {
                return { ...DEFAULT_BUBBLE_SETTINGS, themeId: savedTheme as BubbleThemeId };
            }
        } catch { }
        return DEFAULT_BUBBLE_SETTINGS;
    });

    const [selectedGroup, setSelectedGroup] = useState<string>('@ant-design/x');

    const updateBubbleSetting = <K extends keyof BubbleCustomSettings>(key: K, val: BubbleCustomSettings[K]) => {
        const updated = { ...bubbleSettings, [key]: val };
        setBubbleSettings(updated);
        try {
            localStorage.setItem('gzadm_bubble_settings', JSON.stringify(updated));
            if (key === 'themeId') {
                localStorage.setItem('gzadm_bubble_theme', val as string);
            }
        } catch { }
    };

    const fetchRoster = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/agents-roster`);
            const data = await res.json();
            const loaded = data.data || data.agents || {};
            if (data.ok && Object.keys(loaded).length > 0) {
                setRoster(loaded);
                const keys = Object.keys(loaded);
                if (keys.length > 0) {
                    setSelectedAgentKey(prev => (keys.includes(prev) ? prev : keys[0]));
                }
            }
        } catch (err) {
            console.error('Fetch agents roster error, using fallback:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoster();
    }, []);

    const currentAgent: AgentProfile = roster[selectedAgentKey] || Object.values(roster)[0] || FALLBACK_DEFAULT_AGENTS.dorm;

    const updateCurrentAgent = (field: keyof AgentProfile, value: any) => {
        if (!currentAgent) return;
        setRoster(prev => ({
            ...prev,
            [selectedAgentKey]: {
                ...prev[selectedAgentKey],
                [field]: value
            }
        }));
    };

    const handleSaveRoster = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch(`${API_BASE}/api/admin/agents-roster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agents: roster })
            });
            const data = await res.json();
            if (data.ok) {
                setSaveSuccess(true);
                localStorage.setItem('gzadm_bubble_settings', JSON.stringify(bubbleSettings));
                localStorage.setItem('gzadm_bubble_theme', bubbleSettings.themeId);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                alert(data.error || '保存失败');
            }
        } catch (err) {
            console.error('Save agents roster failed:', err);
            alert('保存多智能体配置异常');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64Data = reader.result as string;
            try {
                const res = await fetch(`${API_BASE}/api/admin/upload-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Data, filename: file.name })
                });
                const data = await res.json();
                if (data.ok && data.attachment?.url) {
                    updateCurrentAgent('avatar', data.attachment.url);
                }
            } catch (err) {
                console.error('Avatar upload failed:', err);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleTestVoice = async () => {
        if (testingVoice) {
            audioRef.current?.pause();
            setTestingVoice(false);
            return;
        }

        if (!currentAgent) return;
        const testText = `你好！我是${currentAgent.name}，很高兴在广大新生群里为你解答问题！`;

        setTestingVoice(true);
        try {
            const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: testText,
                    voice: currentAgent.voice
                })
            });

            if (!res.ok) throw new Error('TTS Failed');
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => setTestingVoice(false);
            audio.onerror = () => setTestingVoice(false);
            await audio.play();
        } catch (err) {
            console.error('Voice preview error:', err);
            alert('发音试听失败，请检查语音合成服务');
            setTestingVoice(false);
        }
    };

    const agentKeys = Object.keys(roster);
    const themeConfig = BUBBLE_THEMES[bubbleSettings.themeId] || BUBBLE_THEMES.antdesign_filled || BUBBLE_THEMES.ios;

    const availableGroups = ['@ant-design/x', '@chatscope', '@assistant-ui', 'Apple iOS', 'Classic'];
    const filteredThemes = Object.values(BUBBLE_THEMES).filter(t => t.group === selectedGroup);

    return (
        <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            {/* Header Title & Save Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/80 shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Users size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#4a4365] tracking-tight">多智能体群聊管理与气泡深度定制工作台</h2>
                            <p className="text-xs text-[#8a84a4]">支持可视化定制 5 位 Agent 资料及 @ant-design/x、@chatscope、@assistant-ui 深度形态参数</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {saveSuccess && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-in zoom-in-95">
                            <Check size={14} /> 全员配置与气泡样式已保存！
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveRoster}
                        disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                        <span>保存全员配置与气泡</span>
                    </button>
                </div>
            </div>

            {/* Agent Selector Ribbon */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {agentKeys.map(key => {
                    const agent = roster[key];
                    if (!agent) return null;
                    const isSelected = selectedAgentKey === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedAgentKey(key)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all shrink-0 cursor-pointer ${
                                isSelected
                                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-400/20'
                                    : 'bg-white/70 border-white/80 hover:bg-white hover:border-purple-200'
                            }`}
                        >
                            <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="w-10 h-10 rounded-xl object-cover border border-white shadow-xs"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop";
                                }}
                            />
                            <div className="text-left">
                                <div className="font-black text-[13.5px] text-[#4a4365] flex items-center gap-1.5">
                                    <span>{agent.name}</span>
                                    <span
                                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                        style={{ backgroundColor: agent.bubbleColor }}
                                    />
                                </div>
                                <div className="text-[11px] text-[#8a84a4] font-medium">{agent.title}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Agent Profile (with collapse button) + Live Sandbox Preview (6 cols) */}
                <div className="lg:col-span-6 space-y-5">
                    {/* 1. Agent Profile Configuration Card (Collapsible) */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border border-white/80 shadow-sm space-y-4">
                        {/* Title bar with Collapse/Expand Button */}
                        <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                            <h3 className="text-[15px] font-black text-[#4a4365] flex items-center gap-2">
                                <Sliders size={17} className="text-purple-600" />
                                <span>智能体档案：{currentAgent.name}</span>
                            </h3>

                            <button
                                type="button"
                                onClick={() => setIsProfileCollapsed(!isProfileCollapsed)}
                                className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-100"
                            >
                                <span>{isProfileCollapsed ? '展开档案' : '折叠档案'}</span>
                                {isProfileCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        </div>

                        {/* Collapsed Summary Strip */}
                        {isProfileCollapsed ? (
                            <div className="p-3 bg-[#f8f6fc] rounded-2xl border border-purple-100/60 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                                <div className="flex items-center gap-2.5">
                                    <img
                                        src={currentAgent.avatar}
                                        alt={currentAgent.name}
                                        className="w-9 h-9 rounded-xl object-cover border border-purple-200 shadow-xs"
                                    />
                                    <div>
                                        <div className="font-black text-[#4a4365] flex items-center gap-1.5">
                                            <span>{currentAgent.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">
                                                {currentAgent.title}
                                            </span>
                                        </div>
                                        <div className="text-[10.5px] text-[#8a84a4] truncate max-w-[260px] mt-0.5">
                                            {currentAgent.systemPrompt?.slice(0, 45)}...
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span
                                        className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                                        style={{ backgroundColor: currentAgent.bubbleColor }}
                                        title={`Accent 色: ${currentAgent.bubbleColor}`}
                                    />
                                    <span className="text-[10.5px] text-[#6b6488] font-bold">
                                        {DEFAULT_VOICES.find(v => v.id === currentAgent.voice)?.name.split(' ')[0] || '默认语音'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            /* Expanded Full Profile Form */
                            <div className="space-y-4 animate-in fade-in">
                                {/* Name & Title */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="space-y-1">
                                        <label className="text-[11.5px] font-bold text-[#6b6488]">角色名称</label>
                                        <input
                                            type="text"
                                            value={currentAgent.name}
                                            onChange={(e) => updateCurrentAgent('name', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[13px] text-[#4a4365] font-bold focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11.5px] font-bold text-[#6b6488]">称号 / 身份头衔</label>
                                        <input
                                            type="text"
                                            value={currentAgent.title}
                                            onChange={(e) => updateCurrentAgent('title', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[13px] text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Avatar Settings */}
                                <div className="space-y-1.5">
                                    <label className="text-[11.5px] font-bold text-[#6b6488] flex items-center justify-between">
                                        <span>头像设置 (URL 或本地上传)</span>
                                        <span className="text-[10px] text-[#a494e8]">支持高清网络图片/本地图片</span>
                                    </label>
                                    <div className="flex items-center gap-2.5">
                                        <img
                                            src={currentAgent.avatar}
                                            alt="avatar preview"
                                            className="w-11 h-11 rounded-2xl object-cover border-2 border-purple-200 shadow-sm shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={currentAgent.avatar}
                                            onChange={(e) => updateCurrentAgent('avatar', e.target.value)}
                                            placeholder="https://... 头像网络地址"
                                            className="flex-1 px-3.5 py-2 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[11.5px] text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                        />
                                        <label className="px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11.5px] font-bold border border-purple-200 cursor-pointer shrink-0 transition-colors">
                                            <span>上传</span>
                                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                {/* Color & Voice Selection */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {/* Bubble Color */}
                                    <div className="space-y-1">
                                        <label className="text-[11.5px] font-bold text-[#6b6488] flex items-center gap-1">
                                            <Palette size={13} /> 专属身份 Accent 颜色
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={currentAgent.bubbleColor}
                                                onChange={(e) => updateCurrentAgent('bubbleColor', e.target.value)}
                                                className="w-9 h-9 rounded-xl border border-purple-100 cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={currentAgent.bubbleColor}
                                                onChange={(e) => updateCurrentAgent('bubbleColor', e.target.value)}
                                                className="flex-1 px-3 py-1.5 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[12px] text-[#4a4365] font-mono outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Voice Actor */}
                                    <div className="space-y-1">
                                        <label className="text-[11.5px] font-bold text-[#6b6488] flex items-center justify-between">
                                            <span className="flex items-center gap-1"><Music size={13} /> TTS 专属发音人</span>
                                            <button
                                                type="button"
                                                onClick={handleTestVoice}
                                                className="text-[10.5px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                {testingVoice ? <VolumeX size={12} className="text-red-500 animate-pulse" /> : <Volume2 size={12} />}
                                                <span>{testingVoice ? '停止' : '试听'}</span>
                                            </button>
                                        </label>
                                        <select
                                            value={currentAgent.voice}
                                            onChange={(e) => updateCurrentAgent('voice', e.target.value)}
                                            className="w-full px-3 py-2 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[12px] text-[#4a4365] font-medium outline-none focus:ring-2 focus:ring-purple-400"
                                        >
                                            {DEFAULT_VOICES.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* System Prompt Instructions */}
                                <div className="space-y-1 pt-1">
                                    <label className="text-[11.5px] font-bold text-[#6b6488] flex items-center justify-between">
                                        <span className="flex items-center gap-1"><Edit3 size={13} /> 专属 System Prompt</span>
                                        <span className="text-[10px] text-[#a494e8]">定义专属职责与详略规则</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={currentAgent.systemPrompt || ''}
                                        onChange={(e) => updateCurrentAgent('systemPrompt', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f8f6fc] border border-purple-100 text-[12px] text-[#4a4365] leading-relaxed focus:ring-2 focus:ring-purple-400 outline-none resize-y"
                                        placeholder="输入该智能体的系统提示词..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Live Sandbox Interactive Preview (Now placed prominently on the Left!) */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-3">
                        <h4 className="font-black text-[#4a4365] text-[13.5px] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Eye size={15} className="text-purple-600" />
                                实时群聊渲染沙盒 ({themeConfig.name})
                            </span>
                            <span className="text-[10px] text-[#8a84a4]">
                                参数即刻渲染
                            </span>
                        </h4>

                        <div className="bg-[#ede8f8]/60 p-4 rounded-3xl space-y-3 border border-purple-100/50">
                            {/* Simulated User Message */}
                            <div className="flex justify-end">
                                <div
                                    className={`text-[12.5px] px-4 py-2.5 max-w-[85%] ${themeConfig.userClass}`}
                                    style={{
                                        borderRadius: `${bubbleSettings.borderRadius}px`,
                                        ...(bubbleSettings.showTail ? { borderBottomRightRadius: '3px' } : {})
                                    }}
                                >
                                    请问在广州大学大学城校区，这方面有什么具体规章？
                                </div>
                            </div>

                            {/* Simulated Agent Reply */}
                            <div className="flex items-start gap-2.5">
                                <img
                                    src={currentAgent.avatar}
                                    alt={currentAgent.name}
                                    className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                                />
                                <div className="space-y-1.5 max-w-[85%]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-black text-[12px]" style={{ color: currentAgent.bubbleColor }}>
                                            {currentAgent.name}
                                        </span>
                                        <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-100">
                                            {currentAgent.title}
                                        </span>
                                    </div>

                                    {/* Optional Thought Chain Box Preview */}
                                    {bubbleSettings.showThinkingBox && (
                                        <div className="rounded-2xl border border-purple-100/90 bg-[#fbf9fe] p-2.5 text-[11px] text-[#7a7398] shadow-xs">
                                            <div className="flex items-center justify-between font-bold text-purple-700">
                                                <span className="flex items-center gap-1">
                                                    <BrainCircuit size={12} className="text-purple-600" />
                                                    <span>思考过程 (已检索 targetAgent: {currentAgent.key})</span>
                                                </span>
                                            </div>
                                            <div className="mt-1 text-[10px] text-[#6b6488] leading-tight">
                                                已锁定所属规章，正在以权威且亲切的口吻作答...
                                            </div>
                                        </div>
                                    )}

                                    {/* Bot Bubble */}
                                    <div
                                        className={`text-[12.5px] px-4 py-3 ${themeConfig.botClass} space-y-1.5`}
                                        style={{
                                            borderRadius: `${bubbleSettings.borderRadius}px`,
                                            ...(bubbleSettings.showTail ? { borderTopLeftRadius: '3px' } : {}),
                                            ...(bubbleSettings.accentBarWidth > 0
                                                ? { borderLeft: `${bubbleSettings.accentBarWidth}px solid ${currentAgent.bubbleColor}` }
                                                : {})
                                        }}
                                    >
                                        <div>同学你好！针对你咨询的问题，官方规章明确如下：</div>
                                        <div className="text-[11.5px] text-[#7a7398] bg-black/5 p-2 rounded-xl">
                                            📌 核心指引：请务必遵守校方条例，有疑问随时在群里 @ 我！
                                        </div>
                                        <div className="text-[11.5px] pt-0.5">
                                            祝你在广州大学学习生活愉快！✨
                                        </div>

                                        {/* Action Toolbar Preview */}
                                        {bubbleSettings.showActions && (
                                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5 text-[10px] text-gray-400">
                                                <span>复制</span>
                                                <span>·</span>
                                                <span>朗读</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Deep Bubble Customization Studio (6 cols) */}
                <div className="lg:col-span-6 space-y-5">
                    {/* Deep Customization Parameters Workbench */}
                    <div className="bg-white/85 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-purple-50 pb-2.5">
                            <h4 className="font-black text-[#4a4365] text-[14.5px] flex items-center gap-1.5">
                                <SlidersHorizontal size={17} className="text-purple-600" />
                                气泡组件库与形态深度自定义工坊
                            </h4>
                            <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                                实时生效
                            </span>
                        </div>

                        {/* UI Package Tabs (AntDesign, ChatScope, AssistantUI, iOS, Classic) */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-[#6b6488] uppercase tracking-wider">
                                1. 选择基础 UI 组件库体系
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {availableGroups.map(groupName => (
                                    <button
                                        key={groupName}
                                        type="button"
                                        onClick={() => setSelectedGroup(groupName)}
                                        className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                                            selectedGroup === groupName
                                                ? 'bg-purple-600 text-white shadow-xs'
                                                : 'bg-[#f4f0fa] text-[#6b6488] hover:bg-white hover:text-purple-700'
                                        }`}
                                    >
                                        {groupName}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Variant Shapes Grid */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-[#6b6488] uppercase tracking-wider">
                                2. 选择该体系下的子变体形态 (Variants)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {filteredThemes.map((theme) => {
                                    const isSelected = bubbleSettings.themeId === theme.id;
                                    return (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => updateBubbleSetting('themeId', theme.id)}
                                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-purple-50/90 border-purple-600 shadow-xs ring-1 ring-purple-400'
                                                    : 'bg-[#faf8fd] border-purple-100 hover:bg-white hover:border-purple-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-base">{theme.icon}</span>
                                                {isSelected && <CheckCircle2 size={14} className="text-purple-600" />}
                                            </div>
                                            <div className="font-black text-[11.5px] text-[#4a4365] mt-1 truncate">
                                                {theme.name.split(' - ')[1] || theme.name}
                                            </div>
                                            <div className="text-[9px] text-[#8a84a4] line-clamp-1 mt-0.5">
                                                {theme.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Fine-Tuning Parameter Sliders & Toggles */}
                        <div className="space-y-3 pt-2 border-t border-purple-50">
                            <label className="text-[11px] font-black text-[#6b6488] uppercase tracking-wider">
                                3. 气泡微观形态参数微调
                            </label>

                            {/* Slider 1: Border Radius */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-[#6b6488]">
                                    <span>圆角曲率 (Border Radius)</span>
                                    <span className="text-purple-600">{bubbleSettings.borderRadius}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={8}
                                    max={32}
                                    step={2}
                                    value={bubbleSettings.borderRadius}
                                    onChange={(e) => updateBubbleSetting('borderRadius', Number(e.target.value))}
                                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-purple-100 rounded-lg"
                                />
                            </div>

                            {/* Slider 2: Accent Bar Width */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold text-[#6b6488]">
                                    <span>左侧身份色指示条 (Accent Bar)</span>
                                    <span className="text-purple-600">{bubbleSettings.accentBarWidth}px</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={6}
                                    step={0.5}
                                    value={bubbleSettings.accentBarWidth}
                                    onChange={(e) => updateBubbleSetting('accentBarWidth', Number(e.target.value))}
                                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-purple-100 rounded-lg"
                                />
                            </div>

                            {/* Toggle Switches */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => updateBubbleSetting('showTail', !bubbleSettings.showTail)}
                                    className={`p-2 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer text-center ${
                                        bubbleSettings.showTail
                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                            : 'bg-[#faf8fd] text-gray-500 border-purple-100'
                                    }`}
                                >
                                    拟真尖角: {bubbleSettings.showTail ? '开启' : '关闭'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateBubbleSetting('showActions', !bubbleSettings.showActions)}
                                    className={`p-2 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer text-center ${
                                        bubbleSettings.showActions
                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                            : 'bg-[#faf8fd] text-gray-500 border-purple-100'
                                    }`}
                                >
                                    悬浮操作栏: {bubbleSettings.showActions ? '开启' : '关闭'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => updateBubbleSetting('showThinkingBox', !bubbleSettings.showThinkingBox)}
                                    className={`p-2 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer text-center ${
                                        bubbleSettings.showThinkingBox
                                            ? 'bg-purple-100 text-purple-700 border-purple-300'
                                            : 'bg-[#faf8fd] text-gray-500 border-purple-100'
                                    }`}
                                >
                                    思考链框: {bubbleSettings.showThinkingBox ? '开启' : '关闭'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
