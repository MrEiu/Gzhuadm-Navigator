import React from 'react';
import { Plus, Send } from 'lucide-react';

interface ChatInputBarProps {
    inputText: string;
    setInputText: (text: string) => void;
    onSend: (e: React.FormEvent) => void;
    onOpenMapGuide: () => void;
    typing: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
    inputText,
    setInputText,
    onSend,
    onOpenMapGuide,
    typing
}) => {
    return (
        <footer className="px-5 pb-6 pt-1 relative z-10">
            <div className="bg-white/80 backdrop-blur-2xl rounded-[36px] p-4 shadow-[0_-15px_45px_rgba(186,175,215,0.2)] border border-white">
                <form onSubmit={onSend} className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={onOpenMapGuide}
                        className="group relative bg-[#f3eefc] hover:bg-[#a494e8] text-[#a494e8] hover:text-white p-3 rounded-[20px] active:scale-95 transition-all flex items-center justify-center border border-[#e4dcf8] shadow-sm shrink-0 cursor-pointer"
                        title="打开地图导览"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#4a4365] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                            地图导览
                        </span>
                    </button>
                    <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="请输入您想咨询的入学、专业、学费问题..."
                        className="flex-1 bg-[#f8f6fc] border-none rounded-[20px] px-5 py-3 text-[14px] focus:ring-2 focus:ring-[#a494e8] outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || typing}
                        className="bg-[#4a4365] text-white p-3 rounded-[20px] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </footer>
    );
};
