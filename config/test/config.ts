import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(import.meta.dirname, './vscode.mock.ts'),
    },
  },
  test: {
    globals: true,
    restoreMocks: true,
  },
});
