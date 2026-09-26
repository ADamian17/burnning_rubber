import { useNavigate } from "react-router-dom";
import Coin from "../../components/Coin/Coin";
import ScreenHeader from "../../components/ScreenHeader/ScreenHeader";
import Section from "../../components/Section/Section";
import SectionTitle from "../../components/SectionTitle/SectionTitle";
import {
  challengeFor,
  dayKey,
  secondsUntilNextDay,
  seedForDay,
} from "./challenge";
import { usePlayerStore } from "../../store/player/usePlayerStore";
import Button from "../../ui/buttons/Button/Button";

/** "9H 12M", as the artboard writes it. */
const untilNext = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}H ${minutes}M` : `${minutes}M`;
};

/**
 * Today's challenge, the same one for everybody.
 *
 * The day is carried to the run as location state rather than stored anywhere:
 * it is true for one navigation. A retry from the summary goes to /run with no
 * state, so it is an ordinary run rather than a second attempt at the same seed.
 */
const Daily = () => {
  const navigate = useNavigate();
  const daily = usePlayerStore((state) => state.daily);

  const key = dayKey();
  const challenge = challengeFor(key);
  const done = daily.lastDone === key;
  // four digits of the seed, as the artboard labels it: enough for two players
  // to check they are on the same road, short enough to read aloud
  const badge = String(seedForDay(key) % 10000).padStart(4, "0");

  return (
    <>
      <ScreenHeader title="DAILY" />

      <Section>
        <SectionTitle>TODAY &middot; SEED {badge}</SectionTitle>
        <article className="shop__card">
          <div className="shop__head">
            <span className="shop__name">{challenge.name}</span>
            <span className="num shop__value">
              <Coin /> {challenge.reward}
            </span>
          </div>
          <p className="shop__note">{challenge.note}</p>
          <div className="shop__foot">
            <span className="shop__level">STREAK {daily.streak}</span>
            <span className="shop__level">
              NEXT IN {untilNext(secondsUntilNextDay())}
            </span>
          </div>

          {done ? (
            <Button disabled>DONE TODAY</Button>
          ) : (
            <Button data-daily onClick={() => navigate("/run", { state: { day: key } })}>
              RUN IT
            </Button>
          )}
        </article>
      </Section>

      <p className="shop__intro">
        Everyone drives the same road today. One payout per day &mdash; the run
        still banks its coins either way.
      </p>
    </>
  );
};

export default Daily;
