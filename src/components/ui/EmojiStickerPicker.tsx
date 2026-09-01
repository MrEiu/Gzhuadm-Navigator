import React, { useState, useMemo, useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';
import { Film, Smile, X, Search } from 'lucide-react';
import { GIF_MEMES, GIF_CATEGORIES, GifMeme } from '../../constants/gifMemes';

interface EmojiStickerPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEmoji: (emojiNative: string) => void;
    onSelectGif: (gif: GifMeme) => void;
    align?: 'left' | 'right';
}

const EmojiPickerComponent: React.FC<{ onSelectEmoji: (emojiNative: string) => void }> = ({ onSelectEmoji }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const picker = new Picker({
            data,
            onEmojiSelect: (emoji: any) => {
                if (emoji?.native) {
                    onSelectEmoji(emoji.native);
                }
            },
            locale: 'zh',
            theme: 'light',
            previewPosition: 'none',
            skinTonePosition: 'search',
            navPosition: 'bottom',
            perLine: 8,
            maxFrequentRows: 1,
        });
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(picker as unknown as Node);
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [onSelectEmoji]);

    return <div ref={containerRef} className="emoji-mart-container flex-1 overflow-hidden" />;
};

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
    isOpen,
    onClose,
    onSelectEmoji,
    onSelectGif,
    align = 'right'
}) => {
    const [activeTab, setActiveTab] = useState<'gifs' | 'emojis'>('gifs');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGifs = useMemo(() => {
        return GIF_MEMES.filter(gif => {
            const matchesCategory = selectedCategory === 'all' || gif.category === selectedCategory;
            const matchesQuery = !searchQuery.trim() || gif.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
            return matchesCategory && matchesQuery;
        });
    }, [selectedCategory, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className={`absolute bottom-14 ${align === 'right' ? 'right-0' : 'left-2 sm:left-4'} z-50 bg-white/95 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_20px_50px_rgba(74,67,101,0.28)] overflow-hidden w-[340px] sm:w-[380px] max-h-[500px] flex flex-col animate-in slide-in-from-bottom-3 duration-200 select-none`}>
            {/* Header Tabs */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-b border-purple-100/80">
                <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-2xl border border-white shadow-xs">
                    <button
                        type="button"
                        onClick={() => setActiveTab('gifs')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                            activeTab === 'gifs'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                : 'text-[#6b6488] hover:text-[#4a4365]'
                        }`}
                    >
                        <Film size={13} />
                        <span>动态表情包 (GIF)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('emojis')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                            activeTab === 'emojis'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                : 'text-[#6b6488] hover:text-[#4a4365]'
                        }`}
                    >
                        <Smile size={13} />
                        <span>Emoji 符号</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Tab 1: Real Animated GIF Memes */}
            {activeTab === 'gifs' && (
                <div className="p-3 flex flex-col flex-1 overflow-hidden space-y-2.5">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索表情包 (如：上岸、干杯、思考、猫猫)..."
                            className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-purple-50/50 hover:bg-purple-50/80 focus:bg-white rounded-xl border border-purple-100/80 focus:border-purple-300 outline-none text-[#4a4365] placeholder:text-gray-400 transition-all"
                        />
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                        {GIF_CATEGORIES.map(cat => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setSelectedCategory(cat.key)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                                    selectedCategory === cat.key
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-white/80 hover:bg-white text-gray-600 hover:text-purple-700 border border-gray-100'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Memes Grid */}
                    <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-2">
                        {filteredGifs.length === 0 ? (
                            <div className="py-8 text-center text-[12px] text-gray-400">
                                暂无相关表情包，试试搜索其他关键词
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {filteredGifs.map((gif) => (
                                    <div
                                        key={gif.id}
                                        onClick={() => {
                                            onSelectGif(gif);
                                            onClose();
                                        }}
                                        className="group relative rounded-2xl overflow-hidden bg-purple-50/60 border border-purple-100/80 hover:border-purple-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center p-1.5 active:scale-95"
                                        title={gif.title}
                                    >
                                        <img
                                            src={gif.url}
                                            alt={gif.title}
                                            className="w-full h-18 sm:h-20 object-cover rounded-xl group-hover:scale-105 transition-transform"
                                            loading="lazy"
                                        />
                                        <div className="text-[10px] font-bold text-[#4a4365] mt-1 truncate max-w-full text-center">
                                            {gif.title}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab 2: Emoji Mart Official Picker */}
            {activeTab === 'emojis' && (
                <EmojiPickerComponent onSelectEmoji={onSelectEmoji} />
            )}
        </div>
    );
};
