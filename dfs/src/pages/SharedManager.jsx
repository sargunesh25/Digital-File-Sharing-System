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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-800">Shared Files</h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('my_shares')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'my_shares'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                        }`}
                >
                    Files I Shared
                </button>
                <button
                    onClick={() => setActiveTab('shared_with_me')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'shared_with_me'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                        }`}
                >
                    Shared With Me
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                            {activeTab === 'shared_with_me' && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shared By</th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {activeTab === 'my_shares' ? 'Shared With' : 'Shared On'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {activeTab === 'my_shares' ? 'Recent Access' : ''}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {activeTab === 'my_shares' && myShares.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                                    You haven't shared any files yet.
                                </td>
                            </tr>
                        )}
                        {activeTab === 'my_shares' && myShares.map((file) => (
                            <tr key={`my-${file.id}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        {file.sharedWith.length > 0 ? `${file.sharedWith.length} people` : 'No invites'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                        {new Date(file.lastAccess).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-indigo-600">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {activeTab === 'shared_with_me' && sharedWithMe.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No files have been shared with you directly.
                                </td>
                            </tr>
                        )}
                        {activeTab === 'shared_with_me' && sharedWithMe.map((file) => (
                            <tr key={`swm-${file.id}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                            <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                                            {file.sharedBy.substring(0, 2)}
                                        </div>
                                        <div className="text-sm text-gray-900">{file.sharedBy}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                        {new Date(file.sharedAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 ml-auto"
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
