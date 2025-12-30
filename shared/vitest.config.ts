import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['data/**/__tests__/**/*.test.ts'],
    exclude: ['dist/**']
  }
});
