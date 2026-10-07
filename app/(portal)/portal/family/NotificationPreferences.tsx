"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { updateVillageEmailPref } from "./notification-prefs-actions";

type Pref = "per_post" | "daily_digest" | "never";

const OPTIONS: { value: Pref; label: string; blurb: string }[] = [
  {
    value: "per_post",
    label: "Immediately",
    blurb: "Email me every time a new post goes up in Our Village.",
  },
  {
    value: "daily_digest",
    label: "Daily digest",
    blurb: "Bundle the day's new posts into one email at 5pm. (Recommended)",
  },
  {
    value: "never",
    label: "Never",
    blurb: "Don't email me. I'll check Our Village myself when I log in.",
  },
];

export function NotificationPreferences({
  initial,
}: {
  initial: Pref;
}) {
  const [pref, setPref] = useState<Pref>(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function choose(next: Pref) {
    if (next === pref) return;
    const prev = pref;
    setPref(next);
    startTransition(async () => {
      try {
        await updateVillageEmailPref(next);
        setSavedAt(Date.now());
      } catch {
        setPref(prev);
      }
    });
  }

  const showSaved = savedAt && Date.now() - savedAt < 3000;

  return (
    <section
      id="notifications"
      className="bg-white rounded-xl border border-brand-dark/5 p-6 mt-8 scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-brand-blue" />
          <h2 className="font-heading font-black text-lg text-brand-dark">
            Email notifications
          </h2>
        </div>
        {isPending && (
          <span className="text-xs text-brand-dark/50 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving
          </span>
        )}
        {!isPending && showSaved && (
          <span className="text-xs text-brand-green flex items-center gap-1">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>
      <p className="text-sm text-brand-dark/60 mb-5">
        Choose how often we email you about new Our Village posts. You can change this
        any time. Your in-app notifications are not affected.
      </p>

      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = opt.value === pref;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              className={`w-full text-left rounded-lg border p-4 transition ${
                active
                  ? "border-brand-blue bg-brand-blue/5"
                  : "border-brand-dark/10 bg-white hover:border-brand-dark/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                    active ? "border-brand-blue bg-brand-blue" : "border-brand-dark/30"
                  }`}
                >
                  {active && (
                    <span className="block h-2 w-2 bg-white rounded-full mx-auto mt-[3px]" />
                  )}
                </span>
                <div>
                  <p className="font-heading font-bold text-brand-dark">{opt.label}</p>
                  <p className="text-sm text-brand-dark/60 mt-0.5">{opt.blurb}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
