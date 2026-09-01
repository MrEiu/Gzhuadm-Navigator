import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Trash2, Users } from 'lucide-react';
import { RagItem } from '../../types';
import { API_BASE } from '../../api/config';
import { RAG_DOMAIN_OPTIONS } from '../../constants/thoughtClones';

interface RagItemModalProps {
    item: Partial<RagItem>;
    onClose: () => void;
    onSave: (itemData: Partial<RagItem>) => void;
}

export const RagItemModal: React.FC<RagItemModalProps> = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<RagItem>>({
        targetAgent: 'all',
        ...item
    });
    const [tagInput, setTagInput] = useState((item.tags || []).join(', '));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target?.result as string;
            try {
                const res = await fetch(`${API_BASE}/api/admin/upload-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Data, filename: file.name })
                });
                const data = await res.json();
                if (data.ok && data.attachment) {
                    setFormData(prev => ({
                        ...prev,
                        imageAttachments: [...(prev.imageAttachments || []), data.attachment],
                        tags: Array.from(new Set([...(prev.tags || []), file.name]))
                    }));
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFormSave = () => {
        const tagsArr = tagInput.split(/[,，]/).map(t => t.trim()).filter(Boolean);
        onSave({ ...formData, tags: tagsArr });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white/95 rounded-[36px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-white space-y-4 animate-in zoom-in-95 duration-300">

                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <h3 className="font-bold text-[#4a4365] text-[16px]">
                        {formData.id ? '编辑知识条目' : '新增 RAG 知识条目'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">知识标题</label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="请输入标题"
                            className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>

                    {/* Target Agent Selector */}
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1 flex items-center gap-1">
                            <Users size={14} className="text-purple-600" /> 归属专属思维分身 / 伴游知识库
                        </label>
                        <select
                            value={formData.targetAgent || 'all'}
                            onChange={(e) => setFormData({ ...formData, targetAgent: e.target.value })}
                            className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8] font-bold text-purple-800 cursor-pointer"
                        >
                            {RAG_DOMAIN_OPTIONS.map((d) => (
                                <option key={d.key} value={d.key}>
                                    {d.label} {d.desc ? `(${d.desc})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">业务分类</label>
                            <input
                                type="text"
                                value={formData.category || ''}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="如：录取分数 / 宿舍规章 / 政策规定"
                                className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">数据类型</label>
                            <select
                                value={formData.type || 'text'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                            >
                                <option value="text">纯文本型</option>
                                <option value="table">结构化表格型</option>
                                <option value="image">图片附件型</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">知识正文内容</label>
                        <textarea
                            rows={5}
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="输入详细内容，支持 Markdown 格式与表格..."
                            className="w-full bg-[#f8f6fc] rounded-xl p-3 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>

                    {/* Image Attachments */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[12px] font-bold text-[#4a4365]">图片附件</label>
                            <label className="text-[11px] text-purple-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                                <Upload size={12} /> 上传图片
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                        {Array.isArray(formData.imageAttachments) && formData.imageAttachments.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {formData.imageAttachments.map((img, i) => (
                                    <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border">
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                imageAttachments: prev.imageAttachments?.filter((_, idx) => idx !== i)
                                            }))}
                                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[11px] text-gray-400 bg-[#f8f6fc] p-2.5 rounded-xl text-center">
                                暂无图片附件
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">检索标签 (英文或中文逗号分隔)</label>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="如：宿舍, 800W, 吹风机, 违章电器"
                            className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-purple-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleFormSave}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[12.5px] font-bold shadow-md cursor-pointer"
                    >
                        保存条目
                    </button>
                </div>
            </div>
        </div>
    );
};
