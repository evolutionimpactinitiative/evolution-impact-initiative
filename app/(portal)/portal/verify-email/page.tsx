"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    await fetch("/api/portal/resend-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-pale text-brand-blue mb-6">
        <Mail className="h-8 w-8" />
      </div>
      <h1 className="font-heading font-black text-3xl text-brand-dark mb-3">
        Check your inbox
      </h1>
      <p className="text-brand-dark/70 mb-2">
        We&rsquo;ve sent a confirmation link to
      </p>
      <p className="text-brand-dark font-semibold mb-6">{email || "your email"}</p>
      <p className="text-brand-dark/70 mb-8">
        Click the link in the email to confirm your account, then come back and log in.
      </p>

      <div className="bg-white border border-brand-dark/10 rounded-2xl p-6 space-y-4">
        <p className="text-sm text-brand-dark/70">
          Can&rsquo;t find it? Check your spam folder, or send it again.
        </p>
        <Button
          onClick={handleResend}
          disabled={loading || sent || !email}
          className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : sent ? (
            "Sent — check your inbox"
          ) : (
            "Resend the link"
          )}
        </Button>
      </div>

      <p className="text-sm text-brand-dark/60 mt-6">
        <Link href="/portal/login" className="text-brand-blue underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-blue" /></div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
