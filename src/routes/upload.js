const express = require('express');
const { upload, cloudinary } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Upload single image
router.post('/single', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: req.file.path,
                publicId: req.file.filename,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
});

// Upload multiple images (up to 6)
router.post('/multiple', protect, upload.array('images', 6), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No image files provided' });
        }

        const uploadedImages = req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
        }));

        res.status(200).json({
            success: true,
            message: `${uploadedImages.length} image(s) uploaded successfully`,
            data: uploadedImages,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload images' });
    }
});

// Delete image by public ID
router.delete('/:publicId', protect, async (req, res) => {
    try {
        const { publicId } = req.params;

        // The publicId might include folder path, so we need to handle it correctly
        const fullPublicId = publicId.includes('/') ? publicId : `getsetride/cars/${publicId}`;

        const result = await cloudinary.uploader.destroy(fullPublicId);

        if (result.result === 'ok') {
            res.status(200).json({ success: true, message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Image not found' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete image' });
    }
});

module.exports = router;
