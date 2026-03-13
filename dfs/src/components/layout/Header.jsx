import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const notifications = [
        { id: 1, text: 'Alice shared "Project Requirements.pdf"', time: '2 mins ago', read: false },
        { id: 2, text: 'You were mentioned in a comment', time: '1 hour ago', read: false },
        { id: 3, text: 'Storage is 80% full', time: '1 day ago', read: true },
    ];

    return (
        <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm flex items-center justify-between px-6 z-30 sticky top-0 transition-all duration-300">
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search files, folders..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 ml-4">
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfileMenu(false);
                        }}
                        className="p-2 text-surface-500 hover:bg-surface-100/80 rounded-full relative transition-colors shadow-sm bg-white/50 border border-white/60"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-indigo-50' : ''}`}>
                                            <p className="text-sm text-gray-800">{notif.text}</p>
                                            <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-2 border-t border-gray-50 text-center">
                                    <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
                                        Mark all as read
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-200"></div>

                <div className="relative">
                    <button
                        onClick={() => {
                            setShowProfileMenu(!showProfileMenu);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-2 hover:bg-surface-100/80 p-1 pr-3 rounded-full border border-white/60 shadow-sm bg-white/50 transition-colors"
                    >
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-100 to-teal-50 rounded-full flex items-center justify-center text-brand-600 shadow-inner">
                            <User className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{user?.username || 'User'}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => setShowProfileMenu(false)}>
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
