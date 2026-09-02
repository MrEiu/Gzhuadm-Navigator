export interface CampusSticker {
    id: string;
    code: string;
    name: string;
    emoji: string;
    tagline: string;
    character: string;
    avatar: string;
    bgGradient: string;
    badgeColor: string;
    illustration: string; // High-res SVG / illustration data URL
    description: string;
}

export const CAMPUS_STICKERS: Record<string, CampusSticker> = {
    'gzu_eat': {
        id: 'gzu_eat',
        code: '[sticker:gzu_eat]',
        name: '广大干饭人',
        emoji: '🍚',
        tagline: '今晚谁去 GOGO 新天地疯狂炫饭？！',
        character: '丽丽学姐',
        avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVj3_GxALNWCvvYihiQsgv2KEhImtc73CpQywRMqdv5w&s=10',
        bgGradient: 'from-amber-400 via-orange-500 to-red-500',
        badgeColor: '#f97316',
        illustration: '🐱 🍜 🥩',
        description: '大学城贝岗/GOGO新天地干饭达人专属表情'
    },
    'gzu_check': {
        id: 'gzu_check',
        code: '[sticker:gzu_check]',
        name: '查寝警告',
        emoji: '🔦',
        tagline: '23:30 准时锁楼门！大功率违章电器当场收走！',
        character: '宿管张阿姨',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        bgGradient: 'from-rose-500 via-red-600 to-amber-600',
        badgeColor: '#dc2626',
        illustration: '🚨 ⚡ ❌',
        description: '违章电器与门禁宿管阿姨暗中观察'
    },
    'gzu_pass': {
        id: 'gzu_pass',
        code: '[sticker:gzu_pass]',
        name: '逢考必过',
        emoji: '💯',
        tagline: '期末考神附体！绩点 4.0 稳稳保研不挂科！',
        character: '辅导员李导',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        bgGradient: 'from-emerald-400 via-teal-500 to-cyan-600',
        badgeColor: '#059669',
        illustration: '🌟 📖 🏆',
        description: '转专业、期末考试与综测考神金光加持'
    },
    'gzu_love': {
        id: 'gzu_love',
        code: '[sticker:gzu_love]',
        name: '学长带飞',
        emoji: '🕶️',
        tagline: '手机 NFC 门禁与抢课避坑，师兄带你少走三年弯路！',
        character: '学长浩哥',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
        bgGradient: 'from-indigo-500 via-purple-500 to-pink-500',
        badgeColor: '#6366f1',
        illustration: '💻 🚀 ❤️',
        description: '计算机系大四浩哥靠谱带飞'
    },
    'gzu_stare': {
        id: 'gzu_stare',
        code: '[sticker:gzu_stare]',
        name: '李导凝视',
        emoji: '👓',
        tagline: '听说有同学想旷早八和晚自习？我在后面看着你呢。',
        character: '辅导员李导',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        bgGradient: 'from-blue-600 via-indigo-700 to-slate-800',
        badgeColor: '#2563eb',
        illustration: '👀 📋 ✍️',
        description: '辅导员推眼镜注视出勤与学风'
    },
    'gzu_cheer': {
        id: 'gzu_cheer',
        code: '[sticker:gzu_cheer]',
        name: '广大冲鸭',
        emoji: '🧋',
        tagline: '喝杯南亭手摇双皮奶，今天也是元气满满的广大新生！',
        character: '丽丽学姐',
        avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVj3_GxALNWCvvYihiQsgv2KEhImtc73CpQywRMqdv5w&s=10',
        bgGradient: 'from-pink-400 via-rose-400 to-purple-500',
        badgeColor: '#ec4899',
        illustration: '🦆 🧋 ✨',
        description: '元气学姐日常打气与探店分享'
    },
    'gzu_fire': {
        id: 'gzu_fire',
        code: '[sticker:gzu_fire]',
        name: '800W警告',
        emoji: '⚡',
        tagline: '单路限电 800W 红线已踩！跳闸请联系楼下阿姨！',
        character: '宿管张阿姨',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        bgGradient: 'from-yellow-400 via-amber-500 to-red-600',
        badgeColor: '#d97706',
        illustration: '⚠️ 🔌 💥',
        description: '宿舍安全用电与限电警告'
    },
    'gzu_map': {
        id: 'gzu_map',
        code: '[sticker:gzu_map]',
        name: '雕塑园拍照',
        emoji: '📸',
        tagline: '梁明诚雕塑园江边大草坪，今日天气出片率 100%！',
        character: '丽丽学姐',
        avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVj3_GxALNWCvvYihiQsgv2KEhImtc73CpQywRMqdv5w&s=10',
        bgGradient: 'from-teal-400 via-cyan-500 to-blue-500',
        badgeColor: '#0d9488',
        illustration: '🌲 📷 🌅',
        description: '广大文旅拍照打卡机位推荐'
    }
};

export const STICKER_LIST = Object.values(CAMPUS_STICKERS);
