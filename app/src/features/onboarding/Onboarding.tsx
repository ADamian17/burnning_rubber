import { useNavigate } from "react-router-dom";
import straycat from "../../assets/cars/straycat.svg";
import Button from "../../ui/buttons/Button/Button";
import { usePlayerStore } from "../../store/player/usePlayerStore";

/**
 * Shown once, before the first run.
 *
 * The demo shows a car following a finger rather than describing it, because
 * the control is a relative drag and that is not the obvious thing: the hand
 * rests low and wide of the car, not on it. An earlier version of this screen
 * described a car it did not draw.
 */
const Onboarding = () => {
  const navigate = useNavigate();
  const completeOnboarding = usePlayerStore((state) => state.completeOnboarding);

  const done = () => {
    completeOnboarding();
    navigate("/menu", { replace: true });
  };

  return (
    <>
      <div className="onboard__eyebrow">HOW IT WORKS</div>
      <h1 className="onboard__title">DRAG TO STEER</h1>

      <div className="onboard__demo">
        <div className="onboard__lane" />
        <div className="onboard__lane" style={{ left: "50%" }} />
        <div className="onboard__lane" style={{ left: "75%" }} />
        <img alt="" className="onboard__car" src={straycat} />
        <div className="onboard__finger" />
        <div className="onboard__zone">THUMB ZONE &mdash; BOTTOM 35%</div>
      </div>

      <p className="onboard__copy">
        Hold your thumb anywhere near the bottom and slide. The car tracks your
        finger &mdash; no buttons, no lifting off.
      </p>

      <div className="garage__actions">
        <Button data-done onClick={done}>
          GOT IT
        </Button>
      </div>
    </>
  );
};

export default Onboarding;
