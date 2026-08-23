// B2S 2026 text archived — for the 2027 drive, swap this string back
// to a fresh campaign teaser ("Back to School Drive 2027 · <date> ·
// Register your family · <venue> · Small acts, big impact · ").
export function MarqueeBanner() {
  const text =
    "Free workshops · Community events · Youth mentoring · Support for Medway families · Small acts, big impact · ";

  return (
    <div className="bg-brand-green -rotate-1 scale-105 py-4 border-y-4 border-white overflow-hidden">
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
