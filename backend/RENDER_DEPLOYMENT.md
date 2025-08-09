# Render Deployment Guide for CRM Backend

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Database**: Set up a PostgreSQL database (recommended: Render PostgreSQL, Supabase, or Railway)
3. **Git Repository**: Your code should be in a Git repository

## Quick Start

### 1. Set Up Database (CRITICAL STEP)

**You must set up a PostgreSQL database before deploying!**

#### Option A: Render PostgreSQL (Recommended)
1. Go to [render.com](https://render.com)
2. Click "New +" and select "PostgreSQL"
3. Choose a plan (Free tier available)
4. Select your region
5. Click "Create Database"
6. Copy the "External Database URL" from your database dashboard

#### Option B: Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the "Connection string" (URI format)

### 2. Deploy Backend

1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `crm-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (recommended for production)

### 3. Set Environment Variables (CRITICAL)

**In your Render backend service dashboard, go to "Environment" tab and add:**

#### Required Variables:
```bash
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
CORS_ORIGIN="https://your-frontend-domain.vercel.app"
```

#### Optional Variables:
```bash
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
BCRYPT_ROUNDS="12"
LOG_LEVEL="info"
ENABLE_MONITORING="true"
NODE_ENV="production"
PORT="3001"
```

### 4. Deploy and Test

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Test your API: `https://your-service-name.onrender.com/health`

## Detailed Deployment Steps

### 1. Prepare Your Repository

Make sure your backend code is in a Git repository and connected to Render.

### 2. Set Up Environment Variables

In your Render dashboard, go to your service settings and add these environment variables:

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
   # Connect to your Render service and run:
   npx prisma migrate deploy
   ```

### 4. Deploy to Render

#### Option A: Render Dashboard (Recommended)
1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `crm-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (recommended for production)
5. Add environment variables
6. Deploy

#### Option B: Using render.yaml
1. Push your code with `render.yaml` to your repository
2. Go to Render dashboard
3. Click "New +" and select "Blueprint"
4. Connect your repository
5. Render will automatically detect and deploy using the `render.yaml` configuration

### 5. Configure Custom Domain (Optional)

1. Go to your Render service dashboard
2. Navigate to **Settings > Custom Domains**
3. Add your custom domain
4. Update your `CORS_ORIGIN` environment variable

## Configuration Files

### render.yaml
The `render.yaml` file is already configured for your Express.js application with:
- Web service configuration
- Environment variables
- Health check endpoint
- Auto-deploy settings

### Dockerfile
The `Dockerfile` is optimized for Render deployment with:
- Node.js 18 Alpine base image
- Fixed npm install issues
- Fixed TypeScript configuration paths
- Relaxed TypeScript strict settings for deployment
- SSL libraries for Prisma compatibility
- Security best practices (non-root user)
- Health checks
- Prisma client generation

### Build Process
The build process includes:
1. Install dependencies (`npm install`)
2. TypeScript compilation (`npm run build`)
3. Prisma client generation (`npx prisma generate`)
4. Production optimization

## API Endpoints

Your API will be available at:
- **Base URL**: `https://your-service-name.onrender.com`
- **Health Check**: `GET /health`
- **Auth**: `POST /auth/login`, `POST /auth/register`
- **API Routes**: `/api/customers`, `/api/leads`, `/api/tasks`, etc.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | **YES** |
| `JWT_SECRET` | Secret for JWT token signing | **YES** |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | **YES** |
| `CORS_ORIGIN` | Frontend domain for CORS | **YES** |
| `JWT_EXPIRES_IN` | JWT token expiration time | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration time | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No |
| `BCRYPT_ROUNDS` | Password hashing rounds | No |
| `LOG_LEVEL` | Logging level | No |
| `ENABLE_MONITORING` | Enable performance monitoring | No |

## Troubleshooting

### Common Issues:

1. **"Environment variable not found: DATABASE_URL"**:
   - **Issue**: `DATABASE_URL` environment variable is not set
   - **Solution**: Add `DATABASE_URL` to your Render environment variables
   - **Steps**: Go to Render dashboard > Your service > Environment > Add `DATABASE_URL`

2. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation succeeds locally
   - Verify `tsconfig.json` excludes `prisma/` directory

3. **npm ci Errors**:
   - **Issue**: `npm ci` requires package-lock.json
   - **Solution**: Use `npm install` instead of `npm ci`
   - **Fixed**: Dockerfile now uses `npm install`

4. **TypeScript Configuration Errors**:
   - **Issue**: `No inputs were found in config file`
   - **Solution**: Fixed `tsconfig.json` paths for Docker container
   - **Fixed**: Changed `rootDir` from `./backend/src` to `./src`
   - **Fixed**: Changed `include` from `["backend/src"]` to `["src"]`
   - **Fixed**: Changed `exclude` from `["backend/prisma/seed.ts"]` to `["prisma"]`

5. **TypeScript Strict Mode Errors**:
   - **Issue**: Multiple TypeScript strict mode compilation errors
   - **Solution**: Temporarily relaxed strict settings for deployment
   - **Fixed**: Disabled `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`
   - **Fixed**: Updated environment variable access to use bracket notation
   - **Fixed**: Added proper error handling and return statements
   - **Fixed**: Fixed middleware type signatures (ErrorRequestHandler vs RequestHandler)
   - **Fixed**: Fixed performance monitor recordMetric method access

6. **Prisma SSL Library Errors**:
   - **Issue**: `Error loading shared library libssl.so.1.1: No such file or directory`
   - **Solution**: Added SSL libraries to Dockerfile
   - **Fixed**: Added `openssl libc6-compat` to Alpine package installation
   - **Alternative**: Use `Dockerfile.debian` for better SSL compatibility
   - **Alternative**: Use `Dockerfile.alpine` for comprehensive Alpine setup

7. **Alpine Package Errors**:
   - **Issue**: `libssl1.1 (no such package)`
   - **Solution**: Use correct Alpine package names
   - **Fixed**: Changed from `libssl1.1` to `libc6-compat`
   - **Fixed**: Added `ca-certificates` for HTTPS support

8. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Render
   - Ensure database is in the same region as your service

9. **CORS Errors**:
   - Update `CORS_ORIGIN` to match your frontend domain
   - Ensure frontend is making requests to correct backend URL

10. **Service Timeouts**:
    - Check Render service logs
    - Optimize database queries
    - Consider upgrading to a higher plan

### Debugging:

1. **Check Environment Variables**:
   - Go to Render dashboard > Your service > Environment
   - Verify all required variables are set correctly

2. **Check Logs**: Render dashboard > Your service > Logs
3. **Health Check**: Visit `/health` endpoint to verify deployment
4. **Database Connection**: Check if database is accessible

## Performance Optimization

1. **Database Indexes**: Run `npm run db:indexes` after deployment
2. **Caching**: Consider adding Redis for session storage
3. **CDN**: Render provides automatic CDN for static assets

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Configure properly for production
3. **Rate Limiting**: Adjust based on your needs
4. **HTTPS**: Render provides automatic HTTPS

## Monitoring

- **Render Analytics**: Built-in performance monitoring
- **Custom Logs**: Use `console.log` for debugging
- **Health Checks**: Automatic health monitoring
- **Error Tracking**: Consider adding Sentry or similar

## Support

For issues specific to your application, check:
1. Render documentation: [render.com/docs](https://render.com/docs)
2. Your application logs in Render dashboard
3. Database connection and migration status
4. See `DATABASE_SETUP.md` for detailed database setup instructions

## Migration from Vercel

If you're migrating from Vercel to Render:

1. **Remove Vercel files**:
   - Delete `vercel.json`
   - Delete `.vercelignore`

2. **Update environment variables**:
   - Copy from Vercel to Render dashboard
   - Update `CORS_ORIGIN` to match your new frontend URL

3. **Update frontend**:
   - Change API URL to your new Render backend URL

4. **Test thoroughly**:
   - Verify all endpoints work
   - Check database connections
   - Test authentication flow
