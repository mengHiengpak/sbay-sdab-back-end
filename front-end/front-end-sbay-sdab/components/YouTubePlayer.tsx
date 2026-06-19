'use client';

import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function YouTubePlayer() {
  const { state, dispatch } = useApp();
  const { youtubeVideoId } = state;

  useEffect(() => {
    if (!youtubeVideoId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'SET_YOUTUBE_VIDEO_ID', payload: null });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [youtubeVideoId, dispatch]);

  if (!youtubeVideoId) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={() => dispatch({ type: 'SET_YOUTUBE_VIDEO_ID', payload: null })}>
      <div className="relative w-full max-w-4xl aspect-video mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={() => dispatch({ type: 'SET_YOUTUBE_VIDEO_ID', payload: null })}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm cursor-pointer bg-none border-none">
          Close [Esc]
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
          className="w-full h-full rounded-2xl"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
