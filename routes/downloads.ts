import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import Video from '../models/Video';
import Setting from '../models/Setting';
import { getYtDlpPath } from '../config';
import { compressIfNeeded } from '../utils/compress';

const router = Router();

interface ActiveDownload {
  progress: number;
  status: string;
  videoId: string;
  fileName: string;
  speed?: string;
  eta?: number;
  error?: string;
}

const activeDownloads = new Map<string, ActiveDownload>();

const _tmpCookieFiles: string[] = [];

process.on('exit', () => {
  _tmpCookieFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });
});

async function getCookieArgs(platform: string = 'youtube'): Promise<string[]> {
  try {
    const doc = await Setting.findOne({ key: `${platform}_cookies` });
    if (doc && doc.value) {
      const ageHours = (Date.now() - new Date(doc.updatedAt || doc.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 24) {
        console.log(`⚠️ ${platform} cookies are ${Math.round(ageHours)}h old, skipping (expired)`);
        return [];
      }
      const tmpFile = path.join(os.tmpdir(), `${platform}-cookies-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, doc.value);
      _tmpCookieFiles.push(tmpFile);
      return ['--cookies', tmpFile];
    }
  } catch {}
  const browser = process.env.COOKIES_FROM_BROWSER;
  if (browser) {
    try {
      require('child_process').execSync(`"${browser}" --version`, { stdio: 'ignore', timeout: 3000 });
      return ['--cookies-from-browser', browser];
    } catch {
      console.log(`⚠️ Browser "${browser}" not found, skipping cookie extraction`);
    }
  }
  const cookiesFile = process.env.COOKIES_FILE;
  if (cookiesFile && fs.existsSync(cookiesFile)) {
    const stats = fs.statSync(cookiesFile);
    if (stats.size > 50) {
      return ['--cookies', cookiesFile];
    }
    console.log(`⚠️ Cookies file ${cookiesFile} is too small (${stats.size}b), skipping`);
  }
  return [];
}

function getPlatformHeaders(platform: string): string[] {
  const headers: string[] = [];
  if (platform === 'youtube') {
    headers.push('--add-header', 'Origin:https://www.youtube.com');
    headers.push('--add-header', 'Referer:https://www.youtube.com/');
  } else if (platform === 'facebook') {
    headers.push('--add-header', 'Origin:https://www.facebook.com');
    headers.push('--add-header', 'Referer:https://www.facebook.com/');
  } else if (platform === 'tiktok') {
    headers.push('--add-header', 'Origin:https://www.tiktok.com');
    headers.push('--add-header', 'Referer:https://www.tiktok.com/');
  } else if (platform === 'instagram') {
    headers.push('--add-header', 'Origin:https://www.instagram.com');
    headers.push('--add-header', 'Referer:https://www.instagram.com/');
  } else if (platform === 'twitter') {
    headers.push('--add-header', 'Origin:https://twitter.com');
    headers.push('--add-header', 'Referer:https://twitter.com/');
  }
  return headers;
}

function getPlatformExtractorArgs(platform: string): string[] {
  if (platform === 'youtube') {
    return [
      '--extractor-args', 'youtube:player_client=android,web,ios,android_creator,ios_creator,web_creator,android_music,web_music,web_embedded',
      '--extractor-args', 'youtube:include_dash_manifest=False',
      '--extractor-args', 'youtube:player_skip=webpage,configs'
    ];
  }
  if (platform === 'facebook') {
    return ['--extractor-args', 'facebook:shorts_disabled=True'];
  }
  if (platform === 'tiktok') {
    return ['--extractor-args', 'tiktok:api_hostname=www.tiktok.com'];
  }
  return [];
}

function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'other';
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
}

const YTDlpWrap = require('yt-dlp-wrap').default;

async function getVideoInfoWithTimeout(ytDlp: any, args: string[], timeoutMs = 60000): Promise<any> {
  return Promise.race([
    ytDlp.getVideoInfo(args),
    new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('Video info request timed out')), timeoutMs)
    )
  ]);
}

router.post('/info', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'Valid URL is required' });
    return;
  }

  try {
    const ytDlpPath = getYtDlpPath();
    if (!ytDlpPath) {
      res.status(500).json({ success: false, error: 'yt-dlp binary not found. Check server startup logs.' });
      return;
    }
    const ytDlp = new YTDlpWrap(ytDlpPath);

    const platform = detectPlatform(url);

    const infoArgs: string[] = [
      url, '--sleep-requests', '2',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--geo-bypass',
      '--force-ipv4',
      '--retries', '10',
      '--extractor-retries', '10',
      '--throttled-rate', '100K',
      '--no-check-certificate',
      '--js-runtimes', 'node',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      ...getPlatformHeaders(platform),
      ...getPlatformExtractorArgs(platform),
      ...(await getCookieArgs(platform))
    ];
    const info = await getVideoInfoWithTimeout(ytDlp, infoArgs);

    const formats: any[] = [];
    if (info.formats) {
      const seenQualities = new Set<string>();

      const videoOnly = info.formats
        .filter((f: any) => f.vcodec !== 'none' && f.acodec === 'none' && f.height && f.ext)
        .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
      const videoWithAudio = info.formats
        .filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none' && f.height && f.ext)
        .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));

      const allVideoFormats = videoWithAudio.length > 0 ? videoWithAudio : videoOnly;

      allVideoFormats.forEach((f: any) => {
        const key = `${f.height}p`;
        if (!seenQualities.has(key)) {
          seenQualities.add(key);
          formats.push({
            id: f.format_id,
            quality: key,
            ext: f.ext || 'mp4',
            type: 'video',
            filesize: f.filesize || f.filesize_approx || 0,
            filesizeFormatted: formatSize(f.filesize || f.filesize_approx || 0)
          });
        }
      });

      if (formats.length > 0) {
        formats.unshift({
          id: 'best',
          quality: `${formats[0].quality}`,
          ext: 'mp4',
          type: 'video+audio',
          filesize: 0,
          filesizeFormatted: 'Auto'
        });
      }

      const audioFormats = info.formats
        .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));

      if (audioFormats.length > 0) {
        const af = audioFormats[0];
        formats.push({
          id: af.format_id,
          quality: `${af.abr || 128}kbps`,
          ext: af.ext || 'm4a',
          type: 'audio',
          filesize: af.filesize || af.filesize_approx || 0,
          filesizeFormatted: formatSize(af.filesize || af.filesize_approx || 0)
        });
      }
    }

    if (formats.length === 0) {
      formats.push(
        { id: 'best', quality: 'Auto', ext: 'mp4', type: 'video+audio', filesize: 0, filesizeFormatted: 'Auto' },
        { id: 'bestvideo+bestaudio', quality: 'Auto', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Auto' },
        { id: 'bestaudio', quality: '128kbps', ext: 'm4a', type: 'audio', filesize: 0, filesizeFormatted: 'Auto' }
      );
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
  } catch (err: any) {
    const errMsg = err?.stderr || err?.message || String(err);
    console.error('Info error for', url.substring(0, 80) + '...', errMsg);

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
          { id: 'bestaudio', quality: '128kbps', ext: 'm4a', type: 'audio', filesize: 0, filesizeFormatted: 'Unknown' }
        ],
        _fallback: true,
        _error: errMsg.substring(0, 2000)
      }
    });
  }
});

router.post('/start', async (req: Request, res: Response): Promise<void> => {
  const { url, formatId, quality, ext, title, thumbnail, playlistId, duration, durationFormatted } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'Valid URL is required' });
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    res.status(400).json({ success: false, error: 'URL must start with http:// or https://' });
    return;
  }

  const downloadId = uuidv4();
  const platform = detectPlatform(url);
  const format = ext || 'mp4';
  const fileName = `${downloadId}.${format}`;
  const downloadDir = process.env.DOWNLOAD_DIR || './downloads';
  const filePath = path.join(downloadDir, fileName);

  let video: any;
  try {
    video = await Video.create({
      title: title || 'Downloading...',
      url: `/downloads/${fileName}`,
      sourceUrl: url,
      platform,
      thumbnail: thumbnail || '',
      format,
      quality: quality || 'best',
      duration: duration || 0,
      durationFormatted: durationFormatted || '0:00',
      filePath,
      isDownloaded: false,
      downloadProgress: 0,
      playlist: playlistId || null
    });
  } catch (dbErr) {
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

let _ffmpegChecked = false;
let _hasFfmpeg = false;

function hasFfmpeg(): boolean {
  if (_ffmpegChecked) return _hasFfmpeg;
  _ffmpegChecked = true;
  try {
    require('child_process').execSync('ffmpeg -version', { stdio: 'ignore', timeout: 3000 });
    _hasFfmpeg = true;
  } catch {
    _hasFfmpeg = false;
  }
  return _hasFfmpeg;
}

async function startDownload(url: string, filePath: string, formatId: string, downloadId: string, videoId: string, format: string, quality: string = 'best'): Promise<void> {
  try {
    const ytDlpPath = getYtDlpPath();
    if (!ytDlpPath) {
      const dl = activeDownloads.get(downloadId);
      if (dl) { dl.status = 'error'; dl.error = 'yt-dlp binary not found'; }
      return;
    }
    const ytDlp = new YTDlpWrap(ytDlpPath);

    const platform = detectPlatform(url);

    const args: string[] = [
      url, '-o', filePath, '--no-playlist', '--newline', '--no-mtime',
      '--sleep-requests', '2',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--geo-bypass',
      '--retries', '10',
      '--extractor-retries', '5',
      '--throttled-rate', '100K',
      '--no-check-certificate',
      '--js-runtimes', 'node',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      ...getPlatformHeaders(platform),
      ...getPlatformExtractorArgs(platform),
      ...(await getCookieArgs(platform))
    ];

    if (format === 'mp3' || format === 'm4a') {
      if (hasFfmpeg()) {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      } else {
        args.push('-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio');
      }
    } else {
      const ffmpegAvail = hasFfmpeg();
      if (ffmpegAvail) {
        args.push('-f', `${formatId}+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best`);
        args.push('--merge-output-format', 'mp4');
      } else {
        args.push('-f', `${formatId}/best[ext=mp4]/best`);
      }
    }

    const download = activeDownloads.get(downloadId);
    if (download) download.status = 'downloading';

    let emitter: any;
    try {
      emitter = ytDlp.exec(args, {});
    } catch (spawnErr: any) {
      const dl = activeDownloads.get(downloadId);
      if (dl) { dl.status = 'error'; dl.error = 'Failed to launch yt-dlp: ' + (spawnErr.message || 'spawn error'); }
      return;
    }
    emitter.on('progress', (progress: any) => {
      const dl = activeDownloads.get(downloadId);
      if (dl && progress.percent) {
        dl.progress = Math.round(progress.percent);
        dl.speed = progress.currentSpeed;
        dl.eta = progress.eta;
      }
    });
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        emitter.on('close', () => resolve());
        emitter.on('error', (err: Error) => reject(err));
      }),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Download timed out')), 600000))
    ]);

    try {
      const compressed = await compressIfNeeded(filePath);
      const stats = fs.statSync(filePath);

      let probeDuration = 0;
      try {
        const { execSync } = require('child_process');
        const probeOut = execSync(
          `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
          { timeout: 10000, encoding: 'utf8' }
        );
        probeDuration = Math.round(parseFloat(probeOut.trim()));
      } catch {}

      await Video.findByIdAndUpdate(videoId, {
        isDownloaded: true,
        downloadProgress: 100,
        fileSize: stats.size,
        fileSizeFormatted: formatSize(stats.size),
        duration: probeDuration || 0,
        durationFormatted: formatDuration(probeDuration),
        quality: compressed ? `${quality} (compressed)` : quality,
        url: `/downloads/${path.basename(filePath)}`
      });
    } catch (e) { /* DB might not be available */ }

    const dl = activeDownloads.get(downloadId);
    if (dl) { dl.progress = 100; dl.status = 'completed'; }

    setTimeout(() => activeDownloads.delete(downloadId), 5 * 60 * 1000);

  } catch (err: any) {
    console.error('Download error:', err.message);
    const dl = activeDownloads.get(downloadId);
    if (dl) { dl.status = 'error'; dl.error = err.message; }

    try {
      await Video.findByIdAndUpdate(videoId, { downloadProgress: -1 });
    } catch (e) { /* ignore */ }
  }
}

router.get('/progress/:downloadId', (req: Request, res: Response): void => {
  const dl = activeDownloads.get(req.params.downloadId as string);
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

router.get('/active', (req: Request, res: Response): void => {
  const downloads: any[] = [];
  activeDownloads.forEach((value, key) => {
    downloads.push({ downloadId: key, ...value });
  });
  res.json({ success: true, data: downloads });
});

router.post('/cookies', async (req: Request, res: Response): Promise<void> => {
  let { cookies, platform } = req.body;
  if (!cookies) {
    res.status(400).json({ success: false, error: 'Cookies text is required' });
    return;
  }
  platform = platform || 'youtube';
  try {
    await Setting.findOneAndUpdate(
      { key: `${platform}_cookies` },
      { value: cookies },
      { upsert: true }
    );
    res.json({ success: true, message: `Cookies saved for ${platform}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/cookies-status', async (req: Request, res: Response): Promise<void> => {
  const platform = (req.query.platform as string) || 'youtube';
  try {
    const doc = await Setting.findOne({ key: `${platform}_cookies` });
    res.json({ success: true, data: { platform, hasCookies: !!(doc && doc.value) } });
  } catch {
    res.json({ success: true, data: { platform, hasCookies: false } });
  }
});

export default router;
