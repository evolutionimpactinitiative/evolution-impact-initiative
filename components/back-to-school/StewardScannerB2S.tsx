"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import {
  AlertTriangle,
  RotateCcw,
  Keyboard,
  Loader2,
  Users,
} from "lucide-react";
import { extractB2SQrToken } from "@/lib/back-to-school/scan";

interface Props {
  stewardToken: string;
  label: string;
  totalRegistrations: number;
}

type State =
  | { kind: "idle" }
  | { kind: "resolving"; token: string }
  | { kind: "error"; message: string };

export function StewardScannerB2S({
  stewardToken,
  label,
  totalRegistrations,
}: Props) {
  const router = useRouter();
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const lastScanRef = React.useRef<string | null>(null);

  function goToVerify(token: string) {
    router.push(
      `/b2s/verify/${encodeURIComponent(token)}?s=${encodeURIComponent(stewardToken)}`,
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
              Registrations
            </p>
            <p className="font-heading font-bold text-brand-dark inline-flex items-center gap-1">
              <Users className="h-4 w-4 text-brand-blue" />
              {totalRegistrations}
            </p>
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
    </div>
  );
}
