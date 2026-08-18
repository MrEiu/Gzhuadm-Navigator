import React, { useState } from 'react';
import { User, UserProfile } from '../../types';
import { X, Check, ShieldCheck, User as UserIcon } from 'lucide-react';

interface AdminEditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: (updatedData: any) => void;
}

export const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({ user, onClose, onSave }) => {
    const [role, setRole] = useState<'user' | 'admin'>(user.role || 'user');
    const [name, setName] = useState(user.profile?.name || '');
    const [province, setProvince] = useState(user.profile?.province || '广东');
    const [score, setScore] = useState(user.profile?.score || '');
    const [rank, setRank] = useState(user.profile?.rank || '');
    const [subjects, setSubjects] = useState(user.profile?.subjects || '物化生');
    const [phone, setPhone] = useState(user.phone || user.profile?.phone || '');
    const [email, setEmail] = useState(user.email || user.profile?.email || '');
    const [specialConditions, setSpecialConditions] = useState(user.profile?.specialConditions || '');

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
            email,
            specialConditions
        };

        onSave({
            targetUsername: user.username,
            role,
            phone,
            email,
            score,
            province,
            specialConditions,
            profile: updatedProfile
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[36px] max-w-[540px] w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border-4 border-white space-y-4 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#4a4365] text-[15px]">编辑考生档案与权限: @{user.username}</h3>
                            <p className="text-[11px] text-[#8a84a4]">配置该账号的系统角色、高考数据与联系方式</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-3.5">
                    {/* Role Promotion / Demotion Switch */}
                    <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-purple-600" />
                            <div>
                                <div className="text-[12.5px] font-bold text-[#4a4365]">系统角色权限</div>
                                <div className="text-[10px] text-gray-400">设为超级管理员后可访问后台管理控制台</div>
                            </div>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl border border-purple-100 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${role === 'user' ? 'bg-[#4a4365] text-white shadow-xs' : 'text-gray-500'
                                    }`}
                            >
                                普通考生
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${role === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-500'
                                    }`}
                            >
                                超级管理员
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-gray-600 block mb-1">考生真实姓名</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none border border-transparent focus:border-purple-300"
                            placeholder="如：张同学"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">高考省份</label>
                            <select
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none border border-transparent focus:border-purple-300 font-bold text-gray-700"
                            >
                                {['广东', '浙江', '江苏', '四川', '山东', '河南', '湖北', '湖南', '福建', '安徽', '北京', '上海', '重庆', '陕西', '江西', '河北'].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">高考总分</label>
                            <input
                                type="number"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none font-bold text-purple-600 border border-transparent focus:border-purple-300"
                                placeholder="如：595"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">全省排名位次</label>
                            <input
                                type="number"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none border border-transparent focus:border-purple-300"
                                placeholder="如：12000"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">选科组合</label>
                            <input
                                type="text"
                                value={subjects}
                                onChange={(e) => setSubjects(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none border border-transparent focus:border-purple-300"
                                placeholder="如：物理/化学/生物"
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
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none border border-transparent focus:border-purple-300"
                            />
                        </div>
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 block mb-1">电子邮箱</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#f8f6fc] rounded-xl px-3.5 py-2.5 text-[12.5px] outline-none border border-transparent focus:border-purple-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-gray-600 block mb-1">报考意向 / 特殊说明</label>
                        <textarea
                            rows={2}
                            value={specialConditions}
                            onChange={(e) => setSpecialConditions(e.target.value)}
                            placeholder="如：意向大湾区就业、倾向计算机或数字媒体专业等"
                            className="w-full bg-[#f8f6fc] rounded-xl p-3 text-[12px] outline-none border border-transparent focus:border-purple-300"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="bg-[#4a4365] hover:bg-[#342e49] text-white px-5 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                        >
                            <Check size={14} /> 保存修改
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
