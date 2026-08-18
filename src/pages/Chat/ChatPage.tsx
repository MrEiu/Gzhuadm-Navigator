import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { User, UserProfile, ChatSession, ChatMessage } from '../../types';
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

interface ChatPageProps {
    currentUser: User;
    onLogout: () => void;
    onSwitchPortal?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ currentUser, onLogout, onSwitchPortal }) => {
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
    const [isMapGuideOpen, setIsMapGuideOpen] = useState(false);
    const [campusLocations, setCampusLocations] = useState<CampusLocation[]>(DEFAULT_CAMPUS_LOCATIONS);
    const [mapPinScale, setMapPinScale] = useState<number>(0.8);

    const [agentConfig, setAgentConfig] = useState<AgentConfigData>({
        dr: { name: ROLE.name, title: ROLE.title, avatar: ROLE.avatar },
        lili: { name: '丽丽学姐', title: '校园智能伴游', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' }
    });

    useEffect(() => {
        fetch(`${API_BASE}/api/agent-config`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.data) {
                    setAgentConfig(data.data);
                }
            })
            .catch(() => {});
    }, [isProfileModalOpen]);

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

    const createDefaultSession = (): ChatSession => ({
        id: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: '新咨询对话',
        messages: INITIAL_MESSAGES,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;
    const messages = activeSession ? (activeSession.messages || INITIAL_MESSAGES) : INITIAL_MESSAGES;

    const syncSessions = (username: string, updatedSessions: ChatSession[], targetActiveId?: string) => {
        setSessions(updatedSessions);
        if (targetActiveId) {
            setActiveSessionId(targetActiveId);
            try {
                localStorage.setItem(`aurasense_active_session_${username}`, targetActiveId);
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

            if (loaded.length === 0) {
                loaded = [createDefaultSession()];
            }

            setSessions(loaded);
            const savedActive = localStorage.getItem(`aurasense_active_session_${username}`);
            if (savedActive && loaded.some(s => s.id === savedActive)) {
                setActiveSessionId(savedActive);
            } else {
                setActiveSessionId(loaded[0].id);
            }
        };

        initUserSessions();
    }, [currentUser]);

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
        const newSess = createDefaultSession();
        const updated = [newSess, ...sessions];
        syncSessions(currentUser.username, updated, newSess.id);
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setIsSidebarOpen(false);
        }
    };

    const handleSelectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
        try {
            localStorage.setItem(`aurasense_active_session_${currentUser.username}`, sessionId);
        } catch { }
        if (typeof window !== 'undefined' && window.innerWidth < 640) {
            setIsSidebarOpen(false);
        }
    };

    const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        let updated = sessions.filter(s => s.id !== sessionId);
        if (updated.length === 0) {
            updated = [createDefaultSession()];
        }

        let nextActiveId = activeSessionId;
        if (activeSessionId === sessionId) {
            nextActiveId = updated[0].id;
        }

        syncSessions(currentUser.username, updated, nextActiveId || undefined);

        fetch(`${API_BASE}/api/user/sessions/${sessionId}?username=${encodeURIComponent(currentUser.username)}`, {
            method: 'DELETE'
        }).catch(() => { });
    };

    const handleSend = async (e?: React.FormEvent, overrideText: string | null = null) => {
        if (e) e.preventDefault();
        const text = (overrideText || inputText).trim();
        if (!text || typing || !activeSession) return;

        setInputText('');
        const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text, instant: true };
        const currentMsgs = activeSession.messages || [];
        const updatedMsgs = [...currentMsgs, userMsg];

        let newTitle = activeSession.title;
        if (newTitle === '新咨询对话' || currentMsgs.length <= 1) {
            newTitle = text.length > 18 ? `${text.slice(0, 18)}...` : text;
        }

        const updatedSession: ChatSession = {
            ...activeSession,
            title: newTitle,
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

        try {
            const response = await fetch(`${API_BASE}/api/aura/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser.username,
                    userProfile,
                    messages: historyForApi
                })
            });

            const data = await response.json();
            const reply = data?.reply || '抱歉，我刚刚有些走神，请您再试一次。';

            const botMsg: ChatMessage = { id: Date.now() + 1, sender: 'bot', text: reply, instant: true };
            const finalMsgs = [...updatedMsgs, botMsg];

            const finalSession: ChatSession = {
                ...updatedSession,
                messages: finalMsgs,
                updatedAt: new Date().toISOString()
            };

            const finalSessions = sessions.map(s => s.id === activeSession.id ? finalSession : s);
            syncSessions(currentUser.username, finalSessions, activeSession.id);
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
        handleSend(undefined, queryText);
    };

    return (
        <div className={`w-full h-full ${isSidebarOpen ? 'sm:max-w-[960px]' : 'sm:max-w-[480px]'} sm:max-h-[880px] ${THEME.glass} flex flex-col sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500`}>
            <ChatHeader
                currentUser={currentUser}
                userProfile={userProfile}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onCreateSession={handleCreateNewSession}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                onLogout={onLogout}
                onSwitchPortal={onSwitchPortal}
            />

            <div className="flex-1 flex overflow-hidden relative">
                {isSidebarOpen && (
                    <div className="sm:relative absolute inset-0 z-30 sm:z-auto flex">
                        <SessionDrawer
                            sessions={sessions}
                            activeSessionId={activeSessionId}
                            onSelectSession={handleSelectSession}
                            onCreateSession={handleCreateNewSession}
                            onDeleteSession={handleDeleteSession}
                            onClose={() => setIsSidebarOpen(false)}
                        />
                        {/* Mobile backdrop */}
                        <div
                            className="flex-1 bg-black/25 backdrop-blur-[2px] sm:hidden cursor-pointer"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    </div>
                )}

                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <div className="px-6 py-2.5 bg-white/30 backdrop-blur-sm border-b border-white/50 flex items-center justify-between text-[12px]">
                        <div className="flex items-center gap-2 text-[#4a4365]">
                            <span className="w-2 h-2 rounded-full bg-[#a494e8] animate-pulse" />
                            <span className="font-bold text-[13px] truncate max-w-[300px]">
                                {activeSession?.title || '新咨询对话'}
                            </span>
                        </div>

                        <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            <span>{activeSession?.updatedAt ? new Date(activeSession.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '当前激活'}</span>
                        </div>
                    </div>

                    <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-1 space-y-5 hide-scrollbar relative scroll-smooth">
                        {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            const bubbleStyle = isUser ? THEME.userBubble : THEME.botBubble;

                            return (
                                <ChatMessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isUser={isUser}
                                    bubbleStyle={bubbleStyle}
                                    roleColor={ROLE.color}
                                    roleAvatar={agentConfig.dr.avatar || ROLE.avatar}
                                    roleName={agentConfig.dr.name || ROLE.name}
                                    userAvatar={userProfile?.avatar || currentUser.profile?.avatar}
                                />
                            );
                        })}

                        {typing && (
                            <div className="flex justify-start items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <img
                                    src={agentConfig.dr.avatar || ROLE.avatar}
                                    className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover"
                                    alt="typing"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop";
                                    }}
                                />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                        <span className="text-[11px] font-black tracking-wider uppercase" style={{ color: ROLE.color }}>
                                            {agentConfig.dr.name || ROLE.name}
                                        </span>
                                        <span className="text-[10px] text-[#a494e8] font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 animate-pulse">
                                            正在思考中
                                        </span>
                                    </div>
                                    <div className="bg-white text-[#5c5478] shadow-[0_12px_30px_rgba(203,195,225,0.3)] px-5 py-3.5 rounded-[24px] rounded-tl-sm flex items-center gap-3 border border-purple-100">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                        <span className="text-[13px] font-medium text-[#7a7398] animate-pulse">
                                            正在为您检索知识库并分析生成解答...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    <ChatInputBar
                        inputText={inputText}
                        setInputText={setInputText}
                        onSend={handleSend}
                        onOpenMapGuide={() => setIsMapGuideOpen(true)}
                        typing={typing}
                    />
                </div>
            </div>

            <CampusMapModal
                locations={campusLocations}
                isOpen={isMapGuideOpen}
                onClose={() => setIsMapGuideOpen(false)}
                onAskQuestion={handleAskLocationQuestion}
                pinScale={mapPinScale}
                liliAvatar={agentConfig.lili.avatar}
                liliName={agentConfig.lili.name}
            />

            <UserProfileModal
                profile={userProfile}
                currentUser={currentUser}
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveUserProfile}
            />
        </div>
    );
};
