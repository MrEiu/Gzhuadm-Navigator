import React from 'react';
import { MessageSquare, Trash2, Clock, MapPin } from 'lucide-react';
import { ChatSession } from '../../types';

interface SessionDrawerProps {
    isOpen?: boolean;
    onClose?: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
    onOpenMapGuide?: () => void;
}

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
    isOpen = true,
    onClose,
    sessions,
    activeSessionId,
    onSelectSession,
    onDeleteSession,
    onOpenMapGuide
}) => {
    if (!isOpen) return null;

    const mainSession = sessions[0] || null;
    const recentSessions = sessions.slice(1);

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            <div
                onClick={onClose}
                className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
            />

            <aside className="fixed sm:static inset-y-2 left-2 z-40 sm:z-auto w-[82vw] max-w-[280px] sm:w-56 md:w-60 h-[calc(100%-16px)] sm:h-[calc(100%-24px)] my-0 sm:my-3 ml-0 sm:ml-3 rounded-3xl bg-white/95 sm:bg-white/45 backdrop-blur-2xl sm:backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(74,67,101,0.2)] sm:shadow-[0_8px_30px_rgba(74,67,101,0.06)] flex flex-col p-2.5 sm:p-3 gap-2.5 shrink-0 animate-in slide-in-from-left duration-300 select-none">
            {/* 1. 主对话卡片 */}
            {mainSession && (
                <div className="shrink-0">
                    <div
                        onClick={() => onSelectSession(mainSession.id)}
                        className={`group relative p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col gap-1.5 border ${
                            mainSession.id === activeSessionId
                                ? 'bg-white shadow-[0_4px_16px_rgba(74,67,101,0.08)] border-purple-200 translate-x-0.5'
                                : 'bg-white/60 hover:bg-white/90 border-white/80 shadow-[0_2px_6px_rgba(74,67,101,0.02)] hover:shadow-[0_4px_14px_rgba(74,67,101,0.06)] hover:translate-x-0.5 text-gray-600'
                        }`}
                    >
                        {/* 激活指示光柱 (柔和纯粹) */}
                        {mainSession.id === activeSessionId && (
                            <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-purple-500 rounded-r-full" />
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden pr-2">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                    mainSession.id === activeSessionId
                                        ? 'bg-purple-100 text-purple-700 font-bold border border-purple-200/80'
                                        : 'bg-white/80 group-hover:bg-purple-50 text-gray-400 group-hover:text-purple-600 border border-gray-100'
                                }`}>
                                    <MessageSquare size={13.5} />
                                </div>
                                <span className={`text-[13px] truncate tracking-tight ${
                                    mainSession.id === activeSessionId ? 'font-bold text-[#4a4365]' : 'font-medium text-gray-700'
                                }`}>
                                    主对话
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pl-9 pr-1">
                            <span className="truncate max-w-[125px] font-medium text-gray-400">
                                {(() => {
                                    const msgs = mainSession.messages || [];
                                    const lastMsg = msgs[msgs.length - 1]?.text;
                                    return lastMsg ? lastMsg.replace(/[#*`]/g, '') : '开启新咨询';
                                })()}
                            </span>
                            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100/80 group-hover:bg-purple-50 text-gray-500 group-hover:text-purple-600 transition-colors font-mono shrink-0">
                                {(mainSession.messages || []).length} 条
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. 最近 (Recent Conversations) */}
            <div className="space-y-1.5 flex-1 flex flex-col pt-0.5 min-h-0">
                <div className="px-2 text-[11px] font-black text-[#4a4365] flex items-center gap-1.5 opacity-75 shrink-0">
                    <Clock size={12} className="text-[#a494e8]" />
                    <span>最近</span>
                    <span className="text-[10px] text-gray-400 font-normal">({recentSessions.length})</span>
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto hide-scrollbar pb-2">
                    {recentSessions.length === 0 ? (
                        <div className="px-3 py-4 text-center text-[11px] text-gray-400/80 bg-white/30 rounded-2xl border border-dashed border-gray-200/60">
                            暂无最近历史对话
                        </div>
                    ) : (
                        recentSessions.map((sess) => {
                            const isActive = sess.id === activeSessionId;
                            const msgCount = (sess.messages || []).length;
                            const lastMsg = (sess.messages || [])[msgCount - 1]?.text || '';

                            return (
                                <div
                                    key={sess.id}
                                    onClick={() => onSelectSession(sess.id)}
                                    className={`group relative p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col gap-1.5 border ${
                                        isActive
                                            ? 'bg-white shadow-[0_4px_16px_rgba(74,67,101,0.08)] border-purple-200 translate-x-0.5'
                                            : 'bg-white/50 hover:bg-white/90 border-white/80 shadow-[0_2px_6px_rgba(74,67,101,0.02)] hover:shadow-[0_4px_14px_rgba(74,67,101,0.06)] hover:translate-x-0.5 text-gray-600'
                                    }`}
                                >
                                    {/* 激活指示光柱 */}
                                    {isActive && (
                                        <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-purple-500 rounded-r-full" />
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden pr-6">
                                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                                isActive
                                                    ? 'bg-purple-100 text-purple-700 font-bold border border-purple-200/80'
                                                    : 'bg-white/80 group-hover:bg-purple-50 text-gray-400 group-hover:text-purple-600 border border-gray-100'
                                            }`}>
                                                <MessageSquare size={13} />
                                            </div>
                                            <span className={`text-[12.5px] truncate tracking-tight ${
                                                isActive ? 'font-bold text-[#4a4365]' : 'font-medium text-gray-700 group-hover:text-[#4a4365]'
                                            }`}>
                                                {sess.title || '新咨询对话'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => onDeleteSession(sess.id, e)}
                                            title="删除该对话"
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all absolute right-2 top-2 cursor-pointer hover:scale-110 active:scale-95"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-400 pl-9 pr-1">
                                        <span className="truncate max-w-[125px] font-medium text-gray-400">
                                            {lastMsg ? lastMsg.replace(/[#*`]/g, '') : '暂无内容'}
                                        </span>
                                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100/80 group-hover:bg-purple-50 text-gray-500 group-hover:text-purple-600 transition-colors font-mono shrink-0">
                                            {msgCount} 条
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. 侧边栏底部：校园全景地图 */}
            {onOpenMapGuide && (
                <div className="pt-2 border-t border-purple-100/60 shrink-0">
                    <button
                        type="button"
                        onClick={onOpenMapGuide}
                        className="w-full flex items-center gap-2.5 p-2 rounded-2xl bg-white/70 hover:bg-white border border-white/90 shadow-[0_2px_8px_rgba(74,67,101,0.03)] hover:shadow-[0_4px_14px_rgba(74,67,101,0.08)] hover:border-purple-200 text-[#4a4365] hover:text-purple-700 transition-all text-left cursor-pointer group"
                    >
                        <div className="w-7 h-7 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80 transition-colors">
                            <MapPin size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-bold truncate group-hover:text-purple-700 transition-colors">校园全景地图</div>
                            <div className="text-[9.5px] text-gray-400 truncate">大学城校区导览</div>
                        </div>
                    </button>
                </div>
            )}
        </aside>
        </>
    );
};
