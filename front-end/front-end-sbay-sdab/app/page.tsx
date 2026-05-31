'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import DownloadCard from '@/components/DownloadCard';
import VideoGrid from '@/components/VideoGrid';
import Link from 'next/link';
import type { Video } from '@/lib/types';

export default function HomePage() {
  const { loadRecentVideos, playVideo, showToast } = useApp();
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);

  useEffect(() => { loadRecentVideos().then(setRecentVideos); }, [loadRecentVideos]);

  const handlePlayVideo = (video: Video, queue: Video[], index: number) => {
    if (!video.url || !video.isDownloaded) { showToast('error', 'Play Error', 'Video មិនទាន់ download ទេ'); return; }
    playVideo(video, queue, index);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-serif text-[2rem] italic text-text-primary leading-[1.2]">ទំព័រដើម</h1>
        <p className="text-text-secondary text-[0.875rem] mt-1">ទាញ់យក និង Play Video/Music ពី Platform ទាំងអស់</p>
      </div>
      <DownloadCard />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[1.1rem] font-semibold text-text-primary">ទាញ់យកថ្មីៗ</h2>
        <Link href="/library" className="text-[0.8rem] text-accent-violet no-underline hover:opacity-80 transition-opacity">មើលទាំងអស់</Link>
      </div>
      <VideoGrid videos={recentVideos} onPlayVideo={handlePlayVideo} />
    </div>
  );
}
