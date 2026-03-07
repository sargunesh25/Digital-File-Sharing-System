import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks for server upload
const CHUNKED_THRESHOLD = 5 * 1024 * 1024; // 5MB — use chunked for files larger than this

const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({}); // { [filename]: { loaded, total, percentage, status } }
    const inputRef = useRef(null);

    if (!isOpen) return null;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (fileList) => {
        setFiles([...files, ...Array.from(fileList)]);
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Upload a single file using chunks
    const uploadChunked = async (file) => {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        // 1. Init
        const initRes = await api.post('/files/chunked/init', {
            filename: file.name,
            totalSize: file.size,
            totalChunks,
            mimetype: file.type
        });
        const { uploadId } = initRes.data;

        // 2. Upload chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', i);
            formData.append('chunk', chunk, `chunk_${i}`);

            await api.post('/files/chunked/upload', formData);

            setUploadProgress(prev => ({
                ...prev,
                [file.name]: {
                    loaded: end,
                    total: file.size,
                    percentage: Math.round((end / file.size) * 100),
                    status: 'uploading'
                }
            }));
        }

        // 3. Complete
        await api.post('/files/chunked/complete', { uploadId });

        setUploadProgress(prev => ({
            ...prev,
            [file.name]: { loaded: file.size, total: file.size, percentage: 100, status: 'done' }
        }));
    };

    // Upload a single file normally
    const uploadNormal = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        await api.post('/files/upload', formData, {
            onUploadProgress: (progressEvent) => {
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: {
                        loaded: progressEvent.loaded,
                        total: progressEvent.total,
                        percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
                        status: 'uploading'
                    }
                }));
            }
        });

        setUploadProgress(prev => ({
            ...prev,
            [file.name]: { loaded: file.size, total: file.size, percentage: 100, status: 'done' }
        }));
    };

    const handleSubmit = async () => {
        setUploading(true);
        setUploadProgress({});

        for (const file of files) {
            try {
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { loaded: 0, total: file.size, percentage: 0, status: 'uploading' }
                }));

                if (file.size > CHUNKED_THRESHOLD) {
                    await uploadChunked(file);
                } else {
                    await uploadNormal(file);
                }
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { loaded: 0, total: file.size, percentage: 0, status: 'error', error: error.response?.data?.message || error.message }
                }));
            }
        }

        // Signal parent to refresh file list
        if (onUpload) onUpload([]);

        setTimeout(() => {
            setUploading(false);
            setFiles([]);
            setUploadProgress({});
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
                <button
                    onClick={onClose}
                    disabled={uploading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>

                    {!uploading && (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleChange}
                            />

                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-600 mb-2">
                                Drag and drop your files here, or{' '}
                                <button
                                    className="text-indigo-600 font-medium hover:text-indigo-500"
                                    onClick={() => inputRef.current.click()}
                                >
                                    browse
                                </button>
                            </p>
                            <p className="text-xs text-gray-400">
                                Files over 5MB will use chunked upload for reliability
                            </p>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
                            {files.map((file, index) => {
                                const progress = uploadProgress[file.name];
                                return (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                {progress?.status === 'done' ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                ) : progress?.status === 'error' ? (
                                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                ) : (
                                                    <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                )}
                                                <div className="overflow-hidden flex-1">
                                                    <span className="text-sm text-gray-700 truncate block">{file.name}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {formatSize(file.size)}
                                                        {file.size > CHUNKED_THRESHOLD && ' • Chunked upload'}
                                                    </span>
                                                </div>
                                            </div>
                                            {!uploading && (
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {progress && (
                                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                    {progress.percentage}%
                                                </span>
                                            )}
                                        </div>
                                        {progress && progress.status === 'uploading' && (
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                                    style={{ width: `${progress.percentage}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        {progress?.status === 'error' && (
                                            <p className="mt-1 text-xs text-red-500">{progress.error}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={files.length === 0 || uploading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${files.length === 0 || uploading
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Uploading...
                                </span>
                            ) : (
                                `Upload ${files.length > 0 ? `(${files.length})` : ''}`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
