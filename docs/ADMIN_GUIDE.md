# Evolution Impact Initiative - Admin Guide

A step-by-step guide for managing events, registrations, and communications.

---

## Table of Contents

1. [Logging In](#1-logging-in)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Creating an Event](#3-creating-an-event)
4. [Publishing an Event](#4-publishing-an-event)
5. [Managing Registrations](#5-managing-registrations)
6. [Sending Announcements to Past Attendees](#6-sending-announcements-to-past-attendees)
7. [Sending Reminders](#7-sending-reminders)
8. [Sending Custom Email Updates](#8-sending-custom-email-updates)
9. [Day of Event: Check-In](#9-day-of-event-check-in)
10. [Exporting Registration Data](#10-exporting-registration-data)
11. [Managing Donations](#11-managing-donations)
12. [Email Logs](#12-email-logs)
13. [Settings](#13-settings)

---

## 1. Logging In

### How to Access the Admin Area

1. Go to **evolutionimpactinitiative.co.uk/login**
2. Enter your team email address (must be @evolutionimpactinitiative.co.uk)
3. Click **"Send Magic Link"**
4. Check your email inbox for a login link
5. Click the link in the email - you'll be automatically logged in

> **Note:** Only team members with @evolutionimpactinitiative.co.uk email addresses can access the admin area.

### Logging Out

- Click the **"Sign Out"** button in the top-right corner of any admin page

---

## 2. Dashboard Overview

When you log in, you'll see the **Dashboard** with key information at a glance:

### Stats Cards
- **Upcoming Events** - Number of events scheduled for the future
- **Monthly Registrations** - How many people registered this month
- **Monthly Donations** - Total donations received this month
- **Recurring Donations** - Monthly recurring donation total

### Quick Actions
- **Create Event** - Start creating a new event
- **View Registrations** - See all registrations
- **View Donations** - See donation history

### Recent Activity
- **Recent Events** - Your next 3 upcoming events with registration counts
- **Recent Registrations** - The latest 5 registrations across all events

---

## 3. Creating an Event

### Step-by-Step

1. Click **"Events"** in the sidebar (or **"Create Event"** from the dashboard)
2. Click the **"Create Event"** button (top-right)
3. Fill in the event details:

### Basic Information
| Field | Description |
|-------|-------------|
| **Title** | The name of your event (e.g., "Easter Craft Workshop") |
| **Short Description** | A brief summary (shown on event cards) |
| **Full Description** | Detailed information about the event |
| **Category** | Choose from: Creative, Sport, Support, Community, Workshop, Social, Training, Family |
| **Event Type** | Who is this for? Children, Adults, or Mixed |

### Date & Time
| Field | Description |
|-------|-------------|
| **Date** | When the event takes place |
| **Arrival Time** | When doors open (optional) |
| **Start Time** | When the event officially starts |
| **End Time** | When the event finishes |

### Location
| Field | Description |
|-------|-------------|
| **Venue Name** | Name of the location (e.g., "Medway Community Centre") |
| **Venue Address** | Full address for the venue |

### Capacity & Registration
| Field | Description |
|-------|-------------|
| **Total Slots** | Maximum number of confirmed registrations |
| **Waitlist Slots** | How many people can join the waitlist |
| **Max Children per Registration** | Limit how many children one family can register |
| **Registration Status** | Open (accepting), Closed, or Auto (opens/closes automatically) |

### Additional Details
| Field | Description |
|-------|-------------|
| **Age Group** | Target age range (e.g., "5-10 years") |
| **Cost** | Leave blank for free events, or enter price |
| **What to Bring** | Items attendees should bring |
| **Accessibility** | Accessibility information for the venue |

### Images
| Field | Description |
|-------|-------------|
| **Card Image** | Small image shown on event listings |
| **Hero Image** | Large banner image on the event page |

### Custom Fields (Optional)
Add extra questions to the registration form:
1. Click **"Add Field"**
2. Choose field type (Text, Dropdown, Checkbox, etc.)
3. Enter the question/label
4. Mark as required if needed
5. Drag to reorder fields

### Email Reminders
Customise the reminder emails sent before the event:
- **24-Hour Reminder** - Sent one day before
- **1-Hour Reminder** - Sent one hour before

---

## 4. Publishing an Event

### Draft vs Published

- **Draft** - Event is saved but not visible to the public
- **Published** - Event is live and people can register

### How to Publish

1. When creating/editing an event, scroll to the bottom
2. Choose **"Publish"** instead of "Save as Draft"
3. The event will immediately appear on the public website

### Editing a Published Event

1. Go to **Events** in the sidebar
2. Find your event and click **"Edit"**
3. Make your changes
4. Click **"Update Event"**

> **Tip:** If you need to stop registrations temporarily, change the Registration Status to "Closed" instead of unpublishing.

---

## 5. Managing Registrations

### Viewing Registrations for an Event

1. Go to **Events** in the sidebar
2. Find your event
3. Click **"View Registrations"** (or the registration count number)

### Registration Stats

At the top of the page, you'll see:
- **Confirmed** - People with guaranteed spots
- **Waitlist** - People waiting for a spot
- **Cancelled** - Cancelled registrations
- **Attended** - Check-in count (after the event)
- **Children** - Total number of children registered

### Understanding Registration Status

| Status | Meaning |
|--------|---------|
| **Confirmed** | They have a spot at the event |
| **Waitlisted** | They're on the waiting list |
| **Cancelled** | Registration was cancelled |

### Actions You Can Take

For each registration, you can:
- **View Details** - See full registration information
- **Cancel Registration** - Remove them from the event (they'll be notified)
- **Promote from Waitlist** - Move a waitlisted person to confirmed (automatic when someone cancels)

### Viewing All Registrations

To see registrations across ALL events:
1. Click **"Registrations"** in the sidebar
2. Browse or search through all registrations

---

## 6. Sending Announcements to Past Attendees

Use this feature to invite families who attended previous events to register for a new event.

### Step-by-Step

1. Go to **Events** → find your new event → **"View Registrations"**
2. Click the **"Announce"** button (megaphone icon)
3. **Select past events** to pull email addresses from:
   - Tick the checkbox next to each event you want
   - Use "Select all" to choose all past events
   - Use "Clear" to start over
4. **View the recipient count** - Shows how many families will receive the email (duplicates are automatically removed)
5. **Preview recipients** (optional):
   - Click the "Recipients" bar to expand the list
   - See all names and email addresses
   - Click the **X** next to any recipient to remove them
   - Click "Restore all" to bring back removed recipients
6. **Write your message**:
   - **Subject** - Pre-filled with "New Event: [Event Name]"
   - **Message** - Your custom message to families
   - Use `{{name}}` to personalise (e.g., "Hi {{name}}," becomes "Hi Sarah,")
7. Click **"Send to X"** to send the announcement

### What Gets Sent

The email automatically includes:
- Your custom message
- Event title, date, time, and venue
- A "Register Now" button linking to the event

### Who Receives It

- Families from the events you selected
- **Excludes** anyone already registered for the new event
- **Excludes** anyone you manually removed
- Each email address only receives one email (no duplicates)

---

## 7. Sending Reminders

Reminders help ensure families don't forget about upcoming events.

### Automatic Reminders

The system automatically sends reminders:
- **24 hours before** the event
- **1 hour before** the event

These use the custom reminder text you set when creating the event.

### Manual Reminders

To send a reminder manually:

1. Go to **Events** → find your event → **"View Registrations"**
2. Click the **"Reminder"** button (bell icon)
3. The system will send reminders to all confirmed registrations
4. You'll see a confirmation: "Sent X"

### Reminder Dashboard

To see which events need reminders:

1. Go to **"Emails"** in the sidebar
2. Look at the **"Upcoming Events"** section
3. Events in the next 7 days are listed
4. Click **"Send Reminders"** for any event

---

## 8. Sending Custom Email Updates

Need to send a custom message to registered families? Use the Update Email feature.

### Step-by-Step

1. Go to **Events** → find your event → **"View Registrations"**
2. Click the **"Update"** button (envelope icon)
3. Choose who to send to:
   - **Confirmed** - Only people with confirmed spots
   - **Waitlisted** - Only people on the waitlist
   - **All** - Everyone registered
4. Enter your **Subject** and **Message**
5. Click **"Send to X"**

### When to Use This

- Venue change or updated directions
- Time changes
- Important reminders
- Event cancellation notices
- Follow-up after an event

---

## 9. Day of Event: Check-In

Use the Check-In Mode to track attendance on the day of your event.

### Accessing Check-In Mode

1. Go to **Events** → find your event → **"View Registrations"**
2. Click the **"Check-in"** button (clipboard icon)
3. You'll see the Check-In screen optimised for tablets/phones

### Check-In Screen Overview

At the top you'll see:
- **Checked In** - Number of children who have arrived
- **Pending** - Number still expected
- **Families** - Total family count

### Finding a Registration

- Use the **search bar** to find by parent name or child name
- Registrations with unchecked children appear first
- Fully checked-in families move to the bottom

### Checking In

**For a single child:**
1. Tap on the family card to expand it
2. Find the child's name
3. Tap **"Check In"** next to their name
4. The button changes to **"Undo"** in case of mistakes

**For an entire family:**
1. Tap on the family card to expand it
2. Tap **"Check In All Children"**
3. All children are marked as attended

### Visual Indicators

| Colour | Meaning |
|--------|---------|
| **Green circle with tick** | Fully checked in |
| **Yellow circle with numbers** | Partially checked in (e.g., 1/2) |
| **Grey circle** | Not yet checked in |

### Undoing a Check-In

1. Find the family and expand it
2. Find the child
3. Tap **"Undo"** next to their name

---

## 10. Exporting Registration Data

Download registration data as a spreadsheet (CSV file).

### How to Export

1. Go to **Events** → find your event → **"View Registrations"**
2. Click the **"Export"** button (download icon)
3. A CSV file will download automatically

### What's Included

The export contains:
- Registration ID and status
- Parent name, email, and phone
- Each child's name and age
- Accessibility requirements
- Registration date
- Attendance status (after check-in)

### Using the Export

- Open in Excel, Google Sheets, or Numbers
- Use for:
  - Printing name badges
  - External mailing lists
  - Reporting and analysis
  - Backup records

---

## 11. Managing Donations

View and track donations received through the website.

### Accessing Donations

1. Click **"Donations"** in the sidebar

### Donation Stats

- **Total Raised** - All-time donation total
- **This Month** - Donations received this month
- **Monthly Recurring** - Active monthly donation subscriptions
- **Gift Aid** - Estimated Gift Aid value (25% of eligible donations)
- **Donors** - Number of unique donors

### Donation Types

| Type | Description |
|------|-------------|
| **One-time** | Single donation |
| **Monthly** | Recurring monthly donation |
| **Gift Aid** | Donor opted in for Gift Aid (marked with a tag) |

### Viewing Donation Details

Each donation shows:
- Donor name and email
- Amount
- Date
- Type (one-time or monthly)
- Gift Aid status

---

## 12. Email Logs

View the history of all emails sent by the system.

### Accessing Email Logs

1. Click **"Emails"** in the sidebar

### Email Stats

- **Total Sent** - All emails ever sent
- **Sent** - Successfully delivered
- **Pending** - Currently being sent
- **Failed** - Emails that couldn't be delivered

### Email Types

| Type | Description |
|------|-------------|
| **Registration** | Sent when someone registers |
| **Waitlist** | Sent when someone joins the waitlist |
| **Promotion** | Sent when moved from waitlist to confirmed |
| **Reminder** | Event reminders (24h and 1h before) |
| **Update** | Custom messages sent by admin |
| **Announcement** | New event announcements to past attendees |
| **Confirmation** | 72-hour attendance confirmation |

### Troubleshooting Failed Emails

If you see failed emails:
1. Check if the email address is valid
2. The person may have unsubscribed
3. Their inbox may be full
4. Contact support if issues persist

---

## 13. Settings

View organisation settings and team members.

### Accessing Settings

1. Click **"Settings"** in the sidebar

### Team Members

View all admin users who can access the system. Each shows:
- Name
- Email address
- Role (Admin or Editor)

> **Note:** To add or remove team members, contact your administrator.

### Email Notifications

View which automatic emails are enabled:
- Registration confirmations
- Event reminders (24h before)
- Donation receipts

### Organisation Information

View your organisation details:
- Organisation Name
- Company Number
- Contact Email
- Location

---

## Quick Reference: Common Tasks

| Task | Where to Go |
|------|-------------|
| Create a new event | Events → Create Event |
| See who registered | Events → [Event] → View Registrations |
| Check people in | Events → [Event] → Registrations → Check-in |
| Send reminder emails | Events → [Event] → Registrations → Reminder button |
| Announce to past attendees | Events → [Event] → Registrations → Announce button |
| Export registration list | Events → [Event] → Registrations → Export button |
| See donation history | Donations |
| Check email delivery | Emails |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar (on check-in page) |

---

## Need Help?

If you encounter any issues or have questions:
- Email: hello@evolutionimpactinitiative.co.uk
- Check this guide for step-by-step instructions

---

*Last updated: February 2025*
