import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // DISABLE_HMR is only used in AI Studio dev environments; defaults to HMR enabled.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
