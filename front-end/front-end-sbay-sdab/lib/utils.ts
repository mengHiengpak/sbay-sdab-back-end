export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getDemoVideos(): any[] {
  const platforms = ['youtube', 'facebook', 'tiktok', 'instagram'];
  return Array.from({ length: 6 }, (_, i) => ({
    _id: `demo-${i}`,
    title: `Video from ${platforms[i % platforms.length]}`,
    thumbnail: `https://picsum.photos/seed/${i}/320/180`,
    duration: 180 + i * 30,
    durationFormatted: formatDuration(180 + i * 30),
    platform: platforms[i % platforms.length],
    format: 'mp4',
    url: '',
    isFavorite: i % 3 === 0,
    playCount: Math.floor(Math.random() * 1000),
    metadata: { author: ['Artist A', 'Artist B', 'Artist C'][i % 3] },
    isDownloaded: false,
  }));
}
