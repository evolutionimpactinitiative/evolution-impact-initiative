// Types matching the outcomes schema (supabase-migration-outcomes.sql).

export type Timepoint = "baseline" | "midpoint" | "follow_up" | "one_off";

export interface InstrumentItem {
  id: string;
  text: string;
  scale: string; // e.g. "0-10", "1-5"
  scale_labels?: Record<string, string>;
  reverse?: boolean; // anxiety-style items where higher = worse
}

export interface InstrumentScoring {
  method: "sum" | "average" | "ons4" | "swemwbs";
  item_ids: string[];
}

export interface OutcomeInstrument {
  id: string;
  code: string;
  name: string;
  short_description: string | null;
  source: string | null;
  items: InstrumentItem[];
  scoring: InstrumentScoring;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OutcomeParticipant {
  id: string;
  email: string | null;
  name: string | null;
  notes: string | null;
  donor_id: string | null;
  registration_id: string | null;
  team_member_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutcomeInvitation {
  id: string;
  token: string;
  instrument_id: string;
  participant_id: string | null;
  context_label: string | null;
  programme_strand: string | null;
  timepoint: Timepoint;
  recipient_email: string | null;
  email_sent_at: string | null;
  expires_at: string | null;
  response_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface OutcomeResponse {
  id: string;
  invitation_id: string | null;
  instrument_id: string;
  participant_id: string | null;
  context_label: string | null;
  programme_strand: string | null;
  timepoint: Timepoint;
  score_raw: number | null;
  score_transformed: number | null;
  score_band: string | null;
  submitted_at: string;
  created_at: string;
}

export interface OutcomeResponseItem {
  id: string;
  response_id: string;
  item_id: string;
  value_numeric: number | null;
  value_text: string | null;
}
