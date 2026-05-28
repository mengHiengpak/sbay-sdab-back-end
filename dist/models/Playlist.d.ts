import mongoose, { Document } from 'mongoose';
export interface IPlaylist extends Document {
    name: string;
    description: string;
    thumbnail: string;
    videos: mongoose.Types.ObjectId[];
    isPublic: boolean;
    color: string;
    videoCount: number;
}
declare const _default: mongoose.Model<IPlaylist, {}, {}, {}, mongoose.Document<unknown, {}, IPlaylist, {}, {}> & IPlaylist & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Playlist.d.ts.map