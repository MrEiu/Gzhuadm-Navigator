import React from 'react';
import { SettingsConfig } from '../../types';
import { CheckCircle2, RefreshCw, Check } from 'lucide-react';

interface SettingsTabProps {
    settingsConfig: SettingsConfig;
    setSettingsConfig: React.Dispatch<React.SetStateAction<SettingsConfig>>;
    availableModels: string[];
    isLoadingModels: boolean;
    isSavingSettings: boolean;
    settingsSaveMsg: string | null;
    onFetchModelsList: () => void;
    onSaveSettings: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
    settingsConfig,
    setSettingsConfig,
    availableModels,
    isLoadingModels,
    isSavingSettings,
    settingsSaveMsg,
    onFetchModelsList,
    onSaveSettings
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            {/* Status Alert Message */}
            {settingsSaveMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-[13px] font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>{settingsSaveMsg}</span>
                </div>
            )}

            {/* Section 1: AI Provider Presets */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div>
                    <h3 className="font-black text-[#4a4365] text-[14px]">1. 快捷选择大模型服务商预设</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        点击厂商将自动填充标准 Base URL 与推荐模型，仅需输入对应的 API Key 即可
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                        { name: 'DeepSeek (深度求索)', url: 'https://api.deepseek.com', model: 'deepseek-chat' },
                        { name: 'OpenAI (Official)', url: 'https://api.openai.com/v1', model: 'gpt-4o' },
                        { name: '阿里通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' },
                        { name: '硅基流动', url: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' },
                        { name: '智谱清言 GLM', url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
                        { name: '月之暗面 Kimi', url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
                        { name: 'OpenAI 兼容 (自定义)', url: 'http://localhost:11434/v1', model: 'gpt-4o' }
                    ].map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setSettingsConfig((prev: SettingsConfig) => ({
                                    ...prev,
                                    baseUrl: preset.url,
                                    defaultModel: preset.model,
                                    fastModel: preset.model
                                }));
                            }}
                            className="p-3 bg-[#fbf9fe] hover:bg-purple-50 border border-purple-50/80 rounded-2xl text-left transition-all group cursor-pointer"
                        >
                            <div className="font-bold text-[12px] text-[#4a4365] group-hover:text-purple-700">{preset.name}</div>
                            <div className="text-[9.5px] text-gray-400 truncate mt-0.5">{preset.model}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 2: AI Gateway & Models */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[14px]">2. AI 模型网关与双模型分配</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            配置主对话模型（回复考生）与轻量快速模型（文档智能切片与后台分析）
                        </p>
                    </div>
                    <button
                        onClick={onFetchModelsList}
                        disabled={isLoadingModels}
                        className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                        <RefreshCw size={13} className={isLoadingModels ? 'animate-spin' : ''} />
                        <span>一键拉取可用模型</span>
                    </button>
                </div>

                <div className="space-y-3.5">
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">接口地址 (Base URL)</label>
                        <input
                            type="text"
                            value={settingsConfig.baseUrl}
                            onChange={(e) => setSettingsConfig({ ...settingsConfig, baseUrl: e.target.value })}
                            placeholder="例如 https://api.deepseek.com 或 https://api.openai.com/v1"
                            className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">API Key (留空表示不修改)</label>
                        <input
                            type="password"
                            value={settingsConfig.apiKey}
                            onChange={(e) => setSettingsConfig({ ...settingsConfig, apiKey: e.target.value })}
                            placeholder="sk-••••••••••••••••"
                            className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">
                                💬 默认主对话模型 (DEFAULT_MODEL)
                            </label>
                            {availableModels.length > 0 ? (
                                <select
                                    value={settingsConfig.defaultModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, defaultModel: e.target.value })}
                                    className="w-full bg-[#f8f6fc] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                >
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={settingsConfig.defaultModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, defaultModel: e.target.value })}
                                    placeholder="deepseek-chat"
                                    className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                                />
                            )}
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">
                                ⚡ 快速处理模型 (FAST_MODEL)
                            </label>
                            {availableModels.length > 0 ? (
                                <select
                                    value={settingsConfig.fastModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, fastModel: e.target.value })}
                                    className="w-full bg-[#f8f6fc] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                >
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={settingsConfig.fastModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, fastModel: e.target.value })}
                                    placeholder="deepseek-chat"
                                    className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Web Search Engine Configuration */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div>
                    <h3 className="font-black text-[#4a4365] text-[14px]">3. 联网搜索引擎选配</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        选配宏观高考政策与全网资讯搜索引擎（未配置或异常时自动由 DuckDuckGo 免Key 兜底）
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                        { id: 'duckduckgo', name: 'DuckDuckGo', note: '免 Key 免费开箱即用 · 默认' },
                        { id: 'tavily', name: 'Tavily', note: 'AI 原生搜索 · 需填 Key' },
                        { id: 'bocha', name: '博查 AI', note: '国内政策深度优化 · 需填 Key' },
                    ].map(eng => {
                        const isSelected = settingsConfig.searchProvider === eng.id;
                        return (
                            <button
                                key={eng.id}
                                onClick={() => setSettingsConfig({ ...settingsConfig, searchProvider: eng.id as any })}
                                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                                        ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                                        : 'bg-[#fbf9fe] border-purple-50/60 hover:bg-purple-50/40'
                                    }`}
                            >
                                <div className="font-bold text-[13px] text-[#4a4365] flex items-center justify-between">
                                    <span>{eng.name}</span>
                                    {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600" />}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">{eng.note}</div>
                            </button>
                        );
                    })}
                </div>

                {settingsConfig.searchProvider === 'tavily' && (
                    <div className="pt-2 animate-in fade-in">
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">Tavily API Key (tvly-...)</label>
                        <input
                            type="password"
                            value={settingsConfig.tavilyApiKey || ''}
                            onChange={(e) => setSettingsConfig({ ...settingsConfig, tavilyApiKey: e.target.value })}
                            placeholder="tvly-••••••••••••••••"
                            className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                        />
                    </div>
                )}

                {settingsConfig.searchProvider === 'bocha' && (
                    <div className="pt-2 animate-in fade-in">
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">博查 (Bocha) API Key</label>
                        <input
                            type="password"
                            value={settingsConfig.bochaApiKey || ''}
                            onChange={(e) => setSettingsConfig({ ...settingsConfig, bochaApiKey: e.target.value })}
                            placeholder="bocha-key-••••••••••••••••"
                            className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Save Button Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    onClick={onSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-[#4a4365] hover:bg-[#342e49] text-white px-7 py-3 rounded-2xl font-bold text-[14px] shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                    {isSavingSettings ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{isSavingSettings ? '正在保存...' : '保存配置并立即生效'}</span>
                </button>
            </div>
        </div>
    );
};
