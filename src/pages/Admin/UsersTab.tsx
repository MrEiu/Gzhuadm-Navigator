import React from 'react';
import { Search, Sparkles, ChevronRight, Edit3, Lock } from 'lucide-react';
import { User } from '../../types';

interface UsersTabProps {
    registeredUsersList: User[];
    adminUserSearch: string;
    setAdminUserSearch: (s: string) => void;
    interceptionEnabled: boolean;
    setInterceptionEnabled: (e: boolean) => void;
    lowScoreThreshold: number;
    setLowScoreThreshold: (t: number) => void;
    vipScoreThreshold: number;
    setVipScoreThreshold: (t: number) => void;
    onToggleUserVip: (username: string) => void;
    onOpenUserPersonalRag: (username: string) => void;
    onEditUser: (user: User) => void;
    onResetPassword: (user: User) => void;
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
    onToggleUserVip,
    onOpenUserPersonalRag,
    onEditUser,
    onResetPassword
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Threshold Control Card */}
            <div className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[14px]">
                            高考分数分流与个性化策略阈值
                        </h3>
                        <p className="text-[11px] text-[#8a84a4]">
                            控制咨询过程中针对不同分段考生的智能策略介入与 VIP 记忆通道
                        </p>
                    </div>
                    <button
                        onClick={() => setInterceptionEnabled(!interceptionEnabled)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${interceptionEnabled
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                    >
                        {interceptionEnabled ? '分流策略已启用' : '策略已暂停'}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#f8f6fc] p-3.5 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365]">压线风险拦截阈值</span>
                            <span className="text-[13px] font-black text-rose-500">{lowScoreThreshold} 分</span>
                        </div>
                        <input
                            type="range"
                            min="300"
                            max="600"
                            value={lowScoreThreshold}
                            onChange={(e) => setLowScoreThreshold(Number(e.target.value))}
                            className="w-full accent-rose-500 cursor-pointer"
                        />
                        <p className="text-[10px] text-gray-400">高考分数低于此值的考生，系统将自动强化保底方案推荐</p>
                    </div>

                    <div className="bg-[#f8f6fc] p-3.5 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365]">VIP 专属定制通道阈值</span>
                            <span className="text-[13px] font-black text-purple-600">{vipScoreThreshold} 分</span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="700"
                            value={vipScoreThreshold}
                            onChange={(e) => setVipScoreThreshold(Number(e.target.value))}
                            className="w-full accent-purple-600 cursor-pointer"
                        />
                        <p className="text-[10px] text-gray-400">高考分数高于此值的考生，自动开启高分位次精细化分析</p>
                    </div>
                </div>
            </div>

            {/* User List Header & Search */}
            <div className="flex items-center justify-between bg-white/80 p-3 rounded-2xl border border-white shadow-xs">
                <div className="relative flex-1 sm:w-64">
                    <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                        type="text"
                        value={adminUserSearch}
                        onChange={(e) => setAdminUserSearch(e.target.value)}
                        placeholder="搜索用户名、姓名、高考省份..."
                        className="w-full bg-[#f8f6fc] pl-9 pr-4 py-2 rounded-xl text-[12px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                    />
                </div>
                <span className="text-[11px] font-bold text-[#a494e8] px-3">
                    共 {registeredUsersList.length} 位注册考生
                </span>
            </div>

            {/* Registered User Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredUsersList
                    .filter(u =>
                        !adminUserSearch ||
                        u.username?.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
                        u.profile?.name?.includes(adminUserSearch) ||
                        u.profile?.province?.includes(adminUserSearch)
                    )
                    .map(u => {
                        const isVip = u.profile?.isVip || (typeof u.profile?.score === 'number' && u.profile.score >= vipScoreThreshold);
                        return (
                            <div key={u.username} className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[12px]">
                                                {u.profile?.name ? u.profile.name[0] : u.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#4a4365] text-[13px]">{u.profile?.name || u.username}</div>
                                                <div className="text-[10px] text-gray-400">账号: @{u.username}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => onEditUser(u)}
                                                className="p-1.5 rounded-xl bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 text-[11px] transition-all cursor-pointer"
                                                title="修改考生资料"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                            <button
                                                onClick={() => onResetPassword(u)}
                                                className="p-1.5 rounded-xl bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 text-[11px] transition-all cursor-pointer"
                                                title="强制重置密码"
                                            >
                                                <Lock size={13} />
                                            </button>
                                            <button
                                                onClick={() => onToggleUserVip(u.username)}
                                                className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${isVip ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-purple-50'
                                                    }`}
                                            >
                                                <Sparkles size={12} /> {isVip ? 'VIP 考生' : '设为 VIP'}
                                            </button>
                                        </div>
                                    </div>

                                    {u.profile && Object.keys(u.profile).length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f8f6fc] p-3 rounded-2xl">
                                            <div>高考省份: <span className="font-bold text-[#4a4365]">{u.profile.province || '-'}</span></div>
                                            <div>高考成绩: <span className="font-bold text-purple-600">{u.profile.score ? `${u.profile.score} 分` : '-'}</span></div>
                                            <div>全省排名: <span className="font-bold text-[#4a4365]">{u.profile.rank ? `第 ${u.profile.rank} 名` : '-'}</span></div>
                                            <div>选科组合: <span className="font-bold text-[#4a4365]">{u.profile.subjects || '-'}</span></div>
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-gray-400 bg-[#f8f6fc] p-3 rounded-2xl text-center">
                                            该考生尚未填写高考背景资料
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-[10px] text-gray-400">
                                        注册时间: {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : '预设'}
                                    </span>
                                    <button
                                        onClick={() => onOpenUserPersonalRag(u.username)}
                                        className="text-purple-600 hover:text-purple-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        查看考生偏好记忆 <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
