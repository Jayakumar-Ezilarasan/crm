import { RequestHandler, ErrorRequestHandler, Request, Response, NextFunction } from 'express';

// Simple request monitoring middleware
export const monitoringMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request details
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Error monitoring middleware
export const errorMonitoringMiddleware: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`${new Date().toISOString()} - ERROR: ${err.message}`);
  console.error(err.stack);
  
  // Log error details for monitoring
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: err.message,
    stack: process.env['NODE_ENV'] === 'development' ? err.stack : undefined
  };
  
  console.error('Error Details:', JSON.stringify(errorInfo, null, 2));
  
  next(err);
};

// Performance monitoring
export const performanceMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    if (duration > 1000) { // Log slow requests (>1s)
      console.warn(`SLOW REQUEST: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
}; 