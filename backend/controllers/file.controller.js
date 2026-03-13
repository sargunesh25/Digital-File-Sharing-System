const db = require('../models');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const File = db.File;

// ============ Standard Upload ============

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newFile = await File.create({
            filename: req.file.originalname,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            userId: req.user.id
        });

        res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Chunked Upload ============

// In-memory tracker for chunked uploads (for dev; use Redis in production)
const chunkedUploads = new Map();

exports.initChunkedUpload = async (req, res) => {
    try {
        const { filename, totalSize, totalChunks, mimetype } = req.body;
        if (!filename || !totalSize || !totalChunks) {
            return res.status(400).json({ message: 'filename, totalSize, and totalChunks are required' });
        }

        const uploadId = crypto.randomUUID();
        const uploadDir = path.join(__dirname, '..', 'uploads', 'chunks', uploadId);
        fs.mkdirSync(uploadDir, { recursive: true });

        chunkedUploads.set(uploadId, {
            filename,
            mimetype: mimetype || 'application/octet-stream',
            totalSize: parseInt(totalSize),
            totalChunks: parseInt(totalChunks),
            receivedChunks: new Set(),
            uploadDir,
            userId: req.user.id,
            createdAt: Date.now()
        });

        res.status(201).json({ uploadId, message: 'Chunked upload initialized' });
    } catch (error) {
        console.error("Init chunk error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.uploadChunk = async (req, res) => {
    try {
        const { uploadId, chunkIndex } = req.body;
        const upload = chunkedUploads.get(uploadId);

        if (!upload) {
            return res.status(404).json({ message: 'Upload session not found. It may have expired.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No chunk data received' });
        }

        const idx = parseInt(chunkIndex);
        const chunkPath = path.join(upload.uploadDir, `chunk_${idx}`);

        // Move the uploaded chunk file to the chunks directory
        fs.renameSync(req.file.path, chunkPath);
        upload.receivedChunks.add(idx);

        res.json({
            message: 'Chunk received',
            chunkIndex: idx,
            receivedChunks: upload.receivedChunks.size,
            totalChunks: upload.totalChunks
        });
    } catch (error) {
        console.error("Upload chunk error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.completeChunkedUpload = async (req, res) => {
    try {
        const { uploadId } = req.body;
        const upload = chunkedUploads.get(uploadId);

        if (!upload) {
            return res.status(404).json({ message: 'Upload session not found' });
        }

        if (upload.receivedChunks.size !== upload.totalChunks) {
            return res.status(400).json({
                message: `Missing chunks. Received ${upload.receivedChunks.size}/${upload.totalChunks}`,
                receivedChunks: [...upload.receivedChunks]
            });
        }

        // Merge chunks into final file
        const finalFilename = Date.now() + '-' + upload.filename;
        const finalPath = path.join(__dirname, '..', 'uploads', finalFilename);
        const writeStream = fs.createWriteStream(finalPath);

        for (let i = 0; i < upload.totalChunks; i++) {
            const chunkPath = path.join(upload.uploadDir, `chunk_${i}`);
            const chunkData = fs.readFileSync(chunkPath);
            writeStream.write(chunkData);
            fs.unlinkSync(chunkPath); // Clean up chunk
        }

        writeStream.end();

        // Clean up chunks directory
        fs.rmdirSync(upload.uploadDir, { recursive: true });
        chunkedUploads.delete(uploadId);

        // Create DB record
        const newFile = await File.create({
            filename: upload.filename,
            path: 'uploads/' + finalFilename,
            mimetype: upload.mimetype,
            size: upload.totalSize,
            userId: upload.userId
        });

        res.status(201).json({ message: 'File upload complete', file: newFile });
    } catch (error) {
        console.error("Complete chunk error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Get Files ============

exports.getFiles = async (req, res) => {
    try {
        const userFiles = await File.findAll({
            where: { userId: req.user.id, isTrashed: false }
        });

        const formattedFiles = userFiles.map(f => ({
            id: f.id,
            name: f.filename,
            type: f.mimetype,
            size: f.size,
            uploadDate: f.createdAt,
            path: f.path,
            isStarred: f.isStarred,
            isTrashed: f.isTrashed
        }));

        res.json(formattedFiles);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Download File ============

exports.downloadFile = async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        let file = await File.findOne({
            where: { id: fileId, userId: req.user.id }
        });

        // If user doesn't own it, check if it was shared with them
        if (!file) {
            const sharedFile = await db.FileShare.findOne({
                where: { fileId: fileId, userId: req.user.id },
                include: [{ model: db.File, as: 'file' }]
            });
            if (sharedFile && sharedFile.file) {
                file = sharedFile.file;
            }
        }

        if (!file) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        const filePath = path.join(__dirname, '..', file.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Physical file not found on server' });
        }

        res.download(filePath, file.filename);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Share File (with expiration) ============

exports.shareFile = async (req, res) => {
    try {
        const { fileId, accessType, invites, expiresIn } = req.body;
        const file = await File.findOne({
            where: { id: fileId, userId: req.user.id }
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const token = crypto.randomBytes(16).toString('hex');

        // Calculate expiration date
        let expiresAt = null;
        if (expiresIn) {
            const now = new Date();
            switch (expiresIn) {
                case '1h': expiresAt = new Date(now.getTime() + 60 * 60 * 1000); break;
                case '24h': expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); break;
                case '7d': expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break;
                case '30d': expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); break;
                case 'never': expiresAt = null; break;
                default:
                    // Try parsing as ISO date
                    const parsed = new Date(expiresIn);
                    if (!isNaN(parsed.getTime())) expiresAt = parsed;
            }
        }

        let sharedCount = 0;

        if (invites && invites.length > 0) {
            for (const invite of invites) {
                const invitedUser = await db.User.findOne({ where: { email: invite.email } });
                if (invitedUser) {
                    await db.FileShare.create({
                        fileId: file.id,
                        userId: invitedUser.id,
                        permission: invite.permission,
                        token: null, // No longer using tokens for direct shares
                        expiresAt: expiresAt
                    });
                    sharedCount++;
                }
            }
        }

        res.json({
            message: `File successfully shared with ${sharedCount} users`,
            sharedCount,
            expiresAt: expiresAt ? expiresAt.toISOString() : null
        });
    } catch (error) {
        console.error("Share error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Trash and Star Operations ============

exports.toggleStar = async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await File.findOne({
            where: { id: fileId, userId: req.user.id }
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.isStarred = !file.isStarred;
        await file.save();

        res.json({ message: 'File star toggled', isStarred: file.isStarred });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.moveToTrash = async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await File.findOne({
            where: { id: fileId, userId: req.user.id }
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.isTrashed = true;
        // Unstar it if trashed
        file.isStarred = false;
        await file.save();

        res.json({ message: 'File moved to trash' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.restoreFromTrash = async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await File.findOne({
            where: { id: fileId, userId: req.user.id }
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.isTrashed = false;
        await file.save();

        res.json({ message: 'File restored from trash' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getStarredFiles = async (req, res) => {
    try {
        const userFiles = await File.findAll({
            where: { userId: req.user.id, isStarred: true, isTrashed: false }
        });

        const formattedFiles = userFiles.map(f => ({
            id: f.id,
            name: f.filename,
            type: f.mimetype,
            size: f.size,
            uploadDate: f.createdAt,
            path: f.path,
            isStarred: f.isStarred,
            isTrashed: f.isTrashed
        }));

        res.json(formattedFiles);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTrashedFiles = async (req, res) => {
    try {
        const userFiles = await File.findAll({
            where: { userId: req.user.id, isTrashed: true }
        });

        const formattedFiles = userFiles.map(f => ({
            id: f.id,
            name: f.filename,
            type: f.mimetype,
            size: f.size,
            uploadDate: f.createdAt,
            path: f.path,
            isStarred: f.isStarred,
            isTrashed: f.isTrashed
        }));

        res.json(formattedFiles);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Delete File (Permanent) ============

exports.deleteFile = async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await File.findOne({
            where: { id: fileId, userId: req.user.id }
        });

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.FileShare.destroy({ where: { fileId: file.id } });
        await file.destroy();

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Get Shared Files ============

exports.getSharedFiles = async (req, res) => {
    try {
        const myFiles = await File.findAll({
            where: { userId: req.user.id },
            include: [{
                model: db.FileShare,
                as: 'shares',
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['email']
                }]
            }]
        });

        const formattedShares = myFiles
            .filter(f => f.shares && f.shares.length > 0)
            .map(f => {
                const publicShare = f.shares.find(s => s.userId === req.user.id);
                const invites = f.shares.filter(s => s.userId !== req.user.id).map(s => ({
                    email: s.user ? s.user.email : 'Unknown',
                    permission: s.permission
                }));

                return {
                    id: f.id,
                    name: f.filename,
                    accessType: publicShare ? 'public' : 'restricted',
                    sharedWith: invites,
                    expiresAt: publicShare ? publicShare.expiresAt : null,
                    token: publicShare ? publicShare.token : null,
                    lastAccess: f.updatedAt,
                    visits: 0
                };
            });

        res.json(formattedShares);
    } catch (error) {
        console.error("Get shares error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getSharedWithMe = async (req, res) => {
    try {
        const shares = await db.FileShare.findAll({
            where: { userId: req.user.id },
            include: [{
                model: db.File,
                as: 'file',
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['username', 'email']
                }]
            }]
        });

        const formattedShares = shares
            .filter(s => s.file) // Ensure file still exists
            .map(s => ({
                id: s.file.id,
                name: s.file.filename,
                size: s.file.size,
                mimetype: s.file.mimetype,
                sharedBy: s.file.user ? s.file.user.username : 'Unknown',
                sharedByEmail: s.file.user ? s.file.user.email : 'Unknown',
                permission: s.permission,
                sharedAt: s.createdAt,
                token: s.token,
                expiresAt: s.expiresAt
            }));

        res.json(formattedShares);
    } catch (error) {
        console.error("Get shared with me error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Get Shared File by Token (with expiration check) ============

exports.getSharedFileByToken = async (req, res) => {
    try {
        const token = req.params.token;
        const fileShare = await db.FileShare.findOne({
            where: { token: token },
            include: [{
                model: db.File,
                as: 'file',
                include: [{
                    model: db.User,
                    as: 'user',
                    attributes: ['username', 'email']
                }]
            }]
        });

        if (!fileShare || !fileShare.file) {
            return res.status(404).json({ message: 'Link not found or expired' });
        }

        // Check expiration
        if (fileShare.expiresAt && new Date(fileShare.expiresAt) < new Date()) {
            return res.status(410).json({ message: 'This share link has expired' });
        }

        const isPublic = fileShare.userId === fileShare.file.userId;

        if (!isPublic) {
            const authHeader = req.header('Authorization');
            if (!authHeader) {
                return res.status(401).json({ message: 'Authentication required to view this file' });
            }
            const bearerToken = authHeader.replace('Bearer ', '');
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
                if (decoded.id !== fileShare.userId) {
                    return res.status(403).json({ message: 'You do not have permission to view this file' });
                }
            } catch (e) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        res.json({
            id: fileShare.file.id,
            name: fileShare.file.filename,
            size: fileShare.file.size,
            mimetype: fileShare.file.mimetype,
            uploadDate: fileShare.file.createdAt,
            ownerName: fileShare.file.user ? (fileShare.file.user.username || fileShare.file.user.email) : 'Unknown',
            token: token,
            expiresAt: fileShare.expiresAt
        });
    } catch (error) {
        console.error("Get shared file by token error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ Download Shared File by Token (with expiration check) ============

exports.downloadSharedFileByToken = async (req, res) => {
    try {
        const token = req.params.token;
        const fileShare = await db.FileShare.findOne({
            where: { token: token },
            include: [{
                model: db.File,
                as: 'file'
            }]
        });

        if (!fileShare || !fileShare.file) {
            return res.status(404).json({ message: 'Link not found or expired' });
        }

        // Check expiration
        if (fileShare.expiresAt && new Date(fileShare.expiresAt) < new Date()) {
            return res.status(410).json({ message: 'This share link has expired' });
        }

        const isPublic = fileShare.userId === fileShare.file.userId;

        if (!isPublic) {
            const authHeader = req.header('Authorization');
            if (!authHeader) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            const bearerToken = authHeader.replace('Bearer ', '');
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
                if (decoded.id !== fileShare.userId) {
                    return res.status(403).json({ message: 'You do not have permission to download this file' });
                }
            } catch (e) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        const filePath = path.join(__dirname, '..', fileShare.file.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Physical file not found on server' });
        }

        res.download(filePath, fileShare.file.filename);
    } catch (error) {
        console.error("Download shared file error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
