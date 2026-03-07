const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Standard upload
router.post('/upload', authMiddleware, upload.single('file'), fileController.uploadFile);

// Chunked upload
router.post('/chunked/init', authMiddleware, fileController.initChunkedUpload);
router.post('/chunked/upload', authMiddleware, upload.single('chunk'), fileController.uploadChunk);
router.post('/chunked/complete', authMiddleware, fileController.completeChunkedUpload);

// File operations
router.get('/', authMiddleware, fileController.getFiles);
router.get('/shared', authMiddleware, fileController.getSharedFiles);
router.get('/shared-with-me', authMiddleware, fileController.getSharedWithMe);
router.get('/download/:id', authMiddleware, fileController.downloadFile);
router.post('/share', authMiddleware, fileController.shareFile);
router.delete('/:id', authMiddleware, fileController.deleteFile);

// Public shared file access
router.get('/share/:token', fileController.getSharedFileByToken);
router.get('/share/:token/download', fileController.downloadSharedFileByToken);

module.exports = router;
