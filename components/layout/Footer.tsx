import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Linkedin, Mail, MapPin } from "lucide-react";
import { footerNav, footerInvolve, footerGovernance } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Navigation */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6">Navigation</h3>
            <ul className="space-y-3">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-brand-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6">Get Involved</h3>
            <ul className="space-y-3">
              {footerInvolve.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-brand-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Governance */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6">Governance</h3>
            <ul className="space-y-3">
              {footerGovernance.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-brand-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6">Connect</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                <p className="text-white/70 text-sm">
                  86 King Street<br />
                  Rochester, Kent<br />
                  ME1 1YD
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-brand-accent flex-shrink-0" />
                <a
                  href="mailto:info@evolutionimpactinitiative.co.uk"
                  className="text-white/70 hover:text-brand-accent transition-colors text-sm break-all"
                >
                  info@evolutionimpactinitiative.co.uk
                </a>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <a
                  href="https://www.instagram.com/evolutionimpactinitiative"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-white/70 hover:text-brand-accent transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.facebook.com/share/1AhvjnBzca/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-white/70 hover:text-brand-accent transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/evolution-impact-initiative-cic/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-white/70 hover:text-brand-accent transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-8">
                <Image
                  src="/logos/evolution_full_logo_2.svg"
                  alt="Evolution Impact Initiative"
                  width={180}
                  height={45}
                  className="opacity-90"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
          <p>
            © {new Date().getFullYear()} Evolution Impact Initiative CIC | Company No. 16667870 | Registered in England & Wales
          </p>
        </div>
      </div>
    </footer>
  );
}
