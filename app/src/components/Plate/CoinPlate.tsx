import Plate from "../../ui/hud/Plate/Plate";
import Coin from "../Coin/Coin";

interface Props {
  coins: number;
}

/** The coin balance, as it appears in a header or the menu strip. */
const CoinPlate = ({ coins }: Props) => {
  return (
    <Plate className="garage__coins">
      <Coin />
      <span className="num" style={{ color: "var(--gold)", fontSize: "19px" }}>
        {coins.toLocaleString()}
      </span>
    </Plate>
  );
};

export default CoinPlate;
