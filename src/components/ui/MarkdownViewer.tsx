import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Image as ImageIcon } from 'lucide-react';

// Helper function to sanitize unclosed markdown syntax tags (images, tables)
export const sanitizeMarkdownContent = (rawText: string) => {
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

interface MarkdownViewerProps {
    content: string;
    roleColor?: string;
}

export const MarkdownViewer = React.memo(({ content, roleColor = '#a494e8' }: MarkdownViewerProps) => {
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
