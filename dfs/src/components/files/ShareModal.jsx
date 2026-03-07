import React, { useState } from 'react';
import { X, Copy, Globe, Lock, User, Check, Plus, ChevronDown, Clock } from 'lucide-react';
import api from '../../api/axios';

const EXPIRY_OPTIONS = [
    { label: '1 Hour', value: '1h' },
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'Never', value: 'never' },
];

const ShareModal = ({ isOpen, onClose, file }) => {
    if (!isOpen || !file) return null;

    const [openPermissionDropdown, setOpenPermissionDropdown] = useState(null);
    const [invitedUsers, setInvitedUsers] = useState([]);

    // New state for user selection
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    const [isSharing, setIsSharing] = useState(false);
    const [expiresIn, setExpiresIn] = useState('7d');
    const [isExpiryOpen, setIsExpiryOpen] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            const fetchUsers = async () => {
                try {
                    const res = await api.get('/users');
                    setAllUsers(res.data);
                } catch (e) {
                    console.error('Failed to fetch users:', e);
                }
            };
            fetchUsers();

            // Reset modal state on open
            setInvitedUsers([]);
            setSearchTerm('');
            setIsSharing(false);
            setExpiresIn('7d');
        }
    }, [isOpen]);

    const handleSelectUser = (user) => {
        if (!invitedUsers.find(u => u.email === user.email)) {
            setInvitedUsers([...invitedUsers, { ...user, permission: 'view' }]);
        }
        setSearchTerm('');
        setIsUserDropdownOpen(false);
    };

    const filteredUsers = allUsers.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePermissionChange = (index, newPermission) => {
        const updated = [...invitedUsers];
        updated[index].permission = newPermission;
        setInvitedUsers(updated);
    };

    const removeUser = (index) => {
        const updated = [...invitedUsers];
        updated.splice(index, 1);
        setInvitedUsers(updated);
    };

    const handleShare = async () => {
        if (invitedUsers.length === 0) {
            alert('Please select at least one user to share with.');
            return;
        }

        setIsSharing(true);
        try {
            await api.post('/files/share', {
                fileId: file.id,
                accessType: 'restricted', // Always restricted for direct shares
                invites: invitedUsers,
                expiresIn: expiresIn
            });
            alert('File shared successfully!');
            onClose(); // Close modal on success
        } catch (error) {
            console.error('Error sharing file:', error);
            alert('Failed to share file: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSharing(false);
        }
    };

    const selectedExpiry = EXPIRY_OPTIONS.find(o => o.value === expiresIn);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Share "{file.name}"</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Invite Section */}
                    <div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users by name or email to share with..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsUserDropdownOpen(true);
                                }}
                                onFocus={() => setIsUserDropdownOpen(true)}
                            />

                            {isUserDropdownOpen && searchTerm && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsUserDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => handleSelectUser(u)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold uppercase">
                                                        {u.username ? u.username.substring(0, 2) : 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{u.username}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No users found</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-4 space-y-3">
                            {invitedUsers.map((user, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase text-sm">
                                            {user.username ? user.username.substring(0, 2) : 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{user.username}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenPermissionDropdown(openPermissionDropdown === index ? null : index)}
                                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium"
                                            >
                                                {user.permission === 'view' ? 'Can view' : 'Can edit'}
                                                <ChevronDown className={`w-3 h-3 transition-transform ${openPermissionDropdown === index ? 'rotate-180' : ''}`} />
                                            </button>

                                            {openPermissionDropdown === index && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setOpenPermissionDropdown(null)}></div>
                                                    <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                                        <button
                                                            onClick={() => { handlePermissionChange(index, 'view'); setOpenPermissionDropdown(null); }}
                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                                        >
                                                            <span>Can view</span>
                                                            {user.permission === 'view' && <Check className="w-3 h-3 text-indigo-600" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { handlePermissionChange(index, 'edit'); setOpenPermissionDropdown(null); }}
                                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                                        >
                                                            <span>Can edit</span>
                                                            {user.permission === 'edit' && <Check className="w-3 h-3 text-indigo-600" />}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <button onClick={() => removeUser(index)} className="text-gray-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Link Expiration Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            Sharing Expiration
                        </h3>
                        <div className="relative">
                            <button
                                onClick={() => setIsExpiryOpen(!isExpiryOpen)}
                                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <span>{selectedExpiry?.label || 'Select expiry'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpiryOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpiryOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsExpiryOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                        {EXPIRY_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setExpiresIn(opt.value); setIsExpiryOpen(false); }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                                            >
                                                <span>{opt.label}</span>
                                                {expiresIn === opt.value && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Direct Share Action */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isSharing || invitedUsers.length === 0}
                            className={`flex items-center gap-2 py-2 px-6 rounded-lg font-medium transition-colors ${isSharing || invitedUsers.length === 0
                                    ? 'bg-indigo-300 text-white cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                        >
                            {isSharing ? 'Sharing...' : 'Share'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
