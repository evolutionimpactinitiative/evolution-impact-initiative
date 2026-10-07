import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Child, Family, ParentCarer } from "@/lib/supabase/types";
import { resolvePortalIdentity } from "@/lib/portal/current-carer";
import { FamilyEditor } from "./FamilyEditor";
import { NotificationPreferences } from "./NotificationPreferences";
import { ParentNotesSection, type ParentVisibleNote } from "./ParentNotes";

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const identity = await resolvePortalIdentity(supabase, user);

  if (identity.kind === "stale_session") {
    redirect("/api/portal/session-end?reason=session_expired&next=/portal/family");
  }

  if (identity.kind === "admin") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="font-heading font-black text-2xl text-brand-dark mb-3">
          You&rsquo;re signed in as EII staff
        </h1>
        <p className="text-brand-dark/70 mb-6">
          The Growing Together parent portal is for family accounts. Head to the admin
          dashboard, or sign out and log in with a family account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-brand-blue text-white font-heading font-bold hover:bg-brand-dark transition-colors"
          >
            Go to admin dashboard
          </Link>
          <Link
            href="/api/portal/session-end"
            prefetch={false}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-brand-dark/20 bg-white text-brand-dark font-heading font-bold hover:bg-brand-pale transition-colors"
          >
            Sign out
          </Link>
        </div>
      </div>
    );
  }

  if (identity.kind === "no_record") {
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

  const carer = identity.carer;

  // Use admin client for related reads — RLS is already proven good by
  // the session-scoped carer lookup above, and this keeps a single data
  // source regardless of other RLS quirks.
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: family } = await (admin as any)
    .from("families")
    .select("*")
    .eq("id", carer.family_id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = await (admin as any)
    .from("children")
    .select("*")
    .eq("family_id", carer.family_id)
    .is("archived_at", null)
    .order("date_of_birth", { ascending: true });

  // External notes (family + per child) shared by the team.
  const childIds = ((children as { id: string }[] | null) ?? []).map((c) => c.id);
  const noteFilters: string[] = [
    `and(target_type.eq.family,target_id.eq.${carer.family_id})`,
  ];
  if (childIds.length > 0) {
    noteFilters.push(
      `and(target_type.eq.child,target_id.in.(${childIds.join(",")}))`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: externalNotesRaw } = await (admin as any)
    .from("notes")
    .select("id, target_type, target_id, body, created_at, author_team_id")
    .eq("visibility", "external")
    .or(noteFilters.join(","))
    .order("created_at", { ascending: false });
  type RawExtNote = {
    id: string;
    target_type: "family" | "child";
    target_id: string;
    body: string;
    created_at: string;
    author_team_id: string | null;
  };
  const extRaw = (externalNotesRaw as RawExtNote[] | null) ?? [];
  const extAuthorIds = Array.from(
    new Set(extRaw.map((n) => n.author_team_id).filter(Boolean) as string[]),
  );
  const extAuthors: Record<string, string> = {};
  if (extAuthorIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: a } = await (admin as any)
      .from("team_members")
      .select("id, name")
      .in("id", extAuthorIds);
    for (const row of (a as { id: string; name: string }[] | null) ?? []) {
      extAuthors[row.id] = row.name;
    }
  }
  const familyExtNotes: ParentVisibleNote[] = extRaw
    .filter((n) => n.target_type === "family" && n.target_id === carer.family_id)
    .map((n) => ({
      id: n.id,
      body: n.body,
      author_name: n.author_team_id ? extAuthors[n.author_team_id] ?? null : null,
      created_at: n.created_at,
    }));
  const childExtNotesById: Record<string, ParentVisibleNote[]> = {};
  for (const n of extRaw.filter((n) => n.target_type === "child")) {
    (childExtNotesById[n.target_id] = childExtNotesById[n.target_id] || []).push({
      id: n.id,
      body: n.body,
      author_name: n.author_team_id ? extAuthors[n.author_team_id] ?? null : null,
      created_at: n.created_at,
    });
  }

  const childRows = (children as Child[] | null) ?? [];

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
          Add your child (or children) once, then register for any session with a couple of taps.
        </p>
      </div>

      {/* Team notes about the family */}
      <ParentNotesSection label="Family" notes={familyExtNotes} />

      {/* Team notes per child */}
      {childRows.map((c) => (
        <ParentNotesSection
          key={`notes-${c.id}`}
          label={c.first_name}
          notes={childExtNotesById[c.id] ?? []}
        />
      ))}

      <FamilyEditor
        family={family as Family}
        carer={carer as ParentCarer}
        children={childRows}
      />

      <NotificationPreferences
        initial={
          ((carer as unknown as { village_email_pref?: string }).village_email_pref ??
            "daily_digest") as "per_post" | "daily_digest" | "never"
        }
      />
    </div>
  );
}
