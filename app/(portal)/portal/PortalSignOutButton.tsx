"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, LogOut } from "lucide-react";

export function PortalSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/portal/login");
        router.refresh();
      }}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-heading font-semibold text-brand-dark/70 hover:text-brand-dark disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
