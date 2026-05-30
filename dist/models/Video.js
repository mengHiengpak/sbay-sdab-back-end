"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const videoSchema = new mongoose_1.Schema({
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
        enum: ['mp4', 'mp3', 'webm', 'mkv', 'm4a'],
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
        type: mongoose_1.Schema.Types.ObjectId,
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
videoSchema.virtual('formattedSize').get(function () {
    if (this.fileSize === 0)
        return '0 MB';
    const mb = this.fileSize / (1024 * 1024);
    if (mb < 1)
        return `${(this.fileSize / 1024).toFixed(1)} KB`;
    if (mb > 1024)
        return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
});
exports.default = mongoose_1.default.model('Video', videoSchema);
//# sourceMappingURL=Video.js.map