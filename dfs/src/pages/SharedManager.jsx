import React, { useState, useEffect } from 'react';
import { Eye, Clock, User, FileText, MoreHorizontal, Download } from 'lucide-react';
import api from '../api/axios';

const SharedManager = () => {
    const [activeTab, setActiveTab] = useState('my_shares');
    const [myShares, setMyShares] = useState([]);
    const [sharedWithMe, setSharedWithMe] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mySharesRes, sharedWithMeRes] = await Promise.all([
                    api.get('/files/shared'),
                    api.get('/files/shared-with-me')
                ]);
                setMyShares(mySharesRes.data);
                setSharedWithMe(sharedWithMeRes.data);
            } catch (error) {
                console.error('Error fetching shared files:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDownload = async (file) => {
        try {
            const response = await api.get(`/files/download/${file.id}`, {
                responseType: 'blob', // Important for handling binary data
            });

            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name || 'download');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download file: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading shared files...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-900 to-surface-600 tracking-tight">Shared Files</h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-surface-100/50 p-1.5 rounded-xl w-fit backdrop-blur-sm border border-surface-200/50">
                <button
                    onClick={() => setActiveTab('my_shares')}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'my_shares'
                        ? 'bg-white text-brand-700 shadow-sm border border-surface-200/50'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-white/50'
                        }`}
                >
                    Files I Shared
                </button>
                <button
                    onClick={() => setActiveTab('shared_with_me')}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'shared_with_me'
                        ? 'bg-white text-brand-700 shadow-sm border border-surface-200/50'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-white/50'
                        }`}
                >
                    Shared With Me
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
                <table className="min-w-full divide-y divide-surface-200">
                    <thead className="bg-surface-50/80">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">File Name</th>
                            {activeTab === 'shared_with_me' && (
                                <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">Shared By</th>
                            )}
                            <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">
                                {activeTab === 'my_shares' ? 'Shared With' : 'Shared On'}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-surface-500 uppercase tracking-widest">
                                {activeTab === 'my_shares' ? 'Recent Access' : ''}
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-surface-500 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-surface-100">
                        {activeTab === 'my_shares' && myShares.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-surface-500 font-medium">
                                    You haven't shared any files yet.
                                </td>
                            </tr>
                        )}
                        {activeTab === 'my_shares' && myShares.map((file) => (
                            <tr key={`my-${file.id}`} className="hover:bg-brand-50/30 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center text-brand-600 shadow-inner border border-brand-200/50">
                                            <FileText className="w-5 h-5 drop-shadow-sm" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-surface-900">{file.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="text-sm font-medium text-surface-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-surface-400" />
                                        {file.sharedWith.length > 0 ? <span className="px-2 py-0.5 bg-surface-100 rounded-md">{file.sharedWith.length} people</span> : 'No invites'}
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center text-sm font-medium text-surface-500">
                                        <Clock className="flex-shrink-0 mr-2 h-4 w-4 text-surface-400" />
                                        {new Date(file.lastAccess).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-surface-400 hover:text-brand-600 transition-colors p-2 hover:bg-brand-50 rounded-lg">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {activeTab === 'shared_with_me' && sharedWithMe.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-surface-500 font-medium">
                                    No files have been shared with you directly.
                                </td>
                            </tr>
                        )}
                        {activeTab === 'shared_with_me' && sharedWithMe.map((file) => (
                            <tr key={`swm-${file.id}`} className="hover:bg-teal-50/30 transition-colors">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl flex items-center justify-center text-teal-600 shadow-inner border border-teal-200/50">
                                            <FileText className="w-5 h-5 drop-shadow-sm" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-surface-900">{file.name}</div>
                                            <div className="text-xs font-semibold text-surface-500 mt-1">{formatSize(file.size)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold uppercase shadow-sm border border-brand-200/50">
                                            {file.sharedBy.substring(0, 2)}
                                        </div>
                                        <div className="text-sm font-medium text-surface-900">{file.sharedBy}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center text-sm font-medium text-surface-500">
                                        <Clock className="flex-shrink-0 mr-2 h-4 w-4 text-surface-400" />
                                        {new Date(file.sharedAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="text-brand-600 hover:text-brand-800 flex items-center justify-end gap-1.5 ml-auto px-3 py-1.5 hover:bg-brand-50 rounded-lg transition-colors font-semibold"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SharedManager;
