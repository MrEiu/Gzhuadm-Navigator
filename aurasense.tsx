import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, BrainCircuit, Sparkles, Database, 
  Plus, Trash2, Edit3, Table, Image as ImageIcon, 
  Search, X, Upload, Check, User, Lock, LogOut, ShieldCheck, 
  ArrowRight, FileText, FileUp, Scissors, Layers, Eye
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
    text: '同学/家长您好！欢迎使用 **AuraSense 入学咨询平台**。我是招生咨询顾问 **Dr. Elena**。✨\n\n您可以向我咨询关于**招生政策、录取分数线、热门专业、学费与奖学金、宿舍环境及报名流程**等任何问题，我会为您结合知识库为您解答！',
    instant: true
  }
];

// --- Markdown Component ---
const AuraMarkdownMessage = ({ content, roleColor }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="leading-relaxed text-[14px] my-1.5 whitespace-pre-wrap">{children}</p>,
        strong: ({ children }) => <b className="font-bold" style={{ color: roleColor }}>{children}</b>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4 text-[14px]">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-4 text-[14px]">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-[#b3a4ed] pl-3 text-[#6d648b] text-[13px]">{children}</blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-xl border border-[#e4dcf8]">
            <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-[#f3eefc] text-[#4a4365] font-bold">{children}</thead>,
        th: ({ children }) => <th className="p-2.5 border-b border-[#e4dcf8]">{children}</th>,
        td: ({ children }) => <td className="p-2.5 border-b border-[#f3eefc] text-[#6d648b]">{children}</td>,
        img: ({ src, alt }) => (
          <div className="my-3 rounded-2xl overflow-hidden shadow-md border-2 border-white max-w-full group relative bg-gray-50">
            <img src={src} alt={alt || '图片附件'} className="w-full max-h-56 object-cover hover:scale-105 transition-transform duration-300" />
            {alt && (
              <div className="p-2 bg-white/90 text-[11px] text-[#4a4365] font-bold border-t border-gray-100 flex items-center gap-1">
                <ImageIcon size={12} className="text-[#a494e8]" /> {alt}
              </div>
            )}
          </div>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// --- Typewriter Component ---
const TypewriterText = ({ text, instant, roleColor, scrollRef }) => {
  const [disp, setDisp] = useState(instant ? text : '');

  useEffect(() => {
    if (instant) {
      setDisp(text);
      return;
    }
    let i = 0;
    setDisp(''); 
    const timer = setInterval(() => {
      setDisp(text.slice(0, i + 1));
      i++;
      if (scrollRef && scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
      if (i >= text.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [text, instant]);

  return <AuraMarkdownMessage content={disp} roleColor={roleColor} />;
};

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

  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Main App State ---
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState('');

  // --- RAG Admin State ---
  const [ragItems, setRagItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState(null);
  
  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedChunks, setImportedChunks] = useState([]);
  const [chunkPreviewMode, setChunkPreviewMode] = useState('list'); // 'list' | 'edit'
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

  useEffect(() => {
    if (currentUser && currentUser.role === 'user' && !typing) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, typing, currentUser]);

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

  // --- Chat Sender ---
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || typing) return;

    setInputText('');
    const userMsg = { id: Date.now(), sender: 'user', text, instant: true };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    const historyForApi = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    historyForApi.push({ role: 'user', content: text });

    try {
      const response = await fetch(`${API_BASE}/api/aura/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForApi })
      });

      const data = await response.json();
      const reply = data?.reply || '抱歉，我刚刚有些走神，请您再试一次。';

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: reply, instant: false }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: '网络连接出现异常，请检查后端服务是否启动。', instant: true }
      ]);
    } finally {
      setTyping(false);
    }
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

  const filteredRagItems = ragItems.filter(item => {
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
            <h1 className="font-black text-[#4a4365] text-[22px] tracking-tight">AuraSense</h1>
            <p className="text-[11px] text-[#a494e8] font-bold tracking-wider mt-0.5">
              智能入学咨询与 RAG 管理平台
            </p>
          </div>

          <div className="flex bg-[#f0ebf8] p-1 rounded-2xl mb-6">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${
                authMode === 'login' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
              }`}
            >
              登录账号
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${
                authMode === 'register' ? 'bg-white text-[#4a4365] shadow-xs' : 'text-[#8a84a4]'
              }`}
            >
              注册新用户
            </button>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-500 text-[12px] p-3 rounded-2xl mb-4 font-bold border border-red-100 text-center animate-in fade-in">
              {authError}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="text-[12px] font-bold text-[#4a4365] block mb-1">账号</label>
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

            {authMode === 'register' && (
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
              className="w-full bg-[#4a4365] text-white py-3.5 rounded-2xl font-bold text-[14px] shadow-lg hover:bg-[#342e49] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{authMode === 'login' ? '立即登录' : '创建账号并登录'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* SCENE 2: Logged In Main Application */}
      {currentUser && (
        <div className={`w-full h-full ${currentUser.role === 'admin' ? 'sm:max-w-[860px]' : 'sm:max-w-[420px]'} sm:max-h-[880px] ${THEME.glass} flex flex-col sm:rounded-[48px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[8px] border-[#fdfcff] transition-all duration-500`}>
          
          <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
            
            {/* Header */}
            <header className="pt-10 pb-4 px-6 sm:px-8 flex items-center justify-between z-10 bg-white/40 backdrop-blur-md border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[16px] bg-gradient-to-br from-[#b3a4ed] to-[#f296b2] flex items-center justify-center shadow-[0_8px_20px_rgba(179,164,237,0.4)] border-2 border-white">
                  <BrainCircuit className="text-white" size={22} />
                </div>
                <div>
                  <h1 className="font-black text-[#4a4365] text-[17px] tracking-tight">AuraSense</h1>
                  <p className="text-[10px] text-[#a494e8] font-black uppercase tracking-widest">
                    {currentUser.role === 'admin' ? 'RAG Knowledge & Chunking Admin' : 'Admissions Counseling'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-2xl border border-white text-[12px] font-bold text-[#4a4365]">
                  <span className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-purple-500' : 'bg-emerald-400'}`} />
                  <span>{currentUser.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {currentUser.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </div>

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
              <>
                <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-1 space-y-5 hide-scrollbar relative scroll-smooth">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const bubbleStyle = isUser ? THEME.userBubble : THEME.botBubble;

                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
                        <div className={`flex max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                          <img 
                            src={isUser ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop" : ROLE.avatar} 
                            className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover" 
                            alt="avatar" 
                          />
                          <div className="flex flex-col">
                            {!isUser && (
                              <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                <span className="text-[11px] font-black tracking-wider uppercase" style={{ color: ROLE.color }}>
                                  {ROLE.name}
                                </span>
                              </div>
                            )}
                            <div className={`px-5 py-3.5 ${bubbleStyle} ${isUser ? 'rounded-[24px] rounded-br-sm' : 'rounded-[24px] rounded-tl-sm'}`}>
                              {isUser || msg.instant ? (
                                <AuraMarkdownMessage content={msg.text} roleColor={isUser ? '#fff' : ROLE.color} />
                              ) : (
                                <TypewriterText text={msg.text} instant={msg.instant} roleColor={ROLE.color} scrollRef={scrollRef} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="flex justify-start items-end gap-3">
                      <img src={ROLE.avatar} className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover" alt="typing" />
                      <div className="bg-white/80 px-5 py-4 rounded-[24px] rounded-tl-sm flex gap-1.5 shadow-sm border border-white">
                        <div className="w-1.5 h-1.5 bg-[#d6cbf5] rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-[#d6cbf5] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-[#d6cbf5] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </main>

                <footer className="px-5 pb-6 pt-1 relative z-10">
                  <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-4 shadow-[0_-15px_45px_rgba(186,175,215,0.2)] border border-white">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <input 
                        value={inputText} 
                        onChange={(e) => setInputText(e.target.value)} 
                        placeholder="请输入您想咨询的入学、专业、学费问题..." 
                        className="flex-1 bg-[#f8f6fc] border-none rounded-[20px] px-5 py-3 text-[14px] focus:ring-2 focus:ring-[#a494e8] outline-none" 
                      />
                      <button 
                        type="submit" 
                        disabled={!inputText.trim() || typing}
                        className="bg-[#4a4365] text-white p-3 rounded-[20px] active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </footer>
              </>
            )}

            {/* VIEW B: Admin User - RAG Management Dashboard */}
            {currentUser.role === 'admin' && (
              <main className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
                
                {/* Top Stats Bar */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#a494e8] flex items-center justify-center font-bold">
                      <Database size={20} />
                    </div>
                    <div>
                      <div className="text-[18px] font-black text-[#4a4365]">{ragItems.length}</div>
                      <div className="text-[11px] font-medium text-[#8a84a4]">知识库总条目</div>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-500 flex items-center justify-center font-bold">
                      <Table size={20} />
                    </div>
                    <div>
                      <div className="text-[18px] font-black text-[#4a4365]">{ragItems.filter(i => i.type === 'table').length}</div>
                      <div className="text-[11px] font-medium text-[#8a84a4]">结构化表格</div>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-3xl p-4 border border-white shadow-sm flex items-center gap-3">
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

                {/* Import Actions Bar: Single Add vs Document Batch Import & Chunking */}
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-100/50 via-pink-100/50 to-blue-100/50 p-4 rounded-3xl border border-white shadow-xs">
                  <div>
                    <h3 className="font-bold text-[#4a4365] text-[14px] flex items-center gap-1.5">
                      <Scissors className="text-[#a494e8]" size={16} /> 知识库输入与智能切片中心
                    </h3>
                    <p className="text-[11px] text-[#7a7295] mt-0.5">支持 Word、Markdown、TXT 文档导入切片，CSV 表格解析，及 PNG 图片直接上传</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="bg-[#4a4365] text-white px-4 py-2.5 rounded-2xl font-bold text-[12px] shadow-sm hover:bg-[#342e49] transition-all flex items-center gap-1.5"
                    >
                      <FileUp size={15} /> 批量导入文件/智能切片
                    </button>

                    <button
                      onClick={() => {
                        setEditItem({
                          title: '',
                          category: '专业与录取',
                          type: 'text',
                          content: '',
                          tableData: { columns: ['表头1', '表头2'], rows: [['数据1', '数据2']] },
                          imageAttachments: [],
                          tags: ['新标签']
                        });
                        setIsEditing(true);
                      }}
                      className="bg-gradient-to-r from-[#b3a4ed] to-[#f296b2] text-white px-4 py-2.5 rounded-2xl font-bold text-[12px] shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Plus size={15} /> 单条添加
                    </button>
                  </div>
                </div>

                {/* RAG Search & Test Console Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#4a4365] text-[15px] flex items-center gap-2">
                      <Sparkles className="text-[#a494e8]" size={18} /> 本地 BGE 512维向量检索测试
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      placeholder="输入测试问题（如：浙江录取线是多少？有宿舍图吗？）"
                      className="flex-1 bg-[#f8f6fc] border-none rounded-2xl px-4 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                    />
                    <button
                      onClick={handleTestRagSearch}
                      className="bg-[#4a4365] text-white px-5 py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:bg-[#342e49] transition-all flex items-center gap-1.5"
                    >
                      <Search size={15} /> 语义向量比对
                    </button>
                  </div>

                  {testResults && (
                    <div className="mt-3 bg-[#f8f6fc] p-4 rounded-2xl space-y-3">
                      <div className="text-[12px] font-bold text-[#a494e8]">
                        向量与关键词匹配到 {testResults.length} 条检索切片：
                      </div>
                      {testResults.map(({ item, score }) => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-white shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#4a4365] text-[13px]">{item.title}</span>
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-bold">
                              相似得分: {(score * 10).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-[12px] text-[#6d648b] mt-1">{item.content}</p>
                          {item.imageAttachments?.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.imageAttachments.map((img, i) => (
                                <img key={i} src={img.url} alt={img.name} className="w-12 h-12 rounded-lg object-cover border" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RAG Knowledge Items Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 border border-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-[#4a4365] text-[15px]">知识库切片条目列表</h3>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="搜索标题或标签..."
                          className="bg-[#f8f6fc] border-none rounded-xl pl-9 pr-3 py-1.5 text-[12px] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Knowledge Card Grid */}
                  <div className="space-y-3">
                    {filteredRagItems.map((item) => (
                      <div key={item.id} className="bg-white/90 rounded-2xl p-4 border border-white shadow-xs flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              item.type === 'table' ? 'bg-blue-100 text-blue-700' : item.type === 'image' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {item.type === 'table' ? '表格型' : item.type === 'image' ? '图片附件型' : '文本型'}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400">[{item.category}]</span>
                            <h4 className="font-bold text-[#4a4365] text-[14px]">{item.title}</h4>
                          </div>

                          <p className="text-[13px] text-[#6d648b] leading-relaxed line-clamp-2">{item.content}</p>

                          {item.tableData && item.tableData.columns && (
                            <div className="bg-[#f8f6fc] p-2 rounded-xl text-[11px] text-[#4a4365]">
                              <span className="font-bold">结构化表格：</span> {item.tableData.columns.join(' | ')} ({item.tableData.rows?.length || 0} 行)
                            </div>
                          )}

                          {item.imageAttachments && item.imageAttachments.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[11px] font-bold text-pink-500 flex items-center gap-1">
                                <ImageIcon size={12} /> 图片附件 ({item.imageAttachments.length}):
                              </span>
                              {item.imageAttachments.map((img, i) => (
                                <div key={i} className="flex items-center gap-1 bg-pink-50 text-pink-700 text-[10px] px-2 py-0.5 rounded-lg border border-pink-100">
                                  <img src={img.url} alt={img.name} className="w-4 h-4 rounded object-cover" />
                                  <span>{img.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.tags?.map((t, i) => (
                              <span key={i} className="bg-[#f3eefc] text-[#a494e8] text-[10px] px-2 py-0.5 rounded-full font-medium">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditItem({ ...item });
                              setIsEditing(true);
                            }}
                            className="p-2 rounded-xl text-[#8a84a4] hover:text-[#4a4365] hover:bg-gray-100 transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRagItem(item.id)}
                            className="p-2 rounded-xl text-[#8a84a4] hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            )}

          </div>
        </div>
      )}

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