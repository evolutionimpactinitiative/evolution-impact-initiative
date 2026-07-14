import type { Metadata } from "next";

const B2S_OG_IMAGE = {
  url: "/back-to-school-2026-og.jpg",
  width: 1200,
  height: 630,
  alt: "Back to School Drive 2026: Saturday 22 August, The Sunlight Centre, Gillingham",
};

/**
 * Metadata helper for Back to School Drive 2026 pages. Mirrors the
 * `festivalMetadata` helper so previews on WhatsApp, iMessage, Facebook,
 * Twitter/X, LinkedIn etc. all render the flyer + title + description.
 */
export function backToSchoolMetadata(opts: {
  title: string;
  description: string;
  noindex?: boolean;
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: opts.title,
      description: opts.description,
      images: [B2S_OG_IMAGE],
      type: "website",
      locale: "en_GB",
      siteName: "Evolution Impact Initiative CIC",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [B2S_OG_IMAGE.url],
    },
  };
}
