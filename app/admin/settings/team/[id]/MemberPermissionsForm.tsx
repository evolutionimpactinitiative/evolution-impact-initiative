"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import {
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_PRESETS,
  permissionsBySection,
  roleKey,
  type PermissionKey,
  type RoleKey,
} from "@/lib/permissions-registry";
import { updateTeamMemberPermissions } from "../actions";

type DbRole = "admin" | "editor" | "treasurer" | "safeguarding_lead";

type Props = {
  member: {
    id: string;
    name: string;
    email: string;
    role: DbRole;
    is_treasurer: boolean;
    permissions: string[];
  };
  // Whether this is the current viewer editing themselves. Used to warn
  // if they're about to remove team.manage from themselves.
  isSelf: boolean;
};

const ROLE_TO_DB: Record<RoleKey, DbRole> = {
  chair: "admin",
  editor: "editor",
  treasurer: "treasurer",
  safeguarding_lead: "safeguarding_lead",
};

export function MemberPermissionsForm({ member, isSelf }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey>(roleKey(member.role));
  const [isTreasurer, setIsTreasurer] = useState<boolean>(!!member.is_treasurer);

  // Explicit extras — anything in member.permissions that isn't already
  // part of the role preset. We start with every stored permission;
  // the UI shows a tick for anything in effective = preset ∪ extras.
  const [extras, setExtras] = useState<Set<PermissionKey>>(
    () => new Set(member.permissions as PermissionKey[]),
  );
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preset = useMemo(
    () => new Set<PermissionKey>(ROLE_PRESETS[role]),
    [role],
  );

  // Treasurer flag layers in the treasurer preset on top.
  const treasurerLayer = useMemo(
    () => (isTreasurer ? new Set<PermissionKey>(ROLE_PRESETS.treasurer) : new Set<PermissionKey>()),
    [isTreasurer],
  );

  const effective = useMemo(() => {
    const s = new Set<PermissionKey>(preset);
    for (const k of treasurerLayer) s.add(k);
    for (const k of extras) s.add(k);
    return s;
  }, [preset, treasurerLayer, extras]);

  const sections = permissionsBySection();

  function toggle(key: PermissionKey) {
    const inPreset = preset.has(key) || treasurerLayer.has(key);
    const next = new Set(extras);
    if (effective.has(key)) {
      // Currently ticked. Unticking means removing from extras AND, if
      // it's in the preset/treasurer baseline, we can't actually remove
      // it (the role presets are what they are). Flag the user clearly.
      if (inPreset) {
        setError(
          `"${key}" comes from the ${role === "chair" ? "Chair" : ROLE_LABELS[role]} role${
            isTreasurer && !preset.has(key) ? " + Treasurer" : ""
          } preset — change the role to remove it.`,
        );
        return;
      }
      next.delete(key);
    } else {
      next.add(key);
      setError(null);
    }
    setExtras(next);
  }

  function applyPreset(newRole: RoleKey) {
    setRole(newRole);
    // When applying a role preset, keep existing extras — admin can
    // clear them explicitly if they want a true reset.
    setError(null);
  }

  function save() {
    setError(null);
    // Warn before removing team.manage from yourself.
    if (isSelf && !effective.has("team.manage")) {
      if (
        !confirm(
          "You're about to remove your own 'team.manage' permission. You won't be able to come back here to re-grant it — only another chair can. Continue?",
        )
      ) {
        return;
      }
    }

    startTransition(async () => {
      try {
        await updateTeamMemberPermissions({
          memberId: member.id,
          role: ROLE_TO_DB[role],
          isTreasurer,
          extras: Array.from(extras),
        });
        setSavedAt(Date.now());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  const showSaved = savedAt && Date.now() - savedAt < 3000;
  const presetCount = PERMISSIONS.filter((p) => preset.has(p.key)).length;
  const extraCount = Array.from(extras).filter((k) => !preset.has(k) && !treasurerLayer.has(k)).length;

  return (
    <div className="space-y-6">
      {/* Role picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Role preset</h2>
        <p className="text-sm text-gray-500 mb-4">
          Picking a role bulk-sets the baseline permissions. You can still
          tick extras underneath.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {(["chair", "treasurer", "safeguarding_lead", "editor"] as RoleKey[]).map((r) => {
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => applyPreset(r)}
                className={`text-sm px-3 py-2 rounded-lg border transition ${
                  active
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            );
          })}
        </div>

        <label className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isTreasurer}
            onChange={(e) => setIsTreasurer(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Also Treasurer</p>
            <p className="text-xs text-gray-500">
              Adds money permissions on top of the role above. Independent of
              role — a Chair can also be Treasurer.
            </p>
          </div>
        </label>

        <div className="mt-4 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
          <span>Role baseline: {presetCount} permissions</span>
          <span>Custom extras: {extraCount}</span>
          <span className="font-semibold">
            Effective total: {effective.size}
          </span>
        </div>
      </div>

      {/* Grouped permissions */}
      <div className="space-y-4">
        {sections.map(({ section, label, items }) => (
          <div
            key={section}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
              {label}
            </h3>
            <ul className="space-y-1">
              {items.map((p) => {
                const inPreset = preset.has(p.key) || treasurerLayer.has(p.key);
                const inExtras = extras.has(p.key) && !inPreset;
                const ticked = effective.has(p.key);
                return (
                  <li key={p.key}>
                    <label
                      className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                        ticked
                          ? inExtras
                            ? "bg-brand-blue/5 hover:bg-brand-blue/10"
                            : "bg-gray-50 hover:bg-gray-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={ticked}
                        onChange={() => toggle(p.key)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {p.label}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {p.key}
                          </span>
                          {inPreset && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                              · from role
                            </span>
                          )}
                          {inExtras && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-blue">
                              · custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                          {p.can}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="sticky bottom-4 bg-white rounded-xl border border-gray-200 p-4 shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          )}
          {!error && showSaved && (
            <p className="text-sm text-emerald-700 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Saved
            </p>
          )}
          {!error && !showSaved && (
            <p className="text-xs text-gray-500">
              Effective: {effective.size} permission{effective.size === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
