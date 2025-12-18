import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node20',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'fastify',
        '@fastify/cors',
        '@fastify/websocket',
        'ws',
        'uuid',
        'fs',
        'fs/promises',
        'path',
        'child_process',
        'url',
      ],
    },
    outDir: 'dist',
    emptyOutDir: true,
    ssr: true,
  },
});
