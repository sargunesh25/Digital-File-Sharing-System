import React, { useState, useEffect } from 'react';
import { X, Copy, Globe, Lock, User, Check, Plus, ChevronDown, Clock, Users, Save } from 'lucide-react';
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

    // Data fetching states
    const [allUsers, setAllUsers] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    
    // UI states
    const [searchTerm, setSearchTerm] = useState('');
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [expiresIn, setExpiresIn] = useState('7d');
    const [isExpiryOpen, setIsExpiryOpen] = useState(false);
    const [message, setMessage] = useState('');

    // Save group states
    const [isSavingGroup, setIsSavingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [resUsers, resGroups] = await Promise.all([
                        api.get('/users'),
                        api.get('/groups')
                    ]);
                    setAllUsers(resUsers.data);
                    setAllGroups(resGroups.data);
                } catch (e) {
                    console.error('Failed to fetch users or groups:', e);
                }
            };
            fetchData();

            // Reset modal state on open
            setInvitedUsers([]);
            setSearchTerm('');
            setIsSharing(false);
            setExpiresIn('7d');
            setMessage('');
            setIsSavingGroup(false);
            setNewGroupName('');
        }
    }, [isOpen]);

    const handleSelectUser = (user) => {
        if (!invitedUsers.find(u => u.email === user.email)) {
            setInvitedUsers([...invitedUsers, { ...user, permission: 'view' }]);
        }
        setSearchTerm('');
        setIsUserDropdownOpen(false);
    };

    const handleSelectGroup = (group) => {
        const newInvites = [...invitedUsers];
        group.members.forEach(member => {
            if (!newInvites.find(u => u.email === member.email)) {
                newInvites.push({ ...member, permission: 'view' });
            }
        });
        setInvitedUsers(newInvites);
        setSearchTerm('');
        setIsUserDropdownOpen(false);
    };

    const filteredUsers = allUsers.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredGroups = allGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
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

    const handleSaveGroup = async () => {
        if (!newGroupName.trim() || invitedUsers.length === 0) return;
        try {
            const res = await api.post('/groups', {
                name: newGroupName,
                userIds: invitedUsers.map(u => u.id)
            });
            setAllGroups([...allGroups, res.data]);
            setIsSavingGroup(false);
            setNewGroupName('');
            // Optional: alert success
        } catch (error) {
            console.error('Failed to save group:', error);
            alert('Failed to save group');
        }
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
                accessType: 'restricted',
                invites: invitedUsers,
                expiresIn: expiresIn,
                message: message
            });
            alert('File shared successfully!');
            onClose();
        } catch (error) {
            console.error('Error sharing file:', error);
            alert('Failed to share file: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSharing(false);
        }
    };

    const selectedExpiry = EXPIRY_OPTIONS.find(o => o.value === expiresIn);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar relative border border-white/20">
                <div className="flex justify-between items-center p-6 border-b border-surface-100 bg-surface-50/50 sticky top-0 z-10 backdrop-blur-md">
                    <h2 className="text-xl font-bold text-surface-900 truncate pr-4">Share "{file.name}"</h2>
                    <button onClick={onClose} className="p-2 text-surface-400 hover:text-brand-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-surface-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Invite Section */}
                    <div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search usernames, emails, or groups..."
                                className="w-full pl-4 pr-10 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
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
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-surface-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                                        
                                        {/* Groups Section */}
                                        {filteredGroups.length > 0 && (
                                            <div className="pt-2">
                                                <div className="px-4 py-1 text-xs font-bold text-surface-400 uppercase tracking-wider">Groups</div>
                                                {filteredGroups.map(g => (
                                                    <button
                                                        key={`group-${g.id}`}
                                                        type="button"
                                                        onClick={() => handleSelectGroup(g)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-brand-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-700">
                                                            <Users className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-surface-900">{g.name}</p>
                                                            <p className="text-xs text-surface-500">{g.members ? g.members.length : 0} members</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Users Section */}
                                        {filteredUsers.length > 0 && (
                                            <div className={filteredGroups.length > 0 ? "border-t border-surface-100 pt-2" : "pt-2"}>
                                                <div className="px-4 py-1 text-xs font-bold text-surface-400 uppercase tracking-wider">Users</div>
                                                {filteredUsers.map(u => (
                                                    <button
                                                        key={`user-${u.id}`}
                                                        type="button"
                                                        onClick={() => handleSelectUser(u)}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-brand-50 flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold uppercase">
                                                            {u.username ? u.username.substring(0, 2) : 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-surface-900">{u.username}</p>
                                                            <p className="text-xs text-surface-500">{u.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {filteredUsers.length === 0 && filteredGroups.length === 0 && (
                                            <div className="px-4 py-4 text-sm text-surface-500 text-center">No matches found</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {invitedUsers.length > 0 && (
                            <div className="mt-4 p-4 border border-surface-200 rounded-xl bg-surface-50/50 space-y-3">
                                {invitedUsers.map((user, index) => (
                                    <div key={index} className="flex items-center justify-between pb-3 border-b border-surface-200/60 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold uppercase text-sm shadow-sm opacity-90">
                                                {user.username ? user.username.substring(0, 2) : 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-surface-800">{user.username}</p>
                                                <p className="text-xs text-surface-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenPermissionDropdown(openPermissionDropdown === index ? null : index)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-100/50 hover:bg-brand-100 rounded-lg transition-colors"
                                                >
                                                    {user.permission === 'view' ? 'Can view' : 'Can edit'}
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${openPermissionDropdown === index ? 'rotate-180' : ''}`} />
                                                </button>

                                                {openPermissionDropdown === index && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setOpenPermissionDropdown(null)}></div>
                                                        <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-surface-100 py-1 z-20">
                                                            <button
                                                                onClick={() => { handlePermissionChange(index, 'view'); setOpenPermissionDropdown(null); }}
                                                                className="w-full text-left px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 flex items-center justify-between font-medium"
                                                            >
                                                                <span>Can view</span>
                                                                {user.permission === 'view' && <Check className="w-4 h-4 text-brand-600" />}
                                                            </button>
                                                            <button
                                                                onClick={() => { handlePermissionChange(index, 'edit'); setOpenPermissionDropdown(null); }}
                                                                className="w-full text-left px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 flex items-center justify-between font-medium"
                                                            >
                                                                <span>Can edit</span>
                                                                {user.permission === 'edit' && <Check className="w-4 h-4 text-brand-600" />}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <button onClick={() => removeUser(index)} className="text-surface-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Group Save Options */}
                                {invitedUsers.length > 1 && (
                                    <div className="pt-2 flex justify-end">
                                        {!isSavingGroup ? (
                                            <button 
                                                onClick={() => setIsSavingGroup(true)}
                                                className="text-xs font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1.5"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                Save as a named Group
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 w-full max-w-sm animate-fade-in">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter group name..." 
                                                    value={newGroupName}
                                                    onChange={e => setNewGroupName(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 text-sm border border-surface-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:outline-none shadow-inner"
                                                />
                                                <button onClick={handleSaveGroup} className="bg-accent-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-accent-700 shadow-sm transition-colors">
                                                    Save
                                                </button>
                                                <button onClick={() => setIsSavingGroup(false)} className="px-2 py-1.5 text-surface-500 hover:bg-surface-200 rounded-lg">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Extraneous Settings (Expiration & Message) */}
                    <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-surface-200">
                        {/* Expiration */}
                        <div>
                            <h3 className="text-sm font-semibold text-surface-800 mb-2.5 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand-500" />
                                Expiration
                            </h3>
                            <div className="relative">
                                <button
                                    onClick={() => setIsExpiryOpen(!isExpiryOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm font-medium text-surface-700 hover:bg-white hover:border-surface-300 transition-all shadow-sm"
                                >
                                    <span>{selectedExpiry?.label || 'Select expiry'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpiryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isExpiryOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsExpiryOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-surface-100 py-1 z-20">
                                            {EXPIRY_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { setExpiresIn(opt.value); setIsExpiryOpen(false); }}
                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 flex items-center justify-between"
                                                >
                                                    <span>{opt.label}</span>
                                                    {expiresIn === opt.value && <Check className="w-4 h-4 text-brand-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <h3 className="text-sm font-semibold text-surface-800 mb-2.5">
                                Add a Message <span className="text-surface-400 font-normal">(Optional)</span>
                            </h3>
                            <textarea
                                placeholder="E.g., Please review this..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-surface-200 bg-surface-50 rounded-xl text-sm resize-none focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-inner h-11 focus:h-20"
                            ></textarea>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-6 border-t border-surface-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isSharing || invitedUsers.length === 0}
                            className={`flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold shadow-md transition-all ${isSharing || invitedUsers.length === 0
                                    ? 'bg-surface-300 text-white cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:from-brand-700 hover:to-accent-700 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                        >
                            {isSharing ? 'Sharing Document...' : 'Share Document'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
