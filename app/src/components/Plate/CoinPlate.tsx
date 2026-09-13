import Coin from "../Coin/Coin";

interface Props {
  coins: number;
}

/** The coin balance, as it appears in a header or the menu strip. */
const CoinPlate = ({ coins }: Props) => {
  return (
    <div className="plate garage__coins">
      <Coin />
      <span className="num" style={{ color: "var(--gold)", fontSize: "19px" }}>
        {coins.toLocaleString()}
      </span>
    </div>
  );
};

export default CoinPlate;
