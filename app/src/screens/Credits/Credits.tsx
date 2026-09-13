import Screen from "../../components/Screen/Screen";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";

interface Credit {
  label: string;
  note: string;
  value: string;
  /** Draws the value in red — for anything that is not settled yet. */
  warn?: boolean;
}

/**
 * The audio line is deliberately loud.
 *
 * It says NEEDS LICENSING in red because no audio ships, and the original
 * files were removed for unclear licensing. A credits screen that quietly
 * omitted it would be the easiest place for that to be forgotten.
 */
const CREDITS: readonly Credit[] = [
  {
    label: "BUILT BY",
    note: "Design, code, and the original 2019 game",
    value: "Adonis D Martin",
  },
  {
    label: "VEHICLE ART",
    note: "Nine chassis drawn as SVG",
    value: "Original to this game",
  },
  {
    label: "DISPLAY TYPE",
    note: "Google Fonts · SIL OFL 1.1",
    value: "Underdog",
  },
  {
    label: "INTERFACE TYPE",
    note: "Google Fonts · SIL OFL 1.1",
    value: "Outfit",
  },
  {
    label: "AUDIO",
    note: "Must be sourced before release",
    value: "[NEEDS LICENSING]",
    warn: true,
  },
];

const Credits = () => {
  return (
    <Screen>
      <ScreenHeader title="CREDITS" />

      <div className="section" style={{ gap: "11px" }}>
        {CREDITS.map(({ label, note, value, warn }) => (
          <div className="row row--stacked" key={label}>
            <div className="lbl">{label}</div>
            <div className={`row__value${warn ? " row__value--warn" : ""}`}>
              {value}
            </div>
            <div className="row__note">{note}</div>
          </div>
        ))}
      </div>

      <p className="settings__version">© 2026 ADONIS D MARTIN</p>
    </Screen>
  );
};

export default Credits;
