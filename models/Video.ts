import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoMetadata {
  author?: string;
  description?: string;
  uploadDate?: string;
  viewCount?: number;
  likeCount?: number;
}

export interface IVideo extends Document {
  title: string;
  url: string;
  sourceUrl: string;
  platform: 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'twitter' | 'vimeo' | 'other';
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  fileSize: number;
  fileSizeFormatted: string;
  quality: string;
  format: 'mp4' | 'mp3' | 'webm' | 'mkv';
  filePath: string;
  isDownloaded: boolean;
  downloadProgress: number;
  playCount: number;
  isFavorite: boolean;
  tags: string[];
  playlist: mongoose.Types.ObjectId | null;
  metadata: IVideoMetadata;
  formattedSize: string;
}

const videoSchema = new Schema<IVideo>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  sourceUrl: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'facebook', 'tiktok', 'instagram', 'twitter', 'vimeo', 'other'],
    default: 'other'
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  durationFormatted: {
    type: String,
    default: '0:00'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  fileSizeFormatted: {
    type: String,
    default: '0 MB'
  },
  quality: {
    type: String,
    default: '720p'
  },
  format: {
    type: String,
    enum: ['mp4', 'mp3', 'webm', 'mkv'],
    default: 'mp4'
  },
  filePath: {
    type: String,
    default: ''
  },
  isDownloaded: {
    type: Boolean,
    default: false
  },
  downloadProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  playCount: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  playlist: {
    type: Schema.Types.ObjectId,
    ref: 'Playlist',
    default: null
  },
  metadata: {
    author: String,
    description: String,
    uploadDate: String,
    viewCount: Number,
    likeCount: Number
  }
}, {
  timestamps: true
});

videoSchema.index({ title: 'text', 'metadata.author': 'text' });
videoSchema.index({ platform: 1, createdAt: -1 });
videoSchema.index({ isFavorite: 1 });

videoSchema.virtual('formattedSize').get(function (this: IVideo) {
  if (this.fileSize === 0) return '0 MB';
  const mb = this.fileSize / (1024 * 1024);
  if (mb < 1) return `${(this.fileSize / 1024).toFixed(1)} KB`;
  if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(2)} MB`;
});

export default mongoose.model<IVideo>('Video', videoSchema);
