import React, { useState, useEffect } from 'react';
import {
    Users, Search, KeyRound,
    Edit3, History, Bookmark, Trash2, CheckCircle,
    Award, MapPin, RefreshCw
} from 'lucide-react';
import { User } from '../../types';
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
        const usernameMatch = (u?.username || '').toLowerCase().includes(q);
        const nameMatch = (u?.profile?.name || '').toLowerCase().includes(q);
        const provinceMatch = (u?.profile?.province || '').toLowerCase().includes(q);
        return usernameMatch || nameMatch || provinceMatch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">

            {/* 1. Overview Banner */}
            <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 backdrop-blur-xl rounded-[32px] p-6 border border-purple-200/60 shadow-[0_8px_25px_rgba(186,175,215,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center shadow-md">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[16px] tracking-tight flex items-center gap-2">
                            考生高考画像与专属记忆档案库
                        </h3>
                        <p className="text-[11.5px] text-[#8a84a4]">全体考生默认开启个人专属 RAG 记忆库与高考个性化志愿推演</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] font-bold text-[#4a4365] bg-white/80 px-3.5 py-2 rounded-2xl border border-purple-100 shadow-xs">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span>个人 RAG 专属记忆：全员已启用</span>
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
                        placeholder="搜索考生昵称、用户名、高考省份、选科..."
                        className="w-full bg-[#f8f6fc] rounded-2xl pl-9 pr-4 py-2 text-[12.5px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                    />
                </div>

                <button
                    onClick={fetchUsers}
                    className="p-2 rounded-2xl bg-[#f8f6fc] hover:bg-purple-50 text-[#a494e8] transition-colors cursor-pointer"
                    title="刷新列表"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* 3. User Cards Grid */}
            {loading && users.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-[13px] gap-3">
                    <div className="w-8 h-8 border-3 border-[#a494e8] border-t-transparent rounded-full animate-spin" />
                    <span>正在加载考生画像档案...</span>
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
                        const isAdmin = user.role === 'admin';

                        return (
                            <div
                                key={user.username}
                                className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex flex-col justify-between space-y-4 hover:shadow-[0_10px_30px_rgba(186,175,215,0.25)] transition-all"
                            >
                                {/* Header: Avatar, Name, Role */}
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {prof.avatar && (prof.avatar.startsWith('http') || prof.avatar.startsWith('/uploads') || prof.avatar.startsWith('data:image')) ? (
                                                <img
                                                    src={prof.avatar}
                                                    alt="avatar"
                                                    className="w-11 h-11 rounded-2xl object-cover shadow-xs border-2 border-white"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
                                                </div>
                                                <p className="text-[11px] text-[#a494e8] font-mono font-medium">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>

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
                                                <Award size={13} className="text-purple-600" />
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
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-1 border-t border-purple-50">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => setHistoryUsername(user.username)}
                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <History size={12} /> 查看对话历史
                                        </button>
                                        <button
                                            onClick={() => setPersonalRagUsername(user.username)}
                                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                        >
                                            <Bookmark size={12} /> 专属记忆库
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-end gap-1.5 text-[11px]">
                                        <button
                                            onClick={() => setEditUser(user)}
                                            className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                            title="修改档案资料"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => setResetPassUser(user)}
                                            className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                            title="强制重置密码"
                                        >
                                            <KeyRound size={14} />
                                        </button>
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
