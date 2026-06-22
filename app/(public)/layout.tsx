import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TextureOverlay } from "@/components/layout/TextureOverlay";
import { getFestivalRelease } from "@/lib/festival/release";

// Keep all public pages live so the festival ticket count in the Navbar
// (and any final-release UI surfaced via getFestivalRelease) is always fresh.
export const revalidate = 0;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const release = await getFestivalRelease();

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <TextureOverlay />
      <Navbar
        finalRelease={release.finalRelease ? release.ticketsRemaining : null}
      />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
