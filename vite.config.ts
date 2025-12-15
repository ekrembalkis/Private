import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to avoid TS error regarding 'cwd' missing on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'process.env.GOOGLE_SEARCH_API_KEY': JSON.stringify(env.GOOGLE_SEARCH_API_KEY || env.VITE_GOOGLE_SEARCH_API_KEY),
      'process.env.GOOGLE_CSE_ID': JSON.stringify(env.GOOGLE_CSE_ID || env.VITE_GOOGLE_CSE_ID),
      'process.env.SERPAPI_KEY': JSON.stringify(env.SERPAPI_KEY || env.VITE_SERPAPI_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    }
  };
});