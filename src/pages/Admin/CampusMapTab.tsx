import React, { useState, useEffect, useRef } from 'react';
import {
    Compass, MapPin, Navigation, Plus, Trash2, Edit3,
    Save, RefreshCw, RotateCcw, ZoomIn, ZoomOut, Search,
    Image as ImageIcon, Sparkles, Lightbulb, Clock, Check,
    Move, Eye, Layers, ChevronUp, ChevronDown, ArrowRight,
    Tag, AlertCircle, Info, ExternalLink, X, Sliders,
    Maximize2, Minimize2, CheckCircle2
} from 'lucide-react';
import { CampusLocation, CampusTourRoute } from '../../types';
import { DEFAULT_CAMPUS_LOCATIONS, CAMPUS_TOUR_ROUTES } from '../../constants/campusLocations';
import { API_BASE } from '../../api/config';

export const CampusMapTab: React.FC = () => {
    // 1. Data States
    const [locations, setLocations] = useState<CampusLocation[]>(DEFAULT_CAMPUS_LOCATIONS);
    const [routes, setRoutes] = useState<CampusTourRoute[]>(CAMPUS_TOUR_ROUTES);
    const [pinScale, setPinScale] = useState<number>(0.8); // 0.5x ~ 1.5x

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 2. View Sub-Tabs: 'calibrate' (Large Canvas) | 'properties' (Form) | 'routes' (Route Studio)
    const [viewMode, setViewMode] = useState<'calibrate' | 'properties' | 'routes'>('calibrate');
    const [selectedLocId, setSelectedLocId] = useState<string | null>('loc-library');
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>('route-freshman');

    // 3. Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('全部');

    // 4. Map Viewport Pan & Zoom
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // 5. Pin Dragging State
    const [draggingLocId, setDraggingLocId] = useState<string | null>(null);
    const mapImageRef = useRef<HTMLDivElement>(null);

    // Fetch initial persisted campus map data from root campus_navigation.map
    const fetchCampusMapData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/campus-map`);
            const data = await res.json();
            if (data.ok && data.data) {
                if (Array.isArray(data.data.locations) && data.data.locations.length > 0) {
                    setLocations(data.data.locations);
                }
                if (Array.isArray(data.data.routes) && data.data.routes.length > 0) {
                    setRoutes(data.data.routes);
                }
                if (typeof data.data.pinScale === 'number') {
                    setPinScale(data.data.pinScale);
                }
            }
        } catch (err) {
            console.warn('Failed to load campus map data from server, using local defaults:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampusMapData();
    }, []);

    // Save campus map data to root campus_navigation.map
    const handleSaveToServer = async () => {
        setSaving(true);
        setFeedbackMsg(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/campus-map`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locations,
                    routes,
                    pinScale
                })
            });
            const data = await res.json();
            if (data.ok) {
                setFeedbackMsg({
                    type: 'success',
                    text: '✅ 配置文件已成功保存至根目录 campus_navigation.map，前台考生端即刻同步生效！'
                });
            } else {
                setFeedbackMsg({ type: 'error', text: `❌ 保存失败：${data.error || '通信异常'}` });
            }
        } catch (err: any) {
            setFeedbackMsg({ type: 'error', text: `❌ 通信异常：${err.message || '无法连接至后台服务'}` });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedbackMsg(null), 5000);
        }
    };

    // Reset to official default coordinates
    const handleResetDefaults = () => {
        if (window.confirm('确定要恢复出厂预设的广州大学官方地标与漫游路线吗？当前未保存的自定义修改将被重置。')) {
            setLocations(DEFAULT_CAMPUS_LOCATIONS);
            setRoutes(CAMPUS_TOUR_ROUTES);
            setPinScale(0.8);
            setFeedbackMsg({ type: 'success', text: '已恢复出厂官方标注！请点击“保存配置文件”使其永久生效。' });
            setTimeout(() => setFeedbackMsg(null), 4000);
        }
    };

    const categories = ['全部', '教学科研', '生活住宿', '餐饮美食', '体育休闲', '校园地标'];

    const filteredLocations = locations.filter(loc => {
        const matchCat = filterCategory === '全部' || loc.category === filterCategory;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return matchCat;
        return matchCat && (
            loc.name.toLowerCase().includes(q) ||
            loc.description.toLowerCase().includes(q) ||
            (loc.terms || []).some(t => t.toLowerCase().includes(q))
        );
    });

    const activeLocation = locations.find(l => l.id === selectedLocId) || locations[0];
    const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

    // --- Pan & Zoom Handlers ---
    const handleMouseDownMap = (e: React.MouseEvent) => {
        if (draggingLocId) return;
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMoveMap = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        } else if (draggingLocId && mapImageRef.current) {
            const rect = mapImageRef.current.getBoundingClientRect();
            const rawX = ((e.clientX - rect.left) / rect.width) * 100;
            const rawY = ((e.clientY - rect.top) / rect.height) * 100;
            const clampedX = Math.max(1, Math.min(99, Number(rawX.toFixed(1))));
            const clampedY = Math.max(1, Math.min(99, Number(rawY.toFixed(1))));

            setLocations(prev => prev.map(loc => {
                if (loc.id === draggingLocId) {
                    return {
                        ...loc,
                        coordinates: { x: clampedX, y: clampedY }
                    };
                }
                return loc;
            }));
        }
    };

    const handleMouseUpMap = () => {
        setIsPanning(false);
        setDraggingLocId(null);
    };

    // Click on Map to calibrate coordinate of currently active location
    const handleMapClickToCalibrate = (e: React.MouseEvent) => {
        if (!mapImageRef.current || !activeLocation || draggingLocId) return;
        const rect = mapImageRef.current.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(1, Math.min(99, Number(clickX.toFixed(1))));
        const clampedY = Math.max(1, Math.min(99, Number(clickY.toFixed(1))));

        setLocations(prev => prev.map(loc => {
            if (loc.id === activeLocation.id) {
                return {
                    ...loc,
                    coordinates: { x: clampedX, y: clampedY }
                };
            }
            return loc;
        }));
    };

    // --- CRUD Handlers for Locations ---
    const handleCreateNewLocation = () => {
        const newId = `loc-${Date.now().toString(36)}`;
        const newLoc: CampusLocation = {
            id: newId,
            name: '新建地标名称',
            category: '教学科研',
            coordinates: { x: 50.0, y: 50.0 },
            description: '请在表单输入该地标的详细功能介绍与建筑特色。',
            images: ['https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop'],
            terms: ['新地标', '特色建筑'],
            highlights: ['现代化配套', '智能设施'],
            openingHours: '全天开放',
            liliNarrative: '学弟学妹们好！这里是新设立的校园地标，环境优美，设施完备！',
            liliTips: ['欢迎大家前来参观打卡！']
        };
        setLocations(prev => [newLoc, ...prev]);
        setSelectedLocId(newId);
        setViewMode('properties');
    };

    const handleDeleteLocation = (id: string) => {
        if (locations.length <= 1) {
            alert('至少需要保留一个校园地标！');
            return;
        }
        if (window.confirm('确定要删除该地标吗？同时将从所有漫游路线中移除该站点。')) {
            setLocations(prev => prev.filter(l => l.id !== id));
            setRoutes(prev => prev.map(r => ({
                ...r,
                locationIds: r.locationIds.filter(lid => lid !== id)
            })));
            if (selectedLocId === id) {
                const remaining = locations.filter(l => l.id !== id);
                setSelectedLocId(remaining[0]?.id || null);
            }
        }
    };

    const handleUpdateActiveLocation = (field: keyof CampusLocation, value: any) => {
        if (!activeLocation) return;
        setLocations(prev => prev.map(loc => {
            if (loc.id === activeLocation.id) {
                return { ...loc, [field]: value };
            }
            return loc;
        }));
    };

    // --- CRUD Handlers for Routes ---
    const handleCreateNewRoute = () => {
        const newRouteId = `route-${Date.now().toString(36)}`;
        const newRoute: CampusTourRoute = {
            id: newRouteId,
            title: '🚶‍♂️ 新建主题漫游路线',
            subtitle: '站点A ➔ 站点B ➔ 站点C',
            icon: 'Navigation',
            color: 'from-purple-500 to-indigo-600',
            duration: '约 20 分钟',
            description: '定制专属于广大新生的特色打卡动线。',
            locationIds: locations.slice(0, 3).map(l => l.id)
        };
        setRoutes(prev => [...prev, newRoute]);
        setSelectedRouteId(newRouteId);
    };

    const handleDeleteRoute = (id: string) => {
        if (routes.length <= 1) {
            alert('至少需要保留一条漫游路线！');
            return;
        }
        if (window.confirm('确定要删除该条漫游路线吗？')) {
            setRoutes(prev => prev.filter(r => r.id !== id));
            if (selectedRouteId === id) {
                const remaining = routes.filter(r => r.id !== id);
                setSelectedRouteId(remaining[0]?.id || null);
            }
        }
    };

    const handleUpdateActiveRoute = (field: keyof CampusTourRoute, value: any) => {
        if (!activeRoute) return;
        setRoutes(prev => prev.map(r => {
            if (r.id === activeRoute.id) {
                return { ...r, [field]: value };
            }
            return r;
        }));
    };

    const handleMoveRouteStation = (index: number, direction: 'up' | 'down') => {
        if (!activeRoute) return;
        const newIds = [...activeRoute.locationIds];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newIds.length) return;
        const temp = newIds[index];
        newIds[index] = newIds[targetIndex];
        newIds[targetIndex] = temp;
        handleUpdateActiveRoute('locationIds', newIds);
    };

    const handleRemoveRouteStation = (locId: string) => {
        if (!activeRoute) return;
        handleUpdateActiveRoute('locationIds', activeRoute.locationIds.filter(id => id !== locId));
    };

    const handleAddStationToRoute = (locId: string) => {
        if (!activeRoute || activeRoute.locationIds.includes(locId)) return;
        handleUpdateActiveRoute('locationIds', [...activeRoute.locationIds, locId]);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fdfcff]">
            
            {/* 1. Header Toolbar */}
            <div className="p-4 sm:p-5 border-b border-gray-100/80 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#b3a4ed] to-[#a494e8] text-white flex items-center justify-center shadow-md shrink-0">
                        <Compass size={22} className="animate-spin-slow" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-[17px] font-black text-[#4a4365] tracking-tight">
                                校园智能导览管理控制台
                            </h2>
                            <span className="bg-purple-100 text-purple-800 text-[10.5px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                                配置文件: campus_navigation.map
                            </span>
                        </div>
                        <p className="text-[11.5px] text-[#7a7398] font-medium mt-0.5">
                            支持在超大全景底图上自由拖动图钉校准、自定义图标全局缩放比例及编排漫游路线
                        </p>
                    </div>
                </div>

                {/* Top Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleResetDefaults}
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-[11.5px] font-bold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="恢复官方出厂标注"
                    >
                        <RotateCcw size={12} />
                        <span>恢复官方标注</span>
                    </button>

                    <button
                        onClick={fetchCampusMapData}
                        disabled={loading}
                        className="px-3 py-1.5 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 text-[11.5px] font-bold rounded-2xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        <span>重新加载</span>
                    </button>

                    <button
                        onClick={handleSaveToServer}
                        disabled={saving}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#b3a4ed] to-[#a494e8] hover:opacity-95 text-white text-[12px] font-black rounded-2xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
                    >
                        <Save size={13} />
                        <span>{saving ? '正在写入配置文件...' : '保存配置文件 (.map)'}</span>
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {feedbackMsg && (
                <div className={`px-6 py-2.5 text-[12px] font-bold flex items-center gap-2 border-b shrink-0 animate-in fade-in duration-200 ${
                    feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                    {feedbackMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{feedbackMsg.text}</span>
                </div>
            )}

            {/* 2. Three Major Mode Navigation Tabs & Global Pin Scale Bar */}
            <div className="px-5 sm:px-6 py-2.5 bg-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                {/* Major Sub-Tabs */}
                <div className="flex items-center gap-1.5 bg-purple-50/60 p-1 rounded-2xl border border-purple-100/60">
                    <button
                        onClick={() => setViewMode('calibrate')}
                        className={`px-4 py-1.5 rounded-xl text-[12px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === 'calibrate'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                                : 'text-[#6c5aa8] hover:bg-white/80'
                        }`}
                    >
                        <Maximize2 size={13} />
                        <span>🗺️ 全屏大图坐标精准校准 ({locations.length})</span>
                    </button>

                    <button
                        onClick={() => setViewMode('properties')}
                        className={`px-4 py-1.5 rounded-xl text-[12px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === 'properties'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                                : 'text-[#6c5aa8] hover:bg-white/80'
                        }`}
                    >
                        <Edit3 size={13} />
                        <span>📝 地标全属性详细编辑</span>
                    </button>

                    <button
                        onClick={() => setViewMode('routes')}
                        className={`px-4 py-1.5 rounded-xl text-[12px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === 'routes'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                                : 'text-[#6c5aa8] hover:bg-white/80'
                        }`}
                    >
                        <Navigation size={13} />
                        <span>🚶‍♂️ 漫游路线规划工坊 ({routes.length})</span>
                    </button>
                </div>

                {/* Global Pin Scale Slider (User Requested) */}
                <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/80 px-3.5 py-1.5 rounded-2xl text-[11.5px] font-bold text-amber-900 shrink-0">
                    <Sliders size={13} className="text-amber-600" />
                    <span>全局图标大小：</span>
                    <input
                        type="range"
                        min="0.5"
                        max="1.3"
                        step="0.05"
                        value={pinScale}
                        onChange={(e) => setPinScale(Number(e.target.value))}
                        className="w-24 accent-purple-600 cursor-pointer"
                    />
                    <span className="bg-white px-2 py-0.5 rounded-lg border border-amber-200 font-mono text-[11px] font-black">
                        {(pinScale * 100).toFixed(0)}%
                    </span>
                    <div className="flex items-center gap-1">
                        {[
                            { label: '精简 60%', val: 0.6 },
                            { label: '标准 80%', val: 0.8 },
                            { label: '醒目 100%', val: 1.0 }
                        ].map(p => (
                            <button
                                key={p.val}
                                onClick={() => setPinScale(p.val)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    pinScale === p.val ? 'bg-amber-600 text-white' : 'bg-white hover:bg-amber-100 text-amber-800'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Main Dynamic Workspace */}
            <div className="flex-1 overflow-hidden relative flex flex-col">

                {/* ============================================================ */}
                {/* VIEW 1: DEDICATED FULLSCREEN/LARGE CANVAS CALIBRATION STUDIO */}
                {/* ============================================================ */}
                {viewMode === 'calibrate' && (
                    <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden relative">
                        
                        {/* Map Canvas (Dominates 75%~80% space for immersive viewing) */}
                        <div
                            onMouseDown={handleMouseDownMap}
                            onMouseMove={handleMouseMoveMap}
                            onMouseUp={handleMouseUpMap}
                            onMouseLeave={handleMouseUpMap}
                            className={`flex-1 h-full relative overflow-hidden select-none bg-[#e8e2f5] flex items-center justify-center ${
                                isPanning ? 'cursor-grabbing' : (draggingLocId ? 'cursor-crosshair' : 'cursor-grab')
                            }`}
                        >
                            {/* Floating Map Canvas Controls */}
                            <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-md border border-white flex flex-col gap-1">
                                <button
                                    onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
                                    className="p-2 rounded-xl text-[#4a4365] hover:bg-purple-100 transition-colors cursor-pointer"
                                    title="放大地图"
                                >
                                    <ZoomIn size={16} />
                                </button>
                                <button
                                    onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.8))}
                                    className="p-2 rounded-xl text-[#4a4365] hover:bg-purple-100 transition-colors cursor-pointer"
                                    title="缩小地图"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <button
                                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                                    className="p-2 rounded-xl text-[#4a4365] hover:bg-purple-100 transition-colors cursor-pointer border-t border-purple-100"
                                    title="重置居中"
                                >
                                    <RotateCcw size={15} />
                                </button>
                            </div>

                            {/* Floating Prompt Bar */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-lg border border-purple-200 flex items-center gap-3">
                                <span className="text-[12px] font-black text-[#4a4365] flex items-center gap-1.5">
                                    <Move size={14} className="text-purple-600 animate-pulse" />
                                    <span>按住任意图钉可在底图上自由拖动校准</span>
                                </span>
                                {activeLocation && (
                                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-xl">
                                        当前选定：{activeLocation.name} (X: {activeLocation.coordinates.x}%, Y: {activeLocation.coordinates.y}%)
                                    </span>
                                )}
                            </div>

                            {/* Large Image Transform Stage */}
                            <div
                                ref={mapImageRef}
                                onClick={handleMapClickToCalibrate}
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    transition: isPanning || draggingLocId ? 'none' : 'transform 0.2s ease-out',
                                    aspectRatio: '1506 / 1280'
                                }}
                                className="relative w-auto h-auto max-w-[1250px] max-h-[92%] rounded-3xl overflow-hidden shadow-2xl border-4 border-white shrink-0 bg-[#352f4a]"
                            >
                                <img
                                    src="/campus.jpg"
                                    alt="广州大学全景底图"
                                    className="w-full h-full object-fill pointer-events-none select-none block"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop';
                                    }}
                                />

                                <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                                {/* Scaled Marker Pins */}
                                {locations.map((loc) => {
                                    const isSelected = selectedLocId === loc.id;
                                    return (
                                        <div
                                            key={loc.id}
                                            style={{
                                                left: `${loc.coordinates.x}%`,
                                                top: `${loc.coordinates.y}%`,
                                                transform: `translate(-50%, -50%) scale(${pinScale})`
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setSelectedLocId(loc.id);
                                                setDraggingLocId(loc.id);
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedLocId(loc.id);
                                            }}
                                            className="absolute group cursor-move z-20 transition-transform origin-center"
                                        >
                                            {/* Pulse ring */}
                                            {isSelected && (
                                                <span className="absolute -inset-3 rounded-full bg-amber-400/60 animate-ping pointer-events-none" />
                                            )}

                                            {/* Compact Marker Badge */}
                                            <div className={`relative flex items-center gap-1 px-2 py-0.5 rounded-xl shadow-xl border transition-all ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-200 shadow-amber-500/50 ring-4 ring-amber-300/50 scale-110 z-30'
                                                    : 'bg-white/95 text-[#4a4365] hover:bg-[#a494e8] hover:text-white border-white/90'
                                            }`}>
                                                <MapPin size={11} className={isSelected ? 'text-white' : 'text-[#a494e8] group-hover:text-white shrink-0'} />
                                                <span className="text-[10px] font-black whitespace-nowrap drop-shadow-xs">
                                                    {loc.name.split(' ')[0]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Sidebar: Landmark Directory with Coordinates */}
                        <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col h-[40vh] md:h-full overflow-hidden shrink-0 shadow-lg">
                            <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between gap-2 shrink-0">
                                <div className="font-black text-[13px] text-[#4a4365] flex items-center gap-1.5">
                                    <MapPin size={14} className="text-purple-600" />
                                    <span>地标点位库 ({filteredLocations.length})</span>
                                </div>
                                <button
                                    onClick={handleCreateNewLocation}
                                    className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <Plus size={12} />
                                    <span>新增</span>
                                </button>
                            </div>

                            {/* Search */}
                            <div className="p-2 border-b border-gray-100 bg-white shrink-0">
                                <div className="relative">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="搜索地标进行定位..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-3 py-1.5 text-[11.5px] text-[#4a4365] outline-none focus:ring-1 focus:ring-purple-400"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                                {filteredLocations.map((loc) => {
                                    const isSel = selectedLocId === loc.id;
                                    return (
                                        <div
                                            key={loc.id}
                                            onClick={() => setSelectedLocId(loc.id)}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                                isSel
                                                    ? 'bg-purple-50/80 border-purple-300 text-purple-900 shadow-2xs'
                                                    : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="font-bold text-[12px] truncate">{loc.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                    X: {loc.coordinates.x}% | Y: {loc.coordinates.y}%
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLocId(loc.id);
                                                    setViewMode('properties');
                                                }}
                                                className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg cursor-pointer"
                                                title="编辑详细属性"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* VIEW 2: POI PROPERTIES & LILI VOICE NARRATIVE DETAILED FORM  */}
                {/* ============================================================ */}
                {viewMode === 'properties' && activeLocation && (
                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 max-w-4xl mx-auto w-full space-y-5 hide-scrollbar">
                        {/* Title Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <div className="flex items-center gap-3">
                                <h3 className="font-black text-[16px] text-[#4a4365]">
                                    正在编辑地标：{activeLocation.name}
                                </h3>
                                <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-lg">
                                    ID: {activeLocation.id}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('calibrate')}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11.5px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <Maximize2 size={12} />
                                    <span>返回大图拖拽校准</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteLocation(activeLocation.id)}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11.5px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <Trash2 size={12} />
                                    <span>删除地标</span>
                                </button>
                            </div>
                        </div>

                        {/* Form Inputs */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1 block">地标全称</label>
                                <input
                                    type="text"
                                    value={activeLocation.name}
                                    onChange={(e) => handleUpdateActiveLocation('name', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-bold text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[12px] font-bold text-gray-600 mb-1 block">分类类别</label>
                                    <select
                                        value={activeLocation.category}
                                        onChange={(e) => handleUpdateActiveLocation('category', e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] font-bold text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                    >
                                        {categories.filter(c => c !== '全部').map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[12px] font-bold text-gray-600 mb-1 block">开放时间</label>
                                    <input
                                        type="text"
                                        value={activeLocation.openingHours || ''}
                                        onChange={(e) => handleUpdateActiveLocation('openingHours', e.target.value)}
                                        placeholder="如：周一至周日 08:00 - 22:30"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Coordinates Stepper */}
                            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/80 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-purple-950 block mb-1">X 轴坐标百分比 (0~100%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={activeLocation.coordinates.x}
                                        onChange={(e) => handleUpdateActiveLocation('coordinates', { ...activeLocation.coordinates, x: Number(e.target.value) })}
                                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[13px] font-bold text-[#4a4365]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-purple-950 block mb-1">Y 轴坐标百分比 (0~100%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={activeLocation.coordinates.y}
                                        onChange={(e) => handleUpdateActiveLocation('coordinates', { ...activeLocation.coordinates, y: Number(e.target.value) })}
                                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-[13px] font-bold text-[#4a4365]"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1 block">详细功能与建筑特色说明</label>
                                <textarea
                                    rows={3}
                                    value={activeLocation.description}
                                    onChange={(e) => handleUpdateActiveLocation('description', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[12.5px] text-[#4a4365] leading-relaxed focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>

                            {/* Lili Narrative */}
                            <div className="bg-gradient-to-br from-purple-50/70 to-pink-50/50 p-4 rounded-2xl border border-purple-200 space-y-2">
                                <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[12.5px]">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <span>丽丽学姐专属语音伴游解说词 (TTS 朗读文案)</span>
                                </div>
                                <textarea
                                    rows={3}
                                    value={activeLocation.liliNarrative || ''}
                                    onChange={(e) => handleUpdateActiveLocation('liliNarrative', e.target.value)}
                                    placeholder="输入学姐亲切大实话解说文案..."
                                    className="w-full bg-white border border-purple-200 rounded-xl p-3 text-[12.5px] text-[#4a4365] leading-relaxed focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>

                            {/* Tips */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1 flex items-center gap-1">
                                    <Lightbulb size={13} className="text-amber-500" />
                                    学姐实测打卡避坑秘籍 (多条用换行分隔)
                                </label>
                                <textarea
                                    rows={2}
                                    value={(activeLocation.liliTips || []).join('\n')}
                                    onChange={(e) => handleUpdateActiveLocation('liliTips', e.target.value.split('\n').filter(Boolean))}
                                    placeholder="每行输入一条实用秘籍..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[12px] text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>

                            {/* Image URLs */}
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1 flex items-center gap-1">
                                    <ImageIcon size={13} className="text-purple-500" />
                                    实景图片链接 (多条用换行分隔)
                                </label>
                                <textarea
                                    rows={2}
                                    value={activeLocation.images.join('\n')}
                                    onChange={(e) => handleUpdateActiveLocation('images', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11.5px] font-mono text-gray-700 focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* VIEW 3: TOUR ROUTE SEQUENCING & PLANNING STUDIO              */}
                {/* ============================================================ */}
                {viewMode === 'routes' && activeRoute && (
                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 max-w-4xl mx-auto w-full space-y-5 hide-scrollbar">
                        {/* Title Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <div className="flex items-center gap-3">
                                <h3 className="font-black text-[16px] text-[#4a4365]">
                                    漫游路线工坊：{activeRoute.title}
                                </h3>
                                <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-lg">
                                    共 {activeRoute.locationIds.length} 个途经站点
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCreateNewRoute}
                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11.5px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                >
                                    <Plus size={12} />
                                    <span>新建漫游路线</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteRoute(activeRoute.id)}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11.5px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                >
                                    <Trash2 size={12} />
                                    <span>删除路线</span>
                                </button>
                            </div>
                        </div>

                        {/* Routes Quick Switcher Chips */}
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {routes.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedRouteId(r.id)}
                                    className={`px-3.5 py-1.5 rounded-2xl text-[12px] font-black shrink-0 transition-all cursor-pointer border ${
                                        selectedRouteId === r.id
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-xs'
                                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                                    }`}
                                >
                                    {r.title}
                                </button>
                            ))}
                        </div>

                        {/* Route Form */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
                            <div>
                                <label className="text-[12px] font-bold text-gray-600 mb-1 block">路线主标题</label>
                                <input
                                    type="text"
                                    value={activeRoute.title}
                                    onChange={(e) => handleUpdateActiveRoute('title', e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-bold text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[12px] font-bold text-gray-600 mb-1 block">建议漫游耗时</label>
                                    <input
                                        type="text"
                                        value={activeRoute.duration}
                                        onChange={(e) => handleUpdateActiveRoute('duration', e.target.value)}
                                        placeholder="如：约 25 分钟"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[12px] font-bold text-gray-600 mb-1 block">副标题路径描述</label>
                                    <input
                                        type="text"
                                        value={activeRoute.subtitle}
                                        onChange={(e) => handleUpdateActiveRoute('subtitle', e.target.value)}
                                        placeholder="如：正门 ➔ 注册点 ➔ 宿舍"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12.5px] text-[#4a4365] focus:ring-2 focus:ring-purple-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Station Sequencing */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <label className="text-[12.5px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                        <Navigation size={14} className="text-purple-600" />
                                        <span>途经站点编排与到达序号 ({activeRoute.locationIds.length} 站)</span>
                                    </label>
                                    
                                    {/* Add Station Dropdown */}
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleAddStationToRoute(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="text-[11.5px] bg-purple-50 text-purple-700 font-bold border border-purple-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                                    >
                                        <option value="">+ 添加地标入路线</option>
                                        {locations
                                            .filter(l => !activeRoute.locationIds.includes(l.id))
                                            .map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="space-y-2 pt-1">
                                    {activeRoute.locationIds.map((locId, idx) => {
                                        const locItem = locations.find(l => l.id === locId);
                                        return (
                                            <div
                                                key={locId}
                                                className="p-3 bg-gray-50 border border-gray-200/80 rounded-2xl flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <div className="text-[13px] font-bold text-[#4a4365] truncate">
                                                            {locItem?.name || locId}
                                                        </div>
                                                        <div className="text-[10.5px] text-gray-400">
                                                            分类：{locItem?.category || '未知'} · X: {locItem?.coordinates.x}%, Y: {locItem?.coordinates.y}%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => handleMoveRouteStation(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="p-1.5 text-gray-400 hover:text-purple-700 disabled:opacity-20 cursor-pointer"
                                                        title="上移站点"
                                                    >
                                                        <ChevronUp size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveRouteStation(idx, 'down')}
                                                        disabled={idx === activeRoute.locationIds.length - 1}
                                                        className="p-1.5 text-gray-400 hover:text-purple-700 disabled:opacity-20 cursor-pointer"
                                                        title="下移站点"
                                                    >
                                                        <ChevronDown size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveRouteStation(locId)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="从路线中移除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
