import React, { useState } from 'react';
import { X, KeyRound, Sparkles, Copy, Check, ShieldAlert } from 'lucide-react';
import { User } from '../../types';
import { API_BASE } from '../../api/config';

interface AdminResetPasswordModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
    user,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    const handleGenerateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let randomStr = '';
        for (let i = 0; i < 8; i++) {
            randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const generated = `Gzhu2025@${randomStr}`;
        setNewPassword(generated);
    };

    const handleCopy = () => {
        if (!newPassword) return;
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword.trim() || newPassword.length < 6) {
            setErrorMsg('密码长度不能少于 6 位');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUsername: user.username,
                    newPassword: newPassword.trim()
                })
            });
            const data = await res.json();
            if (data.ok) {
                onSuccess();
                onClose();
            } else {
                setErrorMsg(data.error || '重置密码失败');
            }
        } catch (err: any) {
            setErrorMsg(err.message || '网络连接异常');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-[480px] w-full p-6 sm:p-8 shadow-2xl border-4 border-white space-y-5 animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-[0_8px_20px_rgba(245,158,11,0.3)]">
                            <KeyRound size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[17px] tracking-tight">
                                管理员强制重置密码
                            </h3>
                            <p className="text-[11px] text-[#8a84a4] font-medium">
                                考生账号：<span className="font-mono text-[#a494e8] font-bold">@{user.username}</span>
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

                {/* Security Note */}
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-[11.5px] leading-relaxed">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>
                        重置后密码将自动通过 <strong>Bcrypt 10 轮加盐哈希</strong> 写入安全数据库，考生原旧密码将立即失效。
                    </span>
                </div>

                {errorMsg && (
                    <div className="bg-rose-50 text-rose-600 text-[12px] font-bold p-3 rounded-2xl border border-rose-100">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[12px] font-bold text-[#4a4365]">设置新密码</label>
                            <button
                                type="button"
                                onClick={handleGenerateRandomPassword}
                                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <Sparkles size={13} /> 一键生成高强度临时密码
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="请输入新密码（至少 6 位）"
                                className="w-full bg-[#f8f6fc] rounded-2xl px-4 py-3 text-[13px] text-[#4a4365] font-mono outline-none border border-transparent focus:border-[#a494e8] transition-all pr-12"
                            />
                            {newPassword && (
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                    title="复制密码"
                                >
                                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                </button>
                            )}
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
                            disabled={saving || !newPassword.trim()}
                            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[13px] font-bold shadow-[0_4px_12px_rgba(245,158,11,0.35)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {saving ? '正在加密重置...' : '确认强制重置'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
