import React, { useState, useEffect } from 'react';
import {
    Zap, Plus, Search, Filter, Edit3, Trash2, Sparkles, Check, AlertCircle,
    HelpCircle, ChevronDown, ChevronUp, Clock, Flame, ArrowRight, Play, RefreshCw, Eye,
    Upload, Image as ImageIcon, Link
} from 'lucide-react';
import { API_BASE } from '../../api/config';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';

interface FaqTemplate {
    id: string;
    standardQuestion: string;
    similarQueries: string[];
    category: string;
    tags: string[];
    answer: string;
    imageAttachments?: Array<{ name: string; url: string }>;
    hitCount: number;
    updatedAt: string;
}

export const FaqTemplatesTab: React.FC = () => {
    const [templates, setTemplates] = useState<FaqTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<FaqTemplate> | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiExpanding, setAiExpanding] = useState(false);
    const [newSimilarQuery, setNewSimilarQuery] = useState('');
    const [manualImageUrl, setManualImageUrl] = useState('');
    const [uploadingImages, setUploadingImages] = useState(false);

    // Tester state
    const [testQuery, setTestQuery] = useState('请问大学城宿舍有独立的卫生间和空调吗？');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/faq-templates`);
            const data = await res.json();
            if (data.ok && Array.isArray(data.data)) {
                setTemplates(data.data);
            }
        } catch (err) {
            console.error('Failed to load FAQ templates:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const categories = ['all', ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))];

    const filteredTemplates = templates.filter(t => {
        const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
        const matchesSearch = !searchTerm ||
            t.standardQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.similarQueries || []).some(sq => sq.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    const totalHits = templates.reduce((acc, t) => acc + (t.hitCount || 0), 0);

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleOpenCreate = () => {
        setIsNew(true);
        setEditingItem({
            standardQuestion: '',
            similarQueries: [],
            category: '生活设施',
            tags: ['生活'],
            answer: '',
            imageAttachments: []
        });
        setManualImageUrl('');
        setIsEditModalOpen(true);
    };

    const handleOpenEdit = (item: FaqTemplate) => {
        setIsNew(false);
        setEditingItem({
            ...item,
            imageAttachments: Array.isArray(item.imageAttachments) ? [...item.imageAttachments] : []
        });
        setManualImageUrl('');
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('确定要删除该 FAQ 标准模板吗？')) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/faq-templates/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.ok) {
                setTemplates(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete FAQ template:', err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem?.standardQuestion || !editingItem?.answer) {
            alert('请填写标准问题与标准答案！');
            return;
        }

        setSaving(true);
        try {
            const method = isNew ? 'POST' : 'PUT';
            const url = isNew
                ? `${API_BASE}/api/admin/faq-templates`
                : `${API_BASE}/api/admin/faq-templates/${editingItem.id}`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem)
            });
            const data = await res.json();
            if (data.ok) {
                setIsEditModalOpen(false);
                fetchTemplates();
            } else {
                alert(data.error || '保存失败');
            }
        } catch (err: any) {
            alert(`保存出错: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleAiExpandSimilar = async (targetQuestion?: string) => {
        const q = targetQuestion || editingItem?.standardQuestion;
        if (!q) {
            alert('请先输入标准问题！');
            return;
        }

        setAiExpanding(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/faq-templates/ai-expand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ standardQuestion: q })
            });
            const data = await res.json();
            if (data.ok && Array.isArray(data.queries)) {
                if (editingItem) {
                    const merged = Array.from(new Set([...(editingItem.similarQueries || []), ...data.queries]));
                    setEditingItem({ ...editingItem, similarQueries: merged });
                }
            }
        } catch (err) {
            console.error('AI expand error:', err);
        } finally {
            setAiExpanding(false);
        }
    };

    const handleRunTest = async () => {
        if (!testQuery.trim()) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/faq-templates/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: testQuery.trim() })
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err: any) {
            setTestResult({ ok: false, error: err.message });
        } finally {
            setTesting(false);
        }
    };

    const addSimilarQueryChip = () => {
        if (!newSimilarQuery.trim() || !editingItem) return;
        const current = editingItem.similarQueries || [];
        if (!current.includes(newSimilarQuery.trim())) {
            setEditingItem({
                ...editingItem,
                similarQueries: [...current, newSimilarQuery.trim()]
            });
        }
        setNewSimilarQuery('');
    };

    const removeSimilarQueryChip = (chip: string) => {
        if (!editingItem) return;
        setEditingItem({
            ...editingItem,
            similarQueries: (editingItem.similarQueries || []).filter(s => s !== chip)
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !editingItem) return;

        setUploadingImages(true);
        try {
            const uploaded: Array<{ name: string; url: string }> = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                const res = await fetch(`${API_BASE}/api/admin/upload-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Data, filename: file.name })
                });
                const data = await res.json();
                if (data.ok && data.attachment) {
                    uploaded.push({
                        name: data.attachment.name || file.name,
                        url: data.attachment.url
                    });
                }
            }

            if (uploaded.length > 0) {
                setEditingItem({
                    ...editingItem,
                    imageAttachments: [...(editingItem.imageAttachments || []), ...uploaded]
                });
            }
        } catch (err: any) {
            alert(`图片上传出错: ${err.message}`);
        } finally {
            setUploadingImages(false);
            e.target.value = '';
        }
    };

    const handleAddManualImage = () => {
        if (!manualImageUrl.trim() || !editingItem) return;
        const trimmed = manualImageUrl.trim();
        const newImg = {
            name: `外链图片_${(editingItem.imageAttachments?.length || 0) + 1}`,
            url: trimmed
        };
        setEditingItem({
            ...editingItem,
            imageAttachments: [...(editingItem.imageAttachments || []), newImg]
        });
        setManualImageUrl('');
    };

    const handleRemoveImage = (index: number) => {
        if (!editingItem) return;
        setEditingItem({
            ...editingItem,
            imageAttachments: (editingItem.imageAttachments || []).filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Banner */}
            <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-100 border border-white/30">
                            <Zap size={13} className="text-amber-200 fill-amber-200" />
                            极速轻量模式专用 · 50ms 黄金问答直出库
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            高频标准问答模板库 (FAQ QA Cache)
                        </h2>
                        <p className="text-amber-100 text-xs sm:text-sm leading-relaxed">
                            当考生在极速轻量模式下提问时，通过<b>「向量初筛 + 极速 LLM 语义核验」</b>两阶段判定。一旦命中直接直出 100% 官方标准答案，<b>0 幻觉、0 生成延迟、排版绝对精美</b>！
                        </p>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                        <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                            <div className="text-center">
                                <div className="text-2xl font-black">{templates.length}</div>
                                <div className="text-[11px] text-amber-200">标准模板数</div>
                            </div>
                            <div className="w-[1px] h-8 bg-white/20" />
                            <div className="text-center">
                                <div className="text-2xl font-black flex items-center justify-center gap-1">
                                    <Flame size={18} className="text-yellow-300" />
                                    {totalHits}
                                </div>
                                <div className="text-[11px] text-amber-200">总累计命中</div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-orange-600 hover:bg-amber-50 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>新建标准问答模板</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Match Tester Drawer / Card */}
            <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-amber-200/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                            <Sparkles size={16} />
                        </span>
                        <h3 className="font-bold text-[#4a4365] text-sm">
                            🧪 意图匹配与两阶段命中实时测试器 (Live QA Match Tester)
                        </h3>
                    </div>
                    <span className="text-[11px] text-gray-400">
                        测试任意考生提问是否能精确命中黄金模板
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
                            placeholder="输入考生的提问测试语句（例如：请问大学城校区宿舍是上床下桌吗？有独卫空调吗？）"
                            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRunTest}
                        disabled={testing}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                        {testing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                        <span>{testing ? '正在核验...' : '一键测试匹配'}</span>
                    </button>
                </div>

                {/* Test Result Display */}
                {testResult && (
                    <div className={`p-4 rounded-2xl border text-xs animate-in fade-in duration-200 ${
                        testResult.match?.matched
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}>
                        <div className="flex items-center justify-between font-bold mb-2">
                            <div className="flex items-center gap-1.5">
                                {testResult.match?.matched ? (
                                    <>
                                        <Check size={16} className="text-emerald-600" />
                                        <span className="text-emerald-700 font-bold">✅ 成功命中黄金问答直出！</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={16} className="text-amber-600" />
                                        <span className="text-amber-700 font-bold">未命中标准模板（将平滑降级为常规 RAG 生成）</span>
                                    </>
                                )}
                            </div>
                            <span className="text-[11px] text-gray-500 font-mono">
                                耗时: <b>{testResult.latencyMs}ms</b>
                            </span>
                        </div>

                        {testResult.match?.matched && testResult.match?.template ? (
                            <div className="space-y-1.5">
                                <div className="text-emerald-800">
                                    • 命中标准问题：<b>{testResult.match.template.standardQuestion}</b>
                                </div>
                                <div className="text-emerald-700 text-[11px]">
                                    • 向量初筛相似度：<b className="font-mono">{testResult.match.score?.toFixed(4)}</b> · 核验模式: <b className="font-mono">{testResult.match.verificationMode}</b>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-emerald-100 mt-2 text-slate-700 text-[11.5px] max-h-32 overflow-y-auto">
                                    <div className="text-[10px] text-gray-400 font-bold mb-1">直出标准答案预览：</div>
                                    <MarkdownViewer content={testResult.match.template.answer} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-600 text-[11px]">
                                • 最高候选问题：{testResult.match?.candidate || '无'} · 向量得分: {testResult.match?.topScore?.toFixed(4) || '0.000'} (阈值需 $\ge 0.82$ 且通过 LLM 意图一致性核验)
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索标准问题、答案或同义问..."
                            className="pl-9 pr-4 py-2 rounded-2xl bg-white border border-purple-100 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-xs transition-all w-60 sm:w-72"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                    selectedCategory === cat
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-white/80 hover:bg-white text-gray-600 border border-purple-50'
                                }`}
                            >
                                {cat === 'all' ? '全部类别' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="text-xs text-gray-500 shrink-0 font-medium">
                    共找到 <b>{filteredTemplates.length}</b> 条标准模板
                </div>
            </div>

            {/* Template Cards List */}
            {loading ? (
                <div className="p-12 text-center text-gray-400 space-y-2">
                    <RefreshCw size={24} className="animate-spin mx-auto text-amber-500" />
                    <p className="text-xs font-bold">正在加载 FAQ 标准模板库...</p>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white/60 rounded-3xl border border-dashed border-gray-200">
                    <HelpCircle size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-600">未找到匹配的标准问答模板</p>
                    <p className="text-xs text-gray-400 mt-1">您可以点击右上角“新建标准问答模板”创建新条目</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredTemplates.map(template => {
                        const isExpanded = Boolean(expandedCards[template.id]);
                        return (
                            <div
                                key={template.id}
                                className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-white hover:border-amber-200 shadow-sm hover:shadow-md transition-all space-y-3 group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-bold">
                                                {template.category || '生活设施'}
                                            </span>
                                            {(template.tags || []).map(tag => (
                                                <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                                                    #{tag}
                                                </span>
                                            ))}
                                            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold flex items-center gap-0.5">
                                                <Flame size={11} className="text-orange-500" />
                                                命中 {template.hitCount || 0} 次
                                            </span>
                                        </div>

                                        <h3 className="text-[15px] font-black text-[#4a4365] leading-snug">
                                            {template.standardQuestion}
                                        </h3>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(template)}
                                            className="p-2 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                                            title="编辑此模板"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(template.id)}
                                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                            title="删除此模板"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Similar Queries Chips */}
                                {template.similarQueries && template.similarQueries.length > 0 && (
                                    <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5">
                                        <div className="text-[11px] font-bold text-gray-500 flex items-center justify-between">
                                            <span>同义相似提问变体 ({template.similarQueries.length}条)：</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {template.similarQueries.map((sq, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 rounded-xl bg-white border border-gray-200/80 text-[11px] text-gray-700 shadow-2xs"
                                                >
                                                    {sq}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Images gallery preview */}
                                {Array.isArray(template.imageAttachments) && template.imageAttachments.length > 0 && (
                                    <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-bold flex items-center gap-1">
                                            <ImageIcon size={12} />
                                            <span>{template.imageAttachments.length} 张图片</span>
                                        </span>
                                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                                            {template.imageAttachments.map((img, idx) => (
                                                <a
                                                    key={idx}
                                                    href={img.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-12 h-12 rounded-xl overflow-hidden border border-amber-200 bg-white hover:border-amber-400 hover:scale-105 transition-all block shrink-0 shadow-2xs"
                                                    title={img.name || '点击查看完整大图'}
                                                >
                                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Markdown Answer Preview (Collapsible) */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(template.id)}
                                            className="text-[11.5px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            <span>{isExpanded ? '收起标准答案' : '查看完整标准答案'}</span>
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 text-slate-800 text-xs leading-relaxed animate-in fade-in duration-200">
                                            <MarkdownViewer content={template.answer} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isEditModalOpen && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
                            <div className="flex items-center gap-2">
                                <span className="p-2 rounded-2xl bg-amber-500 text-white shadow-xs">
                                    <Zap size={18} />
                                </span>
                                <div>
                                    <h3 className="font-black text-[#4a4365] text-lg">
                                        {isNew ? '新建高频标准问答模板' : '编辑高频标准问答模板'}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        准确录入标准问题、同义问法与权威解答
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/80 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Standard Question */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">标准问题 (必填)：</label>
                                <input
                                    type="text"
                                    required
                                    value={editingItem.standardQuestion || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, standardQuestion: e.target.value })}
                                    placeholder="例如：广州大学大学城校区宿舍条件怎么样？是几人间？"
                                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white"
                                />
                            </div>

                            {/* Category & Tags */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">分类类别：</label>
                                    <input
                                        type="text"
                                        value={editingItem.category || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                        placeholder="例如：生活设施、学费资助、招生政策"
                                        className="w-full px-4 py-2 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-gray-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">标签 (逗号分隔)：</label>
                                    <input
                                        type="text"
                                        value={(editingItem.tags || []).join(', ')}
                                        onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        placeholder="宿舍, 四人间, 空调"
                                        className="w-full px-4 py-2 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-gray-800"
                                    />
                                </div>
                            </div>

                            {/* Similar Queries Management with AI expand button */}
                            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-700">
                                        同义相似提问变体 ({editingItem.similarQueries?.length || 0})：
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleAiExpandSimilar()}
                                        disabled={aiExpanding || !editingItem.standardQuestion}
                                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <Sparkles size={12} className={aiExpanding ? 'animate-spin' : ''} />
                                        <span>{aiExpanding ? 'AI 正在分析扩写...' : '✨ AI 一键智能扩写 6 条相似问'}</span>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                                    {(editingItem.similarQueries || []).map((sq, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-[11px] text-gray-700 flex items-center gap-1.5 shadow-2xs"
                                        >
                                            <span>{sq}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeSimilarQueryChip(sq)}
                                                className="text-gray-400 hover:text-red-500 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="text"
                                        value={newSimilarQuery}
                                        onChange={(e) => setNewSimilarQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSimilarQueryChip();
                                            }
                                        }}
                                        placeholder="输入常见口语化同义问法，按 Enter 添加"
                                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSimilarQueryChip}
                                        className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-xs text-gray-700 cursor-pointer"
                                    >
                                        添加
                                    </button>
                                </div>
                            </div>

                            {/* Standard Answer (Markdown) */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">标准官方权威答案 (支持 Markdown、表格、Emoji)：</label>
                                <textarea
                                    required
                                    rows={8}
                                    value={editingItem.answer || ''}
                                    onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                                    placeholder="输入校方逐字核准的官方权威答案..."
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-gray-800 font-mono leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white"
                                />
                            </div>

                            {/* Live Answer Preview */}
                            {editingItem.answer && (
                                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1">
                                    <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                                        <Eye size={12} /> 实时 Markdown 排版效果预览：
                                    </div>
                                    <div className="text-xs text-slate-700">
                                        <MarkdownViewer content={editingItem.answer} />
                                    </div>
                                </div>
                            )}

                            {/* Image Attachments Section (支持多张图片添加) */}
                            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-amber-600" />
                                        <span>解答图片附件 (可添加多张图片)</span>
                                        <span className="text-[11px] font-normal text-gray-500">
                                            ({editingItem.imageAttachments?.length || 0} 张)
                                        </span>
                                    </label>

                                    {/* Upload Button for local files (multiple) */}
                                    <label className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer">
                                        <Upload size={13} className={uploadingImages ? 'animate-bounce' : ''} />
                                        <span>{uploadingImages ? '上传中...' : '上传本地图片 (支持多选)'}</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploadingImages}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* URL input for pasting external image link */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Link size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={manualImageUrl}
                                            onChange={(e) => setManualImageUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddManualImage();
                                                }
                                            }}
                                            placeholder="或输入图片外链 URL (如 https://... 或本地 /uploads/...)，按 Enter 添加"
                                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-amber-300"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddManualImage}
                                        disabled={!manualImageUrl.trim()}
                                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs cursor-pointer disabled:opacity-40 transition-colors shrink-0"
                                    >
                                        添加外链
                                    </button>
                                </div>

                                {/* Image Previews Gallery */}
                                {Array.isArray(editingItem.imageAttachments) && editingItem.imageAttachments.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                                        {editingItem.imageAttachments.map((img, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-amber-200 bg-white shadow-xs aspect-video flex items-center justify-center">
                                                <img
                                                    src={img.url}
                                                    alt={img.name || `附件_${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Image+Load+Error';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                                                    <a
                                                        href={img.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 text-white text-[11px] font-bold"
                                                        title="查看大图"
                                                    >
                                                        <Eye size={13} />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white cursor-pointer"
                                                        title="移除此图片"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                                <span className="absolute bottom-1 left-1 right-1 text-[9.5px] px-1 py-0.5 rounded bg-black/60 text-white truncate text-center pointer-events-none">
                                                    {img.name || `图片 ${idx + 1}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-gray-400 bg-white/60 p-2.5 rounded-xl text-center border border-dashed border-amber-200">
                                        暂无图片附件。支持上传或粘贴多张图片（如宿舍环境图、录取分数线表格、校历表样图等）。
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? '保存中...' : '保存标准模板'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
