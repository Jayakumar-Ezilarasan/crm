import { Router, Request, Response } from 'express';
import prisma from '../db';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { body, validationResult } from 'express-validator';
import { apiLimiter } from '../middlewares/security';
import jwt from 'jsonwebtoken';

const router = Router();

// In-memory refresh token store (for demo; use DB/Redis in production)
const refreshTokens = new Set<string>();

// Registration
router.post(
  '/register',
  apiLimiter,
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  // body('name').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }
    const { email, password, name } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: password_hash, name, role: 'user' },
    });
    res.status(201).json({ success: true, data: { id: user.id, email: user.email, name: user.name } });
  }
);

// Login
router.post(
  '/login',
  apiLimiter,
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    refreshTokens.add(refreshToken);
    res.status(200).json({ success: true, data: { accessToken, refreshToken } });
  }
);

// Logout
router.post('/logout', apiLimiter, (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) refreshTokens.delete(refreshToken);
  res.status(200).json({ success: true, message: 'Logged out' });
});

// Refresh
router.post('/refresh', apiLimiter, (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
  try {
    const payload = verifyRefreshToken(refreshToken) as any;
    const newAccessToken = signAccessToken({ id: payload.id, email: payload.email, name: payload.name, role: payload.role });
    res.status(200).json({ success: true, data: { accessToken: newAccessToken } });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// Password reset request (send token)
router.post(
  '/password/request',
  apiLimiter,
  body('email').isEmail(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ success: true }); // Don't reveal user existence
    }
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    // TODO: Send resetToken via email (integration needed)
    res.status(200).json({ success: true, data: { resetToken } });
  }
);

// Password reset (use token)
router.post(
  '/password/reset',
  apiLimiter,
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }
    const { token, password } = req.body;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const password_hash = await hashPassword(password);
      await prisma.user.update({ where: { id: payload.id }, data: { password: password_hash } });
      res.status(200).json({ success: true });
    } catch {
      res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
  }
);

export default router; 