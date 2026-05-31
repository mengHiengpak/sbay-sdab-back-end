'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import PlaylistCard from '@/components/PlaylistCard';
import type { Playlist } from '@/lib/types';

export default function PlaylistsPage() {
  const { dispatch, loadPlaylistsData, showModal, createPlaylist } = useApp();
  const [items, setItems] = useState<Playlist[]>([]);

  useEffect(() => {
    loadPlaylistsData().then((data: Playlist[]) => {
      setItems(data);
      dispatch({ type: 'SET_PLAYLISTS', payload: data });
    });
  }, [loadPlaylistsData, dispatch]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-7">
        <h1 className="font-serif text-[2rem] italic text-text-primary leading-[1.2]">Playlists</h1>
        <button onClick={() => {
          const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
          let selectedColor = colors[0];
          showModal(
            'បង្កើត Playlist ថ្មី',
            `<input type="text" id="pl-name" class="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all mb-3 focus:border-accent-violet" placeholder="ចម្រៀងខ្មែរ...">
            <div class="flex gap-2 flex-wrap" id="color-picker">
              ${colors.map(c => `<div class="color-dot" data-color="${c}" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c === colors[0] ? 'white' : 'transparent'};transition:all 0.2s"></div>`).join('')}
            </div>`,
            [{ label: 'Cancel', action: 'close' }, { label: 'បង្កើត', action: 'submit', class: 'btn-primary' }],
            (name: string) => createPlaylist(name, '', selectedColor)
          );
          setTimeout(() => {
            document.querySelectorAll('.color-dot').forEach(dot => {
              dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => (d as HTMLElement).style.borderColor = 'transparent');
                (dot as HTMLElement).style.borderColor = 'white';
                selectedColor = (dot as HTMLElement).dataset.color || colors[0];
              });
            });
          }, 0);
        }}
          className="px-4 py-2 bg-accent-violet text-white font-medium text-[0.85rem] rounded-xl border-none cursor-pointer hover:opacity-90 transition-all">
          + ថ្មី
        </button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-text-muted text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-40">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <p className="text-[0.9rem]">គ្មាន Playlist នៅឡើយទេ</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {items.map((pl) => (
            <PlaylistCard key={pl._id} playlist={pl} />
          ))}
        </div>
      )}
    </div>
  );
}
