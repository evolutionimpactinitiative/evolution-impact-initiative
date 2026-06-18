"use client";

import * as React from "react";
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  sendTestTicketEmail,
  deleteTestRegistration,
} from "@/app/admin/festival/test-ticket-email/actions";

type ResultState =
  | { kind: "idle" }
  | { kind: "sending" }
  | {
      kind: "success";
      email: string;
      registrationId: string;
      ticketCount: number;
      ticketUrls: string[];
      sent: boolean;
    }
  | { kind: "error"; message: string };

export function TestTicketEmailForm() {
  const [email, setEmail] = React.useState("");
  const [parentName, setParentName] = React.useState("Test Family");
  const [childrenCount, setChildrenCount] = React.useState(2);
  const [adultCount, setAdultCount] = React.useState(0);
  const [result, setResult] = React.useState<ResultState>({ kind: "idle" });
  const [deleting, setDeleting] = React.useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setResult({ kind: "sending" });
    const res = await sendTestTicketEmail({
      email,
      parentName,
      childrenCount,
      adultCount,
    });
    if (!res.ok) {
      setResult({ kind: "error", message: res.error });
      return;
    }
    setResult({
      kind: "success",
      email,
      registrationId: res.registrationId,
      ticketCount: res.ticketCount,
      ticketUrls: res.ticketUrls,
      sent: res.sent,
    });
  }

  async function onDelete() {
    if (result.kind !== "success") return;
    if (!confirm("Delete this test registration and its tickets?")) return;
    setDeleting(true);
    const res = await deleteTestRegistration(result.registrationId);
    setDeleting(false);
    if (!res.ok) {
      alert(`Couldn't delete: ${res.error}`);
      return;
    }
    setResult({ kind: "idle" });
    setEmail("");
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <form
        onSubmit={onSend}
        className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-heading font-semibold text-gray-700 mb-1.5">
            Send test email to
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1.5">
              Lead booker name
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1.5">
              Children (0–4)
            </label>
            <input
              type="number"
              min={0}
              max={4}
              value={childrenCount}
              onChange={(e) =>
                setChildrenCount(Math.max(0, Math.min(4, Number(e.target.value))))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1.5">
              Additional adults (0–5)
            </label>
            <input
              type="number"
              min={0}
              max={5}
              value={adultCount}
              onChange={(e) =>
                setAdultCount(Math.max(0, Math.min(5, Number(e.target.value))))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          The email will contain {1 + childrenCount + adultCount} tickets
          (1 lead + {childrenCount} children + {adultCount} adults), each with
          its own QR code and shareable URL.
        </p>

        <button
          type="submit"
          disabled={!email.trim() || result.kind === "sending"}
          className="inline-flex items-center gap-2 bg-brand-blue text-white text-sm font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded-md hover:bg-brand-green transition-colors disabled:opacity-50"
        >
          {result.kind === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Send test ticket email
        </button>
      </form>

      {/* Error */}
      {result.kind === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-heading font-bold">Couldn&rsquo;t send</p>
            <p>{result.message}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {result.kind === "success" && (
        <div className="bg-white border border-emerald-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-brand-green shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-heading font-black text-lg text-brand-dark">
                {result.sent
                  ? `Email sent to ${result.email}`
                  : `Test created (RESEND_API_KEY not set — no email sent)`}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {result.ticketCount} ticket{result.ticketCount === 1 ? "" : "s"} generated. Check the inbox, then click any URL below to see the live ticket page.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-gray-500 mb-2">
              Live ticket URLs
            </p>
            <ul className="space-y-1.5">
              {result.ticketUrls.map((url, i) => (
                <li key={url} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 font-mono text-xs w-6">
                    #{i + 1}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:underline truncate font-mono text-xs"
                  >
                    {url}
                  </a>
                  <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete test registration
            </button>
            <p className="text-xs text-gray-500 sm:ml-2 self-center">
              Removes the test row from <code className="bg-gray-100 px-1 rounded">registrations</code> + all linked tickets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
