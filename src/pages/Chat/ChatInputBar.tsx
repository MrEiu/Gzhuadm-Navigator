import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Image as ImageIcon, FileText, MapPin, X, Loader2, AtSign, Smile, Zap, Sparkles, Paperclip } from 'lucide-react';
import { ChatAttachment, ChatMode, MultiAgentRoster, AdvisorMode } from '../../types';
import { GifMeme } from '../../constants/gifMemes';
import { API_BASE } from '../../api/config';
import { EmojiStickerPicker } from '../../components/ui/EmojiStickerPicker';

interface ChatInputBarProps {
    inputText: string;
    setInputText: (text: string) => void;
    onSend: (e: React.FormEvent, attachments?: ChatAttachment[]) => void;
    onOpenMapGuide: () => void;
    typing: boolean;
    advisorMode?: AdvisorMode;
    onChangeAdvisorMode?: (mode: AdvisorMode) => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
    inputText,
    setInputText,
    onSend,
    onOpenMapGuide,
    typing,
    advisorMode = 'agent',
    onChangeAdvisorMode
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [allowMediaUpload, setAllowMediaUpload] = useState(true);
    const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
    const [uploading, setUploading] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/chat/media-config`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && typeof data.allowUserMediaUpload === 'boolean') {
                    setAllowMediaUpload(data.allowUserMediaUpload);
                }
            })
            .catch(() => {});
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setIsEmojiPickerOpen(false);
            }
        };
        if (isMenuOpen || isEmojiPickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, isEmojiPickerOpen]);

    const handleUploadFile = async (file: File, type: 'image' | 'file') => {
        if (!file) return;
        if (!allowMediaUpload) {
            alert('管理员当前已关闭图片与文件上传功能。');
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            alert('上传文件不能超过 15MB');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const res = await fetch(`${API_BASE}/api/chat/upload-attachment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64,
                        filename: file.name,
                        fileType: type
                    })
                });
                const data = await res.json();
                if (data.ok && data.attachment) {
                    setPendingAttachments(prev => [...prev, data.attachment]);
                } else {
                    alert(data.error || '附件上传失败，请重试');
                }
                setUploading(false);
                setIsMenuOpen(false);
            };
        } catch (err) {
            console.error('Upload failed:', err);
            setUploading(false);
            alert('上传发生异常，请检查网络');
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!allowMediaUpload) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                if (blob) {
                    e.preventDefault();
                    handleUploadFile(blob, 'image');
                    break;
                }
            }
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setPendingAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEmojiPickerOpen(false);
        setIsMenuOpen(false);
        onSend(e, pendingAttachments);
        setPendingAttachments([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
    };

    const handleSelectEmoji = (emojiNative: string) => {
        setInputText(`${inputText}${emojiNative}`);
        inputRef.current?.focus();
    };

    const handleSelectGif = (gif: GifMeme) => {
        setIsEmojiPickerOpen(false);
        setInputText(`${inputText} [gif:${gif.url}] `);
        inputRef.current?.focus();
    };

    return (
        <footer className="w-full px-2.5 sm:px-8 pb-2.5 sm:pb-6 pt-1 shrink-0 relative bg-transparent pointer-events-auto">
            <div className="w-full max-w-[840px] mx-auto flex flex-col gap-1.5 sm:gap-2">
                {/* Pending Attachments Tray */}
                {pendingAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 px-2">
                        {pendingAttachments.map((att, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl bg-white border border-purple-200 shadow-sm text-xs text-[#4a4365] animate-in fade-in zoom-in-95"
                            >
                                {att.type === 'image' ? (
                                    <ImageIcon size={13} className="text-purple-600 shrink-0" />
                                ) : (
                                    <FileText size={13} className="text-indigo-600 shrink-0" />
                                )}
                                <span className="max-w-[100px] sm:max-w-[120px] truncate font-medium">{att.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(idx)}
                                    className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Uploading progress indicator */}
                {uploading && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 font-bold px-3 animate-pulse">
                        <Loader2 size={13} className="animate-spin" />
                        <span>正在上传附件并解析...</span>
                    </div>
                )}

                {/* 悬浮一体式胶囊输入框 */}
                <form onSubmit={handleFormSubmit} className="w-full bg-white/95 backdrop-blur-2xl rounded-[28px] p-1 sm:p-2 border border-white shadow-[0_12px_36px_rgba(74,67,101,0.12)] hover:shadow-[0_16px_46px_rgba(74,67,101,0.16)] transition-all flex items-center gap-1 sm:gap-2 relative">
                    {/* Plus Attachment Actions Menu (左侧功能按键) */}
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsMenuOpen(!isMenuOpen);
                                setIsEmojiPickerOpen(false);
                            }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                isMenuOpen
                                    ? 'bg-[#4a4365] text-white shadow-md rotate-45'
                                    : 'bg-[#f5f1fc] hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-100/60 shadow-2xs'
                            }`}
                            title="上传图片/文件/文档"
                        >
                            <Plus size={18} className="transition-transform duration-200" />
                        </button>

                        {/* Plus Popover */}
                        {isMenuOpen && (
                            <div className="absolute bottom-12 sm:bottom-14 left-0 z-40 bg-white/95 backdrop-blur-2xl rounded-3xl border border-white p-2.5 shadow-[0_20px_50px_rgba(74,67,101,0.25)] min-w-[200px] max-w-[calc(100vw-32px)] flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200">
                                <div className="text-[10px] font-black text-[#8a84a4] uppercase px-3 py-1 tracking-wider border-b border-purple-50">
                                    快捷功能与附件
                                </div>

                                {/* Unified Upload Attachment (Images + Documents) */}
                                <button
                                    type="button"
                                    disabled={!allowMediaUpload}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-[12.5px] font-bold transition-all text-left ${
                                        allowMediaUpload
                                            ? 'text-[#4a4365] hover:bg-[#f3eefc] hover:text-purple-700 cursor-pointer'
                                            : 'text-gray-400 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <Paperclip size={15} />
                                    </div>
                                    <div>
                                        <div>上传图片或文档</div>
                                        <div className="text-[10px] font-normal text-gray-400">
                                            {allowMediaUpload ? '支持图片、成绩单、PDF及文档' : '管理员已关闭'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Unified Hidden Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.txt,.csv,.docx,.doc,.md,.json,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
                                handleUploadFile(file, isImg ? 'image' : 'file');
                            }
                            e.target.value = '';
                        }}
                    />

                    {/* Text Input (中间文本输入框) */}
                    <input
                        ref={inputRef}
                        value={inputText}
                        onChange={handleInputChange}
                        onPaste={handlePaste}
                        placeholder={allowMediaUpload ? "输入高招咨询问题..." : "输入高招录取、专业、学费等咨询问题..."}
                        className="flex-1 bg-transparent border-none px-2 sm:px-3 py-1.5 sm:py-2 text-[13.5px] sm:text-[14px] text-[#4a4365] placeholder:text-gray-400 outline-none min-w-0"
                    />

                    {/* Emoji & Meme Sticker Picker Button (移动到文本输入框右侧) */}
                    <div className="relative shrink-0" ref={emojiPickerRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEmojiPickerOpen(!isEmojiPickerOpen);
                                setIsMenuOpen(false);
                            }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                isEmojiPickerOpen
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-transparent hover:bg-purple-50 text-[#8a84a4] hover:text-purple-700'
                            }`}
                            title="打开表情包与 Emoji 选择器"
                        >
                            <Smile size={19} />
                        </button>

                        <EmojiStickerPicker
                            isOpen={isEmojiPickerOpen}
                            onClose={() => setIsEmojiPickerOpen(false)}
                            onSelectEmoji={handleSelectEmoji}
                            onSelectGif={handleSelectGif}
                            align="right"
                        />
                    </div>

                    {/* Send Button (右侧发送按键) */}
                    <button
                        type="submit"
                        disabled={(!inputText.trim() && pendingAttachments.length === 0) || typing || uploading}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#4a4365] hover:bg-[#39334d] text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
                        title="发送咨询"
                    >
                        <Send size={17} />
                    </button>
                </form>
            </div>
        </footer>
    );
};
