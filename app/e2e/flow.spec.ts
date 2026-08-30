import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end tests, run at 393x852 — the viewport the game was designed for.
 *
 * These exist because the invariant tests in src/ cannot see a screen. Every
 * assertion here corresponds to something that was found by driving the app by
 * hand, and each one took minutes to find that way. The two bugs those manual
 * sessions caught that unit tests could not — a pause that did not pause, and
 * a demo missing the car it described — are both covered below.
 */

const SAVE_KEY = 'CapacitorStorage.burning-rubber:save';

interface Save {
  best: number;
  coins: number;
  control: string;
  equipped: string;
  haptics: boolean;
  lastRun: null;
  music: boolean;
  onboarded: boolean;
  owned: string[];
  sfx: boolean;
}

const save = (patch: Partial<Save> = {}): Save => ({
  best: 0,
  coins: 0,
  control: 'drag',
  equipped: 'straycat',
  haptics: true,
  lastRun: null,
  music: true,
  onboarded: true,
  owned: ['straycat'],
  sfx: true,
  ...patch
});

/** Seed storage before the app boots, so the first render already sees it. */
const boot = async (page: Page, state: Partial<Save> = {}): Promise<void> => {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [SAVE_KEY, JSON.stringify(save(state))] as const
  );
  await page.goto('/');
};

const state = (page: Page) => page.evaluate(() => window.__br);

test.describe('first launch', () => {
  test('splash leads to onboarding, which shows the car it describes', async ({ page }) => {
    await boot(page, { onboarded: false });

    await expect(page.locator('.wordmark__bottom')).toHaveText('RUBBER');
    await page.locator('.screen--centred').click();

    await expect(page.locator('.onboard__title')).toHaveText('DRAG TO STEER');
    // the copy promises "the car tracks your finger" — it shipped once with
    // only lanes and a finger, teaching nothing
    await expect(page.locator('.onboard__car')).toBeVisible();
    await expect(page.locator('.onboard__finger')).toBeVisible();

    await page.getByRole('button', { name: 'GOT IT' }).click();
    await expect(page.locator('.menu__actions')).toBeVisible();
  });

  test('onboarding is skipped once dismissed', async ({ page }) => {
    await boot(page, { onboarded: true });
    await page.locator('.screen--centred').click();
    await expect(page.locator('.menu__actions')).toBeVisible();
  });
});

test.describe('garage', () => {
  test('opens on the equipped car, not the first one', async ({ page }) => {
    // hatpin is index 2 of 4, so passing by coincidence is not possible
    await boot(page, { equipped: 'hatpin', owned: ['straycat', 'hatpin'] });
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'GARAGE' }).click();

    await expect(page.locator('.garage__name')).toHaveText('HATPIN');
    await expect(page.locator('.chip')).toHaveText('EQUIPPED');
  });

  test('keeps the carousel arrows still between cars', async ({ page }) => {
    // the card used to size itself to each car's aspect ratio, swinging 143px
    // and moving the button out from under a repeat tap
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'GARAGE' }).click();

    const next = page.locator('[data-next]');
    const tops: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const box = await next.boundingBox();
      tops.push(box?.y ?? -1);
      await next.click();
    }
    const drift = Math.max(...tops) - Math.min(...tops);
    expect(drift).toBeLessThan(12);
  });

  test('buying deducts, equips, and celebrates', async ({ page }) => {
    await boot(page, { coins: 700 });
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'GARAGE' }).click();

    while ((await page.locator('.garage__name').textContent())?.trim() !== 'HATPIN') {
      await page.locator('[data-next]').click();
    }
    await page.locator('[data-buy]').click();

    await expect(page.locator('.overlay')).toBeVisible();
    await expect(page.locator('.summary__badge')).toHaveText('UNLOCKED!');

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.coins).toBe(100);
    expect(saved.owned).toContain('hatpin');
    expect(saved.equipped).toBe('hatpin');
  });

  test('refuses a car it cannot afford', async ({ page }) => {
    await boot(page, { coins: 0 });
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'GARAGE' }).click();
    while ((await page.locator('.garage__name').textContent())?.trim() !== 'HATPIN') {
      await page.locator('[data-next]').click();
    }
    await expect(page.locator('.garage__short')).toContainText('COINS SHORT');
    await expect(page.locator('[data-buy]')).toHaveCount(0);
  });
});

test.describe('a run', () => {
  test('holds traffic back during the countdown', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'PLAY' }).click();

    await expect.poll(() => state(page).then((s) => s?.counting)).toBe(true);
    // nothing may hit the player before they have had a moment to look
    expect((await state(page))?.crashed).toBe(false);

    await expect
      .poll(() => state(page).then((s) => s?.counting), { timeout: 6000 })
      .toBe(false);
  });

  test('pausing stops the simulation, resuming restarts it', async ({ page }) => {
    // this shipped broken: the loop was only halted on route changes, and an
    // overlay is not a route change, so you could crash while paused
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'PLAY' }).click();
    await expect.poll(() => state(page).then((s) => s?.counting), { timeout: 6000 }).toBe(false);

    await page.locator('[data-pause]').click();
    await expect(page.locator('.overlay')).toBeVisible();

    const frozen = (await state(page))?.distance ?? 0;
    await page.waitForTimeout(1500);
    expect((await state(page))?.distance).toBe(frozen);

    await page.getByRole('button', { name: 'RESUME' }).click();
    await page.waitForTimeout(800);
    expect((await state(page))?.distance).toBeGreaterThan(frozen);
  });

  test('crashing routes to a summary carrying the run', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'PLAY' }).click();

    await expect.poll(() => state(page).then((s) => s?.route), { timeout: 40_000 }).toBe('summary');
    await expect(page.locator('.summary__title')).toHaveText('WRECKED!');

    const shown = Number((await page.locator('.summary__value').textContent())?.replace(/\D/g, ''));
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(shown).toBe(saved.lastRun.score);
    expect(saved.best).toBe(saved.lastRun.score);
  });
});

test.describe('settings', () => {
  test('persists a toggle', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'SETTINGS' }).click();

    await page.locator('[data-toggle="music"]').click();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.music).toBe(false);
  });

  test('cancelling the reset keeps everything', async ({ page }) => {
    // the one irreversible action in the game; cancel has to actually cancel
    await boot(page, { best: 4200, coins: 900, owned: ['straycat', 'hatpin'] });
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'SETTINGS' }).click();
    await page.getByRole('button', { name: 'RESET PROGRESS' }).click();

    await expect(page.locator('.overlay__warn')).toHaveText('THIS CANNOT BE UNDONE');
    await page.getByRole('button', { name: 'KEEP MY PROGRESS' }).click();

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.best).toBe(4200);
    expect(saved.coins).toBe(900);
    expect(saved.owned).toContain('hatpin');
  });

  test('confirming the reset wipes', async ({ page }) => {
    await boot(page, { best: 4200, coins: 900, owned: ['straycat', 'hatpin'] });
    await page.locator('.screen--centred').click();
    await page.getByRole('button', { name: 'SETTINGS' }).click();
    await page.getByRole('button', { name: 'RESET PROGRESS' }).click();
    await page.getByRole('button', { name: 'RESET EVERYTHING' }).click();

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), SAVE_KEY);
    expect(saved.best).toBe(0);
    expect(saved.coins).toBe(0);
    expect(saved.owned).toEqual(['straycat']);
  });
});

test.describe('layout at 393x852', () => {
  test('never scrolls horizontally on any screen', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();

    for (const name of ['GARAGE', 'SHOP', 'DAILY', 'SETTINGS', 'CREDITS']) {
      await page.getByRole('button', { name }).click();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${name} overflows horizontally`).toBeLessThanOrEqual(0);
      await page.locator('[data-back]').click();
    }
  });

  test('keeps the primary action clear of the safe area', async ({ page }) => {
    await boot(page);
    await page.locator('.screen--centred').click();

    const play = await page.getByRole('button', { name: 'PLAY' }).boundingBox();
    const viewport = page.viewportSize();
    expect(play).not.toBeNull();
    // the button must be fully on screen, not clipped by the bottom edge
    expect((play?.y ?? 0) + (play?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);
    // and hit at least the 44pt minimum
    expect(play?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
