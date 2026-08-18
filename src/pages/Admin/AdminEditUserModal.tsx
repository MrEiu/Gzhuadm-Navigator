import React, { useState } from 'react';
import { User, UserProfile } from '../../types';
import { X, Check } from 'lucide-react';

interface AdminEditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: any) => void;
}

export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.profile?.name || '');
    const [province, setProvince] = useState(user.profile?.province || '广东');
    const [score, setScore] = useState(user.profile?.score || '');
    const [rank, setRank] = useState(user.profile?.rank || '');
    const [subjects, setSubjects] = useState(user.profile?.subjects || '物化生');
    const [phone, setPhone] = useState(user.phone || user.profile?.phone || '');
    const [email, setEmail] = useState(user.email || user.profile?.email || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedProfile: UserProfile = {
            ...(user.profile || {}),
            name,
            province,
            score: score ? Number(score) : '',
            rank: rank ? Number(rank) : '',
            subjects,
            phone,
            email
        };

        onSave({
            username: user.username,
            phone,
            email,
            profile: updatedProfile
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-[500px] w-full space-y-4 shadow-2xl border">
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-[#4a4365] text-[15px]">编辑考生档案: @{user.username}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-3">
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 block mb-1">考生姓名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
                            placeholder="考生姓名"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">高考省份</label>
                            <input
                                type="text"
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">高考总分</label>
                            <input
                                type="number"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none font-bold text-purple-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">全省排名</label>
                            <input
                                type="number"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">选科组合</label>
                            <input
                                type="text"
                                value={subjects}
                                onChange={(e) => setSubjects(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">手机号码</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">电子邮箱</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] text-gray-500 hover:bg-gray-100 cursor-pointer">
                            取消
                        </button>
                        <button type="submit" className="bg-[#4a4365] text-white px-5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                            <Check size={14} /> 保存修改
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
