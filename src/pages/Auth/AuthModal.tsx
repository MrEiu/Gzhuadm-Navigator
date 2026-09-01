import React, { useState, useEffect } from 'react';
import {
    BrainCircuit, User as UserIcon, Lock, Globe, ShieldCheck,
    ArrowRight, GraduationCap, Sliders, ChevronLeft, Loader2
} from 'lucide-react';
import { User, SettingsConfig } from '../../types';
import { THEME } from '../../constants/theme';
import { API_BASE } from '../../api/config';

interface AuthModalProps {
    onLoginSuccess: (user: User, portal?: 'chat' | 'admin') => void;
    settingsConfig?: SettingsConfig;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess, settingsConfig }) => {
    const [authMode, setAuthMode] = useState<'login' | 'register' | 'advanced_register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for Admin portal selection
    const [pendingAdminUser, setPendingAdminUser] = useState<User | null>(null);

    const [regTargetType, setRegTargetType] = useState<'phone' | 'email'>('phone');
    const [regTarget, setRegTarget] = useState('');
    const [regVerificationCode, setRegVerificationCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [codeCountdown, setCodeCountdown] = useState(0);
    const [codeSendMsg, setCodeSendMsg] = useState<string | null>(null);

    const [dynamicRegMode, setDynamicRegMode] = useState<string>(settingsConfig?.authRegistrationMode || 'username');

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/config`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.config?.authRegistrationMode) {
                    setDynamicRegMode(data.config.authRegistrationMode);
                }
            })
            .catch(() => { });
    }, []);

    const registrationMode = dynamicRegMode;

    useEffect(() => {
        if (codeCountdown <= 0) return;
        const timer = setInterval(() => {
            setCodeCountdown(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [codeCountdown]);

    const handleSendVerificationCode = async () => {
        if (!regTarget.trim()) {
            setAuthError(`请输入您的${regTargetType === 'phone' ? '手机号' : '邮箱号'}`);
            return;
        }
        setIsSendingCode(true);
        setAuthError('');
        setCodeSendMsg(null);
        try {
            const res = await fetch(`${API_BASE}/api/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: regTarget.trim(), type: regTargetType })
            });
            const data = await res.json();
            if (data.ok) {
                setCodeSendMsg(data.message);
                setCodeCountdown(60);
            } else {
                setAuthError(data.error || '验证码发送失败');
            }
        } catch (e: any) {
            setAuthError(`网络错误: ${e.message}`);
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        const u = username.trim();
        const p = password.trim();

        if (!u || !p) {
            setAuthError('请输入账号和密码');
            return;
        }

        setIsSubmitting(true);
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3500);

            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p }),
                signal: controller.signal
            });
            clearTimeout(timer);

            const data = await res.json();
            if (data.ok && data.user) {
                localStorage.setItem('aurasense_logged_user', JSON.stringify(data.user));
                if (data.user.role === 'admin') {
                    setPendingAdminUser(data.user);
                } else {
                    onLoginSuccess(data.user);
                }
                return;
            } else {
                // Fallback check local users
                const usersRaw = localStorage.getItem('aurasense_registered_users');
                const users = usersRaw ? JSON.parse(usersRaw) : [];
                const matched = users.find((user: any) => user.username === u && user.password === p);
                if (matched) {
                    const regularUser: User = { username: matched.username, role: 'user' };
                    localStorage.setItem('aurasense_logged_user', JSON.stringify(regularUser));
                    onLoginSuccess(regularUser);
                    return;
                }
                setAuthError(data.error || '账号或密码不正确（管理员账号 admin / admin123）');
            }
        } catch {
            if (u === 'admin' && p === 'admin123') {
                const adminUser: User = { username: 'admin', role: 'admin' };
                localStorage.setItem('aurasense_logged_user', JSON.stringify(adminUser));
                setPendingAdminUser(adminUser);
                return;
            }
            try {
                const usersRaw = localStorage.getItem('aurasense_registered_users');
                const users = usersRaw ? JSON.parse(usersRaw) : [];
                const matched = users.find((user: any) => user.username === u && user.password === p);

                if (matched) {
                    const regularUser: User = { username: matched.username, role: 'user' };
                    localStorage.setItem('aurasense_logged_user', JSON.stringify(regularUser));
                    onLoginSuccess(regularUser);
                } else {
                    setAuthError('账号或密码不正确（管理员账号 admin / admin123）');
                }
            } catch {
                setAuthError('登录校验异常，请检查网络后重试');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        const u = username.trim();
        const p = password.trim();
        const cp = confirmPassword.trim();

        if (!u || !p || !cp) {
            setAuthError('请完整填写所有注册项');
            return;
        }

        if (p !== cp) {
            setAuthError('两次输入的密码不一致');
            return;
        }

        if (u === 'admin') {
            setAuthError('admin 为系统预设管理员保留账号');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const data = await res.json();
            if (data.ok && data.user) {
                const usersRaw = localStorage.getItem('aurasense_registered_users');
                const users = usersRaw ? JSON.parse(usersRaw) : [];
                if (!users.some((user: any) => user.username === u)) {
                    users.push({ username: u, password: p, role: 'user', registeredAt: new Date().toISOString() });
                    localStorage.setItem('aurasense_registered_users', JSON.stringify(users));
                }

                localStorage.setItem('aurasense_logged_user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                setAuthError(data.error || '注册保存失败，请重试');
            }
        } catch {
            // Local fallback
            try {
                const usersRaw = localStorage.getItem('aurasense_registered_users');
                const users = usersRaw ? JSON.parse(usersRaw) : [];

                if (users.some((user: any) => user.username === u)) {
                    setAuthError('该账号名已被注册，请更换账号名');
                    return;
                }

                const newUser = { username: u, password: p, role: 'user', registeredAt: new Date().toISOString() };
                users.push(newUser);
                localStorage.setItem('aurasense_registered_users', JSON.stringify(users));

                const userState: User = { username: u, role: 'user' };
                localStorage.setItem('aurasense_logged_user', JSON.stringify(userState));
                onLoginSuccess(userState);
            } catch {
                setAuthError('注册保存失败，请重试');
            }
        }
    };

    const handleAdvancedRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password || !regTarget.trim() || !regVerificationCode.trim()) {
            setAuthError('请完整填写账号、密码、手机/邮箱与验证码');
            return;
        }
        if (password !== confirmPassword) {
            setAuthError('两次输入的密码不一致');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/auth/register-advanced`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                    target: regTarget.trim(),
                    type: regTargetType,
                    code: regVerificationCode.trim()
                })
            });
            const data = await res.json();
            if (data.ok && data.user) {
                localStorage.setItem('aurasense_logged_user', JSON.stringify(data.user));
                setAuthError('');
                onLoginSuccess(data.user);
            } else {
                setAuthError(data.error || '高级注册失败');
            }
        } catch (e: any) {
            setAuthError(`注册失败: ${e.message}`);
        }
    };

    if (pendingAdminUser) {
        return (
            <div className={`w-full max-w-[440px] ${THEME.glass} sm:rounded-[40px] p-7 sm:p-8 shadow-[0_45px_100px_rgba(186,175,215,0.4)] border-[6px] border-[#fdfcff] animate-in zoom-in-95 duration-400`}>
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_10px_25px_rgba(179,164,237,0.4)] border-2 border-white mb-3">
                        <ShieldCheck className="text-white" size={28} />
                    </div>
                    <h1 className="font-black text-[#4a4365] text-[20px] tracking-tight">超级管理员认证成功</h1>
                    <p className="text-[12px] text-[#8a84a4] font-bold mt-1">
                        欢迎您，<span className="text-[#4a4365] font-black">{pendingAdminUser.username}</span>！请选择本次进入的工作台
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => {
                            onLoginSuccess(pendingAdminUser, 'chat');
                        }}
                        className="w-full p-4 rounded-[22px] bg-white/90 hover:bg-white border-2 border-purple-100 hover:border-[#b3a4ed] text-left transition-all hover:scale-[1.015] shadow-xs group cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#a494e8] flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#b3a4ed] group-hover:to-[#c7b8f9] group-hover:text-white transition-all shadow-2xs">
                                    <GraduationCap size={22} />
                                </div>
                                <div>
                                    <div className="font-black text-[#4a4365] text-[14px]">招生咨询工作台（用户前台）</div>
                                    <div className="text-[11px] text-[#8a84a4] mt-0.5">以学生/家长视角体验智能问答、RAG 检索与志愿填报</div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-[#a494e8] group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            onLoginSuccess(pendingAdminUser, 'admin');
                        }}
                        className="w-full p-4 rounded-[22px] bg-gradient-to-r from-[#4a4365] to-[#5c547d] text-white hover:opacity-95 text-left transition-all hover:scale-[1.015] shadow-[0_8px_20px_rgba(74,67,101,0.25)] group cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-white/15 text-white flex items-center justify-center group-hover:bg-white/25 transition-all shadow-2xs">
                                    <Sliders size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-white text-[14px]">后台管理控制台（管理中心）</div>
                                    <div className="text-[11px] text-purple-200 mt-0.5">全局数据大盘、RAG 知识库管理、考生档案与系统配置</div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-purple-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="mt-5 pt-4 border-t border-purple-50 text-center">
                    <button
                        onClick={() => setPendingAdminUser(null)}
                        className="text-[11.5px] font-bold text-[#8a84a4] hover:text-[#4a4365] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                        <ChevronLeft size={14} /> 切换其他账号登录
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-[400px] ${THEME.glass} sm:rounded-[40px] p-8 shadow-[0_45px_100px_rgba(186,175,215,0.4)] border-[6px] border-[#fdfcff] animate-in zoom-in-95 duration-500`}>
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_10px_25px_rgba(179,164,237,0.4)] border-2 border-white mb-3">
                    <BrainCircuit className="text-white" size={30} />
                </div>
                <h1 className="font-black text-[#4a4365] text-[22px] tracking-tight">Gzadm Navigator</h1>
                <p className="text-[11px] text-[#a494e8] font-bold tracking-wider mt-0.5">
                    智能高效招生咨询
                </p>
            </div>

            <div className="flex bg-[#f0ebf8] p-1 rounded-2xl mb-5 text-[12px] font-bold">
                <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(''); }}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${authMode === 'login' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'}`}
                >
                    登录账号
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (registrationMode === 'phone') {
                            setAuthMode('advanced_register');
                            setRegTargetType('phone');
                        } else if (registrationMode === 'email') {
                            setAuthMode('advanced_register');
                            setRegTargetType('email');
                        } else {
                            setAuthMode('register');
                        }
                        setAuthError('');
                    }}
                    className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${authMode !== 'login' ? 'bg-white text-[#4a4365] shadow-xs font-black' : 'text-[#8a84a4]'}`}
                >
                    {registrationMode === 'phone' ? '📱 手机号注册' : (registrationMode === 'email' ? '✉️ 邮箱注册' : '立即注册')}
                </button>
            </div>

            {authError && (
                <div className="bg-red-50 text-red-500 text-[12px] p-3 rounded-2xl mb-4 font-bold border border-red-100 text-center animate-in fade-in">
                    {authError}
                </div>
            )}

            {codeSendMsg && (
                <div className="bg-emerald-50 text-emerald-600 text-[11.5px] p-2.5 rounded-2xl mb-4 font-bold border border-emerald-100 text-center animate-in fade-in">
                    {codeSendMsg}
                </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : (authMode === 'advanced_register' ? handleAdvancedRegisterSubmit : handleRegister)} className="space-y-3.5">
                <div>
                    <label className="text-[12px] font-bold text-[#4a4365] block mb-1">账号名</label>
                    <div className="relative">
                        <UserIcon size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={authMode === 'login' ? "输入账号" : "设置注册账号名"}
                            className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>
                </div>

                {authMode === 'advanced_register' && (
                    <div className="space-y-3.5 animate-in fade-in">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[12px] font-bold text-[#4a4365]">
                                    {registrationMode === 'email' ? '电子邮箱 (获取验证码)' : '手机号码 (获取短信验证码)'}
                                </label>
                            </div>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                                <input
                                    type={regTargetType === 'phone' ? 'tel' : 'email'}
                                    value={regTarget}
                                    onChange={(e) => setRegTarget(e.target.value)}
                                    placeholder={regTargetType === 'phone' ? '输入11位手机号码' : '输入电子邮箱账号'}
                                    className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">验证码</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={regVerificationCode}
                                    onChange={(e) => setRegVerificationCode(e.target.value)}
                                    placeholder="6位验证码"
                                    className="flex-1 bg-[#f8f6fc] border-none rounded-2xl px-4 py-3 text-[13px] font-mono outline-none focus:ring-2 focus:ring-[#a494e8]"
                                />
                                <button
                                    type="button"
                                    disabled={isSendingCode || codeCountdown > 0}
                                    onClick={handleSendVerificationCode}
                                    className="px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl text-[12px] font-bold shrink-0 disabled:opacity-50 cursor-pointer"
                                >
                                    {codeCountdown > 0 ? `${codeCountdown}s 后重发` : (isSendingCode ? '发送中...' : '获取验证码')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-[12px] font-bold text-[#4a4365] block mb-1">密码</label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={authMode === 'login' ? "输入密码" : "设置登录密码"}
                            className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>
                </div>

                {authMode !== 'login' && (
                    <div className="animate-in fade-in">
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">确认密码</label>
                        <div className="relative">
                            <ShieldCheck size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="再次输入密码确认"
                                className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#4a4365] text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg hover:bg-[#342e49] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={16} className="animate-spin text-purple-300" />
                            <span>正在登录验证中...</span>
                        </>
                    ) : (
                        <>
                            <span>{authMode === 'login' ? '立即登录' : '创建账号并登录'}</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
