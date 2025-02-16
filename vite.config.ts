// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: "/unit-ledger/",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
