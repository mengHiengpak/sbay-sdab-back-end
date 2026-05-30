"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const videos_1 = __importDefault(require("./routes/videos"));
const downloads_1 = __importDefault(require("./routes/downloads"));
const playlists_1 = __importDefault(require("./routes/playlists"));
const config_1 = require("./config");
const compress_1 = require("./utils/compress");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
if (!fs_1.default.existsSync(downloadDir)) {
    fs_1.default.mkdirSync(downloadDir, { recursive: true });
}
async function ensureYtDlp() {
    const YTDlpWrap = require('yt-dlp-wrap').default;
    const isWin = os_1.default.platform() === 'win32';
    const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    const binDir = path_1.default.join(__dirname, 'bin');
    const ytDlpPath = path_1.default.join(binDir, binName);
    if (fs_1.default.existsSync(ytDlpPath)) {
        try {
            const ytDlp = new YTDlpWrap(ytDlpPath);
            await ytDlp.getVersion();
            console.log('✅ yt-dlp found at', ytDlpPath);
            (0, config_1.setYtDlpPath)(ytDlpPath);
            return;
        }
        catch { }
    }
    console.log('📥 Downloading yt-dlp...');
    if (!fs_1.default.existsSync(binDir))
        fs_1.default.mkdirSync(binDir, { recursive: true });
    try {
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        if (!isWin)
            fs_1.default.chmodSync(ytDlpPath, 0o755);
        (0, config_1.setYtDlpPath)(ytDlpPath);
        console.log('✅ yt-dlp downloaded to', ytDlpPath);
    }
    catch (dlErr) {
        console.error('❌ Failed to download yt-dlp:', dlErr?.message || dlErr);
    }
}
async function ensureFfmpeg() {
    const isWin = os_1.default.platform() === 'win32';
    const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
    const ffmpegPath = path_1.default.join(__dirname, '..', 'bin', binName);
    if (fs_1.default.existsSync(ffmpegPath)) {
        (0, compress_1.setFfmpegPath)(ffmpegPath);
        if (!isWin)
            fs_1.default.chmodSync(ffmpegPath, 0o755);
        console.log('✅ ffmpeg found locally at', ffmpegPath);
        return;
    }
    console.log('⚠️  ffmpeg not found in bin/ - compression disabled. On Render, install via apt or place binary in bin/');
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/', limiter);
app.use('/downloads', express_1.default.static(path_1.default.resolve(downloadDir)));
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault')
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.log('⚠️  MongoDB connection error (running without DB):', err.message));
app.use('/api/auth', auth_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/download', downloads_1.default);
app.use('/api/playlists', playlists_1.default);
const frontendPath = path_1.default.join(__dirname, '..', 'front-end', 'front-end-sbay-sdab');
if (fs_1.default.existsSync(frontendPath)) {
    app.use(express_1.default.static(frontendPath));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    });
}
else {
    console.log('⚠️ Frontend not found at', frontendPath);
    app.get('*', (req, res) => {
        res.json({ message: 'StreamVault API is running', docs: '/api' });
    });
}
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});
startServer();
async function startServer() {
    try {
        await ensureYtDlp();
        await ensureFfmpeg();
    }
    catch (err) {
        console.error('⚠️ Startup error:', err);
    }
    app.listen(PORT, () => {
        console.log(`🚀 StreamVault server running on http://localhost:${PORT}`);
        console.log(`📁 Downloads directory: ${downloadDir}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use`);
        }
        else {
            console.error('❌ Failed to start server:', err.message);
        }
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map