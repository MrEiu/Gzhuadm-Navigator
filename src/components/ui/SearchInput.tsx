import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    widthClass?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = '搜索...',
    className = '',
    widthClass = 'w-full md:w-64',
    onKeyDown
}) => {
    return (
        <div className={`relative ${widthClass} ${className}`}>
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="w-full bg-white/80 border border-gray-200/80 rounded-2xl pl-9 pr-8 py-2 text-[12px] focus:ring-2 focus:ring-[#a494e8] outline-none shadow-inner"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
};
