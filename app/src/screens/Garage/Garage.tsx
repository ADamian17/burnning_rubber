import clsx from "clsx";
import { useState } from "react";
import Chevron from "../../components/Chevron/Chevron";
import Button from "../../ui/buttons/Button/Button";
import CarCard from "../../ui/cards/CarCard/CarCard";
import IconButton from "../../ui/buttons/IconButton/IconButton";
import CoinPlate from "../../components/Plate/CoinPlate";
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
    <>
      <ScreenHeader title="GARAGE">
        <CoinPlate coins={coins} />
      </ScreenHeader>

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
        <IconButton
          aria-label="Previous car"
          icon={<Chevron direction="left" />}
          onClick={() => step(-1)}
        />

        <CarCard
          klass={car.klass}
          laneRoom={LANE_WIDTH - car.width}
          name={car.name}
          ownership={owns}
          src={car.url}
          stats={[
            { name: "SPEED", value: car.speed },
            { name: "HANDLING", value: car.handling },
            { name: "GRIP", value: car.grip },
            { name: "SLIMNESS", value: slimness(car.width) },
          ]}
          width={car.width}
        />

        <IconButton
          aria-label="Next car"
          data-next
          icon={<Chevron direction="right" />}
          onClick={() => step(1)}
        />
      </div>

      <div className="garage__pager">
        {PLAYER_IDS.map((carId, i) => (
          <span
            className={clsx("garage__dot", i === index && "garage__dot--on")}
            key={carId}
          />
        ))}
      </div>

      <div className="garage__actions">
        {owns === "equipped" ? (
          <Button disabled>EQUIPPED</Button>
        ) : owns === "owned" ? (
          <Button data-equip onClick={() => equip(id)}>
            EQUIP
          </Button>
        ) : shortfall <= 0 ? (
          <Button data-buy onClick={() => buyCar(id)}>
            BUY <Coin /> {car.cost.toLocaleString()}
          </Button>
        ) : (
          <Button disabled>
            BUY <Coin /> {car.cost.toLocaleString()}
          </Button>
        )}
        {owns === "locked" && shortfall > 0 ? (
          <p className="garage__short">{shortfall.toLocaleString()} COINS SHORT</p>
        ) : null}
      </div>
    </>
  );
};

export default Garage;
