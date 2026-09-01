import React, { useState, useEffect } from 'react';
import { Sparkles, X, Bookmark, Database } from 'lucide-react';
import { PersonalRagItem } from '../../types';
import { API_BASE } from '../../api/config';

interface PersonalRagModalProps {
    username?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const PersonalRagModal: React.FC<PersonalRagModalProps> = ({ username, isOpen, onClose }) => {
    const [items, setItems] = useState<PersonalRagItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && username) {
            setLoading(true);
            fetch(`${API_BASE}/api/user/personal-rag?username=${encodeURIComponent(username)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.ok) setItems(data.items || []);
                })
                .catch(err => console.error('Personal RAG fetch err:', err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, username]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[620px] w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border-4 border-white space-y-4 animate-in zoom-in-95 duration-300">

                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-amber-400 to-purple-500 text-white flex items-center justify-center shadow-md">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#4a4365] text-[16px]">
                                {username ? `【${username}】的个人 RAG 专属记忆数据库` : '个人 RAG 专属记忆数据库'}
                            </h3>
                            <p className="text-[11px] text-[#8a84a4]">AI 在对话中自动总结并提炼的个人背景偏好与记忆数据</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-[13px] text-gray-400">正在检索个人 RAG 知识库...</div>
                ) : items.length > 0 ? (
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={item.id || idx} className="bg-[#f8f6fc] p-4 rounded-2xl border border-purple-100 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#4a4365] text-[13px] flex items-center gap-1.5">
                                        <Bookmark size={14} className="text-[#a494e8]" />
                                        {item.title}
                                    </span>
                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                        {item.category || '个人档案'}
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#6d648b] leading-relaxed">{item.content}</p>
                                <div className="text-[10px] text-gray-400 text-right pt-1">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : '自动生成'}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center space-y-2">
                        <Database size={32} className="mx-auto text-gray-300" />
                        <p className="text-[13px] font-bold text-[#4a4365]">暂无提取的个人 RAG 节点</p>
                        <p className="text-[11px] text-gray-400">在与 AI 咨询对话过程中，系统将自动提炼您的意向专业、报考地区及特殊需求并存入此处。</p>
                    </div>
                )}

                <div className="flex justify-end pt-2 border-t">
                    <button onClick={onClose} className="bg-[#4a4365] text-white px-5 py-2 rounded-xl text-[12px] font-bold cursor-pointer">
                        关闭
                    </button>
                </div>

            </div>
        </div>
    );
};
