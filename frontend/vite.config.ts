import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:8000',
      '/model-info': 'http://localhost:8000',
      '/predict': 'http://localhost:8000',
      '/explain': 'http://localhost:8000',
      '/risk': 'http://localhost:8000',
      '/recommendations': 'http://localhost:8000',
      '/scenario': 'http://localhost:8000',
      '/metadata': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
    },
  },
});
