import React, { useState, useEffect } from 'react';
import FileList from '../components/files/FileList';
import api from '../api/axios';

const Trash = () => {
    const [files, setFiles] = useState([]);

    const fetchFiles = async () => {
        try {
            const response = await api.get('/files/trash');
            const mappedFiles = response.data.map(f => ({
                ...f,
                createdAt: f.uploadDate
            }));
            setFiles(mappedFiles);
        } catch (error) {
            console.error('Error fetching trashed files:', error);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleRestore = async (file) => {
        try {
            await api.put(`/files/${file.id}/restore`);
            fetchFiles();
        } catch (error) {
            console.error('Error restoring file:', error);
            alert('Failed to restore file: ' + (error.response?.data?.message || error.message));
        }
    };

    const handlePermanentDelete = async (file) => {
        if (!window.confirm(`Are you absolutely sure you want to permanently delete ${file.name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/files/${file.id}`);
            fetchFiles();
        } catch (error) {
            console.error('Error permanently deleting file:', error);
            alert('Failed to permanently delete file: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-surface-900 to-surface-600 tracking-tight">Trash</h2>
            </div>
            <div className="glass-card p-6 rounded-2xl animate-slide-up">
                <FileList
                    files={files}
                    onDelete={handlePermanentDelete}
                    onRestore={handleRestore}
                    isTrashView={true}
                />
            </div>
        </div>
    );
};

export default Trash;
