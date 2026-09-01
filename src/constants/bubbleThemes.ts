import { BubbleThemeId, BubbleCustomSettings } from '../types';

export interface BubbleThemeConfig {
    id: BubbleThemeId;
    name: string;
    group: '@ant-design/x' | '@chatscope' | '@assistant-ui' | 'Apple iOS' | 'Classic';
    source: string;
    description: string;
    icon: string;
    userClass: string;
    botClass: string;
    containerClass?: string;
    showTail?: boolean;
}

export const DEFAULT_BUBBLE_SETTINGS: BubbleCustomSettings = {
    themeId: 'antdesign_filled',
    borderRadius: 24,
    padding: 'standard',
    borderWidth: 1,
    shadowDepth: 'subtle',
    showTail: false,
    showActions: true,
    showThinkingBox: true,
    accentBarWidth: 0
};

export const BUBBLE_THEMES: Record<string, BubbleThemeConfig> = {
    'antdesign_filled': {
        id: 'antdesign_filled',
        name: 'Neo Crystal',
        group: '@ant-design/x',
        source: 'Gzadm Design System',
        description: '旗舰级极光蓝紫流体渐变 + 高透白玉磨砂玻璃态，色彩温润灵动，阅读质感极佳',
        icon: '🔮',
        userClass: 'bg-gradient-to-tr from-[#5b46e8] via-[#6d4ff5] to-[#8d69f8] text-white rounded-3xl rounded-br-sm shadow-[0_8px_24px_rgba(91,70,232,0.28)] border border-white/25',
        botClass: 'bg-white/95 text-[#221c38] rounded-3xl shadow-[0_4px_24px_rgba(74,67,101,0.06)] border border-purple-100/90 backdrop-blur-md',
        showTail: false
    },
    'ios_liquid': {
        id: 'ios_liquid',
        name: 'Apple iOS 18 - 灵动岛微光 (Liquid)',
        group: 'Apple iOS',
        source: 'Apple Design',
        description: '苹果即时通讯质感 · 象牙白微漫反射、灵动海洋蓝紫与连续曲率平滑倒角',
        icon: '🍎',
        userClass: 'bg-gradient-to-r from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] text-white rounded-[24px] rounded-br-[4px] shadow-[0_6px_20px_rgba(99,102,241,0.28)] border border-white/30',
        botClass: 'bg-white text-[#18181b] rounded-[24px] rounded-tl-[4px] shadow-[0_8px_28px_rgba(0,0,0,0.06)] border border-slate-100/90',
        showTail: true
    },
    'assistant_card': {
        id: 'assistant_card',
        name: 'Perplexity Pro - 纯净探索卡片',
        group: '@assistant-ui',
        source: 'Perplexity AI',
        description: '顶级 AI 搜索引擎排版 · 纯净通透背景、深邃文字与优雅微边框',
        icon: '🔍',
        userClass: 'bg-[#1f232e] text-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] border border-slate-700/60',
        botClass: 'bg-white text-[#1b1c20] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200/80',
        showTail: false
    },
    'antdesign_shadow': {
        id: 'antdesign_shadow',
        name: 'AntDesignX - 悬浮琉璃 (Shadow)',
        group: '@ant-design/x',
        source: '@ant-design/x',
        description: '阿里悬浮卡片 · 带有自然弥散环境光阴影与三维立体层次',
        icon: '💎',
        userClass: 'bg-gradient-to-r from-[#1677ff] to-[#36cfc9] text-white rounded-2xl shadow-[0_8px_24px_rgba(22,119,255,0.25)] border border-white/30',
        botClass: 'bg-white text-[#1f1f1f] rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-gray-100',
        showTail: false
    },
    'neoglass_glow': {
        id: 'neoglass_glow',
        name: 'NeoGlass - 赛博霓虹微光',
        group: 'Classic',
        source: 'Glassmorphism',
        description: '半透磨砂玻璃 · 绚丽弥散光晕与晨曦紫粉高亮',
        icon: '✨',
        userClass: 'bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#6366f1] text-white rounded-3xl rounded-br-md shadow-[0_8px_30px_rgba(236,72,153,0.32)] border border-white/40 backdrop-blur-xl',
        botClass: 'bg-white/90 text-[#2a224a] rounded-3xl rounded-tl-md shadow-[0_12px_40px_rgba(168,148,230,0.18)] border border-white backdrop-blur-2xl',
        showTail: false
    },
    'wechat_classic': {
        id: 'wechat_classic',
        name: 'WeChat - 微信官方经典绿白',
        group: 'Classic',
        source: 'WeChat Design',
        description: '国民级即时通讯复刻 · 经典微信绿右侧气泡与纯白左侧气泡',
        icon: '🟢',
        userClass: 'bg-[#95ec69] text-[#191919] font-medium rounded-xl rounded-br-[2px] shadow-xs border border-[#83d957]',
        botClass: 'bg-white text-[#191919] rounded-xl rounded-tl-[2px] shadow-xs border border-[#ebebeb]',
        showTail: true
    },
    'shadcn_minimal': {
        id: 'shadcn_minimal',
        name: 'Linear / shadcn - 极客极简黑白',
        group: 'Classic',
        source: 'Linear.app',
        description: '现代极客 Web 标准 · 0.5px 精细轮廓与高对比度排版',
        icon: '⚡',
        userClass: 'bg-[#18181b] text-[#fafafa] rounded-2xl rounded-br-sm shadow-xs border border-zinc-700/60',
        botClass: 'bg-[#ffffff] text-[#18181b] rounded-2xl rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-200/90',
        showTail: false
    },
    'chatscope_tail': {
        id: 'chatscope_tail',
        name: 'ChatScope - 拟真尖角尾部',
        group: '@chatscope',
        source: '@chatscope/chat-ui-kit-react',
        description: 'WhatsApp 经典即时通讯 · 带有拟真小尖角尾部与立体投影',
        icon: '💬',
        userClass: 'bg-gradient-to-r from-[#6366f1] to-[#7c3aed] text-white rounded-[20px] rounded-br-[2px] shadow-[0_4px_16px_rgba(99,102,241,0.25)] border border-white/20',
        botClass: 'bg-white text-[#2b2540] rounded-[20px] rounded-tl-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.07)] border border-slate-100',
        showTail: true
    }
};

// Aliases for backward compatibility
BUBBLE_THEMES.chatscope = BUBBLE_THEMES.chatscope_tail;
BUBBLE_THEMES.antdesign = BUBBLE_THEMES.antdesign_filled;
BUBBLE_THEMES.assistant = BUBBLE_THEMES.assistant_card;
BUBBLE_THEMES.ios = BUBBLE_THEMES.ios_liquid;
BUBBLE_THEMES.shadcn = BUBBLE_THEMES.shadcn_minimal;
BUBBLE_THEMES.neoglass = BUBBLE_THEMES.neoglass_glow;
