import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { RagItem } from '../../types';
import { API_BASE } from '../../api/config';

interface RagItemModalProps {
    item: Partial<RagItem>;
    onClose: () => void;
    onSave: (itemData: Partial<RagItem>) => void;
}

export const RagItemModal: React.FC<RagItemModalProps> = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<RagItem>>({ ...item });
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

                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-[#4a4365] text-[16px]">
                        {formData.id ? '编辑知识条目' : '新增 RAG 知识条目'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">标题</label>
                        <input
                            type="text"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="请输入标题"
                            className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">分类</label>
                            <input
                                type="text"
                                value={formData.category || ''}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="如：录取分数 / 宿舍环境"
                                className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">类型</label>
                            <select
                                value={formData.type || 'text'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                            >
                                <option value="text">文本型</option>
                                <option value="table">表格型</option>
                                <option value="image">图片附件型</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">描述与详细文本</label>
                        <textarea
                            rows={3}
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="详细正文或相关说明..."
                            className="w-full bg-[#f8f6fc] rounded-xl p-4 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>

                    <div className="border border-dashed border-[#d6cbf5] rounded-2xl p-4 bg-[#fbf9fe] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                <ImageIcon size={16} className="text-[#a494e8]" /> PNG 图片附件管理
                            </span>
                            <label className="bg-[#4a4365] text-white px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-[#342e49] transition-all flex items-center gap-1">
                                <Upload size={13} /> 上传 PNG 图片
                                <input type="file" accept="image/png,image/jpeg" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>

                        {(formData.imageAttachments || []).length > 0 ? (
                            <div className="space-y-2">
                                {formData.imageAttachments?.map((img, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100 text-[12px]">
                                        <div className="flex items-center gap-2">
                                            <img src={img.url} alt={img.name} className="w-8 h-8 rounded object-cover border" />
                                            <div>
                                                <div className="font-bold text-[#4a4365]">{img.name}</div>
                                                <div className="text-[10px] text-gray-400">{img.caption}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                imageAttachments: (prev.imageAttachments || []).filter((_, idx) => idx !== i)
                                            }))}
                                            className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] text-gray-400 text-center py-2">暂无关联的图片附件，可点击右上方按钮上传 PNG 图片并自动向量化</p>
                        )}
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-[#4a4365] block mb-1">向量检索关键词与标签（英文逗号隔开）</label>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="如：录取分数, 2025, 浙江, dorm_map.png"
                            className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-2xl text-[13px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer">
                        取消
                    </button>
                    <button onClick={handleFormSave} className="bg-[#4a4365] text-white px-6 py-2.5 rounded-2xl text-[13px] font-bold shadow-md hover:bg-[#342e49] cursor-pointer">
                        保存到知识库
                    </button>
                </div>

            </div>
        </div>
    );
};
