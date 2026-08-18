import React, { useState, useEffect } from 'react';
import {
    BookOpen, Search, Plus, FileUp, LayoutGrid, Table as TableIcon,
    Trash2, Edit3, Image as ImageIcon, Tag, RefreshCw, Eye, X
} from 'lucide-react';
import { RagItem, DocumentChunk } from '../../types';
import { API_BASE } from '../../api/config';
import { RagItemModal } from '../RagKnowledge/RagItemModal';
import { DocChunkImportModal } from '../RagKnowledge/DocChunkImportModal';

interface RagManageTabProps {
    onRefreshStats?: () => void;
}

export const RagManageTab: React.FC<RagManageTabProps> = ({ onRefreshStats }) => {
    const [items, setItems] = useState<RagItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // Modals
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<RagItem> | null>(null);
    const [isChunkModalOpen, setIsChunkModalOpen] = useState(false);

    // Lightbox
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchRagItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/items`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.items)) {
                setItems(data.items);
            }
        } catch (err) {
            console.error('Failed to fetch RAG items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRagItems();
    }, []);

    // Unique Categories
    const categories = ['全部', ...Array.from(new Set(items.map(i => i.category || '通用').filter(Boolean)))];

    // Filter items
    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
        if (!matchesCategory) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const contentMatch = (item.content || '').toLowerCase().includes(q);
        const tagMatch = (item.tags || []).some(t => String(t).toLowerCase().includes(q));
        const catMatch = (item.category || '').toLowerCase().includes(q);

        return titleMatch || contentMatch || tagMatch || catMatch;
    });

    // Counts
    const totalItems = items.length;
    const tableItemsCount = items.filter(i => i.type === 'table' || (i.tableData && i.tableData.columns && i.tableData.columns.length)).length;
    let imageAttachmentsCount = 0;
    items.forEach(i => {
        if (Array.isArray(i.imageAttachments)) {
            imageAttachmentsCount += i.imageAttachments.length;
        }
    });

    const handleSaveItem = async (itemData: Partial<RagItem>) => {
        try {
            if (itemData.id) {
                // Update
                await fetch(`${API_BASE}/api/admin/rag/${itemData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                });
            } else {
                // Create
                await fetch(`${API_BASE}/api/admin/rag`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                });
            }
            setIsItemModalOpen(false);
            setEditingItem(null);
            fetchRagItems();
            onRefreshStats?.();
        } catch (err) {
            console.error('Save RAG item failed:', err);
            alert('保存知识条目失败，请检查后端网络');
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!window.confirm('确定要删除该知识条目吗？删除后将自动从向量索引库中移除。')) return;
        try {
            await fetch(`${API_BASE}/api/admin/rag/${id}`, {
                method: 'DELETE'
            });
            fetchRagItems();
            onRefreshStats?.();
        } catch (err) {
            console.error('Delete RAG item failed:', err);
        }
    };

    const handleBatchSaveChunks = async (chunks: DocumentChunk[]) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/rag/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunks })
            });
            const data = await res.json();
            if (data.ok) {
                alert(`🎉 成功批量导入并向量化 ${data.count} 条知识切片！`);
                setIsChunkModalOpen(false);
                fetchRagItems();
                onRefreshStats?.();
            } else {
                alert('批量保存失败：' + (data.error || '未知错误'));
            }
        } catch (err) {
            console.error('Batch save failed:', err);
            alert('批量保存连接异常');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-8">

            {/* 1. Top Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-4 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex items-center justify-between">
                    <div>
                        <div className="text-[11.5px] font-bold text-[#8a84a4]">已建档知识总数</div>
                        <div className="text-[24px] font-black text-[#4a4365] font-mono mt-0.5">{totalItems} <span className="text-[12px] font-sans font-normal text-gray-400">条</span></div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
                        <BookOpen size={20} />
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-4 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex items-center justify-between">
                    <div>
                        <div className="text-[11.5px] font-bold text-[#8a84a4]">结构化录取表格</div>
                        <div className="text-[24px] font-black text-[#4a4365] font-mono mt-0.5">{tableItemsCount} <span className="text-[12px] font-sans font-normal text-gray-400">份</span></div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                        <TableIcon size={20} />
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-4 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex items-center justify-between">
                    <div>
                        <div className="text-[11.5px] font-bold text-[#8a84a4]">PNG 图片附件总数</div>
                        <div className="text-[24px] font-black text-[#4a4365] font-mono mt-0.5">{imageAttachmentsCount} <span className="text-[12px] font-sans font-normal text-gray-400">张</span></div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-xs">
                        <ImageIcon size={20} />
                    </div>
                </div>
            </div>

            {/* 2. Controls & Search Filter Strip */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-4 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex flex-col md:flex-row items-center justify-between gap-3.5">

                <div className="flex flex-1 items-center gap-2.5 w-full">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="实时搜索知识标题、分类、正文或 #标签..."
                            className="w-full bg-[#f8f6fc] rounded-2xl pl-9 pr-4 py-2 text-[12.5px] text-[#4a4365] outline-none border border-transparent focus:border-[#a494e8] transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Category Dropdown */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-[#f8f6fc] text-[#4a4365] font-bold text-[12.5px] rounded-2xl px-3.5 py-2 outline-none border border-transparent focus:border-[#a494e8] transition-all cursor-pointer"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat === '全部' ? '全部分类' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {/* View Switcher */}
                    <div className="flex bg-[#f8f6fc] p-1 rounded-2xl border border-purple-100">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                            title="卡片视图"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                            title="表格视图"
                        >
                            <TableIcon size={16} />
                        </button>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchRagItems}
                        className="p-2 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 text-gray-500 hover:text-[#4a4365] transition-all cursor-pointer"
                        title="刷新列表"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>

                    {/* Import Chunks Button */}
                    <button
                        onClick={() => setIsChunkModalOpen(true)}
                        className="px-3.5 py-2 rounded-2xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 text-[12px] font-bold shadow-xs hover:border-purple-300 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <FileUp size={14} /> AI 切片导入
                    </button>

                    {/* Add Item Button */}
                    <button
                        onClick={() => {
                            setEditingItem({
                                title: '',
                                category: '录取分数',
                                type: 'text',
                                content: '',
                                tags: [],
                                imageAttachments: []
                            });
                            setIsItemModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white text-[12px] font-bold shadow-[0_4px_12px_rgba(179,164,237,0.35)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <Plus size={15} /> 新增知识条目
                    </button>
                </div>

            </div>

            {/* 3. Items Display Area */}
            {loading ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-gray-400 text-[13px] gap-2">
                    <div className="w-8 h-8 border-3 border-[#a494e8] border-t-transparent rounded-full animate-spin" />
                    <span>正在加载 RAG 知识库...</span>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-12 text-center border border-white space-y-3">
                    <BookOpen size={36} className="mx-auto text-purple-300" />
                    <h4 className="font-bold text-[#4a4365] text-[15px]">未找到匹配的 RAG 知识条目</h4>
                    <p className="text-[12px] text-gray-400 max-w-sm mx-auto">
                        可尝试清空检索词或点击上方「新增知识条目」或「AI 切片导入」进行知识录入。
                    </p>
                </div>
            ) : viewMode === 'cards' ? (
                /* Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                        const images = item.imageAttachments || [];
                        return (
                            <div
                                key={item.id}
                                className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(186,175,215,0.25)] transition-all space-y-3 group"
                            >
                                <div className="space-y-2">
                                    {/* Top badges & actions */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-purple-100/70 text-purple-700">
                                                {item.category || '通用'}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${item.type === 'table' ? 'bg-indigo-50 text-indigo-600' :
                                                item.type === 'image' ? 'bg-rose-50 text-rose-500' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {item.type === 'table' ? '表格型' : item.type === 'image' ? '图片型' : '文本型'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setIsItemModalOpen(true);
                                                }}
                                                className="p-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                                title="编辑知识"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="删除知识"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h4 className="font-bold text-[#4a4365] text-[14.5px] leading-snug line-clamp-1">
                                        {item.title}
                                    </h4>

                                    {/* Content Excerpt */}
                                    <p className="text-[12px] text-[#6d648b] leading-relaxed line-clamp-3">
                                        {item.content || (item.tableData ? `包含表格数据：${item.tableData.columns?.join(', ')}` : '暂无详细描述')}
                                    </p>

                                    {/* PNG Image Preview Strip */}
                                    {images.length > 0 && (
                                        <div className="flex items-center gap-2 overflow-x-auto py-1 hide-scrollbar">
                                            {images.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setPreviewImage(img.url)}
                                                    className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-xs cursor-pointer group/img"
                                                >
                                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                        <Eye size={12} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tags & Footer */}
                                <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-[10.5px]">
                                    <div className="flex items-center gap-1 flex-wrap overflow-hidden max-w-[200px]">
                                        <Tag size={11} className="text-[#a494e8] shrink-0" />
                                        {(item.tags || []).slice(0, 3).map((t, idx) => (
                                            <span key={idx} className="text-[#8a84a4] font-medium truncate">
                                                #{t}
                                            </span>
                                        ))}
                                        {(item.tags || []).length > 3 && (
                                            <span className="text-gray-400 font-mono">+{item.tags!.length - 3}</span>
                                        )}
                                    </div>
                                    <span className="text-gray-400 font-mono text-[9.5px]">
                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '刚刚'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/80 shadow-[0_6px_20px_rgba(186,175,215,0.15)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12.5px]">
                            <thead>
                                <tr className="border-b border-purple-100 bg-[#fbf9fe] text-[#8a84a4] font-bold text-[11px]">
                                    <th className="py-3.5 px-4">标题</th>
                                    <th className="py-3.5 px-4">分类</th>
                                    <th className="py-3.5 px-4">类型</th>
                                    <th className="py-3.5 px-4">附件数</th>
                                    <th className="py-3.5 px-4">检索标签</th>
                                    <th className="py-3.5 px-4">更新时间</th>
                                    <th className="py-3.5 px-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-purple-50 text-[#4a4365]">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                                        <td className="py-3 px-4 font-bold max-w-[220px] truncate">
                                            {item.title}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-700 text-[11px] font-bold">
                                                {item.category || '通用'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${item.type === 'table' ? 'bg-indigo-50 text-indigo-600' :
                                                item.type === 'image' ? 'bg-rose-50 text-rose-500' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {item.type === 'table' ? '表格' : item.type === 'image' ? '图片' : '文本'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-gray-500">
                                            {(item.imageAttachments || []).length > 0 ? (
                                                <span className="text-purple-600 font-bold flex items-center gap-1">
                                                    <ImageIcon size={12} /> {item.imageAttachments!.length}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-[#8a84a4] max-w-[180px] truncate">
                                            {(item.tags || []).join(', ') || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                                            {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '刚刚'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsItemModalOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
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

            {/* Modal: Single Item Create/Edit */}
            {isItemModalOpen && editingItem && (
                <RagItemModal
                    item={editingItem}
                    onClose={() => {
                        setIsItemModalOpen(false);
                        setEditingItem(null);
                    }}
                    onSave={handleSaveItem}
                />
            )}

            {/* Modal: Doc Chunk Batch Import */}
            {isChunkModalOpen && (
                <DocChunkImportModal
                    onClose={() => setIsChunkModalOpen(false)}
                    onBatchSave={handleBatchSaveChunks}
                />
            )}

            {/* Lightbox Modal for PNG Preview */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
                >
                    <div className="relative max-w-4xl max-h-[85vh] bg-white rounded-3xl p-2 shadow-2xl overflow-hidden">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer z-10"
                        >
                            <X size={18} />
                        </button>
                        <img src={previewImage} alt="Preview" className="max-h-[80vh] w-auto rounded-2xl object-contain" />
                    </div>
                </div>
            )}

        </div>
    );
};
