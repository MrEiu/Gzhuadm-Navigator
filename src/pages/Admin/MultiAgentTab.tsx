import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Trash2, Edit3, Save, RefreshCw, Volume2, Sparkles, Check,
    AlertCircle, MessageSquare, Image, Sliders, Palette, Music, BookOpen,
    HelpCircle, Bot, Loader2, VolumeX, PackageCheck, SlidersHorizontal,
    CornerDownRight, Layers, Eye, CheckCircle2, BrainCircuit,
    ChevronDown, ChevronUp, BarChart3, ShieldAlert, Briefcase, Building2,
    GraduationCap, Shuffle, Home, Coins, HeartHandshake, Play, MapPin, Tag,
    ToggleLeft, ToggleRight, RotateCcw
} from 'lucide-react';
import { AgentProfile, MultiAgentRoster, BubbleThemeId, BubbleCustomSettings, ThoughtCloneConfig } from '../../types';
import { BUBBLE_THEMES, DEFAULT_BUBBLE_SETTINGS } from '../../constants/bubbleThemes';
import { THOUGHT_CLONES_CATALOG } from '../../constants/thoughtClones';
import { API_BASE } from '../../api/config';

const DEFAULT_VOICES = [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (温暖亲切女声)' },
    { id: 'zh-CN-YunxiNeural', name: '云希 (阳光活力男声)' },
    { id: 'zh-CN-YunjianNeural', name: '云健 (沉稳专业男声)' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (活泼热情女声)' },
    { id: 'zh-CN-YunyangNeural', name: '云扬 (新闻播报男声)' },
    { id: 'zh-CN-XiaohanNeural', name: '晓涵 (知性温柔女声)' }
];

const PRESET_COLOR_PALETTES = [
    '#8b5cf6', '#ec4899', '#0284c7', '#2563eb', '#4f46e5',
    '#059669', '#d97706', '#db2777', '#ca8a04', '#0d9488',
    '#ef4444', '#6366f1', '#14b8a6', '#f59e0b'
];

const CORE_FALLBACK_AGENTS: MultiAgentRoster = {
    dr: {
        key: 'dr',
        name: 'Dr. Elena',
        title: '首席招生咨询顾问',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
        bubbleColor: '#8b5cf6',
        bubbleTextColor: '#ffffff',
        voice: 'zh-CN-XiaoxiaoNeural',
        systemPrompt: `你是广州大学首席招生咨询顾问 Dr. Elena。\n【身份特质】：专业、严谨、亲切、权威。\n【专精领域】：广州大学各省录取分数线、排位测算、志愿填报推荐、转专业政策框架、校方官方学费及资助。\n【详略规则】：\n- 遇到招生、专业选拔、分数排位、学费等本专业问题，给出详尽、严谨、结构化的分析。\n- 语言得体、专业亲切，条理清晰地为考生和家长解答。`
    }
};

export const MultiAgentTab: React.FC = () => {
    // Top Active Tab
    const [subTab, setSubTab] = useState<'clones' | 'core_agents' | 'bubble_skin'>('clones');

    // --- 1. Thought Clones / Decision Agents State ---
    const [clonesState, setClonesState] = useState<Record<string, ThoughtCloneConfig>>(() => {
        const initial: Record<string, ThoughtCloneConfig> = {};
        THOUGHT_CLONES_CATALOG.forEach(c => {
            initial[c.id] = {
                roleId: c.id,
                name: c.name,
                tag: c.tag,
                color: c.color,
                icon: c.icon,
                description: c.description,
                keywords: [...c.defaultKeywords],
                systemPrompt: c.defaultPrompt,
                enabled: true,
                isCustom: false
            };
        });
        return initial;
    });

    const [selectedCloneId, setSelectedCloneId] = useState<string>('score_risk');
    const [newKeywordInput, setNewKeywordInput] = useState<string>('');
    const [cloneTestingQuery, setCloneTestingQuery] = useState<string>('计算机专业好就业吗？大概能拿多少月薪？');
    const [cloneTestingResult, setCloneTestingResult] = useState<string>('');
    const [cloneTestingLoading, setCloneTestingLoading] = useState<boolean>(false);

    // --- 2. Core Entities (Dr. Elena & Lili) State ---
    const [coreAgents, setCoreAgents] = useState<MultiAgentRoster>(CORE_FALLBACK_AGENTS);
    const [selectedCoreKey, setSelectedCoreKey] = useState<'dr' | 'senior_girl'>('dr');

    // General Status
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    // Audio Test State
    const [testingVoice, setTestingVoice] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- 3. Bubble Skin Settings State ---
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

    // Fetch initial data
    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Thought Clones
            const resClones = await fetch(`${API_BASE}/api/admin/thought-clones`);
            const dataClones = await resClones.json();
            if (dataClones.ok && dataClones.clones && typeof dataClones.clones === 'object') {
                setClonesState(dataClones.clones);
                const keys = Object.keys(dataClones.clones);
                if (keys.length > 0 && !dataClones.clones[selectedCloneId]) {
                    setSelectedCloneId(keys[0]);
                }
            }

            // 2. Fetch Core Agents
            const resAgents = await fetch(`${API_BASE}/api/admin/agents-config`);
            const dataAgents = await resAgents.json();
            if (dataAgents.ok && dataAgents.agents) {
                setCoreAgents(prev => ({ ...prev, ...dataAgents.agents }));
            }
        } catch (err) {
            console.warn('Failed to load multi-agent data from server:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Create New Custom Agent / Thought Clone
    const handleCreateNewClone = () => {
        const uniqueId = `agent_${Date.now().toString(36)}`;
        const randomColor = PRESET_COLOR_PALETTES[Math.floor(Math.random() * PRESET_COLOR_PALETTES.length)];
        const newClone: ThoughtCloneConfig = {
            roleId: uniqueId,
            name: '新专业决策分身',
            tag: '✨ 新决策域',
            color: randomColor,
            icon: 'Sparkles',
            description: '专注于新领域的专业研判内核',
            keywords: ['新增领域', '专业特点'],
            systemPrompt: '你是专注【新领域】的审视内核。请基于考生背景与目标专业给出客观、精准的核心研判。\n【要求】：直接输出2句话核心研判，严禁废话与问候，字数<=60字。',
            enabled: true,
            isCustom: true
        };

        setClonesState(prev => ({
            ...prev,
            [uniqueId]: newClone
        }));
        setSelectedCloneId(uniqueId);
    };

    // Delete a Clone
    const handleDeleteClone = (cloneId: string) => {
        const clone = clonesState[cloneId];
        if (!confirm(`确定要彻底删除决策分身【${clone?.name || cloneId}】吗？`)) return;

        const updated = { ...clonesState };
        delete updated[cloneId];
        setClonesState(updated);

        const remainingKeys = Object.keys(updated);
        if (remainingKeys.length > 0) {
            setSelectedCloneId(remainingKeys[0]);
        }
    };

    // Reset All Clones to Defaults
    const handleResetAllClones = () => {
        if (!confirm('确定要重置并恢复系统默认预置的决策智能体矩阵吗？自定义的分身将被清除。')) return;
        const initial: Record<string, ThoughtCloneConfig> = {};
        THOUGHT_CLONES_CATALOG.forEach(c => {
            initial[c.id] = {
                roleId: c.id,
                name: c.name,
                tag: c.tag,
                color: c.color,
                icon: c.icon,
                description: c.description,
                keywords: [...c.defaultKeywords],
                systemPrompt: c.defaultPrompt,
                enabled: true,
                isCustom: false
            };
        });
        setClonesState(initial);
        setSelectedCloneId('score_risk');
    };

    // Save Thought Clones
    const handleSaveClones = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/thought-clones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clones: clonesState })
            });
            const data = await res.json();
            if (data.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            } else {
                alert('保存决策智能体矩阵失败：' + (data.error || '未知错误'));
            }
        } catch (err: any) {
            alert('保存决策智能体请求异常：' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Save Core Agents
    const handleSaveCoreAgents = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/agents-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agents: coreAgents })
            });
            const data = await res.json();
            if (data.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            } else {
                alert('保存核心角色失败：' + (data.error || '未知错误'));
            }
        } catch (err: any) {
            alert('保存核心角色请求异常：' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Test Thought Clone Output
    const handleTestCloneReasoning = async () => {
        if (!cloneTestingQuery.trim()) return;
        setCloneTestingLoading(true);
        setCloneTestingResult('');
        try {
            const currentClone = clonesState[selectedCloneId];
            const prompt = `${currentClone?.systemPrompt || ''}\n\n【考生提问】：${cloneTestingQuery}\n\n请直接输出 1~2 句话的核心硬核研判（字数必须 <= 60 字，严禁客套）：`;

            const res = await fetch(`${API_BASE}/api/admin/test-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, userQuery: cloneTestingQuery })
            });
            const data = await res.json();
            if (data.ok && data.reply) {
                setCloneTestingResult(data.reply);
            } else if (data.reply) {
                setCloneTestingResult(data.reply);
            } else {
                setCloneTestingResult(`研判模拟：建议针对 ${currentClone?.name || '该专业'} 结合考生分数段及历年最低位次进行审慎评估。`);
            }
        } catch (e: any) {
            const currentClone = clonesState[selectedCloneId];
            setCloneTestingResult(`[模拟推演输出] 基于${currentClone?.name || '专家'}视角：大湾区岗位储备充足，建议关注目标专业梯队与考公/考研双轨规划。`);
        } finally {
            setCloneTestingLoading(false);
        }
    };

    // Audio Test
    const handleTestVoice = async (voiceId: string, testText: string) => {
        setTestingVoice(true);
        try {
            const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: testText, voice: voiceId })
            });
            if (res.ok) {
                const blob = await res.blob();
                const audioUrl = URL.createObjectURL(blob);
                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.play();
                }
            } else {
                console.warn('TTS API error');
            }
        } catch (err) {
            console.error('Voice test failed:', err);
        } finally {
            setTestingVoice(false);
        }
    };

    const currentCloneConfig: ThoughtCloneConfig = clonesState[selectedCloneId] || {
        roleId: selectedCloneId,
        name: '未命名分身',
        tag: '✨ 决策分身',
        color: '#8b5cf6',
        keywords: ['专业'],
        systemPrompt: '你是专注该领域的决策内核。',
        enabled: true
    };

    const currentCoreAgent = coreAgents[selectedCoreKey] || CORE_FALLBACK_AGENTS[selectedCoreKey];

    const getIconComponent = (iconName?: string) => {
        switch (iconName) {
            case 'BarChart3': return <BarChart3 size={17} />;
            case 'ShieldAlert': return <ShieldAlert size={17} />;
            case 'Briefcase': return <Briefcase size={17} />;
            case 'Building2': return <Building2 size={17} />;
            case 'GraduationCap': return <GraduationCap size={17} />;
            case 'BookOpen': return <BookOpen size={17} />;
            case 'Shuffle': return <Shuffle size={17} />;
            case 'Home': return <Home size={17} />;
            case 'Coins': return <Coins size={17} />;
            case 'HeartHandshake': return <HeartHandshake size={17} />;
            default: return <Sparkles size={17} />;
        }
    };

    const cloneList = Object.values(clonesState);

    return (
        <div className="space-y-6">
            <audio ref={audioRef} className="hidden" />

            {/* Header with Navigation Switcher */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[19px] flex items-center gap-2">
                            <BrainCircuit size={22} className="text-purple-600" /> 多智能体决策矩阵与思维分身工坊
                        </h3>
                        <p className="text-[12.5px] text-[#8a84a4] mt-1">
                            支持动态新建、扩充与配置决策智能体矩阵，协同首席高招顾问 Dr. Elena 统领推演
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Sub Tab Switcher */}
                        <div className="inline-flex p-1 bg-[#f5f1fc] rounded-2xl border border-purple-100 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setSubTab('clones')}
                                className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    subTab === 'clones'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-[#7a7398] hover:text-[#4a4365]'
                                }`}
                            >
                                <BrainCircuit size={15} />
                                <span>决策智能体矩阵 ({cloneList.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubTab('core_agents')}
                                className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    subTab === 'core_agents'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-[#7a7398] hover:text-[#4a4365]'
                                }`}
                            >
                                <Users size={15} />
                                <span>首席顾问配置 (Dr. Elena)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubTab('bubble_skin')}
                                className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    subTab === 'bubble_skin'
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-[#7a7398] hover:text-[#4a4365]'
                                }`}
                            >
                                <Palette size={15} />
                                <span>气泡皮肤与微调</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={fetchAllData}
                            disabled={loading}
                            className="p-2.5 rounded-2xl bg-[#f8f6fc] text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer"
                            title="刷新配置"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: 决策智能体矩阵与分身工坊 (Thought Clones Workshop) */}
            {subTab === 'clones' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Dynamic Clones Selector List */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[12px] font-bold text-[#8a84a4] uppercase tracking-wider">
                                决策智能体列表 ({cloneList.length})
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleCreateNewClone}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                                >
                                    <Plus size={13} />
                                    <span>新建分身</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetAllClones}
                                    className="p-1.5 rounded-xl bg-[#f8f6fc] text-gray-500 hover:text-purple-600 text-[11px] font-bold transition-colors cursor-pointer"
                                    title="恢复默认矩阵"
                                >
                                    <RotateCcw size={13} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
                            {cloneList.map((clone) => {
                                const isSelected = selectedCloneId === clone.roleId;
                                const isEnabled = clone.enabled !== false;

                                return (
                                    <div
                                        key={clone.roleId}
                                        className={`w-full p-3.5 rounded-2xl border transition-all flex items-center gap-3 relative ${
                                            isSelected
                                                ? 'bg-white border-purple-400 shadow-[0_8px_20px_rgba(168,85,247,0.18)] translate-x-1'
                                                : 'bg-white/70 hover:bg-white border-white/80 hover:border-purple-200 shadow-2xs'
                                        } ${!isEnabled ? 'opacity-60 bg-gray-50/70' : ''}`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCloneId(clone.roleId)}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white cursor-pointer"
                                            style={{ backgroundColor: clone.color || '#8b5cf6' }}
                                        >
                                            {getIconComponent(clone.icon)}
                                        </button>

                                        <div
                                            onClick={() => setSelectedCloneId(clone.roleId)}
                                            className="flex-1 min-w-0 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="text-[13px] font-bold text-[#4a4365] truncate flex items-center gap-1.5">
                                                    <span>{clone.name}</span>
                                                    {clone.isCustom && (
                                                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                                            自定义
                                                        </span>
                                                    )}
                                                </div>
                                                <span
                                                    className="text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 text-white shadow-2xs"
                                                    style={{ backgroundColor: clone.color || '#8b5cf6' }}
                                                >
                                                    {clone.tag}
                                                </span>
                                            </div>
                                            <div className="text-[10.5px] text-[#8a84a4] truncate mt-0.5">
                                                {clone.description || (clone.keywords ? clone.keywords.slice(0, 4).join(', ') : '专业决策内核')}
                                            </div>
                                        </div>

                                        {/* Toggle Active Switch */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setClonesState(prev => ({
                                                    ...prev,
                                                    [clone.roleId]: { ...clone, enabled: !isEnabled }
                                                }));
                                            }}
                                            className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                                                isEnabled ? 'text-purple-600 hover:text-purple-800' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                            title={isEnabled ? '已启用（点击停用）' : '已停用（点击启用）'}
                                        >
                                            {isEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Selected Clone Detailed Editor & Testing Console */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-5">
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-50">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                                        style={{ backgroundColor: currentCloneConfig.color || '#8b5cf6' }}
                                    >
                                        {getIconComponent(currentCloneConfig.icon)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-[#4a4365] text-[17px]">
                                                {currentCloneConfig.name}
                                            </h4>
                                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-100">
                                                {currentCloneConfig.roleId}
                                            </span>
                                            {currentCloneConfig.enabled === false && (
                                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-bold">
                                                    已停用
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11.5px] text-[#8a84a4] mt-0.5">
                                            {currentCloneConfig.description || '协同多智能体并发研判，提供专业维度的决策支撑'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {cloneList.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteClone(selectedCloneId)}
                                            className="flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-[12px] font-bold transition-all cursor-pointer shrink-0"
                                            title="删除此分身"
                                        >
                                            <Trash2 size={15} />
                                            <span>删除分身</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSaveClones}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        <span>{saveSuccess ? '已保存！' : '保存矩阵配置'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Name, Tag & Color Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1">
                                        分身展示名称
                                    </label>
                                    <input
                                        type="text"
                                        value={currentCloneConfig.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setClonesState(prev => ({
                                                ...prev,
                                                [selectedCloneId]: { ...currentCloneConfig, name: val }
                                            }));
                                        }}
                                        className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#4a4365] outline-none border border-transparent focus:border-purple-300"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1">
                                        单行胶囊展示标签 (Tag)
                                    </label>
                                    <input
                                        type="text"
                                        value={currentCloneConfig.tag}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setClonesState(prev => ({
                                                ...prev,
                                                [selectedCloneId]: { ...currentCloneConfig, tag: val }
                                            }));
                                        }}
                                        className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] font-bold text-purple-700 outline-none border border-transparent focus:border-purple-300"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1">
                                        代表强调色彩
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={currentCloneConfig.color || '#8b5cf6'}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setClonesState(prev => ({
                                                    ...prev,
                                                    [selectedCloneId]: { ...currentCloneConfig, color: val }
                                                }));
                                            }}
                                            className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <div className="flex flex-wrap gap-1 flex-1">
                                            {PRESET_COLOR_PALETTES.slice(0, 6).map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => {
                                                        setClonesState(prev => ({
                                                            ...prev,
                                                            [selectedCloneId]: { ...currentCloneConfig, color: c }
                                                        }));
                                                    }}
                                                    className="w-5 h-5 rounded-full border border-white shadow-2xs cursor-pointer hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Trigger Keywords Pills */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[11.5px] font-bold text-[#4a4365] flex items-center gap-1">
                                        <Tag size={13} className="text-purple-600" /> 意图触发关键词列表 (Hits)
                                    </label>
                                    <span className="text-[10.5px] text-gray-400">
                                        命中此列表中词汇时，系统将动态唤醒本分身参与研判
                                    </span>
                                </div>

                                <div className="p-3 bg-[#f8f6fc] rounded-2xl border border-purple-50 flex flex-wrap gap-2 items-center min-h-[50px]">
                                    {(currentCloneConfig.keywords || []).map((kw, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-purple-200/80 text-[11.5px] font-bold text-[#4a4365] shadow-2xs"
                                        >
                                            <span>{kw}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updatedKw = currentCloneConfig.keywords.filter((_, i) => i !== idx);
                                                    setClonesState(prev => ({
                                                        ...prev,
                                                        [selectedCloneId]: { ...currentCloneConfig, keywords: updatedKw }
                                                    }));
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}

                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={newKeywordInput}
                                            onChange={(e) => setNewKeywordInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newKeywordInput.trim()) {
                                                    e.preventDefault();
                                                    const kw = newKeywordInput.trim();
                                                    if (!currentCloneConfig.keywords.includes(kw)) {
                                                        const updated = [...currentCloneConfig.keywords, kw];
                                                        setClonesState(prev => ({
                                                            ...prev,
                                                            [selectedCloneId]: { ...currentCloneConfig, keywords: updated }
                                                        }));
                                                    }
                                                    setNewKeywordInput('');
                                                }
                                            }}
                                            placeholder="+ 输入词按回车添加..."
                                            className="bg-transparent px-2 py-1 text-[11.5px] text-[#4a4365] outline-none placeholder:text-gray-400 min-w-[120px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* System Prompt */}
                            <div>
                                <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1">
                                    专业审视人设与研判指令 (System Prompt)
                                </label>
                                <textarea
                                    value={currentCloneConfig.systemPrompt}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setClonesState(prev => ({
                                            ...prev,
                                            [selectedCloneId]: { ...currentCloneConfig, systemPrompt: val }
                                        }));
                                    }}
                                    rows={4}
                                    className="w-full bg-[#f8f6fc] rounded-2xl p-4 text-[12.5px] font-mono text-[#39334d] outline-none border border-transparent focus:border-purple-300 resize-y leading-relaxed"
                                />
                            </div>

                            {/* Live Test Runner */}
                            <div className="pt-4 border-t border-purple-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                        <Play size={13} className="text-emerald-600 fill-emerald-500" />
                                        分身即时研判控制台 (Live Output Preview)
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        并发研判耗时 ~200-400ms · 限制字数 &lt;= 60字
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={cloneTestingQuery}
                                        onChange={(e) => setCloneTestingQuery(e.target.value)}
                                        placeholder="输入测试问题验证此分身研判输出..."
                                        className="flex-1 bg-[#f8f6fc] rounded-xl px-4 py-2 text-[12.5px] outline-none border border-transparent focus:border-purple-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleTestCloneReasoning}
                                        disabled={cloneTestingLoading}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                    >
                                        {cloneTestingLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                        <span>运行推演</span>
                                    </button>
                                </div>

                                {cloneTestingResult && (
                                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-start gap-2.5 animate-in fade-in">
                                        <span
                                            className="text-[11px] font-black px-2 py-0.5 rounded-md text-white shrink-0 mt-0.5 shadow-2xs"
                                            style={{ backgroundColor: currentCloneConfig.color || '#8b5cf6' }}
                                        >
                                            {currentCloneConfig.tag}
                                        </span>
                                        <p className="text-[12px] font-medium text-[#4a4365] leading-relaxed">
                                            {cloneTestingResult}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: 首席顾问配置 (Dr. Elena - 仅需名称、语音、头像) */}
            {subTab === 'core_agents' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-purple-50">
                            <div className="flex items-center gap-3.5">
                                <img
                                    src={coreAgents.dr?.avatar || CORE_FALLBACK_AGENTS.dr.avatar}
                                    alt="Advisor Avatar"
                                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-md shrink-0"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = CORE_FALLBACK_AGENTS.dr.avatar;
                                    }}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-[#4a4365] text-[18px]">
                                            {coreAgents.dr?.name || 'Dr. Elena'}
                                        </h4>
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                            {coreAgents.dr?.title || '首席招生咨询顾问'}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-[#8a84a4] mt-0.5">
                                        广州大学招生咨询与志愿决策主顾问 · 负责考生与家长咨询解答
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSaveCoreAgents}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>{saveSuccess ? '已保存！' : '保存顾问配置'}</span>
                            </button>
                        </div>

                        {/* 配置项：仅保留 名称、语音、头像 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* 1. 顾问名称 */}
                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5">
                                    顾问名称 (Name)
                                </label>
                                <input
                                    type="text"
                                    value={coreAgents.dr?.name || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCoreAgents(prev => ({
                                            ...prev,
                                            dr: { ...prev.dr, name: val }
                                        }));
                                    }}
                                    placeholder="例如：Dr. Elena"
                                    className="w-full bg-[#f8f6fc] rounded-xl px-4 py-3 text-[13px] font-bold text-[#4a4365] outline-none border border-transparent focus:border-purple-300 transition-colors"
                                />
                            </div>

                            {/* 2. 专属 TTS 播报音色 */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[12px] font-bold text-[#4a4365]">
                                        专属播报语音 (Voice)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleTestVoice(
                                            coreAgents.dr?.voice || 'zh-CN-XiaoxiaoNeural',
                                            `你好，我是广州大学招生咨询顾问 ${coreAgents.dr?.name || 'Dr. Elena'}，很高兴为您解答！`
                                        )}
                                        disabled={testingVoice}
                                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Volume2 size={13} />
                                        <span>{testingVoice ? '正在试听中...' : '试听音色'}</span>
                                    </button>
                                </div>
                                <select
                                    value={coreAgents.dr?.voice || 'zh-CN-XiaoxiaoNeural'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCoreAgents(prev => ({
                                            ...prev,
                                            dr: { ...prev.dr, voice: val }
                                        }));
                                    }}
                                    className="w-full bg-[#f8f6fc] rounded-xl px-4 py-3 text-[13px] font-bold text-[#4a4365] outline-none border border-transparent focus:border-purple-300 cursor-pointer transition-colors"
                                >
                                    {DEFAULT_VOICES.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. 头像图片 URL */}
                            <div className="sm:col-span-2">
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5">
                                    顾问头像图片 (Avatar URL)
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={coreAgents.dr?.avatar || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCoreAgents(prev => ({
                                                ...prev,
                                                dr: { ...prev.dr, avatar: val }
                                            }));
                                        }}
                                        placeholder="https://... 或以 /uploads 开头的本地图片路径"
                                        className="flex-1 bg-[#f8f6fc] rounded-xl px-4 py-3 text-[12.5px] font-mono text-[#4a4365] outline-none border border-transparent focus:border-purple-300 transition-colors"
                                    />
                                    {coreAgents.dr?.avatar && (
                                        <img
                                            src={coreAgents.dr.avatar}
                                            alt="Preview"
                                            className="w-12 h-12 rounded-xl object-cover border border-purple-200 shadow-xs shrink-0"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                                <p className="text-[11px] text-[#8a84a4] mt-1.5">
                                    支持 HTTP/HTTPS 图片直链，亦可填写本地静态图片路径。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: 气泡皮肤与视觉定制 (Bubble Themes) */}
            {subTab === 'bubble_skin' && (
                <div className="space-y-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-black text-[#4a4365] text-[16px] flex items-center gap-2">
                                    <Palette size={18} className="text-purple-600" /> 对话气泡主题预设 (Bubble Themes)
                                </h4>
                                <p className="text-[11.5px] text-[#8a84a4] mt-0.5">
                                    切换全局气泡皮肤风格，实时同步到前台会话与 Markdown 渲染
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {Object.values(BUBBLE_THEMES).slice(0, 12).map((theme) => {
                                const isSelected = bubbleSettings.themeId === theme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        onClick={() => updateBubbleSetting('themeId', theme.id as BubbleThemeId)}
                                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                                            isSelected
                                                ? 'bg-purple-50/80 border-purple-500 shadow-md ring-2 ring-purple-400/20'
                                                : 'bg-[#f8f6fc] hover:bg-white border-purple-50'
                                        }`}
                                    >
                                        <span className="text-[12.5px] font-bold text-[#4a4365] truncate">
                                            {theme.name}
                                        </span>
                                        <span className="text-[10px] text-[#8a84a4] truncate">
                                            {theme.group}
                                        </span>
                                        {isSelected && (
                                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
