import React, { useState, useEffect, useRef } from 'react';
import {
    Compass, Search, X, Map, Layers, MapPin,
    Info, Image as ImageIcon, Tag, Eye, MessageSquare,
    Check, Sparkles, Clock, ChevronRight, Volume2,
    VolumeX, Play, Pause, Square, RotateCcw, ZoomIn,
    ZoomOut, Navigation, Lightbulb, Heart, User,
    ExternalLink
} from 'lucide-react';
import { CampusLocation, CampusTourRoute } from '../../types';
import { FilterTabs } from '../../components/ui/FilterTabs';
import { CAMPUS_TOUR_ROUTES, LILI_GUIDE_AGENT } from '../../constants/campusLocations';
import { ttsService, TTSState } from '../../services/ttsService';

interface CampusMapModalProps {
    locations: CampusLocation[];
    isOpen: boolean;
    onClose: () => void;
    pinScale?: number;
    liliAvatar?: string;
    liliName?: string;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({
    locations,
    isOpen,
    onClose,
    pinScale = 0.8,
    liliAvatar,
    liliName
}) => {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLoc, setSelectedLoc] = useState<CampusLocation | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    // Selected Tour Route
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

    // TTS Voice State
    const [ttsState, setTtsState] = useState<TTSState>(ttsService.getState());

    // Map Canvas Pan & Zoom States
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Subscribe to TTS state
    useEffect(() => {
        const unsubscribe = ttsService.subscribe(setTtsState);
        return () => {
            unsubscribe();
            ttsService.stop();
        };
    }, []);

    // Stop TTS when closing
    useEffect(() => {
        if (!isOpen) {
            ttsService.stop();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const categories = ['全部', '教学科研', '生活住宿', '餐饮美食', '体育休闲', '校园地标'];

    const activeRoute = CAMPUS_TOUR_ROUTES.find(r => r.id === activeRouteId);

    const filteredLocations = locations.filter(loc => {
        // If a preset route is chosen, ONLY include locations in this route
        if (activeRoute) {
            if (!activeRoute.locationIds.includes(loc.id)) {
                return false;
            }
        } else {
            // In free roaming mode, respect activeCategory
            if (activeCategory !== '全部' && loc.category !== activeCategory) {
                return false;
            }
        }

        const q = (searchQuery || '').trim().toLowerCase();
        if (!q) return true;
        const matchName = (loc?.name || '').toLowerCase().includes(q);
        const matchDesc = (loc?.description || '').toLowerCase().includes(q);
        const matchTerms = (loc?.terms || []).some(t => String(t || '').toLowerCase().includes(q));
        const matchHighlights = (loc?.highlights || []).some(h => String(h || '').toLowerCase().includes(q));
        return matchName || matchDesc || matchTerms || matchHighlights;
    }).sort((a, b) => {
        if (activeRoute) {
            return activeRoute.locationIds.indexOf(a.id) - activeRoute.locationIds.indexOf(b.id);
        }
        return 0;
    });

    // Handle Pan & Drag
    const handleMouseDown = (e: React.MouseEvent) => {
        if (viewMode !== 'map') return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Zoom Controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.8));
    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Focus on specific location
    const handleSelectLocation = (loc: CampusLocation) => {
        setSelectedLoc(loc);
        setActiveImgIndex(0);
        // Auto play Lili's narrative voice
        if (loc.liliNarrative) {
            ttsService.speak(loc.liliNarrative);
        }
    };

    const toggleSpeech = () => {
        if (ttsState.isPlaying) {
            if (ttsState.isPaused) {
                ttsService.resume();
            } else {
                ttsService.pause();
            }
        } else if (selectedLoc?.liliNarrative) {
            ttsService.speak(selectedLoc.liliNarrative);
        } else {
            ttsService.speak(LILI_GUIDE_AGENT.welcomeSpeech);
        }
    };

    const stopSpeech = () => {
        ttsService.stop();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex justify-center items-center p-0 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-none sm:rounded-[36px] w-full max-w-6xl h-[100dvh] sm:h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(74,67,101,0.35)] border-0 sm:border border-white/80 overflow-hidden relative">

                {/* 1. Top Header Bar */}
                <div className="px-3.5 sm:px-7 py-2.5 sm:py-3.5 border-b border-purple-100/60 flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/60 shrink-0">
                    
                    {/* Lili Agent Header Card + Close on mobile */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#f296b2] p-0.5 shadow-md flex items-center justify-center">
                                    <img
                                        src={LILI_GUIDE_AGENT.avatar}
                                        alt={LILI_GUIDE_AGENT.name}
                                        className="w-full h-full object-cover rounded-[14px]"
                                    />
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <h3 className="text-[14.5px] sm:text-[16px] font-black text-[#4a4365] tracking-tight truncate">{LILI_GUIDE_AGENT.name} 伴游导览</h3>
                                    <span className="bg-gradient-to-r from-[#a494e8]/20 to-purple-100 text-[#6c5aa8] text-[9.5px] sm:text-[10.5px] font-black px-2 py-0.5 rounded-full border border-purple-200/50 flex items-center gap-1 shrink-0">
                                        <Sparkles size={11} className="text-purple-600" />
                                        大学城校区
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-[11.5px] text-[#7a7398] font-medium mt-0.5 line-clamp-1">
                                    {LILI_GUIDE_AGENT.role} · 陪伴你沉浸式漫游广大
                                </p>
                            </div>
                        </div>

                        {/* Close button on mobile top right */}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100 md:hidden shrink-0"
                            title="收起导览"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Header Action Controls */}
                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1 md:w-56">
                            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索地标、自习室、饭堂..."
                                className="w-full bg-white/90 border border-purple-100/80 rounded-2xl pl-9 pr-8 py-1.5 sm:py-2 text-[12px] text-[#4a4365] focus:ring-2 focus:ring-[#a494e8] outline-none shadow-2xs"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* View Mode (Map / Grid) */}
                        <div className="bg-purple-100/40 p-1 rounded-2xl flex items-center gap-1 border border-purple-200/40 shrink-0">
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11.5px] sm:text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    viewMode === 'map' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4] hover:text-[#4a4365]'
                                }`}
                            >
                                <Map size={13} />
                                <span>2.5D实景</span>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11.5px] sm:text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    viewMode === 'grid' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4] hover:text-[#4a4365]'
                                }`}
                            >
                                <Layers size={13} />
                                <span>地标卡片</span>
                            </button>
                        </div>

                        {/* Close Modal (Desktop) */}
                        <button
                            onClick={onClose}
                            className="hidden md:block p-2 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100 ml-1"
                            title="收起导览"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* 2. Thematic Tour Routes Bar */}
                <div className="px-5 sm:px-7 py-2.5 bg-gradient-to-r from-purple-50/40 via-white to-amber-50/30 border-b border-purple-100/40 flex items-center justify-between gap-3 overflow-x-auto hide-scrollbar shrink-0 text-[12px]">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-bold text-[#4a4365] flex items-center gap-1 shrink-0">
                            <Navigation size={13} className="text-[#a494e8]" />
                            漫游路线：
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveRouteId(null)}
                                className={`px-3 py-1 rounded-xl font-bold text-[11.5px] transition-all cursor-pointer border ${
                                    activeRouteId === null
                                        ? 'bg-[#4a4365] text-white border-[#4a4365] shadow-xs'
                                        : 'bg-white/80 hover:bg-white text-gray-600 border-purple-100/60'
                                }`}
                            >
                                自由漫游
                            </button>

                            {CAMPUS_TOUR_ROUTES.map((route) => {
                                const isCurrent = activeRouteId === route.id;
                                return (
                                    <button
                                        key={route.id}
                                        onClick={() => {
                                            setActiveRouteId(isCurrent ? null : route.id);
                                            if (!isCurrent && route.locationIds.length > 0) {
                                                const firstLoc = locations.find(l => l.id === route.locationIds[0]);
                                                if (firstLoc) handleSelectLocation(firstLoc);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-xl font-bold text-[11.5px] transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                                            isCurrent
                                                ? 'bg-gradient-to-r from-[#b3a4ed] to-[#a494e8] text-white border-transparent shadow-xs'
                                                : 'bg-white/80 hover:bg-purple-50/80 text-[#5c547d] border-purple-100/60'
                                        }`}
                                    >
                                        <span>{route.title}</span>
                                        <span className="text-[10px] opacity-80">({route.duration})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1 shrink-0">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                    activeCategory === cat
                                        ? 'bg-purple-100 text-purple-800 font-black'
                                        : 'text-gray-500 hover:text-[#4a4365] hover:bg-gray-100/60'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Main Workspace Canvas Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-[#f8f6fc]">
                    
                    {/* View A: 2.5D Real-Image Interactive Map */}
                    {viewMode === 'map' ? (
                        <div
                            ref={mapContainerRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className={`flex-1 h-full relative overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} bg-[#ebe6f7] flex items-center justify-center`}
                        >
                            {/* Floating Map Zoom Controls */}
                            <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-[0_8px_20px_rgba(74,67,101,0.15)] border border-white flex flex-col gap-1">
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 rounded-xl text-[#4a4365] hover:bg-purple-100/70 transition-colors cursor-pointer"
                                    title="放大地图"
                                >
                                    <ZoomIn size={16} />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 rounded-xl text-[#4a4365] hover:bg-purple-100/70 transition-colors cursor-pointer"
                                    title="缩小地图"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <button
                                    onClick={handleResetView}
                                    className="p-2 rounded-xl text-[#4a4365] hover:bg-purple-100/70 transition-colors cursor-pointer border-t border-purple-100/60"
                                    title="重置居中"
                                >
                                    <RotateCcw size={15} />
                                </button>
                            </div>

                            {/* Floating Active Route Banner */}
                            {activeRoute && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-[0_8px_25px_rgba(74,67,101,0.2)] border border-purple-200/90 flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
                                    <span className="text-[12px] font-black text-[#4a4365] flex items-center gap-1.5">
                                        <Navigation size={13} className="text-purple-600 animate-pulse" />
                                        <span>当前漫游：{activeRoute.title}</span>
                                    </span>
                                    <span className="text-[11px] text-purple-700 font-bold bg-purple-100/80 px-2 py-0.5 rounded-lg">
                                        全线共 {filteredLocations.length} 站 · 预计耗时 {activeRoute.duration}
                                    </span>
                                    <button
                                        onClick={() => setActiveRouteId(null)}
                                        className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer ml-1"
                                    >
                                        退出路线
                                    </button>
                                </div>
                            )}

                            {/* Map Canvas with Pan & Zoom Transform */}
                            <div
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                                    aspectRatio: '1506 / 1280'
                                }}
                                className="relative w-auto h-auto max-w-[1200px] max-h-[92%] rounded-3xl overflow-hidden shadow-2xl border-4 border-white shrink-0 bg-[#352f4a]"
                            >
                                {/* High-Res Campus Base Image */}
                                <img
                                    src="/campus.jpg"
                                    alt="广州大学校园全景图"
                                    className="w-full h-full object-fill pointer-events-none select-none block"
                                    onError={(e) => {
                                        // Fallback if campus.jpg is loading from root
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop';
                                    }}
                                />

                                {/* Dark overlay for enhanced pin contrast */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20 pointer-events-none" />

                                {/* SVG Thematic Tour Route Connecting Line */}
                                {activeRoute && (
                                    <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#f59e0b" />
                                                <stop offset="50%" stopColor="#ec4899" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                        {/* Polyline Path */}
                                        <polyline
                                            points={activeRoute.locationIds
                                                .map(id => locations.find(l => l.id === id))
                                                .filter(Boolean)
                                                .map(l => `${l!.coordinates.x},${l!.coordinates.y}`)
                                                .join(' ')}
                                            fill="none"
                                            stroke="url(#routeGradient)"
                                            strokeWidth="1.2"
                                            strokeDasharray="2 1.5"
                                            className="animate-pulse"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}

                                {/* Landmark Marker Pins */}
                                {filteredLocations.map((loc) => {
                                    const isSelected = selectedLoc?.id === loc.id;
                                    const routeOrder = activeRoute?.locationIds.indexOf(loc.id);
                                    const isInRoute = routeOrder !== undefined && routeOrder !== -1;

                                    return (
                                        <div
                                            key={loc.id}
                                            style={{
                                                left: `${loc.coordinates.x}%`,
                                                top: `${loc.coordinates.y}%`,
                                                transform: `translate(-50%, -50%) scale(${pinScale})`
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectLocation(loc);
                                            }}
                                            className="absolute group cursor-pointer z-20 transition-transform origin-center"
                                        >
                                            {/* Pulsing Beacon Ring */}
                                            <span className={`absolute -inset-2.5 rounded-full animate-ping ${
                                                isInRoute ? 'bg-amber-400/50' : 'bg-purple-400/40'
                                            }`} />

                                            {/* Pin Badge */}
                                            <div className={`relative flex items-center gap-1 px-2.5 py-1 rounded-xl shadow-xl border transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-amber-300 scale-110 z-30 shadow-purple-500/40 ring-4 ring-purple-300/40'
                                                    : isInRoute
                                                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-white scale-105'
                                                    : 'bg-white/95 text-[#4a4365] hover:bg-[#a494e8] hover:text-white border-white/90 hover:scale-105'
                                            }`}>
                                                {isInRoute ? (
                                                    <span className="w-4 h-4 rounded-full bg-white text-amber-600 font-black text-[9.5px] flex items-center justify-center shrink-0">
                                                        {routeOrder! + 1}
                                                    </span>
                                                ) : (
                                                    <MapPin size={12} className={isSelected ? 'text-amber-300' : 'text-[#a494e8] group-hover:text-white shrink-0'} />
                                                )}
                                                <span className="text-[10.5px] font-black whitespace-nowrap drop-shadow-xs">
                                                    {loc.name.split(' ')[0]}
                                                </span>
                                            </div>

                                            {/* Hover Tooltip Card */}
                                            <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 absolute bottom-full left-1/2 -translate-y-2 -translate-x-1/2 mb-1 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-purple-100 z-40 text-left">
                                                <img
                                                    src={loc.images[0]}
                                                    alt={loc.name}
                                                    className="w-full h-24 object-cover rounded-xl mb-2"
                                                />
                                                <div className="font-black text-[12.5px] text-[#4a4365] truncate">{loc.name}</div>
                                                <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{loc.description}</div>
                                                <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-50 text-[10px] text-purple-700 font-bold">
                                                    <span>点击查看实景与听解说</span>
                                                    <ChevronRight size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Canvas Bottom Guide Info */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                                <div className="bg-black/55 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-2xl border border-white/20 flex items-center gap-1.5 shadow-md">
                                    <Info size={13} className="text-amber-300" />
                                    <span>按住鼠标可拖拽全景，滚轮或左上角按钮可缩放地标</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* View B: Card Grid Mode */
                        <div className="flex-1 h-full overflow-y-auto p-5 sm:p-6 hide-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredLocations.map((loc, idx) => {
                                    const routeOrder = activeRoute?.locationIds.indexOf(loc.id);
                                    const isInRoute = routeOrder !== undefined && routeOrder !== -1;

                                    return (
                                        <div
                                            key={loc.id}
                                            onClick={() => handleSelectLocation(loc)}
                                            className="group bg-white rounded-3xl border border-purple-100/70 shadow-[0_4px_20px_rgba(186,175,215,0.12)] hover:shadow-[0_12px_35px_rgba(186,175,215,0.25)] transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 cursor-pointer"
                                        >
                                            <div className="relative h-44 overflow-hidden bg-gray-100">
                                                <img
                                                    src={loc.images[0]}
                                                    alt={loc.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                                    {isInRoute && (
                                                        <span className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-sm">
                                                            第 {routeOrder! + 1} 站
                                                        </span>
                                                    )}
                                                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl">
                                                        {loc.category}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectLocation(loc);
                                                    }}
                                                    className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-md flex items-center gap-1 hover:opacity-90 cursor-pointer"
                                                >
                                                    <Volume2 size={12} /> 听丽丽解说
                                                </button>
                                            </div>

                                            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                                <div>
                                                    <h4 className="font-bold text-[15px] text-[#4a4365] group-hover:text-[#a494e8] transition-colors line-clamp-1">
                                                        {loc.name}
                                                    </h4>
                                                    <p className="text-[12px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                        {loc.description}
                                                    </p>
                                                </div>

                                                <div className="pt-2 border-t border-purple-50 flex items-center justify-between text-[11px]">
                                                    <span className="text-[#a494e8] font-bold">查看详细参数 ➔</span>
                                                    <span className="text-gray-400 font-medium">{loc.images.length} 张实景图</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. Right Companion & POI Detail Drawer */}
                    {selectedLoc && (
                        <div className="w-full md:w-96 bg-white/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-purple-100/80 shadow-2xl flex flex-col h-[52dvh] md:h-full overflow-hidden shrink-0 z-30 animate-in slide-in-from-bottom-5 md:slide-in-from-right-10 duration-300">
                            
                            {/* Drawer Header with Lili Avatar & Voice Action */}
                            <div className="p-4 sm:p-5 border-b border-purple-100/60 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 flex items-start justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={liliAvatar || LILI_GUIDE_AGENT.avatar}
                                        alt={liliName || LILI_GUIDE_AGENT.name}
                                        className="w-11 h-11 rounded-2xl object-cover shadow-sm border border-white"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = LILI_GUIDE_AGENT.avatar;
                                        }}
                                    />
                                    <div>
                                        <div className="font-black text-[#4a4365] text-[14px]">{liliName || '丽丽学姐'} · 伴游解说</div>
                                        <div className="text-[10.5px] text-[#8a84a4]">已定位：{selectedLoc.name.split(' ')[0]}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedLoc(null)}
                                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Drawer Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 hide-scrollbar">
                                
                                {/* Lili's Cheerful Voice Narrative Card */}
                                <div className="bg-gradient-to-br from-[#f8f5ff] to-[#f2ecff] rounded-3xl p-4 border border-purple-200/70 shadow-xs space-y-3 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-purple-800 font-black text-[12.5px]">
                                            <Sparkles size={14} className="text-amber-500 animate-spin-slow" />
                                            <span>{liliName || '丽丽学姐'}专属伴游解说</span>
                                        </div>

                                        {/* TTS Audio Controls */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={toggleSpeech}
                                                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                                    ttsState.isPlaying && !ttsState.isPaused
                                                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                                                        : 'bg-white text-purple-700 hover:bg-purple-50'
                                                }`}
                                            >
                                                {ttsState.isPlaying && !ttsState.isPaused ? (
                                                    <>
                                                        <Pause size={12} />
                                                        <span>暂停解说</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play size={12} />
                                                        <span>语音朗读</span>
                                                    </>
                                                )}
                                            </button>
                                            {ttsState.isPlaying && (
                                                <button
                                                    onClick={stopSpeech}
                                                    className="p-1.5 rounded-xl bg-white text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                                    title="停止播放"
                                                >
                                                    <Square size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Animated Waveform Indicator */}
                                    {ttsState.isPlaying && !ttsState.isPaused && (
                                        <div className="flex items-center gap-1 py-1">
                                            <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce" />
                                            <span className="w-1 h-5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                                            <span className="w-1 h-4 bg-pink-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                                            <span className="w-1 h-6 bg-purple-600 rounded-full animate-bounce [animation-delay:0.45s]" />
                                            <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="text-[10px] text-purple-700 font-bold ml-1.5">丽丽正在语音解说中...</span>
                                        </div>
                                    )}

                                    {/* Speech Text Bubble */}
                                    <p className="text-[12.5px] text-[#4a4365] leading-relaxed font-medium">
                                        “{selectedLoc.liliNarrative || selectedLoc.description}”
                                    </p>
                                </div>

                                {/* Real Photos Carousel Gallery */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[12px] font-bold text-[#4a4365]">
                                        <span className="flex items-center gap-1.5">
                                            <ImageIcon size={13} className="text-[#a494e8]" />
                                            实景高清画廊
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {activeImgIndex + 1} / {selectedLoc.images.length}
                                        </span>
                                    </div>

                                    <div className="relative h-44 rounded-2xl overflow-hidden bg-gray-100 border border-purple-100 shadow-xs">
                                        <img
                                            src={selectedLoc.images[activeImgIndex]}
                                            alt={selectedLoc.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {selectedLoc.images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                                            {selectedLoc.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImgIndex(idx)}
                                                    className={`w-14 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                                        activeImgIndex === idx ? 'border-[#a494e8] scale-105 shadow-xs' : 'border-transparent opacity-60'
                                                    }`}
                                                >
                                                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Lili's Insider Tips & Highlights */}
                                {selectedLoc.liliTips && selectedLoc.liliTips.length > 0 && (
                                    <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200/60 space-y-2">
                                        <div className="text-[12px] font-bold text-amber-900 flex items-center gap-1.5">
                                            <Lightbulb size={13} className="text-amber-500" />
                                            学姐实测打卡避坑秘籍
                                        </div>
                                        <ul className="space-y-1.5 text-[11.5px] text-amber-800/90 font-medium">
                                            {selectedLoc.liliTips.map((tip, i) => (
                                                <li key={i} className="flex items-start gap-1.5">
                                                    <span className="text-amber-500 font-bold">•</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Location Details & Opening Hours */}
                                <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 space-y-2 text-[11.5px]">
                                    {selectedLoc.openingHours && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock size={12} className="text-gray-400 shrink-0" />
                                            <span>{selectedLoc.openingHours}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {(selectedLoc.terms || []).map((term) => (
                                            <span
                                                key={term}
                                                className="bg-white text-[#6c5aa8] border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                            >
                                                #{term}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
