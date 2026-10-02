import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side sign-out for stale-session recovery. Portal pages redirect
// here when they detect the user's JWT is no longer good for RLS (the
// typical "logged in for days, now sees 'no family record'" case).
//
// We clear the Supabase cookies here — Server Components can't reliably
// set cookies, so running the sign-out in a Route Handler is the only
// bulletproof way — then redirect to the login page with a friendly
// reason banner.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reasonParam = searchParams.get("reason");
  const nextParam = searchParams.get("next");

  const reason = reasonParam === "session_expired" ? "session_expired" : null;
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  const supabase = await createClient();
  await supabase.auth.signOut();

  const loginUrl = new URL("/portal/login", origin);
  if (reason) loginUrl.searchParams.set("reason", reason);
  if (safeNext) loginUrl.searchParams.set("next", safeNext);

  return NextResponse.redirect(loginUrl);
}
