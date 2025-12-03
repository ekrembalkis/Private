import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
  define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'process.env.GOOGLE_SEARCH_API_KEY': JSON.stringify(env.GOOGLE_SEARCH_API_KEY || env.VITE_GOOGLE_SEARCH_API_KEY),
      'process.env.GOOGLE_CSE_ID': JSON.stringify(env.GOOGLE_CSE_ID || env.VITE_GOOGLE_CSE_ID)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  };
});