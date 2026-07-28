// Evolution Fest 2026 — centralised festival data
// Keep this in sync with the seeded `events` row (slug: evolution-fest-2026)

export const FESTIVAL_SLUG = "evolution-fest-2026";

export const FESTIVAL = {
  slug: FESTIVAL_SLUG,
  title: "Evolution Fest 2026",
  tagline: "Celebrating one year of impact",
  blurb:
    "A free, family festival celebrating one year of Evolution Impact Initiative — with food, games, arts & crafts, live entertainment, and community stalls. Every visit helps fund our Back to School campaign supporting 500 children across Medway.",
  date: "2026-07-25",
  dateLabel: "Saturday 25 July 2026",
  startTime: "12:00",
  endTime: "18:00",
  timeLabel: "12pm – 6pm",
  venueName: "Strood Youth Centre",
  venueArea: "Medway",
  totalTickets: 150,
  expectedAttendance: "200+",
  campaignKey: "back-to-school-2026",
  campaignTarget: 10000, // GBP (whole pounds)
  // Offline donations collected outside Stripe (cash, vendor contributions).
  // Added to the live Stripe total wherever "raised so far" is shown.
  // Breakdown: £250 cash donations + £100 vendor contributions.
  campaignOfflineRaisedPounds: 350,
  campaignGoalChildren: 500,
  applicationDeadline: "2026-07-18",
  applicationDeadlineLabel: "Saturday 18 July 2026",
  volunteerDeadline: "2026-07-22",
  volunteerDeadlineLabel: "Wednesday 22 July 2026",
} as const;

// Anniversary headline stats — single source of truth
export const FIRST_YEAR_STATS = {
  peopleSupported: 749,
  eventsDelivered: 12,
  uniformsGiven: 114,
  turkeysGiven: 200,
  goalChildren: 500,
} as const;

// All 12 events of year one (from the Community Partnership & Sponsorship Pack)
// Used as fallback if the events table is missing rows.
export type FirstYearEvent = {
  date: string; // ISO date
  dateLabel: string;
  title: string;
  countLabel: string;
  category:
    | "Sport & Youth"
    | "Support & Outreach"
    | "Creative & Wellbeing"
    | "Community Events";
};

export const FIRST_YEAR_EVENTS: FirstYearEvent[] = [
  { date: "2025-07-26", dateLabel: "26 Jul 2025", title: "Summer Warriors Day", countLabel: "40 children", category: "Sport & Youth" },
  { date: "2025-08-30", dateLabel: "30 Aug 2025", title: "Back to School Giveaway", countLabel: "114 uniforms", category: "Support & Outreach" },
  { date: "2025-09-27", dateLabel: "27 Sep 2025", title: "Sip & Paint for Kids", countLabel: "60 children", category: "Creative & Wellbeing" },
  { date: "2025-09-28", dateLabel: "28 Sep 2025", title: "Child Safety Programme", countLabel: "40 children", category: "Sport & Youth" },
  { date: "2025-10-25", dateLabel: "25 Oct 2025", title: "Jewellery Making Workshop", countLabel: "60 children", category: "Creative & Wellbeing" },
  { date: "2025-12-13", dateLabel: "13 Dec 2025", title: "Big Bake Off · Christmas", countLabel: "60 children", category: "Creative & Wellbeing" },
  { date: "2025-12-23", dateLabel: "23 Dec 2025", title: "Christmas Turkey Giveaway", countLabel: "200 turkeys", category: "Support & Outreach" },
  { date: "2026-02-14", dateLabel: "14 Feb 2026", title: "Valentine's Sip & Paint", countLabel: "60 children", category: "Creative & Wellbeing" },
  { date: "2026-03-14", dateLabel: "14 Mar 2026", title: "Women Who Glow · Candles", countLabel: "20 ladies", category: "Community Events" },
  { date: "2026-04-04", dateLabel: "4 Apr 2026", title: "Easter · Create & Hunt", countLabel: "40 children", category: "Creative & Wellbeing" },
  { date: "2026-05-30", dateLabel: "30 May 2026", title: "Mini Movers Dance Fitness", countLabel: "25 children", category: "Sport & Youth" },
  { date: "2026-06-13", dateLabel: "13 Jun 2026", title: "Little Garden Makers", countLabel: "30 children", category: "Creative & Wellbeing" },
];

// ============================================
// Vendor catalog (matches Vendor Pack PDF)
// ============================================

export type VendorCategoryKey =
  | "food"
  | "drinks"
  | "sweet_treats"
  | "retail"
  | "community_org";

export type VendorCategory = {
  key: VendorCategoryKey;
  label: string;
  examples: string[];
  contributionPence: number; // 0 = free
  contributionLabel: string;
  cap: number;
  // Slots claimed outside the applications flow (e.g. offline bookings).
  // Added to live application counts everywhere capacity is shown or enforced.
  manualTaken?: number;
};

export const VENDOR_CATEGORIES: VendorCategory[] = [
  {
    key: "food",
    label: "Food Vendors",
    examples: ["Burgers", "Chicken", "African", "Caribbean", "Desserts", "Street food"],
    contributionPence: 5000,
    contributionLabel: "£50",
    cap: 3,
    manualTaken: 3,
  },
  {
    key: "drinks",
    label: "Drinks Vendors",
    examples: ["Fresh juice", "Mocktails", "Coffee", "Tea", "Soft drinks"],
    contributionPence: 5000,
    contributionLabel: "£50",
    cap: 1,
    manualTaken: 1,
  },
  {
    key: "sweet_treats",
    label: "Sweet Treat Vendors",
    examples: ["Ice cream", "Cakes", "Donuts", "Sweets", "Candy Floss", "Popcorn", "Slushies"],
    contributionPence: 5000,
    contributionLabel: "£50",
    cap: 2,
    manualTaken: 1,
  },
  {
    key: "retail",
    label: "Community & Retail Stalls",
    examples: ["Clothing", "Jewellery", "Crafts", "Gifts", "Local business"],
    contributionPence: 2500,
    contributionLabel: "£25",
    cap: 2,
  },
  {
    key: "community_org",
    label: "Community Organisations",
    examples: ["Charities", "CICs", "Support services", "Community groups"],
    contributionPence: 0,
    contributionLabel: "FREE",
    cap: 2,
  },
];

export const VENDOR_TOTAL_CAP = VENDOR_CATEGORIES.reduce(
  (sum, c) => sum + c.cap,
  0,
); // 3 + 1 + 2 + 2 + 2 = 10

// ============================================
// Sponsor catalog (matches Community Partnership & Sponsorship Pack)
// ============================================

export type SponsorPath = "premium" | "community" | "activity" | "custom";

export type SponsorTier = {
  key: string;
  path: SponsorPath;
  label: string;
  badge?: string;
  pricePence: number; // minimum pledge
  priceLabel: string;
  // null = no cap. 1 = one available (Title Partner). For activity zones, 1 each.
  cap: number | null;
  perks: string[];
  impactLabel?: string;
  highlight?: boolean;
};

export const SPONSOR_TIERS: SponsorTier[] = [
  // Premium
  {
    key: "title_partner",
    path: "premium",
    label: "Title Partner",
    badge: "Headline · 1 available",
    pricePence: 300_000,
    priceLabel: "£3,000",
    cap: 1,
    perks: [
      '"Fest 2026 in partnership with you" headline billing',
      "Logo on all banners, stage & marketing",
      "Named sponsor of the Back to School campaign",
      "Press mention + dedicated social feature",
      "Premium stall at the event",
    ],
    impactLabel: "Funds uniforms for ~120 children",
    highlight: true,
  },
  {
    key: "community_impact",
    path: "premium",
    label: "Community Impact Partner",
    badge: "Major",
    pricePence: 150_000,
    priceLabel: "£1,500",
    cap: null,
    perks: [
      "Logo on event banners & website",
      "Social media feature",
      "Stall at the event",
      "Certificate of partnership",
    ],
    impactLabel: "Supports ~60 children",
  },
  {
    key: "b2s_champion",
    path: "premium",
    label: "Back to School Champion",
    badge: "Champion",
    pricePence: 100_000,
    priceLabel: "£1,000+",
    cap: null,
    perks: [
      "Logo on website & selected materials",
      "Social media thank-you",
      "Certificate of partnership",
      "Invitation to the day",
    ],
    impactLabel: "Supports ~40 children",
  },

  // Community ladder
  {
    key: "family_fun",
    path: "community",
    label: "Family Fun",
    pricePence: 75_000,
    priceLabel: "£750",
    cap: null,
    perks: [
      "Social media thank-you",
      "Certificate of thanks",
      "Logo on our website",
      "Logo on event banner",
      "Community stall space",
      "Verbal thank-you on the day",
    ],
  },
  {
    key: "gold",
    path: "community",
    label: "Gold",
    pricePence: 50_000,
    priceLabel: "£500",
    cap: null,
    perks: [
      "Social media thank-you",
      "Certificate of thanks",
      "Logo on our website",
      "Logo on event banner",
      "Community stall space",
      "Verbal thank-you on the day",
    ],
  },
  {
    key: "silver",
    path: "community",
    label: "Silver",
    pricePence: 25_000,
    priceLabel: "£250",
    cap: null,
    perks: [
      "Social media thank-you",
      "Certificate of thanks",
      "Logo on our website",
      "Logo on event banner",
    ],
  },
  {
    key: "bronze",
    path: "community",
    label: "Bronze",
    pricePence: 10_000,
    priceLabel: "£100",
    cap: null,
    perks: [
      "Social media thank-you",
      "Certificate of thanks",
      "Logo on our website",
    ],
  },
  {
    key: "friend",
    path: "community",
    label: "Friend",
    pricePence: 5_000,
    priceLabel: "£50",
    cap: null,
    perks: ["Social media thank-you", "Certificate of thanks"],
  },

  // Activity zones (each unique — cap 1)
  {
    key: "activity_childrens_zone",
    path: "activity",
    label: "Children's Activity Zone",
    pricePence: 60_000,
    priceLabel: "from £600",
    cap: 1,
    perks: [
      "Signage at the zone",
      "Mention on the day",
      "Social media feature",
      "The biggest single sponsorship footprint at the Fest",
    ],
    highlight: true,
  },
  {
    key: "activity_ice_cream",
    path: "activity",
    label: "Ice Cream Giveaway",
    pricePence: 50_000,
    priceLabel: "from £500",
    cap: 1,
    perks: ["Branded as your treat", "Signage", "Social media feature"],
  },
  {
    key: "activity_arts_crafts",
    path: "activity",
    label: "Arts & Crafts Zone",
    pricePence: 40_000,
    priceLabel: "from £400",
    cap: 1,
    perks: ["Signage", "Mention on the day", "Social media feature"],
  },
  {
    key: "activity_sports",
    path: "activity",
    label: "Sports Zone",
    pricePence: 40_000,
    priceLabel: "from £400",
    cap: 1,
    perks: ["Signage", "Mention on the day", "Social media feature"],
  },
  {
    key: "activity_face_painting",
    path: "activity",
    label: "Face Painting Area",
    pricePence: 30_000,
    priceLabel: "from £300",
    cap: 1,
    perks: ["Signage", "Mention on the day", "Social media feature"],
  },
];

export function getSponsorTier(key: string): SponsorTier | undefined {
  return SPONSOR_TIERS.find((t) => t.key === key);
}

export function getSponsorsByPath(path: SponsorPath): SponsorTier[] {
  return SPONSOR_TIERS.filter((t) => t.path === path);
}

// ============================================
// Volunteer role catalog (used by the admin assign-role dropdown)
// ============================================

export type VolunteerRoleGroup =
  | "Front of house"
  | "Kids & families"
  | "Food, drink & vendors"
  | "Fundraising"
  | "Stage & content"
  | "Site logistics"
  | "Safety & welfare";

export type VolunteerRole = {
  label: string;
  group: VolunteerRoleGroup;
  hint?: string;
};

export const VOLUNTEER_ROLES: VolunteerRole[] = [
  // Front of house
  {
    label: "Registration & Welcome Desk",
    group: "Front of house",
    hint: "Check tickets, wristbands, direct guests",
  },
  {
    label: "Site Steward / Marshal",
    group: "Front of house",
    hint: "Monitor entrances, direct foot traffic",
  },

  // Kids & families
  {
    label: "Kids' Activity Zone Lead",
    group: "Kids & families",
    hint: "DBS + safeguarding preferred",
  },
  {
    label: "Kids' Zone Helper",
    group: "Kids & families",
    hint: "Safeguarding-aware; hands-on with the kids",
  },
  {
    label: "Face Painting / Arts & Crafts Helper",
    group: "Kids & families",
    hint: "Creative station under Kids' Zone Lead",
  },
  {
    label: "Sports Zone Steward",
    group: "Kids & families",
    hint: "Relays, games, keep the pitch safe",
  },

  // Food, drink & vendors
  {
    label: "Food Village Steward",
    group: "Food, drink & vendors",
    hint: "Vendor load-in, queue management, water station",
  },
  {
    label: "Ice Cream Giveaway Steward",
    group: "Food, drink & vendors",
    hint: "Hand out sponsored ice cream, tally per child",
  },

  // Fundraising
  {
    label: "Back to School Donations Steward",
    group: "Fundraising",
    hint: "Bucket + card reader, pitch the £10k / 500 children ask",
  },

  // Stage & content
  {
    label: "Stage & Entertainment Assistant",
    group: "Stage & content",
    hint: "Cue acts on/off, keep the running order to time",
  },
  {
    label: "Photography & Social Media",
    group: "Stage & content",
    hint: "Capture the day for socials and sponsor thank-yous",
  },

  // Site logistics
  {
    label: "Setup Crew",
    group: "Site logistics",
    hint: "10am–12pm — tables, signage, gazebos",
  },
  {
    label: "Packdown Crew",
    group: "Site logistics",
    hint: "From 6pm — tear-down, waste out, load vans",
  },
  {
    label: "Community Stall Support",
    group: "Site logistics",
    hint: "Help community orgs with setup, cover for breaks",
  },

  // Safety & welfare
  {
    label: "First Aid & Welfare Lead",
    group: "Safety & welfare",
    hint: "First-aid cert + DBS; lost-child protocol",
  },

  // Catch-all
  {
    label: "Roaming Helper / Floater",
    group: "Front of house",
    hint: "No fixed post; plugs gaps as they emerge",
  },
];

// ============================================
// What's on at the festival (from the pack)
// ============================================

export const FESTIVAL_HIGHLIGHTS = [
  { title: "Family games & activities", description: "Friendly competition and play for every age." },
  { title: "Arts & crafts", description: "Hands-on making and creativity for kids." },
  { title: "Live entertainment", description: "Live music and performances on stage." },
  { title: "Food village", description: "Local traders and street-food favourites." },
  { title: "Free ice cream", description: "A giveaway for every child who comes along." },
  { title: "Community stalls", description: "Local groups, services and partners." },
];

// ============================================
// FAQ
// ============================================

export const FESTIVAL_FAQ = [
  {
    q: "Is the festival really free?",
    a: "Yes — completely free. We ask everyone to book a ticket so we can manage capacity (we have 150 tickets), but there is nothing to pay. Donations on the day go to our Back to School campaign.",
  },
  {
    q: "How many tickets do I need for my family?",
    a: "One ticket per person — including children. A family of four needs four tickets. When you register, you can book all of them in one go and we'll email you the tickets together.",
  },
  {
    q: "Where is it and how do I get there?",
    a: "Strood Youth Centre in Medway. Full venue address and travel info are emailed with your ticket. There is parking nearby and we are within walking distance of Strood station.",
  },
  {
    q: "Can I trade or have a stall?",
    a: `Yes — vendor applications are open until ${FESTIVAL.applicationDeadlineLabel}. Choose your category on the vendor application page. Community organisations are free; food/drinks/sweets are a £50 contribution; retail is £25.`,
  },
  {
    q: "How do I sponsor the day?",
    a: "We have three sponsorship paths — premium partnerships, community ladder (£50–£750), and activity-zone sponsorships. See the Sponsor page for full details.",
  },
  {
    q: "I want to volunteer. What's involved?",
    a: "Fill in the short volunteer form and the team will be in touch with a role. We cover setup, the festival itself (split into AM/PM slots), and pack-down. We provide T-shirts for everyone on the day.",
  },
  {
    q: "What about accessibility?",
    a: "The venue is wheelchair accessible. Tell us about any specific accessibility needs when you register and we'll do everything we can to make the day work for you.",
  },
];
