"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validate email domain
    if (!email.endsWith("@evolutionimpactinitiative.co.uk")) {
      setMessage({
        type: "error",
        text: "Only @evolutionimpactinitiative.co.uk email addresses can access the admin area.",
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } else {
      setMessage({
        type: "success",
        text: "Check your email for the login link!",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-pale flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-heading font-black text-2xl text-brand-dark">
              Evolution Impact Initiative
            </h1>
            <p className="text-brand-dark/60 mt-2">Team Admin Portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-dark/40" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@evolutionimpactinitiative.co.uk"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-brand-dark/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                />
              </div>
              <p className="text-xs text-brand-dark/50 mt-2">
                Use your official @evolutionimpactinitiative.co.uk email
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </form>

          {/* Back to website */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-brand-blue hover:text-brand-dark transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-brand-dark/50 text-sm mt-6">
          Having trouble? Contact{" "}
          <a href="mailto:info@evolutionimpactinitiative.co.uk" className="text-brand-blue">
            info@evolutionimpactinitiative.co.uk
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-pale flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
