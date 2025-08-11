import { CorsOptions } from 'cors';

const allowedOrigins = process.env['NODE_ENV'] === 'production'
  ? [
      'https://crm-2sqn.vercel.app', // Vercel frontend
      process.env['FRONTEND_URL'] || ''
    ].filter(Boolean)
  : [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000'  // Alternative local port
    ];

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

export const isProduction = process.env['NODE_ENV'] === 'production'; 