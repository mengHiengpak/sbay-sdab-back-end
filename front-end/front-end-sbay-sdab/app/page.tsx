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
    if (!video.url) { showToast('error', 'Play Error', 'Video URL not available'); return; }
    playVideo(video, queue, index);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-serif text-[2rem] italic text-text-primary leading-[1.2]">Home</h1>
        <p className="text-text-secondary text-[0.875rem] mt-1">Stream Videos & Music from YouTube</p>
      </div>
      <DownloadCard />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[1.1rem] font-semibold text-text-primary">Recent Videos</h2>
        <Link href="/library" className="text-[0.8rem] text-accent-violet no-underline hover:opacity-80 transition-opacity">View All</Link>
      </div>
      <VideoGrid videos={recentVideos} onPlayVideo={handlePlayVideo} />
    </div>
  );
}
