import React, { useState, useRef } from 'react';
import { FileText, ExternalLink, Volume2, VolumeX, Loader2, Copy, Check, ChevronDown, ChevronUp, BrainCircuit, Cpu } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { ChatMessage, BubbleThemeId, BubbleCustomSettings, ApiDiagnostics } from '../../types';
import { BUBBLE_THEMES, DEFAULT_BUBBLE_SETTINGS } from '../../constants/bubbleThemes';
import { API_BASE } from '../../api/config';

interface ChatMessageBubbleProps {
    msg: ChatMessage;
    isUser: boolean;
    bubbleStyle?: string;
    roleColor: string;
    roleAvatar: string;
    roleName: string;
    userAvatar?: string;
    bubbleTheme?: BubbleThemeId;
    customSettings?: Partial<BubbleCustomSettings>;
    isAdmin?: boolean;
    onOpenDiagnostics?: (diag: ApiDiagnostics) => void;
}

export const ChatMessageBubble = React.memo(({
    msg,
    isUser,
    roleColor,
    roleAvatar,
    roleName,
    userAvatar,
    bubbleTheme = 'antdesign_filled',
    customSettings,
    isAdmin = false,
    onOpenDiagnostics
}: ChatMessageBubbleProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isThoughtOpen, setIsThoughtOpen] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const themeConfig = BUBBLE_THEMES[bubbleTheme] || BUBBLE_THEMES.antdesign_filled || BUBBLE_THEMES.ios;
    const settings = { ...DEFAULT_BUBBLE_SETTINGS, ...customSettings };

    const isUserImg = Boolean(
        userAvatar &&
        (userAvatar.startsWith('http') || userAvatar.startsWith('/uploads') || userAvatar.startsWith('data:image'))
    );

    const effectiveName = msg.senderName || roleName;
    const effectiveAvatar = msg.senderAvatar || roleAvatar;
    const effectiveColor = msg.senderColor || roleColor;
    const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;

    // Handle GIF Detection ([gif:https://...])
    const gifMatches = (msg.text.match(/\[gif:(https?:\/\/[^\]]+)\]/g) || []).map(tag =>
        tag.replace('[gif:', '').replace(']', '')
    );
    const cleanText = msg.text
        .replace(/\[gif:https?:\/\/[^\]]+\]/g, '')
        .replace(/\[sticker:[a-zA-Z0-9_]+\]/g, '')
        .trim();

    // Copy Message Text
    const handleCopyText = () => {
        const textToCopy = cleanText || msg.text;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Handle TTS audio speech playback (Strip Markdown syntax for natural speech)
    const handleToggleAudio = async () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        const rawText = cleanText || msg.text;
        if (!rawText) return;

        // Clean Markdown syntax before sending to speech engine
        const textToRead = rawText
            .replace(/\[gif:[^\]]+\]/g, '')
            .replace(/\[sticker:[^\]]+\]/g, '')
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/#{1,6}/g, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/^>\s*/gm, '')
            .replace(/^[-*_]{3,}\s*$/gm, '')
            .replace(/[-:]{3,}/g, '')
            .replace(/^\|/gm, '')
            .replace(/\|$/gm, '')
            .replace(/\|/g, '，')
            .replace(/^[\*\-\+]\s+/gm, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!textToRead) return;

        setLoadingAudio(true);
        try {
            const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToRead.slice(0, 500),
                    voice: msg.senderVoice || undefined
                })
            });

            if (!res.ok) throw new Error('TTS Failed');
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
            };
            audio.onerror = () => {
                setIsPlaying(false);
                setLoadingAudio(false);
            };

            await audio.play();
            setIsPlaying(true);
        } catch (err) {
            console.warn('TTS playback error:', err);
        } finally {
            setLoadingAudio(false);
        }
    };

    const hasThinkingBox = !isUser && Boolean(msg.reasoningText);

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-3 duration-300`}>
            <div className={`flex max-w-[92%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5`}>
                {/* Avatar */}
                {isUser ? (
                    isUserImg ? (
                        <img
                            src={userAvatar}
                            className="w-9 h-9 rounded-2xl shadow-xs border border-white object-cover shrink-0"
                            alt="user avatar"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop";
                            }}
                        />
                    ) : userAvatar ? (
                        <div className="w-9 h-9 rounded-2xl shadow-xs border border-white bg-gradient-to-tr from-purple-200 to-indigo-100 flex items-center justify-center text-base shrink-0 select-none">
                            {userAvatar}
                        </div>
                    ) : (
                        <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"
                            className="w-9 h-9 rounded-2xl shadow-xs border border-white object-cover shrink-0"
                            alt="user avatar"
                        />
                    )
                ) : (
                    <img
                        src={effectiveAvatar}
                        className="w-9 h-9 rounded-2xl shadow-xs border border-white object-cover shrink-0"
                        alt="bot avatar"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop";
                        }}
                    />
                )}

                <div className="flex flex-col">
                    {/* Header line for Bot (Name + Role Badge + Mode / Thought Clones Badge) */}
                    {!isUser && (
                        <div className="flex items-center gap-1.5 mb-1.5 ml-1 flex-wrap">
                            <span className="text-[12px] font-black tracking-wide" style={{ color: effectiveColor }}>
                                {effectiveName}
                            </span>
                            {msg.senderTitle && (
                                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-purple-50 font-bold border border-purple-100 text-purple-700">
                                    {msg.senderTitle}
                                </span>
                            )}
                            {msg.source === 'faq-template-direct' ? (
                                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 font-bold border border-amber-300 text-amber-800 flex items-center gap-1 shadow-2xs" title="通过高频 FAQ 模板库两阶段核验直接秒发直出">
                                    ⚡ 官方黄金标准问答
                                </span>
                            ) : msg.mode === 'lightweight' ? (
                                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-amber-50 font-bold border border-amber-200/80 text-amber-700 flex items-center gap-1">
                                    ⚡ 极速轻量
                                </span>
                            ) : null}
                            {msg.mode === 'agent' && msg.activeClones && msg.activeClones.length > 0 && (
                                <span 
                                    className="text-[9.5px] px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 font-bold border border-purple-200/80 text-purple-700 flex items-center gap-1 shadow-xs"
                                    title={`参与并发研判的思维分身：${msg.activeClones.map(c => c.name).join(' · ')}`}
                                >
                                    <span>🧠</span>
                                    <span>{msg.activeClones.map(c => c.tag).join(' ')}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Attachments (Images & Files) */}
                    {hasAttachments && (
                        <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {msg.attachments!.map((att, i) => (
                                <div key={i} className="group relative">
                                    {att.type === 'image' ? (
                                        <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block overflow-hidden rounded-2xl border-2 border-white/80 shadow-md hover:opacity-95 transition-all max-w-[200px]"
                                        >
                                            <img
                                                src={att.url}
                                                alt={att.name || '附件图片'}
                                                className="w-full max-h-[160px] object-cover bg-slate-100"
                                            />
                                            <div className="text-[10px] px-2 py-0.5 bg-black/60 text-white truncate max-w-full">
                                                {att.name}
                                            </div>
                                        </a>
                                    ) : (
                                        <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all text-[12px] shadow-xs bg-white/90 text-[#4a4365] border-purple-100 hover:border-[#a494e8]"
                                        >
                                            <FileText size={15} className="text-purple-600 shrink-0" />
                                            <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                                            <ExternalLink size={12} className="text-gray-400 shrink-0" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AntDesignX ThoughtChain / DeepSeek Reasoning Box */}
                    {hasThinkingBox && (
                        <div className="mb-2 max-w-full rounded-2xl border border-purple-100/90 bg-[#fbf9fe] p-3 text-[11.5px] text-[#7a7398] shadow-xs">
                            <button
                                type="button"
                                onClick={() => setIsThoughtOpen(!isThoughtOpen)}
                                className="flex w-full items-center justify-between font-bold text-purple-700 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <BrainCircuit size={13} className="text-purple-600" />
                                    <span>思考过程 (Thought Chain)</span>
                                </span>
                                {isThoughtOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {isThoughtOpen && (
                                <div className="mt-2 border-t border-purple-100/60 pt-2 text-[11px] leading-relaxed text-[#6b6488] whitespace-pre-wrap">
                                    {msg.reasoningText}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message Bubble Body (Skin & Custom Parameters Applied) */}
                    {cleanText && (
                        <div
                            className={`px-5 py-3.5 sm:px-6 sm:py-4 relative transition-all ${
                                isUser ? themeConfig.userClass : themeConfig.botClass
                            }`}
                            style={{
                                borderRadius: `${settings.borderRadius}px`,
                                ...(settings.showTail
                                    ? isUser
                                        ? { borderBottomRightRadius: '4px' }
                                        : { borderTopLeftRadius: '4px' }
                                    : {}),
                                ...(!isUser && settings.accentBarWidth > 0
                                    ? { borderLeft: `${settings.accentBarWidth}px solid ${effectiveColor}` }
                                    : {})
                            }}
                        >
                            <MarkdownViewer
                                content={cleanText}
                                roleColor={isUser ? '#fff' : effectiveColor}
                                isUser={isUser}
                                markdownStyle={settings.markdownStyle || 'crystal'}
                            />

                            {/* Floating Action Toolbar on Hover (Copy, Audio Voice) */}
                            {!isUser && settings.showActions && (
                                <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-black/5 opacity-80 group-hover:opacity-100 transition-opacity text-[11px]">
                                    <button
                                        type="button"
                                        onClick={handleCopyText}
                                        className="p-1 rounded-md hover:bg-black/5 text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
                                        title="复制文字"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={11} className="text-emerald-500" />
                                                <span className="text-[10px] text-emerald-600 font-bold">已复制</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={11} />
                                                <span className="text-[10px]">复制</span>
                                            </>
                                        )}
                                    </button>

                                    {isAdmin && msg.diagnostics && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenDiagnostics?.(msg.diagnostics!)}
                                            className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center gap-1 transition-colors border border-purple-200/60 cursor-pointer shadow-2xs mr-1"
                                            title="查看该回复的 AI API 请求参数、RAG 向量及 Token 耗时诊断"
                                        >
                                            <Cpu size={11} className="text-purple-600" />
                                            <span>API 诊断</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleToggleAudio}
                                        disabled={loadingAudio}
                                        className="p-1 rounded-md hover:bg-purple-100 text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1 cursor-pointer ml-1"
                                        title="朗读该回复"
                                    >
                                        {loadingAudio ? (
                                            <Loader2 size={11} className="animate-spin text-purple-600" />
                                        ) : isPlaying ? (
                                            <>
                                                <VolumeX size={11} className="text-purple-600 animate-pulse" />
                                                <span className="text-[10px] text-purple-600 font-bold">播放中</span>
                                            </>
                                        ) : (
                                            <>
                                                <Volume2 size={11} />
                                                <span className="text-[10px]">朗读</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Real Animated GIFs & Image Meme Stickers */}
                    {gifMatches.length > 0 && (
                        <div className={`flex flex-wrap gap-2.5 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            {gifMatches.map((gifUrl, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-3xl overflow-hidden border-2 border-white/90 shadow-md bg-white/60 p-1 animate-in zoom-in-95 hover:scale-105 transition-transform max-w-[180px]"
                                >
                                    <img
                                        src={gifUrl}
                                        alt="animated meme gif"
                                        className="w-full max-h-[150px] object-cover rounded-2xl"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
