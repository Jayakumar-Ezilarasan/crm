# 502 Bad Gateway Error - Troubleshooting Guide

## Overview
A 502 Bad Gateway error indicates that your backend service is not responding properly or is down. This guide will help you diagnose and fix the issue.

## Quick Diagnostic Steps

### 1. Check Backend Health
First, test if your backend is responding:
```bash
curl https://crm-nnzk.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

**If this fails**, your backend is down and needs to be restarted.

### 2. Check Render Dashboard
1. Go to [render.com](https://render.com) and sign in
2. Navigate to your backend service (`crm-nnzk`)
3. Check the **Logs** tab for error messages
4. Check the **Events** tab for deployment status

## Common Causes and Solutions

### 1. Database Connection Issues

#### Problem: DATABASE_URL not set or invalid
**Symptoms:**
- Error logs show "Environment variable not found: DATABASE_URL"
- Database connection failures

**Solution:**
1. Go to Render dashboard > Your service > Environment
2. Ensure `DATABASE_URL` is set correctly
3. Format: `postgresql://username:password@host:port/database`
4. Redeploy the service

#### Problem: Database is down or inaccessible
**Symptoms:**
- "Connection refused" errors
- Database timeout errors

**Solution:**
1. Check if your database service is running
2. Verify database credentials
3. Ensure database is in the same region as your backend
4. Check database connection limits

### 2. Environment Variables Missing

#### Required Variables Checklist:
```bash
# Required Variables (must be set)
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Optional Variables (recommended for production)
NODE_ENV="production"
PORT="3001"
LOG_LEVEL="info"
```

### 3. Build Failures

#### Problem: TypeScript compilation errors
**Symptoms:**
- Build logs show TypeScript errors
- Service fails to start

**Solution:**
1. Check build logs in Render dashboard
2. Ensure all TypeScript errors are fixed
3. Verify `tsconfig.json` configuration
4. Test build locally: `npm run build`

#### Problem: Missing dependencies
**Symptoms:**
- "Module not found" errors
- npm install failures

**Solution:**
1. Ensure `package.json` has all required dependencies
2. Check if `package-lock.json` is up to date
3. Try clearing npm cache locally

### 4. Application Crashes

#### Problem: Unhandled exceptions
**Symptoms:**
- Application crashes on startup
- Runtime errors

**Solution:**
1. Check application logs in Render dashboard
2. Look for unhandled promise rejections
3. Verify all required files are present
4. Test application locally

### 5. Resource Limits

#### Problem: Memory or CPU limits exceeded
**Symptoms:**
- Service timeout errors
- Slow response times

**Solution:**
1. Check resource usage in Render dashboard
2. Consider upgrading to a higher plan
3. Optimize application performance
4. Implement proper error handling

## Step-by-Step Troubleshooting

### Step 1: Check Service Status
1. Go to Render dashboard
2. Find your `crm-nnzk` service
3. Check if status is "Live" (green)
4. If not, check the "Events" tab for deployment issues

### Step 2: Review Logs
1. Click on your service
2. Go to "Logs" tab
3. Look for error messages
4. Check both "Build" and "Runtime" logs

### Step 3: Verify Environment Variables
1. Go to "Environment" tab
2. Ensure all required variables are set:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
3. Check for any typos or formatting issues

### Step 4: Test Database Connection
1. Check if database is accessible
2. Verify database URL format
3. Test connection from Render service

### Step 5: Restart Service
1. Go to your service dashboard
2. Click "Manual Deploy"
3. Select "Clear build cache & deploy"
4. Wait for deployment to complete

### Step 6: Check Health Endpoint
After restart, test the health endpoint:
```bash
curl https://crm-nnzk.onrender.com/health
```

## Debugging Commands

### Local Testing
```bash
# Test build locally
npm run build

# Test build and start
npm run build && npm start

# Test database connection
npx prisma db push

# Check environment variables
echo $DATABASE_URL
echo $JWT_SECRET
```

### Remote Testing
```bash
# Test health endpoint
curl -v https://crm-nnzk.onrender.com/health

# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: https://crm-2sqn.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://crm-nnzk.onrender.com/auth/login

# Test login endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  https://crm-nnzk.onrender.com/auth/login
```

## Emergency Fixes

### If Backend is Completely Down

#### Option 1: Quick Restart
1. Go to Render dashboard
2. Click "Suspend" then "Resume"
3. Wait for service to restart

#### Option 2: Full Redeploy
1. Go to Render dashboard
2. Click "Manual Deploy"
3. Select "Clear build cache & deploy"
4. Wait for deployment

#### Option 3: Check Recent Changes
1. Review recent code changes
2. Check if any breaking changes were introduced
3. Rollback to previous working version if necessary

## Prevention

### Best Practices
1. **Test locally** before deploying
2. **Use environment-specific configurations**
3. **Implement proper error handling**
4. **Monitor application logs regularly**
5. **Set up alerts for service downtime**

### Monitoring
1. **Health checks**: Regular testing of `/health` endpoint
2. **Log monitoring**: Watch for error patterns
3. **Performance monitoring**: Track response times
4. **Database monitoring**: Check connection status

## Support Resources

### Render Documentation
- [Troubleshooting Guide](https://render.com/docs/troubleshooting)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Health Checks](https://render.com/docs/health-checks)

### Application Logs
- Check Render dashboard > Your service > Logs
- Look for error patterns and timestamps
- Monitor resource usage

### Database Issues
- Check database service status
- Verify connection strings
- Test database connectivity

## Next Steps

1. **Immediate**: Check Render dashboard for service status and logs
2. **Short-term**: Verify environment variables and database connection
3. **Long-term**: Implement monitoring and alerting systems

## Contact Support

If issues persist:
1. Check Render documentation
2. Review application logs thoroughly
3. Test all components systematically
4. Consider reaching out to Render support
