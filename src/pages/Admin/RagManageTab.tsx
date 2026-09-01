import React, { useState, useEffect } from 'react';
import {
    BookOpen, Search, Plus, FileUp, LayoutGrid, Table as TableIcon,
    Trash2, Edit3, Image as ImageIcon, Tag, RefreshCw, Eye, X, Users
} from 'lucide-react';
import { RagItem, DocumentChunk } from '../../types';
import { API_BASE } from '../../api/config';
import { RagItemModal } from '../RagKnowledge/RagItemModal';
import { DocChunkImportModal } from '../RagKnowledge/DocChunkImportModal';
import { RAG_DOMAIN_OPTIONS } from '../../constants/thoughtClones';

interface RagManageTabProps {
    onRefreshStats?: () => void;
}

const AGENT_LABELS: Record<string, { name: string; color: string; bg: string }> = {
    'all': { name: '🌐 全局通用', color: '#6b7280', bg: 'bg-gray-100 text-gray-700' },
    'score_risk': { name: '📊 录取风控', color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700' },
    'subject_rule': { name: '📜 选科政策', color: '#ef4444', bg: 'bg-rose-100 text-rose-700' },
    'career_market': { name: '💼 就业前景', color: '#0284c7', bg: 'bg-sky-100 text-sky-700' },
    'civil_service': { name: '🏛️ 体制考公', color: '#2563eb', bg: 'bg-blue-100 text-blue-700' },
    'postgrad_study': { name: '🎓 升学深造', color: '#4f46e5', bg: 'bg-indigo-100 text-indigo-700' },
    'curriculum_study': { name: '📚 课业难度', color: '#d97706', bg: 'bg-amber-100 text-amber-700' },
    'transfer_policy': { name: '🔄 备选退路', color: '#059669', bg: 'bg-emerald-100 text-emerald-700' },
    'campus_life': { name: '🏕️ 校园生活', color: '#db2777', bg: 'bg-pink-100 text-pink-700' },
    'finance_aid': { name: '💰 学费资助', color: '#ca8a04', bg: 'bg-yellow-100 text-yellow-800' },
    'psych_family': { name: '🤝 家庭沟通', color: '#0d9488', bg: 'bg-teal-100 text-teal-700' },
    'lili_guide': { name: '🌸 地图伴游', color: '#ec4899', bg: 'bg-pink-100 text-pink-700' },
    // Backward-compatibility fallbacks
    'dr': { name: '📊 录取风控 (Dr)', color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700' },
    'dorm': { name: '🏕️ 宿舍生活 (宿管)', color: '#f97316', bg: 'bg-orange-100 text-orange-700' },
    'counselor': { name: '🔄 转专业/学籍 (李导)', color: '#2563eb', bg: 'bg-blue-100 text-blue-700' },
    'senior_boy': { name: '🏕️ 生活经验 (浩哥)', color: '#059669', bg: 'bg-emerald-100 text-emerald-700' },
    'senior_girl': { name: '🌸 地图游玩 (丽丽)', color: '#ec4899', bg: 'bg-pink-100 text-pink-700' }
};

export const RagManageTab: React.FC<RagManageTabProps> = ({ onRefreshStats }) => {
    const [items, setItems] = useState<RagItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('全部');
    const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
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
        const itemAgent = item.targetAgent || 'all';
        let matchesAgent = selectedAgentFilter === 'all' || itemAgent === selectedAgentFilter || itemAgent === 'all';
        
        if (!matchesAgent && selectedAgentFilter !== 'all') {
            if (selectedAgentFilter === 'score_risk' && itemAgent === 'dr') matchesAgent = true;
            else if (selectedAgentFilter === 'campus_life' && (itemAgent === 'dorm' || itemAgent === 'senior_boy')) matchesAgent = true;
            else if (selectedAgentFilter === 'transfer_policy' && itemAgent === 'counselor') matchesAgent = true;
            else if (selectedAgentFilter === 'lili_guide' && itemAgent === 'senior_girl') matchesAgent = true;
        }
        if (!matchesAgent) return false;

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

    const handleSaveItem = async (itemData: Partial<RagItem>) => {
        try {
            if (itemData.id) {
                await fetch(`${API_BASE}/api/admin/rag/${itemData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(itemData)
                });
            } else {
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

    const handleDeleteItem = async (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定要删除该知识条目吗？该操作不可撤销。')) return;

        try {
            await fetch(`${API_BASE}/api/admin/rag/${id}`, { method: 'DELETE' });
            fetchRagItems();
            onRefreshStats?.();
        } catch (err) {
            console.error('Delete RAG item failed:', err);
            alert('删除条目失败');
        }
    };

    const handleBatchSaveChunks = async (chunks: DocumentChunk[]) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/save-chunks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunks })
            });
            const data = await res.json();
            if (data.ok) {
                alert(`成功导入 ${data.count} 条知识切片！`);
                setIsChunkModalOpen(false);
                fetchRagItems();
                onRefreshStats?.();
            } else {
                alert(data.error || '导入失败');
            }
        } catch (err) {
            console.error('Batch save chunks failed:', err);
            alert('批量保存切片异常');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Metrics */}
            <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/80 shadow-[0_8px_25px_rgba(186,175,215,0.18)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[18px] flex items-center gap-2">
                            <BookOpen size={20} className="text-purple-600" /> RAG 核心知识库与决策分库管理
                        </h3>
                        <p className="text-[12px] text-[#8a84a4] mt-0.5">
                            支持按多智能体决策矩阵与校园伴游向导进行独立知识库隔离检索与精准管理
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => {
                                setEditingItem({ targetAgent: selectedAgentFilter === 'all' ? 'all' : selectedAgentFilter });
                                setIsItemModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[12.5px] font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus size={15} />
                            <span>新建知识条目</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsChunkModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[12.5px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <FileUp size={15} />
                            <span>智能文档切片导入</span>
                        </button>

                        <button
                            type="button"
                            onClick={fetchRagItems}
                            disabled={loading}
                            className="p-2 rounded-2xl bg-[#f8f6fc] text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer"
                            title="刷新知识库"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Multi-Agent Knowledge Filter Segmented Tabs */}
                <div className="mt-5 pt-4 border-t border-purple-50">
                    <div className="text-[11px] font-bold text-[#8a84a4] mb-2 flex items-center gap-1">
                        <Users size={12} className="text-purple-600" /> 按决策智能体与伴游向导专属分库筛选：
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {RAG_DOMAIN_OPTIONS.map((ag) => (
                            <button
                                key={ag.key}
                                type="button"
                                onClick={() => setSelectedAgentFilter(ag.key)}
                                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer ${
                                    selectedAgentFilter === ag.key
                                        ? 'bg-[#4a4365] text-white shadow-sm'
                                        : 'bg-[#fbf9fe] text-[#7a7398] hover:bg-[#ede8f8]'
                                }`}
                                title={ag.desc}
                            >
                                {ag.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-white">
                <div className="relative w-full sm:w-80">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索标题、内容、标签或关键词..."
                        className="w-full bg-[#f8f6fc] rounded-xl pl-9 pr-4 py-2 text-[12.5px] outline-none border border-transparent focus:border-[#a494e8]"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-[#f8f6fc] rounded-xl px-3 py-2 text-[12px] font-bold text-[#4a4365] outline-none cursor-pointer border border-transparent focus:border-[#a494e8]"
                    >
                        {categories.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                        ))}
                    </select>

                    <div className="flex items-center bg-[#f8f6fc] rounded-xl p-1 border">
                        <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-white shadow-xs text-purple-700' : 'text-gray-400'}`}
                            title="网格卡片视图"
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-xs text-purple-700' : 'text-gray-400'}`}
                            title="紧凑表格视图"
                        >
                            <TableIcon size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Knowledge Cards / Table View */}
            {filteredItems.length === 0 ? (
                <div className="bg-white/60 rounded-3xl p-12 text-center text-[#8a84a4] space-y-2">
                    <BookOpen size={36} className="mx-auto text-purple-300 opacity-60" />
                    <div className="font-bold text-[14px]">暂无匹配的 RAG 知识条目</div>
                    <div className="text-[12px]">可点击上方“新建知识条目”或“智能文档切片导入”添加数据</div>
                </div>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                        const agentInfo = AGENT_LABELS[item.targetAgent || 'all'] || AGENT_LABELS.all;
                        return (
                            <div
                                key={item.id}
                                className="bg-white/85 rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(186,175,215,0.12)] hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-bold text-[#4a4365] text-[14px] line-clamp-2 leading-snug">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setIsItemModalOpen(true);
                                                }}
                                                className="p-1.5 rounded-xl hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors cursor-pointer"
                                                title="编辑"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteItem(item.id, e)}
                                                className="p-1.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                                title="删除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Agent Badge & Category Badge */}
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${agentInfo.bg}`}>
                                            {agentInfo.name}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-100">
                                            {item.category}
                                        </span>
                                        {item.type === 'table' && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                                                表格型
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[12px] text-[#7a7398] line-clamp-3 leading-relaxed">
                                        {item.content || '无文本说明'}
                                    </p>

                                    {/* Image attachments thumbnail */}
                                    {Array.isArray(item.imageAttachments) && item.imageAttachments.length > 0 && (
                                        <div className="flex gap-1.5 pt-1">
                                            {item.imageAttachments.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img.url}
                                                    alt={img.name}
                                                    onClick={() => setPreviewImage(img.url)}
                                                    className="w-10 h-10 rounded-lg object-cover border border-purple-100 cursor-pointer hover:opacity-80"
                                                    title={img.caption || img.name}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-2 border-t border-purple-50">
                                        {item.tags.slice(0, 4).map((t, i) => (
                                            <span key={i} className="text-[10px] text-gray-400 font-mono">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white/85 rounded-3xl p-4 border border-white shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-[12.5px]">
                        <thead>
                            <tr className="border-b border-purple-50 text-[#8a84a4] font-bold">
                                <th className="pb-3 px-3">标题</th>
                                <th className="pb-3 px-3">归属智能体</th>
                                <th className="pb-3 px-3">分类</th>
                                <th className="pb-3 px-3">内容概要</th>
                                <th className="pb-3 px-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50">
                            {filteredItems.map((item) => {
                                const agentInfo = AGENT_LABELS[item.targetAgent || 'all'] || AGENT_LABELS.all;
                                return (
                                    <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                                        <td className="py-3 px-3 font-bold text-[#4a4365] max-w-[200px] truncate">{item.title}</td>
                                        <td className="py-3 px-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${agentInfo.bg}`}>
                                                {agentInfo.name}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-purple-700 font-medium">{item.category}</td>
                                        <td className="py-3 px-3 text-[#7a7398] max-w-[260px] truncate">{item.content}</td>
                                        <td className="py-3 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setIsItemModalOpen(true);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-purple-600 cursor-pointer"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteItem(item.id, e)}
                                                    className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            {isItemModalOpen && (
                <RagItemModal
                    item={editingItem || {}}
                    onClose={() => {
                        setIsItemModalOpen(false);
                        setEditingItem(null);
                    }}
                    onSave={handleSaveItem}
                />
            )}

            {isChunkModalOpen && (
                <DocChunkImportModal
                    isOpen={isChunkModalOpen}
                    onClose={() => setIsChunkModalOpen(false)}
                    onSaveChunks={handleBatchSaveChunks}
                    onBatchSave={handleBatchSaveChunks}
                    onRefresh={fetchRagItems}
                />
            )}

            {/* Image Preview Lightbox */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 cursor-pointer"
                >
                    <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl">
                        <img src={previewImage} alt="预览" className="w-full h-full object-contain" />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
