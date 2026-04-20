import React from 'react';
import { FileText, Image, Film, Music, Download, Share2, Trash, Star, RefreshCw } from 'lucide-react';

const FileCard = ({ file, onShare, onDownload, onDelete, onToggleStar, onRestore, isTrashView }) => {
    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <Image className="w-8 h-8 text-accent-500" />;
        if (type.startsWith('video/')) return <Film className="w-8 h-8 text-rose-500" />;
        if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-amber-500" />;
        return <FileText className="w-8 h-8 text-brand-500" />;
    };

    return (
        <div className="glass-card p-5 rounded-3xl group relative flex flex-col justify-between">
            <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-10">
                {!isTrashView && (
                    <button
                        onClick={() => onToggleStar && onToggleStar(file)}
                        className={`p-2 rounded-xl shadow-sm backdrop-blur-md transition-all hover:scale-110 ${file.isStarred ? 'bg-amber-100 text-amber-500 shadow-glow border border-amber-200' : 'bg-white/80 hover:bg-white text-surface-400 border border-white/60'}`}
                        title={file.isStarred ? 'Unstar' : 'Star'}
                    >
                        <Star className={`w-4 h-4 ${file.isStarred ? 'fill-current text-amber-500' : ''}`} />
                    </button>
                )}
            </div>

            <div className="flex items-center justify-center h-32 bg-surface-100/50 rounded-2xl mb-4 group-hover:bg-brand-50/50 transition-colors border border-white/60 group-hover:border-brand-200/50 shadow-inner overflow-hidden relative backdrop-blur-sm">
                <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 drop-shadow-sm">
                    {getFileIcon(file.type)}
                </div>
            </div>

            <div className="flex-1">
                <h3 className="font-semibold text-surface-900 truncate group-hover:text-brand-600 transition-colors" title={file.name}>
                    {file.name}
                </h3>
                <p className="text-xs font-medium text-surface-500 mt-2 flex items-center gap-2">
                    <span className="bg-surface-100/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/60 shadow-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </p>
            </div>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-surface-200/50">
                {!isTrashView ? (
                    <>
                        <button
                            onClick={() => onDownload(file)}
                            className="p-2 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all hover:shadow-sm"
                            title="Download"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onShare(file)}
                            className="p-2 text-surface-500 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-all hover:shadow-sm"
                            title="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(file)}
                            className="p-2 text-surface-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:shadow-sm"
                            title="Move to Trash"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onRestore(file)}
                            className="p-2 text-surface-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all hover:shadow-sm"
                            title="Restore"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(file)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all hover:shadow-sm"
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
