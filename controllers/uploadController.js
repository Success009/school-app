/**
 * File Upload Controller with Google Play Data Safety MIME Validation
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
]);

function createUploadRouter(uploadsDir = path.join(__dirname, '..', 'uploads')) {
    const router = express.Router();

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, uniqueName);
        }
    });

    const fileFilter = (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed. Only safe images and documents are accepted.`));
        }
    };

    const upload = multer({
        storage,
        fileFilter,
        limits: { fileSize: 25 * 1024 * 1024 }
    });

    router.post('/', upload.single('file'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded or file rejected by policy." });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: fileUrl,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    });

    return router;
}

module.exports = { createUploadRouter, ALLOWED_MIME_TYPES };
