import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-mesh bg-surface-50 text-surface-900 overflow-hidden selection:bg-brand-500 selection:text-white relative font-sans">
            <div className="bg-mesh-blob-3"></div>
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-surface-900/40 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 z-10">
                <Header onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 scroll-smooth relative z-0">
                    <div className="max-w-7xl mx-auto h-full animate-fade-in relative z-10">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
