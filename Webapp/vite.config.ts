import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_'],
  // Serve from root "/" for custom domain cardstudio.vedamit.com and clean SPA routes (/farmer, etc.)
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'tesseract.js', 'qrcode', 'jspdf']
  }
});

