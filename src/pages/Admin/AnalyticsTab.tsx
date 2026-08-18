import React, { useState } from 'react';
import {
    MessageSquare, Sparkles, Search, Copy, Check, Plus,
    Filter, Calendar, User as UserIcon, Bot, ArrowRight
} from 'lucide-react';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { RagItem } from '../../types';

interface AnalyticsTabProps {
    highFrequencyWords: Array<{ word: string; count: number }>;
    allUserDialogues: any[];
    adminMessageSearch: string;
    setAdminMessageSearch: React.Dispatch<React.SetStateAction<string>>;
    onConvertToRag: (dialogue: { question: string; reply: string }) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
    highFrequencyWords,
    allUserDialogues,
    adminMessageSearch,
    setAdminMessageSearch,
    onConvertToRag
}) => {
    const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days'>('all');
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
    const [copiedDialogueId, setCopiedDialogueId] = useState<string | null>(null);

    const handleCopyReply = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedDialogueId(id);
        setTimeout(() => setCopiedDialogueId(null), 2000);
    };

    const now = Date.now();
    const filteredDialogues = allUserDialogues.filter(d => {
        // Time filter
        if (timeRange === 'today') {
            const dTime = new Date(d.timestamp).getTime();
            if (now - dTime > 24 * 3600 * 1000) return false;
        } else if (timeRange === '7days') {
            const dTime = new Date(d.timestamp).getTime();
            if (now - dTime > 7 * 24 * 3600 * 1000) return false;
        }

        // Keyword chip filter
        if (selectedKeyword) {
            const combined = `${d.question} ${d.reply}`;
            if (!combined.includes(selectedKeyword)) return false;
        }

        // Search query filter
        if (adminMessageSearch.trim()) {
            const q = adminMessageSearch.toLowerCase().trim();
            const combined = `${d.question} ${d.reply} ${d.username} ${d.sessionTitle}`.toLowerCase();
            if (!combined.includes(q)) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Top High Frequency Keyword Cloud */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="font-black text-[#4a4365] text-[14px] flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        <span>咨询意向高频关键词热点分析 (Top 15)</span>
                    </div>
                    {selectedKeyword && (
                        <button
                            onClick={() => setSelectedKeyword(null)}
                            className="text-[11px] text-purple-600 hover:text-purple-800 font-bold cursor-pointer"
                        >
                            清除词频联动筛选
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                    {highFrequencyWords.map((item, idx) => {
                        const isSelected = selectedKeyword === item.word;
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedKeyword(isSelected ? null : item.word)}
                                className={`px-3 py-1.5 rounded-2xl text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                                        ? 'bg-[#4a4365] text-white shadow-sm'
                                        : 'bg-[#fbf9fe] hover:bg-purple-50 text-[#4a4365] border border-purple-50'
                                    }`}
                            >
                                <span>#{item.word}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {item.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Filter Bar & Search */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-white shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={adminMessageSearch}
                            onChange={(e) => setAdminMessageSearch(e.target.value)}
                            placeholder="搜索问答内容、提问学生、会话主题..."
                            className="w-full bg-[#f8f6fc] pl-9 pr-4 py-2.5 rounded-2xl text-[12.5px] font-bold text-[#4a4365] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>

                    {/* Time Range Filter */}
                    <div className="flex bg-[#f8f6fc] p-1 rounded-2xl border border-purple-50">
                        {[
                            { id: 'all', label: '全部' },
                            { id: 'today', label: '今日' },
                            { id: '7days', label: '近7天' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTimeRange(t.id as any)}
                                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${timeRange === t.id ? 'bg-white text-[#4a4365] shadow-2xs' : 'text-gray-400'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="text-[12px] font-bold text-gray-500">
                    筛选出 <span className="text-purple-600">{filteredDialogues.length}</span> 条问答记录
                </div>
            </div>

            {/* 3. Dialogue Stream with Full Markdown Rendering */}
            <div className="space-y-4">
                {filteredDialogues.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center text-gray-400">
                        <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
                        <div className="text-[14px] font-bold">未查找到匹配的考生咨询问答</div>
                    </div>
                ) : (
                    filteredDialogues.map((d) => (
                        <div
                            key={d.id}
                            className="bg-white/85 backdrop-blur-md rounded-3xl p-5 border border-white shadow-xs space-y-3"
                        >
                            {/* Dialogue Header */}
                            <div className="flex items-center justify-between border-b border-purple-50/80 pb-2.5">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#4a4365]">
                                    <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg text-[11px]">
                                        @{d.username}
                                    </span>
                                    <span className="text-gray-400 font-normal">在会话</span>
                                    <span className="text-gray-700">{d.sessionTitle}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10.5px] text-gray-400">
                                        {new Date(d.timestamp).toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleCopyReply(d.id, d.reply)}
                                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                                        title="复制回答"
                                    >
                                        {copiedDialogueId === d.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                        <span>{copiedDialogueId === d.id ? '已复制' : '复制回答'}</span>
                                    </button>

                                    <button
                                        onClick={() => onConvertToRag({ question: d.question, reply: d.reply })}
                                        className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
                                        title="将该条优秀问答沉淀为标准 RAG 知识"
                                    >
                                        <Plus size={12} />
                                        <span>沉淀为知识</span>
                                    </button>
                                </div>
                            </div>

                            {/* Question */}
                            <div className="bg-[#fbf9fe] p-3.5 rounded-2xl border border-purple-50/70 text-[13px] font-bold text-[#4a4365] flex items-start gap-2.5">
                                <span className="bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                                    问
                                </span>
                                <div className="leading-relaxed">{d.question}</div>
                            </div>

                            {/* Answer with Full Markdown Viewer */}
                            <div className="p-3.5 rounded-2xl bg-white/70 border border-purple-50/60 text-[13px] leading-relaxed">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 mb-2">
                                    <Bot size={14} /> AI 顾问官方解答：
                                </div>
                                <MarkdownViewer content={d.reply || '无回复内容'} roleColor="#8b5cf6" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
