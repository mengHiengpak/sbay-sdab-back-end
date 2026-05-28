"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const sendResetEmail = (email, token) => {
    if (process.env.EMAIL_ENABLED !== 'true') {
        console.log(`\n🔑 Password reset token for ${email}: ${token}\n`);
        return;
    }
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
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
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existing = await User_1.default.findOne({ email: email.toLowerCase() });
        if (existing) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        const user = await User_1.default.create({
            email: email.toLowerCase(),
            password,
            name
        });
        const token = generateToken(user._id.toString());
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, email: user.email, name: user.name }
        });
    }
    catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            res.status(400).json({ error: messages.join(', ') });
            return;
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isMatch = await user.comparePassword(password);
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
    }
    catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});
router.post('/logout', auth_1.default, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
router.get('/me', auth_1.default, async (req, res) => {
    res.json({ user: { id: req.user._id, email: req.user.email, name: req.user.name, phone: req.user.phone } });
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.json({ message: 'If that email is registered, a reset link has been sent' });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        await sendResetEmail(user.email, resetToken);
        res.json({ message: 'If that email is registered, a reset link has been sent' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to process request' });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Password has been reset successfully' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map