'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import VideoGrid from '@/components/VideoGrid';
import type { Video } from '@/lib/types';

export default function LibraryPage() {
  const { state, dispatch, loadLibrary, playVideo, showToast } = useApp();
  const { libraryFilter } = state;
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    initialLoadDone.current = false;
    setVideos([]);
    setPage(1);
    loadLibrary(1, libraryFilter).then((res: { data: Video[]; pagination: any }) => {
      setVideos(res.data);
      setHasMore(res.pagination?.pages > 1);
      initialLoadDone.current = true;
    });
  }, [libraryFilter, loadLibrary]);

  const handleFavorite = (video: Video) => {
    setVideos((prev) => prev.map((v) => v._id === video._id ? { ...v, isFavorite: !v.isFavorite } : v));
  };

  const handleDelete = (video: Video) => {
    setVideos((prev) => prev.filter((v) => v._id !== video._id));
  };

  const handleFilter = (filter: string) => {
    dispatch({ type: 'SET_LIBRARY_FILTER', payload: filter });
  };

  const handleLoadMore = async () => {
    const next = page + 1;
    const res = await loadLibrary(next, libraryFilter);
    if (res.data.length > 0) {
      setVideos((prev) => [...prev, ...res.data]);
      setPage(next);
      if (next >= (res.pagination?.pages || 1)) setHasMore(false);
    }
  };

  const handlePlayVideo = (video: Video, queue: Video[], index: number) => {
    if (!video.url || !video.isDownloaded) { showToast('error', 'Play Error', 'Video មិនទាន់ download ទេ'); return; }
    playVideo(video, queue, index);
  };

  const filters = [
    { label: 'ទាំងអស់', value: '' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'Facebook', value: 'facebook' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'Audio', value: 'audio' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
        <h1 className="font-serif text-[2rem] italic text-text-primary leading-[1.2]">បណ្ណាល័យ</h1>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button key={f.value} onClick={() => handleFilter(f.value)}
              className={`px-4 py-1.5 rounded-full font-main text-[0.8rem] cursor-pointer transition-all border ${libraryFilter === f.value ? 'bg-accent-purple/15 border-accent-violet text-accent-violet' : 'bg-surface border-border text-text-secondary hover:border-accent-violet hover:text-text-primary'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <VideoGrid videos={videos} onPlayVideo={handlePlayVideo} onFavorite={handleFavorite} onDelete={handleDelete} />
      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={handleLoadMore} className="px-8 py-2.5 bg-surface border border-border rounded-xl text-text-secondary font-main text-[0.875rem] cursor-pointer transition-all hover:border-accent-violet hover:text-text-primary block mx-auto">Load More</button>
        </div>
      )}
    </div>
  );
}
