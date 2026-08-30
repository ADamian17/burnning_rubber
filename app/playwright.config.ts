import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end config.
 *
 * The viewport is the point. Everything about this game is designed against
 * 393x852 — lane widths, the thumb zone, safe-area padding — and running it
 * at a desktop window silently hides whether any of that holds. These tests
 * run at the size the design assumes.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'iphone',
      use: { ...devices['iPhone 13 Pro'] }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
