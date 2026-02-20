# Evolution Impact Initiative - Features Tracker

## Implemented Features

### 1. Mailing List Subscription
**Status:** ✅ Complete

- Footer subscribe form with email input
- Welcome email sent on subscription
- Unsubscribe page (`/unsubscribe`)
- Admin subscribers page (`/admin/subscribers`)

**Files:**
- `components/layout/Footer.tsx`
- `components/layout/FooterSubscribeForm.tsx`
- `app/api/subscribe/route.ts`
- `app/(public)/unsubscribe/page.tsx`
- `app/admin/subscribers/page.tsx`

---

### 2. Subscriber Management
**Status:** ✅ Complete

- View all subscribers (card/table view)
- Search and filter by status
- Add subscriber manually with tags
- Remove subscriber
- Export to CSV
- Send individual email to subscriber
- Send bulk email to all active subscribers

**Files:**
- `components/admin/SubscribersView.tsx`
- `components/admin/AddSubscriberModal.tsx`
- `components/admin/ComposeEmailModal.tsx`
- `app/admin/subscribers/bulk-email/page.tsx`
- `app/api/subscribers/add/route.ts`
- `app/api/subscribers/delete/route.ts`
- `app/api/subscribers/send-email/route.ts`
- `app/api/subscribers/send-bulk/route.ts`

---

### 3. Email Logging
**Status:** ✅ Complete

- All emails logged to `email_logs` table
- View email history in `/admin/emails`
- Email types: registration, waitlist, reminder, individual, bulk, welcome
- Status tracking: sent, failed, pending

**Files:**
- `app/admin/emails/page.tsx`
- `components/admin/EmailsView.tsx`

---

### 4. Subscriber Tags/Segments
**Status:** ✅ Complete

- Tags column in mailing list table
- Assign tags when adding subscribers
- Display tags in subscriber list
- Available tags: volunteer, donor, parent, partner, sponsor, press, vip

**Migration:** `supabase-migration-email-logs-tags.sql`

---

### 5. WhatsApp Community Page
**Status:** ✅ Complete

- Dedicated `/community` page
- "Small Acts" community description
- WhatsApp join link
- Added to footer navigation

**Files:**
- `app/(public)/community/page.tsx`
- `components/layout/Footer.tsx`

---

### 6. Survey/Feedback System
**Status:** ✅ Complete

- Survey builder with multiple question types
- Question types: rating, multiple choice, multi-select, text, yes/no
- Public feedback form
- Survey responses view with analytics
- Send survey to event attendees

**Files:**
- `app/admin/surveys/page.tsx`
- `app/admin/surveys/new/page.tsx`
- `app/admin/surveys/[id]/page.tsx`
- `app/(public)/feedback/[id]/page.tsx`
- `components/admin/SurveyBuilder.tsx`
- `components/admin/SurveyForm.tsx`
- `components/admin/SurveyResponsesView.tsx`
- `app/api/surveys/route.ts`
- `app/api/surveys/respond/route.ts`
- `app/api/email/send-survey/route.ts`

---

### 7. Event Registration System
**Status:** ✅ Complete

- Event registration with children details
- Waitlist management
- Registration confirmation emails
- Cancel registration via email link
- Confirm attendance (72hr reminder)
- Check-in system for events

**Files:**
- `app/(public)/events/[slug]/register/page.tsx`
- `app/(public)/cancel-registration/page.tsx`
- `app/(public)/confirm-attendance/page.tsx`
- `app/admin/events/[id]/check-in/page.tsx`

---

### 8. Event Photos Email
**Status:** ✅ Complete

- Add photo album URL to event
- Send photos email to attendees

**Files:**
- `components/admin/SendPhotosModal.tsx`
- `app/api/email/send-photos/route.ts`

---

## Pending Features

### 1. Tag-Based Email Filtering
**Status:** 🔲 Pending

**Description:** Send bulk emails to subscribers filtered by tags (e.g., only volunteers, only donors).

**Implementation:**
- Add tag filter dropdown in bulk email page
- Update send-bulk API to filter by tags
- Add tag statistics to dashboard

---

### 2. Email Templates Library
**Status:** 🔲 Pending

**Description:** Save and reuse email templates for common communications.

**Implementation:**
- Create `email_templates` table
- Template management UI in admin
- Select template when composing emails
- Variables: {name}, {event_title}, {date}, etc.

---

### 3. Automated Email Sequences
**Status:** 🔲 Pending

**Description:** Automated email workflows triggered by events.

**Sequences to implement:**
- Welcome sequence (Day 1, Day 3, Day 7 after signup)
- Post-event follow-up (Thank you + survey link)
- Re-engagement for inactive subscribers

---

### 4. Subscriber Import
**Status:** 🔲 Pending

**Description:** Bulk import subscribers from CSV file.

**Implementation:**
- CSV upload UI
- Column mapping interface
- Duplicate detection
- Import preview before confirm

---

### 5. Email Analytics Dashboard
**Status:** 🔲 Pending

**Description:** Track email performance metrics.

**Metrics:**
- Open rates (requires tracking pixel)
- Click rates (requires link tracking)
- Bounce rates
- Unsubscribe rates
- Best send times

---

### 6. Event Waitlist Auto-Promotion
**Status:** 🔲 Partial

**Description:** Automatically promote waitlisted registrations when spots open.

**Current:** Logic exists but promotion email not sent.

**To complete:**
- Send waitlist promotion email when spot opens
- Include deadline to confirm

---

### 7. Recurring Events
**Status:** 🔲 Pending

**Description:** Create recurring event series (weekly, monthly).

**Implementation:**
- Recurrence pattern in event creation
- Auto-generate future event instances
- Link related events in series

---

### 8. Volunteer Management
**Status:** 🔲 Pending

**Description:** Track and manage volunteers.

**Features:**
- Volunteer profiles
- Skills/availability tracking
- Event volunteer assignments
- Volunteer hours logging
- Thank you emails

---

### 9. Donation Tracking Enhancements
**Status:** 🔲 Pending

**Description:** Enhanced donation management.

**Features:**
- Recurring donations
- Donation goals/campaigns
- Donor recognition levels
- Annual giving statements
- Gift Aid tracking (UK)

---

### 10. SMS Notifications
**Status:** 🔲 Pending

**Description:** Send SMS reminders for events.

**Implementation:**
- Integrate Twilio or similar
- Phone number collection in registration
- SMS consent checkbox
- Event reminder SMS (24hr before)

---

### 11. Mobile App / PWA
**Status:** 🔲 Pending

**Description:** Progressive Web App for mobile access.

**Features:**
- Event check-in via mobile
- Push notifications
- Offline capability
- QR code scanning

---

### 12. Multi-Language Support
**Status:** 🔲 Pending

**Description:** Support multiple languages for the website.

**Languages to consider:**
- English (default)
- Polish
- Romanian
- Bengali

---

## Quick Wins (Easy to Implement)

1. **Email delivery status tracking** - Add Resend webhook to track bounces
2. **Subscriber activity log** - Track when subscriber opened/clicked emails
3. **Event capacity warnings** - Alert admin when event is 80% full
4. **Duplicate registration check** - Warn if same email registers twice
5. **Registration notes field** - Allow parents to add special requirements
6. **Event calendar view** - Calendar UI for admin events page
7. **Subscriber export filters** - Export by date range, tags, source

---

## Database Migrations Needed

### Run if not already applied:

```sql
-- File: supabase-migration-email-logs-tags.sql
-- Adds: tags column to mailing_list, email_logs table
```

### Future migrations:

```sql
-- email_templates table
-- volunteer_profiles table
-- recurring_events table
-- donation_campaigns table
```

---

## Notes

- All email sending uses Resend API
- Admin access restricted to @evolutionimpactinitiative.co.uk emails
- RLS policies require admin client for public page data access
- Time fields stored as HH:MM:SS, display as HH:MM

---

*Last updated: 20 February 2026*
