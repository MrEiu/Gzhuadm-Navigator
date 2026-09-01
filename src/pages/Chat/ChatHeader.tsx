import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, Palette, History, Plus, Sliders, LogOut,
    User as UserIcon, Settings, Cpu, BrainCircuit, Zap, Building2
} from 'lucide-react';
import { User, UserProfile, ChatMode, MultiAgentRoster, BubbleThemeId, AdvisorMode } from '../../types';
import { BUBBLE_THEMES } from '../../constants/bubbleThemes';

interface ChatHeaderProps {
    currentUser: User;
    userProfile: UserProfile | null;
    advisorMode?: AdvisorMode;
    onChangeAdvisorMode?: (mode: AdvisorMode) => void;
    currentTheme: BubbleThemeId;
    onOpenThemeModal?: () => void;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    onCreateSession: () => void;
    onOpenProfileModal?: (tab: 'profile' | 'account') => void;
    onLogout?: () => void;
    onSwitchPortal?: () => void;
    onOpenDiagnostics?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    currentUser,
    userProfile,
    advisorMode = 'agent',
    onChangeAdvisorMode,
    currentTheme,
    onOpenThemeModal,
    isSidebarOpen,
    onToggleSidebar,
    onCreateSession,
    onOpenProfileModal,
    onLogout,
    onSwitchPortal,
    onOpenDiagnostics
}) => {
    const themeConfig = BUBBLE_THEMES[currentTheme] || BUBBLE_THEMES.ios;

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // 点击外部区域自动关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    return (
        <header className="pt-3.5 pb-2.5 px-4 sm:px-8 flex flex-col gap-2 z-20 bg-white/70 backdrop-blur-md border-b border-white/70 shrink-0">
            {/* Top Row: Brand / Title (Left) + Utility Action Buttons (Right) */}
            <div className="flex items-center justify-between gap-3">
                {/* Left Brand / Avatar + Mode Selector */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[16px] flex items-center justify-center border border-white/80 shadow-2xs transition-all shrink-0 bg-gradient-to-tr from-[#b3a4ed] via-[#c7b8f9] to-[#f296b2] text-white">
                        <Building2 size={19} className="drop-shadow-xs" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-[#4a4365] text-[15px] sm:text-[16px] tracking-tight truncate">
                                Gzadm Navigator
                            </h1>
                        </div>
                        <p className="text-[9.5px] sm:text-[10px] text-gray-400 font-normal tracking-wide truncate">
                            广州大学招生与志愿填报智能顾问
                        </p>
                    </div>

                    {/* Mode Selector (放回左上角标签右侧) */}
                    {onChangeAdvisorMode && (
                        <div className="inline-flex p-0.5 bg-[#f6f3fc] rounded-2xl border border-purple-100/70 shadow-2xs shrink-0 ml-1 sm:ml-2">
                            <button
                                type="button"
                                onClick={() => onChangeAdvisorMode('lightweight')}
                                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-[11.5px] transition-all cursor-pointer ${advisorMode === 'lightweight'
                                        ? 'bg-white text-amber-800 shadow-2xs font-bold'
                                        : 'text-gray-500 hover:text-[#4a4365] font-medium'
                                    }`}
                                title="⚡ 极速轻量模式：本地 RAG 毫秒级首字直出，适合查固定事实与快问快答"
                            >
                                <Zap size={12} className={advisorMode === 'lightweight' ? 'text-amber-600 fill-amber-500' : 'text-gray-400'} />
                                <span>极速轻量模式</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => onChangeAdvisorMode('agent')}
                                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-[11.5px] transition-all cursor-pointer ${advisorMode === 'agent'
                                        ? 'bg-white text-purple-700 shadow-2xs font-bold'
                                        : 'text-gray-500 hover:text-[#4a4365] font-medium'
                                    }`}
                                title="🧠 深度智能体模式：同层并发多智能体决策矩阵协同推演（风控/出路/退路），全面透彻综合解答"
                            >
                                <Sparkles size={12} className={advisorMode === 'agent' ? 'text-purple-600' : 'text-gray-400'} />
                                <span>深度智能体模式</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    {/* Bubble Skin / Theme Switcher */}
                    {onOpenThemeModal && (
                        <button
                            type="button"
                            onClick={onOpenThemeModal}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-white/80 hover:bg-white border border-purple-100 text-[11.5px] font-bold text-purple-700 shadow-xs hover:shadow-sm transition-all cursor-pointer"
                            title="切换气泡皮肤样式 (iOS / shadcn / Discord / Neo-Glass)"
                        >
                            <Palette size={13} className="text-purple-600" />
                            <span className="hidden sm:inline">{themeConfig.name}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className={`p-2 rounded-2xl transition-all border border-white flex items-center gap-1.5 text-[12px] font-bold cursor-pointer ${isSidebarOpen ? 'bg-[#4a4365] text-white shadow-sm' : 'bg-white/80 hover:bg-white text-[#4a4365]'
                            }`}
                        title={isSidebarOpen ? "隐藏历史对话" : "展开历史对话"}
                    >
                        <History size={16} />
                        <span className="hidden sm:inline">{isSidebarOpen ? "收起" : "显示"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onCreateSession}
                        className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(179,164,237,0.4)] flex items-center gap-1 text-[12px] font-bold cursor-pointer"
                        title="新建对话"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">新建对话</span>
                    </button>

                    {/* 右上角大头像与下拉操作菜单 */}
                    <div ref={userMenuRef} className="relative ml-0.5 sm:ml-1">
                        <button
                            type="button"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`p-0.5 rounded-[20px] transition-all cursor-pointer border-2 ${isUserMenuOpen
                                    ? 'border-purple-500 shadow-[0_4px_18px_rgba(168,85,247,0.35)] scale-105'
                                    : 'border-white/90 hover:border-purple-300 shadow-sm hover:shadow-md hover:scale-105'
                                }`}
                            title="点击打开个人中心与账号设置"
                        >
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[18px] bg-gradient-to-tr from-purple-100 via-indigo-50 to-pink-100 border border-purple-200/70 overflow-hidden flex items-center justify-center shadow-inner">
                                {userProfile?.avatar && (userProfile.avatar.startsWith('http') || userProfile.avatar.startsWith('/uploads') || userProfile.avatar.startsWith('data:image')) ? (
                                    <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : userProfile?.avatar ? (
                                    <span className="text-xl sm:text-2xl">{userProfile.avatar}</span>
                                ) : (
                                    <UserIcon size={22} className="text-[#a494e8]" />
                                )}
                            </div>
                        </button>

                        {/* 下拉浮层操作菜单 */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_16px_40px_rgba(74,67,101,0.25)] border border-purple-100/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* 用户名片头 */}
                                <div className="px-3 py-2.5 border-b border-gray-100/80 mb-1.5">
                                    <div className="text-[13px] font-black text-[#4a4365] truncate">
                                        {userProfile?.name || currentUser.username}
                                    </div>
                                    <div className="text-[10.5px] text-gray-400 font-mono truncate">
                                        @{currentUser.username} · {currentUser.role === 'admin' ? '系统管理员' : '高考生'}
                                    </div>
                                </div>

                                {/* 1. 个人资料 */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        onOpenProfileModal?.('profile');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-[#4a4365] hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer text-left"
                                >
                                    <UserIcon size={15} className="text-[#a494e8] shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span>个人资料</span>
                                        <span className="text-[10px] text-gray-400 font-normal truncate">高考分数、位次与选科</span>
                                    </div>
                                </button>

                                {/* 2. 账号设置 */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        onOpenProfileModal?.('account');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-[#4a4365] hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer text-left"
                                >
                                    <Settings size={15} className="text-[#a494e8] shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span>账号设置</span>
                                        <span className="text-[10px] text-gray-400 font-normal truncate">头像、信息设置与重置密码</span>
                                    </div>
                                </button>

                                {/* 管理员专享: 管理后台 */}
                                {currentUser.role === 'admin' && onSwitchPortal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            onSwitchPortal();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-[#4a4365] hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer text-left"
                                    >
                                        <Sliders size={15} className="text-purple-600 shrink-0" />
                                        <span>管理后台控制台</span>
                                    </button>
                                )}

                                {/* 管理员专享: API 诊断 */}
                                {currentUser.role === 'admin' && onOpenDiagnostics && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsUserMenuOpen(false);
                                            onOpenDiagnostics();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-[#4a4365] hover:bg-purple-50 hover:text-purple-700 transition-all cursor-pointer text-left"
                                    >
                                        <Cpu size={15} className="text-purple-600 shrink-0" />
                                        <span>API 实时抓包审计</span>
                                    </button>
                                )}

                                <div className="my-1.5 border-t border-gray-100/80" />

                                {/* 退出登录 */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        onLogout?.();
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-bold text-red-500 hover:bg-red-50 transition-all cursor-pointer text-left"
                                >
                                    <LogOut size={15} className="shrink-0" />
                                    <span>退出登录</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
