import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    exclude: ["lucide-react"],
  },

  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "html-export": ["html-to-image", "html2canvas"],
          framer: ["framer-motion"],
        },
      },
    },
  },
});
