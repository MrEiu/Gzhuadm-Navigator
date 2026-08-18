/**
 * ====================================================================================
 * GZADM NAVIGATOR - ADMISSION QA & MANAGEMENT PLATFORM (aurasense.tsx)
 * ====================================================================================
 *
 * @file        aurasense.tsx
 * @description Master Frontend Component incorporating the Student Consultation Portal,
 *              Interactive Campus Map Guide, RAG Knowledge Base Management, AI Diagnostic
 *              Playground, and Multi-Model / Search Engine Configuration Console.
 *
 * ------------------------------------------------------------------------------------
 * CODE ARCHITECTURE & MODULE MAP (LINE BY LINE):
 * ------------------------------------------------------------------------------------
 *
 * 1. IMPORTS & SYSTEM CONFIGURATION [Lines 1 - 30]
 *    - React core hooks, Markdown parsers, Lucide icons.
 *    - API base URL auto-detection & UI Theme Tokens (THEME, ROLE).
 *
 * 2. INITIAL DATA & CAMPUS DATASET [Lines 31 - 149]
 *    - INITIAL_MESSAGES: Default greeting message from Dr. Elena.
 *    - DEFAULT_CAMPUS_LOCATIONS: Master database of campus landmarks, 3D coordinates,
 *      opening hours, high-res images, and searchable tag keywords.
 *
 * 3. INTERACTIVE CAMPUS MAP GUIDE MODAL [Lines 150 - 524]
 *    - MapGuideModal: Renders interactive 3D pin locator map and grid view for exploring
 *      campus facilities with direct one-click AI query prompts.
 *
 * 4. MARKDOWN & CHAT MESSAGE RENDERERS [Lines 525 - 635]
 *    - sanitizeMarkdownContent: Prevents syntax breakage for unclosed markdown tables/images.
 *    - AuraMarkdownMessage: Optimized ReactMarkdown renderer with custom table & image styling.
 *    - ChatMessageItem: Memoized chat bubble component for user and AI responses.
 *
 * 5. MAIN APPLICATION CONTROLLER (App Component) [Lines 636 - 3290]
 *    - State Declarations [Lines 636 - 720]:
 *      Authentication, Profiles, RAG Manager, Dashboard, Playground, Settings, Analytics.
 *    - Admin & RAG API Handlers [Lines 725 - 1150]:
 *      fetchDashboardStats, fetchRagKnowledge, handleSaveSettings, handleRunRagTest,
 *      handleRunWebSearchTest, performIncrementalAnalysis, etc.
 *    - User Chat & Streaming Logic [Lines 1151 - 1580]:
 *      handleSend, streaming AI response parsing, session history persistence.
 *    - SCENE 1: Authentication UI [Lines 1581 - 1730]:
 *      Glassmorphism login & registration card.
 *    - SCENE 2 / VIEW A: Student Consultation UI [Lines 1731 - 1935]:
 *      Sidebar session history, chat window, location quick-asks, and input bar.
 *    - SCENE 2 / VIEW B: Admin Management Console [Lines 1936 - 3250]:
 *      - Sidebar Navigation Console [Lines 1938 - 2040]
 *      - Tab 1: Dashboard Analytics [Lines 2041 - 2135]
 *      - Tab 2: RAG Knowledge Base Manager & Slice Editor [Lines 2136 - 2510]
 *      - Tab 3: Registered User Management & Score Tier Control [Lines 2511 - 2710]
 *      - Tab 4: Question & Word Frequency Analytics Engine [Lines 2711 - 2865]
 *      - Tab 5: RAG & Web Search Diagnostic Playground [Lines 2866 - 3020]
 *      - Tab 6: Multi-Model Gateway & Search Engine Settings [Lines 3021 - 3245]
 *    - Modal Mounts & Layout Container End [Lines 3246 - 3290]
 *
 * 6. AUXILIARY MODALS & SUBSYSTEMS [Lines 3291 - 4071]
 *    - RagItemModal [Lines 3291 - 3380]: Edit/Create individual knowledge slices.
 *    - DocumentChunkImportModal [Lines 3381 - 3730]: Document batch chunker & table parser.
 *    - UserProfileModal [Lines 3731 - 3824]: Student profile & Gaokao score entry form.
 *    - PersonalRagModal [Lines 3825 - 4071]: VIP student personal RAG memory inspector.
 *
 * ====================================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, BrainCircuit, Sparkles, Database, 
  Plus, Trash2, Edit3, Table, Image as ImageIcon, 
  Search, X, Upload, Check, User, Lock, LogOut, ShieldCheck, 
  ArrowRight, FileText, FileUp, Scissors, Layers, Eye,
  MessageSquare, History, PanelLeftOpen, PanelLeftClose, Clock, ChevronRight,
  MapPin, Compass, Map, Navigation, Tag, Info, ExternalLink, Bookmark,
  LayoutDashboard, Globe, Settings, Cpu, Activity, RefreshCw, Zap, Sliders, CheckCircle2, AlertCircle, Play, FlaskConical
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `http://${window.location.hostname}:3001` : '';


// --- Theme Configuration ---
const THEME = {
  bg: "bg-gradient-to-br from-[#f6f4fc] via-[#fbf7f9] to-[#f0f6fa]",
  glass: "bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_35px_80px_rgba(186,175,215,0.3)]",
  userBubble: "bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white shadow-[0_12px_25px_rgba(179,164,237,0.3)]",
  botBubble: "bg-white text-[#5c5478] shadow-[0_12px_30px_rgba(203,195,225,0.3)]",
};

const ROLE = {
  name: 'Dr. Elena',
  title: '招生咨询顾问',
  avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop",
  color: "#a494e8"
};

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: '同学/家长您好！欢迎使用 **Gzadm Navigator 入学咨询平台**。我是招生咨询顾问 **Dr. Elena**。✨\n\n您可以向我咨询关于**招生政策、录取分数线、热门专业、学费与奖学金、宿舍环境及报名流程**等任何问题，我会为您结合知识库为您解答！',
    instant: true
  }
];

// --- Campus Map Guide Locations Data ---
const DEFAULT_CAMPUS_LOCATIONS = [
  {
    id: 'loc-001',
    name: '智慧图文信息中心 (主图书馆)',
    category: '教学科研',
    images: [
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop'
    ],
    description: '全校地标建筑，楼高10层，建筑面积达4.5万平方米。拥有藏书超200万册，全馆覆盖高速WiFi与智能书架，配备单人沉浸自习舱、AI检索终端、研讨室与24小时不打烊自习区。',
    terms: ['24小时自习室', '海量电子文献', '智能书架', '研讨室预约', '静音沉浸舱', '咖啡图书吧'],
    coordinates: { x: 48, y: 38 },
    highlights: ['24H开放自习区', '智能人脸入馆', '沉浸式静音舱', '全景落地窗景观'],
    openingHours: '周一至周日 06:30 - 23:00 (24H区全天开放)'
  },
  {
    id: 'loc-002',
    name: '人工智能与算力中心大楼',
    category: '教学科研',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
    ],
    description: '计算机学院与软件学院科研大楼，部署有万卡并行集群超级计算中心、国家级数字孪生工程实验室、机器人智能交互工坊以及多个校企联合AI实验室。',
    terms: ['AI实验室', '高性能算力', '创新创业基地', '机器人工坊', '校企联合实验室', '学科竞赛基地'],
    coordinates: { x: 28, y: 46 },
    highlights: ['万卡高性能GPU算力集群', '国家级重点实验室', '学生科技创新团队大本营'],
    openingHours: '周一至周日 07:00 - 22:30'
  },
  {
    id: 'loc-003',
    name: '枫林星级学生公寓区',
    category: '生活住宿',
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800&auto=format&fit=crop'
    ],
    description: '现代化标准学生公寓，采用上床下桌设计，统一配备独立卫生间、干湿分离洗漱台、品牌冷暖变频空调、智能门禁与24小时热电供应。楼下配有自助智能洗衣房与健身休闲区。',
    terms: ['4人标准间', '独立卫浴', '冷暖空调', '上床下桌', '自助洗衣房', '门禁人脸识别', '独立阳台'],
    coordinates: { x: 72, y: 28 },
    highlights: ['上床下桌大空间', '独立卫生间与淋浴', '智能安防人脸识别', '楼下便捷超市'],
    openingHours: '门禁时间：06:00 - 23:30 (凭人脸通行)'
  },
  {
    id: 'loc-004',
    name: '中央综合体育馆与恒温游泳馆',
    category: '体育休闲',
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop'
    ],
    description: '综合性现代体育中心，拥有50米8泳道标准恒温游泳池、室内标准篮球馆、羽毛球与乒乓球馆、健身力量房及400米塑胶跑道田径场，是学生修完体育学分与日常锻炼的首选场所。',
    terms: ['恒温游泳馆', '室内篮球场', '健身中心', '塑胶跑道', '羽毛球馆', '体育选修课', '体测中心'],
    coordinates: { x: 78, y: 64 },
    highlights: ['国家一级标准游泳池', '专业羽毛球与木地板篮球场', '全套进口健身器材'],
    openingHours: '周一至周日 08:00 - 22:00'
  },
  {
    id: 'loc-005',
    name: '第一美食广场与云端餐厅',
    category: '餐饮美食',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop'
    ],
    description: '三层大型智慧体验餐厅，集合八大菜系、地方特色风味小吃、清真风味专区、精致西餐与网红咖啡厅。采用智慧盘托刷脸结算，美味营养且价格均受学校监管补贴。',
    terms: ['各地风味', '清真窗口', '网红咖啡厅', '夜宵烧烤', '智慧刷脸支付', '平价实惠', '烘焙甜品'],
    coordinates: { x: 50, y: 62 },
    highlights: ['百余种风味美食小吃', '智慧盘无感秒结算', '环境优雅宜人舒适'],
    openingHours: '早餐 06:30-09:00 | 午餐 10:30-13:30 | 晚餐 16:30-19:30 | 夜宵 20:00-22:30'
  },
  {
    id: 'loc-006',
    name: '艺术与数字媒体交互中心',
    category: '校园地标',
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=800&auto=format&fit=crop'
    ],
    description: '学校艺术文化地标，设有一座千人多功能艺术剧场、数字媒体艺术展览馆、XR虚实融合演播厅以及艺术设计工坊。每年举办毕业设计展、高雅艺术进校园活动及迎新晚会。',
    terms: ['数字媒体', 'XR演播厅', '艺术剧场', '毕业设计展', '创意工坊', '美育基地'],
    coordinates: { x: 30, y: 72 },
    highlights: ['千人剧场舞台声光电', 'XR虚实沉浸演播室', '年度毕业设计视觉盛宴'],
    openingHours: '周二至周日 09:00 - 21:00 (周一闭馆)'
  }
];

// --- Map Guide Modal Component ---
const MapGuideModal = ({ locations, isOpen, onClose, onAskQuestion }) => {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [viewMode, setViewMode] = useState('map');
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
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'map' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Map size={14} />
                <span>地图</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers size={14} />
                <span>卡片</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="关闭导览"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2.5 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-gray-400 shrink-0 mr-1 flex items-center gap-1">
            <Tag size={12} /> 分类筛选：
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 ${
                activeCategory === cat
                  ? 'bg-[#4a4365] text-white shadow-sm scale-105'
                  : 'bg-white/80 hover:bg-white text-gray-600 border border-gray-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

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
                      
                      <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-lg border transition-all duration-300 ${
                        isSelected 
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
                            className="bg-[#f4effc] hover:bg-[#e6dcfa] text-[#6c5aa8] text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
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
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-[#4a4365] text-[12px] font-bold py-2 rounded-2xl border border-gray-200/60 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye size={14} />
                        <span>查看详情</span>
                      </button>

                      <button
                        onClick={() => onAskQuestion(`请向我详细介绍一下【${loc.name}】的功能、环境与相关政策`)}
                        className="bg-[#4a4365] hover:bg-[#38324f] text-white text-[12px] font-bold px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
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
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
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
                      className={`w-16 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                        activeImgIndex === idx ? 'border-[#a494e8] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
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
                        className="bg-[#f3eefc] hover:bg-[#a494e8] hover:text-white text-[#6c5aa8] text-[12px] font-bold px-3 py-1.5 rounded-xl border border-[#e4dcf8] flex items-center gap-1.5 transition-all group"
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
                  className="px-5 py-3 rounded-2xl text-[13px] font-bold text-gray-600 hover:bg-gray-200/60 transition-colors"
                >
                  返回导览列表
                </button>
                <button
                  onClick={() => {
                    const locName = selectedLoc.name;
                    setSelectedLoc(null);
                    onAskQuestion(`请向我详细介绍一下【${locName}】的整体情况、环境与注意事项。`);
                  }}
                  className="flex-1 bg-gradient-to-r from-[#4a4365] to-[#685d8a] hover:from-[#3a3452] hover:to-[#554a75] text-white text-[13px] font-bold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
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

// --- Markdown Component ---
// Helper function to sanitize unclosed markdown syntax tags (images, tables)
const sanitizeMarkdownContent = (rawText) => {
  if (!rawText) return '';
  let safeText = rawText;

  // Protect unclosed image tag: e.g. ![alt](https://domain... (missing closing paren)
  safeText = safeText.replace(/!\[([^\]]*)\]\(([^)]*)$/g, (_match, p1) => {
    return `> 📷 *正在加载[${p1 || '图片附件'}]...*\n`;
  });

  // Protect unclosed table lines without trailing pipe
  const lines = safeText.split('\n');
  const lastLine = lines[lines.length - 1];
  if (lastLine && lastLine.trim().startsWith('|') && !lastLine.trim().endsWith('|')) {
    lines[lines.length - 1] = lastLine + ' |';
    safeText = lines.join('\n');
  }

  return safeText;
};

// --- Memoized Markdown Component & Chat Message Item (Fix typing flicker issue) ---
interface AuraMarkdownMessageProps {
  content: string;
  roleColor?: string;
}

const AuraMarkdownMessage = React.memo(({ content, roleColor }: AuraMarkdownMessageProps) => {
  const safeContent = sanitizeMarkdownContent(content);

  const markdownComponents = useMemo(() => ({
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="leading-relaxed text-[14px] my-1.5 whitespace-pre-wrap">
        {children}
      </p>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => <b className="font-bold" style={{ color: roleColor }}>{children}</b>,
    em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-2 list-disc space-y-1 pl-4 text-[14px]">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-2 list-decimal space-y-1 pl-4 text-[14px]">{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-2.5 border-l-3 border-[#b3a4ed] pl-3 py-1 bg-purple-50/40 rounded-r-xl text-[#6d648b] text-[13px]">
        {children}
      </blockquote>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-3 rounded-2xl border border-[#e4dcf8] bg-white/90 shadow-sm">
        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-[#f3eefc] text-[#4a4365] font-bold">{children}</thead>,
    th: ({ children }: { children?: React.ReactNode }) => <th className="p-2.5 border-b border-[#e4dcf8]">{children}</th>,
    td: ({ children }: { children?: React.ReactNode }) => <td className="p-2.5 border-b border-[#f3eefc] text-[#6d648b]">{children}</td>,
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <div className="my-3 rounded-2xl overflow-hidden shadow-md border-2 border-white max-w-full group relative bg-gray-50">
        <img 
          src={src} 
          alt={alt || '图片附件'} 
          className="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-500" 
        />
        {alt && (
          <div className="p-2.5 bg-white/95 text-[11px] text-[#4a4365] font-bold border-t border-gray-100 flex items-center gap-1.5 shadow-xs">
            <ImageIcon size={13} className="text-[#a494e8]" />
            <span>{alt}</span>
          </div>
        )}
      </div>
    )
  }), [roleColor]);

  return (
    <div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {safeContent}
      </ReactMarkdown>
    </div>
  );
});

const ChatMessageItem = React.memo(({ msg, isUser, bubbleStyle, roleColor, roleAvatar, roleName }: any) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
      <div className={`flex max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        <img 
          src={isUser ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop" : roleAvatar} 
          className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover" 
          alt="avatar" 
        />
        <div className="flex flex-col">
          {!isUser && (
            <div className="flex items-center gap-1.5 mb-1.5 ml-1">
              <span className="text-[11px] font-black tracking-wider uppercase" style={{ color: roleColor }}>
                {roleName}
              </span>
            </div>
          )}
          <div className={`px-5 py-3.5 ${bubbleStyle} ${isUser ? 'rounded-[24px] rounded-br-sm' : 'rounded-[24px] rounded-tl-sm'}`}>
            <AuraMarkdownMessage content={msg.text} roleColor={isUser ? '#fff' : roleColor} />
          </div>
        </div>
      </div>
    </div>
  );
});

const TypewriterText = React.memo(({ text, roleColor }: any) => {
  return <AuraMarkdownMessage content={text} roleColor={roleColor} />;
});

export default function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aurasense_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'advanced_register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Advanced Registration States (SMS / Email Verification) ---
  const [regTargetType, setRegTargetType] = useState<'phone' | 'email'>('phone');
  const [regTarget, setRegTarget] = useState('');
  const [regVerificationCode, setRegVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [codeSendMsg, setCodeSendMsg] = useState<string | null>(null);

  // --- Admin User Management Modals ---
  const [editingUserModal, setEditingUserModal] = useState<any | null>(null);
  const [passwordResetModal, setPasswordResetModal] = useState<any | null>(null);
  const [adminResetPasswordInput, setAdminResetPasswordInput] = useState('');

  // --- User Personal Profile & Score Tier State ---
  const [userProfile, setUserProfile] = useState(() => {
    if (!currentUser || currentUser.role !== 'user') return null;
    try {
      const saved = localStorage.getItem(`aurasense_profile_${currentUser.username}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPersonalRagOpen, setIsPersonalRagOpen] = useState(false);

  // --- RAG Knowledge Base States ---
  const [ragItems, setRagItems] = useState<any[]>([]);
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [ragCategoryFilter, setRagCategoryFilter] = useState('ALL');
  const [chunkPreviewMode, setChunkPreviewMode] = useState<'list' | 'table'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDocumentChunkModalOpen, setIsDocumentChunkModalOpen] = useState(false);
  const [isTableParserModalOpen, setIsTableParserModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // --- Admin Management States ---
  const [adminTab, setAdminTab] = useState<'dashboard' | 'rag' | 'users' | 'analytics' | 'playground' | 'settings'>('dashboard');
  const [interceptionEnabled, setInterceptionEnabled] = useState(true);
  const [lowScoreThreshold, setLowScoreThreshold] = useState(450);
  const [vipScoreThreshold, setVipScoreThreshold] = useState(580);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminTargetUser, setAdminTargetUser] = useState<string | null>(null);
  const [registeredUsersList, setRegisteredUsersList] = useState<any[]>([]);

  // --- Dashboard States ---
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // --- Playground / Test States ---
  const [playgroundTab, setPlaygroundTab] = useState<'rag' | 'web'>('rag');
  const [ragTestQuery, setRagTestQuery] = useState('浙江 计算机 录取分数');
  const [ragTestResults, setRagTestResults] = useState<any[] | null>(null);
  const [isRagTesting, setIsRagTesting] = useState(false);

  const [webTestQuery, setWebTestQuery] = useState('2025 全国高考报考人数');
  const [webTestProvider, setWebTestProvider] = useState('duckduckgo');
  const [webTestResults, setWebTestResults] = useState<any | null>(null);
  const [isWebTesting, setIsWebTesting] = useState(false);

  // --- Settings / Config States ---
  const [settingsConfig, setSettingsConfig] = useState<any>({
    baseUrl: 'https://api.deepseek.com',
    apiKey: '',
    defaultModel: 'deepseek-chat',
    fastModel: 'deepseek-chat',
    searchProvider: 'duckduckgo',
    tavilyApiKey: '',
    bochaApiKey: ''
  });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // --- Analytics & Dialogue Aggregation States ---
  const [adminMessageSearch, setAdminMessageSearch] = useState('');
  const [allUserDialogues, setAllUserDialogues] = useState<any[]>([]);
  const [wordAnalyticsDb, setWordAnalyticsDb] = useState<{
    analyzedMessageIds: string[];
    wordCounts: { [key: string]: number };
    totalAnalyzedCount: number;
    lastAnalyzedAt: string | null;
  }>({
    analyzedMessageIds: [],
    wordCounts: {},
    totalAnalyzedCount: 0,
    lastAnalyzedAt: null
  });
  const [newlyAnalyzedCount, setNewlyAnalyzedCount] = useState(0);

  const isLowScore = userProfile && typeof userProfile.score === 'number' && userProfile.score > 0 && userProfile.score < lowScoreThreshold;
  const isVipUser = userProfile && (userProfile.isVip || (typeof userProfile.score === 'number' && userProfile.score >= vipScoreThreshold));

  const handleSendVerificationCode = async () => {
    if (!regTarget.trim()) {
      setAuthError(`请输入您的${regTargetType === 'phone' ? '手机号' : '邮箱号'}`);
      return;
    }
    setIsSendingCode(true);
    setAuthError('');
    setCodeSendMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: regTarget.trim(), type: regTargetType })
      });
      const data = await res.json();
      if (data.ok) {
        setCodeSendMsg(data.message);
        setCodeCountdown(60);
      } else {
        setAuthError(data.error || '验证码发送失败');
      }
    } catch (e: any) {
      setAuthError(`网络错误: ${e.message}`);
    } finally {
      setIsSendingCode(false);
    }
  };

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setInterval(() => {
      setCodeCountdown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [codeCountdown]);

  const handleAdvancedRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !regTarget.trim() || !regVerificationCode.trim()) {
      setAuthError('请完整填写账号、密码、手机/邮箱与验证码');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('两次输入的密码不一致');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register-advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          target: regTarget.trim(),
          type: regTargetType,
          code: regVerificationCode.trim()
        })
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('aurasense_logged_user', JSON.stringify(data.user));
        setAuthError('');
      } else {
        setAuthError(data.error || '高级注册失败');
      }
    } catch (e: any) {
      setAuthError(`注册失败: ${e.message}`);
    }
  };

  const handleFetchRegisteredUsersServer = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.users)) {
        setRegisteredUsersList(data.users);
      } else {
        fetchRegisteredUsers();
      }
    } catch {
      fetchRegisteredUsers();
    }
  };

  const handleAdminSaveUserUpdate = async (updatedData: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.ok) {
        handleFetchRegisteredUsersServer();
        setEditingUserModal(null);
        setPasswordResetModal(null);
        setAdminResetPasswordInput('');
      } else {
        alert(`修改失败: ${data.error}`);
      }
    } catch (e: any) {
      alert(`网络错误: ${e.message}`);
    }
  };

  const handleAdminDeleteUser = async (targetUsername: string) => {
    if (!confirm(`确定要注销并删除用户【${targetUsername}】吗？此操作无法撤销。`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername })
      });
      const data = await res.json();
      if (data.ok) {
        handleFetchRegisteredUsersServer();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (e: any) {
      alert(`删除失败: ${e.message}`);
    }
  };

  const fetchRegisteredUsers = () => {
    try {
      const rawUsers = localStorage.getItem('aurasense_registered_users');
      const users = rawUsers ? JSON.parse(rawUsers) : [];
      const enriched = users.map((u: any) => {
        let profile = null;
        try {
          const pRaw = localStorage.getItem(`aurasense_profile_${u.username}`);
          if (pRaw) profile = JSON.parse(pRaw);
        } catch {}
        return {
          ...u,
          profile: profile || {}
        };
      });
      setRegisteredUsersList(enriched);
    } catch (err) {
      console.error('Failed to fetch registered users list', err);
    }
  };

  const fetchWordAnalyticsDb = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/word-analytics`);
      const payload = await res.json();
      if (payload.ok && payload.data) {
        setWordAnalyticsDb(payload.data);
        return payload.data;
      }
    } catch (e) {}

    try {
      const local = localStorage.getItem('aurasense_word_analytics_db');
      if (local) {
        const parsed = JSON.parse(local);
        setWordAnalyticsDb(parsed);
        return parsed;
      }
    } catch (e) {}

    return null;
  };

  const fetchAllUserDialogues = () => {
    try {
      const rawUsers = localStorage.getItem('aurasense_registered_users');
      let usersList = rawUsers ? JSON.parse(rawUsers) : [];
      const usernames = Array.from(new Set(['admin', ...usersList.map((u: any) => u.username)]));
      
      let aggregatedDialogues: any[] = [];

      usernames.forEach((uname: string) => {
        try {
          const rawSessions = localStorage.getItem(`aurasense_sessions_${uname}`);
          const sessions = rawSessions ? JSON.parse(rawSessions) : [];
          
          sessions.forEach((session: any) => {
            const msgs = session.messages || [];
            for (let i = 0; i < msgs.length; i++) {
              if (msgs[i].sender === 'user') {
                const question = msgs[i].text;
                const botReply = (msgs[i + 1] && msgs[i + 1].sender === 'bot') ? msgs[i + 1].text : '';
                aggregatedDialogues.push({
                  id: `dialogue-${uname}-${session.id}-${i}`,
                  username: uname,
                  sessionTitle: session.title || '招生咨询对话',
                  question,
                  reply: botReply,
                  timestamp: msgs[i].createdAt || session.updatedAt || new Date().toISOString()
                });
              }
            }
          });
        } catch (e) {}
      });

      if (aggregatedDialogues.length === 0) {
        aggregatedDialogues = [
          {
            id: 'd-sample-1',
            username: 'student_zhang',
            sessionTitle: '浙江高考招生咨询',
            question: '请问今年计算机科学与技术专业在浙江省的预计录取分数线和位次是多少？有宿舍图吗？',
            reply: '同学习好！根据往年录取数据，计算机科学与技术专业在浙江省位次大约在全省 12000-15000 名左右（对应分数为 635-645 分）。枫林星级公寓配备 4 人间上床下桌、独立卫浴与空调！',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'd-sample-2',
            username: 'parent_li',
            sessionTitle: '学费与奖学金咨询',
            question: '学校的软件工程专业一年学费多少？针对高分考生有什么奖学金支持？',
            reply: '家长您好！软件工程专业普通学年学费为 6000元/年。对于高考成绩在全省前 10000 名的优异考生，提供新生特等奖学金 20000 元及海外交流全额资助项目！',
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: 'd-sample-3',
            username: 'student_wang',
            sessionTitle: '宿舍环境与交通',
            question: '宿舍条件怎么样？有独立洗手间和24小时热水吗？离智慧图书馆远不远？',
            reply: '同学您好！宿舍为枫林学生公寓，统一上床下桌、独立阳台、干湿分离独立卫浴与24小时热水供应。公寓步行至主图书馆仅需 5 分钟！',
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
          },
          {
            id: 'd-sample-4',
            username: 'student_chen',
            sessionTitle: '保研与转专业政策',
            question: '入学后如果不喜欢当前专业，转专业的政策是怎样的？保研率高不高？',
            reply: '学校实行大类招生与灵活转专业政策，第一学年末零门槛申请转专业。全校平均保研率达 18%，重点工科专业保研率超过 25%！',
            timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
      }

      setAllUserDialogues(aggregatedDialogues);
      return aggregatedDialogues;
    } catch (err) {
      console.error('Failed to aggregate all user dialogues:', err);
      return [];
    }
  };

  const performIncrementalAnalysis = async (currentDbState: any, dialogues: any[]) => {
    if (!dialogues || dialogues.length === 0) return;

    const analyzedIds = new Set(currentDbState.analyzedMessageIds || []);
    
    // INCREMENTAL ONLY: Filter for unanalyzed new messages
    const newDialogues = dialogues.filter(d => !analyzedIds.has(d.id));

    // If no new messages, skip analysis entirely (avoid duplicate re-analysis)
    if (newDialogues.length === 0) {
      setNewlyAnalyzedCount(0);
      return;
    }

    const commonAdmissionsKeywords = [
      '录取线', '分数线', '专业', '学费', '宿舍', '奖学金', '位次', 
      '排名', '选科', '保研', '转专业', '食堂', '图书馆', '计算机', 
      '软件工程', '人工智能', '考研', '就业', '环境', '独立卫浴', '单招'
    ];

    const updatedCounts = { ...(currentDbState.wordCounts || {}) };
    const updatedAnalyzedIds = [...(currentDbState.analyzedMessageIds || [])];

    newDialogues.forEach(item => {
      const combinedText = `${item.question} ${item.reply}`;
      commonAdmissionsKeywords.forEach(kw => {
        const reg = new RegExp(kw, 'gi');
        const matches = combinedText.match(reg);
        if (matches) {
          updatedCounts[kw] = (updatedCounts[kw] || 0) + matches.length;
        }
      });

      const cleanQ = item.question.replace(/[^\u4e00-\u9fa5]/g, ' ');
      const tokens = cleanQ.split(/\s+/).filter(t => t.length >= 2 && t.length <= 4);
      tokens.forEach(t => {
        if (!['请问', '今年', '什么', '怎么', '多少', '可以', '有没有', '怎么样', '怎样', '如果'].includes(t)) {
          updatedCounts[t] = (updatedCounts[t] || 0) + 1;
        }
      });

      updatedAnalyzedIds.push(item.id);
    });

    const updatedDb = {
      analyzedMessageIds: updatedAnalyzedIds,
      wordCounts: updatedCounts,
      totalAnalyzedCount: (currentDbState.totalAnalyzedCount || 0) + newDialogues.length,
      lastAnalyzedAt: new Date().toISOString()
    };

    setWordAnalyticsDb(updatedDb);
    setNewlyAnalyzedCount(newDialogues.length);

    try {
      localStorage.setItem('aurasense_word_analytics_db', JSON.stringify(updatedDb));
    } catch (e) {}

    try {
      await fetch(`${API_BASE}/api/admin/word-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedDb })
      });
    } catch (e) {}
  };

  const filteredRagItems = useMemo(() => {
    return ragItems.filter(item => {
      const matchCat = ragCategoryFilter === 'ALL' || item.category === ragCategoryFilter;
      const q = ragSearchQuery.toLowerCase();
      const matchQ = !q || item.title?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q) || (item.tags || []).some((t: string) => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [ragItems, ragCategoryFilter, ragSearchQuery]);

  const fetchRagKnowledge = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/rag/items`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) {
        setRagItems(data.items);
      }
    } catch (e) {
      console.error('Failed to fetch RAG items', e);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('确定要删除此条知识库切片吗？')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/rag/items/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) fetchRagKnowledge();
    } catch (e) {
      console.error('Failed to delete RAG item', e);
    }
  };

  const fetchDashboardStats = async () => {
    setIsLoadingDashboard(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`);
      const data = await res.json();
      if (data.ok) {
        setDashboardStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats', e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const fetchSettingsConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/config`);
      const data = await res.json();
      if (data.ok && data.config) {
        setSettingsConfig((prev: any) => ({
          ...prev,
          baseUrl: data.config.aiBaseUrl || prev.baseUrl,
          defaultModel: data.config.defaultModel || prev.defaultModel,
          fastModel: data.config.fastModel || prev.fastModel,
          searchProvider: data.config.searchProvider || prev.searchProvider
        }));
      }
    } catch (e) {
      console.error('Failed to fetch settings config', e);
    }
  };

  const handleFetchModelsList = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/models`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModels(data.models);
      } else if (data.models) {
        setAvailableModels(data.models);
      }
    } catch (e) {
      console.error('Failed to fetch models list', e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaveMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsConfig)
      });
      const data = await res.json();
      if (data.ok) {
        setSettingsSaveMsg(data.message || '配置已成功保存并立即生效！');
        fetchDashboardStats();
      } else {
        setSettingsSaveMsg(`保存失败: ${data.error}`);
      }
    } catch (e: any) {
      setSettingsSaveMsg(`网络错误: ${e.message}`);
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    }
  };

  const handleRunRagTest = async () => {
    if (!ragTestQuery.trim()) return;
    setIsRagTesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragTestQuery.trim() })
      });
      const data = await res.json();
      setRagTestResults(data.matches || []);
    } catch (e) {
      console.error('RAG test failed', e);
    } finally {
      setIsRagTesting(false);
    }
  };

  const handleRunWebSearchTest = async () => {
    if (!webTestQuery.trim()) return;
    setIsWebTesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: webTestQuery.trim(), provider: webTestProvider })
      });
      const data = await res.json();
      setWebTestResults(data);
    } catch (e) {
      console.error('Web search test failed', e);
    } finally {
      setIsWebTesting(false);
    }
  };

  const handleOpenUserPersonalRag = (targetUsername: string) => {
    setAdminTargetUser(targetUsername);
    setIsPersonalRagOpen(true);
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      if (adminTab === 'dashboard') fetchDashboardStats();
      if (adminTab === 'rag') fetchRagKnowledge();
      if (adminTab === 'users') handleFetchRegisteredUsersServer();
      if (adminTab === 'settings') {
        fetchSettingsConfig();
        handleFetchModelsList();
      }
      if (adminTab === 'analytics') {
        (async () => {
          const dbState = await fetchWordAnalyticsDb() || {
            analyzedMessageIds: [],
            wordCounts: {},
            totalAnalyzedCount: 0,
            lastAnalyzedAt: null
          };
          const dialogues = fetchAllUserDialogues();
          performIncrementalAnalysis(dbState, dialogues);
        })();
      }
    }
  }, [currentUser, adminTab]);

  const highFrequencyWords = useMemo(() => {
    const counts = wordAnalyticsDb.wordCounts || {};
    return Object.entries(counts)
      .map(([word, count]) => ({ word, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [wordAnalyticsDb]);

  const handleToggleUserVip = (targetUsername: string) => {
    try {
      const pRaw = localStorage.getItem(`aurasense_profile_${targetUsername}`);
      let profile = pRaw ? JSON.parse(pRaw) : {};
      const newVip = !profile.isVip;
      profile = { ...profile, isVip: newVip };
      localStorage.setItem(`aurasense_profile_${targetUsername}`, JSON.stringify(profile));
      fetch(`${API_BASE}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername, profile })
      }).catch(() => {});
      fetchRegisteredUsers();
    } catch (err) {
      console.error('Failed to toggle VIP status', err);
    }
  };

  

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'user') return;
    const username = currentUser.username;
    fetch(`${API_BASE}/api/user/profile?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.profile) {
          setUserProfile(data.profile);
          localStorage.setItem(`aurasense_profile_${username}`, JSON.stringify(data.profile));
          if (!data.profile.name || !data.profile.score || !data.profile.province) {
            setIsProfileModalOpen(true);
          }
        } else {
          const saved = localStorage.getItem(`aurasense_profile_${username}`);
          if (saved) setUserProfile(JSON.parse(saved));
          else setIsProfileModalOpen(true);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem(`aurasense_profile_${username}`);
        if (saved) setUserProfile(JSON.parse(saved));
        else setIsProfileModalOpen(true);
      });
  }, [currentUser]);

  const handleSaveUserProfile = async (profileData) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, profile: profileData })
      });
      const data = await res.json();
      if (data.ok && data.profile) {
        setUserProfile(data.profile);
        localStorage.setItem(`aurasense_profile_${currentUser.username}`, JSON.stringify(data.profile));
        setIsProfileModalOpen(false);
      }
    } catch {
      setUserProfile(profileData);
      localStorage.setItem(`aurasense_profile_${currentUser.username}`, JSON.stringify(profileData));
      setIsProfileModalOpen(false);
    }
  };

  // --- Main App State & Sessions ---
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isMapGuideOpen, setIsMapGuideOpen] = useState(false);

  // Derived active session & messages
  const createDefaultSession = () => ({
    id: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: '新咨询对话',
    messages: INITIAL_MESSAGES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;
  const messages = activeSession ? (activeSession.messages || INITIAL_MESSAGES) : INITIAL_MESSAGES;

  // Sync session state to LocalStorage & Server Backend
  const syncSessions = (username, updatedSessions, targetActiveId) => {
    setSessions(updatedSessions);
    if (targetActiveId) {
      setActiveSessionId(targetActiveId);
      try {
        localStorage.setItem(`aurasense_active_session_${username}`, targetActiveId);
      } catch {}
    }
    try {
      localStorage.setItem(`aurasense_sessions_${username}`, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error('Failed to save sessions to local cache:', e);
    }

    // Async server backend sync
    fetch(`${API_BASE}/api/user/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, sessions: updatedSessions })
    }).catch(err => console.warn('Server session sync warn:', err.message));
  };

  // User session initialization on login or user switch
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'user') return;
    const username = currentUser.username;

    const initUserSessions = async () => {
      let loaded = [];
      try {
        const raw = localStorage.getItem(`aurasense_sessions_${username}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded = parsed;
          }
        }
      } catch {}

      try {
        const res = await fetch(`${API_BASE}/api/user/sessions?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.sessions) && data.sessions.length > 0) {
          loaded = data.sessions;
        }
      } catch {}

      if (loaded.length === 0) {
        loaded = [createDefaultSession()];
      }

      setSessions(loaded);
      const savedActive = localStorage.getItem(`aurasense_active_session_${username}`);
      if (savedActive && loaded.some(s => s.id === savedActive)) {
        setActiveSessionId(savedActive);
      } else {
        setActiveSessionId(loaded[0].id);
      }
    };

    initUserSessions();
  }, [currentUser]);

  // --- RAG Admin Modals State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState(null);
  
  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedChunks, setImportedChunks] = useState([]);
  const [chunkPreviewModeLegacy, setChunkPreviewModeLegacy] = useState('list'); // 'list' | 'edit'
  const [selectedChunkIndex, setSelectedChunkIndex] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      fetchRagItems();
    }
  }, [currentUser]);

  const fetchRagItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/rag`);
      const data = await res.json();
      if (data.ok) setRagItems(data.data || []);
    } catch (err) {
      console.error('Failed to fetch RAG items', err);
    }
  };

  const scrollToBottomIfNeeded = (force = false) => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    if (force || isNearBottom) {
      scrollRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'user') {
      scrollToBottomIfNeeded();
    }
  }, [messages.length, typing, currentUser]);

  // --- Login / Register Handlers ---
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setAuthError('请输入账号和密码');
      return;
    }

    if (u === 'admin' && p === 'admin123') {
      const adminUser = { username: 'admin', role: 'admin' };
      setCurrentUser(adminUser);
      localStorage.setItem('aurasense_logged_user', JSON.stringify(adminUser));
      return;
    }

    try {
      const usersRaw = localStorage.getItem('aurasense_registered_users');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const matched = users.find(user => user.username === u && user.password === p);

      if (matched) {
        const regularUser = { username: matched.username, role: 'user' };
        setCurrentUser(regularUser);
        localStorage.setItem('aurasense_logged_user', JSON.stringify(regularUser));
      } else {
        setAuthError('账号或密码不正确（管理员账号 admin / admin123）');
      }
    } catch {
      setAuthError('登录校验异常，请重试');
    }
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    const u = username.trim();
    const p = password.trim();
    const cp = confirmPassword.trim();

    if (!u || !p || !cp) {
      setAuthError('请完整填写所有注册项');
      return;
    }

    if (p !== cp) {
      setAuthError('两次输入的密码不一致');
      return;
    }

    if (u === 'admin') {
      setAuthError('admin 为系统预设管理员保留账号');
      return;
    }

    try {
      const usersRaw = localStorage.getItem('aurasense_registered_users');
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      if (users.some(user => user.username === u)) {
        setAuthError('该账号名已被注册，请更换账号名');
        return;
      }

      const newUser = { username: u, password: p, role: 'user' };
      users.push(newUser);
      localStorage.setItem('aurasense_registered_users', JSON.stringify(users));

      const userState = { username: u, role: 'user' };
      setCurrentUser(userState);
      localStorage.setItem('aurasense_logged_user', JSON.stringify(userState));
    } catch {
      setAuthError('注册保存失败，请重试');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aurasense_logged_user');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setAuthError('');
  };

  // --- Session Management Handlers ---
  const handleCreateNewSession = () => {
    if (!currentUser || currentUser.role !== 'user') return;
    const newSess = createDefaultSession();
    const updated = [newSess, ...sessions];
    syncSessions(currentUser.username, updated, newSess.id);
  };

  const handleSelectSession = (sessionId) => {
    if (!currentUser || currentUser.role !== 'user') return;
    setActiveSessionId(sessionId);
    try {
      localStorage.setItem(`aurasense_active_session_${currentUser.username}`, sessionId);
    } catch {}
  };

  const handleDeleteSession = (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser || currentUser.role !== 'user') return;

    let updated = sessions.filter(s => s.id !== sessionId);
    if (updated.length === 0) {
      updated = [createDefaultSession()];
    }

    let nextActiveId = activeSessionId;
    if (activeSessionId === sessionId) {
      nextActiveId = updated[0].id;
    }

    syncSessions(currentUser.username, updated, nextActiveId);

    fetch(`${API_BASE}/api/user/sessions/${sessionId}?username=${encodeURIComponent(currentUser.username)}`, {
      method: 'DELETE'
    }).catch(() => {});
  };

  // --- Chat Sender ---
  const handleSend = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const text = (overrideText || inputText).trim();
    if (!text || typing || !currentUser || !activeSession) return;

    setInputText('');
    const userMsg = { id: Date.now(), sender: 'user', text, instant: true };

    const currentMsgs = activeSession.messages || [];
    const updatedMsgs = [...currentMsgs, userMsg];

    // Automatic Titling for new session or default title
    let newTitle = activeSession.title;
    if (newTitle === '新咨询对话' || currentMsgs.length <= 1) {
      newTitle = text.length > 18 ? `${text.slice(0, 18)}...` : text;
    }

    const updatedSession = {
      ...activeSession,
      title: newTitle,
      messages: updatedMsgs,
      updatedAt: new Date().toISOString()
    };

    const updatedSessions = sessions.map(s => s.id === activeSession.id ? updatedSession : s);
    syncSessions(currentUser.username, updatedSessions, activeSession.id);
    setTyping(true);

    const historyForApi = updatedMsgs.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const response = await fetch(`${API_BASE}/api/aura/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser.username,
          userProfile,
          messages: historyForApi 
        })
      });

      const data = await response.json();
      const reply = data?.reply || '抱歉，我刚刚有些走神，请您再试一次。';

      const botMsg = { id: Date.now() + 1, sender: 'bot', text: reply, instant: true };
      const finalMsgs = [...updatedMsgs, botMsg];

      const finalSession = {
        ...updatedSession,
        messages: finalMsgs,
        updatedAt: new Date().toISOString()
      };

      const finalSessions = sessions.map(s => s.id === activeSession.id ? finalSession : s);
      syncSessions(currentUser.username, finalSessions, activeSession.id);
    } catch (err) {
      console.error(err);
      const errorMsg = { id: Date.now() + 1, sender: 'bot', text: '网络连接出现异常，请检查后端服务是否启动。', instant: true };
      const finalMsgs = [...updatedMsgs, errorMsg];
      const finalSession = {
        ...updatedSession,
        messages: finalMsgs,
        updatedAt: new Date().toISOString()
      };
      const finalSessions = sessions.map(s => s.id === activeSession.id ? finalSession : s);
      syncSessions(currentUser.username, finalSessions, activeSession.id);
    } finally {
      setTyping(false);
    }
  };

  const handleAskLocationQuestion = (queryText) => {
    setIsMapGuideOpen(false);
    handleSend(null, queryText);
  };

  // --- RAG CRUD Handlers ---
  const handleSaveRagItem = async (itemData) => {
    try {
      const url = itemData.id ? `${API_BASE}/api/admin/rag/${itemData.id}` : `${API_BASE}/api/admin/rag`;
      const method = itemData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (res.ok) {
        setIsEditing(false);
        setEditItem(null);
        fetchRagItems();
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDeleteRagItem = async (id) => {
    if (!window.confirm('确定删除该知识条目吗？')) return;
    try {
      await fetch(`${API_BASE}/api/admin/rag/${id}`, { method: 'DELETE' });
      fetchRagItems();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleTestRagSearch = async () => {
    if (!testQuery.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      });
      const data = await res.json();
      if (data.ok) setTestResults(data.matches || []);
    } catch (err) {
      console.error('Test query failed:', err);
    }
  };

  // --- Document Import & Batch Save Handlers ---
  const handleBatchSaveChunks = async (chunksToSave) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/rag/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunks: chunksToSave })
      });

      const data = await res.json();
      if (data.ok) {
        setIsImportModalOpen(false);
        setImportedChunks([]);
        fetchRagItems();
        alert(`🎉 成功保存 ${data.count} 个知识切片并完成本地 512 维向量计算！`);
      }
    } catch (err) {
      console.error('Batch save failed:', err);
    }
  };

  const oldFilteredRagItems = ragItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || (item.tags || []).some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className={`flex justify-center items-center h-screen ${THEME.bg} p-0 sm:p-6 selection:bg-indigo-100`}>
      
      {/* SCENE 1: Login / Register Page */}
      {!currentUser && (
        <div className={`w-full max-w-[400px] ${THEME.glass} sm:rounded-[40px] p-8 shadow-[0_45px_100px_rgba(186,175,215,0.4)] border-[6px] border-[#fdfcff] animate-in zoom-in-95 duration-500`}>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_10px_25px_rgba(179,164,237,0.4)] border-2 border-white mb-3">
              <BrainCircuit className="text-white" size={30} />
            </div>
            <h1 className="font-black text-[#4a4365] text-[22px] tracking-tight">Gzadm Navigator</h1>
            <p className="text-[11px] text-[#a494e8] font-bold tracking-wider mt-0.5">
              智能高效招生咨询
            </p>
          </div>

          <div className="flex bg-[#f0ebf8] p-1 rounded-2xl mb-5 text-[12px] font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-1.5 rounded-xl transition-all ${authMode === 'login' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'}`}
            >
              登录账号
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-1.5 rounded-xl transition-all ${authMode === 'register' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'}`}
            >
              标准注册
            </button>
            {settingsConfig.advancedAuthEnabled && (
              <button
                type="button"
                onClick={() => { setAuthMode('advanced_register'); setAuthError(''); }}
                className={`flex-1 py-1.5 rounded-xl transition-all ${authMode === 'advanced_register' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-600 hover:bg-purple-100'}`}
              >
                验证码注册
              </button>
            )}
          </div>

          {authError && (
            <div className="bg-red-50 text-red-500 text-[12px] p-3 rounded-2xl mb-4 font-bold border border-red-100 text-center animate-in fade-in">
              {authError}
            </div>
          )}

          {codeSendMsg && (
            <div className="bg-emerald-50 text-emerald-600 text-[11.5px] p-2.5 rounded-2xl mb-4 font-bold border border-emerald-100 text-center animate-in fade-in">
              {codeSendMsg}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : (authMode === 'advanced_register' ? handleAdvancedRegisterSubmit : handleRegister)} className="space-y-3.5">
            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">账号名</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={authMode === 'login' ? "输入账号 (管理员: admin)" : "设置注册账号名"}
                  className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                />
              </div>
            </div>

            {authMode === 'advanced_register' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[12px] font-bold text-[#4a4365]">验证类型</label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setRegTargetType('phone')}
                        className={`px-2 py-0.5 rounded-md font-bold ${regTargetType === 'phone' ? 'bg-purple-100 text-purple-700' : 'text-gray-400'}`}
                      >
                        📱 手机号
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegTargetType('email')}
                        className={`px-2 py-0.5 rounded-md font-bold ${regTargetType === 'email' ? 'bg-purple-100 text-purple-700' : 'text-gray-400'}`}
                      >
                        ✉️ 邮箱
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    {regTargetType === 'phone' ? <Globe size={16} className="absolute left-3.5 top-3.5 text-gray-400" /> : <Globe size={16} className="absolute left-3.5 top-3.5 text-gray-400" />}
                    <input
                      type={regTargetType === 'phone' ? 'tel' : 'email'}
                      value={regTarget}
                      onChange={(e) => setRegTarget(e.target.value)}
                      placeholder={regTargetType === 'phone' ? '输入11位手机号码' : '输入电子邮箱账号'}
                      className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#4a4365] block mb-1">验证码</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={regVerificationCode}
                      onChange={(e) => setRegVerificationCode(e.target.value)}
                      placeholder="6位验证码"
                      className="flex-1 bg-[#f8f6fc] border-none rounded-2xl px-4 py-3 text-[13px] font-mono outline-none focus:ring-2 focus:ring-[#a494e8]"
                    />
                    <button
                      type="button"
                      disabled={isSendingCode || codeCountdown > 0}
                      onClick={handleSendVerificationCode}
                      className="px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl text-[12px] font-bold shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {codeCountdown > 0 ? `${codeCountdown}s 后重发` : (isSendingCode ? '发送中...' : '获取验证码')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'login' ? "输入密码 (管理员: admin123)" : "设置登录密码"}
                  className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                />
              </div>
            </div>

            {authMode !== 'login' && (
              <div className="animate-in fade-in">
                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">确认密码</label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码确认"
                    className="w-full bg-[#f8f6fc] border-none rounded-2xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#4a4365] text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg hover:bg-[#342e49] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>{authMode === 'login' ? '立即登录' : '创建账号并登录'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* SCENE 2: Logged In Main Application */}
      {currentUser && (
        <div className={`w-full h-full ${currentUser.role === 'admin' ? 'sm:max-w-[1360px] sm:max-h-[920px]' : (isSidebarOpen ? 'sm:max-w-[960px]' : 'sm:max-w-[480px]')} sm:max-h-[880px] ${THEME.glass} flex flex-col sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500`}>
          
          <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
            
            {/* Header */}
            <header className="pt-8 pb-3 px-4 sm:px-8 flex items-center justify-between z-10 bg-white/40 backdrop-blur-md border-b border-white/60">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[16px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.4)] border-2 border-white">
                  <BrainCircuit className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="font-black text-[#4a4365] text-[15px] sm:text-[17px] tracking-tight">Gzadm Navigator</h1>
                  <p className="text-[9px] sm:text-[10px] text-[#a494e8] font-black uppercase tracking-widest">
                    {currentUser.role === 'admin' ? 'RAG Admin' : 'Admissions Counseling'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {currentUser.role === 'user' && (
                  <>
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className={`p-2 rounded-2xl transition-all border border-white flex items-center gap-1.5 text-[12px] font-bold ${
                        isSidebarOpen ? 'bg-[#4a4365] text-white shadow-sm' : 'bg-white/80 hover:bg-white text-[#4a4365]'
                      }`}
                      title={isSidebarOpen ? "隐藏历史对话" : "展开历史对话"}
                    >
                      <History size={16} />
                      <span className="hidden sm:inline">{isSidebarOpen ? "收起历史" : "历史对话"}</span>
                    </button>

                    <button
                      onClick={handleCreateNewSession}
                      className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(179,164,237,0.4)] flex items-center gap-1 text-[12px] font-bold"
                      title="新建对话"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">新建对话</span>
                    </button>
                    {/* VIP Personal RAG button removed from user side */}
                  </>
                )}

                {currentUser.role === 'user' ? (
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-1.5 bg-white/80 hover:bg-white px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white text-[12px] font-bold text-[#4a4365] transition-all shadow-xs"
                    title="点击查看/修改高考个人背景资料"
                  >
                    <User size={13} className="text-[#a494e8]" />
                    <span className="max-w-[70px] sm:max-w-[90px] truncate">{userProfile?.name || currentUser.username}</span>
                    {userProfile?.score ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-purple-100 text-purple-700">
                        {userProfile.score}分
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-md font-bold animate-pulse">未填资料</span>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white/80 px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white text-[12px] font-bold text-[#4a4365]">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="max-w-[70px] sm:max-w-[120px] truncate">{currentUser.username}</span>
                    <ShieldCheck size={14} className="sm:hidden text-purple-600" />
                    <span className="hidden sm:inline text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700">
                      管理员
                    </span>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  title="退出登录"
                  className="p-2 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </header>

            {/* VIEW A: Regular User - Student Admissions Chat View */}
            {currentUser.role === 'user' && (
              <div className="flex-1 flex overflow-hidden relative">
                
                {/* Left Sidebar: Session List */}
                {isSidebarOpen && (
                  <aside className="w-full sm:w-56 md:w-60 bg-white/40 backdrop-blur-md border-r border-white/60 flex flex-col p-3 gap-2 overflow-y-auto hide-scrollbar shrink-0 animate-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-gray-100/60">
                      <div className="flex items-center gap-1.5 text-[12px] font-black text-[#4a4365]">
                        <MessageSquare size={15} className="text-[#a494e8]" />
                        <span>对话记录 ({sessions.length})</span>
                      </div>
                      <button
                        onClick={handleCreateNewSession}
                        className="p-1 rounded-xl hover:bg-white text-[#a494e8] transition-colors"
                        title="新建对话"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {sessions.map((sess) => {
                        const isActive = sess.id === activeSessionId;
                        const msgCount = (sess.messages || []).length;
                        const lastMsg = (sess.messages || [])[msgCount - 1]?.text || '';
                        
                        return (
                          <div
                            key={sess.id}
                            onClick={() => handleSelectSession(sess.id)}
                            className={`group relative p-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-1 border ${
                              isActive 
                                ? 'bg-white shadow-[0_4px_20px_rgba(179,164,237,0.25)] border-[#d6cbf5]' 
                                : 'bg-white/40 hover:bg-white/80 border-transparent text-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden pr-6">
                                <MessageSquare size={14} className={isActive ? 'text-[#a494e8] shrink-0' : 'text-gray-400 shrink-0'} />
                                <span className={`text-[13px] truncate ${isActive ? 'font-bold text-[#4a4365]' : 'font-medium text-gray-700'}`}>
                                  {sess.title || '新咨询对话'}
                                </span>
                              </div>

                              <button
                                onClick={(e) => handleDeleteSession(sess.id, e)}
                                title="删除该对话"
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all absolute right-2 top-2.5"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-400 pl-5">
                              <span className="truncate max-w-[150px]">
                                {lastMsg ? lastMsg.replace(/[#*`]/g, '') : '暂无数据'}
                              </span>
                              <span>{msgCount} 条对话</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </aside>
                )}

                {/* Right Chat Main Body */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                  
                  {/* Current Active Conversation Bar */}
                  <div className="px-6 py-2.5 bg-white/30 backdrop-blur-sm border-b border-white/50 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2 text-[#4a4365]">
                      <span className="w-2 h-2 rounded-full bg-[#a494e8] animate-pulse" />
                      <span className="font-bold text-[13px] truncate max-w-[300px]">
                        {activeSession?.title || '新咨询对话'}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{activeSession?.updatedAt ? new Date(activeSession.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '当前激活'}</span>
                    </div>
                  </div>

                  <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-1 space-y-5 hide-scrollbar relative scroll-smooth">
                    {messages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const bubbleStyle = isUser ? THEME.userBubble : THEME.botBubble;

                      return (
                        <ChatMessageItem
                          key={msg.id}
                          msg={msg}
                          isUser={isUser}
                          bubbleStyle={bubbleStyle}
                          roleColor={ROLE.color}
                          roleAvatar={ROLE.avatar}
                          roleName={ROLE.name}
                        />
                      );
                    })}

                    {typing && (
                      <div className="flex justify-start items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <img src={ROLE.avatar} className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover" alt="typing" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                            <span className="text-[11px] font-black tracking-wider uppercase" style={{ color: ROLE.color }}>
                              {ROLE.name}
                            </span>
                            <span className="text-[10px] text-[#a494e8] font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 animate-pulse">
                              正在思考中
                            </span>
                          </div>
                          <div className="bg-white text-[#5c5478] shadow-[0_12px_30px_rgba(203,195,225,0.3)] px-5 py-3.5 rounded-[24px] rounded-tl-sm flex items-center gap-3 border border-purple-100">
                            <div className="flex gap-1.5 items-center">
                              <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-2 h-2 bg-[#a494e8] rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                            <span className="text-[13px] font-medium text-[#7a7398] animate-pulse">
                              正在为您检索知识库并分析生成解答...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </main>

                  {/* Low score interception banner removed from user view */}

                  <footer className="px-5 pb-6 pt-1 relative z-10">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-4 shadow-[0_-15px_45px_rgba(186,175,215,0.2)] border border-white">
                      <form onSubmit={handleSend} className="flex gap-2 items-center">
                        <button 
                          type="button"
                          onClick={() => setIsMapGuideOpen(true)}
                          className="group relative bg-[#f3eefc] hover:bg-[#a494e8] text-[#a494e8] hover:text-white p-3 rounded-[20px] active:scale-95 transition-all flex items-center justify-center border border-[#e4dcf8] shadow-sm shrink-0"
                          title="打开地图导览"
                        >
                          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#4a4365] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                            地图导览
                          </span>
                        </button>
                        <input 
                          value={inputText} 
                          onChange={(e) => setInputText(e.target.value)} 
                          placeholder="请输入您想咨询的入学、专业、学费问题..." 
                          className="flex-1 bg-[#f8f6fc] border-none rounded-[20px] px-5 py-3 text-[14px] focus:ring-2 focus:ring-[#a494e8] outline-none" 
                        />
                        <button 
                          type="submit" 
                          disabled={!inputText.trim() || typing}
                          className="bg-[#4a4365] text-white p-3 rounded-[20px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={20} />
                        </button>
                      </form>
                    </div>
                  </footer>

                </div>
              </div>
            )}

            {/* Map Guide Modal Popup */}
            <MapGuideModal
              locations={DEFAULT_CAMPUS_LOCATIONS}
              isOpen={isMapGuideOpen}
              onClose={() => setIsMapGuideOpen(false)}
              onAskQuestion={handleAskLocationQuestion}
            />

            {/* VIEW B: Admin User - Management Dashboard & Sidebar Console */}
            {currentUser.role === 'admin' && (
              <div className="flex-1 flex overflow-hidden w-full h-full bg-white/40">
                
                {/* 1. Left Fixed Admin Sidebar */}
                <aside className="w-56 sm:w-60 md:w-64 shrink-0 bg-white/80 backdrop-blur-xl border-r border-white/80 flex flex-col justify-between p-3.5 sm:p-4 z-20 shadow-xs">
                  {/* Top: Admin Identity Card & Nav Menu */}
                  <div className="space-y-4">
                    {/* Admin Profile Header */}
                    <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-purple-50/70 to-pink-50/70 rounded-2xl border border-purple-100/60 shadow-xs">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#b3a4ed] via-[#c7b8f9] to-[#f296b2] flex items-center justify-center text-white shadow-md font-black border-2 border-white">
                          <ShieldCheck size={20} />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="font-black text-[#4a4365] text-[13px] leading-tight truncate">超级管理员</div>
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>系统在线 (admin)</span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1">
                      {[
                        { id: 'dashboard', label: '数据大盘', icon: LayoutDashboard, desc: '指标监控与概览' },
                        { id: 'rag', label: '知识库管理', icon: Database, desc: 'RAG 向量与数据', badge: ragItems.length },
                        { id: 'users', label: '考生档案库', icon: User, desc: '考生画像与 VIP', badge: registeredUsersList.length },
                        { id: 'analytics', label: '消息与词频', icon: MessageSquare, desc: '咨询意向分析' },
                        { id: 'playground', label: '测试中心', icon: FlaskConical, desc: 'RAG 与联网诊断' },
                      ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = adminTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setAdminTab(tab.id as any)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#4a4365] text-white shadow-md font-bold'
                                : 'text-[#6d648b] hover:bg-white/90 hover:text-[#4a4365] font-semibold'
                            }`}
                          >
                            <Icon size={16} className={isActive ? 'text-[#c7b8f9]' : 'text-[#a494e8]'} />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12.5px] leading-none flex items-center justify-between">
                                <span>{tab.label}</span>
                                {typeof tab.badge === 'number' && (
                                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>
                                    {tab.badge}
                                  </span>
                                )}
                              </div>
                              <div className={`text-[10px] truncate mt-1 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                                {tab.desc}
                              </div>
                            </div>
                            {isActive && <ChevronRight size={13} className="text-[#c7b8f9]" />}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Bottom: Settings & Logout */}
                  <div className="space-y-1.5 pt-3 border-t border-purple-100/60">
                    <button
                      onClick={() => setAdminTab('settings')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                        adminTab === 'settings'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-bold'
                          : 'bg-purple-50/70 hover:bg-purple-100/70 text-[#4a4365] font-bold border border-purple-100/60'
                      }`}
                    >
                      <Settings size={16} className={adminTab === 'settings' ? 'text-white' : 'text-[#8b5cf6]'} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] leading-none">系统与模型配置</div>
                        <div className={`text-[10px] truncate mt-1 ${adminTab === 'settings' ? 'text-purple-100' : 'text-[#8b5cf6]'}`}>
                          API Key & 双模型网关
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-[11.5px] font-bold cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>退出管理后台</span>
                    </button>
                  </div>
                </aside>

                {/* 2. Right Main Content Area */}
                <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-white/40 via-purple-50/15 to-pink-50/15">
                  {/* Top Bar Header */}
                  <div className="px-6 py-3.5 bg-white/70 backdrop-blur-md border-b border-white/80 flex items-center justify-between z-10 shrink-0">
                    <div>
                      <h2 className="text-[15px] sm:text-[16px] font-black text-[#4a4365] flex items-center gap-2">
                        {adminTab === 'dashboard' && <><LayoutDashboard size={18} className="text-purple-500" /> 系统数据大盘 (Dashboard)</>}
                        {adminTab === 'rag' && <><Database size={18} className="text-purple-500" /> 知识库 RAG 集中管理</>}
                        {adminTab === 'users' && <><User size={18} className="text-purple-500" /> 考生档案与 VIP 策略</>}
                        {adminTab === 'analytics' && <><MessageSquare size={18} className="text-purple-500" /> 咨询意向与高频词分析</>}
                        {adminTab === 'playground' && <><FlaskConical size={18} className="text-purple-500" /> 检索与联网测试中心 (Playground)</>}
                        {adminTab === 'settings' && <><Settings size={18} className="text-purple-500" /> 系统模型与引擎配置 (Settings)</>}
                      </h2>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {adminTab === 'dashboard' && '实时监控 RAG 知识库容量、考生画像、本地向量引擎与服务健康'}
                        {adminTab === 'rag' && '支持录取分数线、专业介绍、宿舍环境实景图文与结构化表格切片'}
                        {adminTab === 'users' && '查看考生高考成绩、全省位次、选科情况与个性化记忆档案'}
                        {adminTab === 'analytics' && '自动聚合考生历史咨询对话，实时提取报考核心高频关注词汇'}
                        {adminTab === 'playground' && '深度诊断 RAG 向量相似度打分与 Tavily/博查/DuckDuckGo 全网实时搜索'}
                        {adminTab === 'settings' && '一键配置大模型 Base URL、API Key、默认/快速模型与搜索引擎'}
                      </p>
                    </div>

                    {/* Live Service Status Badges */}
                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-xl text-[11px] font-bold shadow-2xs">
                        <Cpu size={13} className="text-purple-500" />
                        <span>主模型: {dashboardStats?.aiGateway?.defaultModel || 'deepseek-chat'}</span>
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-[11px] font-bold shadow-2xs">
                        <Globe size={13} className="text-blue-500" />
                        <span>搜索: {dashboardStats?.searchEngine?.provider || 'duckduckgo'}</span>
                      </span>
                      <button
                        onClick={() => {
                          if (adminTab === 'dashboard') fetchDashboardStats();
                          if (adminTab === 'rag') fetchRagKnowledge();
                          if (adminTab === 'users') fetchRegisteredUsers();
                          if (adminTab === 'settings') { fetchSettingsConfig(); handleFetchModelsList(); }
                        }}
                        className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 hover:text-purple-600 transition-all border border-white shadow-2xs cursor-pointer"
                        title="刷新当前数据"
                      >
                        <RefreshCw size={15} className={isLoadingDashboard || isLoadingModels ? 'animate-spin text-purple-500' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Tab Contents (Scrollable Container) */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 hide-scrollbar">
                    
                    {/* ========================================================= */}
                    {/* TAB 1: 📊 DASHBOARD                                       */}
                    {/* ========================================================= */}
                    {adminTab === 'dashboard' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 4 Main KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center shrink-0">
                              <Database size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[22px] font-black text-[#4a4365] leading-tight">
                                {dashboardStats?.totalRagItems || ragItems.length}
                              </div>
                              <div className="text-[11.5px] font-medium text-gray-500">知识库总条目</div>
                              <div className="text-[10px] text-purple-600 font-bold mt-0.5">
                                表格 {ragItems.filter(i => i.type === 'table').length} · 图文 {ragItems.filter(i => (i.imageAttachments?.length || 0) > 0).length}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                              <User size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[22px] font-black text-[#4a4365] leading-tight">
                                {dashboardStats?.totalUsers || registeredUsersList.length || 1}
                              </div>
                              <div className="text-[11.5px] font-medium text-gray-500">注册考生总数</div>
                              <div className="text-[10px] text-pink-600 font-bold mt-0.5">
                                VIP 优先考生: {dashboardStats?.vipUsers || 0} 位
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Zap size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[16px] font-black text-[#4a4365] leading-tight truncate">
                                BGE-small-zh
                              </div>
                              <div className="text-[11.5px] font-medium text-gray-500">512 维向量引擎</div>
                              <div className="text-[10px] text-indigo-600 font-bold mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 本地 ONNX 毫秒召回
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4.5 border border-white shadow-xs hover:shadow-md transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <Cpu size={24} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[15px] font-black text-[#4a4365] leading-tight truncate">
                                {dashboardStats?.aiGateway?.defaultModel || 'deepseek-chat'}
                              </div>
                              <div className="text-[11.5px] font-medium text-gray-500">默认对话模型</div>
                              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                快速模型: {dashboardStats?.aiGateway?.fastModel || 'deepseek-chat'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle Section: Category Breakdown & Infrastructure Status */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                          {/* 1. Category Breakdown */}
                          <div className="lg:col-span-2 bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                                <Database size={16} className="text-purple-500" />
                                <span>知识库分类分布与覆盖度</span>
                              </div>
                              <span className="text-[11px] text-gray-400 font-bold">
                                共 {Object.keys(dashboardStats?.categoryBreakdown || {}).length || 6} 个核心大类
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {Object.entries(dashboardStats?.categoryBreakdown || {
                                '录取分数': 4,
                                '专业特色': 5,
                                '宿舍环境': 3,
                                '学费与资助': 2,
                                '生活设施': 2,
                                '常规问答': 2
                              }).map(([cat, count]: any, idx) => {
                                const total = dashboardStats?.totalRagItems || ragItems.length || 1;
                                const pct = Math.round((Number(count) / total) * 100);
                                const colors = ['from-purple-500 to-indigo-500', 'from-blue-500 to-cyan-500', 'from-pink-500 to-rose-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-violet-500 to-purple-500'];
                                const barColor = colors[idx % colors.length];

                                return (
                                  <div key={cat} className="p-3 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 space-y-2">
                                    <div className="flex items-center justify-between text-[12px] font-bold text-[#4a4365]">
                                      <span>{cat}</span>
                                      <span className="text-purple-600">{count} 条</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div className={`h-full bg-gradient-to-r ${barColor} rounded-full`} style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium text-right">占比 {pct}%</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Infrastructure Health Status */}
                          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                            <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                              <Activity size={16} className="text-emerald-500" />
                              <span>系统基础设施运行状态</span>
                            </div>

                            <div className="space-y-2.5">
                              {[
                                { name: 'PostgreSQL 向量库', desc: 'pgvector 扩展 (Port 35432)', status: '已连接 · 活跃', isOk: true },
                                { name: 'Redis 高速缓存', desc: 'RAG 与文档切片二级缓存', status: '已就绪 (TTL 30m)', isOk: true },
                                { name: '本地 BGE 向量模型', desc: 'ONNX Runtime (512-dim)', status: '已加载 (0.1s)', isOk: true },
                                { name: '多源联网搜索', desc: `${dashboardStats?.searchEngine?.provider || 'DuckDuckGo'} 引擎就绪`, status: '自动容灾兜底', isOk: true },
                              ].map((item, i) => (
                                <div key={i} className="p-2.5 bg-[#fbf9fe] rounded-2xl border border-purple-50/80 flex items-center justify-between">
                                  <div className="min-w-0">
                                    <div className="text-[12px] font-bold text-[#4a4365]">{item.name}</div>
                                    <div className="text-[10px] text-gray-400 truncate">{item.desc}</div>
                                  </div>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {item.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Quick Action Shortcuts */}
                        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3">
                          <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-500" />
                            <span>常用管理与测试快捷入口</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                              onClick={() => { setAdminTab('rag'); setIsAddModalOpen(true); }}
                              className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-2xl border border-purple-100/80 text-left transition-all group cursor-pointer"
                            >
                              <Plus size={18} className="text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                              <div className="font-bold text-[13px] text-[#4a4365]">添加知识条目</div>
                              <div className="text-[10.5px] text-gray-400 mt-0.5">录入文本或表格数据</div>
                            </button>

                            <button
                              onClick={() => { setAdminTab('rag'); setIsDocumentChunkModalOpen(true); }}
                              className="p-3.5 bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 rounded-2xl border border-pink-100/80 text-left transition-all group cursor-pointer"
                            >
                              <FileUp size={18} className="text-pink-600 mb-1 group-hover:scale-110 transition-transform" />
                              <div className="font-bold text-[13px] text-[#4a4365]">AI 文档智能切片</div>
                              <div className="text-[10.5px] text-gray-400 mt-0.5">由快速模型驱动切分</div>
                            </button>

                            <button
                              onClick={() => setAdminTab('playground')}
                              className="p-3.5 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border border-blue-100/80 text-left transition-all group cursor-pointer"
                            >
                              <FlaskConical size={18} className="text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                              <div className="font-bold text-[13px] text-[#4a4365]">检索与测试中心</div>
                              <div className="text-[10.5px] text-gray-400 mt-0.5">RAG精测与联网诊断</div>
                            </button>

                            <button
                              onClick={() => setAdminTab('settings')}
                              className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-2xl border border-amber-100/80 text-left transition-all group cursor-pointer"
                            >
                              <Settings size={18} className="text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                              <div className="font-bold text-[13px] text-[#4a4365]">系统模型配置</div>
                              <div className="text-[10.5px] text-gray-400 mt-0.5">API Key 与搜索引擎</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: 📚 KNOWLEDGE BASE (RAG)                            */}
                    {/* ========================================================= */}
                    {adminTab === 'rag' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Top Stats Bar */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#a494e8] flex items-center justify-center font-bold">
                              <Database size={20} />
                            </div>
                            <div>
                              <div className="text-[18px] font-black text-[#4a4365]">{ragItems.length}</div>
                              <div className="text-[11px] font-medium text-[#8a84a4]">知识库总条目</div>
                            </div>
                          </div>

                          <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center font-bold">
                              <Table size={20} />
                            </div>
                            <div>
                              <div className="text-[18px] font-black text-[#4a4365]">{ragItems.filter(i => i.type === 'table').length}</div>
                              <div className="text-[11px] font-medium text-[#8a84a4]">结构化表格</div>
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
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  chunkPreviewMode === 'list' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-400'
                                }`}
                              >
                                卡片
                              </button>
                              <button
                                onClick={() => setChunkPreviewMode('table')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  chunkPreviewMode === 'table' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-gray-400'
                                }`}
                              >
                                表格
                              </button>
                            </div>

                            <button
                              onClick={() => setIsDocumentChunkModalOpen(true)}
                              className="bg-gradient-to-r from-pink-500 to-rose-400 text-white px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                            >
                              <FileUp size={14} /> AI智能切片
                            </button>

                            <button
                              onClick={() => setIsTableParserModalOpen(true)}
                              className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                            >
                              <Table size={14} /> 表格解析
                            </button>

                            <button
                              onClick={() => {
                                setEditingItem(null);
                                setIsAddModalOpen(true);
                              }}
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
                                      {item.imageAttachments?.map((img: any, idx: number) => (
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
                                    {(item.tags || []).slice(0, 3).map((tag: string, tIdx: number) => (
                                      <span key={tIdx} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingItem(item);
                                        setIsAddModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all cursor-pointer"
                                      title="编辑此条目"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKnowledge(item.id)}
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
                                        onClick={() => {
                                          setEditingItem(item);
                                          setIsAddModalOpen(true);
                                        }}
                                        className="p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteKnowledge(item.id)}
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
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: 👥 USER PROFILES & VIP STRATEGY                    */}
                    {/* ========================================================= */}
                    {adminTab === 'users' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Threshold Control Card */}
                        <div className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <div>
                              <h3 className="font-black text-[#4a4365] text-[14px]">
                                高考分数分流与个性化策略阈值
                              </h3>
                              <p className="text-[11px] text-[#8a84a4]">
                                控制咨询过程中针对不同分段考生的智能策略介入与 VIP 记忆通道
                              </p>
                            </div>
                            <button
                              onClick={() => setInterceptionEnabled(!interceptionEnabled)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                interceptionEnabled
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {interceptionEnabled ? '分流策略已启用' : '策略已暂停'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-[#f8f6fc] p-3.5 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold text-[#4a4365]">压线风险拦截阈值</span>
                                <span className="text-[13px] font-black text-rose-500">{lowScoreThreshold} 分</span>
                              </div>
                              <input
                                type="range"
                                min="300"
                                max="600"
                                value={lowScoreThreshold}
                                onChange={(e) => setLowScoreThreshold(Number(e.target.value))}
                                className="w-full accent-rose-500 cursor-pointer"
                              />
                              <p className="text-[10px] text-gray-400">高考分数低于此值的考生，系统将自动强化保底方案推荐</p>
                            </div>

                            <div className="bg-[#f8f6fc] p-3.5 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold text-[#4a4365]">VIP 专属定制通道阈值</span>
                                <span className="text-[13px] font-black text-purple-600">{vipScoreThreshold} 分</span>
                              </div>
                              <input
                                type="range"
                                min="500"
                                max="700"
                                value={vipScoreThreshold}
                                onChange={(e) => setVipScoreThreshold(Number(e.target.value))}
                                className="w-full accent-purple-600 cursor-pointer"
                              />
                              <p className="text-[10px] text-gray-400">高考分数高于此值的考生，自动开启高分位次精细化分析</p>
                            </div>
                          </div>
                        </div>

                        {/* User List Header & Search */}
                        <div className="flex items-center justify-between bg-white/80 p-3 rounded-2xl border border-white shadow-xs">
                          <div className="relative flex-1 sm:w-64">
                            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                              type="text"
                              value={adminUserSearch}
                              onChange={(e) => setAdminUserSearch(e.target.value)}
                              placeholder="搜索用户名、姓名、高考省份..."
                              className="w-full bg-[#f8f6fc] pl-9 pr-4 py-2 rounded-xl text-[12px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#a494e8] px-3">
                            共 {registeredUsersList.length} 位注册考生
                          </span>
                        </div>

                        {/* Registered User Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {registeredUsersList
                            .filter(u => 
                              !adminUserSearch || 
                              u.username?.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
                              u.profile?.name?.includes(adminUserSearch) ||
                              u.profile?.province?.includes(adminUserSearch)
                            )
                            .map(u => {
                              const isVip = u.profile?.isVip || (typeof u.profile?.score === 'number' && u.profile.score >= vipScoreThreshold);
                              return (
                                <div key={u.username} className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[12px]">
                                          {u.profile?.name ? u.profile.name[0] : u.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="font-bold text-[#4a4365] text-[13px]">{u.profile?.name || u.username}</div>
                                          <div className="text-[10px] text-gray-400">账号: {u.username}</div>
                                        </div>
                                      </div>
                                      
                                      <button
                                        onClick={() => handleToggleUserVip(u.username)}
                                        className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                          isVip ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-purple-50'
                                        }`}
                                      >
                                        <Sparkles size={12} /> {isVip ? 'VIP 考生' : '设为 VIP'}
                                      </button>
                                    </div>

                                    {u.profile && Object.keys(u.profile).length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f8f6fc] p-3 rounded-2xl">
                                        <div>高考省份: <span className="font-bold text-[#4a4365]">{u.profile.province || '-'}</span></div>
                                        <div>高考成绩: <span className="font-bold text-purple-600">{u.profile.score ? `${u.profile.score} 分` : '-'}</span></div>
                                        <div>全省排名: <span className="font-bold text-[#4a4365]">{u.profile.rank ? `第 ${u.profile.rank} 名` : '-'}</span></div>
                                        <div>选科组合: <span className="font-bold text-[#4a4365]">{u.profile.subjects || '-'}</span></div>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-gray-400 bg-[#f8f6fc] p-3 rounded-2xl text-center">
                                        该考生尚未填写高考背景资料
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-[10px] text-gray-400">
                                      注册时间: {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : '预设'}
                                    </span>
                                    <button
                                      onClick={() => handleOpenUserPersonalRag(u.username)}
                                      className="text-purple-600 hover:text-purple-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      查看考生偏好记忆 <ChevronRight size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: 📈 ANALYTICS & DIALOGUES                           */}
                    {/* ========================================================= */}
                    {adminTab === 'analytics' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Word Frequency Analytics Card */}
                        <div className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <div>
                              <h3 className="font-black text-[#4a4365] text-[14px]">
                                考生咨询高频关键词意向分析
                              </h3>
                              <p className="text-[11px] text-[#8a84a4]">
                                基于全部历史对话记录自动增量提取的核心关注热词
                              </p>
                            </div>
                            <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                              已分析 {wordAnalyticsDb.totalAnalyzedCount} 条对话
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {highFrequencyWords.length === 0 ? (
                              <div className="text-gray-400 text-[12px] py-4">暂无高频词统计数据</div>
                            ) : (
                              highFrequencyWords.map((item, idx) => {
                                const isSelected = adminMessageSearch === item.word;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setAdminMessageSearch(isSelected ? '' : item.word)}
                                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#4a4365] text-white shadow-sm'
                                        : 'bg-[#f8f6fc] text-[#4a4365] hover:bg-purple-100'
                                    }`}
                                  >
                                    <span>#{item.word}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/60 text-purple-700">
                                      {item.count}次
                                    </span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Dialogue Records View */}
                        <div className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <h3 className="font-black text-[#4a4365] text-[14px]">
                              全网考生咨询问答记录明细
                            </h3>
                            <div className="relative w-56">
                              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                              <input
                                type="text"
                                value={adminMessageSearch}
                                onChange={(e) => setAdminMessageSearch(e.target.value)}
                                placeholder="搜索问答内容..."
                                className="w-full bg-[#f8f6fc] pl-8 pr-4 py-1.5 rounded-xl text-[11.5px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                              />
                            </div>
                          </div>

                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                            {allUserDialogues
                              .filter(d => 
                                !adminMessageSearch ||
                                d.question.toLowerCase().includes(adminMessageSearch.toLowerCase()) ||
                                d.reply.toLowerCase().includes(adminMessageSearch.toLowerCase()) ||
                                d.username.toLowerCase().includes(adminMessageSearch.toLowerCase())
                              )
                              .map(d => (
                                <div key={d.id} className="bg-white/90 rounded-2xl p-4 border border-white shadow-2xs space-y-2.5 hover:border-purple-200 transition-all">
                                  <div className="flex items-center justify-between border-b pb-1.5 border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-purple-100 text-purple-700 text-[10.5px] px-2 py-0.5 rounded-md font-bold">
                                        {d.username}
                                      </span>
                                      <span className="text-gray-400 text-[10px]">会话: {d.sessionTitle}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(d.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-[12.5px] font-bold text-[#4a4365]">
                                    问: {d.question}
                                  </div>
                                  {d.reply && (
                                    <div className="text-[12px] text-gray-600 bg-purple-50/40 p-2.5 rounded-xl leading-relaxed">
                                      答: {d.reply}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: 🧪 PLAYGROUND & SEARCH TESTING                      */}
                    {/* ========================================================= */}
                    {adminTab === 'playground' && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                        {/* Sub-tab switcher */}
                        <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-white shadow-2xs w-fit">
                          <button
                            onClick={() => setPlaygroundTab('rag')}
                            className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              playgroundTab === 'rag'
                                ? 'bg-[#4a4365] text-white shadow-sm'
                                : 'text-[#6d648b] hover:bg-white'
                            }`}
                          >
                            <Database size={15} /> 1. 校方 RAG 知识库检索诊断
                          </button>
                          <button
                            onClick={() => setPlaygroundTab('web')}
                            className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              playgroundTab === 'web'
                                ? 'bg-[#4a4365] text-white shadow-sm'
                                : 'text-[#6d648b] hover:bg-white'
                            }`}
                          >
                            <Globe size={15} /> 2. 全网多源联网搜索实时测试
                          </button>
                        </div>

                        {/* Sub-view A: RAG Diagnostic Testing */}
                        {playgroundTab === 'rag' && (
                          <div className="space-y-5">
                            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                              <div>
                                <h3 className="font-black text-[#4a4365] text-[14px]">校方 RAG 检索精准度与自适应截断诊断</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  测试分词 Token 拆解、512 维向量余弦相似度门槛（≥0.50）以及相对最高分差（≥70%）动态截断
                                </p>
                              </div>

                              {/* Quick Search Chips */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-gray-400 font-bold">推荐测试查询:</span>
                                {['浙江 计算机 分数线', '宿舍四人间 空调 独卫', '工科 学费 奖学金', '计算机 选科要求', '转专业 政策'].map(q => (
                                  <button
                                    key={q}
                                    onClick={() => { setRagTestQuery(q); }}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>

                              {/* Search Bar Input */}
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                  <input
                                    type="text"
                                    value={ragTestQuery}
                                    onChange={(e) => setRagTestQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRunRagTest()}
                                    placeholder="输入要测试的知识库查询词，例如“浙江 计算机 录取分数”..."
                                    className="w-full bg-[#f8f6fc] pl-10 pr-4 py-2.5 rounded-2xl text-[13px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                  />
                                </div>
                                <button
                                  onClick={handleRunRagTest}
                                  disabled={isRagTesting}
                                  className="bg-gradient-to-r from-[#b3a4ed] to-[#c7b8f9] text-white px-5 py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  {isRagTesting ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
                                  <span>{isRagTesting ? '正在诊断...' : '执行诊断'}</span>
                                </button>
                              </div>
                            </div>

                            {/* RAG Test Results */}
                            {ragTestResults && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                  <span className="text-[12px] font-bold text-[#4a4365]">
                                    检索命中结果 ({ragTestResults.length} 条高相关项)
                                  </span>
                                  <span className="text-[11px] text-purple-600 font-bold">
                                    {ragTestResults.length > 0 ? '✅ 顺利通过绝对阈值与自适应截断' : '⚠️ 未命中高相关条目 (自适应过滤生效)'}
                                  </span>
                                </div>

                                {ragTestResults.length === 0 ? (
                                  <div className="bg-white/80 rounded-3xl p-8 text-center text-gray-400 font-bold border border-white">
                                    未检索到匹配的校方知识条目（已自动过滤弱相关与无关内容，防止大模型幻觉污染）。
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {ragTestResults.map((match, idx) => (
                                      <div key={idx} className="bg-white/90 rounded-3xl p-5 border border-white shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center">
                                              #{idx + 1}
                                            </span>
                                            <span className="font-bold text-[#4a4365] text-[14px]">
                                              {match.item.title}
                                            </span>
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                                              {match.item.category}
                                            </span>
                                          </div>
                                          <span className="text-[12px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                                            综合得分: {match.score?.toFixed ? match.score.toFixed(2) : match.score}
                                          </span>
                                        </div>

                                        <p className="text-[12px] text-gray-600 leading-relaxed bg-[#fbf9fe] p-3 rounded-2xl border border-purple-50/60">
                                          {match.item.content}
                                        </p>

                                        {(match.item.imageAttachments?.length || 0) > 0 && (
                                          <div className="flex items-center gap-2 pt-1">
                                            {match.item.imageAttachments.map((img: any, i: number) => (
                                              <img key={i} src={img.url} alt={img.caption} className="w-16 h-16 object-cover rounded-xl border" />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sub-view B: Live Web Search Testing */}
                        {playgroundTab === 'web' && (
                          <div className="space-y-5">
                            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                              <div>
                                <h3 className="font-black text-[#4a4365] text-[14px]">全网多源搜索引擎实时测试</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  测试 Tavily、博查 AI 与 DuckDuckGo（免 Key 自动容灾兜底）的实时互联网抓取与内容清洗
                                </p>
                              </div>

                              {/* Quick Search Chips */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-gray-400 font-bold">推荐热搜词:</span>
                                {['2025 全国高考报考人数', '计算机专业最新就业薪资中位数', '大湾区 高校 优势专业', '教育部 选科 新政策'].map(q => (
                                  <button
                                    key={q}
                                    onClick={() => { setWebTestQuery(q); }}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>

                              {/* Engine Provider & Input Bar */}
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <select
                                  value={webTestProvider}
                                  onChange={(e) => setWebTestProvider(e.target.value)}
                                  className="bg-[#f8f6fc] text-[#4a4365] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold outline-none cursor-pointer border border-purple-50 w-full sm:w-auto"
                                >
                                  <option value="duckduckgo">DuckDuckGo (免 Key 默认兜底)</option>
                                  <option value="tavily">Tavily (AI 原生深度搜索)</option>
                                  <option value="bocha">博查 AI (国内中文政策优化)</option>
                                </select>

                                <div className="relative flex-1 w-full">
                                  <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                                  <input
                                    type="text"
                                    value={webTestQuery}
                                    onChange={(e) => setWebTestQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRunWebSearchTest()}
                                    placeholder="输入要联网搜索的关键词..."
                                    className="w-full bg-[#f8f6fc] pl-10 pr-4 py-2.5 rounded-2xl text-[13px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                  />
                                </div>

                                <button
                                  onClick={handleRunWebSearchTest}
                                  disabled={isWebTesting}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center cursor-pointer"
                                >
                                  {isWebTesting ? <RefreshCw size={15} className="animate-spin" /> : <Globe size={15} />}
                                  <span>{isWebTesting ? '正在全网搜索...' : '发起搜索'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Web Search Results */}
                            {webTestResults && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-[#4a4365]">
                                      搜索结果 ({webTestResults.count || (webTestResults.results || []).length} 条)
                                    </span>
                                    <span className="text-[10.5px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                                      引擎: {webTestResults.provider}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-400 font-bold">
                                    耗时: {webTestResults.elapsedMs} ms
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {(webTestResults.results || []).map((res: any, idx: number) => (
                                    <div key={idx} className="bg-white/90 rounded-3xl p-4.5 border border-white shadow-xs space-y-2 hover:border-blue-200 transition-all">
                                      <div className="flex items-start justify-between gap-3">
                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="font-bold text-[#4a4365] text-[13.5px] hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                        >
                                          <span>{idx + 1}. {res.title}</span>
                                          <ExternalLink size={13} className="text-gray-400 shrink-0" />
                                        </a>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md shrink-0 font-medium">
                                          {res.source || 'web'}
                                        </span>
                                      </div>

                                      <p className="text-[12px] text-gray-600 leading-relaxed bg-[#f8faff] p-3 rounded-2xl border border-blue-50/60">
                                        {res.snippet || '暂无摘要'}
                                      </p>

                                      <div className="text-[10px] text-blue-500 truncate">
                                        {res.url}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 6: ⚙️ SETTINGS & MODEL GATEWAY                        */}
                    {/* ========================================================= */}
                    {adminTab === 'settings' && (
                      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
                        {/* Status Alert Message */}
                        {settingsSaveMsg && (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-[13px] font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                            <span>{settingsSaveMsg}</span>
                          </div>
                        )}

                        {/* Section 1: AI Provider Presets */}
                        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                          <div>
                            <h3 className="font-black text-[#4a4365] text-[14px]">1. 快捷选择大模型服务商预设</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              点击厂商将自动填充标准 Base URL 与推荐模型，仅需输入对应的 API Key 即可
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { name: 'DeepSeek (深度求索)', url: 'https://api.deepseek.com', model: 'deepseek-chat' },
                              { name: 'OpenAI (Official)', url: 'https://api.openai.com/v1', model: 'gpt-4o' },
                              { name: '阿里通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' },
                              { name: '硅基流动', url: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' },
                              { name: '智谱清言 GLM', url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-plus' },
                              { name: '月之暗面 Kimi', url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
                              { name: 'OpenAI 兼容 (自定义)', url: 'http://localhost:11434/v1', model: 'gpt-4o' }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSettingsConfig((prev: any) => ({
                                    ...prev,
                                    baseUrl: preset.url,
                                    defaultModel: preset.model,
                                    fastModel: preset.model
                                  }));
                                }}
                                className="p-3 bg-[#fbf9fe] hover:bg-purple-50 border border-purple-50/80 rounded-2xl text-left transition-all group cursor-pointer"
                              >
                                <div className="font-bold text-[12px] text-[#4a4365] group-hover:text-purple-700">{preset.name}</div>
                                <div className="text-[9.5px] text-gray-400 truncate mt-0.5">{preset.model}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Section 2: AI Gateway & Models */}
                        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-black text-[#4a4365] text-[14px]">2. AI 模型网关与双模型分配</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                配置主对话模型（回复考生）与轻量快速模型（文档智能切片与后台分析）
                              </p>
                            </div>
                            <button
                              onClick={handleFetchModelsList}
                              disabled={isLoadingModels}
                              className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <RefreshCw size={13} className={isLoadingModels ? 'animate-spin' : ''} />
                              <span>一键拉取可用模型</span>
                            </button>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">接口地址 (Base URL)</label>
                              <input
                                type="text"
                                value={settingsConfig.baseUrl}
                                onChange={(e) => setSettingsConfig({ ...settingsConfig, baseUrl: e.target.value })}
                                placeholder="例如 https://api.deepseek.com 或 https://api.openai.com/v1"
                                className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                              />
                            </div>

                            <div>
                              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">API Key (留空表示不修改)</label>
                              <input
                                type="password"
                                value={settingsConfig.apiKey}
                                onChange={(e) => setSettingsConfig({ ...settingsConfig, apiKey: e.target.value })}
                                placeholder="sk-••••••••••••••••"
                                className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                              <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">
                                  💬 默认主对话模型 (DEFAULT_MODEL)
                                </label>
                                {availableModels.length > 0 ? (
                                  <select
                                    value={settingsConfig.defaultModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, defaultModel: e.target.value })}
                                    className="w-full bg-[#f8f6fc] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                  >
                                    {availableModels.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={settingsConfig.defaultModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, defaultModel: e.target.value })}
                                    placeholder="deepseek-chat"
                                    className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                                  />
                                )}
                              </div>

                              <div>
                                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">
                                  ⚡ 快速处理模型 (FAST_MODEL)
                                </label>
                                {availableModels.length > 0 ? (
                                  <select
                                    value={settingsConfig.fastModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, fastModel: e.target.value })}
                                    className="w-full bg-[#f8f6fc] px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                                  >
                                    {availableModels.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={settingsConfig.fastModel}
                                    onChange={(e) => setSettingsConfig({ ...settingsConfig, fastModel: e.target.value })}
                                    placeholder="deepseek-chat"
                                    className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Web Search Engine Configuration */}
                        <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                          <div>
                            <h3 className="font-black text-[#4a4365] text-[14px]">3. 联网搜索引擎选配</h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              选配宏观高考政策与全网资讯搜索引擎（未配置或异常时自动由 DuckDuckGo 免Key 兜底）
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { id: 'duckduckgo', name: 'DuckDuckGo', note: '免 Key 免费开箱即用 · 默认' },
                              { id: 'tavily', name: 'Tavily', note: 'AI 原生搜索 · 需填 Key' },
                              { id: 'bocha', name: '博查 AI', note: '国内政策深度优化 · 需填 Key' },
                            ].map(eng => {
                              const isSelected = settingsConfig.searchProvider === eng.id;
                              return (
                                <button
                                  key={eng.id}
                                  onClick={() => setSettingsConfig({ ...settingsConfig, searchProvider: eng.id })}
                                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                                      : 'bg-[#fbf9fe] border-purple-50/60 hover:bg-purple-50/40'
                                  }`}
                                >
                                  <div className="font-bold text-[13px] text-[#4a4365] flex items-center justify-between">
                                    <span>{eng.name}</span>
                                    {isSelected && <span className="w-2 h-2 rounded-full bg-purple-600" />}
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-1">{eng.note}</div>
                                </button>
                              );
                            })}
                          </div>

                          {settingsConfig.searchProvider === 'tavily' && (
                            <div className="pt-2 animate-in fade-in">
                              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">Tavily API Key (tvly-...)</label>
                              <input
                                type="password"
                                value={settingsConfig.tavilyApiKey}
                                onChange={(e) => setSettingsConfig({ ...settingsConfig, tavilyApiKey: e.target.value })}
                                placeholder="tvly-••••••••••••••••"
                                className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                              />
                            </div>
                          )}

                          {settingsConfig.searchProvider === 'bocha' && (
                            <div className="pt-2 animate-in fade-in">
                              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">博查 (Bocha) API Key</label>
                              <input
                                type="password"
                                value={settingsConfig.bochaApiKey}
                                onChange={(e) => setSettingsConfig({ ...settingsConfig, bochaApiKey: e.target.value })}
                                placeholder="bocha-key-••••••••••••••••"
                                className="w-full bg-[#f8f6fc] px-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none"
                              />
                            </div>
                          )}
                        </div>

                        {/* Save Button Bar */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="bg-[#4a4365] hover:bg-[#342e49] text-white px-7 py-3 rounded-2xl font-bold text-[14px] shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            {isSavingSettings ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                            <span>{isSavingSettings ? '正在保存...' : '保存配置并立即生效'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </main>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Admin 1: Edit User Account Info */}
      {editingUserModal && (
        <AdminEditUserModal
          user={editingUserModal}
          onClose={() => setEditingUserModal(null)}
          onSave={handleAdminSaveUserUpdate}
        />
      )}

      {/* Modal Admin 2: Reset User Password with Bcrypt */}
      {passwordResetModal && (
        <AdminResetPasswordModal
          user={passwordResetModal}
          onClose={() => setPasswordResetModal(null)}
          onSave={handleAdminSaveUserUpdate}
        />
      )}

      {/* Modal 0: User Background Profile Entry Form */}
      <UserProfileModal
        profile={userProfile}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveUserProfile}
      />

      {/* Modal VIP: Personal RAG Memory Database Viewer */}
      <PersonalRagModal
        username={adminTargetUser || currentUser?.username}
        isOpen={isPersonalRagOpen}
        onClose={() => {
          setIsPersonalRagOpen(false);
          setAdminTargetUser(null);
        }}
      />

      {/* Modal 1: Edit or Create Single RAG Item */}
      {isEditing && editItem && (
        <RagItemModal
          item={editItem}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveRagItem}
        />
      )}

      {/* Modal 2: Batch Document Import, Table Parsing & Chunk Preview/Editor Modal */}
      {isImportModalOpen && (
        <DocumentChunkImportModal
          onClose={() => setIsImportModalOpen(false)}
          onBatchSave={handleBatchSaveChunks}
        />
      )}

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

// ==========================================
// RAG Item Edit / Create Single Item Modal
// ==========================================
const RagItemModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...item });
  const [tagInput, setTagInput] = useState((item.tags || []).join(', '));

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result;
      try {
        const res = await fetch(`${API_BASE}/api/admin/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, filename: file.name })
        });
        const data = await res.json();
        if (data.ok && data.attachment) {
          setFormData(prev => ({
            ...prev,
            imageAttachments: [...(prev.imageAttachments || []), data.attachment],
            tags: Array.from(new Set([...(prev.tags || []), file.name]))
          }));
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSave = () => {
    const tagsArr = tagInput.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    onSave({ ...formData, tags: tagsArr });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white/95 rounded-[36px] max-w-[560px] w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-white space-y-4 animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-[#4a4365] text-[16px]">
            {formData.id ? '编辑知识条目' : '新增 RAG 知识条目'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入标题"
              className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">分类</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="如：录取分数 / 宿舍环境"
                className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
              >
                <option value="text">文本型</option>
                <option value="table">表格型</option>
                <option value="image">图片附件型</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">描述与详细文本</label>
            <textarea
              rows={3}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="详细正文或相关说明..."
              className="w-full bg-[#f8f6fc] rounded-xl p-4 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
            />
          </div>

          <div className="border border-dashed border-[#d6cbf5] rounded-2xl p-4 bg-[#fbf9fe] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                <ImageIcon size={16} className="text-[#a494e8]" /> PNG 图片附件管理
              </span>
              <label className="bg-[#4a4365] text-white px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-[#342e49] transition-all flex items-center gap-1">
                <Upload size={13} /> 上传 PNG 图片
                <input type="file" accept="image/png,image/jpeg" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {formData.imageAttachments?.length > 0 ? (
              <div className="space-y-2">
                {formData.imageAttachments.map((img, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100 text-[12px]">
                    <div className="flex items-center gap-2">
                      <img src={img.url} alt={img.name} className="w-8 h-8 rounded object-cover border" />
                      <div>
                        <div className="font-bold text-[#4a4365]">{img.name}</div>
                        <div className="text-[10px] text-gray-400">{img.caption}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        imageAttachments: prev.imageAttachments.filter((_, idx) => idx !== i)
                      }))}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-2">暂无关联的图片附件，可点击右上方按钮上传 PNG 图片并自动向量化</p>
            )}
          </div>

          <div>
            <label className="text-[12px] font-bold text-[#4a4365] block mb-1">向量检索关键词与标签（英文逗号隔开）</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="如：录取分数, 2025, 浙江, dorm_map.png"
              className="w-full bg-[#f8f6fc] rounded-xl px-4 py-2.5 text-[13px] outline-none border border-transparent focus:border-[#a494e8]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button onClick={onClose} className="px-5 py-2.5 rounded-2xl text-[13px] font-bold text-gray-500 hover:bg-gray-100">
            取消
          </button>
          <button onClick={handleFormSave} className="bg-[#4a4365] text-white px-6 py-2.5 rounded-2xl text-[13px] font-bold shadow-md hover:bg-[#342e49]">
            保存到知识库
          </button>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// Document Import, Table Parsing & Chunk Preview Modal Component
// ==========================================
const DocumentChunkImportModal = ({ onClose, onBatchSave }) => {
  const [importType, setImportType] = useState('doc'); // 'doc' | 'table'
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [chunkMode, setChunkMode] = useState('heading'); // 'heading' | 'length'
  const [chunkSize, setChunkSize] = useState(400);

  const [parsedChunks, setParsedChunks] = useState([]);
  const [editingChunkIdx, setEditingChunkIdx] = useState(null);

  const [isParsing, setIsParsing] = useState(false);

  // File Upload Reader for Document (.txt, .md, .doc, .docx) & Table (.csv, .json)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setInputText(content);
    };

    reader.readAsText(file);
  };

  // Perform Server Parsing & Chunking
  const handleParse = async () => {
    if (!inputText.trim()) {
      alert('请上传文件或粘贴文本内容');
      return;
    }

    setIsParsing(true);
    try {
      if (importType === 'doc') {
        const res = await fetch(`${API_BASE}/api/admin/parse-document`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: inputText,
            filename: fileName,
            mode: chunkMode,
            chunkSize
          })
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.chunks)) {
          setParsedChunks(data.chunks);
        } else {
          alert('文档切片解析异常：' + (data.error || '未知错误'));
        }
      } else {
        // Table CSV Parsing
        const res = await fetch(`${API_BASE}/api/admin/parse-table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csvText: inputText,
            filename: fileName
          })
        });
        const data = await res.json();
        if (data.ok && data.tableData) {
          setParsedChunks([{
            id: `table-chunk-${Date.now()}`,
            title: data.title,
            category: '表格数据',
            type: 'table',
            content: `导入表格包含 ${data.tableData.columns.join(' / ')}`,
            tableData: data.tableData,
            imageAttachments: [],
            tags: [data.title, '表格数据']
          }]);
        } else {
          alert('表格解析异常：' + (data.error || '未知错误'));
        }
      }
    } catch (err) {
      console.error('Parse failed:', err);
      alert('解析连接失败，请检查后端 Node 服务是否开启 (端口 3001)');
    } finally {
      setIsParsing(false);
    }
  };


  const handleUpdateChunk = (idx, updatedChunk) => {
    const next = [...parsedChunks];
    next[idx] = updatedChunk;
    setParsedChunks(next);
    setEditingChunkIdx(null);
  };

  const handleDeleteChunk = (idx) => {
    setParsedChunks(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white/95 rounded-[36px] max-w-[760px] w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-white space-y-4 animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-[#4a4365] text-[16px] flex items-center gap-2">
              <FileUp className="text-[#a494e8]" size={20} /> 智能文件解析与 RAG 切片管理
            </h3>
            <p className="text-[11px] text-[#8a84a4] mt-0.5">支持 txt, md, docx 文本与 csv 表格文件导入解析，切片内容可随时预览修改</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Input Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-4 bg-[#f8f6fc] p-2 rounded-2xl border border-purple-100">
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4365] cursor-pointer">
              <input
                type="radio"
                name="importType"
                checked={importType === 'doc'}
                onChange={() => setImportType('doc')}
                className="text-[#a494e8]"
              />
              <FileText size={15} /> 文本/文档切片 (TXT, MD, Word)
            </label>
            <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4365] cursor-pointer">
              <input
                type="radio"
                name="importType"
                checked={importType === 'table'}
                onChange={() => setImportType('table')}
                className="text-[#a494e8]"
              />
              <Table size={15} /> 表格解析 (CSV, JSON)
            </label>
          </div>

          <div className="flex gap-3 items-center">
            <label className="bg-[#4a4365] text-white px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-[#342e49] transition-all flex items-center gap-1.5">
              <Upload size={14} /> 选择本地文件
              <input type="file" accept=".txt,.md,.doc,.docx,.csv,.json" onChange={handleFileChange} className="hidden" />
            </label>
            {fileName && <span className="text-[12px] font-bold text-[#a494e8] bg-purple-50 px-3 py-1 rounded-lg">📄 {fileName}</span>}

            {importType === 'doc' && (
              <div className="flex items-center gap-2 ml-auto text-[12px]">
                <span className="font-bold text-gray-600">切片模式:</span>
                <select
                  value={chunkMode}
                  onChange={(e) => setChunkMode(e.target.value)}
                  className="bg-[#f8f6fc] rounded-lg px-2 text-purple-950 font-bold py-1 outline-none text-[12px]"
                >
                  <option value="ai">🤖 AI 智能语义切片 (DeepSeek大模型提取)</option>
                  <option value="heading">按 Markdown 标题章节 (#)</option>
                  <option value="length">按固定字数切片 (400字)</option>
                </select>

              </div>
            )}
          </div>

          <div>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此粘贴文档正文或 CSV 表格内容..."
              className="w-full bg-[#f8f6fc] rounded-2xl p-4 text-[12px] outline-none border border-transparent focus:border-[#a494e8] font-mono"
            />
          </div>

          <button
            onClick={handleParse}
            disabled={!inputText.trim() || isParsing}
            className="w-full bg-gradient-to-r from-[#b3a4ed] to-[#f296b2] text-white py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:shadow-md active:scale-95 transition-all flex justify-center items-center gap-1.5 disabled:opacity-50"
          >
            <Scissors size={16} /> {isParsing ? '⏳ 正在智能分析并自动切片中...' : '开始智能解析与自动切片'}
          </button>

        </div>

        {/* Chunks List & Modification Section */}
        {parsedChunks.length > 0 && (
          <div className="border-t pt-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#4a4365] text-[14px] flex items-center gap-1.5">
                <Layers size={16} className="text-purple-600" /> 已分割切片预览 ({parsedChunks.length} 个切片)
              </h4>
              <button
                onClick={() => onBatchSave(parsedChunks)}
                className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-1"
              >
                <Check size={14} /> 确认一键保存全部切片入库
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {parsedChunks.map((chunk, idx) => (
                <div key={chunk.id} className="bg-[#f8f6fc] p-3 rounded-2xl border border-purple-100 flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                        切片 #{idx + 1}
                      </span>
                      <h5 className="font-bold text-[#4a4365] text-[13px]">{chunk.title}</h5>
                    </div>
                    <p className="text-[12px] text-[#6d648b] leading-relaxed line-clamp-2">{chunk.content}</p>
                    <div className="flex gap-1">
                      {chunk.tags?.map((t, i) => (
                        <span key={i} className="text-[10px] text-[#a494e8]">#{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingChunkIdx(idx)}
                      className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Edit3 size={14} /> 编辑
                    </button>
                    <button
                      onClick={() => handleDeleteChunk(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 text-[11px] font-bold"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Sub-Editor for Individual Chunk Editing */}
        {editingChunkIdx !== null && parsedChunks[editingChunkIdx] && (
          <ChunkSingleEditor
            chunk={parsedChunks[editingChunkIdx]}
            onClose={() => setEditingChunkIdx(null)}
            onSave={(updated) => handleUpdateChunk(editingChunkIdx, updated)}
          />
        )}

      </div>
    </div>
  );
};

// Sub-editor for an individual chunk
const ChunkSingleEditor = ({ chunk, onClose, onSave }) => {
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
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-[12px] text-gray-500">取消</button>
          <button
            onClick={() => onSave({
              ...chunk,
              title,
              content,
              tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
            })}
            className="bg-[#4a4365] text-white px-4 py-1.5 rounded-xl text-[12px] font-bold"
          >
            更新切片
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// User Background Profile Collection Modal Form
// ==========================================
interface UserProfileModalProps {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
}

const UserProfileModal = ({ profile, isOpen, onClose, onSave }: UserProfileModalProps) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    gender: profile?.gender || '男',
    phone: profile?.phone || '',
    province: profile?.province || '浙江',
    score: profile?.score || '',
    rank: profile?.rank || '',
    subjects: profile?.subjects || '物化生',
    specialConditions: profile?.specialConditions || ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        gender: profile.gender || '男',
        phone: profile.phone || '',
        province: profile.province || '浙江',
        score: profile.score || '',
        rank: profile.rank || '',
        subjects: profile.subjects || '物化生',
        specialConditions: profile.specialConditions || ''
      });
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.score || !formData.province) {
      alert('请完整填写姓名、省份和高考分数！');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[560px] w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border-4 border-white space-y-5 animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] text-white flex items-center justify-center shadow-md">
              <User size={22} />
            </div>
            <div>
              <h3 className="font-black text-[#4a4365] text-[17px]">高考个人背景资料登记</h3>
              <p className="text-[11px] text-[#8a84a4] font-medium mt-0.5">请填写真实高考信息，系统将为您评估位次与选科匹配度</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <div className="text-[12px] font-black text-[#a494e8] uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} /> 第一部分：基本身份信息
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">姓名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入您的姓名"
                  className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">性别</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">手机号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系手机号（选填）"
                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
              />
            </div>
          </div>

          {/* Section 2: Gaokao Scores & Subjects */}
          <div className="space-y-3 pt-2">
            <div className="text-[12px] font-black text-[#a494e8] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} /> 第二部分：高考成绩与选科
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">高考省份 <span className="text-red-500">*</span></label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                >
                  {['浙江', '江苏', '广东', '四川', '山东', '河南', '湖北', '湖南', '福建', '安徽', '北京', '上海', '重庆', '陕西', '江西', '河北'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">高考分数 <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  required
                  min={100}
                  max={750}
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="如: 595"
                  className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#4a4365] block mb-1">全省排名</label>
                <input
                  type="number"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  placeholder="如: 15000"
                  className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">选科情况</label>
              <input
                type="text"
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                placeholder="如：物理/化学/生物 或 史地政、物化地等"
                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
              />
            </div>
          </div>

          {/* Section 3: Special Conditions */}
          <div className="space-y-2 pt-2">
            <div className="text-[12px] font-black text-[#a494e8] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> 第三部分：特殊情况与考量
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">特殊情况 / 加分 / 限制说明</label>
              <textarea
                rows={2}
                value={formData.specialConditions}
                onChange={(e) => setFormData({ ...formData, specialConditions: e.target.value })}
                placeholder="如：艺考、单招、少数民族加分、体检视力受限、家庭预算考量等（无则填“无”）"
                className="w-full bg-[#f8f6fc] border border-gray-100 rounded-2xl p-3 text-[12px] outline-none focus:ring-2 focus:ring-[#a494e8]"
              />
            </div>
          </div>

          {/* Score status tip */}
          {formData.score && (
            <div className="p-3 rounded-2xl text-[12px] font-bold flex items-center gap-2 bg-purple-50 text-purple-800 border border-purple-100">
              <Sparkles size={16} className="shrink-0 text-purple-500" />
              <span>
                ✅ 高考成绩已录入：{formData.score} 分。系统将为您匹配专属选科建议与高校招生政策。
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="submit"
              className="w-full bg-[#4a4365] hover:bg-[#342e49] text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>保存个人背景资料</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// ==========================================
// VIP Personal RAG Database Viewer Modal
// ==========================================
interface PersonalRagModalProps {
  username?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PersonalRagModal = ({ username, isOpen, onClose }: PersonalRagModalProps) => {
  const [items, setItems] = useState<any[]>([]);
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
          <button onClick={onClose} className="p-2 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
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
          <button onClick={onClose} className="bg-[#4a4365] text-white px-5 py-2 rounded-xl text-[12px] font-bold">
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
// ==========================================
// Admin User Information Edit Modal
// ==========================================
const AdminEditUserModal = ({ user, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    targetUsername: user?.username || '',
    newUsername: user?.username || '',
    phone: user?.phone || user?.profile?.phone || '',
    email: user?.email || user?.profile?.email || '',
    province: user?.profile?.province || '',
    score: user?.profile?.score || '',
    isVip: user?.profile?.isVip || false,
    specialConditions: user?.profile?.specialConditions || ''
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[500px] w-full p-6 shadow-2xl border-4 border-white space-y-4 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[#4a4365] text-[15px]">修改账号与资料【{user.username}】</h3>
              <p className="text-[11px] text-[#8a84a4]">管理员可直接调整考生信息、关联手机邮箱与分级状态</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-3.5 text-[12px]">
          <div>
            <label className="font-bold text-[#4a4365] block mb-1">账号名称</label>
            <input
              type="text"
              value={formData.newUsername}
              onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
              className="w-full bg-[#f8f6fc] p-2.5 rounded-xl font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#4a4365] block mb-1">手机号</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="11位手机号"
                className="w-full bg-[#f8f6fc] p-2.5 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#4a4365] block mb-1">电子邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@domain.com"
                className="w-full bg-[#f8f6fc] p-2.5 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#4a4365] block mb-1">高考省份</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="如: 广东/浙江"
                className="w-full bg-[#f8f6fc] p-2.5 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-[#4a4365] block mb-1">高考分数</label>
              <input
                type="number"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="例如: 590"
                className="w-full bg-[#f8f6fc] p-2.5 rounded-xl outline-none font-bold text-purple-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
            <span className="font-bold text-[#4a4365]">设置 VIP 考生专属通道</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVip: !formData.isVip })}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer ${formData.isVip ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              {formData.isVip ? 'VIP 已开启' : '普通用户'}
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100">
              取消
            </button>
            <button type="submit" className="px-6 py-2.5 bg-[#4a4365] text-white font-bold rounded-xl shadow-md hover:bg-[#342e49] cursor-pointer">
              保存更改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// Admin Password Reset Modal (Bcrypt Auto-Hashing)
// ==========================================
const AdminResetPasswordModal = ({ user, onClose, onSave }: any) => {
  const [newPassword, setNewPassword] = useState('');

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[420px] w-full p-6 shadow-2xl border-4 border-white space-y-4 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[#4a4365] text-[15px]">重置用户密码【{user.username}】</h3>
              <p className="text-[11px] text-[#8a84a4]">新密码将由 Node bcryptjs 进行 10 轮加盐哈希保存</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-2xl text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave({ targetUsername: user.username, newPassword }); }} className="space-y-4 text-[12px]">
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-amber-800 text-[11px]">
            当前密钥状态: <strong className="font-mono">{user.isPasswordHashed ? '🔒 已具备 Bcrypt 杂凑保护' : '⚠️ 明文/未加密存储'}</strong>
          </div>

          <div>
            <label className="font-bold text-[#4a4365] block mb-1">请输入全新重置密码</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="例如: NewPass123!"
              className="w-full bg-[#f8f6fc] p-3 rounded-xl font-mono text-[13px] outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-gray-500 font-bold hover:bg-gray-100">
              取消
            </button>
            <button type="submit" disabled={!newPassword.trim()} className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl shadow-md hover:bg-amber-700 cursor-pointer disabled:opacity-50">
              立即重置并 Bcrypt 加密
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
