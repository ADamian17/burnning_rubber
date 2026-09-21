import { beforeEach, describe, expect, it, vi } from "vitest";
import { FRESH_UPGRADES, maxLevel } from "../../game/upgrades";
import { playerStorage, revive } from "./save";

const store = new Map<string, string>();

vi.mock("@capacitor/preferences", () => ({
	Preferences: {
		get: vi.fn(async ({ key }: { key: string }) => ({
			value: store.get(key) ?? null,
		})),
		remove: vi.fn(async ({ key }: { key: string }) => {
			store.delete(key);
		}),
		set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
			store.set(key, value);
		}),
	},
}));

/**
 * The on-disk contract.
 *
 * Every save that already exists — on devices, and seeded directly by both e2e
 * suites — is a bare `SaveState` object. Zustand's default `createJSONStorage`
 * writes a `{ state, version }` envelope instead, which would read back as
 * nothing and silently reset every returning player. These tests exist so that
 * swapping the engine out fails here rather than in someone's save file.
 */
beforeEach(() => store.clear());

describe("the player storage engine", () => {
	it("writes a bare SaveState, with no persist envelope", async () => {
		const save = { ...revive(null), best: 4200, coins: 77 };
		await playerStorage.setItem("burning-rubber:save", { state: save });

		const written = JSON.parse([...store.values()][0] as string);
		expect(written.best).toBe(4200);
		expect(written.coins).toBe(77);
		// the two keys an envelope would add
		expect(written).not.toHaveProperty("state");
		expect(written).not.toHaveProperty("version");
	});

	it("reads a bare SaveState written by the old code", async () => {
		// exactly what a device upgrading from the pre-React build has
		store.set(
			"burning-rubber:save",
			JSON.stringify({ ...revive(null), best: 900, coins: 12 }),
		);

		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state.best).toBe(900);
		expect(read?.state.coins).toBe(12);
	});

	it("narrows what it reads rather than trusting it", async () => {
		// revive() has to stay on the read path: a tampered level would otherwise
		// hand out an effect nobody paid for
		store.set(
			"burning-rubber:save",
			JSON.stringify({ upgrades: { magnet: 99, shield: -3, slowmo: 1.8 } }),
		);

		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state.upgrades.magnet).toBeLessThanOrEqual(3);
		expect(read?.state.upgrades.shield).toBe(0);
		expect(read?.state.upgrades.slowmo).toBe(1);
	});

	it("survives a corrupt save instead of refusing to launch", async () => {
		store.set("burning-rubber:save", "{ not json");
		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state).toEqual(revive(null));
	});

	it("round-trips through a write and a read", async () => {
		const save = { ...revive(null), best: 31_337, coins: 5, onboarded: true };
		await playerStorage.setItem("burning-rubber:save", { state: save });
		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state).toEqual(save);
	});
});

/*
 * These came from game/rules.test.ts, which could no longer import `revive`
 * once the save moved out of game/. They were always about narrowing rather
 * than about the rules they sat beside — what a tampered upgrade level clamps
 * to, what a junk run summary becomes — so they belong next to the code that
 * does it.
 */
describe('save narrowing', () => {
  it('survives junk instead of throwing', () => {
    for (const junk of [null, undefined, 42, 'nope', [], {}]) {
      expect(() => revive(junk)).not.toThrow();
    }
    expect(revive(null).equipped).toBe('straycat');
  });

  it('drops cars that no longer exist and never strands the player', () => {
    const save = revive({ owned: ['hatpin', 'delorean'], equipped: 'delorean', coins: 10 });
    expect(save.owned).not.toContain('delorean');
    expect(save.owned).toContain('straycat');
    // equipping a car you don't own would render an empty garage
    expect(save.owned).toContain(save.equipped);
  });

  it('drops a stored control scheme instead of carrying it forward', () => {
    // steering was a saved preference until tap-lanes and tilt were dropped.
    // it is a setting, not progress, so it left the save entirely — and an old
    // save holding one has to lose the key rather than preserve it
    for (const control of ['telepathy', 'tapLanes', 'tilt', 'drag']) {
      expect(revive({ control, best: 10 })).not.toHaveProperty('control');
      // and the rest of that save still survives the discard
      expect(revive({ control, best: 10 }).best).toBe(10);
    }
  });

});

describe('narrowing a run summary and upgrade levels', () => {
  it('defaults the combo on a run recorded before combos existed', () => {
    // a returning player's lastRun has no bestCombo; the summary must not
    // render "×undefined"
    const save = revive({ lastRun: { coins: 3, distance: 900, isBest: false, score: 400 } });
    expect(save.lastRun?.bestCombo).toBe(1);
  });

  it('keeps a junk run summary from reaching the screen', () => {
    expect(revive({ lastRun: 'nope' }).lastRun).toBeNull();
  });

  it('clamps a tampered save to levels the shop can sell', () => {
    // a level above the cap would hand out an effect nobody paid for, and a
    // fractional one feeds NaN into a power's duration
    const save = revive({ upgrades: { shield: 99, magnet: -4, slowmo: 1.7 } });
    expect(save.upgrades.shield).toBe(maxLevel('shield'));
    expect(save.upgrades.magnet).toBe(0);
    expect(save.upgrades.slowmo).toBe(1);
  });

  it('gives a save with no upgrades a full set at zero', () => {
    expect(revive({}).upgrades).toEqual(FRESH_UPGRADES);
    expect(revive({ upgrades: 'nope' }).upgrades).toEqual(FRESH_UPGRADES);
  });});
