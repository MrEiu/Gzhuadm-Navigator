import React, { useState, useEffect } from 'react';
import { User, UserProfile } from '../../types';
import { API_BASE } from '../../api/config';
import {
    User as UserIcon, Globe, Lock, ShieldCheck,
    ArrowRight, Check, X
} from 'lucide-react';

interface UserProfileModalProps {
    profile: UserProfile | null;
    currentUser: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    profile,
    currentUser,
    isOpen,
    onClose,
    onSave
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'password'>('profile');
    const [formData, setFormData] = useState<UserProfile>({
        name: profile?.name || '',
        gender: profile?.gender || '男',
        avatar: profile?.avatar || '🎓',
        phone: profile?.phone || currentUser?.phone || '',
        email: profile?.email || currentUser?.email || '',
        province: profile?.province || '广东',
        score: profile?.score || '',
        rank: profile?.rank || '',
        subjects: profile?.subjects || '物化生',
        specialConditions: profile?.specialConditions || ''
    });

    const [passData, setPassData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passStatusMsg, setPassStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [isChangingPass, setIsChangingPass] = useState(false);

    useEffect(() => {
        if (profile || currentUser) {
            setFormData({
                name: profile?.name || '',
                gender: profile?.gender || '男',
                avatar: profile?.avatar || '🎓',
                phone: profile?.phone || currentUser?.phone || '',
                email: profile?.email || currentUser?.email || '',
                province: profile?.province || '广东',
                score: profile?.score || '',
                rank: profile?.rank || '',
                subjects: profile?.subjects || '物化生',
                specialConditions: profile?.specialConditions || ''
            });
        }
    }, [profile, currentUser]);

    if (!isOpen) return null;

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim() || !formData.score || !formData.province) {
            alert('请完整填写姓名、省份和高考分数！');
            return;
        }
        onSave(formData);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassStatusMsg(null);
        if (!passData.oldPassword || !passData.newPassword || !passData.confirmPassword) {
            setPassStatusMsg({ type: 'error', text: '请完整填写原密码、新密码与确认密码' });
            return;
        }
        if (passData.newPassword !== passData.confirmPassword) {
            setPassStatusMsg({ type: 'error', text: '两次输入的新密码不一致' });
            return;
        }
        setIsChangingPass(true);
        try {
            const res = await fetch(`${API_BASE}/api/user/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentUser?.username,
                    currentPassword: passData.oldPassword,
                    newPassword: passData.newPassword
                })
            });
            const data = await res.json();
            if (data.ok) {
                setPassStatusMsg({ type: 'success', text: '密码已成功修改并通过 Bcrypt 加密保存！' });
                setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setPassStatusMsg({ type: 'error', text: data.error || '密码修改失败' });
            }
        } catch (e: any) {
            setPassStatusMsg({ type: 'error', text: `网络连接失败: ${e.message}` });
        } finally {
            setIsChangingPass(false);
        }
    };

    const AVATARS = ['🎓', '⚡', '🌟', '🚀', '💡', '🎨', '🔥', '🏆'];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[600px] w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border-4 border-white space-y-5 animate-in zoom-in-95 duration-300">

                {/* Header Hero Banner */}
                <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 rounded-3xl p-5 text-white shadow-md flex items-center justify-between overflow-hidden">
                    <div className="flex items-center gap-3.5 z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/80 text-2xl flex items-center justify-center shadow-md">
                            {formData.avatar}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-[18px] tracking-tight">{formData.name || currentUser?.username}</h3>
                                <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-bold">
                                    {Number(formData.score) > 580 ? 'VIP 高分考生' : '高考考生'}
                                </span>
                            </div>
                            <p className="text-[11.5px] opacity-90 font-mono mt-0.5">账号: @{currentUser?.username}</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white z-10 transition-all cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Selection */}
                <div className="flex bg-[#f0ebf8] p-1 rounded-2xl text-[12.5px] font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'profile' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
                            }`}
                    >
                        <UserIcon size={14} /> 高考背景资料
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'account' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
                            }`}
                    >
                        <Globe size={14} /> 账号与绑定
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'password' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
                            }`}
                    >
                        <Lock size={14} /> 安全重置密码
                    </button>
                </div>

                {/* TAB 1: 高考背景资料 */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in">
                        <div>
                            <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1.5">选择个性头像标识</label>
                            <div className="flex items-center gap-2">
                                {AVATARS.map(av => (
                                    <button
                                        key={av}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, avatar: av })}
                                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${formData.avatar === av ? 'bg-purple-100 border-2 border-purple-600 scale-110' : 'bg-[#f8f6fc] hover:bg-purple-50'
                                            }`}
                                    >
                                        {av}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">真实姓名 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="请输入您的姓名"
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">性别</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as '男' | '女' })}
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                >
                                    <option value="男">男</option>
                                    <option value="女">女</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">高考省份 <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.province}
                                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                >
                                    {['广东', '浙江', '江苏', '四川', '山东', '河南', '湖北', '湖南', '福建', '安徽', '北京', '上海', '重庆', '陕西', '江西', '河北'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">高考总分 <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    min={100}
                                    max={750}
                                    value={formData.score}
                                    onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                                    placeholder="如: 595"
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-purple-600 outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">全省排名</label>
                                <input
                                    type="number"
                                    value={formData.rank}
                                    onChange={(e) => setFormData({ ...formData, rank: e.target.value ? Number(e.target.value) : '' })}
                                    placeholder="如: 15000"
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">选科情况</label>
                            <input
                                type="text"
                                value={formData.subjects}
                                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                placeholder="如：物理/化学/生物 或 史地政、物化地等"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">特殊情况 / 报考意向说明</label>
                            <textarea
                                rows={2}
                                value={formData.specialConditions}
                                onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
                                placeholder="如：意向大湾区就业、倾向计算机/软件工程、家庭预算考量等"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl p-3 text-[12px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="w-full bg-[#4a4365] hover:bg-[#342e49] text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>保存个人高考背景资料</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 2: 账号与绑定信息 */}
                {activeTab === 'account' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in">
                        <div className="bg-[#f8f6fc] p-4 rounded-2xl space-y-3">
                            <div>
                                <label className="text-[11.5px] font-bold text-gray-500 block mb-1">系统账号名</label>
                                <input
                                    type="text"
                                    disabled
                                    value={currentUser?.username || ''}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-gray-700 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1">绑定手机号</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="如: 13800138000"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-purple-400"
                                />
                            </div>

                            <div>
                                <label className="text-[11.5px] font-bold text-[#4a4365] block mb-1">绑定电子邮箱</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="如: student@example.com"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-purple-400"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="w-full bg-[#4a4365] hover:bg-[#342e49] text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>保存绑定联系方式</span>
                                <Check size={16} />
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: 安全重置密码 */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in">
                        {passStatusMsg && (
                            <div className={`p-3 rounded-2xl text-[12px] font-bold border text-center ${passStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'
                                }`}>
                                {passStatusMsg.text}
                            </div>
                        )}

                        <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100 text-[11px] text-amber-800 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                            <span>您的密码将使用 Node `bcryptjs` 算法进行 10 轮加盐哈希保护存储。</span>
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">原密码</label>
                            <input
                                type="password"
                                required
                                value={passData.oldPassword}
                                onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                                placeholder="请输入当前原密码"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">新密码</label>
                            <input
                                type="password"
                                required
                                value={passData.newPassword}
                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                placeholder="请输入全新密码"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">确认新密码</label>
                            <input
                                type="password"
                                required
                                value={passData.confirmPassword}
                                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                placeholder="再次输入新密码确认"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isChangingPass}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Lock size={16} />
                                <span>{isChangingPass ? '密码修改中...' : '立即重置并 Bcrypt 加密保存'}</span>
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};
