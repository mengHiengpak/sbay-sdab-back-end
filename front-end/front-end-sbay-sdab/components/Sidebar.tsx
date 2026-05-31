'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { escapeHtml } from '@/lib/utils';
import { ReactNode } from 'react';
import type { Playlist } from '@/lib/types';

interface NavItem {
  page: string;
  path: string;
  label: string;
  svg: ReactNode;
}

const navItems: NavItem[] = [
  { page: 'home', path: '/', label: 'ទំព័រដើម', svg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )},
  { page: 'library', path: '/library', label: 'បណ្ណាល័យ', svg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" />
    </svg>
  )},
  { page: 'playlists', path: '/playlists', label: 'Playlist', svg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )},
  { page: 'favorites', path: '/favorites', label: 'សំណព្វ', svg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )},
  { page: 'downloads', path: '/downloads', label: 'ទាញ់យក', svg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )},
];

export default function Sidebar() {
  const { state, showModal, createPlaylist, dispatch, logout } = useApp();
  const { playlists, sidebarOpen, user } = state;
  const pathname = usePathname();
  const router = useRouter();

  const showCreatePlaylistModal = () => {
    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
    let selectedColor = colors[0];
    showModal(
      'បង្កើត Playlist ថ្មី',
      `<label class="block text-[0.8rem] text-text-secondary mb-1.5">ឈ្មោះ Playlist</label>
      <input type="text" id="pl-name" class="w-full px-3.5 py-2.5 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.9rem] outline-none transition-all mb-3 focus:border-accent-violet" placeholder="ចម្រៀងខ្មែរ...">
      <label class="block text-[0.8rem] text-text-secondary mb-1.5">ពណ៌</label>
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
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className={`w-[240px] min-w-[240px] bg-bg-primary/90 backdrop-blur-xl border-r border-border flex flex-col gap-2 px-3 py-5 overflow-y-auto z-100 relative transition-transform duration-[0.25s] ${sidebarOpen ? 'max-md:translate-x-0 translate-x-0' : ''} max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-400 max-md:bg-bg-primary max-md:-translate-x-full`}>
      <div className="flex items-center gap-2.5 px-2 pb-4 border-b border-border mb-2">
        <div className="w-9 h-9 shrink-0">
          <svg viewBox="0 0 36 36" fill="none" className="w-full h-full">
            <circle cx="18" cy="18" r="17" stroke="url(#lg1)" strokeWidth="2" />
            <path d="M14 12l12 6-12 6V12z" fill="url(#lg2)" />
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient>
              <linearGradient id="lg2" x1="14" y1="12" x2="26" y2="24"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient>
            </defs>
          </svg>
        </div>
        <span className="font-serif text-[1.3rem] italic" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sbay Sdab</span>
      </div>

      <div className="flex flex-col gap-[2px]">
        <span className="text-[0.65rem] tracking-[0.12em] text-text-muted px-3 pt-2 pb-1 font-semibold">MENU</span>
        {navItems.map((item) => (
          <Link key={item.page} href={item.path} onClick={() => { if (window.innerWidth <= 768) dispatch({ type: 'SET_SIDEBAR', payload: false }); }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium no-underline cursor-pointer transition-all ${isActive(item.path) ? 'bg-gradient-to-r from-accent-purple/20 to-accent-cyan/10 text-text-primary border border-accent-purple/25' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}>
            {item.svg}<span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-[2px] flex-1 overflow-hidden">
        <span className="text-[0.65rem] tracking-[0.12em] text-text-muted px-3 pt-2 pb-1 font-semibold">PLAYLISTS</span>
        <div className="flex flex-col gap-[2px] max-h-[200px] overflow-y-auto">
          {playlists.map((pl: Playlist) => (
            <div key={pl._id} onClick={() => router.push('/playlists')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.8rem] text-text-secondary cursor-pointer transition-all hover:bg-surface hover:text-text-primary">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: pl.color || '#7c3aed' }} />
              <span>{escapeHtml(pl.name)}</span>
            </div>
          ))}
        </div>
        <button onClick={showCreatePlaylistModal}
          className="flex items-center gap-2 px-3 py-2 bg-none border border-dashed border-border rounded-xl text-text-muted text-[0.8rem] cursor-pointer w-full mt-2 transition-all hover:border-accent-violet hover:text-accent-violet font-main">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Playlist ថ្មី</span>
        </button>
      </div>
      <div className="flex flex-col gap-[2px] mt-auto pt-3 border-t border-border">
        <Link href="/cookies" onClick={() => { if (window.innerWidth <= 768) dispatch({ type: 'SET_SIDEBAR', payload: false }); }}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium no-underline cursor-pointer transition-all ${pathname === '/cookies' ? 'bg-gradient-to-r from-accent-purple/20 to-accent-cyan/10 text-text-primary border border-accent-purple/25' : 'text-text-secondary hover:bg-surface hover:text-text-primary'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          <span>Cookies</span>
        </Link>
        {user ? (
          <button onClick={async () => { await logout(); router.push('/'); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium text-text-secondary bg-none border-none cursor-pointer transition-all hover:bg-surface hover:text-red-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>ចាកចេញ</span>
          </button>
        ) : (
          <Link href="/login" onClick={() => { if (window.innerWidth <= 768) dispatch({ type: 'SET_SIDEBAR', payload: false }); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[0.875rem] font-medium no-underline cursor-pointer transition-all text-text-secondary hover:bg-surface hover:text-text-primary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>ចូលគណនី</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
