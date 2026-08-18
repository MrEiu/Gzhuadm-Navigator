import React from 'react';
import { Search } from 'lucide-react';
import { WordAnalyticsDb } from '../../types';

interface AnalyticsTabProps {
    wordAnalyticsDb: WordAnalyticsDb;
    highFrequencyWords: { word: string; count: number }[];
    adminMessageSearch: string;
    setAdminMessageSearch: (s: string) => void;
    allUserDialogues: any[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
    wordAnalyticsDb,
    highFrequencyWords,
    adminMessageSearch,
    setAdminMessageSearch,
    allUserDialogues
}) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Word Frequency Analytics Card */}
            <div className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                    <div>
                        <h3 className="font-black text-[#4a4365] text-[14px]">
                            考生咨询高频关键词意向分析
                        </h3>
                        <p className="text-[11px] text-[#8a84a4]">
                            基于全部历史对话记录自动增量提取的核心关注热词
                        </p>
                    </div>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                        已分析 {wordAnalyticsDb.totalAnalyzedCount} 条对话
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {highFrequencyWords.length === 0 ? (
                        <div className="text-gray-400 text-[12px] py-4">暂无高频词统计数据</div>
                    ) : (
                        highFrequencyWords.map((item, idx) => {
                            const isSelected = adminMessageSearch === item.word;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setAdminMessageSearch(isSelected ? '' : item.word)}
                                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isSelected
                                            ? 'bg-[#4a4365] text-white shadow-sm'
                                            : 'bg-[#f8f6fc] text-[#4a4365] hover:bg-purple-100'
                                        }`}
                                >
                                    <span>#{item.word}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/60 text-purple-700">
                                        {item.count}次
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Dialogue Records View */}
            <div className="bg-white/80 rounded-3xl p-5 border border-white shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                    <h3 className="font-black text-[#4a4365] text-[14px]">
                        全网考生咨询问答记录明细
                    </h3>
                    <div className="relative w-56">
                        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            value={adminMessageSearch}
                            onChange={(e) => setAdminMessageSearch(e.target.value)}
                            placeholder="搜索问答内容..."
                            className="w-full bg-[#f8f6fc] pl-8 pr-4 py-1.5 rounded-xl text-[11.5px] outline-none focus:ring-2 focus:ring-[#a494e8]"
                        />
                    </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 hide-scrollbar">
                    {allUserDialogues
                        .filter(d =>
                            !adminMessageSearch ||
                            d.question.toLowerCase().includes(adminMessageSearch.toLowerCase()) ||
                            d.reply.toLowerCase().includes(adminMessageSearch.toLowerCase()) ||
                            d.username.toLowerCase().includes(adminMessageSearch.toLowerCase())
                        )
                        .map(d => (
                            <div key={d.id} className="bg-white/90 rounded-2xl p-4 border border-white shadow-2xs space-y-2.5 hover:border-purple-200 transition-all">
                                <div className="flex items-center justify-between border-b pb-1.5 border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-purple-100 text-purple-700 text-[10.5px] px-2 py-0.5 rounded-md font-bold">
                                            {d.username}
                                        </span>
                                        <span className="text-gray-400 text-[10px]">会话: {d.sessionTitle}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(d.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[12.5px] font-bold text-[#4a4365]">
                                    问: {d.question}
                                </div>
                                {d.reply && (
                                    <div className="text-[12px] text-gray-600 bg-purple-50/40 p-2.5 rounded-xl leading-relaxed">
                                        答: {d.reply}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
