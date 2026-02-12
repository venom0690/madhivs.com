const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for local storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

// File filter for allowed image types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Export multer middleware
exports.uploadSingle = upload.single('image');
exports.uploadMultiple = upload.array('images', 10);

/**
 * Upload single image
 * POST /api/upload
 */
exports.uploadSingleImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            status: 'error',
            message: 'Please upload an image'
        });
    }

    const url = `/uploads/${req.file.filename}`;

    res.status(200).json({
        status: 'success',
        data: {
            url: url,
            filename: req.file.filename,
            size: req.file.size
        }
    });
};

/**
 * Upload multiple images
 * POST /api/upload/multiple
 */
exports.uploadMultipleImages = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Please upload at least one image'
        });
    }

    const images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        size: file.size
    }));

    res.status(200).json({
        status: 'success',
        results: images.length,
        data: {
            images
        }
    });
};

/**
 * Delete image from storage
 * DELETE /api/upload/:filename
 */
exports.deleteImage = (req, res) => {
    const { filename } = req.params;

    if (!filename) {
        return res.status(400).json({
            status: 'error',
            message: 'Filename is required'
        });
    }

    // SECURITY: Prevent path traversal attacks
    const filePath = path.join(UPLOAD_DIR, path.basename(filename));
    if (!filePath.startsWith(UPLOAD_DIR)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid filename'
        });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            status: 'error',
            message: 'Image not found'
        });
    }

    try {
        fs.unlinkSync(filePath);
        res.status(200).json({
            status: 'success',
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete image'
        });
    }
};
