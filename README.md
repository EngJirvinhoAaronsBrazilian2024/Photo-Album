<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/85c1c476-ae11-4406-9c7b-1e2e20a3e47a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

### 1. Set environment variables in Vercel

In your Vercel project dashboard go to **Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `VITE_CLOUDINARY_CLOUD_NAME` | `dlxdgmsdq` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `photo_album_unsigned` |

These two variables are required for photo uploads to work. They are intentionally **not** committed to the repository.

### 2. Authorize your Vercel domain in Firebase

Google Sign-in uses a popup that is blocked by Firebase for unknown domains. After your first Vercel deployment:

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication → Settings → Authorized domains**
2. Click **Add domain** and enter your Vercel deployment URL (e.g. `photo-album.vercel.app`)

Without this step, sign-in will fail with an `auth/unauthorized-domain` error.

### 3. Deploy

Push to your connected branch or run:

```bash
vercel --prod
```

Vercel reads `vercel.json` in the repo root to set the build command (`npm run build`), output directory (`dist`), and a catch-all rewrite so the SPA handles all routes correctly.
