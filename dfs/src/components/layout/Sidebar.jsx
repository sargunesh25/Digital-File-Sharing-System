import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Folder, Share2, Star, Clock, Trash, Settings, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: Folder, label: 'My Files', path: '/dashboard' },
        { icon: Zap, label: 'P2P Transfer', path: '/transfer' },
        { icon: Share2, label: 'Shared', path: '/shared' },
        { icon: Star, label: 'Starred', path: '/starred' },
        { icon: Clock, label: 'Recent', path: '/recent' },
        { icon: Trash, label: 'Trash', path: '/trash' },
    ];

    return (
        <div className="w-64 bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] min-h-screen flex flex-col relative z-20 transition-all duration-300">
            <div className="p-6">
                <Link to="/" className="block group">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-teal-500 flex items-center gap-2 tracking-tight transition-transform duration-300 group-hover:scale-[1.02]">
                        <Folder className="w-8 h-8 text-brand-500 drop-shadow-sm" />
                        Friendly Share
                    </h1>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-brand-50 to-teal-50/50 text-brand-700 shadow-sm border border-brand-100/50 font-semibold'
                                : 'text-surface-600 hover:bg-surface-100/60 hover:text-surface-900 hover:shadow-sm'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 space-y-1">
                <Link
                    to="/settings"
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${location.pathname === '/settings'
                        ? 'bg-gradient-to-r from-brand-50 to-teal-50/50 text-brand-700 shadow-sm border border-brand-100/50 font-semibold'
                        : 'text-surface-600 hover:bg-surface-100/60 hover:text-surface-900 hover:shadow-sm'
                        }`}
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
