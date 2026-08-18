import React, { useState, useEffect } from 'react';
import { X, History, MessageSquare, Bot, User as UserIcon, Calendar, Clock, Inbox } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatSession } from '../../types';
import { API_BASE } from '../../api/config';

interface UserChatHistoryModalProps {
    username: string;
    isOpen: boolean;
    onClose: () => void;
}

export const UserChatHistoryModal: React.FC<UserChatHistoryModalProps> = ({
    username,
    isOpen,
    onClose
}) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && username) {
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
                .catch(err => console.error('Failed to fetch user chat history:', err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, username]);

    if (!isOpen) return null;

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[960px] w-full h-[85vh] flex flex-col shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Top Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(179,164,237,0.35)]">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[16px] tracking-tight">
                                考生咨询对话记录穿透回放
                            </h3>
                            <p className="text-[11px] text-[#8a84a4]">
                                目标考生：<span className="font-mono text-[#a494e8] font-bold">@{username}</span>
                                {sessions.length > 0 && `（共发现 ${sessions.length} 个咨询会话）`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl text-gray-400 hover:text-[#4a4365] hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content Area: Sidebar Sessions List + Message Stream */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-[13px] gap-2">
                        <div className="w-8 h-8 border-3 border-[#a494e8] border-t-transparent rounded-full animate-spin" />
                        <span>正在穿透加载考生历史对话...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-300">
                            <Inbox size={32} />
                        </div>
                        <h4 className="font-bold text-[#4a4365] text-[15px]">该考生暂无历史咨询记录</h4>
                        <p className="text-[12px] text-gray-400 max-w-sm">考生尚未与 AI 顾问 Dr. Elena 发起咨询，或历史会话已被考生自行清空。</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                        {/* Sessions Sidebar */}
                        <div className="w-full md:w-72 bg-[#f9f7fd] border-b md:border-b-0 md:border-r border-purple-100/60 p-3 overflow-y-auto space-y-2 shrink-0 max-h-48 md:max-h-none">
                            <div className="text-[11px] font-black uppercase text-[#8a84a4] tracking-wider px-2 py-1 flex items-center gap-1.5">
                                <MessageSquare size={13} className="text-[#a494e8]" /> 会话列表 ({sessions.length})
                            </div>
                            {sessions.map((sess) => {
                                const isActive = sess.id === activeSessionId;
                                const msgCount = sess.messages?.length || 0;
                                return (
                                    <button
                                        key={sess.id}
                                        onClick={() => setActiveSessionId(sess.id)}
                                        className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${isActive
                                            ? 'bg-white shadow-[0_4px_12px_rgba(186,175,215,0.25)] border-[#d6cbf5]'
                                            : 'hover:bg-white/60 border-transparent text-[#6d648b]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[12.5px] font-bold truncate max-w-[170px] ${isActive ? 'text-[#4a4365]' : 'text-[#6d648b]'}`}>
                                                {sess.title || '招生咨询'}
                                            </span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-mono">
                                                {msgCount}条
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {sess.updatedAt ? new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '刚刚'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dialogue Stream */}
                        <div className="flex-1 bg-[#faf8fc] p-4 sm:p-6 overflow-y-auto space-y-4">
                            {activeSession && activeSession.messages && activeSession.messages.length > 0 ? (
                                <div className="space-y-4 max-w-3xl mx-auto">
                                    <div className="text-center">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-xs">
                                            <Calendar size={11} /> 会话创建于：{new Date(activeSession.createdAt || Date.now()).toLocaleString()}
                                        </span>
                                    </div>

                                    {activeSession.messages.map((msg, i) => {
                                        const isUser = msg.sender === 'user';
                                        return (
                                            <div
                                                key={msg.id || i}
                                                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                {/* Avatar */}
                                                <div
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white text-[12px] font-bold ${isUser
                                                        ? 'bg-gradient-to-tr from-[#b3a4ed] to-[#c7b8f9]'
                                                        : 'bg-[#4a4365]'
                                                        }`}
                                                >
                                                    {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                                                </div>

                                                {/* Bubble */}
                                                <div
                                                    className={`max-w-[85%] rounded-[24px] p-4 text-[13px] leading-relaxed shadow-[0_4px_16px_rgba(203,195,225,0.2)] border ${isUser
                                                        ? 'bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white border-transparent'
                                                        : 'bg-white text-[#4a4365] border-white/80'
                                                        }`}
                                                >
                                                    <div className="text-[10px] font-bold mb-1 opacity-75">
                                                        {isUser ? `考生 @${username}` : 'AI 顾问 Dr. Elena'}
                                                    </div>
                                                    {isUser ? (
                                                        <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                                                    ) : (
                                                        <div className="prose prose-sm max-w-none text-[#4a4365] prose-headings:font-bold prose-headings:text-[#4a4365] prose-p:my-1 prose-table:my-2 prose-th:bg-purple-50 prose-td:border-gray-200">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.text}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 text-[12px]">
                                    当前选中的会话内暂无具体消息
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end px-6 py-3 border-t border-gray-100 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-2xl bg-[#4a4365] text-white text-[12px] font-bold hover:bg-[#342e49] transition-all cursor-pointer"
                    >
                        关闭回放
                    </button>
                </div>

            </div>
        </div>
    );
};
