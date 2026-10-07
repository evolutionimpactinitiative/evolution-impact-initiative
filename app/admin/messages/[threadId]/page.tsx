import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, UserCheck, UserMinus, CheckCircle2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminAssignToMe,
  adminUnassign,
  adminSetStatus,
} from "../actions";
import { AdminReplyComposer } from "./AdminReplyComposer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Thread = {
  id: string;
  family_id: string;
  status: "open" | "resolved";
  assigned_admin_id: string | null;
  last_message_at: string | null;
};

type Message = {
  id: string;
  sender_type: "family" | "team";
  sender_carer_id: string | null;
  sender_team_id: string | null;
  body: string;
  created_at: string;
  chat_attachments: {
    id: string;
    storage_path: string;
    filename: string;
    mime_type: string | null;
  }[];
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function signedUrl(path: string): Promise<string | null> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).storage
    .from("chat-attachments")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (admin as any)
    .from("team_members")
    .select("id, name")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!me) redirect("/admin");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: threadRaw } = await (admin as any)
    .from("chat_threads")
    .select("id, family_id, status, assigned_admin_id, last_message_at")
    .eq("id", threadId)
    .maybeSingle();
  const thread = threadRaw as Thread | null;
  if (!thread) notFound();

  // Family + primary carer for the header.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: family } = await (admin as any)
    .from("families")
    .select("id, postcode, parent_carers (id, name, email, phone, is_primary)")
    .eq("id", thread.family_id)
    .maybeSingle();
  const primary = family?.parent_carers.find((c: { is_primary: boolean }) => c.is_primary) ||
    family?.parent_carers?.[0];

  // Messages.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messagesRaw } = await (admin as any)
    .from("chat_messages")
    .select(
      `id, sender_type, sender_carer_id, sender_team_id, body, created_at,
       chat_attachments (id, storage_path, filename, mime_type)`,
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  const messages = (messagesRaw as Message[] | null) ?? [];

  // Mark all family messages as read_by_team now (shared inbox — any
  // admin reading counts as team-read).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("chat_messages")
    .update({ read_by_team_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("sender_type", "family")
    .is("read_by_team_at", null);

  // Resolve sender names (carer first names + team names).
  const carerIds = Array.from(
    new Set(messages.filter((m) => m.sender_carer_id).map((m) => m.sender_carer_id!)),
  );
  const teamIds = Array.from(
    new Set(messages.filter((m) => m.sender_team_id).map((m) => m.sender_team_id!)),
  );
  const carerNames: Record<string, string> = {};
  const teamNames: Record<string, string> = {};
  if (carerIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: carers } = await (admin as any)
      .from("parent_carers")
      .select("id, name")
      .in("id", carerIds);
    for (const c of (carers as { id: string; name: string }[] | null) ?? []) {
      carerNames[c.id] = c.name;
    }
  }
  if (teamIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tms } = await (admin as any)
      .from("team_members")
      .select("id, name")
      .in("id", teamIds);
    for (const t of (tms as { id: string; name: string }[] | null) ?? []) {
      teamNames[t.id] = t.name;
    }
  }

  // Attachment URLs.
  const attachmentUrls: Record<string, string> = {};
  for (const m of messages) {
    for (const a of m.chat_attachments ?? []) {
      const url = await signedUrl(a.storage_path);
      if (url) attachmentUrls[a.id] = url;
    }
  }

  // Assigned admin name.
  let assignedName: string | null = null;
  if (thread.assigned_admin_id) {
    if (thread.assigned_admin_id === me.id) {
      assignedName = me.name;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: a } = await (admin as any)
        .from("team_members")
        .select("name")
        .eq("id", thread.assigned_admin_id)
        .maybeSingle();
      assignedName = a?.name ?? null;
    }
  }
  const mineAssigned = thread.assigned_admin_id === me.id;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/messages" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {primary?.name || "Family"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {primary?.email}
              {primary?.phone && <> · {primary.phone}</>}
              {family?.postcode && <> · {family.postcode}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {thread.status === "resolved" ? (
            <form action={adminSetStatus.bind(null, threadId, "open")}>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen
              </button>
            </form>
          ) : (
            <form action={adminSetStatus.bind(null, threadId, "resolved")}>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve
              </button>
            </form>
          )}
          {mineAssigned ? (
            <form action={adminUnassign.bind(null, threadId)}>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <UserMinus className="h-3.5 w-3.5" />
                Unassign
              </button>
            </form>
          ) : (
            <form action={adminAssignToMe.bind(null, threadId)}>
              <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <UserCheck className="h-3.5 w-3.5" />
                {assignedName ? "Take over" : "Assign to me"}
              </button>
            </form>
          )}
        </div>
      </div>

      {assignedName && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 md:px-6 py-2 text-xs text-blue-900">
          Assigned to <strong>{assignedName}</strong>
          {mineAssigned && " — that's you."}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 bg-gray-50 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No messages yet.
          </p>
        ) : (
          messages.map((m) => {
            const mineSide = m.sender_type === "team";
            const label =
              m.sender_type === "team"
                ? m.sender_team_id
                  ? teamNames[m.sender_team_id] || "EII Team"
                  : "EII Team"
                : m.sender_carer_id
                  ? carerNames[m.sender_carer_id] || "Family"
                  : "Family";
            return (
              <div
                key={m.id}
                className={`flex ${mineSide ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] ${mineSide ? "items-end" : "items-start"} flex flex-col`}>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1 px-1">
                    {label}
                  </p>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-snug whitespace-pre-wrap break-words ${
                      mineSide
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                  {m.chat_attachments && m.chat_attachments.length > 0 && (
                    <div className={`mt-2 flex flex-wrap gap-2 ${mineSide ? "justify-end" : "justify-start"}`}>
                      {m.chat_attachments.map((a) => {
                        const url = attachmentUrls[a.id];
                        if (!url) return null;
                        const isImg = (a.mime_type || "").startsWith("image/");
                        return isImg ? (
                          <a key={a.id} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={a.filename}
                              className="max-h-56 rounded-lg border border-gray-200"
                            />
                          </a>
                        ) : (
                          <a
                            key={a.id}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-blue-700 hover:border-blue-500"
                          >
                            {a.filename}
                          </a>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 px-1">
                    {fmt(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AdminReplyComposer threadId={threadId} />
    </div>
  );
}
