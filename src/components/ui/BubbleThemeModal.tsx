import React, { useState } from 'react';
import { X, Palette, Check, PackageCheck, FileText, Sparkles } from 'lucide-react';
import { BubbleThemeId, MarkdownStyleId } from '../../types';
import { BUBBLE_THEMES } from '../../constants/bubbleThemes';
import { MARKDOWN_STYLES } from '../../constants/markdownStyles';
import { MarkdownViewer } from './MarkdownViewer';

interface BubbleThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: BubbleThemeId;
    onSelectTheme: (themeId: BubbleThemeId) => void;
    currentMarkdownStyle?: MarkdownStyleId;
    onSelectMarkdownStyle?: (styleId: MarkdownStyleId) => void;
}

export const BubbleThemeModal: React.FC<BubbleThemeModalProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onSelectTheme,
    currentMarkdownStyle = 'crystal',
    onSelectMarkdownStyle
}) => {
    const [activeTab, setActiveTab] = useState<'theme' | 'markdown'>('theme');

    if (!isOpen) return null;

    const themeList = Object.values(BUBBLE_THEMES);
    const markdownStyleList = Object.values(MARKDOWN_STYLES);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] border border-white max-w-2xl w-full p-6 shadow-[0_20px_60px_rgba(74,67,101,0.25)] space-y-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            {activeTab === 'theme' ? <Palette size={19} /> : <FileText size={19} />}
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[16.5px]">UI 外观与 Markdown 排版定制</h3>
                            <p className="text-[11.5px] text-[#8a84a4]">自定义气泡皮肤与正文排版（极简原生 / 流光 / 极客 / 知识库）</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-purple-100 text-gray-400 hover:text-purple-700 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Top Segmented Tab Switcher */}
                <div className="flex items-center p-1 bg-purple-50/70 rounded-2xl border border-purple-100/80">
                    <button
                        type="button"
                        onClick={() => setActiveTab('theme')}
                        className={`flex-1 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'theme'
                                ? 'bg-white text-purple-700 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Palette size={14} />
                        <span>气泡皮肤与开源底板 ({themeList.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('markdown')}
                        className={`flex-1 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            activeTab === 'markdown'
                                ? 'bg-white text-purple-700 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Sparkles size={14} />
                        <span>Markdown 正文排版风格 ({markdownStyleList.length})</span>
                    </button>
                </div>

                {/* Tab 1: Bubble Skin Theme */}
                {activeTab === 'theme' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
                        {themeList.map((theme) => {
                            const isSelected = currentTheme === theme.id;
                            return (
                                <div
                                    key={theme.id}
                                    onClick={() => onSelectTheme(theme.id)}
                                    className={`p-3.5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                                        isSelected
                                            ? 'bg-purple-50/80 border-purple-500 shadow-md ring-2 ring-purple-400/25'
                                            : 'bg-[#fbf9fe] border-purple-100/90 hover:bg-white hover:border-purple-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{theme.icon}</span>
                                            <div>
                                                <div className="font-black text-[#4a4365] text-[13.5px] flex items-center gap-1.5">
                                                    <span>{theme.name}</span>
                                                </div>
                                                <div className="text-[10px] text-purple-600 font-bold flex items-center gap-1 mt-0.5">
                                                    <PackageCheck size={11} />
                                                    <span>{theme.source}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-[10.5px] text-[#7a7398] leading-tight font-medium">
                                        {theme.description}
                                    </div>

                                    {/* Live Mini Preview of the Bubble Style */}
                                    <div className="bg-[#f0ebfa]/50 p-2 rounded-2xl space-y-1.5 text-[11px]">
                                        <div className="flex justify-end">
                                            <div className={`px-2.5 py-1 max-w-[85%] text-[10px] ${theme.userClass}`}>
                                                宿舍限电多少瓦？
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div
                                                className={`px-2.5 py-1 max-w-[90%] text-[10px] ${theme.botClass}`}
                                                style={
                                                    theme.id === 'discord' || theme.id === 'antdesign'
                                                        ? { borderLeft: '3px solid #7c3aed' }
                                                        : {}
                                                }
                                            >
                                                <span className="font-bold text-purple-600 block text-[9px]">Dr. Elena</span>
                                                宿舍单路严格限电 800W 哦！
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tab 2: Markdown Typography Styles */}
                {activeTab === 'markdown' && (
                    <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
                        {markdownStyleList.map((style) => {
                            const isSelected = currentMarkdownStyle === style.id;
                            return (
                                <div
                                    key={style.id}
                                    onClick={() => onSelectMarkdownStyle?.(style.id)}
                                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer space-y-3 ${
                                        isSelected
                                            ? 'bg-purple-50/80 border-purple-500 shadow-md ring-2 ring-purple-400/25'
                                            : 'bg-[#fbf9fe] border-purple-100/90 hover:bg-white hover:border-purple-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{style.icon}</span>
                                            <div>
                                                <h4 className="font-black text-[#4a4365] text-[14px]">{style.name}</h4>
                                                <p className="text-[11px] text-[#7a7398] mt-0.5">{style.description}</p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Live Real-Time Mini Markdown Renderer Preview */}
                                    <div className="p-3 bg-white rounded-2xl border border-purple-100/80 shadow-2xs">
                                        <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">排版渲染即时预览：</div>
                                        <MarkdownViewer
                                            content={`### 广州大学录取与就业建议\n${style.sampleText}\n> 💡 **小贴士**：广大实行转专业“转出无门槛”政策。\n\n| 专业方向 | 2025录取排位 | 推荐指数 |\n| :--- | :--- | :--- |\n| 计算机科学 | 3.8万名 | ⭐⭐⭐⭐⭐ |`}
                                            roleColor="#7c3aed"
                                            markdownStyle={style.id}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-purple-50">
                    <span className="text-[11px] text-[#8a84a4]">选择后本地自动记忆，立即全站生效</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[12.5px] rounded-xl shadow-md cursor-pointer transition-all"
                    >
                        完成定制
                    </button>
                </div>
            </div>
        </div>
    );
};
