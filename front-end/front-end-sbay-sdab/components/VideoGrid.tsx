'use client';

import { useApp } from '@/context/AppContext';
import API from '@/lib/api';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: any[];
  onPlayVideo?: (video: any, queue: any[], index: number) => void;
  onFavorite?: (video: any) => void;
  onDelete?: (video: any) => void;
}

export default function VideoGrid({ videos, onPlayVideo, onFavorite, onDelete }: VideoGridProps) {
  const { showToast } = useApp();

  const handleFavorite = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    try {
      const res = await API.patch(`/videos/${video._id}/favorite`);
      if (res.success) {
        showToast('success', video.isFavorite ? 'Removed from Favorites' : 'Added to Favorites', video.title?.substring(0, 40));
        onFavorite?.(video);
      }
    } catch { showToast('error', 'Error', 'Cannot modify'); }
  };

  const handleDelete = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    try {
      const res = await API.delete(`/videos/${video._id}`);
      if (res.success) {
        showToast('success', 'Deleted', video.title?.substring(0, 40));
        onDelete?.(video);
      }
    } catch { showToast('error', 'Error', 'Cannot delete'); }
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 px-6 text-text-muted text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-40">
          <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <p className="text-[0.9rem]">No videos yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {videos.map((video, i) => (
        <VideoCard key={video._id || i} video={video}
          onClick={() => onPlayVideo?.(video, videos, i)}
          onPlay={(e: React.MouseEvent) => { e.stopPropagation(); onPlayVideo?.(video, videos, i); }}
          onFavorite={(e: React.MouseEvent) => handleFavorite(e, video)}
          onDelete={(e: React.MouseEvent) => handleDelete(e, video)} />
      ))}
    </div>
  );
}
