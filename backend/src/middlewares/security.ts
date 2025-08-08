import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

export const securityHeaders: RequestHandler = helmet();

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
}); 