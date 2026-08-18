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

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('aurasense_logged_user');
    };

    return (
        <div className={`flex justify-center items-center h-screen ${THEME.bg} p-0 sm:p-6 selection:bg-indigo-100`}>
            {/* 1. Unauthenticated: Auth Modal */}
            {!currentUser && (
                <AuthModal onLoginSuccess={handleLoginSuccess} />
            )}

            {/* 2. Logged-in Candidate: Admissions Consultation Frontend */}
            {currentUser?.role === 'user' && (
                <ChatPage currentUser={currentUser} onLogout={handleLogout} />
            )}

            {/* 3. Logged-in Admin: RAG Administration & Monitoring Center */}
            {currentUser?.role === 'admin' && (
                <AdminLayout currentUser={currentUser} onLogout={handleLogout} />
            )}

            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
}