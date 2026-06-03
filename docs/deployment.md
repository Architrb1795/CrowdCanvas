# Deployment Guide

CrowdCanvas is optimized for deployment on **Vercel** due to its deep integration with Next.js App Router, Server Components, and Edge compatibility.

## Production Checklist

Before deploying to production, ensure the following steps are completed.

### 1. Supabase Production Provisioning
Do not use your local development Supabase project for production.
1. Create a new Supabase project in your target region.
2. Run the `supabase/schema.sql` script to provision the tables and RLS policies.
3. Ensure the `pgvector` extension is enabled.
4. **CRITICAL:** Ensure `supabase_realtime` publication is enabled for the necessary tables (`likes`, `comments`, etc.).

### 2. Cloudinary Setup
1. Create a production Cloudinary environment.
2. In Cloudinary Settings > Upload, create an **Upload Preset** specifically for CrowdCanvas. Set it to "Unsigned" if you want client-side direct uploads, or "Signed" (recommended) to route uploads through the Next.js backend for security.

### 3. Vercel Environment Variables
Add the following strictly to your Vercel Project Settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# AI APIs
GEMINI_API_KEY=AIza...
```

### 4. Build Configuration
CrowdCanvas uses `next.config.ts`. The Vercel build command should automatically default to `npm run build`.

Ensure that:
*   The build environment has sufficient memory to install `@vladmandic/face-api` and `@xenova/transformers`.
*   If you encounter memory issues during build on Vercel, you may need to disable Next.js telemetry or configure memory limits in Vercel settings.

### 5. Webhooks (Optional)
If you rely on Cloudinary or Supabase webhooks to trigger background processing (like AI tagging), ensure you update the webhook URLs to point to your new `https://your-domain.com/api/...` endpoints.
