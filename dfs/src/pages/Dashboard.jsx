import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import FileList from '../components/files/FileList';
import UploadModal from '../components/files/UploadModal';
import ShareModal from '../components/files/ShareModal';
import api from '../api/axios';

const Dashboard = () => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);

    const fetchFiles = async () => {
        try {
            const response = await api.get('/files');
            // Map backend fields to frontend expectations
            const mappedFiles = response.data.map(f => ({
                ...f,
                createdAt: f.uploadDate
            }));
            setFiles(mappedFiles);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleShare = (file) => {
        setSelectedFile(file);
        setIsShareModalOpen(true);
    };

    const handleUpload = async () => {
        // UploadModal now handles uploads directly (including chunked)
        // Just refresh the file list
        fetchFiles();
    };

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

    const handleDelete = async (file) => {
        if (!window.confirm(`Are you sure you want to move ${file.name} to Trash?`)) return;

        try {
            await api.put(`/files/${file.id}/trash`);
            fetchFiles(); // Refresh list
        } catch (error) {
            console.error('Error moving file to trash:', error);
            alert('Failed to move file to trash: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleStar = async (file) => {
        try {
            await api.put(`/files/${file.id}/star`);
            // Update local state for immediate feedback
            setFiles(files.map(f => f.id === file.id ? { ...f, isStarred: !f.isStarred } : f));
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-surface-900">
                    My Files
                </h2>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-2xl hover:shadow-glow hover:-translate-y-1 transition-all duration-300 transform group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 text-white" />
                    Upload File
                </button>
            </div>

            <div className="glass-strong p-6 sm:p-8 rounded-3xl animate-slide-up">
                <FileList
                    files={files}
                    onShare={handleShare}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                />
            </div>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                file={selectedFile}
            />
        </div>
    );
};

export default Dashboard;
