import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cast to any to allow test property (Vitest augments UserConfig in its type package)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  },
} as any);
