export interface SettingsState {
  haptics: boolean;
  music: boolean;
  sfx: boolean;
}

interface SettingsActions {
  toggle: (flag: keyof SettingsState) => void;
  reset: () => void;
}

export type SettingsStore = SettingsActions & SettingsState;
