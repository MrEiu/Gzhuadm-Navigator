import React from 'react';
import {
    User as UserIcon, Shield, ShieldCheck, Sparkles, MessageSquare,
    Lock, Edit3, Trash2, Search, BrainCircuit, Sliders, Check, Clock
} from 'lucide-react';
import { User } from '../../types';

interface UsersTabProps {
    registeredUsersList: User[];
    adminUserSearch: string;
    setAdminUserSearch: React.Dispatch<React.SetStateAction<string>>;
    interceptionEnabled: boolean;
    setInterceptionEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    lowScoreThreshold: number;
    setLowScoreThreshold: React.Dispatch<React.SetStateAction<number>>;
    vipScoreThreshold: number;
    setVipScoreThreshold: React.Dispatch<React.SetStateAction<number>>;
    onToggleVip: (username: string) => void;
    onOpenEditUser: (user: User) => void;
    onOpenResetPassword: (user: User) => void;
    onOpenPersonalRag: (username: string) => void;
    onOpenChatHistory: (username: string) => void;
    onToggleRole: (user: User) => void;
    onDeleteUser: (username: string) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
    registeredUsersList,
    adminUserSearch,
    setAdminUserSearch,
    interceptionEnabled,
    setInterceptionEnabled,
    lowScoreThreshold,
    setLowScoreThreshold,
    vipScoreThreshold,
    setVipScoreThreshold,
    onToggleVip,
    onOpenEditUser,
    onOpenResetPassword,
    onOpenPersonalRag,
    onOpenChatHistory,
    onToggleRole,
    onDeleteUser
}) => {
    const filteredUsers = registeredUsersList.filter(u => {
        const q = adminUserSearch.toLowerCase().trim();
        if (!q) return true;
        return (
            u.username.toLowerCase().includes(q) ||
            (u.profile?.name && u.profile.name.toLowerCase().includes(q)) ||
            (u.profile?.province && u.profile.province.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Admissions Strategy & Score Control Console */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <Sliders size={18} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[14px]">招生智能分流与风险拦截策略中枢</h3>
                            <p className="text-[11px] text-gray-500">动态调节算力熔断拦截线与高分 VIP 深度方案通道</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setInterceptionEnabled(!interceptionEnabled)}
                        className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${interceptionEnabled
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${interceptionEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span>{interceptionEnabled ? '分流策略运行中' : '策略已暂停'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Low Score Busy-Lock Cutoff Slider */}
                    <div className="bg-[#fbf9fe] p-4 rounded-2xl border border-purple-50 space-y-2">
                        <div className="flex items-center justify-between text-[12.5px] font-bold text-[#4a4365]">
                            <span className="flex items-center gap-1.5 text-amber-700">
                                ⚠️ 压线风险拦截阈值 (算力熔断拒绝服务)
                            </span>
                            <span className="text-amber-600 font-mono font-black">{lowScoreThreshold} 分</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400">
                            低于此分数的考生在咨询时将触发高峰期智能排队/拒绝服务保护，以节省计算资源。
                        </p>
                        <input
                            type="range"
                            min={300}
                            max={600}
                            step={5}
                            value={lowScoreThreshold}
                            onChange={(e) => setLowScoreThreshold(Number(e.target.value))}
                            className="w-full accent-amber-600 cursor-pointer"
                        />
                    </div>

                    {/* VIP Priority Slider */}
                    <div className="bg-[#fbf9fe] p-4 rounded-2xl border border-purple-50 space-y-2">
                        <div className="flex items-center justify-between text-[12.5px] font-bold text-[#4a4365]">
                            <span className="flex items-center gap-1.5 text-purple-700">
                                ✨ VIP 专属定制通道阈值 (高分优先服务)
                            </span>
                            <span className="text-purple-600 font-mono font-black">{vipScoreThreshold} 分</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400">
                            高于此分数的考生自动激活 VIP 身份，享有专属个性化档案记忆与高位次深度匹配。
                        </p>
                        <input
                            type="range"
                            min={500}
                            max={700}
                            step={5}
                            value={vipScoreThreshold}
                            onChange={(e) => setVipScoreThreshold(Number(e.target.value))}
                            className="w-full accent-purple-600 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* 2. User Search Bar */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-white shadow-xs flex items-center justify-between gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={adminUserSearch}
                        onChange={(e) => setAdminUserSearch(e.target.value)}
                        placeholder="搜索考生账号名、真实姓名、省份..."
                        className="w-full bg-[#f8f6fc] pl-9 pr-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                    />
                </div>
                <div className="text-[12px] font-bold text-gray-500 shrink-0">
                    共 <span className="text-purple-600">{filteredUsers.length}</span> 位注册用户
                </div>
            </div>

            {/* 3. User Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((u) => {
                    const p = u.profile || {};
                    const isVip = p.isVip || (p.score && Number(p.score) >= vipScoreThreshold);
                    const isAdmin = u.role === 'admin';

                    return (
                        <div
                            key={u.username}
                            className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${isAdmin
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                            : isVip
                                                ? 'bg-gradient-to-br from-[#b3a4ed] to-[#f296b2]'
                                                : 'bg-gray-300'
                                        }`}>
                                        {isAdmin ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-[#4a4365] text-[14px] truncate flex items-center gap-1.5">
                                            <span>{p.name || u.username}</span>
                                            {isAdmin && (
                                                <span className="text-[9px] bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-gray-400 truncate">@{u.username}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    {/* VIP Switch */}
                                    <button
                                        onClick={() => onToggleVip(u.username)}
                                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${isVip
                                                ? 'bg-pink-100 text-pink-700'
                                                : 'bg-gray-100 text-gray-500 hover:bg-pink-50'
                                            }`}
                                    >
                                        <Sparkles size={11} />
                                        <span>{isVip ? 'VIP 考生' : '普通考生'}</span>
                                    </button>

                                    {/* Role Switch */}
                                    <button
                                        onClick={() => onToggleRole(u)}
                                        disabled={u.username === 'admin'}
                                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md transition-all ${u.username === 'admin'
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : isAdmin
                                                    ? 'bg-indigo-50 text-indigo-700 hover:bg-red-50 hover:text-red-600 cursor-pointer'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700 cursor-pointer'
                                            }`}
                                        title={isAdmin ? '点击降级为普通考生' : '点击提拔为超级管理员'}
                                    >
                                        {isAdmin ? '👑 设为普通考生' : '⚡ 提拔管理员'}
                                    </button>
                                </div>
                            </div>

                            {/* GaoKao Profile Details */}
                            <div className="bg-[#fbf9fe] p-3 rounded-2xl border border-purple-50 text-[11.5px] space-y-1.5">
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>省份 / 成绩:</span>
                                    <span className="font-bold text-[#4a4365]">
                                        {p.province || '未填'} · <b className="text-purple-600 font-mono">{p.score ? `${p.score} 分` : '暂无'}</b>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>全省位次 / 选科:</span>
                                    <span className="font-bold text-[#4a4365]">
                                        {p.rank ? `第 ${p.rank} 名` : '-'} · {p.subjects || '-'}
                                    </span>
                                </div>
                                {p.specialConditions && (
                                    <div className="text-[10.5px] text-gray-500 pt-1 border-t border-purple-50 truncate">
                                        意向: {p.specialConditions}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-purple-50">
                                {/* Left Quick Penetration Buttons */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => onOpenChatHistory(u.username)}
                                        className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                        title="穿透查看该考生的全部历史问答记录"
                                    >
                                        <MessageSquare size={13} />
                                        <span>对话回放</span>
                                    </button>

                                    <button
                                        onClick={() => onOpenPersonalRag(u.username)}
                                        className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                        title="查看该考生的专属个性化记忆"
                                    >
                                        <BrainCircuit size={13} />
                                        <span>偏好记忆</span>
                                    </button>
                                </div>

                                {/* Right Edit & Reset Buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onOpenEditUser(u)}
                                        className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                        title="编辑考生档案与权限"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onOpenResetPassword(u)}
                                        className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                        title="强制重置密码"
                                    >
                                        <Lock size={14} />
                                    </button>
                                    {u.username !== 'admin' && (
                                        <button
                                            onClick={() => onDeleteUser(u.username)}
                                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                            title="删除此账号"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
