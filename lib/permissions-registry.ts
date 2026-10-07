// Central permission registry.
//
// Every permission has:
//   • key — the string stored in team_members.permissions[]
//   • section — the group it belongs to in the admin UI
//   • label — human-readable noun phrase ("Create events")
//   • can — one-line description of what unlocking does
//
// Role presets map each role to the baseline permission set. The
// effective permissions for a team member = preset(role) ∪
// member.permissions[]. Adding a permission to a member only grants
// extras — it never removes what their role grants.
//
// To add a new permission: add it here, decide which role presets
// include it, done. No DB migration needed (the column is TEXT[]).

export type PermissionKey =
  // Events
  | "events.view"
  | "events.create"
  | "events.edit"
  | "events.delete"
  | "events.check_in"
  | "events.manage_proposals"
  // Growing Together
  | "gt.view_dashboard"
  | "gt.manage_families"
  | "gt.manage_village"
  | "gt.rate_children"
  | "gt.manage_notes_internal"
  | "gt.manage_notes_external"
  // Festival 2026
  | "festival.view"
  | "festival.manage_vendors"
  | "festival.manage_sponsors"
  | "festival.manage_volunteers"
  | "festival.check_in"
  // Back to School
  | "b2s.view"
  | "b2s.approve_requests"
  | "b2s.manage_sponsors"
  | "b2s.manage_stock"
  // Money
  | "donations.view"
  | "donations.record"
  | "accounting.view"
  | "accounting.reconcile"
  | "expenses.view"
  | "expenses.submit"
  | "expenses.approve"
  // Communications
  | "subscribers.view"
  | "subscribers.bulk_email"
  | "surveys.manage"
  | "surveys.broadcast"
  | "emails.view_logs"
  // Chat
  | "messages.view"
  | "messages.reply"
  | "messages.assign"
  | "messages.resolve"
  // Content
  | "gallery.view"
  | "gallery.upload"
  | "outcomes.view"
  | "outcomes.manage"
  // Team / Settings
  | "team.view"
  | "team.manage"
  | "settings.edit";

export type PermissionSection =
  | "events"
  | "growing_together"
  | "festival"
  | "back_to_school"
  | "money"
  | "communications"
  | "chat"
  | "content"
  | "team";

export interface PermissionDef {
  key: PermissionKey;
  section: PermissionSection;
  label: string;
  can: string;
}

export const SECTION_LABELS: Record<PermissionSection, string> = {
  events: "Events",
  growing_together: "Growing Together",
  festival: "Festival 2026",
  back_to_school: "Back to School",
  money: "Money",
  communications: "Communications",
  chat: "Chat (family messages)",
  content: "Content",
  team: "Team & settings",
};

export const PERMISSIONS: PermissionDef[] = [
  // Events
  { key: "events.view", section: "events", label: "View events", can: "See the events list + any event detail" },
  { key: "events.create", section: "events", label: "Create events", can: "Make new events via the form" },
  { key: "events.edit", section: "events", label: "Edit events", can: "Edit existing event details" },
  { key: "events.delete", section: "events", label: "Delete events", can: "Permanently remove an event" },
  { key: "events.check_in", section: "events", label: "Check attendees in", can: "Mark attendance on event day" },
  { key: "events.manage_proposals", section: "events", label: "Review proposals", can: "Approve, reject, or request info on proposals" },

  // Growing Together
  { key: "gt.view_dashboard", section: "growing_together", label: "View GT dashboard", can: "See the Growing Together admin + metrics" },
  { key: "gt.manage_families", section: "growing_together", label: "Manage families", can: "Open and edit family + child records" },
  { key: "gt.manage_village", section: "growing_together", label: "Manage Our Village", can: "Create, edit, publish Our Village posts" },
  { key: "gt.rate_children", section: "growing_together", label: "Rate children per session", can: "Fill in per-child session feedback (7 ratings + notable)" },
  { key: "gt.manage_notes_internal", section: "growing_together", label: "Internal notes", can: "Write + read internal notes on families and children" },
  { key: "gt.manage_notes_external", section: "growing_together", label: "External notes to families", can: "Write notes visible to the family (fires email + bell)" },

  // Festival
  { key: "festival.view", section: "festival", label: "View festival admin", can: "See festival dashboard" },
  { key: "festival.manage_vendors", section: "festival", label: "Manage vendors", can: "Add, edit, approve vendor stalls" },
  { key: "festival.manage_sponsors", section: "festival", label: "Manage sponsors", can: "Add + edit sponsorship records" },
  { key: "festival.manage_volunteers", section: "festival", label: "Manage volunteers", can: "Manage the festival volunteer roster" },
  { key: "festival.check_in", section: "festival", label: "Festival check-in", can: "Mark attendance on festival day" },

  // Back to School
  { key: "b2s.view", section: "back_to_school", label: "View Back to School", can: "See the B2S dashboard" },
  { key: "b2s.approve_requests", section: "back_to_school", label: "Approve uniform requests", can: "Approve or decline uniform requests" },
  { key: "b2s.manage_sponsors", section: "back_to_school", label: "Manage B2S sponsors", can: "Add + edit B2S sponsorships" },
  { key: "b2s.manage_stock", section: "back_to_school", label: "Manage stock", can: "Record uniform stock in/out" },

  // Money
  { key: "donations.view", section: "money", label: "View donations", can: "See the donations list + totals" },
  { key: "donations.record", section: "money", label: "Record donations", can: "Add or edit manual donations" },
  { key: "accounting.view", section: "money", label: "View accounting", can: "See accounting dashboard, bank txns, VAT thresholds" },
  { key: "accounting.reconcile", section: "money", label: "Reconcile transactions", can: "Match transactions and approve reconciliations" },
  { key: "expenses.view", section: "money", label: "View expenses", can: "See everyone's expenses (not just your own)" },
  { key: "expenses.submit", section: "money", label: "Submit expenses", can: "Submit new expense claims" },
  { key: "expenses.approve", section: "money", label: "Approve expenses", can: "Approve or reject expense claims (dual-approval £500+)" },

  // Communications
  { key: "subscribers.view", section: "communications", label: "View subscribers", can: "See the mailing list + subscriber details" },
  { key: "subscribers.bulk_email", section: "communications", label: "Send bulk email", can: "Send bulk emails to the mailing list" },
  { key: "surveys.manage", section: "communications", label: "Manage surveys", can: "Create, edit, clone, delete surveys" },
  { key: "surveys.broadcast", section: "communications", label: "Broadcast surveys", can: "Email surveys to attendees or Growing Together families" },
  { key: "emails.view_logs", section: "communications", label: "View email logs", can: "See the email_logs table (every send)" },

  // Chat
  { key: "messages.view", section: "chat", label: "View family messages", can: "See the shared inbox" },
  { key: "messages.reply", section: "chat", label: "Reply to families", can: "Reply as EII Team" },
  { key: "messages.assign", section: "chat", label: "Assign threads", can: "Assign or unassign chat threads" },
  { key: "messages.resolve", section: "chat", label: "Resolve threads", can: "Mark threads resolved or reopen them" },

  // Content
  { key: "gallery.view", section: "content", label: "View gallery", can: "See the gallery admin" },
  { key: "gallery.upload", section: "content", label: "Upload to gallery", can: "Upload or delete photos" },
  { key: "outcomes.view", section: "content", label: "View outcomes", can: "See the outcomes dashboard" },
  { key: "outcomes.manage", section: "content", label: "Manage outcomes", can: "Create or edit outcome frameworks + invitations" },

  // Team / Settings
  { key: "team.view", section: "team", label: "View team", can: "See the team list on settings" },
  { key: "team.manage", section: "team", label: "Manage team permissions", can: "Edit anyone's role + permissions (this page)" },
  { key: "settings.edit", section: "team", label: "Edit org settings", can: "Change org-level settings (details, integrations)" },
];

// Role presets. The chair preset is "everything" — simpler than
// listing. Other roles list exactly what they grant.
export type RoleKey = "chair" | "treasurer" | "safeguarding_lead" | "editor";

export const ROLE_LABELS: Record<RoleKey, string> = {
  chair: "Chair",
  treasurer: "Treasurer",
  safeguarding_lead: "Safeguarding Lead",
  editor: "Editor",
};

const ALL_KEYS = PERMISSIONS.map((p) => p.key);

export const ROLE_PRESETS: Record<RoleKey, PermissionKey[]> = {
  // Chair = everything. Easy mental model: there's always someone with
  // the keys to the whole building.
  chair: ALL_KEYS,

  // Treasurer = everything a chair sees PLUS the money bits are the point.
  // In practice the Treasurer is often also a chair, but if a dedicated
  // Treasurer were added without chair, these are the permissions they
  // need to do the job.
  treasurer: [
    "events.view",
    "gt.view_dashboard",
    "festival.view",
    "b2s.view",
    "donations.view",
    "donations.record",
    "accounting.view",
    "accounting.reconcile",
    "expenses.view",
    "expenses.submit",
    "expenses.approve",
    "surveys.manage",
    "surveys.broadcast",
    "subscribers.view",
    "emails.view_logs",
    "team.view",
  ],

  // Safeguarding Lead = everything team-wide + full notes authority on
  // families and children + the chat inbox so safeguarding comms land
  // somewhere they can act on.
  safeguarding_lead: [
    "events.view",
    "events.check_in",
    "gt.view_dashboard",
    "gt.manage_families",
    "gt.rate_children",
    "gt.manage_notes_internal",
    "gt.manage_notes_external",
    "festival.view",
    "b2s.view",
    "messages.view",
    "messages.reply",
    "messages.assign",
    "messages.resolve",
    "surveys.manage",
    "subscribers.view",
    "team.view",
  ],

  // Editor = the broad "day-to-day team member" preset. Operational
  // access everywhere EXCEPT money + settings + the ability to delete
  // events outright. Can read donations but not record them.
  editor: [
    "events.view",
    "events.create",
    "events.edit",
    "events.check_in",
    "events.manage_proposals",
    "gt.view_dashboard",
    "gt.manage_families",
    "gt.manage_village",
    "gt.rate_children",
    "gt.manage_notes_internal",
    "festival.view",
    "festival.manage_vendors",
    "festival.manage_sponsors",
    "festival.manage_volunteers",
    "festival.check_in",
    "b2s.view",
    "b2s.approve_requests",
    "b2s.manage_sponsors",
    "b2s.manage_stock",
    "messages.view",
    "messages.reply",
    "messages.assign",
    "messages.resolve",
    "surveys.manage",
    "surveys.broadcast",
    "subscribers.view",
    "gallery.view",
    "gallery.upload",
    "outcomes.view",
    "team.view",
  ],
};

// Maps the DB `role` column (admin|editor|treasurer|safeguarding_lead)
// to a RoleKey. 'admin' is our DB value for Chair.
export function roleKey(dbRole: string | null | undefined): RoleKey {
  if (dbRole === "admin") return "chair";
  if (dbRole === "treasurer") return "treasurer";
  if (dbRole === "safeguarding_lead") return "safeguarding_lead";
  return "editor";
}

// Compute the effective set of permissions for a team member — role
// preset + any explicit extras stored on the row.
export function effectivePermissions(
  dbRole: string | null | undefined,
  extras: string[] | null | undefined,
  isTreasurerExtra: boolean = false,
): Set<PermissionKey> {
  const set = new Set<PermissionKey>(ROLE_PRESETS[roleKey(dbRole)]);
  // is_treasurer is independent of role in the current model — layer
  // the Treasurer preset in on top if the flag is set.
  if (isTreasurerExtra) {
    for (const p of ROLE_PRESETS.treasurer) set.add(p);
  }
  for (const key of extras ?? []) {
    if (ALL_KEYS.includes(key as PermissionKey)) {
      set.add(key as PermissionKey);
    }
  }
  return set;
}

export function hasPermission(
  perms: Set<PermissionKey>,
  key: PermissionKey,
): boolean {
  return perms.has(key);
}

// For UI: group PERMISSIONS by section in registry order.
export function permissionsBySection(): Array<{
  section: PermissionSection;
  label: string;
  items: PermissionDef[];
}> {
  const order: PermissionSection[] = [
    "events",
    "growing_together",
    "festival",
    "back_to_school",
    "money",
    "communications",
    "chat",
    "content",
    "team",
  ];
  return order.map((s) => ({
    section: s,
    label: SECTION_LABELS[s],
    items: PERMISSIONS.filter((p) => p.section === s),
  }));
}
