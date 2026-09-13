import { useNavigate } from "react-router-dom";
import Wordmark from "../../components/Wordmark/Wordmark";
import { usePlayerStore } from "../../store/player/usePlayerStore";

/**
 * The title screen. Tap anywhere to go in.
 *
 * Where "in" leads depends on whether the player has been through onboarding —
 * which is why the whole screen is the target rather than a button: there is
 * only one thing to do here, and a button would imply there were others.
 *
 * A div rather than a real <button>, because `.screen` sets the layout and a
 * button's own border, padding and font would fight it — the visual baselines
 * are what prove this refactor changed nothing, so the element stays as drawn.
 * The role, tabIndex and key handler give it the keyboard access the original
 * div never had.
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
      className="screen screen--centred"
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
      <div className="glow" />
      <Wordmark scale={1.15} />
      <p className="splash__hint">TAP TO START</p>
    </button>
  );
};

export default Splash;
