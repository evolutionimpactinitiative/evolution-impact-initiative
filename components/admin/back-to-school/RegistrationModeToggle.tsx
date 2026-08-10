"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Users, Ban } from "lucide-react";

export type RegistrationMode = "open" | "waitlist" | "closed";

interface Props {
  currentMode: RegistrationMode;
}

const OPTIONS: Array<{
  value: RegistrationMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: "open",
    label: "Open",
    icon: <Play className="h-3.5 w-3.5" />,
    description:
      "New sign-ups land as pending and go through your normal approval queue.",
  },
  {
    value: "waitlist",
    label: "Waitlist",
    icon: <Users className="h-3.5 w-3.5" />,
    description:
      "New sign-ups land on the waitlist. Promote them individually as more funding comes in.",
  },
  {
    value: "closed",
    label: "Closed",
    icon: <Ban className="h-3.5 w-3.5" />,
    description:
      "The public form refuses new sign-ups entirely. Existing registrations are unaffected.",
  },
];

export function RegistrationModeToggle({ currentMode }: Props) {
  const router = useRouter();
  const [mode, setMode] = React.useState<RegistrationMode>(currentMode);
  const [busy, setBusy] = React.useState<RegistrationMode | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Keep local state in sync if server refresh brings a new value.
  React.useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  async function pick(next: RegistrationMode) {
    if (next === mode || busy) return;
    setError(null);
    setBusy(next);
    const previous = mode;
    setMode(next); // optimistic
    try {
      const res = await fetch("/api/back-to-school/registration-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      router.refresh();
    } catch (err) {
      setMode(previous); // rollback
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  const active = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[0];

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center rounded-lg bg-gray-100 p-1 gap-1">
        {OPTIONS.map((opt) => {
          const isActive = opt.value === mode;
          const isBusy = busy === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              disabled={!!busy}
              className={
                (isActive
                  ? opt.value === "closed"
                    ? "bg-red-600 text-white shadow-sm"
                    : opt.value === "waitlist"
                      ? "bg-brand-blue text-white shadow-sm"
                      : "bg-brand-green text-white shadow-sm"
                  : "bg-transparent text-brand-dark hover:bg-white") +
                " inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-heading font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              }
            >
              {isBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                opt.icon
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        {active.description}
      </p>
      {error && (
        <p className="text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
