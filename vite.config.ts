import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    // CRITICAL: Base must be relative for APK/Cordova/Capacitor file:// protocol to work
    base: './', 
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    plugins: [react()],
    define: {
      // Maps process.env.API_KEY to the loaded environment variable for client-side usage
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});