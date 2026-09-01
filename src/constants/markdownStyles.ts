import { MarkdownStyleId } from '../types';

export interface MarkdownStyleConfig {
    id: MarkdownStyleId;
    name: string;
    description: string;
    icon: string;
    sampleText: string;
    badgeColor: string;
}

export const MARKDOWN_STYLES: Record<MarkdownStyleId, MarkdownStyleConfig> = {
    crystal: {
        id: 'crystal',
        name: 'Neo Crystal 极光流体 (默认·极美)',
        description: '层次丰富 · 彩色流光指示条、加粗微发光胶囊底衬、悬浮卡片表格',
        icon: '🔮',
        badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    aurora_purple: {
        id: 'aurora_purple',
        name: '经典香芋紫韵 (原版·柔和紫字)',
        description: '原汁原味 · 经典角色香芋紫加粗高亮、浅紫渐变引用块、温润典雅',
        icon: '💜',
        badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    claude_clean: {
        id: 'claude_clean',
        name: 'Claude / ChatGPT 极简原生流',
        description: '极致通透 · 纯净深色字重加粗、零多余色块、长文阅读极度舒适耐看',
        icon: '🖋️',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    ocean_cyan: {
        id: 'ocean_cyan',
        name: '清爽海盐蔚蓝 (现代海洋风)',
        description: '科技清爽 · 蔚蓝加粗强调、天青色引用卡片、如沐海风般清晰',
        icon: '🌊',
        badgeColor: 'bg-sky-100 text-sky-700 border-sky-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    emerald_academic: {
        id: 'emerald_academic',
        name: '常青藤学院绿 (典雅翡翠风)',
        description: '学术沉稳 · 翡翠绿重点高亮、森林系知识引用、权威严谨质感',
        icon: '🌲',
        badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    amber_warm: {
        id: 'amber_warm',
        name: '暖阳琥珀金 (温暖明朗风)',
        description: '生动活力 · 暖阳金高亮底衬、晨曦暖光提示块、亲切充满希望',
        icon: '☀️',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    linear_geek: {
        id: 'linear_geek',
        name: 'Linear / Vercel 现代极客风',
        description: '极客工程 · 高对比度冷色调、精细微边框、等宽代码块与密集数据卡片',
        icon: '⚡',
        badgeColor: 'bg-zinc-100 text-zinc-900 border-zinc-300',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    },
    notion_doc: {
        id: 'notion_doc',
        name: 'Notion 结构化知识卡片',
        description: '知识库排版 · 醒目 Callout 提示块、琥珀暖光微高亮、层级分明',
        icon: '📑',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        sampleText: '**物理类 585 分** 属于稳妥报考区间，保研率约为 **5%~7%**。'
    }
};
