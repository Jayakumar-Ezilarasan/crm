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
```

**Note**: CORS is now configured to allow all origins for maximum flexibility. No `CORS_ORIGIN` environment variable is required.

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
```

**Note**: CORS is now configured to allow all origins for maximum flexibility. No `CORS_ORIGIN` environment variable is required.

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