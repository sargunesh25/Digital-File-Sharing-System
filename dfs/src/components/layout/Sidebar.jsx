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
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                    <Folder className="w-8 h-8" />
                    CloudShare
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${location.pathname === '/settings'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
