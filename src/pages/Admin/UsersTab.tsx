import React, { useState, useEffect } from 'react';
import {
    Users, Search, Shield, Sparkles, KeyRound,
    Edit3, History, Bookmark, Trash2, Sliders, CheckCircle,
    UserCheck, Award, MapPin, BookOpen, RefreshCw
} from 'lucide-react';
import { User, StrategyConfig } from '../../types';
import { API_BASE } from '../../api/config';
import { AdminEditUserModal } from './AdminEditUserModal';
import { AdminResetPasswordModal } from './AdminResetPasswordModal';
import { UserChatHistoryModal } from './UserChatHistoryModal';
import { PersonalRagModal } from '../UserProfile/PersonalRagModal';

interface UsersTabProps {
    onRefreshStats?: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({ onRefreshStats }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Strategy & Threshold Console State (saved to localStorage)
    const [strategy, setStrategy] = useState<StrategyConfig>(() => {
        try {
            const saved = localStorage.getItem('gzadm_admin_strategy');
            return saved ? JSON.parse(saved) : { cutoffScore: 430, vipScore: 580, enabled: true };
        } catch {
            return { cutoffScore: 430, vipScore: 580, enabled: true };
        }
    });
    const [strategySaved, setStrategySaved] = useState(false);

    // Selected Modals
    const [editUser, setEditUser] = useState<User | null>(null);
    const [resetPassUser, setResetPassUser] = useState<User | null>(null);
    const [historyUsername, setHistoryUsername] = useState<string | null>(null);
    const [personalRagUsername, setPersonalRagUsername] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/users`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.users)) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Fetch users error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSaveStrategy = () => {
        localStorage.setItem('gzadm_admin_strategy', JSON.stringify(strategy));
        setStrategySaved(true);
        setTimeout(() => setStrategySaved(false), 2000);
    };

    const handleToggleVip = async (targetUser: User) => {
        const nextVip = !(targetUser.profile?.isVip || (Number(targetUser.profile?.score) > 580));
        try {
            const res = await fetch(`${API_BASE}/api/admin/users/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUsername: targetUser.username,
                    isVip: nextVip
                })
            });
            const data = await res.json();
            if (data.ok) {
                fetchUsers();
                onRefreshStats?.();
            }
        } catch (err) {
            console.error('Toggle VIP error:', err);
        }
    };

    const handleToggleRole = async (targetUser: User) => {
        if (targetUser.username === 'admin') {
            alert('系统默认超级管理员 admin 无法降级为普通考生');
            return;
        }
        const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
        const confirmMsg = nextRole === 'admin'
            ? `确定将考生【${targetUser.username}】提拔为管理后台管理员 (Admin) 吗？`
            : `确定将管理员【${targetUser.username}】降级为普通考生 (User) 吗？`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUsername: targetUser.username,
                    role: nextRole
                })
            });
            const data = await res.json();
            if (data.ok) {
                fetchUsers();
            } else {
                alert(data.error || '切换角色失败');
            }
        } catch (err) {
            console.error('Toggle role error:', err);
        }
    };

    const handleDeleteUser = async (username: string) => {
        if (username === 'admin') {
            alert('系统默认超级管理员 admin 无法删除');
            return;
        }
        if (!window.confirm(`⚠️ 危险操作：确定要彻底注销并删除考生账号【${username}】及其高考档案吗？`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.ok) {
                fetchUsers();
                onRefreshStats?.();
            } else {
                alert(data.error || '删除失败');
            }
        } catch (err) {
            console.error('Delete user error:', err);
        }
    };

    const filteredUsers = users.filter(u => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const usernameMatch = u.username.toLowerCase().includes(q);
        const nameMatch = (u.profile?.name || '').toLowerCase().includes(q);
        const provinceMatch = (u.profile?.province || '').toLowerCase().includes(q);
        return usernameMatch || nameMatch || provinceMatch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">

            {/* 1. Strategy & Threshold Console */}
            <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 backdrop-blur-xl rounded-[32px] p-6 border border-purple-200/60 shadow-[0_8px_25px_rgba(186,175,215,0.18)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center shadow-md">
                            <Sliders size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[16px] tracking-tight flex items-center gap-2">
                                考生分流与 VIP 策略阈值控制台
                            </h3>
                            <p className="text-[11.5px] text-[#8a84a4]">配置高考总分风控熔断线与 VIP 深度服务位次门槛</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-[12px] font-bold text-[#4a4365] bg-white px-3 py-1.5 rounded-2xl border border-purple-100 shadow-xs cursor-pointer">
                            <input
                                type="checkbox"
                                checked={strategy.enabled}
                                onChange={(e) => setStrategy({ ...strategy, enabled: e.target.checked })}
                                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                            />
                            <span>分流策略状态：{strategy.enabled ? '已启用' : '已暂停'}</span>
                        </label>

                        <button
                            onClick={handleSaveStrategy}
                            className="px-4 py-2 rounded-2xl bg-[#4a4365] text-white text-[12px] font-bold hover:bg-[#342e49] shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            {strategySaved ? <CheckCircle size={14} className="text-emerald-400" /> : null}
                            {strategySaved ? '策略已保存' : '保存策略'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Cutoff Slider */}
                    <div className="bg-white/80 rounded-2xl p-4 border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <Shield size={14} className="text-rose-500" /> 压线风险拦截阈值
                            </span>
                            <span className="text-[13px] font-bold text-rose-600 font-mono">
                                &lt; {strategy.cutoffScore} 分
                            </span>
                        </div>
                        <input
                            type="range"
                            min="300"
                            max="600"
                            step="5"
                            value={strategy.cutoffScore}
                            onChange={(e) => setStrategy({ ...strategy, cutoffScore: Number(e.target.value) })}
                            className="w-full accent-rose-500 cursor-pointer"
                        />
                        <div className="text-[10.5px] text-gray-400 flex justify-between">
                            <span>300 分 (宽松)</span>
                            <span>低于该分数触发智能熔断拦截</span>
                            <span>600 分 (严格)</span>
                        </div>
                    </div>

                    {/* VIP Threshold Slider */}
                    <div className="bg-white/80 rounded-2xl p-4 border border-purple-100 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-500" /> VIP 专属定制通道阈值
                            </span>
                            <span className="text-[13px] font-bold text-amber-600 font-mono">
                                &ge; {strategy.vipScore} 分
                            </span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="700"
                            step="5"
                            value={strategy.vipScore}
                            onChange={(e) => setStrategy({ ...strategy, vipScore: Number(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="text-[10.5px] text-gray-400 flex justify-between">
                            <span>500 分</span>
                            <span>高于该分数自动授予 VIP 专属徽章</span>
                            <span>700 分</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Search & Filter Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-4 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex items-center justify-between gap-4">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索考生账号名、考生昵称、生源省份..."
                        className="w-full bg-[#f8f6fc] rounded-2xl pl-9 pr-4 py-2 text-[12.5px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[#8a84a4] bg-purple-50 px-3 py-1.5 rounded-xl">
                        共 {filteredUsers.length} 位考生
                    </span>
                    <button
                        onClick={fetchUsers}
                        className="p-2 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 text-gray-500 hover:text-[#4a4365] transition-all cursor-pointer"
                        title="刷新考生列表"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* 3. Candidate Profile Cards */}
            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-gray-400 text-[13px] gap-2">
                    <div className="w-8 h-8 border-3 border-[#a494e8] border-t-transparent rounded-full animate-spin" />
                    <span>正在加载考生档案库...</span>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-12 text-center border border-white space-y-3">
                    <Users size={36} className="mx-auto text-purple-300" />
                    <h4 className="font-bold text-[#4a4365] text-[15px]">未找到符合条件的考生档案</h4>
                    <p className="text-[12px] text-gray-400">请尝试更换检索关键词</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => {
                        const prof = user.profile || {};
                        const isVip = Boolean(prof.isVip || (prof.score && Number(prof.score) > 580));
                        const isAdmin = user.role === 'admin';

                        return (
                            <div
                                key={user.username}
                                className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex flex-col justify-between space-y-4 hover:shadow-[0_10px_30px_rgba(186,175,215,0.25)] transition-all"
                            >
                                {/* Header: Avatar, Name, VIP, Role */}
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {prof.avatar && (prof.avatar.startsWith('http') || prof.avatar.startsWith('/uploads') || prof.avatar.startsWith('data:image')) ? (
                                                <img
                                                    src={prof.avatar}
                                                    alt="avatar"
                                                    className="w-11 h-11 rounded-2xl object-cover shadow-xs border-2 border-white"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : prof.avatar ? (
                                                <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-xl shadow-xs border-2 border-white select-none">
                                                    {prof.avatar}
                                                </div>
                                            ) : (
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center font-bold text-[16px] shadow-xs">
                                                    {(prof.name || user.username).slice(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-black text-[#4a4365] text-[14.5px]">
                                                        {prof.name || '未填昵称'}
                                                    </h4>
                                                    {isVip && (
                                                        <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                                                            <Sparkles size={10} /> VIP
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-[#a494e8] font-mono font-medium">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Role promotion / demotion badge */}
                                        <button
                                            onClick={() => handleToggleRole(user)}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${isAdmin
                                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                                                }`}
                                            title="点击切换管理权限"
                                        >
                                            {isAdmin ? '🛡️ 管理员' : '考生'}
                                        </button>
                                    </div>

                                    {/* Gaokao Info Badges */}
                                    <div className="bg-[#f8f6fc] rounded-2xl p-3.5 space-y-2 border border-purple-100/60 text-[12px]">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-1 text-[#6d648b]">
                                                <MapPin size={13} className="text-[#a494e8]" />
                                                <span>省份: <strong className="text-[#4a4365]">{prof.province || '广东'}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[#6d648b]">
                                                <Award size={13} className="text-amber-500" />
                                                <span>高考分: <strong className="text-[#4a4365] font-mono">{prof.score ? `${prof.score}分` : '未填'}</strong></span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="text-[#6d648b] truncate">
                                                位次: <strong className="text-[#4a4365] font-mono">{prof.rank ? `第${prof.rank}名` : '-'}</strong>
                                            </div>
                                            <div className="text-[#6d648b] truncate">
                                                选科: <strong className="text-[#4a4365]">{prof.subjects || '物化生'}</strong>
                                            </div>
                                        </div>

                                        {prof.specialConditions && (
                                            <div className="text-[11px] text-[#8a84a4] pt-1 border-t border-purple-100 line-clamp-1">
                                                备注: {prof.specialConditions}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons Grid */}
                                <div className="space-y-2 pt-1 border-t border-purple-50">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {/* View Chat History */}
                                        <button
                                            onClick={() => setHistoryUsername(user.username)}
                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <History size={12} /> 查看对话历史
                                        </button>

                                        {/* View Personal Memory */}
                                        <button
                                            onClick={() => setPersonalRagUsername(user.username)}
                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <Bookmark size={12} /> 专属记忆库
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                                        {/* Toggle VIP */}
                                        <button
                                            onClick={() => handleToggleVip(user)}
                                            className={`px-2 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${isVip ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'}`}
                                        >
                                            {isVip ? '⭐ VIP已开启' : '设为VIP'}
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {/* Edit Profile */}
                                            <button
                                                onClick={() => setEditUser(user)}
                                                className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                                title="修改档案资料"
                                            >
                                                <Edit3 size={14} />
                                            </button>

                                            {/* Reset Password */}
                                            <button
                                                onClick={() => setResetPassUser(user)}
                                                className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                                title="强制重置密码"
                                            >
                                                <KeyRound size={14} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDeleteUser(user.username)}
                                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="删除考生账号"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {editUser && (
                <AdminEditUserModal
                    user={editUser}
                    isOpen={Boolean(editUser)}
                    onClose={() => setEditUser(null)}
                    onSuccess={() => {
                        fetchUsers();
                        onRefreshStats?.();
                    }}
                />
            )}

            {resetPassUser && (
                <AdminResetPasswordModal
                    user={resetPassUser}
                    isOpen={Boolean(resetPassUser)}
                    onClose={() => setResetPassUser(null)}
                    onSuccess={() => {
                        alert('密码已成功加密重置！');
                        fetchUsers();
                    }}
                />
            )}

            {historyUsername && (
                <UserChatHistoryModal
                    username={historyUsername}
                    isOpen={Boolean(historyUsername)}
                    onClose={() => setHistoryUsername(null)}
                />
            )}

            {personalRagUsername && (
                <PersonalRagModal
                    username={personalRagUsername}
                    isOpen={Boolean(personalRagUsername)}
                    onClose={() => setPersonalRagUsername(null)}
                />
            )}

        </div>
    );
};
