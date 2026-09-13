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
    },
    /*
     * The device the game is actually played on.
     *
     * 393x852 is the design canvas, and the iPhone XS used for every device
     * test is 375x812 — 18pt narrower and 40pt shorter. Snapshots taken only at
     * the design size would go green while the screen in hand looked wrong, so
     * the layout suites run at both. Behaviour tests stay on one: they assert
     * where a tap goes, which does not change with the viewport.
     */
    {
      name: 'iphone-xs',
      testMatch: /snapshots\.spec\.ts/,
      use: { ...devices['iPhone XR'], viewport: { width: 375, height: 812 } }
    }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
