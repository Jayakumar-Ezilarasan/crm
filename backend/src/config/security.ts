import { CorsOptions } from 'cors';

const allowedOrigins = process.env['NODE_ENV'] === 'production'
  ? [process.env['FRONTEND_URL'] || '']
  : ['http://localhost:3000'];

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
};

export const isProduction = process.env['NODE_ENV'] === 'production'; 