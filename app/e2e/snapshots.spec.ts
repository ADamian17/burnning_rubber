import { expect, test, type Page } from '@playwright/test';

/**
 * Visual snapshots of every screen.
 *
 * flow.spec.ts asserts behaviour — where a tap goes, what survives a reload.
 * Nothing there can see a layout, so a CSS change can wreck a screen and the
 * whole suite stays green. That is what these are for.
 *
 * Three things have to be nailed down or every run is a diff:
 *
 *   1. STATE. Every screenshot boots from a fixed save, so scores, coins and
 *      streaks are the same numbers every time. A real `best` in the menu is a
 *      guaranteed flake.
 *   2. MOTION. The onboarding demo sweeps on an infinite CSS animation, and the
 *      run is a canvas driven by requestAnimationFrame. Playwright freezes the
 *      first; the second is stepped to an exact frame through the debug seam.
 *   3. FONTS. Underdog and Outfit arrive over the network, and a screenshot
 *      taken before they land is a different picture on a cold checkout.
 */

const SAVE_KEY = 'CapacitorStorage.burning-rubber:save';

/**
 * A fixed save with enough in it to fill every screen.
 *
 * Coins sit above the priciest thing on sale so the shop and garage both render
 * their affordable state; a short save would snapshot nothing but SHORT buttons.
 */
const SAVE = {
  best: 12_480,
  coins: 2_600,
  control: 'drag',
  daily: { lastDone: null, streak: 3 },
  equipped: 'straycat',
  haptics: true,
  lastRun: { bestCombo: 7, coins: 24, distance: 1_270, isBest: false, score: 8_140 },
  music: true,
  onboarded: true,
  owned: ['straycat', 'hatpin'],
  sfx: true,
  upgrades: { magnet: 1, shield: 2, slowmo: 0 }
};

/** The seed every run snapshot is taken on, so the road is the same road. */
const SEED = 424_242;

/**
 * Simulation steps before the run is frozen.
 *
 * Past the 3s countdown (180 steps) with a second of traffic on the road, and
 * short of the first collision. Nothing steers during those steps, so a car
 * parked in lane 1 eventually gets hit: at 420 this snapshot silently captured
 * the summary screen instead of the run, twice, and passed both times because
 * --update-snapshots writes whatever it is shown.
 */
const FREEZE_AT = 240;

const boot = async (page: Page, patch: Record<string, unknown> = {}): Promise<void> => {
  await page.addInitScript(
    ([key, value, seed, freezeAt]) => {
      window.localStorage.setItem(key as string, value as string);
      window.__brSeed = seed as number;
      window.__brFreezeAt = freezeAt as number;
    },
    [SAVE_KEY, JSON.stringify({ ...SAVE, ...patch }), SEED, FREEZE_AT] as const
  );
  await page.goto('/');
  // a screenshot taken before the display faces load is a different picture on
  // a cold checkout than on a warm one
  await page.evaluate(() => document.fonts.ready);
};

const shot = async (page: Page, name: string): Promise<void> => {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    /*
     * threshold is per pixel, and Playwright's default of 0.2 is far too loose
     * for a screen this dark. Removing the CRT scanline overlay outright —
     * every screen, a fifth of the pixels — changed nothing the comparison
     * could see, because 8% black over #0a0806 lands inside 0.2 in YIQ space.
     * The baselines still matched art that no longer existed.
     *
     * maxDiffPixelRatio then allows a small number of genuinely different
     * pixels, for antialiasing along the display face's edges.
     */
    maxDiffPixelRatio: 0.01,
    threshold: 0.05
  });
};

test.describe('screens', () => {
  test('splash', async ({ page }) => {
    await boot(page);
    await shot(page, 'splash');
  });

  test('onboarding', async ({ page }) => {
    await boot(page, { onboarded: false });
    await page.locator('.screen--centred').click();
    await shot(page, 'onboarding');
  });

  test('menu', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await shot(page, 'menu');
  });

  for (const [label, selector] of [
    ['garage', '[data-go="garage"]'],
    ['shop', '[data-go="shop"]'],
    ['daily', '[data-go="daily"]'],
    ['settings', '[data-go="settings"]'],
    ['credits', '[data-go="credits"]']
  ] as const) {
    test(label, async ({ page }) => {
      await boot(page);
      await page.locator('.screen--centred').click();
      await page.locator(selector).click();
      await shot(page, label);
    });
  }

  test('run, frozen on a fixed frame', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.locator('[data-play]').click();
    // proves the picture is the run and not the summary the crash routes to —
    // without this the snapshot happily records the wrong screen
    await expect(page.locator('.run-layer')).toBeVisible();
    await expect(page.locator('.overlay')).toHaveCount(0);
    await shot(page, 'run');
  });

  test('pause overlay', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.locator('[data-play]').click();
    await expect(page.locator('.run-layer')).toBeVisible();
    await page.locator('[data-pause]').click();
    await expect(page.locator('.overlay')).toBeVisible();
    await shot(page, 'pause');
  });

  test('reset confirmation overlay', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.locator('[data-go="settings"]').click();
    await page.locator('[data-reset]').click();
    await shot(page, 'reset-confirm');
  });
});
