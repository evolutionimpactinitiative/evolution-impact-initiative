import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check if user email is from the organization
    const allowedDomain = "evolutionimpactinitiative.co.uk";
    if (!user.email?.endsWith(`@${allowedDomain}`)) {
      // Redirect to unauthorized page
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  // Protect parent portal routes. Public pages inside /portal (join,
  // login, verify-email, forgot-password, reset-password) let unauthed
  // visitors through; everything else requires an authenticated,
  // email-verified parent.
  if (request.nextUrl.pathname.startsWith("/portal")) {
    const publicPortalPaths = [
      "/portal/join",
      "/portal/login",
      "/portal/verify-email",
      "/portal/forgot-password",
      "/portal/reset-password",
    ];
    const isPublic = publicPortalPaths.some((p) => request.nextUrl.pathname.startsWith(p));

    if (!isPublic) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = "/portal/login";
        return NextResponse.redirect(url);
      }
      if (!user.email_confirmed_at) {
        const url = request.nextUrl.clone();
        url.pathname = "/portal/verify-email";
        if (user.email) url.searchParams.set("email", user.email);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
