import { Router, Request, Response } from 'express';
import fs from 'fs';
import Video from '../models/Video';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, platform, format, page = '1', limit = '20', sort = '-createdAt', favorites } = req.query;
    const query: any = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (platform) query.platform = platform;
    if (format) {
      if (format === 'audio') {
        query.format = { $in: ['mp3', 'm4a'] };
      } else {
        query.format = format;
      }
    }
    if (favorites === 'true') query.isFavorite = true;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .sort(sort as string)
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate('playlist', 'name color');

    res.json({
      success: true,
      data: videos,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findById(req.params.id).populate('playlist', 'name color');
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }
    res.json({ success: true, data: video });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/play', async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    );
    res.json({ success: true, data: video });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/favorite', async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }
    video.isFavorite = !video.isFavorite;
    await video.save();
    res.json({ success: true, data: video });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    if (video.filePath) {
      if (fs.existsSync(video.filePath)) {
        fs.unlinkSync(video.filePath);
      }
    }

    await video.deleteOne();
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalVideos = await Video.countDocuments();
    const totalDownloaded = await Video.countDocuments({ isDownloaded: true });
    const favorites = await Video.countDocuments({ isFavorite: true });
    const platformStats = await Video.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: { totalVideos, totalDownloaded, favorites, platformStats }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
