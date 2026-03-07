import React from 'react';
import { FileText, Image, Film, Music, MoreVertical, Download, Share2, Trash } from 'lucide-react';

const FileCard = ({ file, onShare, onDownload, onDelete }) => {
    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <Image className="w-8 h-8 text-purple-500" />;
        if (type.startsWith('video/')) return <Film className="w-8 h-8 text-red-500" />;
        if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-yellow-500" />;
        return <FileText className="w-8 h-8 text-blue-500" />;
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg mb-4">
                {getFileIcon(file.type)}
            </div>

            <div>
                <h3 className="font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                    onClick={() => onDownload(file)}
                    className="text-gray-500 hover:text-indigo-600"
                >
                    <Download className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onShare(file)}
                    className="text-gray-500 hover:text-indigo-600"
                >
                    <Share2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(file)}
                    className="text-gray-500 hover:text-red-600"
                >
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default FileCard;
