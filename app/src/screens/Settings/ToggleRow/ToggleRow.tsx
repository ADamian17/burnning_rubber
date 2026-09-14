import clsx from "clsx";
import useSettings from "../../../store/settings/useSettings";
import type { SettingsState } from "../../../store/settings/useSettings.types";
import Toggle from "../../../ui/controls/Toggle/Toggle";
import styles from "./ToggleRow.module.scss";

export interface ToggleRowProps {
  flag: keyof SettingsState;
  label: string;
  on: boolean;
}

/**
 * A labelled switch.
 *
 * The label dims when off, so the row's state reads without having to look at
 * the knob — which matters at a glance, where the switch is the smaller signal.
 *
 * It reaches into the settings store itself rather than taking an `onChange`,
 * because every row here toggles exactly one flag and threading three identical
 * handlers through the screen would say nothing the `flag` prop does not. That
 * also keeps it out of `ui/` — this is bound to a store, so it is a piece of
 * the settings screen, not a piece of the kit.
 */
const ToggleRow = ({ flag, label, on }: ToggleRowProps) => {
  const toggle = useSettings((state) => state.toggle);

  return (
    <div className="row">
      <span className={clsx(styles.label, !on && styles.off)}>{label}</span>
      <Toggle
        data-toggle={flag}
        label={label}
        on={on}
        onChange={() => toggle(flag)}
      />
    </div>
  );
};

export default ToggleRow;
