"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { backfillCompletedDonations } from "@/lib/accounting/donations-bridge";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";

interface Props {
  unbridgedCount: number;
}

export function DonationsBridgeBackfillCard({ unbridgedCount }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<
    | { posted: number; processed: number; failures: { donation_id: string; error: string }[] }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  if (unbridgedCount === 0 && !result) return null;

  async function handleBackfill() {
    setError(null);
    setResult(null);
    setRunning(true);
    try {
      const res = await backfillCompletedDonations();
      if (!res.ok) setError(res.error);
      else {
        setResult(res.data);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backfill failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <HeartHandshake className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {!result && (
            <>
              <p className="text-sm font-medium text-amber-900">
                {unbridgedCount} completed donation
                {unbridgedCount === 1 ? "" : "s"} not yet in the ledger
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Run a one-off backfill to post them all. Going forward, the
                webhook does this automatically.
              </p>
              <Button
                size="sm"
                onClick={handleBackfill}
                disabled={running}
                className="mt-3"
              >
                {running ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>Backfill {unbridgedCount} donation{unbridgedCount === 1 ? "" : "s"}</>
                )}
              </Button>
            </>
          )}
          {result && (
            <>
              <p className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Posted {result.posted} of {result.processed}
                {result.failures.length > 0
                  ? ` · ${result.failures.length} failed`
                  : ""}
              </p>
              {result.failures.length > 0 && (
                <ul className="mt-2 text-xs text-red-700 space-y-0.5">
                  {result.failures.slice(0, 5).map((f, i) => (
                    <li key={i}>
                      {f.donation_id.slice(0, 8)}: {f.error}
                    </li>
                  ))}
                  {result.failures.length > 5 && (
                    <li className="text-gray-500">
                      …and {result.failures.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-700 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
