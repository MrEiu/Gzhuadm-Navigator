import React, { useState } from 'react';
import { X, Check, Tag, Folder, Users, FileText, Sparkles } from 'lucide-react';
import { DocumentChunk } from '../../types';

interface ChunkSingleEditorProps {
    chunk: DocumentChunk;
    onClose: () => void;
    onSave: (updated: DocumentChunk) => void;
}

const CATEGORIES = ['录取分数', '宿舍规章', '政策规定', '生活经验', '探店游玩', '学费奖学金', '专业介绍', 'AI切片', '通用资料'];

const AGENT_OPTIONS = [
    { value: 'all', label: '全部智能体' },
    { value: 'dr', label: '招生办主任 (官方权威)' },
    { value: 'dorm', label: '宿舍管家 (生活住宿)' },
    { value: 'counselor', label: '辅导员 (学业心理)' },
    { value: 'senior_boy', label: '师兄 (就读经验)' },
    { value: 'senior_girl', label: '师姐 (校园生活)' }
];

export const ChunkSingleEditor: React.FC<ChunkSingleEditorProps> = ({ chunk, onClose, onSave }) => {
    const [title, setTitle] = useState(chunk.title || '');
    const [category, setCategory] = useState(chunk.category || '通用资料');
    const [targetAgent, setTargetAgent] = useState(chunk.targetAgent || 'all');
    const [content, setContent] = useState(chunk.content || '');
    const [tags, setTags] = useState((chunk.tags || []).join(', '));

    const handleSave = () => {
        if (!title.trim()) {
            alert('请输入切片标题');
            return;
        }
        if (!content.trim()) {
            alert('请输入切片内容');
            return;
        }

        const tagList = tags
            .split(/[,，]/)
            .map(t => t.trim())
            .filter(Boolean);

        onSave({
            ...chunk,
            title: title.trim(),
            category: category.trim(),
            targetAgent,
            content: content.trim(),
            tags: tagList
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex justify-center items-center p-4">
            <div className="bg-white/95 rounded-[32px] p-6 max-w-[540px] w-full space-y-4 shadow-2xl border border-white/80 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#4a4365] text-[15px]">修改知识切片内容</h4>
                            <p className="text-[11px] text-[#8a84a4]">单独调整此切片的标题、分类、归属与正文</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Title */}
                    <div>
                        <label className="text-[12px] font-bold text-[#5c5478] flex items-center gap-1.5 mb-1">
                            <FileText size={14} className="text-purple-500" /> 切片标题
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例如：2026年广东省物理类录取分数线..."
                            className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12px] font-medium text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                        />
                    </div>

                    {/* Category & Target Agent Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-[#5c5478] flex items-center gap-1.5 mb-1">
                                <Folder size={14} className="text-purple-500" /> 知识分类
                            </label>
                            <input
                                list="chunk-category-list"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3 py-2 text-[12px] font-medium text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                            />
                            <datalist id="chunk-category-list">
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="text-[12px] font-bold text-[#5c5478] flex items-center gap-1.5 mb-1">
                                <Users size={14} className="text-purple-500" /> 专属智能体
                            </label>
                            <select
                                value={targetAgent}
                                onChange={(e) => setTargetAgent(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3 py-2 text-[12px] font-medium text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all cursor-pointer"
                            >
                                {AGENT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="text-[12px] font-bold text-[#5c5478] flex items-center gap-1.5 mb-1">
                            <FileText size={14} className="text-purple-500" /> 切片正文 (核心提炼内容)
                        </label>
                        <textarea
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="在此编辑切片的主要文本内容..."
                            className="w-full bg-[#f8f6fc] rounded-2xl p-3.5 text-[12px] leading-relaxed text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all font-mono"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="text-[12px] font-bold text-[#5c5478] flex items-center gap-1.5 mb-1">
                            <Tag size={14} className="text-purple-500" /> 检索关键词 / 标签 (以逗号分隔)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="例如：分数线, 物理类, 2026, 投档"
                            className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-purple-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-[12px] font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#8b79d9] to-[#6d5aa6] text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Check size={14} /> 保存切片修改
                    </button>
                </div>
            </div>
        </div>
    );
};
