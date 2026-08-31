"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    postcode: "",
    relationship_to_child: "",
    preferred_contact_method: "email" as "email" | "phone" | "sms" | "whatsapp",
    how_heard_about_gt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/portal/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, next: safeNext ?? undefined }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    const verifyUrl = new URL("/portal/verify-email", window.location.origin);
    verifyUrl.searchParams.set("email", form.email);
    if (safeNext) verifyUrl.searchParams.set("next", safeNext);
    router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-heading font-black text-3xl text-brand-dark mb-2">
          Join Growing Together
        </h1>
        <p className="text-brand-dark/70">
          Create your family account. Free forever. Takes about a minute.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-brand-dark/10 p-6 md:p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
          <p className="text-xs text-brand-dark/50 mt-1">At least 8 characters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Postcode</label>
            <input
              type="text"
              value={form.postcode}
              onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="e.g. ME1 1YD"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Your relationship to your child
          </label>
          <select
            value={form.relationship_to_child}
            onChange={(e) => setForm({ ...form, relationship_to_child: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            <option value="">Prefer not to say</option>
            <option value="mother">Mother</option>
            <option value="father">Father</option>
            <option value="carer">Carer</option>
            <option value="grandparent">Grandparent</option>
            <option value="guardian">Guardian</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            How did you hear about Growing Together?
          </label>
          <select
            value={form.how_heard_about_gt}
            onChange={(e) => setForm({ ...form, how_heard_about_gt: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white"
          >
            <option value="">Prefer not to say</option>
            <option value="friend_or_family">A friend or family</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="family_hub">Family Hub</option>
            <option value="nursery">Nursery or childminder</option>
            <option value="school">School</option>
            <option value="health_visitor">Health visitor</option>
            <option value="library">Library</option>
            <option value="community_centre">Community centre</option>
            <option value="google_search">Google search</option>
            <option value="other">Other</option>
          </select>
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
              Creating your account…
            </>
          ) : (
            "Create my family account"
          )}
        </Button>

        <p className="text-xs text-brand-dark/60 text-center">
          By joining you agree to our{" "}
          <Link href="/privacy-policy" className="text-brand-blue underline">
            privacy notice
          </Link>{" "}
          and{" "}
          <Link href="/safeguarding" className="text-brand-blue underline">
            safeguarding policy
          </Link>
          .
        </p>

        <p className="text-sm text-center text-brand-dark/70">
          Already have an account?{" "}
          <Link
            href={safeNext ? `/portal/login?next=${encodeURIComponent(safeNext)}` : "/portal/login"}
            className="text-brand-blue font-semibold underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand-blue" /></div>}>
      <JoinForm />
    </Suspense>
  );
}
