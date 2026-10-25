import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react()],
    define: {
      __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL || ''),
    },
    server: {
      host: '127.0.0.1',
      proxy: {
        '/students': apiTarget,
        '/health': apiTarget,
      },
    },
  };
});
