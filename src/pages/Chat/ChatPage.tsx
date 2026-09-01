import React, { useState, useEffect, useRef } from 'react';
import { Clock, Sparkles, Building2, HelpCircle, MessageSquare, Compass, ShieldAlert, GraduationCap, Coffee, ArrowUpRight, Cpu, Zap } from 'lucide-react';
import { User, UserProfile, ChatSession, ChatMessage, ChatMode, MultiAgentRoster, ChatAttachment, BubbleThemeId, BubbleCustomSettings, ApiDiagnostics, AdvisorMode } from '../../types';
import { THEME, ROLE } from '../../constants/theme';
import { INITIAL_MESSAGES } from '../../constants/initialMessages';
import { DEFAULT_CAMPUS_LOCATIONS } from '../../constants/campusLocations';
import { API_BASE } from '../../api/config';
import { ChatHeader } from './ChatHeader';
import { SessionDrawer } from './SessionDrawer';
import { ChatInputBar } from './ChatInputBar';
import { ChatMessageBubble } from '../../components/ui/ChatMessageBubble';
import { CampusMapModal } from '../CampusMap/CampusMapModal';
import { UserProfileModal } from '../UserProfile/UserProfileModal';
import { GroupRosterModal } from './GroupRosterModal';
import { BubbleThemeModal } from '../../components/ui/BubbleThemeModal';
import { ApiDiagnosticsDrawer } from '../../components/ui/ApiDiagnosticsDrawer';

const GROUP_INITIAL_MESSAGES: ChatMessage[] = [];

interface ChatPageProps {
    currentUser: User;
    onLogout: () => void;
    onSwitchPortal?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ currentUser, onLogout, onSwitchPortal }) => {
    // --- Mode State (Admissions vs Group) ---
    const [currentMode, setCurrentMode] = useState<ChatMode>('admissions');
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

    // --- Admissions Engine Mode (⚡ 极速轻量 vs 🧠 深度智能体) ---
    const [advisorMode, setAdvisorMode] = useState<AdvisorMode>(() => {
        try {
            const saved = localStorage.getItem('gzadm_advisor_mode');
            return (saved === 'lightweight' || saved === 'agent') ? saved : 'agent';
        } catch {
            return 'agent';
        }
    });

    const handleAdvisorModeChange = (mode: AdvisorMode) => {
        setAdvisorMode(mode);
        try {
            localStorage.setItem('gzadm_advisor_mode', mode);
        } catch { }
    };

    // --- Bubble Skin / Theme State ---
    const [bubbleSettings, setBubbleSettings] = useState<Partial<BubbleCustomSettings>>(() => {
        try {
            const saved = localStorage.getItem('gzadm_bubble_settings');
            if (saved) return JSON.parse(saved);
        } catch { }
        return DEFAULT_BUBBLE_SETTINGS;
    });

    const [bubbleTheme, setBubbleTheme] = useState<BubbleThemeId>(() => {
        try {
            const saved = localStorage.getItem('gzadm_bubble_theme');
            if (saved) return saved as BubbleThemeId;
        } catch { }
        return 'antdesign_filled';
    });

    const [markdownStyle, setMarkdownStyle] = useState<MarkdownStyleId>(() => {
        try {
            const saved = localStorage.getItem('gzadm_markdown_style');
            if (saved) return saved as MarkdownStyleId;
        } catch { }
        return 'crystal';
    });

    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

    const handleSelectTheme = (themeId: BubbleThemeId) => {
        setBubbleTheme(themeId);
        const updatedSettings = { ...bubbleSettings, themeId };
        setBubbleSettings(updatedSettings);
        try {
            localStorage.setItem('gzadm_bubble_theme', themeId);
            localStorage.setItem('gzadm_bubble_settings', JSON.stringify(updatedSettings));
        } catch { }
    };

    const handleSelectMarkdownStyle = (styleId: MarkdownStyleId) => {
        setMarkdownStyle(styleId);
        const updatedSettings = { ...bubbleSettings, markdownStyle: styleId };
        setBubbleSettings(updatedSettings);
        try {
            localStorage.setItem('gzadm_markdown_style', styleId);
            localStorage.setItem('gzadm_bubble_settings', JSON.stringify(updatedSettings));
        } catch { }
    };

    // --- User Profile State ---
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
        try {
            const saved = localStorage.getItem(`aurasense_profile_${currentUser.username}`);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileModalTab, setProfileModalTab] = useState<'profile' | 'account'>('profile');

    const handleOpenProfileModal = (tab: 'profile' | 'account' = 'profile') => {
        setProfileModalTab(tab);
        setIsProfileModalOpen(true);
    };
    const [isMapGuideOpen, setIsMapGuideOpen] = useState(false);
    const [campusLocations, setCampusLocations] = useState<any[]>(DEFAULT_CAMPUS_LOCATIONS);
    const [mapPinScale, setMapPinScale] = useState<number>(0.8);

    const [agentsRoster, setAgentsRoster] = useState<MultiAgentRoster>({});

    // --- Admin API Diagnostics State ---
    const [activeDiagnostics, setActiveDiagnostics] = useState<ApiDiagnostics | null>(null);
    const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/api/agents-config`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.data) {
                    setAgentsRoster(data.data);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (isMapGuideOpen) {
            fetch(`${API_BASE}/api/campus-map`)
                .then(res => res.json())
                .then(data => {
                    if (data.ok && data.data) {
                        if (Array.isArray(data.data.locations) && data.data.locations.length > 0) {
                            setCampusLocations(data.data.locations);
                        }
                        if (typeof data.data.pinScale === 'number') {
                            setMapPinScale(data.data.pinScale);
                        }
                    }
                })
                .catch(() => {});
        }
    }, [isMapGuideOpen]);

    // --- Session States ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 640;
        }
        return true;
    });

    const [typing, setTyping] = useState(false);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const createDefaultSession = (mode: ChatMode = currentMode): ChatSession => ({
        id: `session-${mode}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: mode === 'group' ? '广大2026级新生迎新群' : '新招生咨询对话',
        mode,
        messages: mode === 'group' ? GROUP_INITIAL_MESSAGES : INITIAL_MESSAGES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const filteredSessions = sessions.filter(s => (s.mode || (s.id && s.id.includes('group') ? 'group' : 'admissions')) === currentMode);
    const activeSession = filteredSessions.find(s => s.id === activeSessionId) || filteredSessions[0] || null;
    const messages = activeSession ? (activeSession.messages || []) : [];
    const latestDiagnostics = [...messages].reverse().find(m => m.diagnostics)?.diagnostics || activeDiagnostics;

    const syncSessions = (username: string, updatedSessions: ChatSession[], targetActiveId?: string) => {
        setSessions(updatedSessions);
        if (targetActiveId) {
            setActiveSessionId(targetActiveId);
            try {
                localStorage.setItem(`aurasense_active_session_${username}_${currentMode}`, targetActiveId);
            } catch { }
        }
        try {
            localStorage.setItem(`aurasense_sessions_${username}`, JSON.stringify(updatedSessions));
        } catch (e) {
            console.error('Failed to save sessions to local cache:', e);
        }

        fetch(`${API_BASE}/api/user/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, sessions: updatedSessions })
        }).catch(err => console.warn('Server session sync warn:', err.message));
    };

    // Load Sessions once when user logs in or mounts
    useEffect(() => {
        const username = currentUser.username;
        const initUserSessions = async () => {
            let loaded: ChatSession[] = [];
            try {
                const raw = localStorage.getItem(`aurasense_sessions_${username}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) loaded = parsed;
                }
            } catch { }

            try {
                const res = await fetch(`${API_BASE}/api/user/sessions?username=${encodeURIComponent(username)}`);
                const data = await res.json();
                if (data.ok && Array.isArray(data.sessions) && data.sessions.length > 0) {
                    loaded = data.sessions;
                }
            } catch { }

            // Normalize mode on all sessions
            loaded = loaded.map(s => ({
                ...s,
                mode: s.mode || (s.id && s.id.includes('group') ? 'group' : 'admissions')
            }));

            // Ensure at least one session exists per mode
            if (!loaded.some(s => s.mode === 'admissions')) {
                loaded.unshift(createDefaultSession('admissions'));
            }
            if (!loaded.some(s => s.mode === 'group')) {
                loaded.push(createDefaultSession('group'));
            }

            setSessions(loaded);

            // Restore active session for current mode
            const savedActive = localStorage.getItem(`aurasense_active_session_${username}_${currentMode}`);
            const matching = loaded.filter(s => s.mode === currentMode);
            if (savedActive && matching.some(s => s.id === savedActive)) {
                setActiveSessionId(savedActive);
            } else if (matching.length > 0) {
                setActiveSessionId(matching[0].id);
            }
        };

        initUserSessions();
    }, [currentUser.username]);

    useEffect(() => {
        const username = currentUser.username;
        fetch(`${API_BASE}/api/user/profile?username=${encodeURIComponent(username)}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.profile) {
                    setUserProfile(data.profile);
                    localStorage.setItem(`aurasense_profile_${username}`, JSON.stringify(data.profile));
                    if (!data.profile.name || !data.profile.score || !data.profile.province) {
                        setIsProfileModalOpen(true);
                    }
                } else {
                    const saved = localStorage.getItem(`aurasense_profile_${username}`);
                    if (saved) setUserProfile(JSON.parse(saved));
                    else setIsProfileModalOpen(true);
                }
            })
            .catch(() => {
                const saved = localStorage.getItem(`aurasense_profile_${username}`);
                if (saved) setUserProfile(JSON.parse(saved));
                else setIsProfileModalOpen(true);
            });
    }, [currentUser]);

    const handleSaveUserProfile = async (profileData: UserProfile) => {
        try {
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser.username, profile: profileData })
            });
            const data = await res.json();
            if (data.ok && data.profile) {
                setUserProfile(data.profile);
                localStorage.setItem(`aurasense_profile_${currentUser.username}`, JSON.stringify(data.profile));
                setIsProfileModalOpen(false);
            }
        } catch {
            setUserProfile(profileData);
            localStorage.setItem(`aurasense_profile_${currentUser.username}`, JSON.stringify(profileData));
            setIsProfileModalOpen(false);
        }
    };

    const scrollToBottomIfNeeded = (force = false) => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        if (force || isNearBottom) {
            scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottomIfNeeded();
    }, [messages.length, typing]);

    const handleCreateNewSession = () => {
        // 检查当前模式下的会话中是否已有尚未发送过用户消息的空白对话
        const currentModeSessions = sessions.filter(s => (s.mode || (s.id && s.id.includes('group') ? 'group' : 'admissions')) === currentMode);
        const existingEmptySession = currentModeSessions.find(s => {
            const userMsgs = (s.messages || []).filter(m => m.sender === 'user');
            return userMsgs.length === 0;
        });

        if (existingEmptySession) {
            // 已存在空白对话，直接定位切换，不重复创建
            setActiveSessionId(existingEmptySession.id);
            try {
                localStorage.setItem(`aurasense_active_session_${currentUser.username}_${currentMode}`, existingEmptySession.id);
            } catch { }
            if (typeof window !== 'undefined' && window.innerWidth < 640) {
                setIsSidebarOpen(false);
            }
            return;
        }

        const newSess = createDefaultSession(currentMode);
        const updated = [newSess, ...sessions];
        syncSessions(currentUser.username, updated, newSess.id);
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setIsSidebarOpen(false);
        }
    };

    const handleSelectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        try {
            localStorage.setItem(`aurasense_active_session_${currentUser.username}_${currentMode}`, sessionId);
        } catch { }
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setIsSidebarOpen(false);
        }
    };

    const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const remaining = sessions.filter(s => s.id !== sessionId);
        let updated = remaining;
        let nextActiveId = activeSessionId;

        const matchingRemaining = remaining.filter(s => (s.mode || 'admissions') === currentMode);
        if (sessionId === activeSessionId) {
            if (matchingRemaining.length > 0) {
                nextActiveId = matchingRemaining[0].id;
            } else {
                const fresh = createDefaultSession(currentMode);
                updated = [fresh, ...remaining];
                nextActiveId = fresh.id;
            }
        }

        syncSessions(currentUser.username, updated, nextActiveId || undefined);

        fetch(`${API_BASE}/api/user/sessions/${sessionId}?username=${encodeURIComponent(currentUser.username)}`, {
            method: 'DELETE'
        }).catch(() => { });
    };

    // Seamless Mode Switching (Preserves previous ongoing sessions without creating new ones)
    const handleChangeMode = (targetMode: ChatMode) => {
        if (targetMode === currentMode) return;

        // 1. Save current active session ID for the previous mode
        if (activeSessionId) {
            try {
                localStorage.setItem(`aurasense_active_session_${currentUser.username}_${currentMode}`, activeSessionId);
            } catch { }
        }

        // 2. Switch mode
        setCurrentMode(targetMode);

        // 3. Find matching sessions for the new mode
        const matching = sessions.filter(s => (s.mode || (s.id && s.id.includes('group') ? 'group' : 'admissions')) === targetMode);

        // 4. Try to restore previous active session for targetMode
        const savedTargetActive = localStorage.getItem(`aurasense_active_session_${currentUser.username}_${targetMode}`);
        if (savedTargetActive && matching.some(s => s.id === savedTargetActive)) {
            setActiveSessionId(savedTargetActive);
        } else if (matching.length > 0) {
            setActiveSessionId(matching[0].id);
        } else {
            // Only create if 0 sessions exist for this mode
            const fresh = createDefaultSession(targetMode);
            const updated = [fresh, ...sessions];
            syncSessions(currentUser.username, updated, fresh.id);
        }
    };

    const handleSend = async (e?: React.FormEvent, overrideText: string | null = null, attachments: ChatAttachment[] = []) => {
        if (e) e.preventDefault();
        const text = (overrideText || inputText).trim();
        if ((!text && attachments.length === 0) || typing || !activeSession) return;

        setInputText('');
        const userMsgText = text || (attachments.length > 0 ? `[发送了 ${attachments.length} 个附件: ${attachments.map(a => a.name).join(', ')}]` : '');
        const userMsg: ChatMessage = {
            id: Date.now(),
            sender: 'user',
            text: userMsgText,
            attachments: attachments.length > 0 ? attachments : undefined,
            instant: true
        };
        const currentMsgs = activeSession.messages || [];
        const updatedMsgs = [...currentMsgs, userMsg];
        const userMsgCount = currentMsgs.filter(m => m.sender === 'user').length;

        let newTitle = activeSession.title;
        const cleanUserText = userMsgText.replace(/@[^\s]+\s?/g, '').trim();
        if (newTitle === '新招生咨询对话' || newTitle === '广大2026级新生迎新群' || newTitle === '主对话' || userMsgCount === 0) {
            newTitle = cleanUserText.length > 15 ? `${cleanUserText.slice(0, 15)}...` : (cleanUserText || userMsgText);
        }

        const updatedSession: ChatSession = {
            ...activeSession,
            title: newTitle,
            mode: activeSession.mode || currentMode,
            messages: updatedMsgs,
            updatedAt: new Date().toISOString()
        };

        const updatedSessions = sessions.map(s => s.id === activeSession.id ? updatedSession : s);
        syncSessions(currentUser.username, updatedSessions, activeSession.id);
        setTyping(true);

        const historyForApi = updatedMsgs.slice(-10).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        }));

        const endpoint = currentMode === 'group' ? `${API_BASE}/api/chat/group` : `${API_BASE}/api/aura/chat`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser.username,
                    userProfile,
                    advisorMode,
                    messages: historyForApi,
                    attachments: attachments.length > 0 ? attachments : undefined
                })
            });

            const data = await response.json();
            const reply = data?.reply || '抱歉，我刚刚有些走神，请您再试一次。';

            const botMsg: ChatMessage = {
                id: Date.now() + 1,
                sender: 'bot',
                text: reply,
                senderAgentKey: data.agentKey || (currentMode === 'group' ? 'senior_girl' : 'dr'),
                senderName: data.agentName || (currentMode === 'group' ? '丽丽学姐' : ROLE.name),
                senderTitle: data.agentTitle || (currentMode === 'group' ? '大学城探店与文旅达人' : ROLE.title),
                senderAvatar: data.agentAvatar || (currentMode === 'group' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' : ROLE.avatar),
                senderColor: data.agentColor || (currentMode === 'group' ? '#ec4899' : ROLE.color),
                senderVoice: data.agentVoice || undefined,
                instant: true,
                mode: data.mode || advisorMode,
                activeClones: data.activeClones || undefined,
                diagnostics: data.diagnostics || undefined
            };
            const finalMsgs = [...updatedMsgs, botMsg];

            const finalSession: ChatSession = {
                ...updatedSession,
                messages: finalMsgs,
                updatedAt: new Date().toISOString()
            };

            const finalSessions = sessions.map(s => s.id === activeSession.id ? finalSession : s);
            syncSessions(currentUser.username, finalSessions, activeSession.id);

            // 触发首轮 AI 智能标题提炼总结
            if (userMsgCount === 0) {
                fetch(`${API_BASE}/api/chat/summarize-title`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userText: userMsgText, botReply: reply })
                })
                .then(res => res.json())
                .then(titleData => {
                    if (titleData.ok && titleData.title) {
                        setSessions(prev => {
                            const updated = prev.map(s => s.id === activeSession.id ? { ...s, title: titleData.title } : s);
                            syncSessions(currentUser.username, updated, activeSession.id);
                            return updated;
                        });
                    }
                })
                .catch(err => console.warn('Title summary fetch warning:', err));
            }
        } catch (err) {
            console.error(err);
            const errorMsg: ChatMessage = { id: Date.now() + 1, sender: 'bot', text: '网络连接出现异常，请检查后端服务是否启动。', instant: true };
            const finalMsgs = [...updatedMsgs, errorMsg];
            const finalSession: ChatSession = {
                ...updatedSession,
                messages: finalMsgs,
                updatedAt: new Date().toISOString()
            };
            const finalSessions = sessions.map(s => s.id === activeSession.id ? finalSession : s);
            syncSessions(currentUser.username, finalSessions, activeSession.id);
        } finally {
            setTyping(false);
        }
    };

    const handleAskLocationQuestion = (queryText: string) => {
        setIsMapGuideOpen(false);
        handleSend(undefined, queryText, []);
    };

    const handleMentionAgentFromModal = (agentName: string) => {
        setInputText(prev => `${prev}@${agentName} `);
    };

    const quickAdmissionsPrompts = [
        '广州大学历年各省录取分数线与排位',
        '计算机与人工智能专业就业前景如何？',
        '学校宿舍生活环境与4人间配置',
        '学费收费标准与新生卓越奖学金'
    ];

    const quickGroupPrompts = [
        '@宿管张阿姨 宿舍用电限额多少瓦？违章电器有哪些？',
        '@李导 大一下学期转专业有什么条件和绩点要求？',
        '@浩哥 校园卡手机NFC怎么刷门禁？菜鸟驿站在哪？',
        '@丽丽学姐 大学城GOGO新天地和贝岗有什么好吃的美食？'
    ];

    const handleOpenDiagnostics = () => {
        if (latestDiagnostics) {
            setActiveDiagnostics(latestDiagnostics);
        } else {
            setActiveDiagnostics({
                requestId: `req_preview_${Date.now()}`,
                timestamp: new Date().toISOString(),
                mode: currentMode,
                targetAgent: {
                    key: currentMode === 'group' ? 'senior_girl' : 'dr',
                    name: currentMode === 'group' ? '丽丽学姐' : 'Dr. Elena',
                    title: currentMode === 'group' ? '广大迎新向导' : '高招政策咨询顾问',
                    color: currentMode === 'group' ? '#ec4899' : '#a494e8'
                },
                routingDecision: {
                    type: currentMode === 'group' ? '多智能体群聊路由' : '1对1专属顾问',
                    details: '等待发送首条提问触发动态意图匹配'
                },
                requestPayload: {
                    model: 'deepseek-chat',
                    protocol: 'chat_completions',
                    temperature: 0.7,
                    max_tokens: 2048,
                    systemPrompt: '已载入校方权威招生规章、5位智能体人设与考生高考画像上下文',
                    messages: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
                    tools: [
                        { name: 'searchCampusKnowledge', description: '校方权威事实数据库（RAG）' },
                        { name: 'webSearch', description: '全网高考政策与薪资考研搜索' },
                        { name: 'fetchWebPage', description: '深度抓取网页招生简章与表格' },
                        { name: 'searchPersonalMemory', description: '考生专属历史偏好档案检索' },
                        { name: 'saveUserPreference', description: '自动沉淀考生志愿偏好' }
                    ]
                },
                ragRetrieval: {
                    query: '就绪',
                    retrievedCount: 0,
                    matches: []
                },
                userProfileContext: userProfile ? {
                    username: userProfile.name || currentUser.username,
                    province: userProfile.province || '未填',
                    score: userProfile.score || '未填',
                    rank: userProfile.rank || '未填',
                    subjects: userProfile.subjects || '未填'
                } : null,
                performance: {
                    totalLatencyMs: 0,
                    estimatedPromptTokens: 850,
                    estimatedCompletionTokens: 0,
                    estimatedTotalTokens: 850
                }
            });
        }
        setIsDiagnosticsOpen(true);
    };

    return (
        <div className={`w-full h-full sm:max-w-[1360px] sm:max-h-[920px] ${THEME.glass} flex flex-col sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500`}>
            <ChatHeader
                currentUser={currentUser}
                userProfile={userProfile}
                currentMode={currentMode}
                onChangeMode={handleChangeMode}
                advisorMode={advisorMode}
                onChangeAdvisorMode={handleAdvisorModeChange}
                agentsRoster={agentsRoster}
                onOpenRosterDrawer={() => setIsRosterModalOpen(true)}
                currentTheme={bubbleTheme}
                onOpenThemeModal={() => setIsThemeModalOpen(true)}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onCreateSession={handleCreateNewSession}
                onOpenProfileModal={handleOpenProfileModal}
                onLogout={onLogout}
                onSwitchPortal={onSwitchPortal}
                onOpenDiagnostics={currentUser.role === 'admin' ? handleOpenDiagnostics : undefined}
            />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Session Sidebar Drawer */}
                <SessionDrawer
                    isOpen={isSidebarOpen}
                    sessions={filteredSessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={handleDeleteSession}
                    onOpenMapGuide={() => setIsMapGuideOpen(true)}
                />

                {/* Chat Area */}
                <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
                    <main
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-4"
                    >
                        {/* Admin Real-time API Monitor Bar */}
                        {currentUser.role === 'admin' && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-purple-500/30 text-white text-xs shadow-lg shadow-purple-950/20 animate-fadeIn">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] flex items-center gap-1 border border-purple-500/30">
                                        <Cpu size={12} className="text-purple-400" />
                                        ADMIN API 实时抓包审计
                                    </span>
                                    <span className="text-slate-300 text-[11px]">
                                        {latestDiagnostics ? (
                                            <>
                                                模型: <b className="text-white font-mono">{latestDiagnostics.requestPayload?.model || 'deepseek-chat'}</b> · 
                                                耗时: <b className="text-emerald-400 font-mono">{(latestDiagnostics.performance?.totalLatencyMs ?? (latestDiagnostics as any).totalLatencyMs ?? (latestDiagnostics as any).latencyMs) || 0}ms</b> · 
                                                Token: <b className="text-purple-300 font-mono">{(latestDiagnostics.performance?.estimatedTotalTokens ?? (latestDiagnostics as any).estimatedTotalTokens ?? 0).toLocaleString()}</b> ·
                                                角色: <b className="text-pink-300">{latestDiagnostics.targetAgent?.name || 'Dr. Elena'}</b>
                                            </>
                                        ) : (
                                            '就绪 · 发送提问即时抓包请求体与 RAG 向量'
                                        )}
                                    </span>
                                </div>

                                {latestDiagnostics && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveDiagnostics(latestDiagnostics);
                                            setIsDiagnosticsOpen(true);
                                        }}
                                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                                    >
                                        <Zap size={12} className="text-amber-300" />
                                        <span>查看最新 API 参数详情</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Clean Empty State Prompt Guide when messages are empty (方案2: 声波光环 + 2x2磁贴) */}
                        {messages.length === 0 && !typing && (
                            <div className="flex-1 min-h-[48vh] sm:min-h-[55vh] flex flex-col items-center justify-center text-center space-y-5 pt-10 sm:pt-20 pb-8 animate-in fade-in zoom-in-95 duration-300">
                                {/* Icon with Concentric Aura Rings (声波脉冲光环) */}
                                <div className="relative flex items-center justify-center pt-2">
                                    {/* Outer soft aura ring */}
                                    <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-purple-200/35 blur-md animate-pulse" />
                                    <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-purple-100/60 to-pink-100/60 border border-purple-200/40" />

                                    {/* Center 3D Glassmorphism Badge */}
                                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-[24px] flex items-center justify-center shadow-[0_12px_30px_rgba(179,164,237,0.35)] border-2 border-white bg-gradient-to-tr from-[#b3a4ed] via-[#c7b8f9] to-[#f296b2] text-white transition-transform hover:scale-105 duration-300">
                                        <Building2 size={32} className="drop-shadow-sm" />
                                    </div>
                                </div>

                                <div className="space-y-1 max-w-md mx-auto">
                                    <h3 className="font-black text-[#4a4365] text-[18px] sm:text-[20px] tracking-tight">
                                        广州大学智能咨询顾问
                                    </h3>
                                </div>

                                {/* Quick Clickable Prompt Suggestions (2x2 Grid 磁贴排布) */}
                                <div className="w-full max-w-xl pt-2 space-y-2 text-left">
                                    <div className="text-[11px] font-bold text-[#a494e8] px-1 flex items-center gap-1">
                                        <HelpCircle size={12} /> 推荐快捷咨询：
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {quickAdmissionsPrompts.map((q, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSend(undefined, q, [])}
                                                className="p-3 rounded-2xl bg-white/80 hover:bg-white border border-white/90 text-left text-[12px] font-medium text-[#4a4365] shadow-[0_2px_8px_rgba(74,67,101,0.04)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.14)] hover:border-purple-200 transition-all flex items-center justify-between group cursor-pointer hover:-translate-y-0.5"
                                            >
                                                <span className="truncate pr-2 font-medium">{q}</span>
                                                <ArrowUpRight size={14} className="text-purple-400 group-hover:text-purple-600 transition-colors shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <ChatMessageBubble
                                key={msg.id}
                                msg={msg}
                                isUser={msg.sender === 'user'}
                                roleColor={msg.senderColor || ROLE.color}
                                roleAvatar={msg.senderAvatar || ROLE.avatar}
                                roleName={msg.senderName || ROLE.name}
                                userAvatar={userProfile?.avatar || currentUser.username}
                                bubbleTheme={bubbleTheme}
                                customSettings={{ ...bubbleSettings, markdownStyle }}
                                isAdmin={currentUser.role === 'admin'}
                                onOpenDiagnostics={(diag) => {
                                    setActiveDiagnostics(diag);
                                    setIsDiagnosticsOpen(true);
                                }}
                            />
                        ))}

                        {typing && (
                            <div className="flex justify-start animate-in slide-in-from-bottom-4 duration-300">
                                <div className="flex max-w-[88%] flex-row items-end gap-3">
                                    <div className="w-9 h-9 rounded-[14px] shadow-sm border border-white bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs shrink-0 animate-pulse">
                                        AI
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                            <span className="text-[11px] font-black tracking-wider uppercase text-purple-600">
                                                {ROLE.name}
                                            </span>
                                            <span className="text-[10px] text-[#a494e8] font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 animate-pulse">
                                                正在回复中
                                            </span>
                                        </div>
                                        <div className="bg-white text-[#5c5478] shadow-[0_12px_30px_rgba(203,195,225,0.3)] px-5 py-3.5 rounded-[24px] rounded-tl-sm flex items-center gap-3 border border-purple-100">
                                            <div className="flex gap-1.5 items-center">
                                                <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                            <span className="text-[13px] font-medium text-[#7a7398] animate-pulse">
                                                {advisorMode === 'agent'
                                                    ? '🧠 正在同层调度思维分身与校内知识库推演中...'
                                                    : '⚡ 极速轻量引擎检索直出中...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    <ChatInputBar
                        inputText={inputText}
                        setInputText={setInputText}
                        onSend={(e, atts) => handleSend(e, null, atts || [])}
                        onOpenMapGuide={() => setIsMapGuideOpen(true)}
                        typing={typing}
                        currentMode={currentMode}
                        agentsRoster={agentsRoster}
                        advisorMode={advisorMode}
                        onChangeAdvisorMode={handleAdvisorModeChange}
                    />
                </div>
            </div>

            <BubbleThemeModal
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                currentTheme={bubbleTheme}
                onSelectTheme={handleSelectTheme}
                currentMarkdownStyle={markdownStyle}
                onSelectMarkdownStyle={handleSelectMarkdownStyle}
            />

            <GroupRosterModal
                isOpen={isRosterModalOpen}
                onClose={() => setIsRosterModalOpen(false)}
                roster={agentsRoster}
                onSelectAgentToMention={handleMentionAgentFromModal}
            />

            <CampusMapModal
                locations={campusLocations}
                isOpen={isMapGuideOpen}
                onClose={() => setIsMapGuideOpen(false)}
                onAskQuestion={handleAskLocationQuestion}
                pinScale={mapPinScale}
                liliAvatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop"
                liliName="丽丽学姐"
            />

            <UserProfileModal
                profile={userProfile}
                currentUser={currentUser}
                isOpen={isProfileModalOpen}
                initialTab={profileModalTab}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveUserProfile}
            />

            {/* Admin API Diagnostics Slide-over Drawer */}
            <ApiDiagnosticsDrawer
                isOpen={isDiagnosticsOpen}
                onClose={() => setIsDiagnosticsOpen(false)}
                diagnostics={activeDiagnostics}
            />
        </div>
    );
};
