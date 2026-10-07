import { redirect } from "next/navigation";
import { Phone, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalIdentity } from "@/lib/portal/current-carer";
import { MessageComposer } from "./MessageComposer";
import { MarkReadOnMount } from "./MarkReadOnMount";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Message = {
  id: string;
  sender_type: "family" | "team";
  sender_carer_id: string | null;
  sender_team_id: string | null;
  body: string;
  created_at: string;
  read_by_family_at: string | null;
  chat_attachments: { id: string; storage_path: string; filename: string; mime_type: string | null }[];
};

const SUPPORT_PHONE = "+44 7874 059644";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", {
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
    .createSignedUrl(path, 60 * 60); // 1 hour
  return data?.signedUrl ?? null;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const identity = await resolvePortalIdentity(supabase, user);
  if (identity.kind === "stale_session") {
    redirect("/api/portal/session-end?reason=session_expired&next=/portal/messages");
  }
  if (identity.kind !== "carer") {
    redirect("/portal/family");
  }

  const carer = identity.carer;
  const admin = createAdminClient();

  // Load (or implicitly create-on-first-send) the family's thread + messages.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thread } = await (admin as any)
    .from("chat_threads")
    .select("id, status")
    .eq("family_id", carer.family_id)
    .maybeSingle();

  let messages: Message[] = [];
  if (thread) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (admin as any)
      .from("chat_messages")
      .select(
        `id, sender_type, sender_carer_id, sender_team_id, body,
         created_at, read_by_family_at,
         chat_attachments (id, storage_path, filename, mime_type)`,
      )
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    messages = (rows as Message[] | null) ?? [];
  }

  // Resolve attachment URLs server-side so the client gets usable links.
  const attachmentUrls: Record<string, string> = {};
  for (const m of messages) {
    for (const a of m.chat_attachments ?? []) {
      const url = await signedUrl(a.storage_path);
      if (url) attachmentUrls[a.id] = url;
    }
  }

  // Resolve team sender names so replies read "Macram" not a UUID.
  const teamSenderIds = Array.from(
    new Set(messages.filter((m) => m.sender_type === "team" && m.sender_team_id).map((m) => m.sender_team_id!)),
  );
  const teamNames: Record<string, string> = {};
  if (teamSenderIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: teamRows } = await (admin as any)
      .from("team_members")
      .select("id, name")
      .in("id", teamSenderIds);
    for (const t of (teamRows as { id: string; name: string }[] | null) ?? []) {
      teamNames[t.id] = t.name;
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
      <div className="bg-white sm:rounded-2xl sm:border border-brand-dark/10 flex flex-col h-[100dvh] sm:h-[80vh]">
        {/* Header */}
        <div className="border-b border-brand-dark/10 px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-brand-blue" />
            </div>
            <div>
              <h1 className="font-heading font-black text-lg text-brand-dark leading-tight">
                EII Team
              </h1>
              <p className="text-xs text-brand-dark/60">
                Growing Together · Evolution Impact Initiative
              </p>
            </div>
          </div>
        </div>

        {/* Office hours banner */}
        <div className="bg-brand-pale/40 border-b border-brand-dark/5 px-4 py-3 text-sm text-brand-dark/80">
          We usually reply <strong>Monday–Friday, 9am–5pm</strong>. If something&apos;s
          urgent and safeguarding-related, please call us on{" "}
          <a href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`} className="font-bold text-brand-blue inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            {SUPPORT_PHONE}
          </a>
          .
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-full bg-brand-pale/50 flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-brand-blue" />
              </div>
              <p className="font-heading font-bold text-brand-dark mb-1">
                Say hello
              </p>
              <p className="text-sm text-brand-dark/60 max-w-xs">
                This is the start of your conversation with the EII team. Ask us
                anything about Growing Together, upcoming sessions, or how we can
                support your family.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                teamName={m.sender_team_id ? teamNames[m.sender_team_id] : null}
                attachmentUrls={attachmentUrls}
              />
            ))
          )}
        </div>

        <MessageComposer threadId={thread?.id ?? null} />
      </div>

      {messages.some((m) => m.sender_type === "team" && !m.read_by_family_at) && (
        <MarkReadOnMount />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  teamName,
  attachmentUrls,
}: {
  message: Message;
  teamName: string | null;
  attachmentUrls: Record<string, string>;
}) {
  const mine = message.sender_type === "family";
  const senderLabel = mine ? null : teamName || "EII Team";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {senderLabel && (
          <p className="text-[10px] uppercase tracking-wider font-bold text-brand-dark/50 mb-1 px-1">
            {senderLabel}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-snug whitespace-pre-wrap break-words ${
            mine
              ? "bg-brand-blue text-white rounded-br-sm"
              : "bg-brand-pale/60 text-brand-dark rounded-bl-sm"
          }`}
        >
          {message.body}
        </div>

        {message.chat_attachments && message.chat_attachments.length > 0 && (
          <div className={`mt-2 flex flex-wrap gap-2 ${mine ? "justify-end" : "justify-start"}`}>
            {message.chat_attachments.map((a) => {
              const url = attachmentUrls[a.id];
              if (!url) return null;
              const isImage = (a.mime_type || "").startsWith("image/");
              return isImage ? (
                <a
                  key={a.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={a.filename}
                    className="max-h-64 rounded-lg border border-brand-dark/10"
                  />
                </a>
              ) : (
                <a
                  key={a.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-brand-dark/10 rounded-lg text-xs text-brand-blue hover:border-brand-blue"
                >
                  {a.filename}
                </a>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-brand-dark/40 mt-1 px-1">
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

