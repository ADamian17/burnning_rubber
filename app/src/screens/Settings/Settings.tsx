import { useNavigate } from "react-router-dom";
import Screen from "../../components/Screen/Screen";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";
import { usePlayerStore } from "../../store/player/usePlayerStore";
import type { Flag } from "../../store/player/usePlayerStore.types";

interface ToggleProps {
  flag: Flag;
  label: string;
  on: boolean;
}

/** A labelled switch. The label dims when off, so state reads without the knob. */
const ToggleRow = ({ flag, label, on }: ToggleProps) => {
  const toggle = usePlayerStore((state) => state.toggle);

  return (
    <div className="row">
      <span className={`row__label${on ? "" : " row__label--off"}`}>{label}</span>
      <button
        aria-checked={on}
        aria-label={label}
        className={`sw${on ? " sw--on" : ""}`}
        data-toggle={flag}
        onClick={() => toggle(flag)}
        role="switch"
        type="button"
      >
        <span className="sw__knob" />
      </button>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { haptics, music, sfx } = usePlayerStore((state) => state.save);

  return (
    <Screen>
      <ScreenHeader title="SETTINGS" />

      <div className="section">
        <div className="section__title">AUDIO &amp; FEEL</div>
        <ToggleRow flag="music" label="MUSIC" on={music} />
        <ToggleRow flag="sfx" label="SOUND FX" on={sfx} />
        <ToggleRow flag="haptics" label="HAPTICS" on={haptics} />
        <p className="section__note">
          No audio ships yet &mdash; the original files had unclear licensing and
          were removed.
        </p>
      </div>

      <div className="section">
        <div className="section__title">STEERING</div>
        <p className="section__note">
          Touch anywhere and drag. The car moves as far as your thumb does, so you
          can hold low and wide of it and still see the road ahead.
        </p>
      </div>

      <div className="settings__danger">
        <button
          className="btn btn--danger"
          data-reset
          onClick={() => navigate("reset")}
          type="button"
        >
          RESET PROGRESS
        </button>
        <p className="settings__version">BURNING RUBBER &middot; V2.0.0</p>
      </div>
    </Screen>
  );
};

export default Settings;
