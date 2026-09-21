import { useNavigate } from "react-router-dom";
import CoinPlate from "../../components/Plate/CoinPlate";
import Wordmark from "../../components/Wordmark/Wordmark";
import Button from "../../ui/buttons/Button/Button";
import Plate from "../../ui/hud/Plate/Plate";
import { usePlayerStore } from "../../store/player/usePlayerStore";

/**
 * Where a run starts from, and the way into everything else.
 *
 * PLAY is deliberately oversized against the secondary buttons: on a phone the
 * thumb lands there without aiming, and everything else is a detour.
 */
const MainMenu = () => {
  const navigate = useNavigate();
  const best = usePlayerStore((state) => state.best);
  const coins = usePlayerStore((state) => state.coins);

  return (
    <>
      <div className="menu__strip">
        <Plate className="menu__best">
          <div className="lbl">BEST</div>
          <div className="num" style={{ color: "var(--lite)", fontSize: "22px" }}>
            {best.toLocaleString()}
          </div>
        </Plate>
        <CoinPlate coins={coins} />
      </div>

      <Wordmark />

      <div className="menu__actions">
        {/* oversized against the rest: on a phone the thumb lands here without
            aiming, and everything else is a detour */}
        <Button data-play onClick={() => navigate("/run")} style={{ fontSize: "40px", height: "88px" }}>
          PLAY
        </Button>
        <div className="menu__row">
          <Button data-go="garage" onClick={() => navigate("/garage")} variant="secondary">
            GARAGE
          </Button>
          <Button data-go="shop" onClick={() => navigate("/shop")} variant="secondary">
            SHOP
          </Button>
        </div>
        <div className="menu__row">
          <Button data-go="daily" onClick={() => navigate("/daily")} variant="secondary">
            DAILY
          </Button>
          <Button data-go="settings" onClick={() => navigate("/settings")} variant="secondary">
            SETTINGS
          </Button>
        </div>
        <Button
          data-go="credits"
          onClick={() => navigate("/credits")}
          style={{ fontSize: "17px", height: "48px" }}
          variant="secondary"
        >
          CREDITS
        </Button>
      </div>
    </>
  );
};

export default MainMenu;
