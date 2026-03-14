const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Note: Cloudinary v2 SDK automatically picks up the CLOUDINARY_URL environment variable!

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'dfs_uploads',
        resource_type: 'auto', // Important so PDFs/zips are accepted as "raw" and images as "image"
        public_id: (req, file) => Date.now() + '-' + file.originalname.replace(/\.[^/.]+$/, ""), // Strip extension for Cloudinary ID
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;
