import { useState } from "react";
import Chevron from "../../components/Chevron/Chevron";
import Meter from "../../components/Meter/Meter";
import CoinPlate from "../../components/Plate/CoinPlate";
import Screen from "../../components/Screen/Screen";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";
import { LANE_WIDTH } from "../../game/constants";
import { PLAYERS, PLAYER_IDS, slimness } from "../../game/fleet";
import { usePlayerStore } from "../../store/player/usePlayerStore";
import Coin from "../../components/Coin/Coin";

/**
 * Car select.
 *
 * The screen's job is to make width legible as a trade. Speed, handling and
 * grip are authored stats; SLIMNESS is derived from width, and LANE ROOM
 * restates it as the concrete thing it buys — points of clearance either side
 * in a 98pt lane. A wide car is genuinely harder to drive, and this is where
 * the player is told so before they spend coins finding out.
 *
 * The carousel index is local state, initialised to the equipped car. It used
 * to be a module variable with an exported setter, purely because re-rendering
 * a template string destroyed it — mounting on route entry does that job now.
 */
const Garage = () => {
  const { coins, equipped, owned } = usePlayerStore((state) => state.save);
  const buyCar = usePlayerStore((state) => state.buyCar);
  const equip = usePlayerStore((state) => state.equip);

  const [index, setIndex] = useState(() =>
    Math.max(0, PLAYER_IDS.indexOf(equipped)),
  );
  const step = (delta: number) =>
    setIndex((i) => (i + delta + PLAYER_IDS.length) % PLAYER_IDS.length);

  const id = PLAYER_IDS[index];
  const car = PLAYERS[id];
  const owns = equipped === id ? "equipped" : owned.includes(id) ? "owned" : "locked";
  const shortfall = car.cost - coins;

  let startX = 0;

  return (
    <Screen>
      <ScreenHeader title="GARAGE">
        <CoinPlate coins={coins} />
      </ScreenHeader>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: swipe augments the arrows */}
      <div
        className="garage__stage"
        onPointerDown={(event) => {
          startX = event.clientX;
        }}
        onPointerUp={(event) => {
          const dx = event.clientX - startX;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
      >
        <button
          aria-label="Previous car"
          className="icon-btn"
          onClick={() => step(-1)}
          type="button"
        >
          <Chevron direction="left" />
        </button>

        <article className="garage__card">
          <span className={`chip chip--${owns}`}>{owns.toUpperCase()}</span>
          <div className="garage__art-box">
            <img
              alt={car.name}
              className={`garage__art${owns === "locked" ? " garage__art--locked" : ""}`}
              src={car.url}
            />
          </div>
          <h1 className="garage__name">{car.name}</h1>
          <p className="garage__class">
            {car.klass} &middot; {car.width}PT
          </p>

          <div className="garage__stats">
            {(
              [
                ["SPEED", car.speed],
                ["HANDLING", car.handling],
                ["GRIP", car.grip],
                ["SLIMNESS", slimness(car.width)],
              ] as const
            ).map(([name, value]) => (
              <div className="garage__stat" key={name}>
                <span className="garage__stat-name">{name}</span>
                <Meter value={value} />
              </div>
            ))}
          </div>

          <div className="plate garage__slack">
            <span className="lbl">LANE ROOM</span>
            <span className="num" style={{ color: "var(--lite)", fontSize: "18px" }}>
              {(LANE_WIDTH - car.width).toFixed(1)}PT
            </span>
          </div>
        </article>

        <button
          aria-label="Next car"
          className="icon-btn"
          onClick={() => step(1)}
          type="button"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div className="garage__pager">
        {PLAYER_IDS.map((carId, i) => (
          <span
            className={`garage__dot${i === index ? " garage__dot--on" : ""}`}
            key={carId}
          />
        ))}
      </div>

      <div className="garage__actions">
        {owns === "equipped" ? (
          <div className="btn btn--primary btn--disabled">EQUIPPED</div>
        ) : owns === "owned" ? (
          <button className="btn btn--primary" data-equip onClick={() => equip(id)} type="button">
            EQUIP
          </button>
        ) : shortfall <= 0 ? (
          <button className="btn btn--primary" data-buy onClick={() => buyCar(id)} type="button">
            BUY <Coin /> {car.cost.toLocaleString()}
          </button>
        ) : (
          <div className="btn btn--primary btn--disabled">
            BUY <Coin /> {car.cost.toLocaleString()}
          </div>
        )}
        {owns === "locked" && shortfall > 0 ? (
          <p className="garage__short">{shortfall.toLocaleString()} COINS SHORT</p>
        ) : null}
      </div>
    </Screen>
  );
};

export default Garage;
