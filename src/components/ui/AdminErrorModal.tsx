import React, { useState } from 'react';
import {
    AlertTriangle, ServerOff, KeyRound, Coins,
    RefreshCw, ArrowRight, X, Copy, Check, Terminal,
    ExternalLink, ShieldAlert
} from 'lucide-react';
import { API_BASE } from '../../api/config';

export interface AdminErrorInfo {
    type: 'backend_offline' | 'api_key_invalid' | 'api_quota_exceeded' | 'api_rate_limit' | 'network_error' | 'generic';
    title: string;
    message: string;
    details?: string;
    endpoint?: string;
    statusCode?: number;
    timestamp?: string;
}

interface AdminErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorInfo: AdminErrorInfo | null;
    onGoToSettings?: () => void;
    onRetry?: () => void;
}

export const AdminErrorModal: React.FC<AdminErrorModalProps> = ({
    isOpen,
    onClose,
    errorInfo,
    onGoToSettings,
    onRetry
}) => {
    const [copied, setCopied] = useState(false);
    const [pinging, setPinging] = useState(false);
    const [pingResult, setPingResult] = useState<{ ok: boolean; msg: string } | null>(null);

    if (!isOpen || !errorInfo) return null;

    const handleCopyDetails = () => {
        const text = `【Gzadm 诊断报错】\n类型: ${errorInfo.type}\n标题: ${errorInfo.title}\n详情: ${errorInfo.details || errorInfo.message}\n端点: ${errorInfo.endpoint || 'N/A'}\n时间: ${errorInfo.timestamp || new Date().toISOString()}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePingBackend = async () => {
        setPinging(true);
        setPingResult(null);
        try {
            const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
            if (res.ok) {
                setPingResult({ ok: true, msg: '后端连通成功！HTTP 状态码 200 OK，服务已恢复。' });
            } else {
                setPingResult({ ok: false, msg: `连接返回异常状态码: HTTP ${res.status}` });
            }
        } catch (e: any) {
            setPingResult({ ok: false, msg: `连接仍未恢复: ${e.message || '网络连接被拒绝'}` });
        } finally {
            setPinging(false);
        }
    };

    // Style configs by error type
    const getThemeConfig = () => {
        switch (errorInfo.type) {
            case 'backend_offline':
                return {
                    icon: <ServerOff size={22} className="text-red-500" />,
                    iconBg: 'bg-red-50 border-red-200',
                    tag: '后端服务失联 (Offline)',
                    tagBg: 'bg-red-100 text-red-700 border-red-200',
                    headerBg: 'from-red-500/10 via-rose-500/5 to-transparent'
                };
            case 'api_key_invalid':
                return {
                    icon: <KeyRound size={22} className="text-orange-500" />,
                    iconBg: 'bg-orange-50 border-orange-200',
                    tag: 'API Key 无效 / 鉴权失败',
                    tagBg: 'bg-orange-100 text-orange-700 border-orange-200',
                    headerBg: 'from-orange-500/10 via-amber-500/5 to-transparent'
                };
            case 'api_quota_exceeded':
                return {
                    icon: <Coins size={22} className="text-amber-500" />,
                    iconBg: 'bg-amber-50 border-amber-200',
                    tag: 'API 欠费 / 额度耗尽 (402/429)',
                    tagBg: 'bg-amber-100 text-amber-800 border-amber-200',
                    headerBg: 'from-amber-500/10 via-yellow-500/5 to-transparent'
                };
            case 'network_error':
            case 'api_rate_limit':
            default:
                return {
                    icon: <AlertTriangle size={22} className="text-purple-500" />,
                    iconBg: 'bg-purple-50 border-purple-200',
                    tag: 'AI 网关调用异常',
                    tagBg: 'bg-purple-100 text-purple-700 border-purple-200',
                    headerBg: 'from-purple-500/10 via-indigo-500/5 to-transparent'
                };
        }
    };

    const theme = getThemeConfig();

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] max-w-[580px] w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border-4 border-white/90 space-y-4 animate-in zoom-in-95 duration-200 text-[#4a4365]">
                
                {/* Header with gradient badge */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-3.5">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-xs shrink-0 ${theme.iconBg}`}>
                            {theme.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-[#2e264d] text-[16.5px] tracking-tight">{errorInfo.title}</h3>
                            </div>
                            <span className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full border mt-1 ${theme.tagBg}`}>
                                {theme.tag}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Privacy and User-Side Notice Banner */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-[11.5px] text-emerald-800">
                    <ShieldAlert size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">安全隔离机制生效中：</span>
                        <span>该技术弹窗仅面向【管理员】展示。考生与普通用户界面已统一显示为友好提示：<b>“服务正在升级中，请稍后再试”</b>，技术堆栈与敏感日志未泄露。</span>
                    </div>
                </div>

                {/* Primary Message */}
                <div className="bg-[#fbf9fe] border border-purple-100/80 rounded-2xl p-4 space-y-2">
                    <div className="text-[13px] font-medium text-[#4a4365] leading-relaxed">
                        {errorInfo.message}
                    </div>

                    {/* Troubleshooting Guide */}
                    <div className="pt-2 border-t border-purple-100/60 text-[11.5px] text-[#7a7398] space-y-1">
                        <div className="font-bold text-[#5c5478] flex items-center gap-1.5">
                            💡 排查建议：
                        </div>
                        {errorInfo.type === 'backend_offline' && (
                            <ul className="list-disc list-inside space-y-0.5 text-gray-600 pl-1">
                                <li>检查后端服务是否启动：确保终端已运行 <code className="bg-purple-100/60 px-1 py-0.5 rounded font-mono text-[11px]">npm run dev</code> 或 <code className="bg-purple-100/60 px-1 py-0.5 rounded font-mono text-[11px]">node server.mjs</code></li>
                                <li>检查本地端口 3001 是否被系统防火墙拦截或冲突</li>
                                <li>点击下方【检测后端连通性】快速验证恢复状态</li>
                            </ul>
                        )}
                        {errorInfo.type === 'api_key_invalid' && (
                            <ul className="list-disc list-inside space-y-0.5 text-gray-600 pl-1">
                                <li>检查当前选择的服务商（DeepSeek / 硅基流动 / OpenAI）与填写的 Key 是否对应</li>
                                <li>前往管理后台的【系统配置】模块重新粘贴最新的 API Key</li>
                                <li>点击下方【前往后台系统设置】可一键跳转至配置面板</li>
                            </ul>
                        )}
                        {errorInfo.type === 'api_quota_exceeded' && (
                            <ul className="list-disc list-inside space-y-0.5 text-gray-600 pl-1">
                                <li>登录大模型平台服务商控制台，检查当前账户余额或 Token 额度</li>
                                <li>若使用的是临时测试 Key，建议充值或在系统设置切换至有额度的提供商</li>
                                <li>可在后台系统设置中先切换为【硅基流动】或【本地 Ollama】作为应急备用</li>
                            </ul>
                        )}
                        {(errorInfo.type === 'network_error' || errorInfo.type === 'generic' || errorInfo.type === 'api_rate_limit') && (
                            <ul className="list-disc list-inside space-y-0.5 text-gray-600 pl-1">
                                <li>检查大模型端点 Base URL（如 <code className="bg-purple-100/60 px-1 py-0.5 rounded font-mono text-[11px]">https://api.deepseek.com</code>）网络可达性</li>
                                <li>若厂商遭遇突发宕机或限流，系统内置的知识库（RAG）仍可支持校方规章查询</li>
                            </ul>
                        )}
                    </div>
                </div>

                {/* Technical Details Collapsible Box */}
                {errorInfo.details && (
                    <div className="bg-[#1f1d2e] rounded-2xl p-3.5 text-white/90 space-y-2 font-mono text-[11px]">
                        <div className="flex items-center justify-between text-[#a494e8]">
                            <span className="flex items-center gap-1.5 font-bold">
                                <Terminal size={13} /> 技术诊断详情 (Diagnostics)
                            </span>
                            <button
                                onClick={handleCopyDetails}
                                className="flex items-center gap-1 text-[10.5px] text-gray-300 hover:text-white bg-white/10 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                            >
                                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                {copied ? '已复制' : '复制'}
                            </button>
                        </div>
                        <div className="overflow-x-auto max-h-[110px] text-gray-300 leading-relaxed break-all whitespace-pre-wrap select-all">
                            {errorInfo.details}
                        </div>
                        {errorInfo.endpoint && (
                            <div className="text-[10px] text-[#8a84a4] border-t border-white/10 pt-1.5">
                                请求端点: <span className="text-purple-300">{errorInfo.endpoint}</span>
                                {errorInfo.statusCode && <span> · HTTP {errorInfo.statusCode}</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Ping Result if tested */}
                {pingResult && (
                    <div className={`p-3 rounded-xl border text-[11.5px] font-medium flex items-center gap-2 ${pingResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                        {pingResult.ok ? <Check size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-rose-600" />}
                        <span>{pingResult.msg}</span>
                    </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {errorInfo.type === 'backend_offline' ? (
                            <button
                                onClick={handlePingBackend}
                                disabled={pinging}
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-[#4a4365] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <RefreshCw size={13} className={pinging ? 'animate-spin' : ''} />
                                {pinging ? '检测中...' : '检测后端连通性'}
                            </button>
                        ) : onRetry ? (
                            <button
                                onClick={onRetry}
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 text-[12px] font-bold text-[#4a4365] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <RefreshCw size={13} /> 重试发送
                            </button>
                        ) : null}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            关闭窗口
                        </button>
                        {(errorInfo.type === 'api_key_invalid' || errorInfo.type === 'api_quota_exceeded' || errorInfo.type === 'generic') && onGoToSettings && (
                            <button
                                onClick={onGoToSettings}
                                className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                <span>前往系统设置配置 Key</span>
                                <ArrowRight size={13} />
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
