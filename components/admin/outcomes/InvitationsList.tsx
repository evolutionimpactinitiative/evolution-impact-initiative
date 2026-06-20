"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resendInvitationEmail } from "@/lib/outcomes/actions";
import { formatDate } from "@/lib/accounting/format";
import { Copy, Send, CheckCircle2, Plus, ExternalLink } from "lucide-react";

interface InvitationRow {
  id: string;
  token: string;
  context_label: string | null;
  programme_strand: string | null;
  timepoint: string;
  recipient_email: string | null;
  email_sent_at: string | null;
  expires_at: string | null;
  response_id: string | null;
  created_at: string;
  instrument: { code: string; name: string } | null;
  participant: { name: string | null; email: string | null } | null;
}

interface Props {
  rows: InvitationRow[];
  baseUrl: string;
}

type Tab = "pending" | "completed" | "all";

export function InvitationsList({ rows, baseUrl }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [resending, setResending] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = rows.filter((r) => {
    if (tab === "pending") return r.response_id == null;
    if (tab === "completed") return r.response_id != null;
    return true;
  });

  function urlFor(token: string): string {
    return `${baseUrl}/outcomes/${token}`;
  }

  async function handleResend(id: string) {
    setResending(id);
    try {
      const res = await resendInvitationEmail(id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    } finally {
      setResending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
          {(["pending", "completed", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 capitalize font-medium rounded-md ${
                tab === t ? "bg-white text-brand-dark shadow-sm" : "text-gray-500"
              }`}
            >
              {t}
              <span className="ml-1.5 text-xs text-gray-400">
                {t === "pending"
                  ? rows.filter((r) => r.response_id == null).length
                  : t === "completed"
                    ? rows.filter((r) => r.response_id != null).length
                    : rows.length}
              </span>
            </button>
          ))}
        </div>
        <Button asChild>
          <Link href="/admin/outcomes/invitations/new">
            <Plus className="w-4 h-4 mr-2" />
            New invitation
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-500 text-sm">
          No invitations in this view.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Instrument</th>
                <th className="px-3 py-2 text-left">Participant</th>
                <th className="px-3 py-2 text-left">Strand</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const expired =
                  r.expires_at != null && new Date(r.expires_at) < new Date();
                const status = r.response_id
                  ? "completed"
                  : expired
                    ? "expired"
                    : r.email_sent_at
                      ? "sent"
                      : "draft";
                const statusClass =
                  status === "completed"
                    ? "bg-green-100 text-green-700"
                    : status === "sent"
                      ? "bg-blue-100 text-blue-700"
                      : status === "expired"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600";
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">
                        {r.instrument?.code ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">{r.timepoint}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-gray-900">
                        {r.participant?.name ?? "(no name)"}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {r.recipient_email ?? r.participant?.email ?? "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {r.programme_strand ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="Copy link"
                          onClick={() => {
                            navigator.clipboard.writeText(urlFor(r.token));
                            setCopiedId(r.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {copiedId === r.id ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={urlFor(r.token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open"
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {!r.response_id && !expired && r.recipient_email && (
                          <button
                            type="button"
                            title="Resend email"
                            disabled={resending === r.id}
                            onClick={() => handleResend(r.id)}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
