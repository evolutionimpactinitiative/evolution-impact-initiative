"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createOutcomeInvitation } from "@/lib/outcomes/actions";
import type { OutcomeInstrument, Timepoint } from "@/lib/outcomes/types";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ExistingParticipant {
  id: string;
  name: string | null;
  email: string | null;
}

interface Props {
  instruments: OutcomeInstrument[];
  recentParticipants: ExistingParticipant[];
  strandSuggestions: string[];
}

const TIMEPOINTS: { value: Timepoint; label: string }[] = [
  { value: "baseline", label: "Baseline" },
  { value: "midpoint", label: "Mid-point" },
  { value: "follow_up", label: "Follow-up" },
  { value: "one_off", label: "One-off" },
];

export function InvitationForm({ instruments, recentParticipants, strandSuggestions }: Props) {
  const router = useRouter();

  const [instrumentId, setInstrumentId] = useState<string>(instruments[0]?.id ?? "");
  const [timepoint, setTimepoint] = useState<Timepoint>("baseline");
  const [participantMode, setParticipantMode] = useState<"new" | "existing">("new");
  const [participantId, setParticipantId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [contextLabel, setContextLabel] = useState("");
  const [programmeStrand, setProgrammeStrand] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [expiresInDays, setExpiresInDays] = useState(90);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    { url: string; emailed: boolean; token: string } | null
  >(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!instrumentId) return setError("Pick an instrument");
    if (participantMode === "new" && !newName && !newEmail)
      return setError("Provide at least a participant name or email");
    if (participantMode === "existing" && !participantId)
      return setError("Pick a participant");

    setSubmitting(true);
    try {
      const res = await createOutcomeInvitation({
        instrument_id: instrumentId,
        timepoint,
        participant_id:
          participantMode === "existing" ? participantId : undefined,
        new_participant_name:
          participantMode === "new" ? newName.trim() : undefined,
        new_participant_email:
          participantMode === "new" ? newEmail.trim() : undefined,
        context_label: contextLabel.trim() || undefined,
        programme_strand: programmeStrand.trim() || undefined,
        send_email: sendEmail,
        expires_in_days: Number(expiresInDays) || 90,
      });
      if (!res.ok) setError(res.error);
      else {
        setResult({ url: res.data.url, emailed: res.data.emailed, token: res.data.token });
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForAnother() {
    setResult(null);
    setNewName("");
    setNewEmail("");
    setParticipantId("");
    setContextLabel("");
    setCopied(false);
  }

  if (result) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl space-y-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">
              Invitation created
              {result.emailed ? " and emailed" : " — but not emailed"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {result.emailed
                ? "The participant should receive the email shortly."
                : "Save or share this link manually."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <code className="text-xs text-gray-700 truncate flex-1">{result.url}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(result.url);
              setCopied(true);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <Copy className="w-4 h-4" />
          </button>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        {copied && <p className="text-xs text-green-700">Copied to clipboard</p>}

        <div className="flex gap-2">
          <Button size="sm" onClick={resetForAnother}>
            Create another
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/admin/outcomes/invitations")}
          >
            View all invitations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {/* Instrument */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instrument
          </label>
          <select
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>
                {i.code} — {i.name}
              </option>
            ))}
          </select>
        </div>

        {/* Timepoint + Programme strand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timepoint
            </label>
            <select
              value={timepoint}
              onChange={(e) => setTimepoint(e.target.value as Timepoint)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              {TIMEPOINTS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programme strand (optional)
            </label>
            <input
              list="strand-suggestions"
              value={programmeStrand}
              onChange={(e) => setProgrammeStrand(e.target.value)}
              placeholder="e.g. cin_early_years"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <datalist id="strand-suggestions">
              {strandSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Context label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Context (optional)
          </label>
          <input
            value={contextLabel}
            onChange={(e) => setContextLabel(e.target.value)}
            placeholder="e.g. Early Years cohort 1 baseline, July 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Shown to the participant on the survey page.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-medium text-gray-700">Recipient</p>

        {/* Participant mode toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setParticipantMode("new")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              participantMode === "new" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
          >
            New participant
          </button>
          <button
            type="button"
            onClick={() => setParticipantMode("existing")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              participantMode === "existing" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
            disabled={recentParticipants.length === 0}
          >
            Existing
          </button>
        </div>

        {participantMode === "new" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email (required if sending)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ) : (
          <select
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">— Select participant —</option>
            {recentParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? "(unnamed)"} {p.email ? `· ${p.email}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send invitation email now
          </label>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Expires in</span>
            <input
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded"
            />
            <span>days</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating…
            </>
          ) : (
            <>Create invitation</>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/outcomes")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
