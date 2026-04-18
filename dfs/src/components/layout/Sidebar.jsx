import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Folder, Share2, Star, Clock, Trash, Settings, LogOut, Zap, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
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
        <aside
            className={`fixed inset-y-0 left-0 w-64 bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] min-h-screen flex flex-col z-40 transition-transform duration-300 md:relative md:z-20 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            aria-label="Sidebar navigation"
        >
            <div className="p-6">
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 p-2 text-surface-500 hover:bg-surface-100 rounded-lg"
                    aria-label="Close sidebar"
                >
                    <X className="w-5 h-5" />
                </button>
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
                            onClick={onClose}
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
                    onClick={onClose}
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
        </aside>
    );
};

export default Sidebar;
