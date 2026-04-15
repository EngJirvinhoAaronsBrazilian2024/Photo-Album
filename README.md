<div align="center">

# 📸 Photo Album

A family photo sharing and album management app built with React, TypeScript, Firebase, and Tailwind CSS.

</div>

## Features

- 🔐 Google Authentication
- 📁 Create and manage photo albums
- 📤 Upload photos with captions
- 🖼️ Photo timeline view
- 💬 Comments and reactions on photos
- 📱 Responsive design (mobile + desktop)
- 🌙 Dark mode support

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Animations:** Motion (Framer Motion)
- **Icons:** Lucide React

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push the repository to GitHub.

2. Import the project in [Vercel](https://vercel.com/new).

3. Vercel will auto-detect the Vite framework. The `vercel.json` configuration handles SPA routing.

4. Click **Deploy**. No environment variables are required — Firebase config is bundled at build time.

## Project Structure

```
├── public/             # Static assets (images, favicon)
├── src/
│   ├── components/     # React components
│   ├── App.tsx         # Main app with routing
│   ├── AuthContext.tsx  # Firebase auth context
│   ├── firebase.ts     # Firebase initialization
│   ├── types.ts        # TypeScript types
│   ├── data.ts         # Mock data
│   ├── index.css       # Global styles & theme
│   └── main.tsx        # Entry point
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── vercel.json         # Vercel deployment config
└── firestore.rules     # Firestore security rules
```
