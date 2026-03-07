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
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>

            {/* Profile Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold uppercase">
                            {user?.username ? user.username.substring(0, 2) : 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">{user?.username || 'User'}</h3>
                            <p className="text-gray-500">{user?.email || 'user@example.com'}</p>
                        </div>
                        <button className="ml-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                {/* Account Settings */}
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        Account Preferences
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-700">Language</p>
                                <p className="text-sm text-gray-500">Select your preferred language</p>
                            </div>
                            <select className="border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                <option>English (US)</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-gray-500" />
                        Notifications
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-700">Email Notifications</p>
                            <p className="text-sm text-gray-500">Receive updates about your file activity</p>
                        </div>
                        <button
                            onClick={handleNotificationToggle}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>

                {/* Security */}
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-500" />
                        Security
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-700">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                            </div>
                            <button
                                onClick={handleTwoFactorToggle}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${twoFactor ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${twoFactor ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="font-medium text-gray-700">Change Password</p>
                                <p className="text-sm text-gray-500">Update your password regularly</p>
                            </div>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                Update
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Moon className="w-5 h-5 text-gray-500" />
                        Appearance
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-700">Dark Mode</p>
                            <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                        </div>
                        <button
                            onClick={handleDarkModeToggle}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
