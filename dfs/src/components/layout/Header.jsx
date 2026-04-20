import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import signalingService from '../../services/socket';

const Header = ({ onToggleSidebar = () => {} }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        // Fetch historical notifications
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/notifications');
                setNotifications(response.data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();

        // Authenticate socket to join personal room for real-time notifications
        signalingService.authenticate(user.id);

        const handleNewNotification = (notif) => {
            setNotifications(prev => [notif, ...prev]);
        };

        signalingService.on('new-notification', handleNewNotification);

        return () => {
            signalingService.off('new-notification', handleNewNotification);
        };
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            } catch (err) {
                console.error('Failed to mark as read', err);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="h-20 glass flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0 transition-all duration-300 gap-4 mb-6 shadow-sm border-b border-white/50">
            <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-surface-600 hover:bg-white/80 hover:text-brand-600 rounded-xl border border-transparent hover:border-white/60 hover:shadow-sm transition-all"
                aria-label="Open sidebar"
            >
                <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block flex-1 max-w-xl min-w-0">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-hover:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search files, folders..."
                        className="w-full pl-12 pr-4 py-2.5 bg-surface-100/50 backdrop-blur-md border border-white/60 shadow-inner rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white/90 transition-all text-surface-900 placeholder:text-surface-400 hover:bg-white/70"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfileMenu(false);
                        }}
                        className="p-2.5 text-surface-600 hover:text-brand-600 hover:bg-white/80 rounded-xl relative transition-all shadow-sm bg-white/50 border border-white/60 hover:shadow-md hover:-translate-y-0.5"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-white shadow-sm"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-80 glass-strong rounded-2xl shadow-xl py-2 z-20 overflow-hidden animate-slide-up transform origin-top-right">
                                <div className="px-5 py-3 border-b border-surface-200/50 flex justify-between items-center">
                                    <h3 className="font-semibold text-surface-900">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="px-5 py-6 text-center text-surface-500 text-sm">
                                            No notifications yet.
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`px-5 py-3 hover:bg-surface-50/80 cursor-pointer transition-colors border-l-2 ${!notif.read ? 'border-brand-500 bg-brand-50/30' : 'border-transparent'}`}
                                            >
                                                <p className="text-sm text-surface-800 font-medium">{notif.text}</p>
                                                <p className="text-xs text-surface-500 mt-1.5">{new Date(notif.createdAt).toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="px-5 py-3 border-t border-surface-200/50 text-center bg-surface-50/50 mt-1">
                                        <button onClick={handleMarkAllAsRead} className="text-xs text-brand-600 font-semibold hover:text-brand-800 transition-colors uppercase tracking-wider">
                                            Mark all as read
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="h-8 w-px bg-surface-200/50"></div>

                <div className="relative">
                    <button
                        onClick={() => {
                            setShowProfileMenu(!showProfileMenu);
                            setShowNotifications(false);
                        }}
                        className="flex items-center gap-3 hover:bg-white/80 p-1.5 pr-4 rounded-2xl border border-white/60 shadow-sm bg-white/50 transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-accent-500 rounded-xl flex items-center justify-center text-white shadow-inner">
                            <User className="w-5 h-5" />
                        </div>
                        <span className="hidden sm:block text-sm font-semibold text-surface-700">{user?.username || 'User'}</span>
                        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 mt-3 w-56 glass-strong rounded-2xl shadow-xl py-2 z-20 animate-slide-up transform origin-top-right">
                                <div className="px-4 py-3 border-b border-surface-200/50 mb-2">
                                    <p className="text-sm font-medium text-surface-900">{user?.username || 'User'}</p>
                                    <p className="text-xs text-surface-500 truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                                <Link to="/settings" className="px-4 py-2 text-sm text-surface-700 hover:text-brand-600 hover:bg-surface-50/80 flex items-center gap-3 transition-colors mx-2 rounded-lg" onClick={() => setShowProfileMenu(false)}>
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors mx-2 rounded-lg"
                                    style={{ width: 'calc(100% - 1rem)' }}
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
