import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Clock, User as UserIcon, Bot, RefreshCw } from 'lucide-react';
import { ChatSession } from '../../types';
import { API_BASE } from '../../api/config';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';

interface UserChatHistoryModalProps {
    username: string;
    onClose: () => void;
}

export const UserChatHistoryModal: React.FC<UserChatHistoryModalProps> = ({ username, onClose }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        fetch(`${API_BASE}/api/user/sessions?username=${encodeURIComponent(username)}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && Array.isArray(data.sessions)) {
                    setSessions(data.sessions);
                    if (data.sessions.length > 0) {
                        setActiveSessionId(data.sessions[0].id);
                    }
                }
            })
            .catch(err => console.error('Failed to load user chat history:', err))
            .finally(() => setLoading(false));
    }, [username]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-3 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-white to-pink-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#a494e8] to-[#c7b8f9] text-white flex items-center justify-center shadow-md shrink-0 font-bold">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-[#4a4365] text-[16px]">
                                    考生咨询历史穿透：@{username}
                                </h3>
                                <span className="bg-purple-100 text-purple-700 text-[10.5px] font-bold px-2 py-0.5 rounded-full">
                                    {sessions.length} 个历史会话
                                </span>
                            </div>
                            <p className="text-[11px] text-[#8a84a4]">回放该考生与 AI 招生顾问的完整多轮对话上下文</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Session List */}
                    <div className="w-60 border-r border-gray-100 bg-[#fbf9fe] p-3 overflow-y-auto hide-scrollbar space-y-1.5 shrink-0">
                        <div className="text-[11px] font-black text-gray-400 px-2 py-1 uppercase tracking-wider">
                            历史会话列表
                        </div>
                        {loading ? (
                            <div className="py-8 text-center text-[12px] text-gray-400 flex items-center justify-center gap-1.5">
                                <RefreshCw size={14} className="animate-spin" /> 加载中...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="py-8 text-center text-[12px] text-gray-400">该考生暂无对话记录</div>
                        ) : (
                            sessions.map((sess) => {
                                const isActive = sess.id === activeSessionId;
                                const msgsCount = (sess.messages || []).length;
                                return (
                                    <button
                                        key={sess.id}
                                        onClick={() => setActiveSessionId(sess.id)}
                                        className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${isActive
                                                ? 'bg-white text-[#4a4365] font-bold shadow-xs border-purple-200'
                                                : 'bg-transparent text-gray-600 hover:bg-white/60 border-transparent'
                                            }`}
                                    >
                                        <div className="text-[12.5px] truncate">{sess.title || '咨询会话'}</div>
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                                            <span>{msgsCount} 条消息</span>
                                            <span>{sess.updatedAt ? new Date(sess.updatedAt).toLocaleDateString() : ''}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Right: Message Stream */}
                    <div className="flex-1 p-5 overflow-y-auto hide-scrollbar space-y-4 bg-white/60">
                        {!activeSession || (activeSession.messages || []).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <MessageSquare size={36} className="text-gray-300" />
                                <span className="text-[13px] font-bold">请在左侧选择会话查看详细问答</span>
                            </div>
                        ) : (
                            activeSession.messages.map((m, idx) => {
                                const isUser = m.sender === 'user';
                                return (
                                    <div
                                        key={m.id || idx}
                                        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isUser && (
                                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                                                <Bot size={16} />
                                            </div>
                                        )}
                                        <div className={`max-w-[80%] rounded-3xl p-4 shadow-2xs border ${isUser
                                                ? 'bg-purple-600 text-white border-purple-600 rounded-br-xs'
                                                : 'bg-[#fbf9fe] text-[#4a4365] border-purple-50 rounded-tl-xs'
                                            }`}>
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <span className={`text-[10px] font-bold ${isUser ? 'text-purple-200' : 'text-[#a494e8]'}`}>
                                                    {isUser ? `@${username}` : 'AI 顾问 (Dr. Elena)'}
                                                </span>
                                                {m.createdAt && (
                                                    <span className={`text-[9.5px] flex items-center gap-1 ${isUser ? 'text-purple-200' : 'text-gray-400'}`}>
                                                        <Clock size={10} />
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-[13px] leading-relaxed ${isUser ? 'text-white' : ''}`}>
                                                {isUser ? (
                                                    <div className="whitespace-pre-wrap">{m.text}</div>
                                                ) : (
                                                    <MarkdownViewer content={m.text} roleColor="#8b5cf6" />
                                                )}
                                            </div>
                                        </div>
                                        {isUser && (
                                            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold">
                                                <UserIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between shrink-0">
                    <span className="text-[11px] text-gray-400">
                        当前查阅考生：@{username}
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-[#4a4365] hover:bg-[#342e49] text-white px-5 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
