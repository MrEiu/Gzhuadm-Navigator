import React, { useState } from 'react';
import {
    Compass, Search, X, Map, Layers, MapPin,
    Info, Image as ImageIcon, Tag, Eye, MessageSquare,
    Check, Sparkles, Clock, ChevronRight
} from 'lucide-react';
import { CampusLocation } from '../../types';
import { FilterTabs } from '../../components/ui/FilterTabs';

interface CampusMapModalProps {
    locations: CampusLocation[];
    isOpen: boolean;
    onClose: () => void;
    onAskQuestion: (text: string) => void;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
    locations,
    isOpen,
    onClose,
    onAskQuestion
}) => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLoc, setSelectedLoc] = useState<CampusLocation | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    if (!isOpen) return null;

    const categories = ['全部', '教学科研', '生活住宿', '餐饮美食', '体育休闲', '校园地标'];

    const filteredLocations = locations.filter(loc => {
        const matchCat = activeCategory === '全部' || loc.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return matchCat;
        const matchName = loc.name.toLowerCase().includes(q);
        const matchDesc = loc.description.toLowerCase().includes(q);
        const matchTerms = (loc.terms || []).some(t => t.toLowerCase().includes(q));
        const matchHighlights = (loc.highlights || []).some(h => h.toLowerCase().includes(q));
        return matchCat && (matchName || matchDesc || matchTerms || matchHighlights);
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl border border-white/80 overflow-hidden relative">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-purple-50/60 via-white to-indigo-50/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#a494e8] to-[#c7b8f9] text-white flex items-center justify-center shadow-md shrink-0">
                            <Compass size={22} className="animate-spin-slow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-[17px] font-black text-[#4a4365]">Gzadm Navigator 校园地图导览</h3>
                                <span className="bg-[#a494e8]/15 text-[#6c5aa8] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#a494e8]/30">
                                    {locations.length} 个校园地标
                                </span>
                            </div>
                            <p className="text-[12px] text-[#7a7398]">查看地标高精实景图、详细功能说明与关联智能词条</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1 md:w-64">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索地标、描述或词条(如自习室)..."
                                className="w-full bg-white/80 border border-gray-200/80 rounded-2xl pl-9 pr-8 py-2 text-[12px] focus:ring-2 focus:ring-[#a494e8] outline-none shadow-inner"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* View Mode Selector */}
                        <div className="bg-gray-100/80 p-1 rounded-2xl flex items-center gap-1 border border-gray-200/50 shrink-0">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'map' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Map size={14} />
                                <span>地图</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Layers size={14} />
                                <span>卡片</span>
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="关闭导览"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Categories Bar */}
                <FilterTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    label="分类筛选："
                />

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar relative bg-[#fdfcff]">
                    {viewMode === 'map' ? (
                        /* Map View */
                        <div className="w-full h-full min-h-[480px] bg-gradient-to-br from-[#f0ebfb] via-[#f7f4fd] to-[#eaf2fb] rounded-3xl border-2 border-white shadow-inner relative overflow-hidden flex flex-col justify-between p-4 group">
                            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#a494e8_1px,transparent_1px)] [background-size:24px_24px]" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-white text-[12px] font-bold text-[#4a4365] flex items-center gap-2 z-10">
                                <Compass size={16} className="text-[#a494e8]" />
                                <span>Gzadm Navigator 3D Campus Virtual Map</span>
                            </div>

                            {/* Map Pins */}
                            <div className="relative h-full w-full min-h-[400px]">
                                {filteredLocations.map((loc) => {
                                    const isSelected = selectedLoc?.id === loc.id;
                                    return (
                                        <div
                                            key={loc.id}
                                            style={{ top: `${loc.coordinates.y}%`, left: `${loc.coordinates.x}%` }}
                                            className="absolute -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20"
                                            onClick={() => {
                                                setSelectedLoc(loc);
                                                setActiveImgIndex(0);
                                            }}
                                        >
                                            <span className="absolute -inset-2 rounded-full bg-[#a494e8]/30 animate-ping" />

                                            <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-lg border transition-all duration-300 ${isSelected
                                                    ? 'bg-[#4a4365] text-white border-purple-300 scale-110 z-30'
                                                    : 'bg-white/95 text-[#4a4365] hover:bg-[#a494e8] hover:text-white border-white scale-100 hover:scale-105'
                                                }`}>
                                                <MapPin size={15} className={isSelected ? 'text-amber-300' : 'text-[#a494e8] group-hover/pin:text-white'} />
                                                <span className="text-[12px] font-bold whitespace-nowrap">{loc.name.split(' ')[0]}</span>
                                            </div>

                                            {/* Tooltip Hover Preview */}
                                            <div className="opacity-0 group-hover/pin:opacity-100 pointer-events-none transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-xl border border-gray-100 z-40 text-left">
                                                <img src={loc.images[0]} alt={loc.name} className="w-full h-24 object-cover rounded-xl mb-2" />
                                                <div className="font-bold text-[12px] text-[#4a4365] truncate">{loc.name}</div>
                                                <div className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{loc.description}</div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {(loc.terms || []).slice(0, 3).map(t => (
                                                        <span key={t} className="bg-purple-50 text-[#6c5aa8] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Map Footer Prompt */}
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-white text-[11px] text-gray-500 flex items-center gap-2 z-10">
                                <Info size={14} className="text-[#a494e8]" />
                                <span>点击地图上的标点可查看该地标的高清图片、描述与词条</span>
                            </div>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredLocations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="group bg-white rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgba(186,175,215,0.12)] hover:shadow-[0_12px_35px_rgba(186,175,215,0.25)] transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
                                >
                                    <div className="relative h-44 overflow-hidden bg-gray-100">
                                        <img
                                            src={loc.images[0]}
                                            alt={loc.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl">
                                            {loc.category}
                                        </div>
                                        {loc.images.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-md text-[#4a4365] text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                <ImageIcon size={11} />
                                                <span>{loc.images.length} 张图片</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                        <div>
                                            <h4 className="font-bold text-[15px] text-[#4a4365] group-hover:text-[#a494e8] transition-colors line-clamp-1">
                                                {loc.name}
                                            </h4>
                                            <p className="text-[12px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                {loc.description}
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {(loc.terms || []).slice(0, 4).map((term) => (
                                                    <button
                                                        key={term}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAskQuestion(`请告诉我关于【${loc.name}】关联词条【${term}】的详细信息`);
                                                        }}
                                                        className="bg-[#f4effc] hover:bg-[#e6dcfa] text-[#6c5aa8] text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                        title={`点击向AI提问“${term}”`}
                                                    >
                                                        <Tag size={9} />
                                                        <span>{term}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedLoc(loc);
                                                    setActiveImgIndex(0);
                                                }}
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-[#4a4365] text-[12px] font-bold py-2 rounded-2xl border border-gray-200/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <Eye size={14} />
                                                <span>查看详情</span>
                                            </button>

                                            <button
                                                onClick={() => onAskQuestion(`请向我详细介绍一下【${loc.name}】的功能、环境与相关政策`)}
                                                className="bg-[#4a4365] hover:bg-[#38324f] text-white text-[12px] font-bold px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                                                title="向AI招生顾问提问该地点"
                                            >
                                                <MessageSquare size={13} />
                                                <span>提问</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredLocations.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                            <Compass size={40} className="text-gray-300" />
                            <div className="text-[14px] font-bold text-gray-500">未找到符合条件的地标或词条</div>
                            <div className="text-[12px]">尝试更改关键词或选择其他分类标签</div>
                        </div>
                    )}
                </div>

                {/* Detail Popup Drawer */}
                {selectedLoc && (
                    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
                        <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative overflow-hidden">

                            <div className="relative h-64 bg-gray-900 shrink-0">
                                <img
                                    src={selectedLoc.images[activeImgIndex] || selectedLoc.images[0]}
                                    alt={selectedLoc.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                                <button
                                    onClick={() => setSelectedLoc(null)}
                                    className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>

                                <div className="absolute bottom-4 left-6 right-6 text-white">
                                    <span className="bg-[#a494e8] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                                        {selectedLoc.category}
                                    </span>
                                    <h3 className="text-[20px] font-black mt-1 leading-tight">{selectedLoc.name}</h3>
                                </div>
                            </div>

                            {selectedLoc.images.length > 1 && (
                                <div className="px-6 py-2 bg-gray-900 flex gap-2 overflow-x-auto">
                                    {selectedLoc.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt="thumbnail"
                                            onClick={() => setActiveImgIndex(idx)}
                                            className={`w-16 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${activeImgIndex === idx ? 'border-[#a494e8] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6 space-y-5 hide-scrollbar">
                                <div>
                                    <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Info size={14} className="text-[#a494e8]" /> 设施与功能描述
                                    </h4>
                                    <p className="text-[14px] text-[#4a4365] leading-relaxed bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                                        {selectedLoc.description}
                                    </p>
                                </div>

                                {selectedLoc.openingHours && (
                                    <div>
                                        <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <Clock size={14} className="text-[#a494e8]" /> 开放与服务时间
                                        </h4>
                                        <div className="text-[13px] font-bold text-[#4a4365] bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            {selectedLoc.openingHours}
                                        </div>
                                    </div>
                                )}

                                {selectedLoc.highlights && (
                                    <div>
                                        <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-[#a494e8]" /> 地标亮点
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedLoc.highlights.map((hl, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                                                    <Check size={14} className="text-emerald-500 shrink-0" />
                                                    <span>{hl}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Tag size={14} className="text-[#a494e8]" /> 关联词条与热门关键词 (点击可向AI咨询)
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedLoc.terms || []).map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => {
                                                    setSelectedLoc(null);
                                                    onAskQuestion(`请问关于【${selectedLoc.name}】的【${term}】有何具体规则或政策？`);
                                                }}
                                                className="bg-[#f3eefc] hover:bg-[#a494e8] hover:text-white text-[#6c5aa8] text-[12px] font-bold px-3 py-1.5 rounded-xl border border-[#e4dcf8] flex items-center gap-1.5 transition-all group cursor-pointer"
                                            >
                                                <Tag size={12} className="group-hover:rotate-12 transition-transform" />
                                                <span>#{term}</span>
                                                <ChevronRight size={12} className="opacity-50 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => setSelectedLoc(null)}
                                    className="px-5 py-3 rounded-2xl text-[13px] font-bold text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
                                >
                                    返回导览列表
                                </button>
                                <button
                                    onClick={() => {
                                        const locName = selectedLoc.name;
                                        setSelectedLoc(null);
                                        onAskQuestion(`请向我详细介绍一下【${locName}】的整体情况、环境与注意事项。`);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-[#4a4365] to-[#685d8a] hover:from-[#3a3452] hover:to-[#554a75] text-white text-[13px] font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                                >
                                    <MessageSquare size={16} />
                                    <span>一键向 Dr. Elena 咨询该地点</span>
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
