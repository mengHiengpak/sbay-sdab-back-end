'use client';

import { useApp } from '@/context/AppContext';
import type { Playlist } from '@/lib/types';

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { showModal } = useApp();

  return (
    <div onClick={() => showModal('', '', [])}
      className="group bg-bg-card rounded-2xl overflow-hidden border border-border/50 cursor-pointer transition-all duration-200 hover:bg-bg-card-hover hover:border-accent-purple/30 hover:shadow-glow active:scale-[0.98] p-4">
      <div className="w-full aspect-video rounded-xl mb-3 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${playlist.color || '#7c3aed'}33, ${playlist.color || '#7c3aed'}11)` }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={playlist.color || '#7c3aed'} strokeWidth="1.5" className="w-12 h-12 opacity-60">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <h3 className="text-[0.9rem] text-text-primary font-medium truncate">{playlist.name}</h3>
      <p className="text-[0.7rem] text-text-muted mt-0.5">{playlist.videoCount || 0} videos</p>
    </div>
  );
}
