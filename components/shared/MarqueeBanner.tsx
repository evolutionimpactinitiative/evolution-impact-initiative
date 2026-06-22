type Props = {
  // If a number is passed, the festival is in final-release mode and the
  // marquee switches to red with scarcity wording. The number is the live
  // tickets-remaining count.
  finalRelease?: number | null;
};

export function MarqueeBanner({ finalRelease = null }: Props = {}) {
  const isFinalRelease = typeof finalRelease === "number";

  const text = isFinalRelease
    ? finalRelease > 0
      ? `Final release · Only ${finalRelease} tickets left · Evolution Fest 2026 · Sat 25 July · Strood Youth Centre · `
      : `Sold out · Evolution Fest 2026 · Sat 25 July · Strood Youth Centre · `
    : "Evolution Fest 2026 · Sat 25 July · Free tickets · Strood Youth Centre · Small acts, big impact · ";

  const bg = isFinalRelease ? "bg-red-600" : "bg-brand-green";

  return (
    <div className={`${bg} -rotate-1 scale-105 py-4 border-y-4 border-white overflow-hidden`}>
      <div className="marquee-container">
        <div className="marquee-content">
          <span className="text-white font-heading font-bold text-lg uppercase tracking-wider">
            {text}
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
