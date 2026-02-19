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

export interface Database {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "editor";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: "admin" | "editor";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "editor";
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
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          child_name: string;
          child_age: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          child_name?: string;
          child_age?: number;
          display_order?: number;
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
