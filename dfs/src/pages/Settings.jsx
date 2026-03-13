import React, { useState, useEffect } from 'react';
import { User, Bell, Lock, Shield, Moon } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/users/settings');
                const { notifications, darkMode, twoFactor } = response.data;
                setNotifications(notifications);
                setDarkMode(darkMode);
                setTwoFactor(twoFactor);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching settings:', error);
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const updateSetting = async (key, value) => {
        try {
            await api.put('/users/settings', { [key]: value });
        } catch (error) {
            console.error(`Error updating ${key}:`, error);
        }
    };

    const handleNotificationToggle = () => {
        const newValue = !notifications;
        setNotifications(newValue);
        updateSetting('notifications', newValue);
    };

    const handleDarkModeToggle = () => {
        const newValue = !darkMode;
        setDarkMode(newValue);
        updateSetting('darkMode', newValue);
    };

    const handleTwoFactorToggle = () => {
        const newValue = !twoFactor;
        setTwoFactor(newValue);
        updateSetting('twoFactor', newValue);
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-900 to-surface-600 tracking-tight mb-8">Settings</h2>

            {/* Profile Section */}
            <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
                <div className="p-8 border-b border-surface-200/50">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-50 rounded-2xl flex items-center justify-center text-brand-600 text-3xl font-bold uppercase shadow-inner border border-brand-200/50">
                            {user?.username ? user.username.substring(0, 2) : 'U'}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-surface-900">{user?.username || 'User'}</h3>
                            <p className="text-sm font-medium text-surface-500 mt-1">{user?.email || 'user@example.com'}</p>
                        </div>
                        <button className="ml-auto px-6 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-all shadow-sm">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-2xl divide-y divide-surface-100/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
                {/* Account Settings */}
                <div className="p-8">
                    <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-surface-100/50 rounded-lg">
                            <User className="w-5 h-5 text-surface-500" />
                        </div>
                        Account Preferences
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-surface-800">Language</p>
                                <p className="text-sm font-medium text-surface-500">Select your preferred language</p>
                            </div>
                            <select className="px-4 py-2 border-surface-200 bg-white/50 backdrop-blur-sm rounded-xl text-sm font-medium focus:ring-brand-500 focus:border-brand-500 shadow-sm">
                                <option>English (US)</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="p-8">
                    <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <Bell className="w-5 h-5 text-yellow-600" />
                        </div>
                        Notifications
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-surface-800">Email Notifications</p>
                            <p className="text-sm font-medium text-surface-500">Receive updates about your file activity</p>
                        </div>
                        <button
                            onClick={handleNotificationToggle}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${notifications ? 'bg-brand-500 shadow-sm shadow-brand-200' : 'bg-surface-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* Security */}
                <div className="p-8">
                    <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        Security
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-surface-800">Two-Factor Authentication</p>
                                <p className="text-sm font-medium text-surface-500">Add an extra layer of security to your account</p>
                            </div>
                            <button
                                onClick={handleTwoFactorToggle}
                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${twoFactor ? 'bg-brand-500 shadow-sm shadow-brand-200' : 'bg-surface-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${twoFactor ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-surface-100/50">
                            <div>
                                <p className="font-semibold text-surface-800">Change Password</p>
                                <p className="text-sm font-medium text-surface-500">Update your password regularly</p>
                            </div>
                            <button className="px-6 py-2.5 bg-white border border-surface-200 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-all shadow-sm">
                                Update
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="p-8">
                    <h3 className="text-lg font-bold text-surface-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Moon className="w-5 h-5 text-purple-600" />
                        </div>
                        Appearance
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-surface-800">Dark Mode</p>
                            <p className="text-sm font-medium text-surface-500">Switch between light and dark themes</p>
                        </div>
                        <button
                            onClick={handleDarkModeToggle}
                            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${darkMode ? 'bg-purple-500 shadow-sm shadow-purple-200' : 'bg-surface-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
