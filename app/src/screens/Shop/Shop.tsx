import Coin from "../../components/Coin/Coin";
import Meter from "../../components/Meter/Meter";
import CoinPlate from "../../components/Plate/CoinPlate";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";
import {
  UPGRADES,
  UPGRADE_IDS,
  effectOf,
  maxLevel,
  nextCost,
  type UpgradeId,
} from "../../game/upgrades";
import { usePlayerStore } from "../../store/player/usePlayerStore";
import type { UpgradeLevels } from "../../game/upgrades";

interface CardProps {
  coins: number;
  id: UpgradeId;
  levels: UpgradeLevels;
}

/**
 * One upgrade, priced at its next level.
 *
 * Borrows the garage's three-way action — owned, affordable, or short — because
 * the player has already learnt what those buttons mean there. The
 * insufficient-coins state names the shortfall instead of greying out silently,
 * which tells them nothing.
 */
const UpgradeCard = ({ coins, id, levels }: CardProps) => {
  const buyUpgrade = usePlayerStore((state) => state.buyUpgrade);
  const spec = UPGRADES[id];
  const level = levels[id];
  const cost = nextCost(id, level);
  const value = effectOf(id, levels);
  const short = cost === null ? 0 : cost - coins;

  return (
    <article className="shop__card">
      <div className="shop__head">
        <span className="shop__name">{spec.label}</span>
        <span className="num shop__value">
          {value % 1 === 0 ? value : value.toFixed(1)}
          {spec.unit}
        </span>
      </div>
      <p className="shop__note">{spec.note}</p>
      <div className="shop__foot">
        <Meter value={level} />
        <span className="shop__level">
          LV {level}/{maxLevel(id)}
        </span>
      </div>

      {cost === null ? (
        <div className="btn btn--primary btn--disabled">MAXED</div>
      ) : short <= 0 ? (
        <button
          className="btn btn--primary"
          data-upgrade={id}
          onClick={() => buyUpgrade(id)}
          type="button"
        >
          BUY <Coin /> {cost.toLocaleString()}
        </button>
      ) : (
        <div className="btn btn--primary btn--disabled">
          <Coin /> {short.toLocaleString()} SHORT
        </div>
      )}
    </article>
  );
};

const Shop = () => {
  const coins = usePlayerStore((state) => state.save.coins);
  const upgrades = usePlayerStore((state) => state.save.upgrades);

  return (
    <>
      <ScreenHeader title="SHOP">
        <CoinPlate coins={coins} />
      </ScreenHeader>

      <p className="shop__intro">
        Power-ups are found on the road. These make the ones you find worth more.
      </p>

      <div className="shop__grid">
        {UPGRADE_IDS.map((id) => (
          <UpgradeCard coins={coins} id={id} key={id} levels={upgrades} />
        ))}
      </div>
    </>
  );
};

export default Shop;
