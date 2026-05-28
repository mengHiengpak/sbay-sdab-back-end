"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Playlist_1 = __importDefault(require("../models/Playlist"));
const Video_1 = __importDefault(require("../models/Video"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist_1.default.find()
            .populate('videos', 'title thumbnail duration durationFormatted')
            .sort('-createdAt');
        res.json({ success: true, data: playlists });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist_1.default.findById(req.params.id)
            .populate('videos');
        if (!playlist) {
            res.status(404).json({ success: false, error: 'Playlist not found' });
            return;
        }
        res.json({ success: true, data: playlist });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, description, color } = req.body;
        if (!name) {
            res.status(400).json({ success: false, error: 'Name is required' });
            return;
        }
        const playlist = await Playlist_1.default.create({ name, description, color });
        res.status(201).json({ success: true, data: playlist });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.patch('/:id/add-video', async (req, res) => {
    try {
        const { videoId } = req.body;
        const playlist = await Playlist_1.default.findByIdAndUpdate(req.params.id, { $addToSet: { videos: videoId } }, { new: true });
        await Video_1.default.findByIdAndUpdate(videoId, { playlist: req.params.id });
        res.json({ success: true, data: playlist });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.patch('/:id/remove-video', async (req, res) => {
    try {
        const { videoId } = req.body;
        const playlist = await Playlist_1.default.findByIdAndUpdate(req.params.id, { $pull: { videos: videoId } }, { new: true });
        await Video_1.default.findByIdAndUpdate(videoId, { playlist: null });
        res.json({ success: true, data: playlist });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await Playlist_1.default.findByIdAndDelete(req.params.id);
        await Video_1.default.updateMany({ playlist: req.params.id }, { playlist: null });
        res.json({ success: true, message: 'Playlist deleted' });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=playlists.js.map