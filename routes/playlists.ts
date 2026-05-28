import { Router, Request, Response } from 'express';
import Playlist from '../models/Playlist';
import Video from '../models/Video';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const playlists = await Playlist.find()
      .populate('videos', 'title thumbnail duration durationFormatted')
      .sort('-createdAt');
    res.json({ success: true, data: playlists });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('videos');
    if (!playlist) {
      res.status(404).json({ success: false, error: 'Playlist not found' });
      return;
    }
    res.json({ success: true, data: playlist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }

    const playlist = await Playlist.create({ name, description, color });
    res.status(201).json({ success: true, data: playlist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/add-video', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.body;
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { videos: videoId } },
      { new: true }
    );
    await Video.findByIdAndUpdate(videoId, { playlist: req.params.id });
    res.json({ success: true, data: playlist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:id/remove-video', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoId } = req.body;
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $pull: { videos: videoId } },
      { new: true }
    );
    await Video.findByIdAndUpdate(videoId, { playlist: null });
    res.json({ success: true, data: playlist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    await Video.updateMany({ playlist: req.params.id }, { playlist: null });
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
