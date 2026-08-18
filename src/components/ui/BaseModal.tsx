import React from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    maxWidth?: string;
    maxHeight?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    maxWidth = 'max-w-[620px]',
    maxHeight = 'max-h-[85vh]',
    children,
    footer,
    className = ''
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-3 sm:p-4 animate-in fade-in duration-300">
            <div className={`bg-white/95 backdrop-blur-2xl rounded-[36px] ${maxWidth} w-full ${maxHeight} overflow-y-auto p-5 sm:p-6 shadow-2xl border-4 border-white space-y-4 animate-in zoom-in-95 duration-300 ${className}`}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#a494e8] to-[#c7b8f9] text-white flex items-center justify-center shadow-md shrink-0">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-[#4a4365] text-[16px]">{title}</h3>
                            {subtitle && <p className="text-[11px] text-[#8a84a4] mt-0.5">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="关闭"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div>{children}</div>

                {/* Optional Footer */}
                {footer && (
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
