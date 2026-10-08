import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ClaimAccountForm } from "./ClaimAccountForm";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ClaimPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidToken reason="missing" />;
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("id, name, email, user_id, claim_token_expires_at, family_id")
    .eq("claim_token", token)
    .maybeSingle();

  if (!carer) {
    return <InvalidToken reason="not_found" />;
  }

  if (carer.user_id) {
    // Already claimed — send them to log in.
    redirect(`/portal/login?email=${encodeURIComponent(carer.email)}`);
  }

  if (
    carer.claim_token_expires_at &&
    new Date(carer.claim_token_expires_at) < new Date()
  ) {
    return <InvalidToken reason="expired" email={carer.email} />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-green/15 text-brand-green mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="font-heading font-black text-3xl text-brand-dark mb-2">
          Finish your account
        </h1>
        <p className="text-brand-dark/70">
          Welcome back, <strong>{carer.name}</strong>. Set a password and
          you&rsquo;re in — your family details are already saved.
        </p>
      </div>
      <ClaimAccountForm
        token={token}
        name={carer.name}
        email={carer.email}
      />
    </div>
  );
}

function InvalidToken({
  reason,
  email,
}: {
  reason: "missing" | "not_found" | "expired";
  email?: string;
}) {
  const copy =
    reason === "expired"
      ? "This link has expired. You can still create an account the normal way — we'll link up your previous registration automatically."
      : reason === "not_found"
        ? "We couldn't find that invitation. The link may have been used already or isn't quite right."
        : "No invitation link was provided.";

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-700 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="font-heading font-black text-2xl text-brand-dark mb-2">
        Link isn&rsquo;t valid
      </h1>
      <p className="text-brand-dark/70 mb-6">{copy}</p>
      <div className="flex flex-col gap-3">
        <Button
          asChild
          className="w-full bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
        >
          <Link href="/portal/join">Create an account</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href={email ? `/portal/login?email=${encodeURIComponent(email)}` : "/portal/login"}>
            Log in instead
          </Link>
        </Button>
      </div>
    </div>
  );
}
