import React from 'react';
import { MarkdownViewer } from './MarkdownViewer';
import { ChatMessage } from '../../types';

interface ChatMessageBubbleProps {
    msg: ChatMessage;
    isUser: boolean;
    bubbleStyle: string;
    roleColor: string;
    roleAvatar: string;
    roleName: string;
    userAvatar?: string;
}

export const ChatMessageBubble = React.memo(({
    msg,
    isUser,
    bubbleStyle,
    roleColor,
    roleAvatar,
    roleName,
    userAvatar
}: ChatMessageBubbleProps) => {
    const isUserImg = Boolean(
        userAvatar &&
        (userAvatar.startsWith('http') || userAvatar.startsWith('/uploads') || userAvatar.startsWith('data:image'))
    );

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
            <div className={`flex max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                {isUser ? (
                    isUserImg ? (
                        <img
                            src={userAvatar}
                            className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover shrink-0"
                            alt="user avatar"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop";
                            }}
                        />
                    ) : userAvatar ? (
                        <div className="w-9 h-9 rounded-[14px] shadow-sm border border-white bg-gradient-to-tr from-purple-200 to-indigo-100 flex items-center justify-center text-base shrink-0 select-none">
                            {userAvatar}
                        </div>
                    ) : (
                        <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"
                            className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover shrink-0"
                            alt="user avatar"
                        />
                    )
                ) : (
                    <img
                        src={roleAvatar}
                        className="w-9 h-9 rounded-[14px] shadow-sm border border-white object-cover shrink-0"
                        alt="bot avatar"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop";
                        }}
                    />
                )}
                <div className="flex flex-col">
                    {!isUser && (
                        <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                            <span className="text-[11px] font-black tracking-wider uppercase" style={{ color: roleColor }}>
                                {roleName}
                            </span>
                        </div>
                    )}
                    <div className={`px-5 py-3.5 ${bubbleStyle} ${isUser ? 'rounded-[24px] rounded-br-sm' : 'rounded-[24px] rounded-tl-sm'}`}>
                        <MarkdownViewer content={msg.text} roleColor={isUser ? '#fff' : roleColor} />
                    </div>
                </div>
            </div>
        </div>
    );
});
