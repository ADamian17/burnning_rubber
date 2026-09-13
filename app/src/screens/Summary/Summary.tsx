import { useNavigate } from "react-router-dom";
import Screen from "../../components/Screen/Screen";
import { usePlayerStore } from "../../store/player/usePlayerStore";

/**
 * What the last run came to.
 *
 * RETRY goes to /run with no state, which is deliberately an *ordinary* run:
 * retrying a daily would otherwise be a second attempt at the same seed.
 */
const Summary = () => {
  const navigate = useNavigate();
  const best = usePlayerStore((state) => state.save.best);
  const last = usePlayerStore((state) => state.save.lastRun);

  const run = last ?? {
    bestCombo: 1,
    coins: 0,
    distance: 0,
    isBest: false,
    score: 0,
  };

  return (
    <Screen>
      <h1 className="summary__title">WRECKED!</h1>
      {run.isBest ? <div className="summary__badge">NEW BEST!</div> : null}

      <div className="summary__score">
        <div className="lbl">FINAL SCORE</div>
        <div className="summary__value">
          {Math.floor(run.score).toLocaleString()}
        </div>
        <div className="summary__best">BEST {best.toLocaleString()}</div>
      </div>

      <div className="section">
        <div className="row">
          <span className="lbl">DISTANCE</span>
          <span className="num" style={{ fontSize: "22px" }}>
            {(run.distance / 1000).toFixed(2)} KM
          </span>
        </div>
        <div className="row">
          <span className="lbl">COINS EARNED</span>
          <span className="num" style={{ color: "var(--gold)", fontSize: "22px" }}>
            +{run.coins}
          </span>
        </div>
        <div className="row">
          <span className="lbl">BEST COMBO</span>
          <span className="num" style={{ color: "var(--orange)", fontSize: "22px" }}>
            ×{run.bestCombo}
          </span>
        </div>
      </div>

      <div className="garage__actions">
        <button className="btn btn--primary" onClick={() => navigate("/run")} type="button">
          RETRY
        </button>
        <div className="menu__row">
          <button className="btn btn--secondary" onClick={() => navigate("/garage")} type="button">
            GARAGE
          </button>
          <button className="btn btn--secondary" onClick={() => navigate("/menu")} type="button">
            MENU
          </button>
        </div>
      </div>
    </Screen>
  );
};

export default Summary;
