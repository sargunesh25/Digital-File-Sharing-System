import React, { useState, useEffect } from 'react';
import { Download, File, User, Calendar, AlertCircle } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const SharedView = () => {
    const { token } = useParams();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSharedFile = async () => {
            try {
                // we don't necessarily have a token in localstorage, but api/axios will attach it if it exists.
                const response = await api.get(`/files/share/${token}`);
                setFile(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching shared file:", err);
                setError(err.response?.data?.message || 'Failed to load shared file. It may have expired or you may not have access.');
                setLoading(false);
            }
        };
        fetchSharedFile();
    }, [token]);

    const handleDownload = async () => {
        try {
            const response = await api.get(`/files/share/${token}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name || 'download');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading shared file:', err);
            alert('Failed to download file: ' + (err.response?.data?.message || err.message));
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !file) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link to="/login" className="inline-block bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <File className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-1">
                        File Shared with You
                    </h1>
                    <p className="text-indigo-100 text-sm">
                        Available for download
                    </p>
                </div>

                <div className="p-6">
                    <div className="text-center mb-8">
                        <h2 className="text-gray-900 font-medium text-lg mb-1">{file.name}</h2>
                        <p className="text-gray-500 text-sm">{formatSize(file.size)}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500">
                                <User className="w-4 h-4" />
                                <span>Shared by</span>
                            </div>
                            <span className="font-medium text-gray-900">{file.ownerName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>Date shared</span>
                            </div>
                            <span className="font-medium text-gray-900">{formatDate(file.uploadDate)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        <Download className="w-5 h-5" />
                        Download File
                    </button>

                    <p className="text-xs text-center text-gray-400 mt-6">
                        Shared via Friendly Share • <Link to="/" className="text-indigo-600 hover:underline">Create your own account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SharedView;
