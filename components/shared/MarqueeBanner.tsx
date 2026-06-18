export function MarqueeBanner() {
  const text =
    "Evolution Fest 2026 · Sat 25 July · Free tickets · Strood Youth Centre · Small acts, big impact · ";

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
