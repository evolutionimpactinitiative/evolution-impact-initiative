"use client";

import * as React from "react";
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  XCircle,
  Loader2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import {
  createB2SStewardToken,
  revokeB2SStewardToken,
} from "@/app/admin/back-to-school/stewards/actions";
import type { FestivalStewardToken } from "@/lib/supabase/types";

type ActiveToken = FestivalStewardToken & {
  scanUrl: string;
  qrDataUrl: string | null;
};

interface Props {
  active: ActiveToken[];
  revoked: FestivalStewardToken[];
}

export function B2SStewardTokensView({ active, revoked }: Props) {
  const [label, setLabel] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [qrOpenId, setQrOpenId] = React.useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await createB2SStewardToken(label);
    setCreating(false);
    if (!res.ok) {
      setCreateError(res.error);
      return;
    }
    setLabel("");
  }

  async function copyUrl(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500);
    } catch {
      // clipboard permission denied — do nothing
    }
  }

  async function onRevoke(id: string) {
    const ok = confirm(
      "Revoke this steward link? Anyone using it will lose access immediately.",
    );
    if (!ok) return;
    await revokeB2SStewardToken(id);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-heading font-black text-lg text-brand-dark">
          Steward links
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate one link per volunteer. Share via WhatsApp — they open the
          link on their phone and it becomes their scanner (no login). Show the
          QR so the volunteer can scan it directly from your screen. Revoke any
          time.
        </p>
      </div>

      {/* Create form */}
      <form onSubmit={onCreate} className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Volunteer name (e.g. Sarah — Station 2)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button
            type="submit"
            disabled={!label.trim() || creating}
            className="inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2.5 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate link
          </button>
        </div>
        {createError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{createError}</span>
          </div>
        )}
      </form>

      {/* Active tokens */}
      <div className="p-5">
        <p className="font-heading text-xs uppercase tracking-widest text-gray-500 mb-3">
          Active ({active.length})
        </p>
        {active.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No active steward links yet. Generate one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {active.map((t) => {
              const isCopied = copiedId === t.id;
              const qrOpen = qrOpenId === t.id;
              return (
                <li
                  key={t.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm text-brand-dark">
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {t.scanUrl}
                      </p>
                      {t.last_used_at && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Last used{" "}
                          {new Date(t.last_used_at).toLocaleString("en-GB")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        onClick={() => copyUrl(t.id, t.scanUrl)}
                        className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-brand-dark text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-brand-green" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {isCopied ? "Copied" : "Copy link"}
                      </button>
                      <button
                        onClick={() => setQrOpenId(qrOpen ? null : t.id)}
                        className={
                          (qrOpen
                            ? "bg-brand-blue text-white "
                            : "bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 ") +
                          "inline-flex items-center gap-1 text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors"
                        }
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        {qrOpen ? "Hide QR" : "Show QR"}
                      </button>
                      <a
                        href={t.scanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:border-brand-blue text-brand-dark text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                      <button
                        onClick={() => onRevoke(t.id)}
                        className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    </div>
                  </div>
                  {qrOpen && t.qrDataUrl && (
                    <div className="border-t border-gray-100 bg-brand-pale/30 p-4 flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.qrDataUrl}
                        alt={`QR for ${t.label}`}
                        className="w-56 h-56 bg-white rounded-lg p-2 border border-gray-200"
                      />
                      <p className="text-xs text-gray-600 max-w-xs text-center">
                        Point the volunteer&rsquo;s camera here. Their phone
                        opens the scanner ready to use.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Revoked tokens */}
      {revoked.length > 0 && (
        <details className="border-t border-gray-100 p-5">
          <summary className="font-heading text-xs uppercase tracking-widest text-gray-500 cursor-pointer">
            Revoked ({revoked.length})
          </summary>
          <ul className="mt-3 space-y-1.5">
            {revoked.map((t) => (
              <li
                key={t.id}
                className="text-xs text-gray-500 flex items-center gap-2"
              >
                <XCircle className="h-3 w-3" />
                <span className="font-medium text-brand-dark">{t.label}</span>
                <span className="text-gray-400">
                  revoked{" "}
                  {t.revoked_at &&
                    new Date(t.revoked_at).toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
