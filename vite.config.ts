import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — относительные пути, работает на GitHub Pages в любом подкаталоге
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 800 },
});
