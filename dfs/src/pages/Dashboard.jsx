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
        if (!window.confirm(`Are you sure you want to delete ${file.name}?`)) return;

        try {
            await api.delete(`/files/${file.id}`);
            fetchFiles(); // Refresh list
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Failed to delete file: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">My Files</h2>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Upload File
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <FileList
                    files={files}
                    onShare={handleShare}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
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
