import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gradient-to-br from-surface-50 to-surface-100 text-surface-900 overflow-hidden selection:bg-brand-500 selection:text-white">
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
