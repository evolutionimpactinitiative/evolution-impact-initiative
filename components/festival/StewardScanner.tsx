"use client";

import * as React from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Keyboard,
  Loader2,
  Users,
} from "lucide-react";
import { FESTIVAL } from "@/lib/festival";

interface Props {
  token: string;
  label: string;
  totalTickets: number;
}

type ResultKind =
  | { kind: "idle" }
  | { kind: "checking" }
  | {
      kind: "ok";
      checkedIn: number;
      ticket: {
        code: string;
        holder_name: string | null;
        holder_type: "lead" | "adult" | "child";
        checked_in_at: string;
      };
      party_size: number;
      lead_name: string;
      already: boolean;
    }
  | { kind: "error"; message: string };

const COOLDOWN_MS = 1800;

export function StewardScanner({ token, label, totalTickets }: Props) {
  const [result, setResult] = React.useState<ResultKind>({ kind: "idle" });
  const [sessionCount, setSessionCount] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const cooldownRef = React.useRef<number | null>(null);
  const lastCodeRef = React.useRef<string | null>(null);

  // Resume scanning after a short cooldown
  React.useEffect(() => {
    if (!paused) return;
    const id = window.setTimeout(() => {
      setPaused(false);
      setResult({ kind: "idle" });
      lastCodeRef.current = null;
    }, COOLDOWN_MS);
    cooldownRef.current = id;
    return () => window.clearTimeout(id);
  }, [paused]);

  async function attemptCheckIn(rawValue: string) {
    if (paused || result.kind === "checking") return;
    if (rawValue === lastCodeRef.current) return;
    lastCodeRef.current = rawValue;

    setPaused(true);
    setResult({ kind: "checking" });
    try {
      const res = await fetch("/api/festival/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: rawValue }),
      });
      const data = await res.json();

      if (!data.ok) {
        if (res.status === 401) {
          setResult({
            kind: "error",
            message: "Steward access expired. Please get a fresh link.",
          });
        } else if (res.status === 404) {
          setResult({
            kind: "error",
            message: "Not a valid ticket for this event.",
          });
        } else {
          setResult({
            kind: "error",
            message: data.error ?? "Couldn't process this ticket.",
          });
        }
        haptic("error");
        return;
      }

      const isAlready = data.status === "already_checked_in";
      if (!isAlready) setSessionCount((c) => c + 1);
      setResult({
        kind: "ok",
        checkedIn: 0,
        ticket: data.ticket,
        party_size: data.party_size,
        lead_name: data.lead_name,
        already: isAlready,
      });
      haptic(isAlready ? "warning" : "success");
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
      haptic("error");
    }
  }

  function onScan(detected: IDetectedBarcode[]) {
    if (detected.length === 0) return;
    const value = detected[0]?.rawValue;
    if (value) attemptCheckIn(value);
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await attemptCheckIn(manualCode.trim());
    setManualCode("");
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col">
      {/* Header */}
      <header className="px-4 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-[10px] uppercase tracking-widest text-brand-accent">
              {FESTIVAL.title} · Door scanner
            </p>
            <p className="font-heading font-bold text-base truncate">
              Steward: {label}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading font-black text-2xl text-brand-accent leading-none">
              {sessionCount}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-white/50">
              this session
            </p>
          </div>
        </div>
        <p className="text-[11px] text-white/40 mt-2">
          {totalTickets} tickets issued in total
        </p>
      </header>

      {/* Scanner */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <div className="absolute inset-0">
          <Scanner
            onScan={onScan}
            onError={(err) => console.warn("[scanner]", err)}
            paused={paused}
            constraints={{ facingMode: "environment" }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: {
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
            }}
            components={{ finder: true }}
          />
        </div>

        {/* Result overlay */}
        {result.kind !== "idle" && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <ResultPanel result={result} />
          </div>
        )}

        {/* Manual entry toggle */}
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm rounded-full p-2.5 text-white"
          aria-label="Manual entry"
        >
          <Keyboard className="h-5 w-5" />
        </button>
      </div>

      {/* Manual code sheet */}
      {manualOpen && (
        <div className="bg-black/70 backdrop-blur-md px-4 py-5 border-t border-white/10">
          <form onSubmit={submitManual} className="flex items-stretch gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Type ticket code (e.g. ABC234XYZ7)"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-accent uppercase font-mono tracking-wider"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || paused}
              className="bg-brand-accent text-brand-dark px-4 py-2.5 rounded-md font-heading font-bold uppercase text-xs tracking-widest disabled:opacity-50"
            >
              Check in
            </button>
          </form>
        </div>
      )}

      {/* Footer hint */}
      <footer className="px-4 py-3 text-center border-t border-white/10">
        <p className="text-[11px] text-white/40">
          Point the camera at the QR. Tap{" "}
          <Keyboard className="inline h-3 w-3 mb-0.5" /> to type a code manually.
        </p>
      </footer>
    </div>
  );
}

function ResultPanel({ result }: { result: Exclude<ResultKind, { kind: "idle" }> }) {
  if (result.kind === "checking") {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
        <p className="text-sm font-heading font-semibold">Checking…</p>
      </div>
    );
  }

  if (result.kind === "error") {
    return (
      <div className="bg-red-600/95 backdrop-blur-md rounded-2xl p-5 text-white">
        <div className="flex items-start gap-3">
          <XCircle className="h-7 w-7 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-heading font-black text-lg uppercase tracking-wide">
              No entry
            </p>
            <p className="text-sm text-white/90 mt-1">{result.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const { ticket, party_size, lead_name, already } = result;
  const Icon = already ? AlertTriangle : CheckCircle2;
  const tone = already
    ? "bg-amber-500/95 text-amber-950"
    : "bg-brand-accent/95 text-brand-dark";

  return (
    <div className={`backdrop-blur-md rounded-2xl p-5 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-8 w-8 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-heading font-black text-xl uppercase tracking-wide leading-tight">
            {already ? "Already checked in" : "Welcome in"}
          </p>
          <p className="font-heading font-bold text-lg truncate">
            {ticket.holder_name || "Guest"}
          </p>
          <p className="text-sm flex items-center gap-1.5 mt-1 opacity-80">
            <Users className="h-3.5 w-3.5" />
            Party of {party_size} · led by {lead_name}
          </p>
          {already && (
            <p className="text-xs mt-1.5 opacity-80">
              First scan {new Date(ticket.checked_in_at).toLocaleString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>
        <RotateCcw className="h-4 w-4 opacity-50 shrink-0" />
      </div>
    </div>
  );
}

function haptic(kind: "success" | "warning" | "error") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (kind === "success") navigator.vibrate(80);
  else if (kind === "warning") navigator.vibrate([60, 60, 60]);
  else navigator.vibrate([200, 80, 200]);
}
