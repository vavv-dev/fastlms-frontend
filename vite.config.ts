import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // nodePolyfills(),
    react({
      jsxImportSource: '@emotion/react',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'esnext',
    // rollupOptions: {
    //   output: {
    //     manualChunks(id) {
    //       if (id.includes('node_modules')) {
    //         return 'vendor'; // Place third-party dependencies in a separate chunk
    //       }
    //     },
    //   },
    // },
  },
});
