import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/bridge': path.resolve(__dirname, './src/bridge'),
      '@/ui': path.resolve(__dirname, './src/ui'),
      '@/knowledge': path.resolve(__dirname, './src/knowledge'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      'obsidian': path.resolve(__dirname, './tests/__mocks__/obsidian.ts'),
    },
  },
});