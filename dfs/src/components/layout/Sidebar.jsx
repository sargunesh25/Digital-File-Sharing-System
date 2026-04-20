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
            className={`fixed inset-y-0 left-0 w-64 glass-strong border-r border-white/60 min-h-screen flex flex-col z-40 transition-transform duration-300 md:relative md:z-20 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            aria-label="Sidebar navigation"
        >
            <div className="p-6">
                <button
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 p-2 text-surface-500 hover:bg-white/80 rounded-xl transition-all"
                    aria-label="Close sidebar"
                >
                    <X className="w-5 h-5" />
                </button>
                <Link to="/" className="block group">
                    <h1 className="text-2xl font-bold text-gradient flex items-center gap-2 tracking-tight transition-transform duration-300 group-hover:scale-[1.02]">
                        <div className="p-1.5 bg-gradient-to-br from-brand-400 to-accent-500 rounded-xl shadow-inner group-hover:shadow-glow transition-shadow">
                            <Folder className="w-6 h-6 text-white drop-shadow-sm" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-accent-600">Friendly Share</span>
                    </h1>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-white/80 text-brand-700 shadow-sm border border-white/80 shadow-glow relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-brand-500 before:rounded-r-full'
                                : 'text-surface-600 hover:bg-white/50 hover:text-brand-600 border border-transparent hover:border-white/60'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-600' : 'text-surface-400'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/50 space-y-2 mb-4">
                <Link
                    to="/settings"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname === '/settings'
                        ? 'bg-white/80 text-brand-700 shadow-sm border border-white/80 shadow-glow relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-brand-500 before:rounded-r-full'
                        : 'text-surface-600 hover:bg-white/50 hover:text-brand-600 border border-transparent hover:border-white/60'
                        }`}
                >
                    <Settings className={`w-5 h-5 transition-colors ${location.pathname === '/settings' ? 'text-brand-600' : 'text-surface-400'}`} />
                    Settings
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-white/50 hover:text-red-600 border border-transparent hover:border-white/60 transition-all duration-300"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
