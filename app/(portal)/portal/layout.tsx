import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { FundedByCiN } from "@/components/shared/FundedByCiN";
import { PortalSignOutButton } from "./PortalSignOutButton";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-brand-pale/40 flex flex-col">
      <header className="bg-white border-b border-brand-dark/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-3">
            <Image
              src="/logos/evolution_full_logo_1.svg"
              alt="Evolution Impact Initiative"
              width={140}
              height={34}
              priority
            />
            <span className="hidden sm:inline-block h-5 border-l border-brand-dark/20" />
            <span className="hidden sm:inline-block font-heading font-black text-brand-blue text-sm uppercase tracking-wider">
              Growing Together
            </span>
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/portal"
                className="hidden sm:inline-block text-sm font-heading font-semibold text-brand-dark hover:text-brand-blue"
              >
                Dashboard
              </Link>
              <Link
                href="/portal/family"
                className="hidden sm:inline-block text-sm font-heading font-semibold text-brand-dark hover:text-brand-blue"
              >
                My Family
              </Link>
              <PortalSignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/portal/login"
                className="text-sm font-heading font-semibold text-brand-dark hover:text-brand-blue"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-brand-dark/10 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-brand-dark/60 space-y-3">
          <div className="flex justify-center">
            <FundedByCiN variant="compact" />
          </div>
          <p>
            Growing Together · Evolution Impact Initiative CIC · Company No. 16667870
          </p>
          <p>
            <Link href="/growing-together" className="text-brand-blue hover:underline">
              About the programme
            </Link>
            <span className="mx-2">·</span>
            <Link href="/privacy-policy" className="text-brand-blue hover:underline">
              Privacy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/safeguarding" className="text-brand-blue hover:underline">
              Safeguarding
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
