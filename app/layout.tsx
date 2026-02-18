import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TextureOverlay } from "@/components/layout/TextureOverlay";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Evolution Impact Initiative CIC — Small Acts, Big Impact · Medway, Kent",
  description:
    "Community-led workshops, youth sport, creative arts and family support in Medway. Where small acts create big impact.",
  keywords: [
    "community",
    "Medway",
    "Kent",
    "youth",
    "workshops",
    "creative arts",
    "boxing",
    "family support",
    "CIC",
    "community interest company",
  ],
  authors: [{ name: "Evolution Impact Initiative CIC" }],
  openGraph: {
    title: "Evolution Impact Initiative CIC — Small Acts, Big Impact",
    description:
      "Community-led workshops, youth sport, creative arts and family support in Medway.",
    type: "website",
    locale: "en_GB",
    siteName: "Evolution Impact Initiative CIC",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-white">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <TextureOverlay />
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
