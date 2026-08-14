import type { MetadataRoute } from "next";

// Next.js file-based manifest — served at /manifest.webmanifest.
// Gives the admin a proper "Add to Home Screen" experience: icon on
// the phone home screen, fullscreen (no browser chrome) when launched.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Evolution Impact Initiative — Admin",
    short_name: "EII Admin",
    description:
      "Small acts, big impact. Admin & operations for Evolution Impact Initiative CIC — Back to School Drive and beyond.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6f8",
    theme_color: "#17559D",
    icons: [
      {
        src: "/logos/evolution_icon_1.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.jpg",
        sizes: "180x180",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
