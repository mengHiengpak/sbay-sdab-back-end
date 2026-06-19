'use client';

import { useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import API from '@/lib/api';

export default function TopBar() {
  const { state, dispatch, showToast, logout } = useApp();
  const { sidebarOpen, user } = state;
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!q || q.length < 2) {
      dispatch({ type: 'SET_LIBRARY', payload: [] });
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await API.get(`/videos?search=${encodeURIComponent(q)}&limit=20`);
        if (Array.isArray(res.data)) dispatch({ type: 'SET_LIBRARY', payload: res.data });
      } catch {}
    }, 400);
  }, [dispatch]);

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg-primary/60 backdrop-blur-xl relative z-50 max-md:px-4">
      <div className="flex items-center gap-3">
        <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="hidden max-md:flex w-9 h-9 items-center justify-center rounded-xl bg-none border border-border cursor-pointer text-text-secondary hover:bg-surface hover:text-text-primary transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="relative max-md:hidden">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" onChange={handleSearch} placeholder="Search..."
            className="w-[280px] pl-9 pr-3 py-2 bg-bg-input border border-border rounded-xl text-text-primary font-main text-[0.85rem] outline-none transition-all focus:border-accent-violet focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border cursor-pointer hover:border-accent-violet transition-all">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center text-white text-[0.7rem] font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-left max-md:hidden">
              <p className="text-[0.8rem] text-text-primary font-medium leading-tight">{user?.name || 'User'}</p>
              <p className="text-[0.65rem] text-text-muted leading-tight">{user?.email || ''}</p>
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-border rounded-2xl shadow-card py-2 z-500" onClick={() => setShowUserMenu(false)}>
              <div className="px-4 py-2 border-b border-border">
                <p className="text-[0.85rem] text-text-primary font-medium">{user?.name}</p>
                <p className="text-[0.7rem] text-text-muted">{user?.email}</p>
              </div>
              <Link href="/library" className="block px-4 py-2 text-[0.85rem] text-text-secondary hover:text-text-primary hover:bg-surface no-underline transition-all">Library</Link>
              <Link href="/favorites" className="block px-4 py-2 text-[0.85rem] text-text-secondary hover:text-text-primary hover:bg-surface no-underline transition-all">Favorites</Link>
              <button onClick={() => logout()}
                className="w-full text-left px-4 py-2 text-[0.85rem] text-red-400 hover:bg-surface cursor-pointer bg-none border-none transition-all">Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
