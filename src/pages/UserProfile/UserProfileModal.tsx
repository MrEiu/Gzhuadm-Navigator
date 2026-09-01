import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile } from '../../types';
import { API_BASE } from '../../api/config';
import {
    User as UserIcon, Lock, ShieldCheck,
    Check, X, Upload, Sparkles, Link as LinkIcon,
    Edit3, KeyRound, Smartphone, Mail, Settings
} from 'lucide-react';

interface UserProfileModalProps {
    profile: UserProfile | null;
    currentUser: User | null;
    isOpen: boolean;
    initialTab?: 'profile' | 'account';
    onClose: () => void;
    onSave: (formData: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    profile,
    currentUser,
    isOpen,
    initialTab = 'profile',
    onClose,
    onSave
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'account'>(initialTab);
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

    // 账号信息修改状态 (需点击“修改账号信息”按键展开)
    const [isEditingAccount, setIsEditingAccount] = useState(false);
    const [accountForm, setAccountForm] = useState({
        phone: profile?.phone || currentUser?.phone || '',
        email: profile?.email || currentUser?.email || ''
    });
    const [accountSaveMsg, setAccountSaveMsg] = useState<string | null>(null);

    // 重置密码状态 (需点击“重置密码”按键展开)
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [passData, setPassData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passStatusMsg, setPassStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [isChangingPass, setIsChangingPass] = useState(false);

    // 头像配置
    const [avatarMode, setAvatarMode] = useState<'emoji' | 'upload' | 'url'>('emoji');
    const [avatarUrlInput, setAvatarUrlInput] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setIsEditingAccount(false);
            setIsResettingPassword(false);
            setPassStatusMsg(null);
            setAccountSaveMsg(null);
        }
    }, [isOpen, initialTab]);

    useEffect(() => {
        if (profile || currentUser) {
            const currentAv = profile?.avatar || '🎓';
            const initialData = {
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
            };
            setFormData(initialData);
            setAccountForm({
                phone: initialData.phone,
                email: initialData.email
            });

            if (currentAv.startsWith('http') || currentAv.startsWith('/uploads') || currentAv.startsWith('data:image')) {
                setAvatarMode('url');
                setAvatarUrlInput(currentAv);
            }
        }
    }, [profile, currentUser]);

    if (!isOpen) return null;

    // 保存高考个人资料
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name?.trim() || !formData.score || !formData.province) {
            alert('请完整填写考生昵称、省份和高考分数！');
            return;
        }
        onSave(formData);
    };

    // 保存头像更新
    const handleUpdateAvatar = (newAvatar: string) => {
        const updated = { ...formData, avatar: newAvatar };
        setFormData(updated);
        onSave(updated);
    };

    // 本地文件上传头像
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
                    handleUpdateAvatar(fullUrl);
                    setAvatarUrlInput(fullUrl);
                } else {
                    handleUpdateAvatar(base64Data);
                    setAvatarUrlInput(base64Data);
                }
            } catch {
                handleUpdateAvatar(base64Data);
                setAvatarUrlInput(base64Data);
            } finally {
                setUploadingAvatar(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // 保存修改账号信息 (手机与邮箱)
    const handleSaveAccountInfo = (e: React.FormEvent) => {
        e.preventDefault();
        const updated = {
            ...formData,
            phone: accountForm.phone.trim(),
            email: accountForm.email.trim()
        };
        setFormData(updated);
        onSave(updated);
        setIsEditingAccount(false);
        setAccountSaveMsg('账号信息已成功保存更新！');
        setTimeout(() => setAccountSaveMsg(null), 3000);
    };

    // 提交重置密码
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassStatusMsg(null);
        if (!passData.oldPassword || !passData.newPassword || !passData.confirmPassword) {
            setPassStatusMsg({ type: 'error', text: '请完整填写原密码、新密码与确认密码' });
            return;
        }
        if (passData.newPassword.length < 6) {
            setPassStatusMsg({ type: 'error', text: '新密码长度至少需要 6 位' });
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
                setPassStatusMsg({ type: 'success', text: '密码已成功修改并由 Bcrypt 安全加密！' });
                setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    setIsResettingPassword(false);
                    setPassStatusMsg(null);
                }, 2000);
            } else {
                setPassStatusMsg({ type: 'error', text: data.error || '密码修改失败，请检查原密码' });
            }
        } catch (err: any) {
            setPassStatusMsg({ type: 'error', text: `网络连接异常: ${err.message}` });
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[28px] sm:rounded-[36px] max-w-[600px] w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-7 shadow-2xl border-4 border-white space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-300 hide-scrollbar">

                {/* Header Hero Banner (去渐变，采用沉稳纯色) */}
                <div className="relative bg-[#4a4365] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xs border border-[#3d3753] flex items-center justify-between overflow-hidden">
                    <div className="flex items-center gap-3 z-10 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/80 overflow-hidden flex items-center justify-center shadow-md shrink-0">
                            {isCustomImageAvatar ? (
                                <img
                                    src={formData.avatar}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                    onError={() => setFormData(prev => ({ ...prev, avatar: '🎓' }))}
                                />
                            ) : (
                                <span className="text-xl sm:text-2xl">{formData.avatar || '🎓'}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <h3 className="font-black text-[16px] sm:text-[18px] tracking-tight truncate">{formData.name || currentUser?.username}</h3>
                                <span className="text-[9.5px] sm:text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-bold">
                                    {currentUser?.role === 'admin' ? '系统管理员' : '高考考生'}
                                </span>
                            </div>
                            <p className="text-[11px] sm:text-[11.5px] opacity-90 font-mono mt-0.5 truncate">账号: @{currentUser?.username}</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white z-10 transition-all cursor-pointer shrink-0 ml-2">
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Switcher: 个人资料 vs 账号设置 */}
                <div className="flex bg-[#f0ebf8] p-1 rounded-2xl text-[13px] font-bold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${activeTab === 'profile' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
                            }`}
                    >
                        <UserIcon size={15} /> 个人资料
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${activeTab === 'account' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
                            }`}
                    >
                        <Settings size={15} /> 账号设置
                    </button>
                </div>

                {/* ================= TAB 1: 个人资料 (高考背景画像) ================= */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">
                                    考生昵称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="如：小明、广大追梦学子"
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
                                placeholder="如：色弱、有体育艺术特长、享受地方专项计划加分等"
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
                                className="px-6 py-2.5 rounded-2xl bg-[#4a4365] hover:bg-[#3d3753] text-white font-bold text-[13px] shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Check size={15} /> 保存个人资料
                            </button>
                        </div>
                    </form>
                )}

                {/* ================= TAB 2: 账号设置 (头像 + 账号信息修改 + 重置密码) ================= */}
                {activeTab === 'account' && (
                    <div className="space-y-4 animate-in fade-in">
                        
                        {/* 1. 头像设置 */}
                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[12px] font-black text-[#4a4365] flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-purple-600" />
                                    <span>个性头像设置</span>
                                </label>

                                <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-purple-200/60 text-[10.5px] font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMode('emoji')}
                                        className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${avatarMode === 'emoji' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                                    >
                                        Emoji
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMode('upload')}
                                        className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${avatarMode === 'upload' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                                    >
                                        本地上传
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAvatarMode('url')}
                                        className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${avatarMode === 'url' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}
                                    >
                                        图片链接
                                    </button>
                                </div>
                            </div>

                            {/* Mode A: Preset Emojis */}
                            {avatarMode === 'emoji' && (
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                    {AVATARS.map(av => (
                                        <button
                                            key={av}
                                            type="button"
                                            onClick={() => handleUpdateAvatar(av)}
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
                                <div className="flex items-center gap-3 pt-1">
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
                                <div className="flex items-center gap-2 pt-1">
                                    <div className="relative flex-1">
                                        <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={avatarUrlInput}
                                            onChange={(e) => {
                                                setAvatarUrlInput(e.target.value);
                                                handleUpdateAvatar(e.target.value.trim());
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

                        {/* 2. 账号基本信息与独立修改按键 */}
                        <div className="p-4 rounded-2xl bg-[#f8f6fc] border border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Smartphone size={15} className="text-purple-600" />
                                    <span className="text-[13px] font-black text-[#4a4365]">账号基本信息</span>
                                </div>

                                {!isEditingAccount && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingAccount(true)}
                                        className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-purple-50 text-purple-700 text-[11.5px] font-bold rounded-xl border border-purple-200/80 shadow-xs transition-all cursor-pointer"
                                    >
                                        <Edit3 size={13} />
                                        <span>设置账号信息</span>
                                    </button>
                                )}
                            </div>

                            {accountSaveMsg && (
                                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[12px] font-bold flex items-center gap-1.5 border border-emerald-200 animate-in fade-in">
                                    <Check size={13} />
                                    <span>{accountSaveMsg}</span>
                                </div>
                            )}

                            {!isEditingAccount ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[12.5px]">
                                    <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col">
                                        <span className="text-[11px] text-gray-400">系统用户名</span>
                                        <span className="font-mono font-bold text-[#4a4365] mt-0.5">@{currentUser?.username}</span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col">
                                        <span className="text-[11px] text-gray-400">账号身份</span>
                                        <span className="font-bold text-purple-700 mt-0.5">
                                            {currentUser?.role === 'admin' ? '系统管理员' : '标准考生'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col">
                                        <span className="text-[11px] text-gray-400">绑定手机</span>
                                        <span className="font-mono font-bold text-[#4a4365] mt-0.5">
                                            {formData.phone || currentUser?.phone || '未设置手机'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col">
                                        <span className="text-[11px] text-gray-400">绑定邮箱</span>
                                        <span className="font-mono font-bold text-[#4a4365] mt-0.5 truncate">
                                            {formData.email || currentUser?.email || '未设置邮箱'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveAccountInfo} className="space-y-3 pt-1 animate-in fade-in">
                                    <div>
                                        <label className="text-[11.5px] font-bold text-gray-600 block mb-1">手机号码</label>
                                        <input
                                            type="tel"
                                            value={accountForm.phone}
                                            onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                                            placeholder="输入手机号码"
                                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11.5px] font-bold text-gray-600 block mb-1">电子邮箱</label>
                                        <input
                                            type="email"
                                            value={accountForm.email}
                                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                            placeholder="输入电子邮箱"
                                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingAccount(false)}
                                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[12px] font-bold rounded-xl transition-all cursor-pointer"
                                        >
                                            取消
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                        >
                                            <Check size={13} />
                                            <span>保存修改</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* 3. 密码安全与独立重置密码按键 */}
                        <div className="p-4 rounded-2xl bg-[#f8f6fc] border border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <KeyRound size={15} className="text-purple-600" />
                                    <span className="text-[13px] font-black text-[#4a4365]">密码与安全防护</span>
                                </div>

                                {!isResettingPassword ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsResettingPassword(true)}
                                        className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-purple-50 text-purple-700 text-[11.5px] font-bold rounded-xl border border-purple-200/80 shadow-xs transition-all cursor-pointer"
                                    >
                                        <Lock size={13} />
                                        <span>重置密码</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResettingPassword(false);
                                            setPassStatusMsg(null);
                                        }}
                                        className="text-[11.5px] text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                                    >
                                        收起
                                    </button>
                                )}
                            </div>

                            {passStatusMsg && (
                                <div className={`p-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 ${passStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                    {passStatusMsg.type === 'success' ? <Check size={13} /> : <X size={13} />}
                                    <span>{passStatusMsg.text}</span>
                                </div>
                            )}

                            {!isResettingPassword ? (
                                <div className="flex items-center justify-between text-[12px] p-3 bg-white rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <ShieldCheck size={16} className="text-emerald-500" />
                                        <span>当前密码已受 Bcrypt 高强度哈希安全加密保护</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-mono">已启用</span>
                                </div>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-3 pt-1 animate-in fade-in">
                                    <div>
                                        <label className="text-[11.5px] font-bold text-gray-600 block mb-1">当前原密码</label>
                                        <input
                                            type="password"
                                            required
                                            value={passData.oldPassword}
                                            onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                                            placeholder="请输入当前账号的原密码"
                                            className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] outline-none focus:ring-2 focus:ring-purple-400"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="text-[11.5px] font-bold text-gray-600 block mb-1">新密码</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passData.newPassword}
                                                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                                placeholder="至少 6 位字符"
                                                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] outline-none focus:ring-2 focus:ring-purple-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11.5px] font-bold text-gray-600 block mb-1">确认新密码</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passData.confirmPassword}
                                                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                                placeholder="再次确认新密码"
                                                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] outline-none focus:ring-2 focus:ring-purple-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsResettingPassword(false);
                                                setPassStatusMsg(null);
                                            }}
                                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[12px] font-bold rounded-xl transition-all cursor-pointer"
                                        >
                                            取消
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isChangingPass}
                                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                        >
                                            <Lock size={13} />
                                            <span>{isChangingPass ? '提交中...' : '确认重置密码'}</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};
