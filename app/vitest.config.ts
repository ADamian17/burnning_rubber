import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // e2e/ belongs to Playwright; vitest owns the invariant tests in src/
    include: ['src/**/*.test.ts']
  }
});
