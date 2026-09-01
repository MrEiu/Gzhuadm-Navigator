export interface GifMeme {
    id: string;
    title: string;
    url: string;
    category: 'admissions' | 'study' | 'fun' | 'reaction';
}

export const GIF_CATEGORIES = [
    { key: 'all', label: '🔥 全部热门' },
    { key: 'admissions', label: '🎉 录取上岸' },
    { key: 'study', label: '📚 备考学习' },
    { key: 'fun', label: '🐱 萌趣搞笑' },
    { key: 'reaction', label: '💬 聊天互动' }
] as const;

export const GIF_MEMES: GifMeme[] = [
    // 1. 🎉 录取上岸与庆祝
    {
        id: 'admit_celebrate',
        title: '成功上岸！',
        url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
        category: 'admissions'
    },
    {
        id: 'cat_cheer',
        title: '干杯庆祝',
        url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
        category: 'admissions'
    },
    {
        id: 'party_dance',
        title: '开心起飞',
        url: 'https://media.giphy.com/media/7kn27lnYSAE9O/giphy.gif',
        category: 'admissions'
    },
    {
        id: 'welcome_join',
        title: '热烈欢迎',
        url: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
        category: 'admissions'
    },
    {
        id: 'heart_love',
        title: '比心发射',
        url: 'https://media.giphy.com/media/l4pTdcifPZLpDjL1e/giphy.gif',
        category: 'admissions'
    },
    {
        id: 'wuhu_dance',
        title: '芜湖起飞',
        url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
        category: 'admissions'
    },

    // 2. 📚 备考与学习
    {
        id: 'study_fast',
        title: '键盘冒烟',
        url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
        category: 'study'
    },
    {
        id: 'think_hard',
        title: '正在思考',
        url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif',
        category: 'study'
    },
    {
        id: 'power_up',
        title: '能量拉满',
        url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
        category: 'study'
    },
    {
        id: 'fighting_win',
        title: '加油必胜',
        url: 'https://media.giphy.com/media/3og0IPbUygZWihJavu/giphy.gif',
        category: 'study'
    },
    {
        id: 'running_sprint',
        title: '全力冲刺',
        url: 'https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif',
        category: 'study'
    },
    {
        id: 'lay_flat',
        title: '学累瘫了',
        url: 'https://media.giphy.com/media/26ufcVAp3AiJJsrIs/giphy.gif',
        category: 'study'
    },

    // 3. 🐱 萌宠与搞笑
    {
        id: 'cat_eat',
        title: '疯狂炫饭',
        url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
        category: 'fun'
    },
    {
        id: 'dog_like',
        title: '点赞棒棒哒',
        url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
        category: 'fun'
    },
    {
        id: 'cat_shock',
        title: '猫猫震惊',
        url: 'https://media.giphy.com/media/Nm8ZPAGOwZUic/giphy.gif',
        category: 'fun'
    },
    {
        id: 'dog_smart',
        title: '机智柴犬',
        url: 'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif',
        category: 'fun'
    },
    {
        id: 'seal_clap',
        title: '海豹鼓掌',
        url: 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif',
        category: 'fun'
    },
    {
        id: 'spy_peek',
        title: '暗中观察',
        url: 'https://media.giphy.com/media/VbnUQ403IntxeCeLoi/giphy.gif',
        category: 'fun'
    },

    // 4. 💬 聊天与情绪互动
    {
        id: 'duck_nod',
        title: '疯狂点头',
        url: 'https://media.giphy.com/media/xUOxeZc41DVT2YlB6w/giphy.gif',
        category: 'reaction'
    },
    {
        id: 'chill_tea',
        title: '优雅喝茶',
        url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif',
        category: 'reaction'
    },
    {
        id: 'cat_cry',
        title: '猫猫大哭',
        url: 'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
        category: 'reaction'
    },
    {
        id: 'please_help',
        title: '拜托拜托',
        url: 'https://media.giphy.com/media/B2l0NnxK9KiVa/giphy.gif',
        category: 'reaction'
    },
    {
        id: 'confused_tilt',
        title: '啥情况呀',
        url: 'https://media.giphy.com/media/1X7ALG61J942MSyshE/giphy.gif',
        category: 'reaction'
    },
    {
        id: 'despair_cry',
        title: '当场裂开',
        url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif',
        category: 'reaction'
    }
];
