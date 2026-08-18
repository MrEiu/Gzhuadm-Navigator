import React from 'react';
import { BrainCircuit, History, Plus, User as UserIcon, LogOut, Sliders } from 'lucide-react';
import { User, UserProfile } from '../../types';

interface ChatHeaderProps {
    currentUser: User;
    userProfile: UserProfile | null;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCreateSession: () => void;
    onOpenProfileModal: () => void;
    onLogout: () => void;
    onSwitchPortal?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    currentUser,
    userProfile,
    isSidebarOpen,
    onToggleSidebar,
    onCreateSession,
    onOpenProfileModal,
    onLogout,
    onSwitchPortal
}) => {
    return (
        <header className="pt-8 pb-3 px-4 sm:px-8 flex items-center justify-between z-10 bg-white/40 backdrop-blur-md border-b border-white/60 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[16px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.4)] border-2 border-white">
                    <BrainCircuit className="text-white" size={20} />
                </div>
                <div>
                    <h1 className="font-black text-[#4a4365] text-[15px] sm:text-[17px] tracking-tight">Gzadm Navigator</h1>
                    <p className="text-[9px] sm:text-[10px] text-[#a494e8] font-black uppercase tracking-widest">
                        Admissions Counseling
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                    onClick={onToggleSidebar}
                    className={`p-2 rounded-2xl transition-all border border-white flex items-center gap-1.5 text-[12px] font-bold cursor-pointer ${isSidebarOpen ? 'bg-[#4a4365] text-white shadow-sm' : 'bg-white/80 hover:bg-white text-[#4a4365]'
                        }`}
                    title={isSidebarOpen ? "隐藏历史对话" : "展开历史对话"}
                >
                    <History size={16} />
                    <span className="hidden sm:inline">{isSidebarOpen ? "收起历史" : "历史对话"}</span>
                </button>

                <button
                    onClick={onCreateSession}
                    className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(179,164,237,0.4)] flex items-center gap-1 text-[12px] font-bold cursor-pointer"
                    title="新建对话"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">新建对话</span>
                </button>

                <button
                    onClick={onOpenProfileModal}
                    className="flex items-center gap-1.5 bg-white/80 hover:bg-white px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white text-[12px] font-bold text-[#4a4365] transition-all shadow-xs cursor-pointer"
                    title="点击查看/修改高考个人背景资料"
                >
                    <UserIcon size={13} className="text-[#a494e8]" />
                    <span className="max-w-[70px] sm:max-w-[90px] truncate">{userProfile?.name || currentUser.username}</span>
                    {userProfile?.score ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-700">
                            {userProfile.score}分
                        </span>
                    ) : (
                        <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md font-bold animate-pulse">未填资料</span>
                    )}
                </button>

                {onSwitchPortal && (
                    <button
                        onClick={onSwitchPortal}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-[#4a4365] to-[#5c547d] text-white px-2.5 sm:px-3 py-1.5 rounded-2xl text-[12px] font-bold shadow-[0_4px_12px_rgba(74,67,101,0.25)] hover:opacity-95 active:scale-95 transition-all cursor-pointer border border-purple-300/40"
                        title="切换至后台管理控制台"
                    >
                        <Sliders size={13} className="text-purple-200" />
                        <span className="hidden sm:inline">管理控制台</span>
                    </button>
                )}

                <button
                    onClick={onLogout}
                    title="退出登录"
                    className="p-2 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 cursor-pointer"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
};
