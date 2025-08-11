# Environment Variables Setup Guide

## Issue Identified

Your backend is showing `environment: development` instead of `production`, which indicates that the `NODE_ENV` environment variable is not set correctly in Render.

## Required Environment Variables

### Essential Variables (Must be set)

```bash
# Environment Configuration
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
```

### Optional Variables (Recommended for production)

```bash
# Application Configuration
PORT=3001
LOG_LEVEL=info

# JWT Expiration
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12

# Monitoring
ENABLE_MONITORING=true
```

## How to Set Environment Variables in Render

### Method 1: Render Dashboard (Recommended)

1. **Go to Render Dashboard**:
   - Visit [https://dashboard.render.com](https://dashboard.render.com)
   - Sign in to your account

2. **Navigate to Your Service**:
   - Find your `crm-nnzk` service
   - Click on it to open the service dashboard

3. **Access Environment Variables**:
   - Click on the **"Environment"** tab
   - You'll see a list of current environment variables

4. **Add/Update Variables**:
   - Click **"Add Environment Variable"** for new variables
   - Click the **edit** button (pencil icon) for existing variables
   - Add these variables:

#### Required Variables to Add:
```bash
Key: NODE_ENV
Value: production

Key: DATABASE_URL
Value: postgresql://username:password@host:port/database

Key: JWT_SECRET
Value: your-super-secret-jwt-key-here

Key: JWT_REFRESH_SECRET
Value: your-super-secret-refresh-key-here
```

#### Optional Variables to Add:
```bash
Key: PORT
Value: 3001

Key: LOG_LEVEL
Value: info

Key: JWT_EXPIRES_IN
Value: 15m

Key: JWT_REFRESH_EXPIRES_IN
Value: 7d

Key: RATE_LIMIT_WINDOW_MS
Value: 900000

Key: RATE_LIMIT_MAX_REQUESTS
Value: 100

Key: BCRYPT_ROUNDS
Value: 12

Key: ENABLE_MONITORING
Value: true
```

5. **Save Changes**:
   - Click **"Save Changes"** after adding all variables
   - Render will automatically redeploy your service

### Method 2: Using render.yaml (Alternative)

If you prefer to use the `render.yaml` file, ensure it's properly configured:

```yaml
services:
  - type: web
    name: crm-backend
    env: node
    plan: starter
    buildCommand: npm install && npm run build && npx prisma generate
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: PORT
        value: 3001
      - key: LOG_LEVEL
        value: info
      - key: JWT_EXPIRES_IN
        value: 15m
      - key: JWT_REFRESH_EXPIRES_IN
        value: 7d
      - key: RATE_LIMIT_WINDOW_MS
        value: 900000
      - key: RATE_LIMIT_MAX_REQUESTS
        value: 100
      - key: BCRYPT_ROUNDS
        value: 12
      - key: ENABLE_MONITORING
        value: true
    healthCheckPath: /health
    autoDeploy: true
```

## Verification Steps

### Step 1: Check Health Endpoint

After setting the environment variables, test the health endpoint:

```bash
curl https://crm-nnzk.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "database": "configured",
  "port": 3001,
  "nodeVersion": "v18.x.x"
}
```

### Step 2: Check Render Logs

1. Go to your Render service dashboard
2. Click on the **"Logs"** tab
3. Look for these messages:
   ```
   Environment: production
   Database connected successfully
   Server is running on port 3001
   ```

### Step 3: Test Login Functionality

1. Visit your frontend: `https://crm-2sqn.vercel.app/`
2. Try logging in
3. Check browser console for any errors

## Troubleshooting

### Issue 1: Environment Still Shows as Development

**Solution:**
1. Verify `NODE_ENV=production` is set in Render dashboard
2. Redeploy the service after setting environment variables
3. Check if the service restarted properly

### Issue 2: Database Connection Issues

**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Check database service status
3. Ensure database is accessible from Render

### Issue 3: JWT Errors

**Solution:**
1. Verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
2. Ensure secrets are strong (at least 32 characters)
3. Redeploy after setting secrets

### Issue 4: Service Not Starting

**Solution:**
1. Check build logs in Render dashboard
2. Verify all required environment variables are set
3. Check for TypeScript compilation errors

## Quick Fix Checklist

- [ ] Set `NODE_ENV=production` in Render dashboard
- [ ] Verify `DATABASE_URL` is configured
- [ ] Set `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Redeploy the service
- [ ] Test health endpoint: `https://crm-nnzk.onrender.com/health`
- [ ] Verify environment shows as "production"
- [ ] Test login functionality

## Next Steps

1. **Immediate**: Set `NODE_ENV=production` in Render dashboard
2. **Short-term**: Verify all required environment variables
3. **Long-term**: Set up monitoring and alerting

## Support

If you continue to have issues:
1. Check Render dashboard logs
2. Verify environment variables are set correctly
3. Test the health endpoint
4. Review the troubleshooting guide in `TROUBLESHOOTING_502.md`
