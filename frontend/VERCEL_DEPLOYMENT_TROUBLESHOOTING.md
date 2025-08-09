# Vercel Deployment Troubleshooting Guide

## MIME Type Error: "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html""

### Problem Description
This error occurs when Vercel serves JavaScript files with the wrong MIME type, typically serving `index.html` instead of the actual JavaScript files.

### Root Causes
1. **Incorrect routing configuration** in `vercel.json`
2. **Build output issues** with Vite
3. **Asset path problems** in the HTML file
4. **Caching issues** with previous deployments

### Solutions

#### Solution 1: Use the Updated vercel.json (Recommended)

The main `vercel.json` has been updated with proper routing:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif))",
      "dest": "/$1",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-backend-service.up.railway.app"
  }
}
```

#### Solution 2: Use Alternative Configuration

If the main configuration doesn't work, try the alternative `vercel-simple.json`:

1. Rename `vercel-simple.json` to `vercel.json`
2. Deploy again

#### Solution 3: Manual Fix Steps

1. **Clear Vercel Cache**:
   ```bash
   # In your project directory
   vercel --force
   ```

2. **Rebuild Locally**:
   ```bash
   npm run build
   # Check the dist folder structure
   ls -la dist/
   ```

3. **Check Build Output**:
   - Ensure `dist/index.html` exists
   - Ensure JavaScript files are in `dist/assets/`
   - Check that asset paths in `index.html` are correct

4. **Update Environment Variables**:
   - Go to Vercel dashboard
   - Update `VITE_API_URL` to your actual backend URL

### Prevention Steps

1. **Always test build locally**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Check file paths**:
   - Ensure favicon and other assets use correct paths
   - Remove `/public/` prefix from asset references

3. **Use proper routing**:
   - Static assets should be served directly
   - SPA routes should fall back to `index.html`

### Debugging Steps

1. **Check Network Tab**:
   - Open browser dev tools
   - Go to Network tab
   - Look for failed JavaScript requests
   - Check response headers for MIME type

2. **Check Vercel Logs**:
   - Go to Vercel dashboard
   - Check deployment logs
   - Look for build errors

3. **Test Different Routes**:
   - Try accessing `/assets/vendor-xxx.js` directly
   - Check if it returns JavaScript or HTML

### Common Issues and Fixes

#### Issue 1: Assets not found
**Fix**: Update asset paths in `index.html`
```html
<!-- Wrong -->
<link rel="icon" href="/public/favicon.png" />

<!-- Correct -->
<link rel="icon" href="/favicon.png" />
```

#### Issue 2: Build output structure
**Fix**: Check Vite configuration
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
})
```

#### Issue 3: Caching issues
**Fix**: Force redeploy
```bash
vercel --force
# or
vercel --prod --force
```

### Alternative Deployment Options

If Vercel continues to have issues:

1. **Netlify**: Similar to Vercel, often more reliable
2. **GitHub Pages**: Free static hosting
3. **Firebase Hosting**: Google's hosting solution

### Support

If issues persist:

1. **Check Vercel Status**: [vercel-status.com](https://vercel-status.com)
2. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
3. **Community Support**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
