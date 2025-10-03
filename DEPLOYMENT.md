# Vercel Deployment Guide

## Issues Fixed

This guide addresses the deployment issues that were preventing the application from working on Vercel.

## Key Changes Made

### 1. Updated `vercel.json`
- Removed problematic runtime specification (Vercel auto-detects Node.js for .js files)
- Added environment variable configuration
- Ensured proper routing for SPA and API routes

### 2. Enhanced `vite.config.ts`
- Added production build optimizations
- Added proper chunk splitting for better performance
- Added environment variable handling

### 3. Fixed API Client Configuration
- Updated base URL logic for production deployment
- Ensured proper proxy usage in both development and production

### 4. Updated Node.js Version
- Updated Node.js version to 22.x (Vercel's current requirement)
- Added `vercel-build` script for Vercel deployment

## Environment Variables Required

Set these environment variables in your Vercel dashboard:

```
API_BASE_URL=https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1
```

## Deployment Steps

1. **Push your changes to GitHub**
2. **Connect your repository to Vercel**
3. **Set environment variables in Vercel dashboard:**
   - Go to your project settings
   - Navigate to Environment Variables
   - Add `API_BASE_URL` with value: `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1`

4. **Deploy**
   - Vercel will automatically detect the framework (Vite)
   - The build command will be `npm run build`
   - Output directory will be `dist`

## API Routes

The application uses Vercel's serverless functions for API proxying:
- `/api/*` routes are handled by serverless functions
- These functions proxy requests to your external API
- CORS headers are properly set

## Troubleshooting

If you still encounter issues:

1. **Check Vercel Function Logs:**
   - Go to your Vercel dashboard
   - Navigate to Functions tab
   - Check logs for any errors

2. **Verify Environment Variables:**
   - Ensure `API_BASE_URL` is set correctly
   - Check that the external API is accessible

3. **Test API Routes:**
   - Try accessing `/api/test` to verify proxy is working
   - Check browser network tab for any CORS errors

## Build Optimization

The build now includes:
- Code splitting for better performance
- Terser minification
- Optimized chunk loading
- Proper asset handling

This should resolve all deployment issues and ensure your application works correctly on Vercel.
