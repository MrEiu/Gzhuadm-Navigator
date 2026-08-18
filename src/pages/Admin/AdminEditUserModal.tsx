import React, { useState } from 'react';
import { X, UserCheck, Sparkles, MapPin, Award, BookOpen, Phone, Mail, FileText } from 'lucide-react';
import { User } from '../../types';
import { API_BASE } from '../../api/config';

interface AdminEditUserModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({
    user,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [name, setName] = useState(user.profile?.name || '');
    const [province, setProvince] = useState(user.profile?.province || '广东');
    const [score, setScore] = useState(user.profile?.score?.toString() || '');
    const [rank, setRank] = useState(user.profile?.rank?.toString() || '');
    const [subjects, setSubjects] = useState(user.profile?.subjects || '物理+化学+生物');
    const [phone, setPhone] = useState(user.phone || user.profile?.phone || '');
    const [email, setEmail] = useState(user.email || user.profile?.email || '');
    const [specialConditions, setSpecialConditions] = useState(user.profile?.specialConditions || '');
    const [isVip, setIsVip] = useState(Boolean(user.profile?.isVip || (Number(user.profile?.score) > 580)));
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUsername: user.username,
                    phone,
                    email,
                    score: score ? Number(score) : '',
                    province,
                    isVip,
                    specialConditions
                })
            });
            const data = await res.json();
            if (data.ok) {
                // Also update profile details
                await fetch(`${API_BASE}/api/user/profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: user.username,
                        profile: {
                            name,
                            province,
                            score: score ? Number(score) : '',
                            rank: rank ? Number(rank) : '',
                            subjects,
                            phone,
                            email,
                            specialConditions,
                            isVip
                        }
                    })
                });
                onSuccess();
                onClose();
            } else {
                setErrorMsg(data.error || '保存资料失败');
            }
        } catch (err: any) {
            setErrorMsg(err.message || '网络连接异常');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-[600px] w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border-4 border-white space-y-5 animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.35)]">
                            <UserCheck size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[17px] tracking-tight">
                                修改考生资料档案
                            </h3>
                            <p className="text-[11px] text-[#8a84a4] font-medium">
                                账号：<span className="font-mono text-[#a494e8] font-bold">@{user.username}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl text-gray-400 hover:text-[#4a4365] hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-rose-50 text-rose-600 text-[12px] font-bold p-3 rounded-2xl border border-rose-100">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Real Name */}
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <FileText size={13} className="text-[#a494e8]" /> 考生真实姓名
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="如：张三"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        </div>

                        {/* Province */}
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <MapPin size={13} className="text-[#a494e8]" /> 高考省份
                            </label>
                            <input
                                type="text"
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                placeholder="如：广东 / 浙江 / 四川"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        </div>

                        {/* Score */}
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <Award size={13} className="text-[#a494e8]" /> 高考总分
                            </label>
                            <input
                                type="number"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                placeholder="如：595"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all font-mono"
                            />
                        </div>

                        {/* Rank */}
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <Award size={13} className="text-[#a494e8]" /> 全省位次 / 排名
                            </label>
                            <input
                                type="number"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                placeholder="如：12500"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all font-mono"
                            />
                        </div>

                        {/* Subjects */}
                        <div className="sm:col-span-2">
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <BookOpen size={13} className="text-[#a494e8]" /> 选科组合 / 科类
                            </label>
                            <input
                                type="text"
                                value={subjects}
                                onChange={(e) => setSubjects(e.target.value)}
                                placeholder="如：物化生 / 历史+政治+地理 / 物理+化学+地理"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <Phone size={13} className="text-[#a494e8]" /> 手机号码
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="如：13800138000"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all font-mono"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5 flex items-center gap-1.5">
                                <Mail size={13} className="text-[#a494e8]" /> 电子邮箱
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="如：student@example.com"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-2.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        </div>

                        {/* Special Conditions */}
                        <div className="sm:col-span-2">
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1.5">
                                特殊意向说明 / 备注
                            </label>
                            <textarea
                                rows={2}
                                value={specialConditions}
                                onChange={(e) => setSpecialConditions(e.target.value)}
                                placeholder="如：优先考虑计算机专业、希望保研率高、意向大学城校区等"
                                className="w-full bg-[#f8f6fc] rounded-2xl p-3.5 text-[13px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                        </div>

                        {/* VIP Switch */}
                        <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-purple-50 rounded-2xl border border-amber-200/60">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-400 text-white shadow-xs">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <div className="text-[13px] font-bold text-[#4a4365]">VIP 高分专属定制通道</div>
                                    <div className="text-[10.5px] text-[#8a84a4]">开启后享有 AI 顾问高分位次深度志愿推演</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={isVip}
                                onChange={(e) => setIsVip(e.target.checked)}
                                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-[13px] font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white text-[13px] font-bold shadow-[0_4px_12px_rgba(179,164,237,0.4)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {saving ? '保存中...' : '保存考生档案'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
