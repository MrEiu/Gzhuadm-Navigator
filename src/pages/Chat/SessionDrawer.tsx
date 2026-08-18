import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { ChatSession } from '../../types';

interface SessionDrawerProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onCreateSession: () => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onCreateSession,
    onDeleteSession
}) => {
    return (
        <aside className="w-full sm:w-56 md:w-60 bg-white/40 backdrop-blur-md border-r border-white/60 flex flex-col p-3 gap-2 overflow-y-auto hide-scrollbar shrink-0 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-gray-100/60">
                <div className="flex items-center gap-1.5 text-[12px] font-black text-[#4a4365]">
                    <MessageSquare size={15} className="text-[#a494e8]" />
                    <span>对话记录 ({sessions.length})</span>
                </div>
                <button
                    onClick={onCreateSession}
                    className="p-1 rounded-xl hover:bg-white text-[#a494e8] transition-colors cursor-pointer"
                    title="新建对话"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="space-y-1.5 flex-1">
                {sessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    const msgCount = (sess.messages || []).length;
                    const lastMsg = (sess.messages || [])[msgCount - 1]?.text || '';

                    return (
                        <div
                            key={sess.id}
                            onClick={() => onSelectSession(sess.id)}
                            className={`group relative p-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-1 border ${isActive
                                    ? 'bg-white shadow-[0_4px_20px_rgba(179,164,237,0.25)] border-[#d6cbf5]'
                                    : 'bg-white/40 hover:bg-white/80 border-transparent text-gray-600'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden pr-6">
                                    <MessageSquare size={14} className={isActive ? 'text-[#a494e8] shrink-0' : 'text-gray-400 shrink-0'} />
                                    <span className={`text-[13px] truncate ${isActive ? 'font-bold text-[#4a4365]' : 'font-medium text-gray-700'}`}>
                                        {sess.title || '新咨询对话'}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => onDeleteSession(sess.id, e)}
                                    title="删除该对话"
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all absolute right-2 top-2.5 cursor-pointer"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-400 pl-5">
                                <span className="truncate max-w-[150px]">
                                    {lastMsg ? lastMsg.replace(/[#*`]/g, '') : '暂无数据'}
                                </span>
                                <span>{msgCount} 条对话</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};
