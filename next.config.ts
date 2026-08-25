import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cnqwtzluzefdwdcrkhkj.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      // The August drive is over — the /back-to-school landing sends
      // visitors to the September Collection Day hub. Sub-pages
      // (register, sponsor, donate-supplies) stay in-repo but are no
      // longer linked from anywhere; delete after the collection day
      // if we're sure nobody's bookmarked them.
      {
        source: "/back-to-school",
        destination: "/back-to-school/collection",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
