import React from 'react';
import { FileText, Image, Film, Music, MoreVertical, Download, Share2, Trash, Star, RefreshCw } from 'lucide-react';

const FileCard = ({ file, onShare, onDownload, onDelete, onToggleStar, onRestore, isTrashView }) => {
    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <Image className="w-8 h-8 text-purple-500" />;
        if (type.startsWith('video/')) return <Film className="w-8 h-8 text-red-500" />;
        if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-yellow-500" />;
        return <FileText className="w-8 h-8 text-blue-500" />;
    };

    return (
        <div className="bg-gradient-to-br from-white to-surface-50 p-5 rounded-2xl border border-surface-200 hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 transition-all duration-300 group relative">
            <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                {!isTrashView && (
                    <button
                        onClick={() => onToggleStar && onToggleStar(file)}
                        className={`p-1.5 rounded-full shadow-sm backdrop-blur-md ${file.isStarred ? 'bg-yellow-50 text-yellow-500' : 'bg-white/80 hover:bg-white text-surface-400'}`}
                        title={file.isStarred ? 'Unstar' : 'Star'}
                    >
                        <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current' : ''}`} />
                    </button>
                )}
            </div>

            <div className="flex items-center justify-center h-32 bg-gradient-to-br from-surface-100 to-surface-50 rounded-xl mb-4 group-hover:from-brand-50 group-hover:to-teal-50 transition-colors border border-surface-100 group-hover:border-brand-100 overflow-hidden relative">
                <div className="transform group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(file.type)}
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-surface-900 truncate group-hover:text-brand-700 transition-colors" title={file.name}>
                    {file.name}
                </h3>
                <p className="text-xs font-medium text-surface-500 mt-1.5 flex items-center gap-2">
                    <span className="bg-surface-100 px-2 py-0.5 rounded-md">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </p>
            </div>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-surface-100">
                {!isTrashView ? (
                    <>
                        <button
                            onClick={() => onDownload(file)}
                            className="p-2 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onShare(file)}
                            className="p-2 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(file)}
                            className="p-2 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Move to Trash"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onRestore(file)}
                            className="p-2 text-surface-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restore"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(file)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Permanently"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileCard;
