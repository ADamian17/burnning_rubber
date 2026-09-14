import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SettingsStore } from "./useSettings.types";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./useSettings.utils";

const useSettings = create(
	persist<SettingsStore>(
		(set) => ({
			...DEFAULT_SETTINGS,
			toggle: (flag) => set((state) => ({ [flag]: !state[flag] })),
			reset: () => set(() => ({ ...DEFAULT_SETTINGS })),
		}),
		{
			name: SETTINGS_KEY,
		},
	),
);

export default useSettings;
