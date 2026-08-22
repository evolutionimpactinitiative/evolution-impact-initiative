"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  AlertTriangle,
  RotateCcw,
  Keyboard,
  Loader2,
  Users,
  Search,
  ArrowRight,
  ClipboardCheck,
  Package,
  Printer,
  UserPlus,
} from "lucide-react";
import { extractB2SQrToken } from "@/lib/back-to-school/scan";
import Link from "next/link";

interface Props {
  stewardToken: string;
  label: string;
  totalRegistrations: number;
  // Deep link to /back-to-school/walk-in?k=…&s=<this token>. Null if the
  // venue key isn't configured — in that case we render a small notice.
  assistedWalkInUrl: string | null;
}

type ScanMode = "checkin" | "pick" | "collect";

type State =
  | { kind: "idle" }
  | { kind: "resolving"; token: string }
  | { kind: "error"; message: string };

export function StewardScannerB2S({
  stewardToken,
  label,
  totalRegistrations,
  assistedWalkInUrl,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();
  const modeParam = currentParams.get("mode");
  const mode: ScanMode =
    modeParam === "pick"
      ? "pick"
      : modeParam === "checkin"
        ? "checkin"
        : "collect";
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const lastScanRef = React.useRef<string | null>(null);

  function setMode(next: ScanMode) {
    const params = new URLSearchParams(currentParams.toString());
    if (next === "collect") params.delete("mode");
    else params.set("mode", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function goToVerify(token: string) {
    // Check-in mode goes through the prep screen first so the steward
    // can confirm availability and accept substitutions before the
    // labels print. Pick + collect skip prep — those flows are for
    // reading picks and marking collected on the day.
    if (mode === "checkin") {
      router.push(
        `/b2s/prep/${encodeURIComponent(token)}?s=${encodeURIComponent(stewardToken)}`,
      );
      return;
    }
    const pickSuffix = mode === "pick" ? "&pick=1" : "";
    router.push(
      `/b2s/verify/${encodeURIComponent(token)}?s=${encodeURIComponent(stewardToken)}${pickSuffix}`,
    );
  }

  function handleScan(codes: IDetectedBarcode[]) {
    if (state.kind === "resolving") return;
    const raw = codes[0]?.rawValue;
    if (!raw) return;
    if (raw === lastScanRef.current) return;
    lastScanRef.current = raw;

    const token = extractB2SQrToken(raw);
    if (!token) {
      setState({
        kind: "error",
        message: "That doesn't look like a Back to School QR code.",
      });
      return;
    }
    setState({ kind: "resolving", token });
    goToVerify(token);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const token = extractB2SQrToken(manualCode);
    if (!token) {
      setState({
        kind: "error",
        message: "Could not read that token. Please try again.",
      });
      return;
    }
    setState({ kind: "resolving", token });
    // goToVerify already respects the current mode via the URL param.
    goToVerify(token);
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-blue font-heading font-bold">
              Steward
            </p>
            <p className="font-heading font-bold text-brand-dark">{label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-heading font-bold">
              Ready to scan
            </p>
            <p className="font-heading font-bold text-brand-dark inline-flex items-center gap-1">
              <Users className="h-4 w-4 text-brand-blue" />
              {totalRegistrations}
            </p>
            {totalRegistrations === 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5 max-w-[9rem]">
                No approvals yet. Send the Friday 6pm blast to open the drive.
              </p>
            )}
          </div>
        </div>

        {/* Mode toggle — which station am I on? */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-heading font-bold mb-1.5">
            Scan mode — pick your station
          </p>
          <div className="inline-flex items-stretch rounded-lg bg-gray-100 p-1 gap-1 w-full">
            <button
              type="button"
              onClick={() => setMode("checkin")}
              className={
                (mode === "checkin"
                  ? "bg-brand-dark text-white shadow-sm"
                  : "bg-transparent text-brand-dark hover:bg-white") +
                " flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-widest transition-colors"
              }
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Check-in</span>
              <span className="opacity-70 text-[9px]">Station 2</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("pick")}
              className={
                (mode === "pick"
                  ? "bg-brand-blue text-white shadow-sm"
                  : "bg-transparent text-brand-dark hover:bg-white") +
                " flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-widest transition-colors"
              }
            >
              <Package className="h-3.5 w-3.5" />
              <span>Pick</span>
              <span className="opacity-70 text-[9px]">Station 3</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("collect")}
              className={
                (mode === "collect"
                  ? "bg-brand-green text-white shadow-sm"
                  : "bg-transparent text-brand-dark hover:bg-white") +
                " flex-1 inline-flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-widest transition-colors"
              }
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              <span>Collect</span>
              <span className="opacity-70 text-[9px]">Station 4</span>
            </button>
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden aspect-square bg-black">
          <Scanner
            onScan={handleScan}
            allowMultiple={false}
            components={{ finder: true }}
            styles={{
              container: { width: "100%", height: "100%" },
              video: { width: "100%", height: "100%", objectFit: "cover" },
            }}
          />
          {state.kind === "resolving" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white rounded-full p-4">
                <Loader2 className="h-6 w-6 text-brand-blue animate-spin" />
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Point the camera at the family&rsquo;s QR code.
        </p>
      </div>

      {state.kind === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{state.message}</p>
            <button
              type="button"
              onClick={() => {
                setState({ kind: "idle" });
                lastScanRef.current = null;
              }}
              className="mt-2 inline-flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-widest text-red-800 hover:text-red-950"
            >
              <RotateCcw className="h-3 w-3" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Manual entry */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-dark"
        >
          <span className="inline-flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-brand-blue" />
            Manual entry
          </span>
          <span className="text-xs text-gray-500">
            {manualOpen ? "Hide" : "Show"}
          </span>
        </button>
        {manualOpen && (
          <form onSubmit={submitManual} className="mt-3 flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste token or URL"
              className="flex-1 h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <button
              type="submit"
              className="bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
            >
              Open
            </button>
          </form>
        )}
      </div>

      {/* Assisted walk-in — Station 1 registers a family without a phone */}
      {assistedWalkInUrl ? (
        <Link
          href={assistedWalkInUrl}
          className="block bg-brand-dark hover:bg-brand-blue text-white rounded-2xl p-4 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold uppercase tracking-widest text-xs text-brand-accent mb-0.5">
                Family without a phone?
              </p>
              <p className="font-heading font-bold text-sm">
                Register a phoneless family
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">
                Fill in the walk-in form on this device, print their ticket,
                then loop back for the next family.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </div>
        </Link>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
          <p className="font-heading font-bold uppercase tracking-widest text-xs mb-1">
            Assisted registration unavailable
          </p>
          <p>
            Walk-in venue key not configured — ask admin to set{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded">B2S_WALK_IN_KEY</code>{" "}
            in Vercel.
          </p>
        </div>
      )}

      {/* Family lookup — bounce/no-email recovery */}
      <FamilyLookup
        stewardToken={stewardToken}
        onOpen={(qrToken) => goToVerify(qrToken)}
      />
    </div>
  );
}

interface LookupResult {
  id: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentPostcode: string | null;
  status: string;
  distributionStatus: string | null;
  qrToken: string;
}

function FamilyLookup({
  stewardToken,
  onOpen,
}: {
  stewardToken: string;
  onOpen: (qrToken: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<LookupResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/back-to-school/lookup?q=${encodeURIComponent(trimmed)}&s=${encodeURIComponent(stewardToken)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Search failed");
        setResults((data.results ?? []) as LookupResult[]);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, open, stewardToken]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm font-heading font-bold uppercase tracking-widest text-brand-dark"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-4 w-4 text-brand-blue" />
          Can&rsquo;t scan? Look them up
        </span>
        <span className="text-xs text-gray-500">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, or phone"
            autoFocus
            className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          {loading && (
            <p className="text-xs text-gray-500 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </p>
          )}
          {error && (
            <p className="text-xs text-red-700">{error}</p>
          )}
          {!loading && q.trim().length >= 2 && results.length === 0 && !error && (
            <p className="text-xs text-gray-500">
              No matches. Check spelling or try a different field.
            </p>
          )}
          {results.length > 0 && (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(r.qrToken)}
                    className="w-full text-left px-3 py-2.5 hover:bg-brand-pale/40 flex items-center gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-brand-dark text-sm truncate">
                        {r.parentName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {r.parentEmail} · {r.parentPhone}
                        {r.parentPostcode ? ` · ${r.parentPostcode}` : ""}
                      </p>
                    </div>
                    <StatusPill
                      status={r.status}
                      distributionStatus={r.distributionStatus}
                    />
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({
  status,
  distributionStatus,
}: {
  status: string;
  distributionStatus: string | null;
}) {
  const effective = distributionStatus ?? status;
  const map: Record<string, { bg: string; text: string; label: string }> = {
    approved: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Approved" },
    pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" },
    waitlisted: { bg: "bg-blue-100", text: "text-blue-800", label: "Waitlist" },
    walk_in: { bg: "bg-purple-100", text: "text-purple-800", label: "Walk-in" },
    declined: { bg: "bg-red-100", text: "text-red-800", label: "Declined" },
    collected: { bg: "bg-emerald-200", text: "text-emerald-900", label: "Collected" },
    partial: { bg: "bg-amber-200", text: "text-amber-900", label: "Partial" },
    no_show: { bg: "bg-red-200", text: "text-red-900", label: "No-show" },
  };
  const s =
    map[effective] || { bg: "bg-gray-100", text: "text-gray-700", label: effective };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-widest ${s.bg} ${s.text} shrink-0`}
    >
      {s.label}
    </span>
  );
}
