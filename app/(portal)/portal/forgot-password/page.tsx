"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/portal-callback?next=/portal/reset-password`,
      },
    );

    setLoading(false);
    if (resetError) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading font-black text-3xl text-brand-dark mb-2">
          Forgot your password?
        </h1>
        <p className="text-brand-dark/70">
          Enter your email and we&rsquo;ll send you a link to reset it.
        </p>
      </div>

      {sent ? (
        <div className="bg-white border border-brand-dark/10 rounded-2xl p-6 md:p-8 text-center">
          <p className="text-brand-dark mb-2 font-semibold">Check your inbox</p>
          <p className="text-brand-dark/70 text-sm mb-4">
            If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a password-reset link.
          </p>
          <Link href="/portal/login" className="text-brand-blue underline">
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-dark/10 p-6 md:p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <p className="text-sm text-center text-brand-dark/70">
            Remembered it?{" "}
            <Link href="/portal/login" className="text-brand-blue font-semibold underline">
              Back to log in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
