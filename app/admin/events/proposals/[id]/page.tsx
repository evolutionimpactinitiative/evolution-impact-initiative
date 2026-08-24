import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  Target,
  ListChecks,
  UserCog,
  ShieldCheck,
  Package,
  PoundSterling,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Pencil,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AGE_GROUP_OPTIONS,
  EVENT_TYPE_OPTIONS,
  PROMOTION_CHANNELS,
  REGISTRATION_METHODS,
  SAFEGUARDING_PRACTICES,
  STATUS_LABELS,
  STATUS_TONES,
  type EventProposal,
  type EventProposalComment,
} from "@/lib/event-proposals/types";
import { ProposalCommentForm } from "@/components/admin/events/ProposalCommentForm";
import { ProposalReviewActions } from "@/components/admin/events/ProposalReviewActions";
import { PROPOSAL_REVIEWER_EMAIL } from "@/lib/event-proposals/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

type Member = { id: string; name: string | null; email: string; role: string | null };

function fmtDate(v: string | null | undefined) {
  if (!v) return null;
  return new Date(v).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(v: string | null | undefined) {
  if (!v) return null;
  return new Date(v).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(pence: number) {
  return `£${(pence / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ProposalReviewPage({ params }: Props) {
  const { id } = await params;

  // Auth — the actions bar needs to know if this user is the
  // designated reviewer (info@ today). Review/approve/reject are
  // gated to that account only; wizard-reopening still uses the
  // creator/admin combo below.
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) notFound();
  const email = (user.email || "").toLowerCase();
  const { data: meRow } = await authClient
    .from("team_members")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  const me = meRow as { id: string; role: string | null } | null;
  if (!me) notFound();
  const isReviewer = email === PROPOSAL_REVIEWER_EMAIL;

  const supabase = createAdminClient();

  const { data: proposalRow } = await supabase
    .from("event_proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const proposal = proposalRow as EventProposal | null;
  if (!proposal) notFound();

  // Fetch all referenced team members in one round-trip
  const memberIds = Array.from(
    new Set(
      [
        proposal.created_by,
        proposal.event_planner_id,
        proposal.event_facilitator_id,
        proposal.submitted_by,
        proposal.reviewed_by,
        ...proposal.assistant_volunteer_ids,
      ].filter((x): x is string => !!x),
    ),
  );
  const { data: memberRows } = memberIds.length
    ? await supabase
        .from("team_members")
        .select("id, name, email, role")
        .in("id", memberIds)
    : { data: [] as Member[] };
  const memberById = new Map<string, Member>();
  for (const m of ((memberRows ?? []) as Member[])) {
    memberById.set(m.id, m);
  }
  const nameOf = (mid: string | null) => {
    if (!mid) return null;
    const m = memberById.get(mid);
    return m ? m.name || m.email : null;
  };

  // Fund lookups
  const { data: fundRows } = proposal.funding_pot_ids.length
    ? await supabase
        .from("funds")
        .select("id, code, name")
        .in("id", proposal.funding_pot_ids)
    : { data: [] as Array<{ id: string; code: string; name: string }> };
  const funds =
    (fundRows as Array<{ id: string; code: string; name: string }> | null) ?? [];

  // Comments (with authors)
  const { data: commentRows } = await supabase
    .from("event_proposal_comments")
    .select("*")
    .eq("proposal_id", id)
    .order("created_at", { ascending: true });
  const comments = (commentRows as EventProposalComment[] | null) ?? [];
  const commentAuthorIds = Array.from(
    new Set(comments.map((c) => c.author_id).filter((x): x is string => !!x)),
  );
  const missing = commentAuthorIds.filter((mid) => !memberById.has(mid));
  if (missing.length) {
    const { data: extra } = await supabase
      .from("team_members")
      .select("id, name, email, role")
      .in("id", missing);
    for (const m of ((extra ?? []) as Member[])) memberById.set(m.id, m);
  }

  // Spawned event (present once the chair approves)
  let spawnedEvent: { id: string; slug: string; title: string; status: string } | null = null;
  if (proposal.spawned_event_id) {
    const { data: evRow } = await supabase
      .from("events")
      .select("id, slug, title, status")
      .eq("id", proposal.spawned_event_id)
      .maybeSingle();
    spawnedEvent =
      (evRow as { id: string; slug: string; title: string; status: string } | null) ?? null;
  }

  const tone = STATUS_TONES[proposal.status];
  const totalBudgetPence = proposal.cost_lines.reduce(
    (sum, l) => sum + (Number(l.amount_pence) || 0),
    0,
  );

  // Edits stay open to the submitter + the reviewer (info@) at every
  // pre-decision status. Approved/rejected freeze — from that point
  // the spawned event or rejection reason is the source of truth.
  const editableStatus =
    proposal.status === "draft" ||
    proposal.status === "submitted" ||
    proposal.status === "in_review" ||
    proposal.status === "needs_info";
  const canEdit =
    editableStatus && (proposal.created_by === me.id || isReviewer);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <Link
          href="/admin/events/proposals"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All proposals
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark truncate">
                {proposal.title}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${tone.bg} ${tone.text}`}
              >
                {STATUS_LABELS[proposal.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Created {fmtDateTime(proposal.created_at)}
              {proposal.submitted_at &&
                ` · Submitted ${fmtDateTime(proposal.submitted_at)}`}
              {proposal.reviewed_at &&
                ` · Reviewed ${fmtDateTime(proposal.reviewed_at)}`}
            </p>
          </div>
          {canEdit && (
            <Link
              href={`/admin/events/proposals/${proposal.id}/edit?step=1`}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-brand-dark px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-brand-blue"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-3">
          Board actions
        </p>
        <ProposalReviewActions
          proposalId={proposal.id}
          status={proposal.status}
          isReviewer={isReviewer}
        />
        {!isReviewer && (
          <p className="text-xs text-gray-500 mt-2 italic">
            Only the designated reviewer (info@) can move to review,
            request info, or approve / reject.
          </p>
        )}
        {proposal.rejection_reason && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-800">
            <span className="font-bold">Rejection reason: </span>
            {proposal.rejection_reason}
          </div>
        )}
      </div>

      {/* Spawned event banner — appears the moment the chair approves */}
      {spawnedEvent && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 md:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-emerald-900">
                Approved — draft event created
              </p>
              <p className="text-sm text-emerald-800 mt-0.5">
                A draft event has been spawned in the events table. Finalise the
                details there, then publish when ready.
              </p>
              <p className="text-xs text-emerald-700 mt-2">
                Current status:{" "}
                <span className="font-bold uppercase tracking-widest">
                  {spawnedEvent.status}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link
                href={`/admin/events/${spawnedEvent.id}/playbook`}
                className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-emerald-700"
              >
                <Rocket className="h-4 w-4" />
                Launch playbook
              </Link>
              <Link
                href={`/admin/events/${spawnedEvent.id}`}
                className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-emerald-500"
              >
                <Pencil className="h-4 w-4" />
                Open draft event
              </Link>
              {spawnedEvent.status === "published" && (
                <Link
                  href={`/events/${spawnedEvent.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:border-emerald-500"
                >
                  View public page
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two-column: proposal on the left, discussion on the right on md+ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal detail (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Section icon={<Sparkles className="h-4 w-4" />} title="The gist">
            <FieldGrid>
              <Field label="Type">
                {proposal.event_types.length ? (
                  <ChipRow>
                    {proposal.event_types.map((t) => (
                      <Chip key={t}>
                        {EVENT_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t}
                      </Chip>
                    ))}
                    {proposal.event_type_other && (
                      <Chip>Other: {proposal.event_type_other}</Chip>
                    )}
                  </ChipRow>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Summary" full>
                {proposal.summary ? (
                  <p className="whitespace-pre-wrap text-sm text-brand-dark">
                    {proposal.summary}
                  </p>
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
          </Section>

          <Section icon={<CalendarDays className="h-4 w-4" />} title="When">
            <FieldGrid>
              <Field label="Preferred date">
                {fmtDate(proposal.preferred_date) ?? <Empty />}
              </Field>
              <Field label="Alternative date">
                {fmtDate(proposal.alt_date) ?? <Empty />}
              </Field>
              <Field label="Event runs">
                {proposal.event_start_time || proposal.event_end_time ? (
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Clock3 className="h-3.5 w-3.5 text-gray-400" />
                    {proposal.event_start_time || "?"} – {proposal.event_end_time || "?"}
                  </span>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Setup / packdown">
                {proposal.setup_start_time || proposal.packdown_end_time ? (
                  <span className="text-sm">
                    {proposal.setup_start_time || "?"} – {proposal.packdown_end_time || "?"}
                  </span>
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
          </Section>

          <Section icon={<MapPin className="h-4 w-4" />} title="Where">
            <div className="space-y-4">
              <VenueBlock
                title="Primary venue"
                name={proposal.primary_venue_name}
                address={proposal.primary_venue_address}
                type={proposal.primary_venue_type}
                notes={proposal.primary_venue_notes}
              />
              {(proposal.alt_venue_name || proposal.alt_venue_address) && (
                <VenueBlock
                  title="Alternative venue"
                  name={proposal.alt_venue_name}
                  address={proposal.alt_venue_address}
                  type={proposal.alt_venue_type}
                  notes={null}
                />
              )}
            </div>
          </Section>

          <Section icon={<Users className="h-4 w-4" />} title="Who's it for">
            <FieldGrid>
              <Field label="Age groups">
                {proposal.age_groups.length ? (
                  <ChipRow>
                    {proposal.age_groups.map((a) => (
                      <Chip key={a}>
                        {AGE_GROUP_OPTIONS.find((o) => o.value === a)?.label ?? a}
                      </Chip>
                    ))}
                  </ChipRow>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Expected participants">
                {proposal.expected_participants != null ? (
                  <span className="text-sm">
                    {proposal.expected_participants}
                    {proposal.plus_parents_carers && (
                      <span className="text-gray-500"> + parents / carers</span>
                    )}
                  </span>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Accessibility notes" full>
                {proposal.accessibility_notes ? (
                  <p className="whitespace-pre-wrap text-sm text-brand-dark">
                    {proposal.accessibility_notes}
                  </p>
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
          </Section>

          <Section icon={<Target className="h-4 w-4" />} title="Purpose">
            <FieldGrid>
              <Field label="Event aim" full>
                {proposal.event_aim ? (
                  <p className="whitespace-pre-wrap text-sm text-brand-dark">
                    {proposal.event_aim}
                  </p>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Objectives" full>
                {proposal.objectives.length ? (
                  <StringList items={proposal.objectives} />
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Learning outcomes" full>
                {proposal.learning_outcomes.length ? (
                  <StringList items={proposal.learning_outcomes} />
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
          </Section>

          <Section icon={<ListChecks className="h-4 w-4" />} title="The plan">
            {proposal.schedule.length ? (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="py-2 px-3 font-heading font-bold uppercase tracking-widest text-[10px]">
                        Start
                      </th>
                      <th className="py-2 px-3 font-heading font-bold uppercase tracking-widest text-[10px]">
                        Duration
                      </th>
                      <th className="py-2 px-3 font-heading font-bold uppercase tracking-widest text-[10px]">
                        Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.schedule.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 px-3 font-mono text-brand-dark">
                          {row.start || "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {row.duration_min ? `${row.duration_min} min` : "—"}
                        </td>
                        <td className="py-2 px-3">{row.activity || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="No schedule rows yet." />
            )}

            {proposal.activities.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-2">
                  Activities → what they achieve
                </p>
                <ul className="space-y-2">
                  {proposal.activities.map((a, i) => (
                    <li
                      key={i}
                      className="bg-gray-50 border border-gray-100 rounded-md px-3 py-2 text-sm"
                    >
                      <p className="font-bold text-brand-dark">{a.activity || "—"}</p>
                      {a.achieves && (
                        <p className="text-gray-600 mt-0.5">{a.achieves}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section icon={<UserCog className="h-4 w-4" />} title="Team">
            <FieldGrid>
              <Field label="Event planner">
                {nameOf(proposal.event_planner_id) ?? <Empty />}
              </Field>
              <Field label="Event facilitator">
                {nameOf(proposal.event_facilitator_id) ??
                  proposal.event_facilitator_external ?? <Empty />}
              </Field>
              <Field label="Assistant volunteers" full>
                {proposal.assistant_volunteer_ids.length ||
                proposal.assistant_volunteers_external ? (
                  <div className="space-y-1">
                    {proposal.assistant_volunteer_ids.length > 0 && (
                      <ChipRow>
                        {proposal.assistant_volunteer_ids.map((mid) => (
                          <Chip key={mid}>{nameOf(mid) ?? "Unknown"}</Chip>
                        ))}
                      </ChipRow>
                    )}
                    {proposal.assistant_volunteers_external && (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {proposal.assistant_volunteers_external}
                      </p>
                    )}
                  </div>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Staff needed" full>
                {proposal.staff_needed.length ? (
                  <ul className="text-sm space-y-1">
                    {proposal.staff_needed.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 h-6 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold">
                          {s.count || 0}
                        </span>
                        {s.role || "—"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Ratio">
                {proposal.ratio_adults && proposal.ratio_children ? (
                  <span className="text-sm">
                    1 adult : {Math.round(proposal.ratio_children / (proposal.ratio_adults || 1))}{" "}
                    children
                  </span>
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-2 inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Safeguarding
              </p>
              {proposal.safeguarding_practices.length ? (
                <ChipRow>
                  {proposal.safeguarding_practices.map((p) => (
                    <Chip key={p}>
                      {SAFEGUARDING_PRACTICES.find((o) => o.value === p)?.label ?? p}
                    </Chip>
                  ))}
                </ChipRow>
              ) : (
                <Empty text="None flagged." />
              )}
              {proposal.safeguarding_notes && (
                <p className="whitespace-pre-wrap text-sm text-brand-dark mt-3">
                  {proposal.safeguarding_notes}
                </p>
              )}
            </div>
          </Section>

          <Section icon={<Package className="h-4 w-4" />} title="Kit & budget">
            <FieldGrid>
              <Field label="Equipment" full>
                {proposal.equipment.length ? (
                  <StringList items={proposal.equipment} />
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Equipment source">
                {proposal.equipment_source ?? <Empty />}
              </Field>
              <Field label="Funding pots">
                {funds.length ? (
                  <ChipRow>
                    {funds.map((f) => (
                      <Chip key={f.id}>
                        {f.code} · {f.name}
                      </Chip>
                    ))}
                  </ChipRow>
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
            {proposal.cost_lines.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-2 inline-flex items-center gap-1.5">
                  <PoundSterling className="h-3.5 w-3.5" />
                  Cost breakdown
                </p>
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md">
                  {proposal.cost_lines.map((c, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{c.item || "—"}</span>
                      <span className="font-mono">{fmtMoney(c.amount_pence || 0)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between px-3 py-2 text-sm bg-gray-50 font-bold">
                    <span>Total</span>
                    <span className="font-mono">{fmtMoney(totalBudgetPence)}</span>
                  </li>
                </ul>
              </div>
            )}
          </Section>

          <Section icon={<AlertTriangle className="h-4 w-4" />} title="Risk">
            {proposal.key_risks.length ? (
              <ul className="space-y-2">
                {proposal.key_risks.map((r, i) => (
                  <li
                    key={i}
                    className="bg-gray-50 border border-gray-100 rounded-md px-3 py-2 text-sm"
                  >
                    <p className="text-brand-dark">{r.risk || "—"}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-600">
                      <span>
                        Likelihood: <b>{r.likelihood}</b>
                      </span>
                      <span>
                        Impact: <b>{r.impact}</b>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No risks logged." />
            )}
            {proposal.contingency_plan && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-2">
                  Contingency plan
                </p>
                <p className="whitespace-pre-wrap text-sm text-brand-dark">
                  {proposal.contingency_plan}
                </p>
              </div>
            )}
          </Section>

          <Section icon={<Megaphone className="h-4 w-4" />} title="Promotion & tracking">
            <FieldGrid>
              <Field label="Promotion channels" full>
                {proposal.promotion_channels.length ? (
                  <ChipRow>
                    {proposal.promotion_channels.map((c) => (
                      <Chip key={c}>
                        {PROMOTION_CHANNELS.find((o) => o.value === c)?.label ?? c}
                      </Chip>
                    ))}
                  </ChipRow>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Registration method">
                {proposal.registration_method
                  ? REGISTRATION_METHODS.find((o) => o.value === proposal.registration_method)
                      ?.label ?? proposal.registration_method
                  : <Empty />}
              </Field>
              <Field label="Photo / video consent">
                {proposal.photo_video_consent_default ? (
                  <span className="text-sm capitalize">
                    {proposal.photo_video_consent_default.replace("_", "-")}
                  </span>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Registration notes" full>
                {proposal.registration_notes ? (
                  <p className="whitespace-pre-wrap text-sm text-brand-dark">
                    {proposal.registration_notes}
                  </p>
                ) : (
                  <Empty />
                )}
              </Field>
              <Field label="Success measures" full>
                {proposal.success_measures.length ? (
                  <StringList items={proposal.success_measures} />
                ) : (
                  <Empty />
                )}
              </Field>
            </FieldGrid>
          </Section>
        </div>

        {/* Discussion (1 col) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-3">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-blue" />
                <p className="font-heading font-bold text-brand-dark">
                  Discussion
                </p>
                <span className="ml-auto text-xs text-gray-500">
                  {comments.length} {comments.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              {comments.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nothing here yet — kick things off below.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                  {comments.map((c) => {
                    const author = c.author_id ? memberById.get(c.author_id) : null;
                    const label = author ? author.name || author.email : "System";
                    return (
                      <li
                        key={c.id}
                        className={`p-4 ${c.is_system ? "bg-gray-50" : ""}`}
                      >
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <p
                            className={`text-xs font-heading font-bold uppercase tracking-widest ${c.is_system ? "text-gray-500" : "text-brand-dark"}`}
                          >
                            {c.is_system ? "System" : label}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {fmtDateTime(c.created_at)}
                          </p>
                        </div>
                        <p
                          className={`text-sm whitespace-pre-wrap ${c.is_system ? "text-gray-600 italic" : "text-brand-dark"}`}
                        >
                          {c.body}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="p-4 border-t border-gray-100">
                <ProposalCommentForm proposalId={proposal.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Presentational helpers ─────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
      <h2 className="flex items-center gap-2 font-heading font-bold text-brand-dark mb-3">
        <span className="text-brand-blue">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[10px] text-gray-500 font-heading font-bold uppercase tracking-widest mb-1">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Empty({ text = "Not set" }: { text?: string }) {
  return <span className="text-sm text-gray-400 italic">{text}</span>;
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-pale text-brand-dark">
      {children}
    </span>
  );
}

function StringList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm text-brand-dark">
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  );
}

function VenueBlock({
  title,
  name,
  address,
  type,
  notes,
}: {
  title: string;
  name: string | null;
  address: string | null;
  type: "indoor" | "outdoor" | "both" | null;
  notes: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-heading font-bold uppercase tracking-widest mb-1">
        {title}
      </p>
      {name || address ? (
        <>
          <p className="text-sm font-bold text-brand-dark">{name || "—"}</p>
          {address && (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{address}</p>
          )}
          {type && (
            <span className="inline-block mt-1 text-xs text-gray-500 capitalize">
              {type}
            </span>
          )}
          {notes && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{notes}</p>
          )}
        </>
      ) : (
        <Empty />
      )}
    </div>
  );
}
