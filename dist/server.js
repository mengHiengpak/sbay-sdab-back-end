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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = __importDefault(require("./routes/auth"));
const videos_1 = __importDefault(require("./routes/videos"));
const downloads_1 = __importDefault(require("./routes/downloads"));
const playlists_1 = __importDefault(require("./routes/playlists"));
const config_1 = require("./config");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
if (!fs_1.default.existsSync(downloadDir)) {
    fs_1.default.mkdirSync(downloadDir, { recursive: true });
}
async function ensureYtDlp() {
    const YTDlpWrap = require('yt-dlp-wrap').default;
    try {
        const ytDlp = new YTDlpWrap();
        await ytDlp.getVersion();
        console.log('✅ yt-dlp found');
    }
    catch {
        console.log('📥 Downloading yt-dlp...');
        const binDir = path_1.default.join(__dirname, 'bin');
        if (!fs_1.default.existsSync(binDir))
            fs_1.default.mkdirSync(binDir, { recursive: true });
        const ytDlpPath = path_1.default.join(binDir, 'yt-dlp.exe');
        await YTDlpWrap.downloadFromGithub(ytDlpPath);
        (0, config_1.setYtDlpPath)(ytDlpPath);
        console.log('✅ yt-dlp downloaded to', ytDlpPath);
    }
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
const frontendPath = path_1.default.join(__dirname, '..', 'front-end', 'front-end-sbay-sdab');
app.use(express_1.default.static(frontendPath));
app.use('/downloads', express_1.default.static(path_1.default.resolve(downloadDir)));
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault')
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.log('⚠️  MongoDB connection error (running without DB):', err.message));
app.use('/api/auth', auth_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/download', downloads_1.default);
app.use('/api/playlists', playlists_1.default);
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});
ensureYtDlp().then(() => {
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
});
exports.default = app;
//# sourceMappingURL=server.js.map