import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Child, Family, ParentCarer } from "@/lib/supabase/types";
import { FamilyEditor } from "./FamilyEditor";

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (supabase as any)
    .from("parent_carers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!carer) {
    // A rare state — auth user exists but no parent_carer row. Ask them
    // to finish sign-up. In practice signup creates both atomically.
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-black text-2xl text-brand-dark mb-3">
          We couldn&rsquo;t find your family record
        </h1>
        <p className="text-brand-dark/70 mb-6">
          Please contact us so we can help set this up.
        </p>
        <Link href="/contact" className="text-brand-blue underline">
          Contact Evolution Impact Initiative
        </Link>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: family } = await (supabase as any)
    .from("families")
    .select("*")
    .eq("id", carer.family_id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = await (supabase as any)
    .from("children")
    .select("*")
    .eq("family_id", carer.family_id)
    .is("archived_at", null)
    .order("date_of_birth", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="mb-8">
        <p className="font-heading font-semibold text-sm text-brand-blue uppercase tracking-wider mb-2">
          Growing Together
        </p>
        <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
          My Family
        </h1>
        <p className="text-brand-dark/70 mt-2">
          Add your child (or children) once — then register for any session with a couple of taps.
        </p>
      </div>

      <FamilyEditor
        family={family as Family}
        carer={carer as ParentCarer}
        children={(children as Child[] | null) ?? []}
      />
    </div>
  );
}
