import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@extractors': path.resolve(__dirname, 'src/extractors'),
      '@rules': path.resolve(__dirname, 'src/rules'),
      '@reporters': path.resolve(__dirname, 'src/reporters'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});
