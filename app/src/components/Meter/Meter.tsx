interface Props {
  /** How many pips are lit, out of six. */
  value: number;
}

/**
 * Six discrete pips, never a bar.
 *
 * Players compare cars and upgrade levels by counting, and a continuous bar
 * makes two close values look identical.
 */
const Meter = ({ value }: Props) => {
  return (
    <span className="meter">
      {Array.from({ length: 6 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the pips are positions
        <i className={`pip${i < value ? " pip--on" : ""}`} key={i} />
      ))}
    </span>
  );
};

export default Meter;
