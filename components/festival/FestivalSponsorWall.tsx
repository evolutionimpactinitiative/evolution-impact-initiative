import Image from "next/image";
import Link from "next/link";
import { FESTIVAL, getSponsorTier, type SponsorPath } from "@/lib/festival";
import type { FestivalSponsor } from "@/lib/supabase/types";

interface FestivalSponsorWallProps {
  sponsors: Pick<
    FestivalSponsor,
    "id" | "organisation_name" | "display_name" | "logo_url" | "website" | "path" | "tier_key"
  >[];
}

const PATH_ORDER: SponsorPath[] = ["premium", "activity", "community", "custom"];

const PATH_LABELS: Record<SponsorPath, string> = {
  premium: "Lead partners",
  activity: "Activity sponsors",
  community: "Community partners",
  custom: "Tailored partners",
};

export function FestivalSponsorWall({ sponsors }: FestivalSponsorWallProps) {
  if (sponsors.length === 0) {
    return (
      <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-8 md:p-12 text-center">
        <p className="font-heading font-bold text-xl text-white mb-3">
          Be the first to partner with us
        </p>
        <p className="text-white/60 max-w-md mx-auto mb-6">
          Your logo could lead the wall. Three sponsorship paths, every budget
          welcome.
        </p>
        <Link
          href={`/${FESTIVAL.slug}/sponsor`}
          className="inline-flex items-center justify-center bg-brand-accent text-brand-dark font-heading font-bold text-sm uppercase tracking-wider px-5 py-3 rounded-md hover:bg-brand-green hover:text-white transition-colors"
        >
          Become a sponsor
        </Link>
      </div>
    );
  }

  // Group by path
  const grouped = PATH_ORDER.map((path) => ({
    path,
    label: PATH_LABELS[path],
    sponsors: sponsors.filter((s) => s.path === path),
  })).filter((g) => g.sponsors.length > 0);

  return (
    <div className="space-y-10">
      {grouped.map((group) => (
        <div key={group.path}>
          <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-5">
            {group.label}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {group.sponsors.map((sponsor) => {
              const tier = getSponsorTier(sponsor.tier_key);
              const name = sponsor.display_name || sponsor.organisation_name;
              const card = (
                <div className="bg-white rounded-lg p-6 h-full flex flex-col items-center justify-center gap-3 text-center hover:shadow-lg transition-shadow">
                  {sponsor.logo_url ? (
                    <div className="relative w-full h-16">
                      <Image
                        src={sponsor.logo_url}
                        alt={`${name} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <p className="font-heading font-bold text-brand-dark text-sm md:text-base">
                      {name}
                    </p>
                  )}
                  {tier && (
                    <p className="text-[10px] uppercase tracking-widest text-brand-dark/50 font-heading">
                      {tier.label}
                    </p>
                  )}
                </div>
              );

              return sponsor.website ? (
                <a
                  key={sponsor.id}
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${name}`}
                >
                  {card}
                </a>
              ) : (
                <div key={sponsor.id}>{card}</div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
