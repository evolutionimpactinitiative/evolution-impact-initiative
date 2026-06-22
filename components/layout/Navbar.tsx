"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { navLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavbarProps = {
  // If set, the festival event is in "final release" mode — the CTA pill
  // should show the live remaining count in red instead of the usual green.
  finalRelease?: number | null;
};

export function Navbar({ finalRelease = null }: NavbarProps = {}) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const isFinalRelease = typeof finalRelease === "number";
  const ticketsCtaClass = isFinalRelease
    ? "bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-200"
    : "bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white";
  const ticketsCtaLabel = isFinalRelease
    ? finalRelease > 0
      ? `Fest 2026 · Final ${finalRelease} tickets`
      : "Fest 2026 · Sold out"
    : "Fest 2026 · Free tickets";

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "h-16 bg-white/95 backdrop-blur-md shadow-sm"
          : "h-20 bg-white/95 backdrop-blur-md"
      )}
    >
      <nav className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0" aria-label="Evolution Impact Initiative - Home">
          <Image
            src="/logos/evolution_full_logo_1.svg"
            alt="Evolution Impact Initiative"
            width={scrolled ? 200 : 250}
            height={scrolled ? 48 : 60}
            className="transition-all duration-300"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-heading text-sm font-semibold text-brand-dark hover:text-brand-blue transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className={ticketsCtaClass}>
            <Link href="/evolution-fest-2026">{ticketsCtaLabel}</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col gap-6 mt-8">
                <Image
                  src="/logos/evolution_full_logo_1.svg"
                  alt="Evolution Impact Initiative"
                  width={180}
                  height={45}
                />
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="font-heading text-lg font-semibold text-brand-dark hover:text-brand-blue transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <Button
                  asChild
                  className={`w-full mt-4 ${ticketsCtaClass}`}
                >
                  <Link
                    href="/evolution-fest-2026"
                    onClick={() => setOpen(false)}
                  >
                    {ticketsCtaLabel}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/get-involved" onClick={() => setOpen(false)}>
                    Get Involved
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
