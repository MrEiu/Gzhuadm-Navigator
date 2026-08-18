import React, { useState } from 'react';
import { User } from '../../types';
import { X, Lock, ShieldCheck, KeyRound, Copy, Check } from 'lucide-react';

interface AdminResetPasswordModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: any) => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({ user, onClose, onSave }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(pass);
        setConfirmPass(pass);
        setError('');
    };

    const handleCopy = () => {
        if (!newPassword) return;
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newPassword.trim()) {
            setError('请输入新密码');
            return;
        }
        if (newPassword !== confirmPass) {
            setError('两次输入的密码不一致');
            return;
        }

        onSave({
            targetUsername: user.username,
            newPassword: newPassword.trim()
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] p-6 max-w-[460px] w-full space-y-4 shadow-2xl border-4 border-white animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-[#4a4365] text-[15px] flex items-center gap-2">
                        <Lock size={16} className="text-amber-600" /> 管理员强制重置密码
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-100 text-[11.5px] text-amber-800 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                    <span>重置后，该考生的密码将自动进行 Bcrypt 10 轮加盐哈希更新。</span>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 text-[12px] p-2.5 rounded-xl border border-red-100 font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleReset} className="space-y-3.5">
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 block mb-1">目标考生账号</label>
                        <input
                            type="text"
                            disabled
                            value={`@${user.username}`}
                            className="w-full bg-gray-50 text-gray-500 rounded-xl px-3.5 py-2 text-[12.5px] font-bold outline-none cursor-not-allowed border"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-bold text-gray-600">设置全新密码</label>
                            <button
                                type="button"
                                onClick={generateRandomPassword}
                                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer bg-purple-50 px-2 py-0.5 rounded-lg"
                            >
                                <KeyRound size={12} /> 随机生成强密码
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="输入或生成新密码"
                                className="w-full bg-[#f8f6fc] rounded-xl pl-3.5 pr-10 py-2.5 text-[12.5px] font-mono outline-none border border-transparent focus:border-amber-300"
                            />
                            {newPassword && (
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                    title="复制密码"
                                >
                                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-gray-600 block mb-1">确认新密码</label>
                        <input
                            type="text"
                            required
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            placeholder="再次输入新密码"
                            className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] font-mono outline-none border border-transparent focus:border-amber-300"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-[12px] text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                        >
                            <Lock size={14} /> 确认重置密码
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
