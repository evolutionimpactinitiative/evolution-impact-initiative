import type { Metadata } from "next";

const FESTIVAL_OG_IMAGE = {
  url: "/evolution-fest-2026-og.jpg",
  width: 1200,
  height: 630,
  alt: "Evolution Fest 2026 — Saturday 25 July, Strood Youth Centre, Medway",
};

export function festivalMetadata(opts: {
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
      images: [FESTIVAL_OG_IMAGE],
      type: "website",
      locale: "en_GB",
      siteName: "Evolution Impact Initiative CIC",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [FESTIVAL_OG_IMAGE.url],
    },
  };
}
