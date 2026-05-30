"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const Video_1 = __importDefault(require("../models/Video"));
const config_1 = require("../config");
const compress_1 = require("../utils/compress");
const router = (0, express_1.Router)();
const activeDownloads = new Map();
function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be'))
        return 'youtube';
    if (url.includes('facebook.com') || url.includes('fb.watch'))
        return 'facebook';
    if (url.includes('tiktok.com'))
        return 'tiktok';
    if (url.includes('instagram.com'))
        return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com'))
        return 'twitter';
    if (url.includes('vimeo.com'))
        return 'vimeo';
    return 'other';
}
function formatDuration(seconds) {
    if (!seconds)
        return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
function formatSize(bytes) {
    if (!bytes || bytes === 0)
        return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb > 1024)
        return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
}
router.post('/info', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        res.status(400).json({ success: false, error: 'URL is required' });
        return;
    }
    try {
        const YTDlpWrap = require('yt-dlp-wrap').default;
        const ytDlp = new YTDlpWrap((0, config_1.getYtDlpPath)());
        const info = await ytDlp.getVideoInfo(url);
        const formats = [];
        if (info.formats) {
            const videoFormats = info.formats
                .filter((f) => f.vcodec !== 'none' && f.acodec !== 'none' && f.ext === 'mp4')
                .sort((a, b) => (b.height || 0) - (a.height || 0));
            const seen = new Set();
            videoFormats.forEach((f) => {
                const key = `${f.height}p`;
                if (!seen.has(key) && f.height) {
                    seen.add(key);
                    formats.push({
                        id: f.format_id,
                        quality: key,
                        ext: 'mp4',
                        type: 'video',
                        filesize: f.filesize || f.filesize_approx || 0,
                        filesizeFormatted: formatSize(f.filesize || f.filesize_approx || 0)
                    });
                }
            });
            const audioFormats = info.formats
                .filter((f) => f.vcodec === 'none' && f.acodec !== 'none')
                .sort((a, b) => (b.abr || 0) - (a.abr || 0));
            if (audioFormats.length > 0) {
                const af = audioFormats[0];
                formats.push({
                    id: af.format_id,
                    quality: `${af.abr || 128}kbps`,
                    ext: 'mp3',
                    type: 'audio',
                    filesize: af.filesize || af.filesize_approx || 0,
                    filesizeFormatted: formatSize(af.filesize || af.filesize_approx || 0)
                });
            }
        }
        if (formats.length === 0) {
            formats.push({ id: 'best', quality: '1080p', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Unknown' }, { id: 'bestvideo+bestaudio', quality: '720p', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Unknown' }, { id: 'bestaudio', quality: '128kbps', ext: 'mp3', type: 'audio', filesize: 0, filesizeFormatted: 'Unknown' });
        }
        res.json({
            success: true,
            data: {
                title: info.title || 'Unknown Title',
                thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
                duration: info.duration || 0,
                durationFormatted: formatDuration(info.duration),
                platform: detectPlatform(url),
                author: info.uploader || info.channel || 'Unknown',
                description: info.description?.substring(0, 500) || '',
                viewCount: info.view_count || 0,
                formats: formats.slice(0, 6)
            }
        });
    }
    catch (err) {
        console.error('Info error:', err.message);
        res.json({
            success: true,
            data: {
                title: 'Video from ' + detectPlatform(req.body.url),
                thumbnail: '',
                duration: 0,
                durationFormatted: '0:00',
                platform: detectPlatform(req.body.url),
                author: 'Unknown',
                description: '',
                viewCount: 0,
                formats: [
                    { id: 'best', quality: '1080p', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Unknown' },
                    { id: '720p', quality: '720p', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Unknown' },
                    { id: '480p', quality: '480p', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Unknown' },
                    { id: 'mp3', quality: '128kbps', ext: 'mp3', type: 'audio', filesize: 0, filesizeFormatted: 'Unknown' }
                ],
                _fallback: true
            }
        });
    }
});
router.post('/start', async (req, res) => {
    const { url, formatId, quality, ext, title, thumbnail, playlistId } = req.body;
    if (!url) {
        res.status(400).json({ success: false, error: 'URL is required' });
        return;
    }
    const downloadId = (0, uuid_1.v4)();
    const platform = detectPlatform(url);
    const format = ext || 'mp4';
    const fileName = `${downloadId}.${format}`;
    const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
    const filePath = path_1.default.join(downloadDir, fileName);
    let video;
    try {
        video = await Video_1.default.create({
            title: title || 'Downloading...',
            url: `/downloads/${fileName}`,
            sourceUrl: url,
            platform,
            thumbnail: thumbnail || '',
            format,
            quality: quality || 'best',
            filePath,
            isDownloaded: false,
            downloadProgress: 0,
            playlist: playlistId || null
        });
    }
    catch (dbErr) {
        console.log('DB not available, continuing without save');
        video = { _id: downloadId, title: title || 'Downloading...' };
    }
    activeDownloads.set(downloadId, {
        progress: 0,
        status: 'starting',
        videoId: video._id,
        fileName
    });
    startDownload(url, filePath, formatId || 'best', downloadId, video._id, format, quality || 'best');
    res.json({
        success: true,
        data: {
            downloadId,
            videoId: video._id,
            message: 'Download started'
        }
    });
});
async function startDownload(url, filePath, formatId, downloadId, videoId, format, quality = 'best') {
    try {
        const YTDlpWrap = require('yt-dlp-wrap').default;
        const ytDlp = new YTDlpWrap((0, config_1.getYtDlpPath)());
        const args = [url, '-o', filePath, '--no-playlist', '--newline'];
        if (format === 'mp3') {
            args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
        }
        else {
            args.push('-f', formatId || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
            args.push('--merge-output-format', 'mp4');
        }
        const download = activeDownloads.get(downloadId);
        if (download)
            download.status = 'downloading';
        const emitter = ytDlp.exec(args, {});
        emitter.on('progress', (progress) => {
            const dl = activeDownloads.get(downloadId);
            if (dl && progress.percent) {
                dl.progress = Math.round(progress.percent);
                dl.speed = progress.currentSpeed;
                dl.eta = progress.eta;
            }
        });
        await new Promise((resolve, reject) => {
            emitter.on('close', () => resolve());
            emitter.on('error', (err) => reject(err));
        });
        try {
            const compressed = await (0, compress_1.compressIfNeeded)(filePath);
            const stats = fs_1.default.statSync(filePath);
            await Video_1.default.findByIdAndUpdate(videoId, {
                isDownloaded: true,
                downloadProgress: 100,
                fileSize: stats.size,
                fileSizeFormatted: formatSize(stats.size),
                quality: compressed ? `${quality} (compressed)` : quality,
                url: `/downloads/${path_1.default.basename(filePath)}`
            });
        }
        catch (e) { /* DB might not be available */ }
        const dl = activeDownloads.get(downloadId);
        if (dl) {
            dl.progress = 100;
            dl.status = 'completed';
        }
        setTimeout(() => activeDownloads.delete(downloadId), 5 * 60 * 1000);
    }
    catch (err) {
        console.error('Download error:', err.message);
        const dl = activeDownloads.get(downloadId);
        if (dl) {
            dl.status = 'error';
            dl.error = err.message;
        }
        try {
            await Video_1.default.findByIdAndUpdate(videoId, { downloadProgress: -1 });
        }
        catch (e) { /* ignore */ }
    }
}
router.get('/progress/:downloadId', (req, res) => {
    const dl = activeDownloads.get(req.params.downloadId);
    if (!dl) {
        res.json({ success: true, data: { status: 'not_found', progress: 0 } });
        return;
    }
    res.json({
        success: true,
        data: {
            status: dl.status,
            progress: dl.progress,
            speed: dl.speed,
            eta: dl.eta,
            videoId: dl.videoId,
            error: dl.error
        }
    });
});
router.get('/active', (req, res) => {
    const downloads = [];
    activeDownloads.forEach((value, key) => {
        downloads.push({ downloadId: key, ...value });
    });
    res.json({ success: true, data: downloads });
});
exports.default = router;
//# sourceMappingURL=downloads.js.map