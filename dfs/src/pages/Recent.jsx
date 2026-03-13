import React, { useState, useEffect } from 'react';
import FileList from '../components/files/FileList';
import ShareModal from '../components/files/ShareModal';
import api from '../api/axios';

const Recent = () => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);

    const fetchFiles = async () => {
        try {
            const response = await api.get('/files');
            let mappedFiles = response.data.map(f => ({
                ...f,
                createdAt: f.uploadDate
            }));

            // Sort by createdAt descending
            mappedFiles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            // Limit to the 20 most recent files
            mappedFiles = mappedFiles.slice(0, 20);

            setFiles(mappedFiles);
        } catch (error) {
            console.error('Error fetching recent files:', error);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleShare = (file) => {
        setSelectedFile(file);
        setIsShareModalOpen(true);
    };

    const handleDownload = async (file) => {
        try {
            const response = await api.get(`/files/download/${file.id}`, {
                responseType: 'blob',
            });
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
            fetchFiles();
        } catch (error) {
            console.error('Error moving file to trash:', error);
            alert('Failed to move file to trash: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleStar = async (file) => {
        try {
            await api.put(`/files/${file.id}/star`);
            setFiles(files.map(f => f.id === file.id ? { ...f, isStarred: !f.isStarred } : f));
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-900 to-surface-600 tracking-tight">Recent Files</h2>
            </div>
            <div className="glass-card p-6 rounded-2xl animate-slide-up">
                <FileList
                    files={files}
                    onShare={handleShare}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                />
            </div>
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                file={selectedFile}
            />
        </div>
    );
};

export default Recent;
