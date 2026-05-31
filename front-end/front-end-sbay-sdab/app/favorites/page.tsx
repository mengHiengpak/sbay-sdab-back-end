'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import VideoGrid from '@/components/VideoGrid';
import type { Video } from '@/lib/types';

export default function FavoritesPage() {
  const { loadFavorites, playVideo, showToast } = useApp();
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => { loadFavorites().then(setVideos); }, [loadFavorites]);

  const handlePlayVideo = (video: Video, queue: Video[], index: number) => {
    if (!video.url || !video.isDownloaded) { showToast('error', 'Play Error', 'Video មិនទាន់ download ទេ'); return; }
    playVideo(video, queue, index);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h1 className="font-serif text-[2rem] italic text-text-primary leading-[1.2]">សំណព្វ</h1>
        <p className="text-text-secondary text-[0.875rem] mt-1">Video ដែលអ្នកចូលចិត្ត</p>
      </div>
      <VideoGrid videos={videos} onPlayVideo={handlePlayVideo} />
    </div>
  );
}
