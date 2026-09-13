import { useNavigate } from "react-router-dom";
import styles from "./Splash.module.scss";
import Wordmark from "../../components/Wordmark/Wordmark";
import { usePlayerStore } from "../../store/player/usePlayerStore";

/**
 * The title screen. Tap anywhere to go in.
 *
 * Where "in" leads depends on whether the player has been through onboarding —
 * which is why the whole screen is the target rather than a button: there is
 * only one thing to do here, and a button would imply there were others.
 *
 * The tap target is a real <button>, so the whole screen is reachable from a
 * keyboard. `Splash.module.scss` clears the control styling a button
 * brings with it — without that its own background paints over the ink and its
 * border draws a line round the whole screen.
 *
 * `replace` so the back gesture does not land back here after starting. It is
 * an entrance, not a place.
 */
const Splash = () => {
  const navigate = useNavigate();
  const onboarded = usePlayerStore((state) => state.save.onboarded);

  const enter = () =>
    navigate(onboarded ? "/menu" : "/onboarding", { replace: true });

  return (
    <button
      className={styles.tap}
      data-start
      onClick={enter}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enter();
        }
      }}
      type="button"
      tabIndex={0}
    >
      <Wordmark scale={1.15} />
      <p className="splash__hint">TAP TO START</p>
    </button>
  );
};

export default Splash;
