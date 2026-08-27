import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/scratch/**', '**/dist/**', '**/.next/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@nectar/types': path.resolve(__dirname, './packages/types/src'),
      'server-only': path.resolve(__dirname, './scripts/stubs/server-only-empty.js'),
    },
  },
});
