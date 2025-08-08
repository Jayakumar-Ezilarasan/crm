# Vercel Deployment Guide for CRM Backend

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: Supabase, Railway, or Neon)
3. **Vercel CLI** (optional): `npm i -g vercel`

## Deployment Steps

### 1. Prepare Your Repository

Make sure your backend code is in a Git repository and connected to Vercel.

### 2. Set Up Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### Required Variables:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

#### Optional Variables:
```bash
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
LOG_LEVEL=info
ENABLE_MONITORING=true
```

### 3. Database Setup

1. **Create Database**: Set up a PostgreSQL database
2. **Run Migrations**: After deployment, run database migrations:
   ```bash
   # Connect to your Vercel function and run:
   npx prisma migrate deploy
   ```

### 4. Deploy to Vercel

#### Option A: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Node.js
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Deploy

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

### 5. Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Domains**
3. Add your custom domain
4. Update your `CORS_ORIGIN` environment variable

## Configuration Files

### vercel.json
The `vercel.json` file is already configured for your Express.js application with:
- Serverless function configuration
- Route handling for API endpoints
- Security headers
- CORS support

### Build Process
The build process includes:
1. TypeScript compilation (`npm run build`) - only compiles `src/` directory
2. Prisma client generation (`prisma generate`)
3. Output to `dist/` directory

### TypeScript Configuration
- **Source files**: Only `src/**/*` files are compiled
- **Excluded**: `prisma/`, `tests/`, `node_modules/`, `dist/`
- **Prisma files**: Handled separately by Prisma CLI

## API Endpoints

Your API will be available at:
- **Base URL**: `https://your-project.vercel.app`
- **Health Check**: `GET /health`
- **Auth**: `POST /auth/login`, `POST /auth/register`
- **API Routes**: `/api/customers`, `/api/leads`, `/api/tasks`, etc.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `CORS_ORIGIN` | Frontend domain for CORS | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration time | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No |
| `BCRYPT_ROUNDS` | Password hashing rounds | No |
| `LOG_LEVEL` | Logging level | No |
| `ENABLE_MONITORING` | Enable performance monitoring | No |

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation succeeds locally
   - Verify `tsconfig.json` excludes `prisma/` directory

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Vercel

3. **CORS Errors**:
   - Update `CORS_ORIGIN` to match your frontend domain
   - Ensure frontend is making requests to correct backend URL

4. **Function Timeouts**:
   - Increase `maxDuration` in `vercel.json` if needed
   - Optimize database queries

### Debugging:

1. **Check Logs**: Vercel dashboard > Functions > View logs
2. **Test Locally**: Use `vercel dev` for local testing
3. **Health Check**: Visit `/health` endpoint to verify deployment

## Performance Optimization

1. **Database Indexes**: Run `npm run db:indexes` after deployment
2. **Caching**: Consider adding Redis for session storage
3. **CDN**: Vercel automatically provides CDN for static assets

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure properly for production
3. **Rate Limiting**: Adjust based on your needs
4. **HTTPS**: Vercel provides automatic HTTPS

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Custom Logs**: Use `console.log` for debugging
- **Error Tracking**: Consider adding Sentry or similar

## Support

For issues specific to your application, check:
1. Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Your application logs in Vercel dashboard
3. Database connection and migration status
