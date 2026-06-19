import dotenv from 'dotenv';
const envPath = require('fs').existsSync('./sbaysdab.env') ? './sbaysdab.env' : '.env';
dotenv.config({ path: envPath });

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import rateLimit from 'express-rate-limit';
import { Readable } from 'stream';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import downloadRoutes from './routes/downloads';
import playlistRoutes from './routes/playlists';
import { setYtDlpPath } from './config';
import { setFfmpegPath } from './utils/compress';

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3001', 10);

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function ensureYtDlp(): Promise<void> {
  const YTDlpWrap = require('yt-dlp-wrap').default;
  const { execSync } = require('child_process');
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';

  const tryUse = async (nameOrPath: string): Promise<boolean> => {
    try {
      const ytDlp = new YTDlpWrap(nameOrPath);
      await ytDlp.getVersion();
      console.log('✅ yt-dlp found at', nameOrPath);
      setYtDlpPath(nameOrPath);
      return true;
    } catch { return false; }
  };

  try {
    const whichCmd = isWin ? 'where' : 'which';
    const out = execSync(`${whichCmd} ${binName}`, { encoding: 'utf8', timeout: 5000 }).trim();
    const pathBin = out.split(/\r?\n/)[0].trim();
    if (pathBin && await tryUse(pathBin)) return;
  } catch {}

  const isDist = __dirname.endsWith('dist');
  const binDir = path.join(__dirname, isDist ? '..' : '', 'bin');
  const ytDlpPath = path.join(binDir, binName);

  if (fs.existsSync(ytDlpPath) && await tryUse(ytDlpPath)) return;

  console.log('📥 Downloading yt-dlp...');
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
  try {
    await YTDlpWrap.downloadFromGithub(ytDlpPath, '2026.06.09');
    if (!isWin) fs.chmodSync(ytDlpPath, 0o755);
    await tryUse(ytDlpPath);
    console.log('✅ yt-dlp downloaded to', ytDlpPath);
  } catch (dlErr: any) {
    console.error('❌ Failed to download yt-dlp:', dlErr?.message || dlErr);
  }
}

async function ensureFfmpeg(): Promise<void> {
  const isWin = os.platform() === 'win32';
  const binName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
  const isDist = __dirname.endsWith('dist');
  const binDir = path.join(__dirname, isDist ? '..' : '', 'bin');
  const localPath = path.join(binDir, binName);
  if (fs.existsSync(localPath)) {
    setFfmpegPath(localPath);
    if (!isWin) fs.chmodSync(localPath, 0o755);
    console.log('✅ ffmpeg found locally at', localPath);
    return;
  }
  try {
    const proc = require('child_process');
    proc.execSync(`${isWin ? 'where' : 'which'} ffmpeg`, { stdio: 'ignore' });
    console.log('✅ ffmpeg found on system PATH');
  } catch {
    console.log('⚠️  ffmpeg not found - mp3 conversion disabled. Audio will download as m4a/opus instead.');
  }
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

app.use('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: 'url query param required' });
  try {
    const { hostname } = new URL(targetUrl);
    if (!hostname.endsWith('googlevideo.com')) {
      return res.status(403).json({ error: 'Host not allowed' });
    }
    const r = await fetch(targetUrl, { headers: { 'Range': req.headers.range || '' } });
    if (r.headers.get('content-type')) res.setHeader('Content-Type', r.headers.get('content-type')!);
    if (r.headers.get('content-length')) res.setHeader('Content-Length', r.headers.get('content-length')!);
    if (r.headers.get('content-range')) res.setHeader('Content-Range', r.headers.get('content-range')!);
    res.status(r.status);
    if (r.body) {
      const nodeStream = Readable.fromWeb(r.body as any);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch { res.status(502).json({ error: 'Proxy failed' }); }
});

const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';
const hasAuthSource = mongodbUri.includes('authSource=');
mongoose.connect(hasAuthSource ? mongodbUri : mongodbUri + (mongodbUri.includes('?') ? '&' : '?') + 'authSource=admin')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('⚠️  MongoDB connection error (running without DB):', err.message));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/playlists', playlistRoutes);

const isDist = __dirname.endsWith('dist');
const projectRoot = isDist ? path.join(__dirname, '..') : __dirname;
const frontendPath = path.join(projectRoot, 'front-end', 'front-end-sbay-sdab', 'out');
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
