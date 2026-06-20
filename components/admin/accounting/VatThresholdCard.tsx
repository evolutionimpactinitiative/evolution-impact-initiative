import { formatPence, formatPenceShort } from "@/lib/accounting/format";
import { AlertTriangle, TrendingUp, Info } from "lucide-react";

interface Props {
  rollingTotalPence: number; // 12-month VATable income
  windowStart: string; // ISO date — start of the rolling window
  windowEnd: string;
}

// HMRC VAT registration threshold (from 1 April 2024)
const VAT_THRESHOLD_PENCE = 9_000_000; // £90,000

export function VatThresholdCard({ rollingTotalPence, windowStart, windowEnd }: Props) {
  const pct = (rollingTotalPence / VAT_THRESHOLD_PENCE) * 100;
  const remaining = VAT_THRESHOLD_PENCE - rollingTotalPence;

  // Bands
  let band: "green" | "blue" | "amber" | "red";
  let message: string;
  let Icon = TrendingUp;
  if (pct >= 95) {
    band = "red";
    Icon = AlertTriangle;
    message =
      "VAT registration is imminent — register within 30 days of exceeding the threshold.";
  } else if (pct >= 85) {
    band = "amber";
    Icon = AlertTriangle;
    message =
      "Approaching the VAT threshold. Start preparing now: registration process, invoicing changes, cash-flow impact.";
  } else if (pct >= 70) {
    band = "blue";
    Icon = Info;
    message = "Comfortably under, but worth tracking each month as trading grows.";
  } else {
    band = "green";
    Icon = TrendingUp;
    message = "Well under the VAT threshold. Tracked here so we don't get caught out.";
  }

  const bandStyles: Record<typeof band, { bg: string; border: string; text: string; bar: string }> = {
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", bar: "bg-green-500" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", bar: "bg-blue-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", bar: "bg-amber-500" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", bar: "bg-red-500" },
  };
  const s = bandStyles[band];

  // For the bar, cap at 100% visually but show the actual % numerically
  const barPct = Math.min(100, pct);

  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${s.text} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`text-sm font-medium ${s.text}`}>
              VAT threshold tracker — {pct.toFixed(1)}% of £90,000
            </p>
            <p className={`text-xs ${s.text} opacity-70`}>
              12 months to {new Date(windowEnd).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </p>
          </div>
          <p className={`text-xs ${s.text} mt-0.5 opacity-90`}>
            {message}
          </p>

          <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden relative">
            {/* Threshold markers at 70/85/95% */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-white/50" style={{ flexBasis: "70%" }} />
              <div className="flex-1 border-r border-white/50" style={{ flexBasis: "15%" }} />
              <div className="flex-1 border-r border-white/50" style={{ flexBasis: "10%" }} />
              <div style={{ flexBasis: "5%" }} />
            </div>
            <div
              className={`h-full ${s.bar} relative`}
              style={{ width: `${barPct}%` }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs">
            <span className={s.text}>
              <strong>{formatPenceShort(rollingTotalPence)}</strong> in
            </span>
            <span className={s.text}>
              {remaining > 0 ? (
                <>
                  <strong>{formatPenceShort(remaining)}</strong> remaining
                </>
              ) : (
                <strong>Over by {formatPence(Math.abs(remaining))}</strong>
              )}
            </span>
          </div>
        </div>
      </div>
      <p className={`text-[10px] ${s.text} opacity-60 mt-3 text-right`}>
        Counts trading + festival income (4200, 4210, 4300, 4310, 4320). Excludes donations + grants.
        Window: {new Date(windowStart).toLocaleDateString("en-GB")} → {new Date(windowEnd).toLocaleDateString("en-GB")}.
      </p>
    </div>
  );
}
