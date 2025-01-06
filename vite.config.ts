import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          // form
          'form-vendor': ['@hookform/resolvers', 'yup', 'react-hook-form'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
    minify: 'terser',
    terserOptions: {
      mangle: {
        // cf. component.common.swr.ts, component.notification.NotificationBox.tsx
        reserved: ['lessonGetDisplays', 'sharedGetDisplays', 'courseGetView'],
      },
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
