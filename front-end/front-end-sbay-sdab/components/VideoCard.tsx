'use client';

export default function VideoCard({ video, onClick, onPlay, onFavorite, onDelete }: {
  video: any;
  onClick: () => void;
  onPlay: (e: React.MouseEvent) => void;
  onFavorite: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClick={onClick}
      className="group relative bg-bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer transition-all duration-200 hover:bg-bg-card-hover hover:border-accent-purple/30 hover:shadow-glow active:scale-[0.98]">
      <div className="relative aspect-video bg-bg-secondary overflow-hidden">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-accent-violet/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </div>
        {video.platform && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[0.65rem] font-medium backdrop-blur-sm">
            {video.platform}
          </span>
        )}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[0.65rem] font-medium backdrop-blur-sm">
          {video.durationFormatted || '0:00'}
        </span>
        {video.isFavorite && (
          <svg viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="2" className="w-4 h-4 absolute top-2 right-2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-[0.85rem] text-text-primary font-medium leading-snug line-clamp-2 mb-1">{video.title || 'Untitled'}</h3>
        {video.metadata?.author && (
          <p className="text-[0.7rem] text-text-muted truncate">{video.metadata.author}</p>
        )}
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={onPlay}
          className="w-7 h-7 rounded-full bg-accent-violet flex items-center justify-center cursor-pointer border-none hover:scale-110 transition-all">
          <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        </button>
        <button onClick={onFavorite}
          className="w-7 h-7 rounded-full bg-surface flex items-center justify-center cursor-pointer border-none hover:scale-110 transition-all">
          <svg viewBox="0 0 24 24" fill={video.isFavorite ? '#ec4899' : 'none'} stroke={video.isFavorite ? '#ec4899' : '#8884a8'} strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
        <button onClick={onDelete}
          className="w-7 h-7 rounded-full bg-surface flex items-center justify-center cursor-pointer border-none hover:scale-110 hover:text-red-400 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
