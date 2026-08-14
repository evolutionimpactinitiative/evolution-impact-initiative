// Shared types + option lists for the event proposal wizard, review page,
// and admin index.

export type ProposalStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "needs_info"
  | "approved"
  | "rejected";

export type VenueType = "indoor" | "outdoor" | "both";

export type EventType =
  | "workshop"
  | "community"
  | "sports"
  | "creative"
  | "educational"
  | "family"
  | "outreach"
  | "other";

export const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: "workshop", label: "Workshop" },
  { value: "community", label: "Community event" },
  { value: "sports", label: "Sports & physical activity" },
  { value: "creative", label: "Creative session" },
  { value: "educational", label: "Educational session" },
  { value: "family", label: "Family event" },
  { value: "outreach", label: "Outreach / engagement" },
  { value: "other", label: "Other" },
];

export type AgeGroup = "0-5" | "6-12" | "13-17" | "18-25" | "26+" | "mixed";

export const AGE_GROUP_OPTIONS: Array<{ value: AgeGroup; label: string }> = [
  { value: "0-5", label: "0–5 years" },
  { value: "6-12", label: "6–12 years" },
  { value: "13-17", label: "13–17 years" },
  { value: "18-25", label: "18–25 years" },
  { value: "26+", label: "26+ years" },
  { value: "mixed", label: "Mixed / all ages" },
];

export const SAFEGUARDING_PRACTICES = [
  { value: "dbs_checked", label: "DBS-checked staff" },
  { value: "sign_in_out", label: "Sign-in / sign-out system" },
  { value: "safeguarding_lead", label: "Designated safeguarding lead" },
  { value: "emergency_contacts", label: "Emergency contacts collected" },
  { value: "first_aid", label: "First aider on site" },
  { value: "risk_assessment", label: "Written risk assessment" },
  { value: "insurance", label: "Public liability insurance in place" },
] as const;

export const PROMOTION_CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp community" },
  { value: "flyers", label: "Flyers / posters" },
  { value: "newsletter", label: "Newsletter" },
  { value: "word_of_mouth", label: "Word of mouth" },
  { value: "other", label: "Other" },
] as const;

export const REGISTRATION_METHODS = [
  { value: "website_form", label: "Website form (default)" },
  { value: "google_form", label: "Google Form" },
  { value: "email", label: "Email us to sign up" },
  { value: "walk_in", label: "Walk-in only" },
  { value: "other", label: "Other" },
] as const;

// ─── Data-shape helpers for JSONB columns ──────────────────────────

export interface ScheduleRow {
  start: string;         // "12:00"
  duration_min: number;
  activity: string;
}

export interface ActivityRow {
  activity: string;
  achieves: string;
}

export interface StaffRow {
  role: string;
  count: number;
}

export interface CostLine {
  item: string;
  amount_pence: number;
}

export interface RiskRow {
  risk: string;
  likelihood: "L" | "M" | "H";
  impact: "L" | "M" | "H";
}

export interface EventProposal {
  id: string;
  title: string;
  event_types: EventType[];
  event_type_other: string | null;
  summary: string | null;
  preferred_date: string | null;
  alt_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  setup_start_time: string | null;
  packdown_end_time: string | null;
  primary_venue_name: string | null;
  primary_venue_address: string | null;
  primary_venue_type: VenueType | null;
  primary_venue_notes: string | null;
  alt_venue_name: string | null;
  alt_venue_address: string | null;
  alt_venue_type: VenueType | null;
  age_groups: AgeGroup[];
  expected_participants: number | null;
  plus_parents_carers: boolean;
  accessibility_notes: string | null;
  event_aim: string | null;
  objectives: string[];
  learning_outcomes: string[];
  schedule: ScheduleRow[];
  activities: ActivityRow[];
  event_planner_id: string | null;
  event_facilitator_id: string | null;
  event_facilitator_external: string | null;
  assistant_volunteer_ids: string[];
  assistant_volunteers_external: string | null;
  staff_needed: StaffRow[];
  ratio_adults: number | null;
  ratio_children: number | null;
  safeguarding_practices: string[];
  safeguarding_notes: string | null;
  equipment: string[];
  equipment_source: string | null;
  cost_lines: CostLine[];
  funding_pot_ids: string[];
  key_risks: RiskRow[];
  contingency_plan: string | null;
  promotion_channels: string[];
  registration_method: string | null;
  registration_notes: string | null;
  success_measures: string[];
  photo_video_consent_default: "opt_in" | "opt_out" | "none" | null;
  status: ProposalStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  spawned_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventProposalComment {
  id: string;
  proposal_id: string;
  author_id: string | null;
  body: string;
  is_system: boolean;
  created_at: string;
}

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  needs_info: "Needs info",
  approved: "Approved",
  rejected: "Rejected",
};

export const STATUS_TONES: Record<
  ProposalStatus,
  { bg: string; text: string }
> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700" },
  submitted: { bg: "bg-blue-100", text: "text-blue-800" },
  in_review: { bg: "bg-brand-blue/10", text: "text-brand-blue" },
  needs_info: { bg: "bg-amber-100", text: "text-amber-800" },
  approved: { bg: "bg-emerald-100", text: "text-emerald-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
};
