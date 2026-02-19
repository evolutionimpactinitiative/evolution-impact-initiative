/**
 * Historical Data Import Script
 *
 * This script imports past event registrations from the Excel spreadsheet.
 * Run with: npx ts-node scripts/import-historical-data.ts
 *
 * Or generate SQL and run in Supabase SQL Editor.
 */

import { createClient } from "@supabase/supabase-js";

// You'll need to set these environment variables or replace with actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for imports

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Event data extracted from spreadsheet
const historicalEvents = [
  {
    title: "The Big Bake Off",
    slug: "the-big-bake-off-2025",
    date: "2025-07-12", // Adjust actual date
    category: "creative",
    short_description: "A fun baking event for kids to learn cooking skills and make delicious treats.",
  },
  {
    title: "Valentines Sip & Paint",
    slug: "valentines-sip-and-paint-2025",
    date: "2025-02-14",
    category: "creative",
    short_description: "A creative painting session for kids celebrating Valentine's Day.",
  },
  {
    title: "Kids' Jewellery Making Workshop",
    slug: "jewellery-making-2025",
    date: "2025-07-19",
    category: "creative",
    short_description: "Children learn to create beautiful handmade jewellery pieces.",
  },
  {
    title: "Child Safety Programme",
    slug: "safety-programme-2025",
    date: "2025-09-28",
    category: "support",
    short_description: "Educational programme teaching children about personal safety.",
  },
  {
    title: "Sip & Paint Kids Edition",
    slug: "sip-and-paint-kids-2025",
    date: "2025-07-27",
    category: "creative",
    short_description: "A fun painting workshop designed especially for children.",
  },
  {
    title: "Back to School Giveaway",
    slug: "back-to-school-giveaway-2025",
    date: "2025-08-30",
    category: "community",
    short_description: "Community event providing school supplies to families in need.",
  },
  {
    title: "Evolution Summer Warriors Day",
    slug: "summer-warriors-day-2025",
    date: "2025-07-26",
    category: "sport",
    short_description: "A day of sports, games, and outdoor activities for young warriors.",
  },
];

// Registration data from spreadsheet (sample structure)
interface RegistrationData {
  eventSlug: string;
  parentName: string;
  email: string;
  phone: string;
  children: { name: string; age: number }[];
}

// This would be populated from the Excel data
const registrations: RegistrationData[] = [
  // Sample - actual data would be parsed from Excel
];

async function importEvents() {
  console.log("Importing events...");

  for (const event of historicalEvents) {
    const { error } = await supabase.from("events").insert({
      ...event,
      status: "published",
      event_type: "children",
      start_time: "10:00",
      end_time: "14:00",
      venue_name: "Gillingham Children & Family Hub",
      venue_address: "Gillingham, Kent",
      total_slots: 30,
      waitlist_slots: 10,
      cost: "FREE",
    });

    if (error) {
      console.error(`Error inserting event ${event.title}:`, error);
    } else {
      console.log(`✓ Inserted event: ${event.title}`);
    }
  }
}

async function importRegistrations() {
  console.log("Importing registrations...");

  for (const reg of registrations) {
    // Get event ID
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("slug", reg.eventSlug)
      .single();

    if (!event) {
      console.error(`Event not found: ${reg.eventSlug}`);
      continue;
    }

    // Insert registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        event_id: event.id,
        parent_name: reg.parentName,
        parent_email: reg.email,
        parent_phone: reg.phone,
        status: "confirmed",
        attended: "yes", // Past events - assume attended
        photo_video_consent: true,
      })
      .select()
      .single();

    if (regError) {
      console.error(`Error inserting registration for ${reg.parentName}:`, regError);
      continue;
    }

    // Insert children
    for (let i = 0; i < reg.children.length; i++) {
      const child = reg.children[i];
      const { error: childError } = await supabase
        .from("registration_children")
        .insert({
          registration_id: registration.id,
          child_name: child.name,
          child_age: child.age,
          display_order: i + 1,
        });

      if (childError) {
        console.error(`Error inserting child ${child.name}:`, childError);
      }
    }

    console.log(`✓ Imported: ${reg.parentName} with ${reg.children.length} children`);
  }
}

async function main() {
  console.log("Starting historical data import...\n");
  await importEvents();
  await importRegistrations();
  console.log("\nImport complete!");
}

main().catch(console.error);
