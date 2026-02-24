# Development Session Log

## Session: 24 February 2026

### Summary
Implemented clean email design across all templates and added instant notification system for when events go live.

---

### Features Implemented

#### 1. Clean Email Design
Updated all email templates to use a clean, minimal design with white boxes and subtle gray borders instead of colored backgrounds.

**Templates Updated:**
- Registration Confirmation
- Waitlist Confirmation
- Waitlist Promotion
- Attendance Confirmation
- Donation Receipt
- Welcome Subscriber
- Registration Open (Notify Me)
- Event Photos
- Event Update (bulk)
- Event Announcement
- Notification Signup Confirmation

**Design Changes:**
- White backgrounds (`#ffffff`) with subtle gray borders (`#e5e7eb`)
- Dark text headers instead of blue
- Consistent `border-radius: 12px` on all boxes
- Removed colored backgrounds (blue, yellow, green fills)

#### 2. Instant Notifications When Events Go Live
Previously, notification emails were only sent via a daily cron job at 6 AM UTC, causing up to 12-hour delays.

**New Flow:**
- When admin publishes an event with immediate registration → notifications sent **instantly**
- When admin publishes with scheduled registration → notifications sent when registration opens
- Daily cron job remains as backup

**Files Created:**
- `app/api/notifications/trigger/route.ts` - POST endpoint to trigger instant notifications
- Updated `components/admin/EventForm.tsx` - Calls trigger API after publishing

#### 3. Test Email Endpoint
Created endpoint to preview notification emails without affecting real data.

**Endpoint:** `POST /api/notifications/test-email`
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "eventId": "uuid",
  "type": "registration_open" | "signup_confirmation"
}
```

#### 4. Clear Notifications Endpoint
Added ability to clear all notification signups for an event (for admin/testing use).

**Endpoint:** `DELETE /api/notifications/trigger`
```json
{
  "eventId": "uuid"
}
```

---

### Bug Fixes

#### 1. Notification Signup Confirmation Email Not Sending
**Problem:** Users filling in the "Notify Me" form weren't receiving confirmation emails.

**Cause:** Silent error handling was masking issues.

**Fix:** Added better error logging and fixed the email sending flow in `/api/notifications/signup/route.ts`.

---

### Files Modified

| File | Changes |
|------|---------|
| `lib/email/templates.ts` | Clean design for all email templates |
| `app/api/email/send-bulk/route.ts` | Clean design for event update emails |
| `app/api/email/send-announcement/route.ts` | Clean design for announcement emails |
| `app/api/subscribers/send-bulk/route.ts` | Already had clean design (logo fix) |
| `app/api/subscribers/send-email/route.ts` | Already had clean design (logo fix) |
| `components/admin/EventForm.tsx` | Trigger instant notifications on publish |
| `app/api/notifications/trigger/route.ts` | NEW - Instant trigger + clear notifications |
| `app/api/notifications/test-email/route.ts` | NEW - Test email preview endpoint |
| `app/api/notifications/signup/route.ts` | Better error logging for confirmation emails |

---

### Commits

1. `7072e0d` - Update all email templates to clean white design
2. `9b946f9` - Add instant notification trigger when event goes live
3. `612baff` - Add test endpoint for registration open email preview
4. `e345abc` - Add signup confirmation email type to test endpoint
5. `6cb3748` - Add better error logging for notification signup email
6. `0ef925f` - Add DELETE endpoint to clear event notifications

---

### How Instant Notifications Work

1. **Immediate Registration (no scheduled date):**
   - Admin clicks "Publish" → Event goes live
   - System immediately sends "Registration is Open" email to everyone on notify list

2. **Scheduled Registration (future publish_at date):**
   - Event shows "Coming Soon" with countdown
   - Users sign up via "Notify Me" form → receive confirmation email
   - When publish_at time passes and admin updates/republishes → instant notifications sent
   - Daily cron job at 6 AM UTC acts as backup

---

## Session: 20 February 2026

### Summary
Continued implementation of community engagement features and bug fixes for Evolution Impact Initiative website.

---

### Features Implemented

#### 1. Subscriber Management Quick Wins
- **Add Subscriber Manually** (`components/admin/AddSubscriberModal.tsx`)
  - Form with email, name, and tag selection
  - API endpoint: `/api/subscribers/add`
  - Supports reactivating previously unsubscribed users

- **Email Send History/Log**
  - Migration for `email_logs` table with RLS policies
  - Individual and bulk email APIs now log all sends
  - Added badges for "Individual", "Bulk", and "Welcome" email types in `/admin/emails`

- **Subscriber Tags System**
  - Added `tags TEXT[]` column to `mailing_list` table
  - Tags display in both card and table views
  - Available tags: volunteer, donor, parent, partner, sponsor, press, vip

#### 2. Email Logging Integration
- Updated `/api/subscribers/send-email` to log emails
- Updated `/api/subscribers/send-bulk` to log emails
- Batch processing with rate limiting for bulk sends

---

### Bug Fixes

#### 1. Registration Not Found Error
**Problem:** Cancel registration and confirm attendance pages showed "Registration Not Found" even when registration existed in database.

**Cause:** RLS (Row Level Security) policies prevented public pages from accessing registrations table.

**Fix:** Changed APIs to use `createAdminClient()` instead of `createClient()`:
- `/api/registrations/cancel/route.ts`
- `/api/registrations/confirm-attendance/route.ts`

#### 2. Incorrect Available Slots Count
**Problem:** Event pages showed "20 of 20 places available" even after bookings were made.

**Cause:** Same RLS issue - public pages couldn't read registration counts.

**Fix:** Updated event pages to use admin client for registration counts:
- `app/(public)/events/page.tsx`
- `app/(public)/events/[slug]/page.tsx`
- `app/(public)/events/[slug]/register/page.tsx`

#### 3. Time Display Showing Seconds
**Problem:** Event times showed as "15:00:00" instead of "15:00".

**Fix:** Added `formatTime()` helper function to strip seconds:
```typescript
function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}
```

Applied to:
- `app/(public)/events/page.tsx`
- `app/(public)/events/[slug]/register/page.tsx`
- `app/(public)/events/[slug]/register/confirmation/page.tsx`

#### 4. Improved Error Handling for Registration Pages
**Changes:**
- Friendlier error message: "This registration may have already been cancelled, or the link has expired"
- Added contact email link (info@evolutionimpactinitiative.co.uk)
- Added "Contact Us" button
- Changed from red error icon to amber warning icon

Updated files:
- `app/(public)/cancel-registration/page.tsx`
- `app/(public)/confirm-attendance/page.tsx`

#### 5. Wrong Contact Email
**Problem:** Error pages used `evolutionimpactinitiative@gmail.com` instead of official email.

**Fix:** Changed to `info@evolutionimpactinitiative.co.uk`

---

### Database Migration Created

**File:** `supabase-migration-email-logs-tags.sql`

```sql
-- Add tags column to mailing_list
ALTER TABLE mailing_list ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_mailing_list_tags ON mailing_list USING GIN(tags);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  sent_by TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

**Note:** Run this migration in Supabase SQL Editor if not already done.

---

### Files Modified

| File | Changes |
|------|---------|
| `components/admin/SubscribersView.tsx` | Added tags display, Add button |
| `components/admin/AddSubscriberModal.tsx` | NEW - Manual subscriber form |
| `components/admin/EmailsView.tsx` | Added Individual/Bulk/Welcome badges |
| `app/api/subscribers/add/route.ts` | NEW - Add subscriber API |
| `app/api/subscribers/send-email/route.ts` | Added email logging |
| `app/api/subscribers/send-bulk/route.ts` | Added email logging |
| `app/api/registrations/cancel/route.ts` | Use admin client |
| `app/api/registrations/confirm-attendance/route.ts` | Use admin client |
| `app/(public)/events/page.tsx` | Admin client + formatTime |
| `app/(public)/events/[slug]/page.tsx` | Admin client for reg counts |
| `app/(public)/events/[slug]/register/page.tsx` | Admin client + formatTime |
| `app/(public)/events/[slug]/register/confirmation/page.tsx` | formatTime helper |
| `app/(public)/cancel-registration/page.tsx` | Better error handling |
| `app/(public)/confirm-attendance/page.tsx` | Better error handling |

---

### Commits

1. `b34d982` - Add subscriber tags, manual add, and email logging
2. `995e5ad` - Improve error handling for registration not found pages
3. `883e41c` - Fix registration lookup and correct contact email
4. `e96a6d2` - Fix registration counts on public event pages
5. `4e1c01f` - Remove seconds from time display on event pages

---

### Key Learnings

1. **RLS Bypass Pattern:** For public pages that need to read protected data (like registration counts), use `createAdminClient()` which uses the service role key to bypass RLS.

2. **Time Formatting:** PostgreSQL time fields often include seconds. Use regex to strip them: `time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1")`

3. **User-Friendly Errors:** Instead of generic "Not Found" messages, provide:
   - Possible reasons for the error
   - Contact information
   - Alternative actions (Browse Events, Contact Us)
