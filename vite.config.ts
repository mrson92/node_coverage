import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Vendor 코드 스플리팅: 메인 청크 크기 절감 및 캐시 효율 향상
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@base-ui/react')) return 'vendor-misc';
            if (id.includes('react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
            if (id.includes('node_modules/scheduler/') || id.includes('node_modules/object-assign/')) {
              return 'vendor-react';
            }
            return 'vendor-misc';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        // Ignore shallow-cloned Git repositories cached by /api/repo/scan
        // so Vite never watches the clone or reloads on its files.
        ignored: ['**/.repo-cache/**'],
      },
    },
  };
});
