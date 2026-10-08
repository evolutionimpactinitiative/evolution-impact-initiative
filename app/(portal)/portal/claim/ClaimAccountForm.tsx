"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface Props {
  token: string;
  name: string;
  email: string;
}

export function ClaimAccountForm({ token, name, email }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [relationship, setRelationship] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/portal/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password,
        postcode: postcode || undefined,
        relationshipToChild: relationship || undefined,
        howHeardAboutGt: howHeard || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }

    const verifyUrl = new URL("/portal/verify-email", window.location.origin);
    verifyUrl.searchParams.set("email", email);
    router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-brand-dark/10 p-6 md:p-8 space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Your name
          </label>
          <input
            type="text"
            value={name}
            readOnly
            className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-brand-dark/70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-brand-dark/70"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          Set a password <span className="text-red-500">*</span>
        </label>
        <PasswordInput
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-brand-dark/50 mt-1">At least 8 characters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Postcode
          </label>
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g. ME1 1YD"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-1">
            Your relationship to your child
          </label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white"
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
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          How did you hear about Growing Together?
        </label>
        <select
          value={howHeard}
          onChange={(e) => setHowHeard(e.target.value)}
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
            Creating your account&hellip;
          </>
        ) : (
          "Finish setting up my account"
        )}
      </Button>

      <p className="text-xs text-brand-dark/60 text-center">
        By creating an account you agree to our{" "}
        <Link href="/privacy-policy" className="text-brand-blue underline">
          privacy notice
        </Link>{" "}
        and{" "}
        <Link href="/safeguarding" className="text-brand-blue underline">
          safeguarding policy
        </Link>
        .
      </p>
    </form>
  );
}
