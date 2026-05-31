'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import AmbientBg from '@/components/AmbientBg';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PlayerBar from '@/components/PlayerBar';
import Modal from '@/components/Modal';
import ToastContainer from '@/components/Toast';
import QueuePanel from '@/components/QueuePanel';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

function LayoutContent({ children }: { children: ReactNode }) {
  const { state, dispatch, loadPlaylistsData } = useApp();
  const { sidebarOpen, user, isAuthLoading } = state;
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!isAuthLoading && !user && !isPublic) {
      router.push('/login');
    }
  }, [isAuthLoading, user, isPublic, router]);

  useEffect(() => {
    loadPlaylistsData().then((data: any[]) => {
      if (data.length > 0) dispatch({ type: 'SET_PLAYLISTS', payload: data });
    });
  }, [loadPlaylistsData, dispatch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (window.innerWidth <= 768 && sidebarOpen) {
        const sidebar = document.querySelector('nav');
        const toggle = document.querySelector('header button');
        if (sidebar && toggle && !sidebar.contains(e.target as Node) && !toggle.contains(e.target as Node)) {
          dispatch({ type: 'SET_SIDEBAR', payload: false });
        }
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [sidebarOpen, dispatch]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-6 h-6 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPublic) {
    return (
      <>
        <AmbientBg />
        <main className="flex-1 flex flex-col overflow-hidden relative z-10 min-h-screen">
          {children}
        </main>
        <Modal />
        <ToastContainer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <AmbientBg />
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-7 pb-[calc(88px+28px)] max-md:px-4">
          {children}
        </div>
      </main>
      <PlayerBar />
      <Modal />
      <ToastContainer />
      <QueuePanel />
    </>
  );
}

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <LayoutContent>{children}</LayoutContent>
    </AppProvider>
  );
}
