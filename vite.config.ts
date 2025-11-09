import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      host: '0.0.0.0',
      port: 3000,
      // 👇 Relax isolation so popups & cross-origin SDK transports work
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        // Avoid COEP in dev; it can block Firebase RTDB/WebSockets & popup checks
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
