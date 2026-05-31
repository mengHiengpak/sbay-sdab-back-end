'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { getDemoVideos } from '@/lib/utils';
import type { Video, Playlist, User, Toast, ModalData, ModalButton, DownloadEntry } from '@/lib/types';

interface AppState {
  user: User | null;
  isAuthLoading: boolean;
  currentVideoInfo: Record<string, unknown> | null;
  selectedFormat: Record<string, unknown> | null;
  library: any[];
  libraryPage: number;
  libraryFilter: string;
  playlists: Playlist[];
  queue: any[];
  queueIndex: number;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
  toasts: Toast[];
  modal: ModalData | null;
  showQueue: boolean;
  sidebarOpen: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  activeDownloads: Record<string, any>;
}

const initialState: AppState = {
  user: null,
  isAuthLoading: true,
  currentVideoInfo: null,
  selectedFormat: null,
  library: [],
  libraryPage: 1,
  libraryFilter: '',
  playlists: [],
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isShuffled: false,
  repeatMode: 'none',
  toasts: [],
  modal: null,
  showQueue: false,
  sidebarOpen: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  activeDownloads: {},
};

type Action =
  | { type: 'SET_CURRENT_VIDEO_INFO'; payload: Record<string, unknown> | null }
  | { type: 'SET_SELECTED_FORMAT'; payload: Record<string, unknown> | null }
  | { type: 'SET_QUEUE'; payload: any[] }
  | { type: 'SET_QUEUE_INDEX'; payload: number }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'CYCLE_REPEAT' }
  | { type: 'SET_LIBRARY'; payload: any[] }
  | { type: 'APPEND_LIBRARY'; payload: any[] }
  | { type: 'SET_LIBRARY_PAGE'; payload: number }
  | { type: 'SET_LIBRARY_FILTER'; payload: string }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'ADD_PLAYLIST'; payload: Playlist }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'UPDATE_TOAST'; payload: { id: string; data: Partial<Toast> } }
  | { type: 'SET_MODAL'; payload: ModalData | null }
  | { type: 'CLOSE_MODAL' }
  | { type: 'TOGGLE_QUEUE' }
  | { type: 'SET_SHOW_QUEUE'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'ADD_DOWNLOAD'; payload: { id: string; data: any } }
  | { type: 'REMOVE_DOWNLOAD'; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CURRENT_VIDEO_INFO':
      return { ...state, currentVideoInfo: action.payload };
    case 'SET_SELECTED_FORMAT':
      return { ...state, selectedFormat: action.payload };
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_QUEUE_INDEX':
      return { ...state, queueIndex: action.payload };
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled };
    case 'CYCLE_REPEAT': {
      const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
      const current = modes.indexOf(state.repeatMode);
      return { ...state, repeatMode: modes[(current + 1) % modes.length] };
    }
    case 'SET_LIBRARY':
      return { ...state, library: action.payload };
    case 'APPEND_LIBRARY':
      return { ...state, library: [...state.library, ...action.payload] };
    case 'SET_LIBRARY_PAGE':
      return { ...state, libraryPage: action.payload };
    case 'SET_LIBRARY_FILTER':
      return { ...state, libraryFilter: action.payload };
    case 'SET_PLAYLISTS':
      return { ...state, playlists: action.payload };
    case 'ADD_PLAYLIST':
      return { ...state, playlists: [...state.playlists, action.payload] };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'UPDATE_TOAST':
      return { ...state, toasts: state.toasts.map(t => t.id === action.payload.id ? { ...t, ...action.payload.data } : t) };
    case 'SET_MODAL':
      return { ...state, modal: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, modal: null };
    case 'TOGGLE_QUEUE':
      return { ...state, showQueue: !state.showQueue };
    case 'SET_SHOW_QUEUE':
      return { ...state, showQueue: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTH_LOADING':
      return { ...state, isAuthLoading: action.payload };
    case 'ADD_DOWNLOAD':
      return { ...state, activeDownloads: { ...state.activeDownloads, [action.payload.id]: action.payload.data } };
    case 'REMOVE_DOWNLOAD': {
      const { [action.payload]: _, ...rest } = state.activeDownloads;
      return { ...state, activeDownloads: rest };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  navigateTo: (page: string) => void;
  loadRecentVideos: () => Promise<any[]>;
  loadLibrary: (page?: number, filter?: string) => Promise<any>;
  loadFavorites: () => Promise<any[]>;
  loadPlaylistsData: () => Promise<any[]>;
  createPlaylist: (name: string, description: string, color: string) => Promise<boolean>;
  analyzeUrl: (url: string) => Promise<any>;
  startDownload: () => Promise<void>;
  playVideo: (video: any, queue?: any[], index?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  showToast: (type: string, title: string, subtitle?: string, progress?: number) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, data: Partial<Toast>) => void;
  showModal: (title: string, body: string, buttons: ModalButton[], onSubmit?: (name: string) => void) => void;
  closeModal: () => void;
  handleTimeUpdate: (time: number) => void;
  getActiveMedia: () => HTMLMediaElement | null;
  pollDownload: (downloadId: string, toastId: string, initialTitle?: string) => void;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
}

const AppContext = createContext<AppContextValue | null>(null);
let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeMediaRef = useRef<HTMLMediaElement | null>(null);
  const pollDownloadRef = useRef<(downloadId: string, toastId: string, initialTitle?: string) => void>(() => {});
  const playPrevRef = useRef<() => void>(() => {});
  const pollDownloadFnRef = useRef<() => void>(() => {});

  const navigateTo = useCallback((page: string) => {
    const path = page === 'home' ? '/' : `/${page}`;
    router.push(path);
    if (window.innerWidth <= 768) dispatch({ type: 'SET_SIDEBAR', payload: false });
  }, [router]);

  const loadRecentVideos = useCallback(async (): Promise<any[]> => {
    try { const res = await API.get('/videos?limit=8&sort=-createdAt'); return (res.data as any[]) || []; }
    catch { return getDemoVideos(); }
  }, []);

  const loadLibraryData = useCallback(async (page = 1, filter = '') => {
    try {
      const filterParam = filter && filter !== 'audio' ? `&platform=${filter}` : '';
      const formatParam = filter === 'audio' ? '&format=audio' : '';
      const res = await API.get(`/videos?page=${page}&limit=20${filterParam}${formatParam}`);
      return { data: (res.data as any[]) || [], pagination: res.pagination };
    } catch { return { data: getDemoVideos(), pagination: null }; }
  }, []);

  const loadFavorites = useCallback(async (): Promise<any[]> => {
    try { const res = await API.get('/videos?favorites=true'); return (res.data as any[]) || []; }
    catch { return getDemoVideos().filter(v => v.isFavorite); }
  }, []);

  const loadPlaylistsData = useCallback(async (): Promise<any[]> => {
    try { const res = await API.get('/playlists'); return (res.data as any[]) || []; }
    catch { return []; }
  }, []);

  const createPlaylist = useCallback(async (name: string, description: string, color: string) => {
    try {
      const res = await API.post('/playlists', { name, description, color });
      if (res.success) {
        dispatch({ type: 'ADD_PLAYLIST', payload: res.data as Playlist });
        showToastRef.current('success', 'Playlist បានបង្កើត', name);
        closeModal();
        return true;
      }
    } catch (err: any) { showToastRef.current('error', 'Error', err.message); }
    return false;
  }, []);

  const analyzeUrl = useCallback(async (url: string) => {
    if (!url) { showToastRef.current('error', 'Error', 'សូម​បញ្ចូល URL'); return null; }
    try {
      const token = API.getToken();
      const res = await API.post('/download/info', { url }, !!token);
      if (!res.success) throw new Error((res.error as string) || 'Failed');
      dispatch({ type: 'SET_CURRENT_VIDEO_INFO', payload: { ...(res.data as Record<string, unknown> || {}), sourceUrl: url } });
      dispatch({ type: 'SET_SELECTED_FORMAT', payload: (res.data as any)?.formats?.[0] || null });
      return res.data;
    } catch (err: any) {
      showToastRef.current('error', 'Error', 'មិនអាចវិភាគ URL បាន: ' + err.message);
      return null;
    }
  }, []);

  const showToastFn = useCallback((type: string, title: string, subtitle = '', progress?: number): string => {
    const id = `toast-${++toastCounter}`;
    dispatch({ type: 'ADD_TOAST', payload: { id, type, title, subtitle, progress } as Toast });
    if (type !== 'downloading') {
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
    }
    return id;
  }, []);

  const showToastRef = useRef(showToastFn);
  showToastRef.current = showToastFn;

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const updateToast = useCallback((id: string, data: Partial<Toast>) => {
    dispatch({ type: 'UPDATE_TOAST', payload: { id, data } });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const showModal = useCallback((title: string, body: string, buttons: any[], onSubmit?: (name: string) => void) => {
    dispatch({ type: 'SET_MODAL', payload: { title, body, buttons, onSubmit } });
  }, []);

  const startDownload = useCallback(async () => {
    const info = state.currentVideoInfo;
    if (!info) return;
    const fmt = state.selectedFormat || { id: 'best', ext: 'mp4', quality: '720p', type: 'video' };
    const toastId = showToastRef.current('downloading', (info.title as string)?.substring(0, 40), '0%', 0);
    try {
      const token = API.getToken();
      const res = await API.post('/download/start', {
        url: info.sourceUrl, formatId: fmt.id, quality: fmt.quality,
        ext: fmt.ext, title: info.title, thumbnail: info.thumbnail,
        duration: info.duration, durationFormatted: info.durationFormatted
      }, !!token);
      if (!res.success) throw new Error((res.error as string) || 'Download failed');
      const { downloadId } = res.data as any || {};
      if (!downloadId) throw new Error('Server did not return a download ID');
      dispatch({ type: 'ADD_DOWNLOAD', payload: { id: downloadId, data: { toastId, videoId: (res.data as any)?.videoId, title: info.title, status: 'starting', progress: 0 } } });
      pollDownloadRef.current(downloadId, toastId, info.title as string);
    } catch (err: any) { updateToast(toastId, { type: 'error', title: 'Download Failed', subtitle: err.message }); }
  }, [state.currentVideoInfo, state.selectedFormat, updateToast]);

  const pollDownload = useCallback((downloadId: string, toastId: string, initialTitle?: string) => {
    const interval = setInterval(async () => {
      try {
        const token = API.getToken();
        const res = await API.get(`/download/progress/${downloadId}`, !!token);
        const { status, progress, error } = res.data as any || {};
        updateToast(toastId, { subtitle: `${progress}%`, progress });
        const existing = state.activeDownloads[downloadId] as any || {};
        dispatch({ type: 'ADD_DOWNLOAD', payload: { id: downloadId, data: { ...existing, status, progress, title: existing.title || initialTitle } } });
        if (status === 'completed') {
          clearInterval(interval);
          updateToast(toastId, { type: 'success', title: 'ទាញ់យក​បាន​ជោគ​ជ័យ! ✓', subtitle: '' });
          setTimeout(() => { dispatch({ type: 'REMOVE_DOWNLOAD', payload: downloadId }); removeToast(toastId); }, 3000);
        } else if (status === 'error') {
          clearInterval(interval);
          updateToast(toastId, { type: 'error', title: 'Download Failed', subtitle: error || 'Unknown error' });
          dispatch({ type: 'REMOVE_DOWNLOAD', payload: downloadId });
        }
      } catch { clearInterval(interval); }
    }, 1500);
  }, [updateToast, removeToast, state.activeDownloads]);

  pollDownloadRef.current = pollDownload;

  const playVideo = useCallback((video: any, queue: any[] = [], index = 0) => {
    dispatch({ type: 'SET_QUEUE', payload: queue });
    dispatch({ type: 'SET_QUEUE_INDEX', payload: index });
    if (video.url && video.isDownloaded) {
      const media = audioRef.current;
      activeMediaRef.current = media;
      if (media) {
        media.src = video.url;
        media.play().catch(() => {});
      }
      dispatch({ type: 'SET_IS_PLAYING', payload: true });
    }
  }, []);

  const togglePlay = useCallback(() => {
    const media = activeMediaRef.current;
    if (!media) return;
    if (media.paused) { media.play().catch(() => {}); dispatch({ type: 'SET_IS_PLAYING', payload: true }); }
    else { media.pause(); dispatch({ type: 'SET_IS_PLAYING', payload: false }); }
  }, []);

  const playNext = useCallback(() => {
    const { queue, queueIndex, repeatMode, isShuffled } = state;
    if (!queue.length) return;
    let next = queueIndex + 1;
    if (next >= queue.length) {
      if (repeatMode === 'all') next = 0;
      else return;
    }
    playVideo(queue[next], queue, next);
  }, [state.queue, state.queueIndex, state.repeatMode, state.isShuffled, playVideo]);

  const playPrev = useCallback(() => {
    const { queue, queueIndex, repeatMode, isShuffled } = state;
    if (!queue.length) return;
    let prev = queueIndex - 1;
    if (prev < 0) {
      if (repeatMode === 'all') prev = queue.length - 1;
      else return;
    }
    playVideo(queue[prev], queue, prev);
  }, [state.queue, state.queueIndex, state.repeatMode, state.isShuffled, playVideo]);

  playPrevRef.current = playPrev;

  const handleTimeUpdate = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);

  const getActiveMedia = useCallback(() => activeMediaRef.current, []);

  const setupMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevRef.current());
    }
  }, []);

  useEffect(() => { setupMediaSession(); }, [setupMediaSession]);

  const checkAuth = useCallback(async () => {
    const token = API.getToken();
    if (!token) {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      return;
    }
    try {
      const res = await API.getMe();
      if (res.user) {
        dispatch({ type: 'SET_USER', payload: res.user as unknown as User });
      } else {
        API.setToken(null);
      }
    } catch {
      API.setToken(null);
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await API.login(email, password);
    if (res.token && res.user) {
dispatch({ type: 'SET_USER', payload: res.user as unknown as User });
    }
    return res;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await API.register(name, email, password);
    if (res.token && res.user) {
      dispatch({ type: 'SET_USER', payload: res.user as unknown as User });
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    await API.logout();
    dispatch({ type: 'SET_USER', payload: null });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    return API.forgotPassword(email);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AppContextValue = {
    state, dispatch, audioRef, videoRef, navigateTo,
    loadRecentVideos, loadLibrary: loadLibraryData, loadFavorites,
    loadPlaylistsData, createPlaylist, analyzeUrl, startDownload,
    playVideo, togglePlay, playNext, playPrev,
    showToast: showToastFn, removeToast, updateToast, showModal, closeModal,
    handleTimeUpdate, getActiveMedia, pollDownload,
    checkAuth, login, register, logout, forgotPassword,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
