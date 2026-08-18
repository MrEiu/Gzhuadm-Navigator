import React from 'react';
import {
    Database, Image as ImageIcon, Search, FileUp, Table, Plus, Edit3, Trash2
} from 'lucide-react';
import { RagItem } from '../../types';

interface RagManageTabProps {
    ragItems: RagItem[];
    ragSearchQuery: string;
    setRagSearchQuery: (q: string) => void;
    ragCategoryFilter: string;
    setRagCategoryFilter: (c: string) => void;
    chunkPreviewMode: 'list' | 'table';
    setChunkPreviewMode: (m: 'list' | 'table') => void;
    onOpenAddModal: () => void;
    onOpenChunkModal: () => void;
    onEditItem: (item: RagItem) => void;
    onDeleteItem: (id: string) => void;
}

export const RagManageTab: React.FC<RagManageTabProps> = ({
    ragItems,
    ragSearchQuery,
    setRagSearchQuery,
    ragCategoryFilter,
    setRagCategoryFilter,
    chunkPreviewMode,
    setChunkPreviewMode,
    onOpenAddModal,
    onOpenChunkModal,
    onEditItem,
    onDeleteItem
}) => {
    const filteredRagItems = ragItems.filter(item => {
        const matchCat = ragCategoryFilter === 'ALL' || item.category === ragCategoryFilter;
        const q = ragSearchQuery.toLowerCase();
        const matchQ = !q || item.title?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q) || (item.tags || []).some((t: string) => t.toLowerCase().includes(q));
        return matchCat && matchQ;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#a494e8] flex items-center justify-center font-bold">
                        <Database size={20} />
                    </div>
                    <div>
                        <div className="text-[18px] font-black text-[#4a4365]">{ragItems.length}</div>
                        <div className="text-[11px] font-medium text-[#8a84a4]">已建档知识总条目</div>
                    </div>
                </div>

                <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center font-bold">
                        <Table size={20} />
                    </div>
                    <div>
                        <div className="text-[18px] font-black text-[#4a4365]">
                            {ragItems.filter(i => i.type === 'table').length}
                        </div>
                        <div className="text-[11px] font-medium text-[#8a84a4]">结构化录取表格</div>
                    </div>
                </div>

                <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-xs flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center font-bold">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <div className="text-[18px] font-black text-[#4a4365]">
                            {ragItems.reduce((acc, i) => acc + (i.imageAttachments?.length || 0), 0)}
                        </div>
                        <div className="text-[11px] font-medium text-[#8a84a4]">PNG 图片附件</div>
                    </div>
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 p-3 rounded-2xl border border-white shadow-xs">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            value={ragSearchQuery}
                            onChange={(e) => setRagSearchQuery(e.target.value)}
                            placeholder="搜索知识库标题/标签..."
                            className="w-full bg-[#f8f6fc] pl-9 pr-4 py-2 rounded-xl text-[12px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>

                    <select
                        value={ragCategoryFilter}
                        onChange={(e) => setRagCategoryFilter(e.target.value)}
                        className="bg-[#f8f6fc] text-[#4a4365] px-3 py-2 rounded-xl text-[12px] font-bold outline-none cursor-pointer"
                    >
                        <option value="ALL">全部分类 ({ragItems.length})</option>
                        {Array.from(new Set(ragItems.map(i => i.category))).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex bg-[#f8f6fc] p-1 rounded-xl">
                        <button
                            onClick={() => setChunkPreviewMode('list')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${chunkPreviewMode === 'list' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-400'
                                }`}
                        >
                            卡片
                        </button>
                        <button
                            onClick={() => setChunkPreviewMode('table')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${chunkPreviewMode === 'table' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-400'
                                }`}
                        >
                            表格
                        </button>
                    </div>

                    <button
                        onClick={onOpenChunkModal}
                        className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                        <FileUp size={14} /> AI智能切片
                    </button>

                    <button
                        onClick={onOpenAddModal}
                        className="bg-[#4a4365] text-white px-3.5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#342e49] active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus size={14} /> 添加知识
                    </button>
                </div>
            </div>

            {/* Knowledge Items Grid / Table View */}
            {filteredRagItems.length === 0 ? (
                <div className="bg-white/60 rounded-3xl p-12 text-center text-gray-400 font-bold border border-white">
                    未检索到符合条件的知识库条目
                </div>
            ) : chunkPreviewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRagItems.map(item => (
                        <div key={item.id} className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-purple-100 text-[#7a64c8]">
                                        {item.category}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {item.type === 'table' && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                <Table size={10} /> 表格
                                            </span>
                                        )}
                                        {(item.imageAttachments?.length || 0) > 0 && (
                                            <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                <ImageIcon size={10} /> {item.imageAttachments?.length} 张
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="font-bold text-[#4a4365] text-[14px] leading-snug">
                                    {item.title}
                                </h3>

                                <p className="text-[12px] text-gray-500 line-clamp-3 leading-relaxed">
                                    {item.content}
                                </p>

                                {(item.imageAttachments?.length || 0) > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto py-1 hide-scrollbar">
                                        {item.imageAttachments?.map((img, idx) => (
                                            <div key={idx} className="relative group/img shrink-0">
                                                <img
                                                    src={img.url}
                                                    alt={img.caption || '知识库配图'}
                                                    className="w-14 h-14 object-cover rounded-xl border border-white shadow-2xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                                <div className="flex items-center gap-1 flex-wrap">
                                    {(item.tags || []).slice(0, 3).map((tag, tIdx) => (
                                        <span key={tIdx} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEditItem(item)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer"
                                        title="编辑此条目"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDeleteItem(item.id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                        title="删除此条目"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/80 rounded-3xl overflow-hidden border border-white shadow-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-[#f8f6fc] text-[11px] font-bold text-[#8a84a4]">
                                <th className="p-3.5 pl-6">标题</th>
                                <th className="p-3.5">分类</th>
                                <th className="p-3.5">类型</th>
                                <th className="p-3.5">附件</th>
                                <th className="p-3.5">标签</th>
                                <th className="p-3.5 pr-6 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[12px]">
                            {filteredRagItems.map(item => (
                                <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                                    <td className="p-3.5 pl-6 font-bold text-[#4a4365] max-w-[200px] truncate">
                                        {item.title}
                                    </td>
                                    <td className="p-3.5 text-gray-500">
                                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-gray-500">
                                        {item.type === 'table' ? '结构化表格' : '普通文本'}
                                    </td>
                                    <td className="p-3.5 text-gray-500">
                                        {(item.imageAttachments?.length || 0) > 0 ? `${item.imageAttachments?.length} 张图` : '-'}
                                    </td>
                                    <td className="p-3.5 text-gray-400 text-[10px] max-w-[150px] truncate">
                                        {(item.tags || []).join(', ')}
                                    </td>
                                    <td className="p-3.5 pr-6 text-right space-x-1">
                                        <button
                                            onClick={() => onEditItem(item)}
                                            className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteItem(item.id)}
                                            className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
