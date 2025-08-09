# Deployment Fixes Guide

## Issues Identified

1. **Favicon 404 Error**: Missing favicon file
2. **CORS Error**: Backend not allowing requests from Vercel frontend
3. **502 Bad Gateway**: Backend service issues

## Fixes Applied

### 1. Fixed Favicon 404 Error ✅

**Problem**: `GET /favicon.png 404 (Not Found)`

**Solution**: Removed favicon reference from `index.html`

**File**: `frontend/index.html`
```html
<!-- Removed this line -->
<!-- <link rel="icon" type="image/svg+xml" href="/favicon.png" /> -->
```

### 2. Fixed CORS Configuration ✅

**Problem**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**: Updated Vercel configuration with correct backend URL

**File**: `frontend/vercel.json`
```json
{
  "env": {
    "VITE_API_URL": "https://crm-nnzk.onrender.com"
  }
}
```

### 3. Backend CORS Configuration Required ⚠️

**Problem**: Backend needs to allow requests from your Vercel frontend

**Solution**: Set `CORS_ORIGIN` environment variable in your Render backend

**Steps**:
1. Go to your Render backend service dashboard
2. Navigate to "Environment" tab
3. Add environment variable:
   - **Key**: `CORS_ORIGIN`
   - **Value**: `https://crm-2sqn-c805wpa0i-jayakumars-projects-cef91cfd.vercel.app`

### 4. Backend Service Issues ⚠️

**Problem**: `502 Bad Gateway` error

**Possible Causes**:
- Backend service is down
- Database connection issues
- Environment variables not set

**Solutions**:

#### Check Backend Status
1. Visit: `https://crm-nnzk.onrender.com/health`
2. If it returns an error, the backend is down

#### Check Render Logs
1. Go to Render dashboard
2. Check your backend service logs
3. Look for error messages

#### Verify Environment Variables
Ensure these are set in your Render backend:
```bash
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
CORS_ORIGIN="https://crm-2sqn-c805wpa0i-jayakumars-projects-cef91cfd.vercel.app"
NODE_ENV="production"
```

## Complete Fix Steps

### Step 1: Fix Frontend (Already Done)
- ✅ Removed favicon reference
- ✅ Updated Vercel configuration

### Step 2: Fix Backend CORS
1. Go to Render dashboard
2. Select your backend service (`crm-nnzk`)
3. Go to "Environment" tab
4. Add/Update environment variable:
   ```
   CORS_ORIGIN=https://crm-2sqn-c805wpa0i-jayakumars-projects-cef91cfd.vercel.app
   ```
5. Redeploy the backend service

### Step 3: Verify Backend Health
1. Visit: `https://crm-nnzk.onrender.com/health`
2. Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "uptime": ...,
     "environment": "production"
   }
   ```

### Step 4: Test Frontend
1. Redeploy your Vercel frontend
2. Try logging in again
3. Check browser console for errors

## Alternative Solutions

### If Backend is Still Down

#### Option 1: Check Database
- Verify `DATABASE_URL` is correct
- Check if database is accessible
- Run database migrations if needed

#### Option 2: Use Different Backend URL
If your backend is deployed elsewhere, update the Vercel environment variable:
```json
{
  "env": {
    "VITE_API_URL": "your-actual-backend-url"
  }
}
```

#### Option 3: Deploy Backend to Different Service
- Try deploying to Railway, Heroku, or DigitalOcean
- Update the `VITE_API_URL` accordingly

## Testing Checklist

- [ ] Backend health check passes: `https://crm-nnzk.onrender.com/health`
- [ ] CORS_ORIGIN is set correctly in Render
- [ ] Frontend can make requests to backend
- [ ] Login functionality works
- [ ] No console errors

## Debugging Commands

### Check Backend Status
```bash
curl https://crm-nnzk.onrender.com/health
```

### Test CORS
```bash
curl -H "Origin: https://crm-2sqn-c805wpa0i-jayakumars-projects-cef91cfd.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://crm-nnzk.onrender.com/auth/login
```

### Check Environment Variables
In your Render backend logs, look for:
- Database connection messages
- CORS configuration messages
- Environment variable loading messages

## Support

If issues persist:
1. Check Render service logs
2. Verify all environment variables are set
3. Test backend endpoints directly
4. Check database connectivity
