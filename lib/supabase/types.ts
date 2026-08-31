export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Custom field types for dynamic registration forms
export type CustomFieldType = "text" | "textarea" | "select" | "checkbox" | "number";

export interface CustomField {
  id: string;
  type: CustomFieldType;
  label: string;
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
}

// Survey question types
export type SurveyQuestionType = "rating" | "multiple_choice" | "multi_select" | "text" | "yes_no";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  text: string;
  required: boolean;
  options?: string[] | { min: number; max: number }; // For choice questions or rating scale
}

// Festival 2026: volunteer availability slots
export interface VolunteerAvailability {
  setup?: boolean;
  am?: boolean;
  pm?: boolean;
  packdown?: boolean;
}

// Festival 2026: volunteer DBS check level
export type DbsLevel =
  | "basic"
  | "standard"
  | "enhanced"
  | "enhanced_child_barred"
  | "enhanced_adult_barred"
  | "enhanced_both_barred";

export const DBS_LEVELS: { value: DbsLevel; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "enhanced", label: "Enhanced" },
  { value: "enhanced_child_barred", label: "Enhanced with Child Barred List" },
  { value: "enhanced_adult_barred", label: "Enhanced with Adult Barred List" },
  {
    value: "enhanced_both_barred",
    label: "Enhanced with Child & Adult Barred List",
  },
];

// Event launch playbook state — mutated inline per-event; keys optional
// because a fresh event starts with an empty {} default.
export interface PlaybookState {
  designer_pinged_at?: string;
  published_at?: string;
  announcement_sent_at?: string;
  socials_posted?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    tiktok?: string;
  };
  survey_sent_at?: string;
  debrief_at?: string;
  debrief_notes?: string;
}

export interface Database {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "editor" | "treasurer" | "safeguarding_lead";
          is_treasurer: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: "admin" | "editor" | "treasurer" | "safeguarding_lead";
          is_treasurer?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "editor" | "treasurer" | "safeguarding_lead";
          is_treasurer?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          full_description: string | null;
          category: "creative" | "sport" | "support" | "community" | "workshop" | "social" | "training" | "family";
          event_type: "children" | "adults" | "mixed";
          date: string;
          arrival_time: string | null;
          start_time: string;
          end_time: string | null;
          venue_name: string;
          venue_address: string;
          card_image_url: string | null;
          hero_image_url: string | null;
          age_group: string | null;
          cost: string;
          what_to_bring: string | null;
          accessibility_info: string | null;
          total_slots: number;
          waitlist_slots: number;
          max_children_per_registration: number;
          max_attendees_per_registration: number;
          registration_status: "open" | "closed" | "auto";
          status: "draft" | "published" | "cancelled";
          send_reminder_24h: boolean;
          send_reminder_1h: boolean;
          custom_fields: CustomField[] | null;
          photo_album_url: string | null;
          publish_at: string | null;
          final_release: boolean;
          social_image_url: string | null;
          playbook_state: PlaybookState;
          programme: string | null;
          primary_difference: "confidence" | "connection" | "belonging" | null;
          cycle_number: number | null;
          what_to_expect: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          short_description: string;
          full_description?: string | null;
          category: "creative" | "sport" | "support" | "community" | "workshop" | "social" | "training" | "family";
          event_type?: "children" | "adults" | "mixed";
          date: string;
          arrival_time?: string | null;
          start_time: string;
          end_time?: string | null;
          venue_name: string;
          venue_address: string;
          card_image_url?: string | null;
          hero_image_url?: string | null;
          age_group?: string | null;
          cost?: string;
          what_to_bring?: string | null;
          accessibility_info?: string | null;
          total_slots?: number;
          waitlist_slots?: number;
          max_children_per_registration?: number;
          max_attendees_per_registration?: number;
          registration_status?: "open" | "closed" | "auto";
          status?: "draft" | "published" | "cancelled";
          send_reminder_24h?: boolean;
          send_reminder_1h?: boolean;
          custom_fields?: CustomField[] | null;
          photo_album_url?: string | null;
          publish_at?: string | null;
          final_release?: boolean;
          social_image_url?: string | null;
          playbook_state?: PlaybookState;
          programme?: string | null;
          primary_difference?: "confidence" | "connection" | "belonging" | null;
          cycle_number?: number | null;
          what_to_expect?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          short_description?: string;
          full_description?: string | null;
          category?: "creative" | "sport" | "support" | "community" | "workshop" | "social" | "training" | "family";
          event_type?: "children" | "adults" | "mixed";
          date?: string;
          arrival_time?: string | null;
          start_time?: string;
          end_time?: string | null;
          venue_name?: string;
          venue_address?: string;
          card_image_url?: string | null;
          hero_image_url?: string | null;
          age_group?: string | null;
          cost?: string;
          what_to_bring?: string | null;
          accessibility_info?: string | null;
          total_slots?: number;
          waitlist_slots?: number;
          max_children_per_registration?: number;
          max_attendees_per_registration?: number;
          registration_status?: "open" | "closed" | "auto";
          status?: "draft" | "published" | "cancelled";
          send_reminder_24h?: boolean;
          send_reminder_1h?: boolean;
          custom_fields?: CustomField[] | null;
          photo_album_url?: string | null;
          publish_at?: string | null;
          final_release?: boolean;
          social_image_url?: string | null;
          playbook_state?: PlaybookState;
          programme?: string | null;
          primary_difference?: "confidence" | "connection" | "belonging" | null;
          cycle_number?: number | null;
          what_to_expect?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          accessibility_requirements: string | null;
          how_heard_about_us: string | null;
          status: "confirmed" | "waitlisted" | "cancelled";
          attended: "yes" | "no" | null;
          check_in_time: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          attendance_confirmed: boolean | null;
          attendance_confirmed_at: string | null;
          photo_video_consent: boolean;
          terms_accepted_at: string | null;
          custom_responses: Record<string, string | boolean | number> | null;
          admin_notes: string | null;
          family_id: string | null;
          registered_by_parent_carer_id: string | null;
          feedback_email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          accessibility_requirements?: string | null;
          how_heard_about_us?: string | null;
          status?: "confirmed" | "waitlisted" | "cancelled";
          attended?: "yes" | "no" | null;
          check_in_time?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          attendance_confirmed?: boolean | null;
          attendance_confirmed_at?: string | null;
          photo_video_consent?: boolean;
          terms_accepted_at?: string | null;
          custom_responses?: Record<string, string | boolean | number> | null;
          admin_notes?: string | null;
          family_id?: string | null;
          registered_by_parent_carer_id?: string | null;
          feedback_email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          parent_name?: string;
          parent_email?: string;
          parent_phone?: string;
          accessibility_requirements?: string | null;
          how_heard_about_us?: string | null;
          status?: "confirmed" | "waitlisted" | "cancelled";
          attended?: "yes" | "no" | null;
          check_in_time?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          attendance_confirmed?: boolean | null;
          attendance_confirmed_at?: string | null;
          photo_video_consent?: boolean;
          terms_accepted_at?: string | null;
          custom_responses?: Record<string, string | boolean | number> | null;
          admin_notes?: string | null;
          family_id?: string | null;
          registered_by_parent_carer_id?: string | null;
          feedback_email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      registration_children: {
        Row: {
          id: string;
          registration_id: string;
          child_name: string;
          child_age: number;
          display_order: number;
          attended: boolean | null;
          check_in_time: string | null;
          child_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          child_name: string;
          child_age: number;
          display_order?: number;
          attended?: boolean | null;
          check_in_time?: string | null;
          child_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          child_name?: string;
          child_age?: number;
          display_order?: number;
          attended?: boolean | null;
          check_in_time?: string | null;
          child_id?: string | null;
          created_at?: string;
        };
      };
      registration_attendees: {
        Row: {
          id: string;
          registration_id: string;
          attendee_name: string;
          attendee_email: string | null;
          attendee_phone: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          attendee_name: string;
          attendee_email?: string | null;
          attendee_phone?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          attendee_name?: string;
          attendee_email?: string | null;
          attendee_phone?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      donors: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          address_line1: string | null;
          address_city: string | null;
          address_postcode: string | null;
          gift_aid_declaration: boolean;
          gift_aid_declared_at: string | null;
          marketing_consent: boolean;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          address_line1?: string | null;
          address_city?: string | null;
          address_postcode?: string | null;
          gift_aid_declaration?: boolean;
          gift_aid_declared_at?: string | null;
          marketing_consent?: boolean;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          address_line1?: string | null;
          address_city?: string | null;
          address_postcode?: string | null;
          gift_aid_declaration?: boolean;
          gift_aid_declared_at?: string | null;
          marketing_consent?: boolean;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          donor_id: string | null;
          amount: number;
          currency: string;
          donation_type: "one_time" | "recurring";
          status: "pending" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id: string | null;
          stripe_subscription_id: string | null;
          message: string | null;
          campaign: string;
          event_id: string | null;
          gift_aid_amount: number;
          fee_amount: number;
          net_amount: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          donor_id?: string | null;
          amount: number;
          currency?: string;
          donation_type: "one_time" | "recurring";
          status?: "pending" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id?: string | null;
          stripe_subscription_id?: string | null;
          message?: string | null;
          campaign?: string;
          event_id?: string | null;
          gift_aid_amount?: number;
          fee_amount?: number;
          net_amount?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          donor_id?: string | null;
          amount?: number;
          currency?: string;
          donation_type?: "one_time" | "recurring";
          status?: "pending" | "completed" | "failed" | "refunded";
          stripe_payment_intent_id?: string | null;
          stripe_subscription_id?: string | null;
          message?: string | null;
          campaign?: string;
          event_id?: string | null;
          gift_aid_amount?: number;
          fee_amount?: number;
          net_amount?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      donation_subscriptions: {
        Row: {
          id: string;
          donor_id: string;
          amount: number;
          frequency: string;
          status: "active" | "paused" | "cancelled";
          stripe_subscription_id: string | null;
          next_payment_date: string | null;
          started_at: string;
          cancelled_at: string | null;
          cancel_reason: string | null;
        };
        Insert: {
          id?: string;
          donor_id: string;
          amount: number;
          frequency?: string;
          status?: "active" | "paused" | "cancelled";
          stripe_subscription_id?: string | null;
          next_payment_date?: string | null;
          started_at?: string;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
        };
        Update: {
          id?: string;
          donor_id?: string;
          amount?: number;
          frequency?: string;
          status?: "active" | "paused" | "cancelled";
          stripe_subscription_id?: string | null;
          next_payment_date?: string | null;
          started_at?: string;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
        };
      };
      email_logs: {
        Row: {
          id: string;
          registration_id: string | null;
          donation_id: string | null;
          event_id: string | null;
          email_type: string;
          recipient_email: string;
          subject: string;
          body: string | null;
          status: "sent" | "failed" | "opened" | "clicked";
          sent_at: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          registration_id?: string | null;
          donation_id?: string | null;
          event_id?: string | null;
          email_type: string;
          recipient_email: string;
          subject: string;
          body?: string | null;
          status?: "sent" | "failed" | "opened" | "clicked";
          sent_at?: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          registration_id?: string | null;
          donation_id?: string | null;
          event_id?: string | null;
          email_type?: string;
          recipient_email?: string;
          subject?: string;
          body?: string | null;
          status?: "sent" | "failed" | "opened" | "clicked";
          sent_at?: string;
          error_message?: string | null;
        };
      };
      scheduled_emails: {
        Row: {
          id: string;
          event_id: string;
          email_type: string;
          scheduled_for: string;
          subject: string;
          body: string | null;
          status: "pending" | "sent" | "cancelled";
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          email_type: string;
          scheduled_for: string;
          subject: string;
          body?: string | null;
          status?: "pending" | "sent" | "cancelled";
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          email_type?: string;
          scheduled_for?: string;
          subject?: string;
          body?: string | null;
          status?: "pending" | "sent" | "cancelled";
          created_by?: string | null;
          created_at?: string;
        };
      };
      mailing_list: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          status: "active" | "unsubscribed";
          source: "footer" | "registration" | "event" | "manual";
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          status?: "active" | "unsubscribed";
          source?: "footer" | "registration" | "event" | "manual";
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          status?: "active" | "unsubscribed";
          source?: "footer" | "registration" | "event" | "manual";
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
        };
      };
      surveys: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_id: string | null;
          survey_type: "event_feedback" | "activity_interest" | "general";
          questions: SurveyQuestion[];
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_id?: string | null;
          survey_type?: "event_feedback" | "activity_interest" | "general";
          questions: SurveyQuestion[];
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_id?: string | null;
          survey_type?: "event_feedback" | "activity_interest" | "general";
          questions?: SurveyQuestion[];
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      survey_responses: {
        Row: {
          id: string;
          survey_id: string;
          event_id: string | null;
          registration_id: string | null;
          respondent_email: string;
          respondent_name: string | null;
          answers: Record<string, string | number | string[] | boolean>;
          submitted_at: string;
          status: "completed" | "partial";
        };
        Insert: {
          id?: string;
          survey_id: string;
          event_id?: string | null;
          registration_id?: string | null;
          respondent_email: string;
          respondent_name?: string | null;
          answers: Record<string, string | number | string[] | boolean>;
          submitted_at?: string;
          status?: "completed" | "partial";
        };
        Update: {
          id?: string;
          survey_id?: string;
          event_id?: string | null;
          registration_id?: string | null;
          respondent_email?: string;
          respondent_name?: string | null;
          answers?: Record<string, string | number | string[] | boolean>;
          submitted_at?: string;
          status?: "completed" | "partial";
        };
      };
      event_notifications: {
        Row: {
          id: string;
          event_id: string;
          email: string;
          name: string | null;
          subscribe_to_newsletter: boolean;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          email: string;
          name?: string | null;
          subscribe_to_newsletter?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          email?: string;
          name?: string | null;
          subscribe_to_newsletter?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
      };
      festival_steward_tokens: {
        Row: {
          id: string;
          event_id: string;
          token: string;
          label: string;
          created_by: string | null;
          revoked_at: string | null;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          token: string;
          label: string;
          created_by?: string | null;
          revoked_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          token?: string;
          label?: string;
          created_by?: string | null;
          revoked_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
        };
      };
      festival_tickets: {
        Row: {
          id: string;
          registration_id: string;
          event_id: string;
          ticket_code: string;
          holder_name: string | null;
          holder_type: "lead" | "adult" | "child";
          display_order: number;
          checked_in_at: string | null;
          checked_in_by_token_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          event_id: string;
          ticket_code: string;
          holder_name?: string | null;
          holder_type: "lead" | "adult" | "child";
          display_order?: number;
          checked_in_at?: string | null;
          checked_in_by_token_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          event_id?: string;
          ticket_code?: string;
          holder_name?: string | null;
          holder_type?: "lead" | "adult" | "child";
          display_order?: number;
          checked_in_at?: string | null;
          checked_in_by_token_id?: string | null;
          created_at?: string;
        };
      };
      festival_vendors: {
        Row: {
          id: string;
          event_id: string;
          business_name: string;
          contact_name: string;
          email: string;
          phone: string;
          category: "food" | "drinks" | "sweet_treats" | "retail" | "community_org";
          description: string | null;
          what_selling: string | null;
          social_handles: Record<string, string>;
          website: string | null;
          power_needed: boolean;
          power_notes: string | null;
          gazebo_size: string | null;
          has_public_liability: boolean;
          has_food_hygiene_rating: boolean;
          food_hygiene_score: number | null;
          has_risk_assessment: boolean;
          status: "pending_payment" | "pending_review" | "approved" | "rejected" | "cancelled" | "waitlisted";
          contribution_amount: number;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          refunded_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          business_name: string;
          contact_name: string;
          email: string;
          phone: string;
          category: "food" | "drinks" | "sweet_treats" | "retail" | "community_org";
          description?: string | null;
          what_selling?: string | null;
          social_handles?: Record<string, string>;
          website?: string | null;
          power_needed?: boolean;
          power_notes?: string | null;
          gazebo_size?: string | null;
          has_public_liability?: boolean;
          has_food_hygiene_rating?: boolean;
          food_hygiene_score?: number | null;
          has_risk_assessment?: boolean;
          status?: "pending_payment" | "pending_review" | "approved" | "rejected" | "cancelled" | "waitlisted";
          contribution_amount?: number;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          refunded_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          business_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string;
          category?: "food" | "drinks" | "sweet_treats" | "retail" | "community_org";
          description?: string | null;
          what_selling?: string | null;
          social_handles?: Record<string, string>;
          website?: string | null;
          power_needed?: boolean;
          power_notes?: string | null;
          gazebo_size?: string | null;
          has_public_liability?: boolean;
          has_food_hygiene_rating?: boolean;
          food_hygiene_score?: number | null;
          has_risk_assessment?: boolean;
          status?: "pending_payment" | "pending_review" | "approved" | "rejected" | "cancelled" | "waitlisted";
          contribution_amount?: number;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          refunded_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      festival_sponsors: {
        Row: {
          id: string;
          event_id: string;
          organisation_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          path: "premium" | "community" | "activity" | "custom";
          tier_key: string;
          display_name: string | null;
          logo_url: string | null;
          website: string | null;
          message: string | null;
          amount_pledged: number;
          status: "pending_payment" | "pending_review" | "confirmed" | "cancelled" | "refunded";
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          refunded_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          organisation_name: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          path: "premium" | "community" | "activity" | "custom";
          tier_key: string;
          display_name?: string | null;
          logo_url?: string | null;
          website?: string | null;
          message?: string | null;
          amount_pledged?: number;
          status?: "pending_payment" | "pending_review" | "confirmed" | "cancelled" | "refunded";
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          refunded_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          organisation_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          path?: "premium" | "community" | "activity" | "custom";
          tier_key?: string;
          display_name?: string | null;
          logo_url?: string | null;
          website?: string | null;
          message?: string | null;
          amount_pledged?: number;
          status?: "pending_payment" | "pending_review" | "confirmed" | "cancelled" | "refunded";
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          refunded_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      festival_volunteers: {
        Row: {
          id: string;
          event_id: string;
          full_name: string;
          email: string;
          phone: string;
          is_over_18: boolean;
          date_of_birth: string | null;
          availability: VolunteerAvailability;
          t_shirt_size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | null;
          dietary_requirements: string | null;
          accessibility_needs: string | null;
          skills: string | null;
          prior_experience: string | null;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          consent_to_contact: boolean;
          has_dbs: boolean | null;
          dbs_level: DbsLevel | null;
          has_safeguarding_training: boolean | null;
          safeguarding_training_notes: string | null;
          parent_guardian_name: string | null;
          parent_guardian_phone: string | null;
          parent_guardian_email: string | null;
          parent_guardian_relationship: string | null;
          parental_consent_confirmed: boolean | null;
          status: "pending" | "approved" | "assigned" | "declined" | "cancelled";
          assigned_role: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          full_name: string;
          email: string;
          phone: string;
          is_over_18?: boolean;
          date_of_birth?: string | null;
          availability?: VolunteerAvailability;
          t_shirt_size?: "XS" | "S" | "M" | "L" | "XL" | "XXL" | null;
          dietary_requirements?: string | null;
          accessibility_needs?: string | null;
          skills?: string | null;
          prior_experience?: string | null;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          consent_to_contact?: boolean;
          has_dbs?: boolean | null;
          dbs_level?: DbsLevel | null;
          has_safeguarding_training?: boolean | null;
          safeguarding_training_notes?: string | null;
          parent_guardian_name?: string | null;
          parent_guardian_phone?: string | null;
          parent_guardian_email?: string | null;
          parent_guardian_relationship?: string | null;
          parental_consent_confirmed?: boolean | null;
          status?: "pending" | "approved" | "assigned" | "declined" | "cancelled";
          assigned_role?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          is_over_18?: boolean;
          date_of_birth?: string | null;
          availability?: VolunteerAvailability;
          t_shirt_size?: "XS" | "S" | "M" | "L" | "XL" | "XXL" | null;
          dietary_requirements?: string | null;
          accessibility_needs?: string | null;
          skills?: string | null;
          prior_experience?: string | null;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          consent_to_contact?: boolean;
          has_dbs?: boolean | null;
          dbs_level?: DbsLevel | null;
          has_safeguarding_training?: boolean | null;
          safeguarding_training_notes?: string | null;
          parent_guardian_name?: string | null;
          parent_guardian_phone?: string | null;
          parent_guardian_email?: string | null;
          parent_guardian_relationship?: string | null;
          parental_consent_confirmed?: boolean | null;
          status?: "pending" | "approved" | "assigned" | "declined" | "cancelled";
          assigned_role?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      families: {
        Row: {
          id: string;
          postcode: string | null;
          preferred_contact_method: "email" | "phone" | "sms" | "whatsapp" | null;
          preferred_language: string | null;
          how_heard_about_gt: string | null;
          accessibility_requirements: string | null;
          interests: string[];
          support_areas: string[];
          photo_video_consent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          postcode?: string | null;
          preferred_contact_method?: "email" | "phone" | "sms" | "whatsapp" | null;
          preferred_language?: string | null;
          how_heard_about_gt?: string | null;
          accessibility_requirements?: string | null;
          interests?: string[];
          support_areas?: string[];
          photo_video_consent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          postcode?: string | null;
          preferred_contact_method?: "email" | "phone" | "sms" | "whatsapp" | null;
          preferred_language?: string | null;
          how_heard_about_gt?: string | null;
          accessibility_requirements?: string | null;
          interests?: string[];
          support_areas?: string[];
          photo_video_consent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      parent_carers: {
        Row: {
          id: string;
          family_id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          relationship_to_child: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          relationship_to_child?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          relationship_to_child?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      children: {
        Row: {
          id: string;
          family_id: string;
          first_name: string;
          date_of_birth: string;
          sex_at_birth: "male" | "female" | "other" | "prefer_not_to_say" | null;
          interests: string[];
          accessibility_requirements: string | null;
          communication_notes: string | null;
          allergies: string | null;
          support_areas: string[];
          parent_notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          first_name: string;
          date_of_birth: string;
          sex_at_birth?: "male" | "female" | "other" | "prefer_not_to_say" | null;
          interests?: string[];
          accessibility_requirements?: string | null;
          communication_notes?: string | null;
          allergies?: string | null;
          support_areas?: string[];
          parent_notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          first_name?: string;
          date_of_birth?: string;
          sex_at_birth?: "male" | "female" | "other" | "prefer_not_to_say" | null;
          interests?: string[];
          accessibility_requirements?: string | null;
          communication_notes?: string | null;
          allergies?: string | null;
          support_areas?: string[];
          parent_notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_event_registration_count: {
        Args: { event_uuid: string };
        Returns: {
          confirmed_count: number;
          waitlist_count: number;
          cancelled_count: number;
        }[];
      };
      check_event_availability: {
        Args: { event_uuid: string };
        Returns: {
          slots_available: number;
          waitlist_available: number;
        }[];
      };
      get_festival_headcount: {
        Args: { p_event_id: string };
        Returns: {
          total_tickets: number;
          checked_in: number;
          pending: number;
        }[];
      };
      get_festival_vendor_counts: {
        Args: { p_event_id: string };
        Returns: {
          category: "food" | "drinks" | "sweet_treats" | "retail" | "community_org";
          pending_payment: number;
          pending_review: number;
          approved: number;
          active_total: number;
        }[];
      };
    };
  };
}

// Helper types
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Registration = Database["public"]["Tables"]["registrations"]["Row"];
export type RegistrationChild = Database["public"]["Tables"]["registration_children"]["Row"];
export type RegistrationAttendee = Database["public"]["Tables"]["registration_attendees"]["Row"];
export type Donor = Database["public"]["Tables"]["donors"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
export type DonationSubscription = Database["public"]["Tables"]["donation_subscriptions"]["Row"];
export type EmailLog = Database["public"]["Tables"]["email_logs"]["Row"];

// Insert types
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type RegistrationInsert = Database["public"]["Tables"]["registrations"]["Insert"];
export type RegistrationChildInsert = Database["public"]["Tables"]["registration_children"]["Insert"];
export type RegistrationAttendeeInsert = Database["public"]["Tables"]["registration_attendees"]["Insert"];
export type DonorInsert = Database["public"]["Tables"]["donors"]["Insert"];
export type DonationInsert = Database["public"]["Tables"]["donations"]["Insert"];

// New community engagement types
export type MailingListSubscriber = Database["public"]["Tables"]["mailing_list"]["Row"];
export type MailingListInsert = Database["public"]["Tables"]["mailing_list"]["Insert"];
export type Survey = Database["public"]["Tables"]["surveys"]["Row"];
export type SurveyInsert = Database["public"]["Tables"]["surveys"]["Insert"];
export type SurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"];
export type SurveyResponseInsert = Database["public"]["Tables"]["survey_responses"]["Insert"];

// Event notification types (for scheduled publishing)
export type EventNotification = Database["public"]["Tables"]["event_notifications"]["Row"];
export type EventNotificationInsert = Database["public"]["Tables"]["event_notifications"]["Insert"];

// Parent portal (Growing Together)
export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyInsert = Database["public"]["Tables"]["families"]["Insert"];
export type ParentCarer = Database["public"]["Tables"]["parent_carers"]["Row"];
export type ParentCarerInsert = Database["public"]["Tables"]["parent_carers"]["Insert"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];

// Festival 2026 types
export type FestivalTicket = Database["public"]["Tables"]["festival_tickets"]["Row"];
export type FestivalTicketInsert = Database["public"]["Tables"]["festival_tickets"]["Insert"];
export type FestivalVendor = Database["public"]["Tables"]["festival_vendors"]["Row"];
export type FestivalVendorInsert = Database["public"]["Tables"]["festival_vendors"]["Insert"];
export type FestivalSponsor = Database["public"]["Tables"]["festival_sponsors"]["Row"];
export type FestivalSponsorInsert = Database["public"]["Tables"]["festival_sponsors"]["Insert"];
export type FestivalVolunteer = Database["public"]["Tables"]["festival_volunteers"]["Row"];
export type FestivalVolunteerInsert = Database["public"]["Tables"]["festival_volunteers"]["Insert"];
export type FestivalStewardToken = Database["public"]["Tables"]["festival_steward_tokens"]["Row"];
export type FestivalStewardTokenInsert = Database["public"]["Tables"]["festival_steward_tokens"]["Insert"];

export type FestivalVendorCategory = FestivalVendor["category"];
export type FestivalVendorStatus = FestivalVendor["status"];
export type FestivalSponsorPath = FestivalSponsor["path"];
export type FestivalSponsorStatus = FestivalSponsor["status"];
export type FestivalVolunteerStatus = FestivalVolunteer["status"];
