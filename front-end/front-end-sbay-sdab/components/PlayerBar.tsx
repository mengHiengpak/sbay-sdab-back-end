'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

export default function PlayerBar() {
  const { state, dispatch, audioRef, videoRef, togglePlay, playNext, handleTimeUpdate } = useApp();
  const { queue, queueIndex, isPlaying, currentTime, duration, volume, isMuted, repeatMode, isShuffled } = state;
  const currentVideo = queue[queueIndex];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const audio = audioRef.current || new Audio();
    if (!audioRef.current) audioRef.current = audio as HTMLAudioElement;

    const onTimeUpdate = () => handleTimeUpdate(audio.currentTime);
    const onLoadedMetadata = () => dispatch({ type: 'SET_DURATION', payload: audio.duration });
    const onEnded = () => {
      if (repeatMode === 'one') { audio.currentTime = 0; audio.play(); }
      else playNext();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [handleTimeUpdate, repeatMode, playNext, dispatch, audioRef]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted, audioRef]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    dispatch({ type: 'SET_CURRENT_TIME', payload: t });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentVideo) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur-xl border-t border-border px-5 py-2.5 z-200 flex items-center gap-4 max-md:px-3 max-md:flex-col max-md:gap-2">
      <div className="flex items-center gap-3 min-w-0 w-[220px] max-md:w-full">
        {currentVideo.thumbnail && (
          <img src={currentVideo.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        )}
        <div className="min-w-0 truncate">
          <p className="text-[0.8rem] text-text-primary truncate font-medium">{currentVideo.title || ''}</p>
          <p className="text-[0.65rem] text-text-muted truncate">{currentVideo.metadata?.author || ''}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-1 max-md:w-full max-md:flex-col max-md:gap-1">
        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
            className={`bg-none border-none cursor-pointer p-1 transition-all ${isShuffled ? 'text-accent-violet' : 'text-text-muted hover:text-text-secondary'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
          <button onClick={() => playNext()}
            className="bg-none border-none cursor-pointer p-1 text-text-secondary hover:text-text-primary transition-all rotate-180">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 18V6l8 6-8 6zM18 6v12h-2V6h2z" /></svg>
          </button>
          <button onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center cursor-pointer border-none hover:scale-105 transition-all">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="#0a0a0f" className="w-4 h-4"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="#0a0a0f" className="w-4 h-4 ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
          </button>
          <button onClick={() => playNext()}
            className="bg-none border-none cursor-pointer p-1 text-text-secondary hover:text-text-primary transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 18V6l8 6-8 6zM18 6v12h-2V6h2z" /></svg>
          </button>
          <button onClick={() => dispatch({ type: 'CYCLE_REPEAT' })}
            className={`bg-none border-none cursor-pointer p-1 transition-all ${repeatMode !== 'none' ? 'text-accent-violet' : 'text-text-muted hover:text-text-secondary'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
            {repeatMode === 'one' && <span className="text-[0.5rem] absolute">1</span>}
          </button>
        </div>
        <div className="flex items-center gap-2 flex-1 max-md:w-full">
          <span className="text-[0.7rem] text-text-muted w-8 text-right">{formatTime(currentTime)}</span>
          <input type="range" min={0} max={duration || 100} value={currentTime} onChange={seek}
            className="flex-1" />
          <span className="text-[0.7rem] text-text-muted w-8">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-[140px] justify-end max-md:w-full max-md:justify-center">
        <button onClick={() => dispatch({ type: 'SET_MUTED', payload: !isMuted })}
          className="bg-none border-none cursor-pointer p-1 text-text-muted hover:text-text-secondary transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            {isMuted ? (
              <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
            ) : (
              <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></>
            )}
          </svg>
        </button>
        <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={(e) => dispatch({ type: 'SET_VOLUME', payload: parseFloat(e.target.value) })}
          className="w-20 max-md:w-16" />
      </div>
    </div>
  );
}
