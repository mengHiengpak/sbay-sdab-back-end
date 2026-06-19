export interface Format {
  id: string;
  ext: string;
  quality: string;
  type: string;
  filesizeFormatted?: string;
}

export interface Video {
  _id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  platform: string;
  format: string;
  url: string;
  isFavorite: boolean;
  isDownloaded?: boolean;
  playCount: number;
  metadata: { author?: string };
  sourceUrl?: string;
  formats?: Format[];
  author?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  color?: string;
  videoCount?: number;
  videos?: Video[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}


export interface Toast {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  progress?: number;
}

export interface ModalButton {
  label: string;
  action: string;
  class?: string;
}

export interface ModalData {
  title: string;
  body: string;
  buttons: ModalButton[];
  onSubmit?: (name: string) => void;
}

export interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
}
