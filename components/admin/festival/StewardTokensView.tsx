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
} from "lucide-react";
import {
  createStewardToken,
  revokeStewardToken,
} from "@/app/admin/festival/check-in/actions";
import type { FestivalStewardToken } from "@/lib/supabase/types";

type ActiveToken = FestivalStewardToken & { scanUrl: string };

interface Props {
  active: ActiveToken[];
  revoked: FestivalStewardToken[];
}

export function StewardTokensView({ active, revoked }: Props) {
  const [label, setLabel] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await createStewardToken(label);
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
      // ignore — fallback would prompt
    }
  }

  async function onRevoke(id: string) {
    const ok = confirm(
      "Revoke this steward link? Anyone using it will lose access immediately.",
    );
    if (!ok) return;
    await revokeStewardToken(id);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-heading font-black text-lg text-gray-900">
          Steward access
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate a private link per steward. Share it via WhatsApp — anyone with the link can scan tickets (no login). Revoke any time.
        </p>
      </div>

      {/* Create form */}
      <form onSubmit={onCreate} className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Door steward 1, Kids' zone)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <button
            type="submit"
            disabled={!label.trim() || creating}
            className="inline-flex items-center justify-center gap-1.5 bg-brand-blue text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2.5 rounded-md hover:bg-brand-green transition-colors disabled:opacity-50"
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
              return (
                <li
                  key={t.id}
                  className="border border-gray-200 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm text-gray-900">
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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => copyUrl(t.id, t.scanUrl)}
                      className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-brand-green" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {isCopied ? "Copied" : "Copy link"}
                    </button>
                    <a
                      href={t.scanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-xs font-heading font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-colors"
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
                <span className="font-medium text-gray-700">{t.label}</span>
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
