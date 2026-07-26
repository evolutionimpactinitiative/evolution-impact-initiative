export function MarqueeBanner() {
  const text =
    "Back to School Drive 2026 · Sat 22 August · Register your family · Sunlight Centre, Gillingham · Small acts, big impact · ";

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
