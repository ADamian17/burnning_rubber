interface Props {
  direction: "left" | "right";
}

const Chevron = ({ direction }: Props) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="21"
      stroke="#F28D35"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.6"
      viewBox="0 0 24 24"
      width="21"
    >
      <path
        d={direction === "left" ? "M14.6 5.4 8 12l6.6 6.6" : "M9.4 5.4 16 12l-6.6 6.6"}
      />
    </svg>
  );
};

export default Chevron;
