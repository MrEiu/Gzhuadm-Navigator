import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Image as ImageIcon, Copy, Check, Lightbulb } from 'lucide-react';
import { MarkdownStyleId } from '../../types';

// Helper function to sanitize unclosed markdown syntax tags (images, tables)
export const sanitizeMarkdownContent = (rawText: string) => {
    if (!rawText) return '';
    let safeText = rawText;

    // Protect unclosed image tag
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

interface MarkdownViewerProps {
    content: string;
    roleColor?: string;
    isUser?: boolean;
    markdownStyle?: MarkdownStyleId;
}

export const MarkdownViewer = React.memo(({
    content,
    roleColor = '#5b46e8',
    isUser = false,
    markdownStyle = 'crystal'
}: MarkdownViewerProps) => {
    const safeContent = sanitizeMarkdownContent(content);
    const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

    const handleCopyCode = (codeText: string, index: number) => {
        navigator.clipboard.writeText(codeText);
        setCopiedCodeIndex(index);
        setTimeout(() => setCopiedCodeIndex(null), 2000);
    };

    const markdownComponents = useMemo(() => {
        // --- 1. 经典香芋紫韵 (原版·柔和紫字) ---
        if (markdownStyle === 'aurora_purple') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[17px] font-black text-[#4a4365] mt-3.5 mb-2 pb-1 border-b border-purple-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-4 bg-[#a494e8] rounded-full inline-block shrink-0" />
                        <span>{children}</span>
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15.5px] font-extrabold text-[#5c5478] mt-2.5 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1 h-3 bg-[#b3a4ed] rounded-full inline-block shrink-0" />
                        <span>{children}</span>
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14.5px] font-bold text-[#4a4365] mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => <p className={`leading-relaxed text-[14px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white font-medium' : 'text-[#4a4365]'}`}>{children}</p>,
                strong: ({ children }: any) => (
                    <b className={`font-bold ${isUser ? 'text-white underline decoration-white/40' : 'text-[#8c78db] font-black'}`}>
                        {children}
                    </b>
                ),
                em: ({ children }: any) => <em className="italic text-[#7a7398]">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2 list-disc space-y-1 pl-4 text-[14px] marker:text-[#a494e8]">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2 list-decimal space-y-1 pl-4 text-[14px] marker:text-[#8c78db] marker:font-bold">{children}</ol>,
                li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }: any) => (
                    <blockquote className="my-2.5 border-l-3 border-[#b3a4ed] pl-3 py-1 bg-purple-50/60 rounded-r-xl text-[#6d648b] text-[13px]">
                        {children}
                    </blockquote>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-3 rounded-2xl border border-[#e4dcf8] bg-white/90 shadow-xs">
                        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-[#f3eefc] text-[#4a4365] font-bold border-b border-[#e4dcf8]">{children}</thead>,
                th: ({ children }: any) => <th className="p-2.5">{children}</th>,
                td: ({ children }: any) => <td className="p-2.5 border-b border-[#f3eefc] text-[#6d648b]">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    if (inline) return <code className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[12px] border border-purple-200/60">{children}</code>;
                    return <pre className="my-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[12.5px] overflow-x-auto"><code>{children}</code></pre>;
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-2 rounded-2xl shadow-sm border border-purple-100 max-h-64" />
            };
        }

        // --- 2. Claude / ChatGPT 极简原生流 ---
        if (markdownStyle === 'claude_clean') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[17px] font-black text-slate-900 mt-3.5 mb-2 pb-1.5 border-b border-slate-200 tracking-tight">
                        {children}
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15.5px] font-bold text-slate-900 mt-3 mb-1.5 tracking-tight">
                        {children}
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14.5px] font-bold text-slate-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => <p className={`leading-[1.8] text-[14px] my-2 whitespace-pre-wrap ${isUser ? 'text-white font-medium' : 'text-slate-800'}`}>{children}</p>,
                strong: ({ children }: any) => (
                    <strong className={`font-bold ${isUser ? 'text-white underline decoration-white/40' : 'text-slate-950 font-extrabold'}`}>
                        {children}
                    </strong>
                ),
                em: ({ children }: any) => <em className="italic">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2 space-y-1.5 pl-4 text-[14px] list-disc marker:text-slate-400">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2 space-y-1.5 pl-4 text-[14px] list-decimal marker:text-slate-600 marker:font-bold">{children}</ol>,
                li: ({ children }: any) => <li className={`leading-[1.75] ${isUser ? 'text-white' : 'text-slate-800'}`}>{children}</li>,
                blockquote: ({ children }: any) => (
                    <blockquote className="my-3 border-l-3 border-slate-300 pl-3.5 py-1 text-slate-600 text-[13.5px] leading-relaxed italic bg-slate-50/50 rounded-r-lg">
                        {children}
                    </blockquote>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-slate-100/80 text-slate-900 font-bold border-b border-slate-200">{children}</thead>,
                th: ({ children }: any) => <th className="p-2.5 font-bold text-slate-900 border-b border-slate-200">{children}</th>,
                td: ({ children }: any) => <td className="p-2.5 border-b border-slate-100 text-slate-700 text-[13px]">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    if (inline) return <code className={`px-1.5 py-0.5 rounded font-mono text-[12px] ${isUser ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{children}</code>;
                    return (
                        <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#18181b] text-slate-200">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
                                <span>{match ? match[1] : 'code'}</span>
                                <button onClick={() => handleCopyCode(codeString, 1)} className="flex items-center gap-1 hover:text-white cursor-pointer">
                                    {copiedCodeIndex === 1 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    <span>{copiedCodeIndex === 1 ? '已复制' : '复制'}</span>
                                </button>
                            </div>
                            <pre className="p-3 overflow-x-auto font-mono text-[12.5px] leading-relaxed custom-scrollbar"><code>{children}</code></pre>
                        </div>
                    );
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-3 rounded-xl border border-slate-200 max-h-64 object-cover" />
            };
        }

        // --- 3. 清爽海盐蔚蓝 (现代海洋风) ---
        if (markdownStyle === 'ocean_cyan') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[17px] font-black text-slate-900 mt-3.5 mb-2 pb-1.5 border-b border-sky-100 flex items-center gap-2">
                        <span className="w-1.5 h-4.5 bg-gradient-to-b from-sky-400 to-blue-600 rounded-full inline-block shrink-0 shadow-xs" />
                        <span>{children}</span>
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15.5px] font-bold text-slate-800 mt-3 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-3.5 bg-sky-400 rounded-full inline-block shrink-0" />
                        <span>{children}</span>
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14.5px] font-bold text-slate-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => <p className={`leading-[1.8] text-[14px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white' : 'text-slate-800'}`}>{children}</p>,
                strong: ({ children }: any) => (
                    <strong className={`font-black tracking-wide ${isUser ? 'text-white underline' : 'text-[#0369a1] bg-sky-50/90 px-1.5 py-0.5 rounded-lg border border-sky-200/80 shadow-2xs'}`}>
                        {children}
                    </strong>
                ),
                em: ({ children }: any) => <em className="italic text-sky-800">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2.5 space-y-1.5 pl-4 text-[14px] list-disc marker:text-sky-500">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2.5 space-y-1.5 pl-4 text-[14px] list-decimal marker:text-sky-600 marker:font-bold">{children}</ol>,
                li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }: any) => (
                    <blockquote className="my-3 border-l-[3.5px] border-sky-500 pl-3.5 py-2 bg-gradient-to-r from-sky-50/90 via-cyan-50/40 to-transparent rounded-r-2xl text-sky-950 text-[13px] leading-relaxed shadow-2xs">
                        {children}
                    </blockquote>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-3 rounded-2xl border border-sky-100 bg-white shadow-xs">
                        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-gradient-to-r from-sky-100/70 to-blue-50 text-sky-950 font-bold border-b border-sky-100">{children}</thead>,
                th: ({ children }: any) => <th className="p-3 font-bold text-sky-950">{children}</th>,
                td: ({ children }: any) => <td className="p-3 border-b border-sky-50 text-slate-700 text-[13px]">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    if (inline) return <code className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[12px] border border-sky-200">{children}</code>;
                    return <pre className="my-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[12.5px] overflow-x-auto"><code>{children}</code></pre>;
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-3 rounded-2xl border-2 border-white shadow max-h-64 object-cover" />
            };
        }

        // --- 4. 常青藤学院绿 (典雅翡翠风) ---
        if (markdownStyle === 'emerald_academic') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[17px] font-black text-slate-900 mt-3.5 mb-2 pb-1.5 border-b border-emerald-100 flex items-center gap-2">
                        <span className="w-1.5 h-4.5 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full inline-block shrink-0 shadow-xs" />
                        <span>{children}</span>
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15.5px] font-bold text-slate-800 mt-3 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-3.5 bg-emerald-400 rounded-full inline-block shrink-0" />
                        <span>{children}</span>
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14.5px] font-bold text-slate-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => <p className={`leading-[1.8] text-[14px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white' : 'text-slate-800'}`}>{children}</p>,
                strong: ({ children }: any) => (
                    <strong className={`font-black tracking-wide ${isUser ? 'text-white underline' : 'text-[#047857] bg-emerald-50/90 px-1.5 py-0.5 rounded-lg border border-emerald-200/80 shadow-2xs'}`}>
                        {children}
                    </strong>
                ),
                em: ({ children }: any) => <em className="italic text-emerald-800">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2.5 space-y-1.5 pl-4 text-[14px] list-disc marker:text-emerald-500">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2.5 space-y-1.5 pl-4 text-[14px] list-decimal marker:text-emerald-600 marker:font-bold">{children}</ol>,
                li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }: any) => (
                    <blockquote className="my-3 border-l-[3.5px] border-emerald-600 pl-3.5 py-2 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-transparent rounded-r-2xl text-emerald-950 text-[13px] leading-relaxed shadow-2xs">
                        {children}
                    </blockquote>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-3 rounded-2xl border border-emerald-100 bg-white shadow-xs">
                        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-gradient-to-r from-emerald-100/70 to-teal-50 text-emerald-950 font-bold border-b border-emerald-100">{children}</thead>,
                th: ({ children }: any) => <th className="p-3 font-bold text-emerald-950">{children}</th>,
                td: ({ children }: any) => <td className="p-3 border-b border-emerald-50 text-slate-700 text-[13px]">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    if (inline) return <code className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[12px] border border-emerald-200">{children}</code>;
                    return <pre className="my-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[12.5px] overflow-x-auto"><code>{children}</code></pre>;
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-3 rounded-2xl border-2 border-white shadow max-h-64 object-cover" />
            };
        }

        // --- 5. 暖阳琥珀金 (温暖明朗风) ---
        if (markdownStyle === 'amber_warm') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[17px] font-black text-slate-900 mt-3.5 mb-2 pb-1.5 border-b border-amber-100 flex items-center gap-2">
                        <span className="w-1.5 h-4.5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full inline-block shrink-0 shadow-xs" />
                        <span>{children}</span>
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15.5px] font-bold text-slate-800 mt-3 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-3.5 bg-amber-400 rounded-full inline-block shrink-0" />
                        <span>{children}</span>
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14.5px] font-bold text-slate-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => <p className={`leading-[1.8] text-[14px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white' : 'text-slate-800'}`}>{children}</p>,
                strong: ({ children }: any) => (
                    <strong className={`font-black tracking-wide ${isUser ? 'text-white underline' : 'text-[#b45309] bg-amber-50/90 px-1.5 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs'}`}>
                        {children}
                    </strong>
                ),
                em: ({ children }: any) => <em className="italic text-amber-800">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2.5 space-y-1.5 pl-4 text-[14px] list-disc marker:text-amber-500">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2.5 space-y-1.5 pl-4 text-[14px] list-decimal marker:text-amber-600 marker:font-bold">{children}</ol>,
                li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }: any) => (
                    <blockquote className="my-3 border-l-[3.5px] border-amber-500 pl-3.5 py-2 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-transparent rounded-r-2xl text-amber-950 text-[13px] leading-relaxed shadow-2xs">
                        {children}
                    </blockquote>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-3 rounded-2xl border border-amber-100 bg-white shadow-xs">
                        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-gradient-to-r from-amber-100/70 to-orange-50 text-amber-950 font-bold border-b border-amber-100">{children}</thead>,
                th: ({ children }: any) => <th className="p-3 font-bold text-amber-950">{children}</th>,
                td: ({ children }: any) => <td className="p-3 border-b border-amber-50 text-slate-700 text-[13px]">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    if (inline) return <code className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[12px] border border-amber-200">{children}</code>;
                    return <pre className="my-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[12.5px] overflow-x-auto"><code>{children}</code></pre>;
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-3 rounded-2xl border-2 border-white shadow max-h-64 object-cover" />
            };
        }

        // --- 6. Linear / Vercel 现代极客风 ---
        if (markdownStyle === 'linear_geek') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[16px] font-mono font-bold text-zinc-900 mt-3 mb-1.5 flex items-center gap-1.5 tracking-tight border-b border-zinc-200 pb-1">
                        <span className="text-purple-600 font-mono">#</span>
                        <span>{children}</span>
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15px] font-mono font-bold text-zinc-900 mt-2.5 mb-1 flex items-center gap-1.5">
                        <span className="text-indigo-500 font-mono">##</span>
                        <span>{children}</span>
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14px] font-bold text-zinc-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => (
                    <p className={`leading-relaxed text-[13.5px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white' : 'text-zinc-800'}`}>
                        {children}
                    </p>
                ),
                strong: ({ children }: any) => (
                    <strong className={`font-bold ${isUser ? 'text-white underline' : 'text-zinc-950 bg-zinc-100 px-1 py-0.5 rounded border border-zinc-300/70 font-mono text-[13px]'}`}>
                        {children}
                    </strong>
                ),
                em: ({ children }: any) => <em className="italic text-zinc-600">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2 space-y-1 pl-4 text-[13.5px] list-disc marker:text-zinc-400">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2 space-y-1 pl-4 text-[13.5px] list-decimal marker:font-mono marker:text-zinc-600">{children}</ol>,
                li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }: any) => (
                    <blockquote className="my-2.5 border-l-2 border-zinc-400 pl-3 py-1 bg-zinc-50 rounded-r text-zinc-700 text-[12.5px] font-mono">
                        {children}
                    </blockquote>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-2.5 rounded-lg border border-zinc-300 bg-white">
                        <table className="min-w-full text-[12.5px] font-mono text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-300">{children}</thead>,
                th: ({ children }: any) => <th className="p-2 border-b border-zinc-300">{children}</th>,
                td: ({ children }: any) => <td className="p-2 border-b border-zinc-200 text-zinc-700">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    if (inline) return <code className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-100 font-mono text-[12px]">{children}</code>;
                    return (
                        <div className="my-2.5 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 text-zinc-200">
                            <div className="flex items-center justify-between px-3 py-1 bg-zinc-900 border-b border-zinc-800 text-[10.5px] text-zinc-400 font-mono">
                                <span>{match ? match[1] : 'terminal'}</span>
                                <button onClick={() => handleCopyCode(codeString, 2)} className="hover:text-white cursor-pointer">{copiedCodeIndex === 2 ? 'COPIED' : 'COPY'}</button>
                            </div>
                            <pre className="p-3 overflow-x-auto font-mono text-[12px] leading-normal"><code>{children}</code></pre>
                        </div>
                    );
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-2 rounded border border-zinc-300 max-h-60" />
            };
        }

        // --- 7. Notion / 飞书 结构化知识文档风 ---
        if (markdownStyle === 'notion_doc') {
            return {
                h1: ({ children }: any) => (
                    <h1 className="text-[17px] font-extrabold text-slate-900 mt-3 mb-2 flex items-center gap-2">
                        <span className="text-purple-600">📌</span>
                        <span>{children}</span>
                    </h1>
                ),
                h2: ({ children }: any) => (
                    <h2 className="text-[15.5px] font-bold text-slate-800 mt-2.5 mb-1.5 flex items-center gap-1.5">
                        <span className="text-amber-500">▶</span>
                        <span>{children}</span>
                    </h2>
                ),
                h3: ({ children }: any) => <h3 className="text-[14.5px] font-bold text-slate-800 mt-2 mb-1">{children}</h3>,
                p: ({ children }: any) => <p className={`leading-[1.75] text-[14px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white' : 'text-slate-800'}`}>{children}</p>,
                strong: ({ children }: any) => (
                    <strong className={`font-bold ${isUser ? 'text-white underline' : 'text-amber-950 bg-amber-100/80 px-1.5 py-0.5 rounded-md border border-amber-200'}`}>
                        {children}
                    </strong>
                ),
                em: ({ children }: any) => <em className="italic text-purple-900">{children}</em>,
                ul: ({ children }: any) => <ul className="my-2 space-y-1.5 pl-4 text-[14px] list-disc marker:text-amber-500">{children}</ul>,
                ol: ({ children }: any) => <ol className="my-2 space-y-1.5 pl-4 text-[14px] list-decimal marker:text-purple-600 marker:font-bold">{children}</ol>,
                li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }: any) => (
                    <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-transparent border border-amber-200/80 text-amber-950 text-[13px] leading-relaxed flex items-start gap-2 shadow-2xs">
                        <Lightbulb size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">{children}</div>
                    </div>
                ),
                table: ({ children }: any) => (
                    <div className="overflow-x-auto my-3 rounded-2xl border border-amber-200/80 bg-white shadow-xs">
                        <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                    </div>
                ),
                thead: ({ children }: any) => <thead className="bg-amber-100/60 text-amber-950 font-bold border-b border-amber-200">{children}</thead>,
                th: ({ children }: any) => <th className="p-3 text-[12.5px] font-bold text-amber-950">{children}</th>,
                td: ({ children }: any) => <td className="p-3 border-b border-amber-50 text-slate-700 text-[13px]">{children}</td>,
                code: ({ inline, className, children }: any) => {
                    if (inline) return <code className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[12px]">{children}</code>;
                    return <pre className="my-2.5 p-3 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[12.5px] overflow-x-auto"><code>{children}</code></pre>;
                },
                img: ({ src, alt }: any) => <img src={src} alt={alt} className="my-2 rounded-2xl shadow border border-amber-100 max-h-64" />
            };
        }

        // --- 8. Neo Crystal 极光流体
        return {
            h1: ({ children }: any) => (
                <h1 className="text-[17px] font-black text-slate-900 mt-3.5 mb-2 pb-1.5 border-b border-purple-100/80 flex items-center gap-2 tracking-tight">
                    <span className="w-1.5 h-4.5 bg-gradient-to-b from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] rounded-full inline-block shrink-0 shadow-xs" />
                    <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{children}</span>
                </h1>
            ),
            h2: ({ children }: any) => (
                <h2 className="text-[15.5px] font-extrabold text-slate-800 mt-3 mb-1.5 flex items-center gap-1.5 tracking-tight">
                    <span className="w-1.5 h-3.5 bg-gradient-to-b from-[#8b5cf6] to-[#a855f7] rounded-full inline-block shrink-0" />
                    <span>{children}</span>
                </h2>
            ),
            h3: ({ children }: any) => (
                <h3 className="text-[14.5px] font-bold text-slate-800 mt-2.5 mb-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-purple-500 shrink-0" />
                    <span>{children}</span>
                </h3>
            ),
            p: ({ children }: any) => (
                <p className={`leading-[1.8] text-[13.5px] sm:text-[14px] my-1.5 whitespace-pre-wrap ${isUser ? 'text-white font-medium' : 'text-[#28223d]'
                    }`}>
                    {children}
                </p>
            ),
            strong: ({ children }: any) => (
                <strong className={`font-black tracking-wide ${isUser
                        ? 'text-white underline decoration-white/40 underline-offset-2'
                        : 'text-[#1e153f] bg-purple-50/90 text-purple-950 px-1.5 py-0.5 rounded-lg border border-purple-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)] inline-block my-0.5'
                    }`}>
                    {children}
                </strong>
            ),
            em: ({ children }: any) => (
                <em className={`italic ${isUser ? 'text-white/90' : 'text-purple-900/90'}`}>{children}</em>
            ),
            ul: ({ children }: any) => (
                <ul className="my-2.5 space-y-1.5 pl-4 text-[13.5px] sm:text-[14px] list-disc marker:text-purple-500">
                    {children}
                </ul>
            ),
            ol: ({ children }: any) => (
                <ol className="my-2.5 space-y-1.5 pl-4 text-[13.5px] sm:text-[14px] list-decimal marker:font-black marker:text-purple-600">
                    {children}
                </ol>
            ),
            li: ({ children }: any) => (
                <li className={`leading-[1.75] ${isUser ? 'text-white/95' : 'text-[#332c4d]'}`}>
                    {children}
                </li>
            ),
            blockquote: ({ children }: any) => (
                <blockquote className="my-3 border-l-[3.5px] border-[#7c3aed] pl-3.5 py-2 bg-gradient-to-r from-purple-50/90 via-indigo-50/30 to-transparent rounded-r-2xl text-[#3b3452] text-[13px] leading-relaxed shadow-2xs">
                    {children}
                </blockquote>
            ),
            table: ({ children }: any) => (
                <div className="overflow-x-auto my-3 rounded-2xl border border-purple-100/90 bg-white/95 shadow-sm">
                    <table className="min-w-full text-[13px] text-left border-collapse">{children}</table>
                </div>
            ),
            thead: ({ children }: any) => (
                <thead className="bg-gradient-to-r from-purple-100/70 via-indigo-50/60 to-purple-50 text-[#302656] font-black border-b border-purple-100">
                    {children}
                </thead>
            ),
            th: ({ children }: any) => (
                <th className="p-3 text-[12.5px] font-black text-slate-800">{children}</th>
            ),
            td: ({ children }: any) => (
                <td className="p-3 border-b border-slate-100 text-[#3d3656] text-[13px] leading-relaxed">{children}</td>
            ),
            code: ({ inline, className, children }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (inline) {
                    return (
                        <code className={`px-1.5 py-0.5 rounded-md font-mono text-[12px] font-semibold ${isUser
                                ? 'bg-white/20 text-white border border-white/20'
                                : 'bg-purple-50/90 text-purple-700 border border-purple-200/60'
                            }`}>
                            {children}
                        </code>
                    );
                }

                return (
                    <div className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-[#12131a] shadow-md text-slate-200">
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                            <span>{match ? match[1] : 'code'}</span>
                            <button
                                type="button"
                                onClick={() => handleCopyCode(codeString, 4)}
                                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                            >
                                {copiedCodeIndex === 4 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                <span>{copiedCodeIndex === 4 ? '已复制' : '复制代码'}</span>
                            </button>
                        </div>
                        <pre className="p-3.5 overflow-x-auto font-mono text-[12.5px] leading-relaxed custom-scrollbar">
                            <code>{children}</code>
                        </pre>
                    </div>
                );
            },
            img: ({ src, alt }: any) => (
                <div className="my-3 rounded-2xl overflow-hidden shadow-md border-2 border-white max-w-full group relative bg-gray-50">
                    <img
                        src={src}
                        alt={alt || '图片附件'}
                        className="w-full max-h-64 object-cover hover:scale-102 transition-transform duration-500"
                    />
                    {alt && (
                        <div className="p-2.5 bg-white/95 text-[11px] text-[#4a4365] font-bold border-t border-gray-100 flex items-center gap-1.5 shadow-xs">
                            <ImageIcon size={13} className="text-[#a494e8]" />
                            <span>{alt}</span>
                        </div>
                    )}
                </div>
            )
        };
    }, [markdownStyle, roleColor, isUser, copiedCodeIndex]);

    return (
        <div className={`markdown-body markdown-style-${markdownStyle}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {safeContent}
            </ReactMarkdown>
        </div>
    );
});
