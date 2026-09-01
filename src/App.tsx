import React, { useState, Suspense, lazy } from 'react';
import { User } from './types';
import { THEME } from './constants/theme';
import { AuthModal } from './pages/Auth/AuthModal';

const ChatPage = lazy(() => import('./pages/Chat/ChatPage').then(m => ({ default: m.ChatPage })));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

const PageLoadingFallback: React.FC = () => (
    <div className={`w-full max-w-[480px] h-[520px] ${THEME.glass} sm:rounded-[48px] flex flex-col items-center justify-center gap-4 text-[#a494e8] shadow-2xl border-4 border-white/80 animate-in fade-in duration-200`}>
        <div className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-black tracking-wider text-[#4a4365] animate-pulse">
            Gzadm Navigator 极速加载中...
        </div>
    </div>
);

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('aurasense_logged_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [adminPortal, setAdminPortal] = useState<'chat' | 'admin'>(() => {
        return (localStorage.getItem('gzadm_admin_portal') as 'chat' | 'admin') || 'admin';
    });

    const handleLoginSuccess = (user: User, portal: 'chat' | 'admin' = 'admin') => {
        setCurrentUser(user);
        if (user.role === 'admin') {
            setAdminPortal(portal);
            localStorage.setItem('gzadm_admin_portal', portal);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('aurasense_logged_user');
    };

    const handleSwitchPortal = (target?: 'chat' | 'admin') => {
        const next = target || (adminPortal === 'admin' ? 'chat' : 'admin');
        setAdminPortal(next);
        localStorage.setItem('gzadm_admin_portal', next);
    };

    return (
        <div className={`flex justify-center items-center h-screen ${THEME.bg} p-0 sm:p-6 selection:bg-indigo-100`}>
            {/* 1. Unauthenticated: Auth Modal */}
            {!currentUser && (
                <AuthModal onLoginSuccess={handleLoginSuccess} />
            )}

            {/* 2. Logged-in Candidate OR Admin in Student Chat Mode */}
            {currentUser && (currentUser.role === 'user' || (currentUser.role === 'admin' && adminPortal === 'chat')) && (
                <Suspense fallback={<PageLoadingFallback />}>
                    <ChatPage
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        onSwitchPortal={currentUser.role === 'admin' ? () => handleSwitchPortal('admin') : undefined}
                    />
                </Suspense>
            )}

            {/* 3. Logged-in Admin in Admin Mode */}
            {currentUser?.role === 'admin' && adminPortal === 'admin' && (
                <Suspense fallback={<PageLoadingFallback />}>
                    <AdminLayout
                        currentUser={currentUser}
                        onLogout={handleLogout}
                        onSwitchPortal={() => handleSwitchPortal('chat')}
                    />
                </Suspense>
            )}

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
}