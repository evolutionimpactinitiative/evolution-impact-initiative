import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Portal auth callback. Handles email verification (from /portal/join)
// and the password-reset link (from /portal/forgot-password).
//
// Supabase's `admin.generateLink` (server-side) returns an action_link
// that redirects to us with `?token_hash=…&type=…`, while client-side
// `resetPasswordForEmail` uses PKCE and redirects with `?code=…`. Handle
// both.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") || "/portal/family";
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/portal/login?error=verify_failed`);
}
