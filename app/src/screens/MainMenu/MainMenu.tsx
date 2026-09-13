import { useNavigate } from "react-router-dom";
import CoinPlate from "../../components/Plate/CoinPlate";
import Wordmark from "../../components/Wordmark/Wordmark";
import { usePlayerStore } from "../../store/player/usePlayerStore";

/**
 * Where a run starts from, and the way into everything else.
 *
 * PLAY is deliberately oversized against the secondary buttons: on a phone the
 * thumb lands there without aiming, and everything else is a detour.
 */
const MainMenu = () => {
  const navigate = useNavigate();
  const best = usePlayerStore((state) => state.save.best);
  const coins = usePlayerStore((state) => state.save.coins);

  return (
    <>
      <div className="menu__strip">
        <div className="plate menu__best">
          <div className="lbl">BEST</div>
          <div className="num" style={{ color: "var(--lite)", fontSize: "22px" }}>
            {best.toLocaleString()}
          </div>
        </div>
        <CoinPlate coins={coins} />
      </div>

      <Wordmark />

      <div className="menu__actions">
        <button
          className="btn btn--primary"
          onClick={() => navigate("/run")}
          style={{ fontSize: "40px", height: "88px" }}
          type="button"
        >
          PLAY
        </button>
        <div className="menu__row">
          <button className="btn btn--secondary" onClick={() => navigate("/garage")} type="button">
            GARAGE
          </button>
          <button className="btn btn--secondary" onClick={() => navigate("/shop")} type="button">
            SHOP
          </button>
        </div>
        <div className="menu__row">
          <button className="btn btn--secondary" onClick={() => navigate("/daily")} type="button">
            DAILY
          </button>
          <button className="btn btn--secondary" onClick={() => navigate("/settings")} type="button">
            SETTINGS
          </button>
        </div>
        <button
          className="btn btn--secondary"
          onClick={() => navigate("/credits")}
          style={{ fontSize: "17px", height: "48px" }}
          type="button"
        >
          CREDITS
        </button>
      </div>
    </>
  );
};

export default MainMenu;
