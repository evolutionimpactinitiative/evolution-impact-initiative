export function MarqueeBanner() {
  const text = "Small acts create big impact — Inclusion — Empowerment — Integrity — Community — Joy — ";

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
