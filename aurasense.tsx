import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Sparkles, GraduationCap, BookOpen, Home, 
  Award, Calendar, RotateCcw, Copy, Check, 
  MessageSquare, Trash2, ChevronRight, School, Cpu, Users
} from 'lucide-react';

const API_BASE = 'http://localhost:3001';

// --- Theme Configuration ---
const THEME = {
  bg: "bg-gradient-to-br from-[#f6f4fc] via-[#fbf7f9] to-[#f0f6fa]",
  glass: "bg-white/75 backdrop-blur-3xl border border-white/80 shadow-[0_35px_80px_rgba(186,175,215,0.3)]",
  userBubble: "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-[0_10px_25px_rgba(139,92,246,0.3)]",
  botBubble: "bg-white text-[#4a4365] shadow-[0_10px_30px_rgba(203,195,225,0.35)] border border-white/60",
};

// --- Admissions AI Advisor Roles ---
const ROLES = {
  professional: {
    id: 'professional',
    name: 'Elena 老师',
    title: '首席招生顾问',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    desc: '解答招生政策、录取分数、学费标准与奖助学金',
    badge: '招生政策 & 分数线'
  },
  academic: {
    id: 'academic',
    name: '张教授',
    title: '学科与专业导师',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    desc: '解答专业培养方案、热门学科、考研与就业发展',
    badge: '专业解读 & 就业前景'
  },
  care: {
    id: 'care',
    name: 'Flora',
    title: '校园生活助手',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    desc: '解答宿舍设施、食堂美食、校园交通与社团活动',
    badge: '宿舍环境 & 校园生活'
  }
};

// --- Quick Category Inquiry Chips ---
const INQUIRY_CATEGORIES = [
  {
    id: 'majors',
    icon: Cpu,
    label: '热门专业与前景',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100/70 hover:bg-purple-100',
    role: 'academic',
    query: '请问学校有哪些热门专业？各专业的就业方向和培养特色是怎样的？'
  },
  {
    id: 'scores',
    icon: GraduationCap,
    label: '录取要求与分数线',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100/70 hover:bg-blue-100',
    role: 'professional',
    query: '请问往年的录取分数线和排位参考是怎样的？录取原则有哪些？'
  },
  {
    id: 'tuition',
    icon: Award,
    label: '学费与奖学金',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100/70 hover:bg-amber-100',
    role: 'professional',
    query: '请问学费标准是多少？有哪些奖学金和助学贷款政策？'
  },
  {
    id: 'campus',
    icon: Home,
    label: '宿舍设施与生活',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100/70 hover:bg-pink-100',
    role: 'care',
    query: '宿舍条件怎么样？配备空调和独立卫浴吗？食堂餐饮如何？'
  },
  {
    id: 'process',
    icon: Calendar,
    label: '报名与开放日',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100/70 hover:bg-emerald-100',
    role: 'professional',
    query: '请问入学的报名流程是怎样的？什么时候有校园开放日体验活动？'
  }
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    role: 'professional',
    text: '👋 **同学/家长您好！欢迎来到 AuraSense 智能入学咨询平台。**\n\n我是招生咨询顾问 **Elena 老师**。无论您是想了解**最新招生政策、历年录取分数线、热门专业方向**，还是**学费奖学金与宿舍环境**，我们 AI 辅导团队将全天候为您解答。✨\n\n您可以随时在下方输入框提问，或点击上方快捷按钮进行咨询！',
    instant: true,
    timestamp: Date.now()
  }
];

// --- Markdown Renderer ---
const AuraMarkdownMessage = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h3: ({ children }) => <h3 className="text-[15px] font-bold text-[#342e49] my-2 border-b border-[#eee8f8] pb-1">{children}</h3>,
        p: ({ children }) => <p className="text-[14px] leading-relaxed my-1.5 whitespace-pre-wrap">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-[#6b21a8]">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-[14px]">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-[14px]">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-4 border-[#8b5cf6] pl-3 py-1 bg-[#f3e8ff]/50 rounded-r-lg text-[#5b21b6] text-[13px]">{children}</blockquote>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="rounded bg-[#f3e8ff] px-1.5 py-0.5 font-mono text-[0.9em] text-[#6b21a8]">{children}</code>
          ) : (
            <code className="block overflow-x-auto rounded-xl bg-[#2e1065] p-3 font-mono text-[12px] text-[#e9d5ff] whitespace-pre-wrap">
              {children}
            </code>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// --- Typewriter Component for Live Feeling ---
const TypewriterText = ({ text, roleColor, isUser, scrollRef }) => {
  const [disp, setDisp] = useState('');

  useEffect(() => {
    let i = 0;
    setDisp('');
    const timer = setInterval(() => {
      setDisp(text.slice(0, i + 1));
      i++;
      if (scrollRef && scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
      if (i >= text.length) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [text]);

  return <AuraMarkdownMessage content={disp} />;
};

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('aurasense_admissions_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [activeRole, setActiveRole] = useState('professional');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('aurasense_admissions_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (overrideText = null, targetRole = null) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || loading) return;

    const chosenRole = targetRole || activeRole;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      instant: true,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInputText('');
    setLoading(true);

    const historyForApi = messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    historyForApi.push({ role: 'user', content: textToSend });

    try {
      const res = await fetch(`${API_BASE}/api/aura/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          role: chosenRole
        })
      });

      const data = await res.json();
      const botReply = data?.reply || '抱歉，系统响应遇到了一点小问题，请您稍后再试。';

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          role: chosenRole,
          text: botReply,
          instant: false,
          timestamp: Date.now()
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          role: chosenRole,
          text: '🌐 网络连接暂时中断，请检查您的网络设置后重新发起提问。',
          instant: true,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空当下的所有咨询对话记录吗？')) {
      setMessages(INITIAL_MESSAGES);
      try {
        localStorage.removeItem('aurasense_admissions_messages');
      } catch {}
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex justify-center items-center min-h-screen ${THEME.bg} p-0 sm:p-4 selection:bg-purple-100`}>
      <div className={`w-full h-screen sm:h-[92vh] sm:max-w-[500px] md:max-w-[680px] lg:max-w-[850px] ${THEME.glass} flex flex-col sm:rounded-[36px] overflow-hidden relative sm:shadow-[0_45px_100px_rgba(186,175,215,0.4)] sm:border-[6px] border-white`}>
        
        {/* Header */}
        <header className="pt-5 pb-3 px-6 z-10 bg-white/40 backdrop-blur-md border-b border-white/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[18px] bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] flex items-center justify-center shadow-[0_8px_20px_rgba(139,92,246,0.4)] border-2 border-white">
                <School className="text-white" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-[#342e49] text-[18px] tracking-tight">AuraSense</h1>
                  <span className="bg-purple-100 text-[#7e22ce] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    入学咨询系统
                  </span>
                </div>
                <p className="text-[11px] text-[#8b5cf6] font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI 招生顾问团队在线协同答疑
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={clearHistory}
                title="清空对话"
                className="p-2 rounded-xl text-[#7c6f9b] hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Advisor Role Selector Bar */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto hide-scrollbar pb-1">
            <span className="text-[11px] font-bold text-[#7c6f9b] whitespace-nowrap flex items-center gap-1 mr-1">
              <Users size={13} /> 选择咨询顾问:
            </span>
            {Object.values(ROLES).map(role => {
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-[12px] font-bold transition-all shrink-0 border ${
                    isActive 
                      ? 'bg-white shadow-md border-purple-300 text-purple-950 scale-[1.02]' 
                      : 'bg-white/50 border-white/60 text-[#6d648b] hover:bg-white/80'
                  }`}
                >
                  <img src={role.avatar} className="w-5 h-5 rounded-full object-cover" alt={role.name} />
                  <span>{role.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {role.title.slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Quick Inquiry Categories */}
        <div className="px-5 py-2.5 bg-white/30 backdrop-blur-sm border-b border-white/40 flex gap-2 overflow-x-auto hide-scrollbar">
          {INQUIRY_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveRole(cat.role);
                  handleSend(cat.query, cat.role);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border border-white/80 shadow-sm ${cat.bgColor} ${cat.color} hover:scale-105 active:scale-95`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Scrollable Chat Area */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-5 hide-scrollbar relative scroll-smooth">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const roleCfg = !isUser ? (ROLES[msg.role] || ROLES.professional) : null;
            const bubbleStyle = isUser ? THEME.userBubble : THEME.botBubble;

            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex max-w-[92%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                  
                  {/* Avatar */}
                  <img 
                    src={isUser ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop" : roleCfg.avatar} 
                    className="w-9 h-9 rounded-2xl shadow-sm border-2 border-white object-cover mt-1 shrink-0" 
                    alt="avatar" 
                  />

                  <div className="flex flex-col min-w-0">
                    {/* Bot Name and Badge */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mb-1 ml-1">
                        <span className="text-[12px] font-bold" style={{ color: roleCfg.color }}>
                          {roleCfg.name}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.2 rounded-full ${roleCfg.bgColor} ${roleCfg.borderColor} border`}>
                          {roleCfg.badge}
                        </span>
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div className={`px-4 py-3 ${bubbleStyle} ${isUser ? 'rounded-2xl rounded-tr-xs' : 'rounded-2xl rounded-tl-xs'} relative group`}>
                      {isUser ? (
                        <p className="leading-relaxed text-[14px] whitespace-pre-wrap">{msg.text}</p>
                      ) : msg.instant ? (
                        <AuraMarkdownMessage content={msg.text} />
                      ) : (
                        <TypewriterText text={msg.text} roleColor={roleCfg.color} isUser={isUser} scrollRef={scrollRef} />
                      )}

                      {/* Copy Action Button for Bot Message */}
                      {!isUser && (
                        <div className="flex justify-end mt-2 pt-1 border-t border-gray-100/80">
                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="text-[11px] text-gray-400 hover:text-purple-600 flex items-center gap-1 transition-colors py-0.5 px-2 rounded-md hover:bg-purple-50"
                          >
                            {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{copiedId === msg.id ? '已复制' : '复制回答'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start items-center gap-3 animate-in fade-in duration-300">
              <img src={ROLES[activeRole].avatar} className="w-9 h-9 rounded-2xl shadow-sm border-2 border-white object-cover" alt="typing" />
              <div className="bg-white/90 px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-sm border border-white">
                <span className="text-[12px] text-purple-700 font-bold">{ROLES[activeRole].name} 正在思考分析中</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer Input Console */}
        <footer className="px-5 pb-5 pt-2 relative z-10">
          <div className="bg-white/85 backdrop-blur-2xl rounded-[28px] p-2.5 shadow-[0_-10px_30px_rgba(186,175,215,0.2)] border border-white flex flex-col gap-2">
            
            {/* Input Form */}
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                handleSend(); 
              }} 
              className="flex items-center gap-2"
            >
              <input 
                type="text"
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                placeholder={`向 ${ROLES[activeRole].name} (${ROLES[activeRole].title}) 提问招生相关问题...`} 
                className="flex-1 bg-[#f8f6fc] border border-purple-100 rounded-2xl px-4 py-3 text-[14px] text-[#342e49] focus:ring-2 focus:ring-[#8b5cf6] focus:bg-white outline-none transition-all placeholder:text-[#9ca3af]" 
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || loading}
                className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white p-3 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
              >
                <Send size={18} />
              </button>
            </form>

            {/* Quick Prompts Footer Bar */}
            <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#8c82ab]">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-purple-500 animate-pulse" /> 快捷热问：按 Enter 发送
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSend("请介绍一下学校的奖学金和助学贷款政策")} 
                  className="hover:text-purple-600 underline underline-offset-2">
                  #奖学金政策
                </button>
                <button 
                  onClick={() => handleSend("新生宿舍是几人间？环境如何？")} 
                  className="hover:text-purple-600 underline underline-offset-2">
                  #宿舍环境
                </button>
              </div>
            </div>

          </div>
        </footer>

      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}