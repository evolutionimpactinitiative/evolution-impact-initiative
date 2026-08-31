"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "verify_failed"
      ? "That verification link didn't work. Try logging in or ask for a fresh link."
      : null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        router.push(`/portal/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("That email or password isn't right. Try again.");
      return;
    }

    router.push(safeNext ?? "/portal/family");
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading font-black text-3xl text-brand-dark mb-2">
          Welcome back
        </h1>
        <p className="text-brand-dark/70">Log in to your Growing Together account.</p>
      </div>

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

        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
          <div className="text-right mt-2">
            <Link href="/portal/forgot-password" className="text-sm text-brand-blue hover:underline">
              Forgot your password?
            </Link>
          </div>
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
              Logging in…
            </>
          ) : (
            "Log in"
          )}
        </Button>

        <p className="text-sm text-center text-brand-dark/70">
          New here?{" "}
          <Link
            href={safeNext ? `/portal/join?next=${encodeURIComponent(safeNext)}` : "/portal/join"}
            className="text-brand-blue font-semibold underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-blue" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
