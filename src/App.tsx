import React, { useState } from 'react';
import { User } from './types';
import { THEME } from './constants/theme';
import { AuthModal } from './pages/Auth/AuthModal';
import { ChatPage } from './pages/Chat/ChatPage';
import { AdminLayout } from './pages/Admin/AdminLayout';

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
                <ChatPage
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onSwitchPortal={currentUser.role === 'admin' ? () => handleSwitchPortal('admin') : undefined}
                />
            )}

            {/* 3. Logged-in Admin in Admin Mode */}
            {currentUser?.role === 'admin' && adminPortal === 'admin' && (
                <AdminLayout
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onSwitchPortal={() => handleSwitchPortal('chat')}
                />
            )}

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
}