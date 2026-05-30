import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const MAX_SIZE = 10 * 1024 * 1024;

export function getFfmpegPath(): string {
  const localPath = path.join(__dirname, '..', 'bin', 'ffmpeg.exe');
  if (fs.existsSync(localPath)) return localPath;
  const localLinux = path.join(__dirname, '..', 'bin', 'ffmpeg');
  if (fs.existsSync(localLinux)) return localLinux;
  return 'ffmpeg';
}

export function setFfmpegPath(binPath: string): void {
  ffmpeg.setFfmpegPath(binPath);
}

function getTargetBitrate(currentSize: number, durationSec: number): number {
  if (durationSec <= 0) return 500;
  const targetBytes = MAX_SIZE * 0.8;
  return Math.floor((targetBytes * 8) / durationSec);
}

function compressVideo(input: string, output: string, durationSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const bitrate = getTargetBitrate(fs.statSync(input).size, durationSec);
    const maxrate = Math.floor(bitrate * 1.2);
    const bufsize = Math.floor(bitrate * 2);

    ffmpeg(input)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        `-b:v ${bitrate}`,
        `-maxrate ${maxrate}`,
        `-bufsize ${bufsize}`,
        '-preset medium',
        '-movflags +faststart',
        '-profile:v main',
        '-level 3.1',
      ])
      .output(output)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

function compressAudio(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .audioCodec('libmp3lame')
      .audioBitrate(64)
      .output(output)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

export async function compressIfNeeded(filePath: string): Promise<boolean> {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size <= MAX_SIZE) return false;

    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, ext);
    const tempPath = path.join(dir, `${baseName}_compressed${ext}`);

    if (ext === '.mp4') {
      const probe = await probeDuration(filePath);
      await compressVideo(filePath, tempPath, probe);
    } else if (ext === '.mp3') {
      await compressAudio(filePath, tempPath);
    } else {
      return false;
    }

    if (!fs.existsSync(tempPath)) return false;

    const compressedStats = fs.statSync(tempPath);
    if (compressedStats.size < stats.size) {
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      return true;
    }

    fs.unlinkSync(tempPath);
    return false;
  } catch (err) {
    console.error('Compression error:', err);
    return false;
  }
}

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const dur = data.format?.duration || 0;
      resolve(dur);
    });
  });
}
