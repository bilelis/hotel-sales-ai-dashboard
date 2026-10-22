import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // /api -> backend (override the target with VITE_API_URL)
      proxy: { '/api': { target: env.VITE_API_URL || 'http://localhost:3001', changeOrigin: true, timeout: 120000, proxyTimeout: 120000 } },
    },
  };
});
