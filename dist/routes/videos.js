"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const Video_1 = __importDefault(require("../models/Video"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { search, platform, format, page = '1', limit = '20', sort = '-createdAt', favorites } = req.query;
        const query = {};
        if (search) {
            query.$text = { $search: search };
        }
        if (platform)
            query.platform = platform;
        if (format) {
            if (format === 'audio') {
                query.format = { $in: ['mp3', 'm4a'] };
            }
            else {
                query.format = format;
            }
        }
        if (favorites === 'true')
            query.isFavorite = true;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Video_1.default.countDocuments(query);
        const videos = await Video_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('playlist', 'name color');
        res.json({
            success: true,
            data: videos,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const video = await Video_1.default.findById(req.params.id).populate('playlist', 'name color');
        if (!video) {
            res.status(404).json({ success: false, error: 'Video not found' });
            return;
        }
        res.json({ success: true, data: video });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.patch('/:id/play', async (req, res) => {
    try {
        const video = await Video_1.default.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } }, { new: true });
        res.json({ success: true, data: video });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.patch('/:id/favorite', async (req, res) => {
    try {
        const video = await Video_1.default.findById(req.params.id);
        if (!video) {
            res.status(404).json({ success: false, error: 'Video not found' });
            return;
        }
        video.isFavorite = !video.isFavorite;
        await video.save();
        res.json({ success: true, data: video });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video_1.default.findById(req.params.id);
        if (!video) {
            res.status(404).json({ success: false, error: 'Video not found' });
            return;
        }
        if (video.filePath) {
            if (fs_1.default.existsSync(video.filePath)) {
                fs_1.default.unlinkSync(video.filePath);
            }
        }
        await video.deleteOne();
        res.json({ success: true, message: 'Video deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/stats/overview', async (req, res) => {
    try {
        const totalVideos = await Video_1.default.countDocuments();
        const totalDownloaded = await Video_1.default.countDocuments({ isDownloaded: true });
        const favorites = await Video_1.default.countDocuments({ isFavorite: true });
        const platformStats = await Video_1.default.aggregate([
            { $group: { _id: '$platform', count: { $sum: 1 } } }
        ]);
        res.json({
            success: true,
            data: { totalVideos, totalDownloaded, favorites, platformStats }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=videos.js.map