import React, { useState } from 'react';
import { DocumentChunk } from '../../types';

interface ChunkSingleEditorProps {
    chunk: DocumentChunk;
    onClose: () => void;
    onSave: (updated: DocumentChunk) => void;
}

export const ChunkSingleEditor: React.FC<ChunkSingleEditorProps> = ({ chunk, onClose, onSave }) => {
    const [title, setTitle] = useState(chunk.title);
    const [content, setContent] = useState(chunk.content);
    const [tags, setTags] = useState((chunk.tags || []).join(', '));

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-[480px] w-full space-y-3 shadow-xl border">
                <h4 className="font-bold text-[#4a4365] text-[14px]">修改该切片内容</h4>
                <div>
                    <label className="text-[11px] font-bold text-gray-500">切片标题</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#f8f6fc] rounded-xl px-3 py-2 text-[12px] outline-none mt-1"
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-500">切片正文</label>
                    <textarea
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-[#f8f6fc] rounded-xl p-3 text-[12px] outline-none mt-1"
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-gray-500">关键词/标签</label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full bg-[#f8f6fc] rounded-xl px-3 py-2 text-[12px] outline-none mt-1"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-[12px] text-gray-500 cursor-pointer">取消</button>
                    <button
                        onClick={() => onSave({
                            ...chunk,
                            title,
                            content,
                            tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
                        })}
                        className="bg-[#4a4365] text-white px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer"
                    >
                        更新切片
                    </button>
                </div>
            </div>
        </div>
    );
};
