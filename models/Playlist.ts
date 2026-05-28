import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaylist extends Document {
  name: string;
  description: string;
  thumbnail: string;
  videos: mongoose.Types.ObjectId[];
  isPublic: boolean;
  color: string;
  videoCount: number;
}

const playlistSchema = new Schema<IPlaylist>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  videos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#6366f1'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

playlistSchema.virtual('videoCount').get(function (this: IPlaylist) {
  return this.videos ? this.videos.length : 0;
});

export default mongoose.model<IPlaylist>('Playlist', playlistSchema);
