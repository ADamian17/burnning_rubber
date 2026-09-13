import { beforeEach, describe, expect, it, vi } from "vitest";
import { revive } from "../../game/state";
import { playerStorage } from "./storage";

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
		await playerStorage.setItem("burning-rubber:save", { state: { save } });

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
		expect(read?.state.save.best).toBe(900);
		expect(read?.state.save.coins).toBe(12);
	});

	it("narrows what it reads rather than trusting it", async () => {
		// revive() has to stay on the read path: a tampered level would otherwise
		// hand out an effect nobody paid for
		store.set(
			"burning-rubber:save",
			JSON.stringify({ upgrades: { magnet: 99, shield: -3, slowmo: 1.8 } }),
		);

		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state.save.upgrades.magnet).toBeLessThanOrEqual(3);
		expect(read?.state.save.upgrades.shield).toBe(0);
		expect(read?.state.save.upgrades.slowmo).toBe(1);
	});

	it("survives a corrupt save instead of refusing to launch", async () => {
		store.set("burning-rubber:save", "{ not json");
		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state.save).toEqual(revive(null));
	});

	it("round-trips through a write and a read", async () => {
		const save = { ...revive(null), best: 31_337, coins: 5, onboarded: true };
		await playerStorage.setItem("burning-rubber:save", { state: { save } });
		const read = await playerStorage.getItem("burning-rubber:save");
		expect(read?.state.save).toEqual(save);
	});
});
