import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IVideo, {}, {}, {}, mongoose.Document<unknown, {}, IVideo, {}, {}> & IVideo & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Video.d.ts.map