/**
 * The coin mark, beside any figure in coins.
 *
 * Inline SVG rather than an asset so it inherits nothing and needs no network
 * request — it appears on the menu, the garage, the shop and the daily, which
 * is four places for a missing file to show up.
 */
const Coin = () => {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="12" cy="12" fill="#C98A0E" r="9.4" />
      <circle cx="12" cy="12" fill="none" r="9.4" stroke="#6B4708" strokeWidth="1.6" />
      <circle cx="12" cy="12" fill="#FFC93C" r="6.4" />
      <path
        d="M9.4 12h5.2M12 9.4v5.2"
        stroke="#8A5B08"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
};

export default Coin;
