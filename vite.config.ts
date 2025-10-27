import { defineConfig } from 'vite';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  build: {
    target: 'node22',
    lib: {
      formats: ['es'],
      entry: 'src/index.ts',
      fileName: 'index',
    },
  },
  plugins: [
    externalizeDeps({
      include: ['vscode'],
    }),
  ],
});
