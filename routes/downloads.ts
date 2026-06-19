import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import Setting from '../models/Setting';
import { getYtDlpPath } from '../config';

const router = Router();

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
    const args: string[] = [
      '--extractor-args', 'youtube:player_client=android',
      '--extractor-args', 'youtube:include_dash_manifest=True',
      '--extractor-args', 'youtube:player_skip=webpage'
    ];
    const dataSyncId = process.env.YOUTUBE_DATA_SYNC_ID;
    if (dataSyncId) {
      args.push('--extractor-args', `youtube:data_sync_id=${dataSyncId}`);
    }
    return args;
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

function parseYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseISO8601(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

async function youtubeApiFallback(url: string): Promise<any | null> {
  const videoId = parseYouTubeId(url);
  if (!videoId) {
    console.log('YouTube API fallback: could not extract video ID from', url);
    return null;
  }

  const invidiousInstances = [
    'https://inv.riverside.rocks',
    'https://yt.artemislena.eu',
    'https://invidious.jing.rocks',
    'https://invidious.slipfox.xyz',
    'https://invidious.xyz',
    'https://y.com.sb',
    'https://invidious.privacyredirect.com'
  ];

  for (const instance of invidiousInstances) {
    try {
      const apiUrl = `${instance}/api/v1/videos/${videoId}`;
      const res = await fetch(apiUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) continue;
      const json: any = await res.json();
      if (!json?.title) continue;
      const durationSec = json.lengthSeconds || 0;
      return {
        title: json.title || 'Unknown Title',
        thumbnail: json.thumbnailUrl || json.videoThumbnails?.[0]?.url || '',
        duration: durationSec,
        durationFormatted: formatDuration(durationSec),
        platform: 'youtube',
        author: json.author || json.channelName || 'Unknown',
        description: (json.description || '').substring(0, 500),
        viewCount: parseInt(json.viewCount || '0'),
        formats: [
          { id: 'best', quality: 'Auto', ext: 'mp4', type: 'video+audio', filesize: 0, filesizeFormatted: 'Auto' },
          { id: 'bestvideo+bestaudio', quality: 'Auto', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Auto' },
          { id: 'bestaudio', quality: '128kbps', ext: 'm4a', type: 'audio', filesize: 0, filesizeFormatted: 'Auto' }
        ]
      };
    } catch { continue; }
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('YouTube API error:', res.status, body.substring(0, 200));
        return null;
      }
      const json: any = await res.json();
      const item = json?.items?.[0];
      if (!item) return null;
      const snippet = item.snippet || {};
      const stats = item.statistics || {};
      const durationSec = parseISO8601(item.contentDetails?.duration || '');
      return {
        title: snippet.title || 'Unknown Title',
        thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
        duration: durationSec,
        durationFormatted: formatDuration(durationSec),
        platform: 'youtube',
        author: snippet.channelTitle || 'Unknown',
        description: (snippet.description || '').substring(0, 500),
        viewCount: parseInt(stats.viewCount || '0'),
        formats: [
          { id: 'best', quality: 'Auto', ext: 'mp4', type: 'video+audio', filesize: 0, filesizeFormatted: 'Auto' },
          { id: 'bestvideo+bestaudio', quality: 'Auto', ext: 'mp4', type: 'video', filesize: 0, filesizeFormatted: 'Auto' },
          { id: 'bestaudio', quality: '128kbps', ext: 'm4a', type: 'audio', filesize: 0, filesizeFormatted: 'Auto' }
        ]
      };
    } catch (e: any) {
      console.error('YouTube API error:', e?.message || e);
      return null;
    }
  }

  return null;
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
      '--js-runtimes', `node:${process.execPath}`,
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--geo-bypass',
      '--force-ipv4',
      '--retries', '10',
      '--extractor-retries', '10',

      '--no-check-certificate',
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

    if (detectPlatform(url) === 'youtube') {
      const apiData = await youtubeApiFallback(url);
      if (apiData) {
        res.json({ success: true, data: { ...apiData, _fallback: true, _error: errMsg.substring(0, 2000) } });
        return;
      }
    }

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



async function runYtDlp(url: string, extraArgs: string[] = []): Promise<string | null> {
  const ytDlpPath = getYtDlpPath();
  if (!ytDlpPath) return null;
  try {
    const { execFileSync } = require('child_process');
    const args: string[] = [
      url, '-g', '--no-playlist',
      '--js-runtimes', `node:${process.execPath}`,
      '--geo-bypass', '--force-ipv4',
      '--no-check-certificate',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...extraArgs,
      '-f', 'best[ext=mp4]/best',
    ];
    const out = execFileSync(ytDlpPath, args, { encoding: 'utf8', timeout: 60000 }).toString().trim();
    return out.split('\n').find((l: string) => l.startsWith('http')) || null;
  } catch { return null; }
}

router.post('/stream', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'Valid URL is required' });
    return;
  }

  const platform = detectPlatform(url);
  if (platform !== 'youtube') {
    res.status(400).json({ success: false, error: 'Only YouTube supported' });
    return;
  }

  let streamUrl: string | null = null;
  const errors: string[] = [];

  // Strategy 1: yt-dlp with cookies + web_embedded
  const cookieArgs = await getCookieArgs(platform);
  streamUrl = await runYtDlp(url, [
    ...cookieArgs,
    ...getPlatformHeaders(platform),
    '--extractor-args', 'youtube:player_client=web_embedded;player_skip=webpage,js',
  ]);
  if (streamUrl) { res.json({ success: true, data: { streamUrl, platform } }); return; }
  errors.push('cookies+embedded failed');

  // Strategy 2: yt-dlp without cookies, android client
  streamUrl = await runYtDlp(url, [
    ...getPlatformHeaders(platform),
    '--extractor-args', 'youtube:player_client=android;player_skip=webpage,js',
  ]);
  if (streamUrl) { res.json({ success: true, data: { streamUrl, platform, _auth: 'android' } }); return; }
  errors.push('android failed');

  // Strategy 3: yt-dlp without cookies, tv_embedded client
  streamUrl = await runYtDlp(url, [
    ...getPlatformHeaders(platform),
    '--extractor-args', 'youtube:player_client=tv_embedded;player_skip=webpage,js',
  ]);
  if (streamUrl) { res.json({ success: true, data: { streamUrl, platform, _auth: 'tv' } }); return; }
  errors.push('tv_embedded failed');

  // Strategy 4: ytdl-core (no cookies)
  try {
    const ytdl = require('@distube/ytdl-core');
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }
    });
    const fmt = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'audioandvideo' });
    streamUrl = fmt?.url || info.formats.find((f: any) => f.url)?.url;
    if (streamUrl) { res.json({ success: true, data: { streamUrl, platform, _auth: 'ytdl-core' } }); return; }
    errors.push('ytdl-core: no url');
  } catch (e: any) { errors.push('ytdl-core: ' + (e?.message || '').substring(0, 100)); }

  // Strategy 5: Invidious API
  const videoId = parseYouTubeId(url);
  if (videoId) {
    for (const instance of ['https://inv.riverside.rocks', 'https://yt.artemislena.eu', 'https://invidious.jing.rocks']) {
      try {
        const apiRes = await fetch(`${instance}/api/v1/videos/${videoId}`, {
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!apiRes.ok) continue;
        const json: any = await apiRes.json();
        const all: any[] = [...(json?.formatStream || []), ...(json?.adaptiveFormats || [])];
        const u = all.find((f: any) => f.url)?.url;
        if (u) { res.json({ success: true, data: { streamUrl: u, platform, _auth: 'invidious' } }); return; }
      } catch { continue; }
    }
    errors.push('invidious: no url from any instance');
  }

  console.error('All stream strategies failed:', errors);
  res.status(500).json({ success: false, error: 'All methods failed', details: errors });
});

router.get('/proxy', async (req: Request, res: Response): Promise<void> => {
  const sourceUrl = req.query.url as string;
  if (!sourceUrl) {
    res.status(400).json({ success: false, error: 'url query param required' });
    return;
  }

  const platform = detectPlatform(sourceUrl);
  if (platform !== 'youtube') {
    res.status(400).json({ success: false, error: 'Only YouTube supported' });
    return;
  }

  const ytDlpPath = getYtDlpPath();
  if (!ytDlpPath) {
    res.status(500).json({ success: false, error: 'yt-dlp not found' });
    return;
  }

  const cookieArgs = await getCookieArgs(platform);
  const strategyArgs = [
    [...cookieArgs, ...getPlatformHeaders(platform), '--extractor-args', 'youtube:player_client=web_embedded;player_skip=webpage,js'],
    [...getPlatformHeaders(platform), '--extractor-args', 'youtube:player_client=android;player_skip=webpage,js'],
    [...getPlatformHeaders(platform), '--extractor-args', 'youtube:player_client=tv_embedded;player_skip=webpage,js'],
  ];

  // Find a working strategy first (using -g)
  let workingArgs: string[] | null = null;
  for (const args of strategyArgs) {
    const url = await runYtDlp(sourceUrl, args);
    if (url) { workingArgs = args; break; }
  }

  if (!workingArgs) {
    res.status(500).json({ success: false, error: 'No working strategy found' });
    return;
  }

  // Spawn with the working strategy
  try {
    const { spawn } = require('child_process');
    const args: string[] = [
      sourceUrl, '-o', '-', '--no-playlist',
      '--js-runtimes', `node:${process.execPath}`,
      '--geo-bypass', '--force-ipv4',
      '--no-check-certificate',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...workingArgs,
      '-f', 'best[ext=mp4]/best',
    ];

    const proc = spawn(ytDlpPath, args);

    proc.stderr.on('data', (data: Buffer) => {
      const s = data.toString();
      if (s.includes('ERROR')) console.error('yt-dlp proxy error:', s);
    });

    proc.on('error', (err: Error) => {
      console.error('Proxy spawn error:', err.message);
      if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
    });

    proc.on('close', (code: number | null) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ success: false, error: `yt-dlp exited code ${code}` });
      }
    });

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    proc.stdout.pipe(res);
  } catch (err: any) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) res.status(502).json({ success: false, error: err.message });
  }
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
