'use client';

import { useApp } from '@/context/AppContext';

export default function QueuePanel() {
  const { state, playVideo, dispatch } = useApp();
  const { showQueue, queue, queueIndex } = state;

  if (!showQueue) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[320px] bg-bg-primary/98 backdrop-blur-xl border-l border-border z-300 flex flex-col animate-slide-in-right max-md:w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-[0.95rem] font-semibold text-text-primary">Queue</h2>
        <button onClick={() => dispatch({ type: 'SET_SHOW_QUEUE', payload: false })}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-none border border-border cursor-pointer text-text-secondary hover:bg-surface transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {queue.map((video, i) => (
          <div key={video._id || i} onClick={() => { dispatch({ type: 'SET_QUEUE_INDEX', payload: i }); playVideo(queue[i], queue, i); }}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${i === queueIndex ? 'bg-accent-purple/15 border border-accent-purple/25' : 'hover:bg-surface'}`}>
            {video.thumbnail && (
              <img src={video.thumbnail} alt="" className="w-10 h-7 rounded-lg object-cover shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-[0.8rem] truncate ${i === queueIndex ? 'text-accent-violet font-medium' : 'text-text-primary'}`}>{video.title || 'Untitled'}</p>
              <p className="text-[0.65rem] text-text-muted truncate">{video.metadata?.author || ''}</p>
            </div>
            <span className="text-[0.65rem] text-text-muted">{video.durationFormatted || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
