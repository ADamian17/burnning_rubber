interface Props {
  /** Multiplies every type size. The splash sets 1.15; the menu uses 1. */
  scale?: number;
}

/**
 * The title lockup: BURNING / RUBBER over the tagline.
 *
 * The O of "ROAD" is a tyre rather than a letter, which is also where the app
 * icon's subject came from. It is inline SVG instead of an image so it inherits
 * the surrounding type size and never needs a second asset to stay in step.
 */
const Wordmark = ({ scale = 1 }: Props) => {
  return (
    <div className="wordmark" style={{ "--s": scale } as React.CSSProperties}>
      <div className="wordmark__top">BURNING</div>
      <div className="wordmark__bottom">RUBBER</div>
      <div className="wordmark__tag">
        &ldquo;FEAR THE R
        <svg
          height="18"
          style={{ verticalAlign: "-3px" }}
          viewBox="0 0 40 40"
          width="18"
        >
          <title>tyre</title>
          <circle cx="20" cy="20" fill="#131110" r="18.5" />
          <circle
            cx="20"
            cy="20"
            fill="none"
            r="15"
            stroke="#2E2A26"
            strokeDasharray="3 4.4"
            strokeWidth="5.5"
          />
          <circle cx="20" cy="20" fill="#B7B1A8" r="9.6" />
          <g stroke="#7C776F" strokeLinecap="round" strokeWidth="2">
            <line x1="20" x2="20" y1="11" y2="29" />
            <line x1="11" x2="29" y1="20" y2="20" />
            <line x1="13.6" x2="26.4" y1="13.6" y2="26.4" />
            <line x1="26.4" x2="13.6" y1="13.6" y2="26.4" />
          </g>
        </svg>
        AD&rdquo;
      </div>
    </div>
  );
};

export default Wordmark;
