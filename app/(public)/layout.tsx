import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TextureOverlay } from "@/components/layout/TextureOverlay";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <TextureOverlay />
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
