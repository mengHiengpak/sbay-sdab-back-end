import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import downloadRoutes from './routes/downloads';
import playlistRoutes from './routes/playlists';
import { setYtDlpPath } from './config';
import { setFfmpegPath } from './utils/compress';

const app = express();
const PORT = process.env.PORT || 3000;

const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function ensureYtDlp(): Promise<void> {
  const YTDlpWrap = require('yt-dlp-wrap').default;
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
  const binDir = path.join(__dirname, 'bin');
  const ytDlpPath = path.join(binDir, binName);

  if (fs.existsSync(ytDlpPath)) {
    try {
      const ytDlp = new YTDlpWrap(ytDlpPath);
      await ytDlp.getVersion();
      console.log('✅ yt-dlp found at', ytDlpPath);
      setYtDlpPath(ytDlpPath);
      return;
    } catch { }
  }

  console.log('📥 Downloading yt-dlp...');
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
  try {
    await YTDlpWrap.downloadFromGithub(ytDlpPath);
    if (!isWin) fs.chmodSync(ytDlpPath, 0o755);
    setYtDlpPath(ytDlpPath);
    console.log('✅ yt-dlp downloaded to', ytDlpPath);
  } catch (dlErr: any) {
    console.error('❌ Failed to download yt-dlp:', dlErr?.message || dlErr);
  }
}

async function ensureFfmpeg(): Promise<void> {
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
  const ffmpegPath = path.join(__dirname, '..', 'bin', binName);
  if (fs.existsSync(ffmpegPath)) {
    setFfmpegPath(ffmpegPath);
    if (!isWin) fs.chmodSync(ffmpegPath, 0o755);
    console.log('✅ ffmpeg found locally at', ffmpegPath);
    return;
  }
  console.log('⚠️  ffmpeg not found in bin/ - compression disabled. On Render, install via apt or place binary in bin/');
}

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS as string) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX as string) || 100,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

app.use('/downloads', express.static(path.resolve(downloadDir)));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('⚠️  MongoDB connection error (running without DB):', err.message));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/playlists', playlistRoutes);

const frontendPath = path.join(__dirname, '..', 'front-end', 'front-end-sbay-sdab');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.log('⚠️ Frontend not found at', frontendPath);
  app.get('*', (req: Request, res: Response) => {
    res.json({ message: 'StreamVault API is running', docs: '/api' });
  });
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

startServer();

async function startServer() {
  try {
    await ensureYtDlp();
    await ensureFfmpeg();
  } catch (err) {
    console.error('⚠️ Startup error:', err);
  }
  app.listen(PORT, () => {
    console.log(`🚀 StreamVault server running on http://localhost:${PORT}`);
    console.log(`📁 Downloads directory: ${downloadDir}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error('❌ Failed to start server:', err.message);
    }
    process.exit(1);
  });
}

export default app;
