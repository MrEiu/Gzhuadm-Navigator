import React from 'react';
import { X, Users, Sparkles, AtSign } from 'lucide-react';
import { MultiAgentRoster } from '../../types';

interface GroupRosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    roster: MultiAgentRoster;
    onSelectAgentToMention: (agentName: string) => void;
}

export const GroupRosterModal: React.FC<GroupRosterModalProps> = ({
    isOpen,
    onClose,
    roster,
    onSelectAgentToMention
}) => {
    if (!isOpen) return null;

    const agentsList = Object.values(roster);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] border border-white max-w-lg w-full p-6 shadow-[0_20px_60px_rgba(74,67,101,0.25)] space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                            <Users size={18} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[16px]">广大2026级新生群 · 智能群成员</h3>
                            <p className="text-[11px] text-[#8a84a4]">共 5 位专属 AI 角色在线为您解答</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-purple-100 text-gray-400 hover:text-purple-700 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {agentsList.map((agent) => (
                        <div
                            key={agent.key}
                            className="p-3.5 rounded-2xl bg-[#fbf9fe] border border-purple-100 flex items-center justify-between gap-3 hover:bg-[#f5efff] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={agent.avatar}
                                    alt={agent.name}
                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVj3_GxALNWCvvYihiQsgv2KEhImtc73CpQywRMqdv5w&s=10";
                                    }}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[#4a4365] text-[13.5px]">{agent.name}</span>
                                        <span
                                            className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold"
                                            style={{ backgroundColor: agent.bubbleColor }}
                                        >
                                            {agent.title}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[#8a84a4] mt-0.5 line-clamp-1">
                                        {agent.description || agent.title}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    onSelectAgentToMention(agent.name);
                                    onClose();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 text-[11.5px] font-bold shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                                <AtSign size={13} />
                                <span>提问</span>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-2 text-center text-[11px] text-[#8a84a4] border-t border-purple-50">
                    💡 提示：在输入框内直接输入 <code className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-700 font-mono">@宿管张阿姨</code> 或对应角色名字，可定向唤起该角色！
                </div>
            </div>
        </div>
    );
};
