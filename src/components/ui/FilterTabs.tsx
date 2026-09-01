import React from 'react';
import { Tag } from 'lucide-react';

interface FilterTabsProps {
    categories: string[];
    activeCategory: string;
    onSelectCategory: (cat: string) => void;
    showIcon?: boolean;
    label?: string;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
    categories,
    activeCategory,
    onSelectCategory,
    showIcon = true,
    label = '分类筛选：'
}) => {
    return (
        <div className="px-4 sm:px-6 py-2.5 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
            {showIcon && (
                <span className="text-[11px] font-bold text-gray-400 shrink-0 mr-1 flex items-center gap-1">
                    <Tag size={12} /> {label}
                </span>
            )}
            {categories.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 cursor-pointer ${activeCategory === cat
                            ? 'bg-[#4a4365] text-white shadow-sm scale-105'
                            : 'bg-white/80 hover:bg-white text-gray-600 border border-gray-200/60'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};
