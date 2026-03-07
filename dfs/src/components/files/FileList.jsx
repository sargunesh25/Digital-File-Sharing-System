import React from 'react';
import FileCard from './FileCard';

const FileList = ({ files, onShare, onDownload, onDelete }) => {
    if (files.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No files found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => (
                <FileCard
                    key={file.id}
                    file={file}
                    onShare={onShare}
                    onDownload={onDownload}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default FileList;
