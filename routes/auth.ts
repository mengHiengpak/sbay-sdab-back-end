import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import auth from '../middleware/auth';

const router = Router();

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
};

const sendResetEmail = (email: string, token: string): void | Promise<void> => {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`\n🔑 Password reset token for ${email}: ${token}\n`);
    return;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT as string) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password/${token}`;

  return transporter.sendMail({
    from: `"StreamVault" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p>
           <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
           <p>This link expires in 1 hour.</p>
           <p>If you did not request this, please ignore this email.</p>`
  });
};

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email: (email as string).toLowerCase() });
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      email: (email as string).toLowerCase(),
      password,
      name
    });
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: (email as string).toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password as string);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, phone: user.phone }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});



router.post('/logout', auth, async (req: Request, res: Response): Promise<void> => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  res.json({ user: { id: req.user!._id, email: req.user!.email, name: req.user!.name, phone: req.user!.phone } });
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: (email as string).toLowerCase() });
    if (!user) {
      res.json({ message: 'If that email is registered, a reset link has been sent' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await sendResetEmail(user.email, resetToken);

    res.json({ message: 'If that email is registered, a reset link has been sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if ((password as string).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token as string).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    user.password = password as string;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
