import React from 'react';
import {
    Database, Table as TableIcon, Image as ImageIcon,
    Plus, FileUp, Search, Trash2, Edit3, Eye, Sparkles, Tag
} from 'lucide-react';
import { RagItem } from '../../types';

interface RagManageTabProps {
    ragItems: RagItem[];
    ragSearchQuery: string;
    setRagSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    ragCategoryFilter: string;
    setRagCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
    chunkPreviewMode: 'list' | 'table';
    setChunkPreviewMode: React.Dispatch<React.SetStateAction<'list' | 'table'>>;
    onOpenAddModal: () => void;
    onOpenImportModal: () => void;
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
    onOpenImportModal,
    onEditItem,
    onDeleteItem
}) => {
    const categories = ['ALL', '录取分数', '专业介绍', '宿舍环境', '学费与奖学金', '校园生活', '常规问答', '文档切片'];

    const filteredItems = ragItems.filter(item => {
        const matchesCategory = ragCategoryFilter === 'ALL' || item.category === ragCategoryFilter;
        const q = ragSearchQuery.toLowerCase().trim();
        const matchesQuery = !q ||
            item.title.toLowerCase().includes(q) ||
            item.content.toLowerCase().includes(q) ||
            (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));
        return matchesCategory && matchesQuery;
    });

    const totalTables = ragItems.filter(i => i.tableData && i.tableData.columns).length;
    const totalImages = ragItems.reduce((acc, i) => acc + (i.imageAttachments?.length || 0), 0);

    // Keyword Highlight Helper
    const renderHighlightedText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5 font-bold">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Top Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center shrink-0">
                        <Database size={24} />
                    </div>
                    <div>
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">{ragItems.length}</div>
                        <div className="text-[11.5px] font-medium text-gray-500">已建档知识库切片</div>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <TableIcon size={24} />
                    </div>
                    <div>
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">{totalTables}</div>
                        <div className="text-[11.5px] font-medium text-gray-500">结构化录取数据表</div>
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <div className="text-[22px] font-black text-[#4a4365] leading-tight">{totalImages}</div>
                        <div className="text-[11.5px] font-medium text-gray-500">校区实景图文附件</div>
                    </div>
                </div>
            </div>

            {/* 2. Action Controls & Filter Bar */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-white shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={ragSearchQuery}
                            onChange={(e) => setRagSearchQuery(e.target.value)}
                            placeholder="搜索切片标题、正文、检索关键词..."
                            className="w-full bg-[#f8f6fc] pl-9 pr-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={ragCategoryFilter}
                        onChange={(e) => setRagCategoryFilter(e.target.value)}
                        className="bg-[#f8f6fc] px-3.5 py-2.5 rounded-2xl text-[12px] font-bold text-[#4a4365] outline-none cursor-pointer border border-transparent focus:border-purple-200"
                    >
                        {categories.map(c => (
                            <option key={c} value={c}>
                                {c === 'ALL' ? '全部分类' : c}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex bg-[#f8f6fc] p-1 rounded-2xl border border-purple-50">
                        <button
                            onClick={() => setChunkPreviewMode('list')}
                            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${chunkPreviewMode === 'list' ? 'bg-white text-[#4a4365] shadow-2xs' : 'text-gray-400'
                                }`}
                        >
                            卡片视图
                        </button>
                        <button
                            onClick={() => setChunkPreviewMode('table')}
                            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${chunkPreviewMode === 'table' ? 'bg-white text-[#4a4365] shadow-2xs' : 'text-gray-400'
                                }`}
                        >
                            表格视图
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <button
                        onClick={onOpenImportModal}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-2 rounded-2xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <FileUp size={15} />
                        <span>AI / 智能切片导入</span>
                    </button>

                    <button
                        onClick={onOpenAddModal}
                        className="bg-[#4a4365] hover:bg-[#342e49] text-white px-4 py-2 rounded-2xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <Plus size={15} />
                        <span>手动新建知识项</span>
                    </button>
                </div>
            </div>

            {/* 3. Items Display (Card View or Table View) */}
            {filteredItems.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center text-gray-400 space-y-3">
                    <Database size={40} className="mx-auto text-gray-300 animate-pulse" />
                    <div className="text-[14px] font-bold text-gray-500">未找到匹配的知识库切片</div>
                    <p className="text-[11px] text-gray-400">您可以尝试调整搜索关键词或分类筛选，也可以点击右上角新建知识项</p>
                </div>
            ) : chunkPreviewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                        const wordCount = item.content.length;
                        const estTokens = Math.round(wordCount * 0.7);

                        return (
                            <div
                                key={item.id}
                                className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                            {item.category || '通用'}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                            {item.type === 'table' && <TableIcon size={12} className="text-indigo-500" />}
                                            {item.imageAttachments && item.imageAttachments.length > 0 && (
                                                <ImageIcon size={12} className="text-pink-500" />
                                            )}
                                            <span>{wordCount} 字 · ~{estTokens} T</span>
                                        </div>
                                    </div>

                                    <h4 className="font-black text-[#4a4365] text-[14px] leading-snug group-hover:text-purple-700 transition-colors">
                                        {renderHighlightedText(item.title, ragSearchQuery)}
                                    </h4>

                                    <p className="text-[12px] text-gray-600 line-clamp-3 leading-relaxed">
                                        {renderHighlightedText(item.content, ragSearchQuery)}
                                    </p>

                                    {/* Image Attachments Preview */}
                                    {item.imageAttachments && item.imageAttachments.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
                                            {item.imageAttachments.map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={img.url}
                                                    alt={img.name || '附件'}
                                                    className="w-12 h-12 rounded-xl object-cover border border-purple-100 shrink-0"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {item.tags.slice(0, 4).map((t, idx) => (
                                                <span key={idx} className="text-[9.5px] font-bold text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                                    <Tag size={9} /> {renderHighlightedText(t, ragSearchQuery)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-purple-50">
                                    <span className="text-[10px] text-gray-400">
                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '刚刚'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onEditItem(item)}
                                            className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                            title="编辑此条知识"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDeleteItem(item.id)}
                                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                            title="删除此条知识"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-white shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-[#fbf9fe] text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">标题</th>
                                    <th className="py-3 px-3">分类</th>
                                    <th className="py-3 px-3">类型</th>
                                    <th className="py-3 px-3">字数/Token</th>
                                    <th className="py-3 px-3">附件</th>
                                    <th className="py-3 px-3">检索关键词</th>
                                    <th className="py-3 px-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-[12px]">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="py-3 px-4 font-bold text-[#4a4365] max-w-[240px] truncate">
                                            {renderHighlightedText(item.title, ragSearchQuery)}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 font-medium text-gray-500">
                                            {item.type === 'table' ? '表格' : item.type === 'image' ? '图文' : '文本'}
                                        </td>
                                        <td className="py-3 px-3 text-gray-400 font-mono">
                                            {item.content.length} 字
                                        </td>
                                        <td className="py-3 px-3 text-gray-400">
                                            {item.imageAttachments?.length || 0} 张图
                                        </td>
                                        <td className="py-3 px-3 max-w-[200px] truncate text-gray-400">
                                            {(item.tags || []).join(', ')}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => onEditItem(item)}
                                                    className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
