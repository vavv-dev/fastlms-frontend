import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
// @ts-expect-error eslint plugin is not typed
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    eslint({
      lintOnStart: false,
      failOnError: false,
      include: ['./src/**/*.ts', './src/**/*.tsx'],
      overrideConfigFile: './eslint.config.cjs',
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
        // cf. component.common.swr.ts, component.notification.NotificationButton.tsx, component.exam.ActionMenu.tsx
        reserved: ['lessonGetDisplays', 'sharedGetDisplays', 'courseGetView', 'examGetAttempt'],
      },
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
