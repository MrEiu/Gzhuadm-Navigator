import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile } from '../../types';
import { API_BASE } from '../../api/config';
import {
    User as UserIcon, Globe, Lock, ShieldCheck,
    ArrowRight, Check, X, Upload, Image as ImageIcon,
    Sparkles, RefreshCw, Link as LinkIcon
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

    const [avatarMode, setAvatarMode] = useState<'emoji' | 'upload' | 'url'>('emoji');
    const [avatarUrlInput, setAvatarUrlInput] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [passData, setPassData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passStatusMsg, setPassStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [isChangingPass, setIsChangingPass] = useState(false);

    useEffect(() => {
        if (profile || currentUser) {
            const currentAv = profile?.avatar || '🎓';
            setFormData({
                name: profile?.name || '',
                gender: profile?.gender || '男',
                avatar: currentAv,
                phone: profile?.phone || currentUser?.phone || '',
                email: profile?.email || currentUser?.email || '',
                province: profile?.province || '广东',
                score: profile?.score || '',
                rank: profile?.rank || '',
                subjects: profile?.subjects || '物化生',
                specialConditions: profile?.specialConditions || ''
            });

            if (currentAv.startsWith('http') || currentAv.startsWith('/uploads') || currentAv.startsWith('data:image')) {
                setAvatarMode('url');
                setAvatarUrlInput(currentAv);
            }
        }
    }, [profile, currentUser]);

    if (!isOpen) return null;

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim() || !formData.score || !formData.province) {
            alert('请完整填写昵称、省份和高考分数！');
            return;
        }
        onSave(formData);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('图片文件大小不能超过 5MB！');
            return;
        }

        setUploadingAvatar(true);
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
            const base64Data = loadEvent.target?.result as string;
            try {
                const res = await fetch(`${API_BASE}/api/user/upload-avatar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Data, filename: file.name })
                });
                const data = await res.json();
                if (data.ok && data.url) {
                    const fullUrl = data.url.startsWith('http') ? data.url : `${API_BASE}${data.url}`;
                    setFormData(prev => ({ ...prev, avatar: fullUrl }));
                    setAvatarUrlInput(fullUrl);
                } else {
                    // Fallback to direct base64
                    setFormData(prev => ({ ...prev, avatar: base64Data }));
                    setAvatarUrlInput(base64Data);
                }
            } catch {
                setFormData(prev => ({ ...prev, avatar: base64Data }));
                setAvatarUrlInput(base64Data);
            } finally {
                setUploadingAvatar(false);
            }
        };
        reader.readAsDataURL(file);
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

    const isCustomImageAvatar = Boolean(
        formData.avatar &&
        (formData.avatar.startsWith('http') ||
         formData.avatar.startsWith('/uploads') ||
         formData.avatar.startsWith('data:image'))
    );

    const AVATARS = ['🎓', '⚡', '🌟', '🚀', '💡', '🎨', '🔥', '🏆', '🎯', '✨', '🍀', '☕'];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[600px] w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border-4 border-white space-y-5 animate-in zoom-in-95 duration-300 hide-scrollbar">

                {/* Header Hero Banner */}
                <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 rounded-3xl p-5 text-white shadow-md flex items-center justify-between overflow-hidden">
                    <div className="flex items-center gap-3.5 z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/80 overflow-hidden flex items-center justify-center shadow-md shrink-0">
                            {isCustomImageAvatar ? (
                                <img
                                    src={formData.avatar}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                    onError={() => setFormData(prev => ({ ...prev, avatar: '🎓' }))}
                                />
                            ) : (
                                <span className="text-2xl">{formData.avatar || '🎓'}</span>
                            )}
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
                        <UserIcon size={14} /> 高考档案与头像
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

                {/* TAB 1: 高考档案与头像设置 */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in">
                        
                        {/* Avatar Customization Section */}
                        <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11.5px] font-black text-[#4a4365] flex items-center gap-1.5">
                                    <Sparkles size={13} className="text-purple-600" />
                                    <span>设置个性头像 (Emoji / 本地上传 / 图片链接)</span>
                                </label>

                                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-purple-200/60 text-[10.5px] font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMode('emoji')}
                                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${avatarMode === 'emoji' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                                    >
                                        Emoji 标识
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMode('upload')}
                                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${avatarMode === 'upload' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                                    >
                                        本地上传
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMode('url')}
                                        className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${avatarMode === 'url' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                                    >
                                        图片 URL
                                    </button>
                                </div>
                            </div>

                            {/* Mode A: Preset Emojis */}
                            {avatarMode === 'emoji' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {AVATARS.map(av => (
                                        <button
                                            key={av}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, avatar: av })}
                                            className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${formData.avatar === av ? 'bg-purple-600 text-white shadow-xs scale-110' : 'bg-white hover:bg-purple-50 border border-purple-100'
                                                }`}
                                        >
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Mode B: Local Image Upload */}
                            {avatarMode === 'upload' && (
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="px-4 py-2 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[12px] rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                    >
                                        <Upload size={13} className={uploadingAvatar ? 'animate-bounce' : ''} />
                                        <span>{uploadingAvatar ? '正在上传处理...' : '选择本地图片上传'}</span>
                                    </button>
                                    <span className="text-[11px] text-gray-400 font-medium">支持 PNG / JPG / WebP，5MB 以内</span>
                                </div>
                            )}

                            {/* Mode C: External Image URL */}
                            {avatarMode === 'url' && (
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={avatarUrlInput}
                                            onChange={(e) => {
                                                setAvatarUrlInput(e.target.value);
                                                setFormData({ ...formData, avatar: e.target.value.trim() });
                                            }}
                                            placeholder="输入高清图片链接 (如: https://...)"
                                            className="w-full bg-white border border-purple-200 rounded-xl pl-8 pr-3 py-1.5 text-[12px] text-[#4a4365] outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                    {formData.avatar && isCustomImageAvatar && (
                                        <div className="w-8 h-8 rounded-xl overflow-hidden border border-purple-200 shrink-0">
                                            <img src={formData.avatar} alt="preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Nickname & Basic Form */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">
                                    考生昵称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="如：小明、追梦少年"
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
                                    min="0"
                                    max="750"
                                    value={formData.score}
                                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                    placeholder="如: 595"
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">全省位次/排名</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.rank}
                                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                    placeholder="如: 24500"
                                    className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">选考科目组合</label>
                            <input
                                type="text"
                                value={formData.subjects}
                                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                                placeholder="如: 物理+化学+生物 或 历史+政治+地理"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">特殊报考情况说明 (选填)</label>
                            <textarea
                                rows={2}
                                value={formData.specialConditions}
                                onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
                                placeholder="如：色弱、有体育艺术特长、地方专项计划专项资格等"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl p-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[13px] transition-all cursor-pointer"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-[13px] shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Check size={15} /> 保存并更新档案
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 2: 账号与安全绑定 */}
                {activeTab === 'account' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-2xl bg-[#f8f6fc] border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-[12px] text-gray-500 font-medium">系统账号用户名</div>
                                <div className="font-mono font-bold text-[14px] text-[#4a4365] mt-0.5">@{currentUser?.username}</div>
                            </div>
                            <span className="text-[11px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-xl font-bold">
                                {currentUser?.role === 'admin' ? '系统管理员' : '标准考生'}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#f8f6fc] border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-[12px] text-gray-500 font-medium">绑定的手机号码</div>
                                <div className="font-mono font-bold text-[13.5px] text-[#4a4365] mt-0.5">
                                    {currentUser?.phone || formData.phone || '未绑定手机'}
                                </div>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">用于验证码快速登录</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#f8f6fc] border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-[12px] text-gray-500 font-medium">绑定的电子邮箱</div>
                                <div className="font-mono font-bold text-[13.5px] text-[#4a4365] mt-0.5">
                                    {currentUser?.email || formData.email || '未绑定邮箱'}
                                </div>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">用于通知与重置密码</span>
                        </div>
                    </div>
                )}

                {/* TAB 3: 安全重置密码 */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in">
                        {passStatusMsg && (
                            <div className={`p-3 rounded-2xl text-[12px] font-bold flex items-center gap-2 ${passStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {passStatusMsg.type === 'success' ? <Check size={14} /> : <X size={14} />}
                                <span>{passStatusMsg.text}</span>
                            </div>
                        )}

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">当前原密码</label>
                            <input
                                type="password"
                                required
                                value={passData.oldPassword}
                                onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                                placeholder="请输入当前旧密码"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">新密码</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passData.newPassword}
                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                placeholder="输入新密码 (至少 6 位)"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">确认新密码</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passData.confirmPassword}
                                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                placeholder="再次输入新密码"
                                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="submit"
                                disabled={isChangingPass}
                                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-[13px] shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Lock size={14} /> {isChangingPass ? '正在提交...' : '确认重置密码'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
