// Back to School Drive 2026: centralised data
// Keep this in sync with the seeded `events` row (slug: back-to-school-drive-2026)

export const B2S_SLUG = "back-to-school-drive-2026";

export const B2S = {
  slug: B2S_SLUG,
  title: "Back to School Drive 2026",
  date: "2026-08-22",
  dateLabel: "Saturday 22 August 2026",
  startTime: "12:00",
  endTime: "15:00",
  timeLabel: "12pm – 3pm",
  venueName: "Sunlight Centre",
  venueAddress: "Richmond Road, Gillingham, ME7 1LX",
  venueArea: "Gillingham",
  registrationDeadline: "2026-08-21T18:00:00+01:00",
  registrationDeadlineLabel: "Friday 21 August 2026, 6PM",
  approvalEmailLabel: "Friday 21 August 2026",
  totalSlots: 500,
  maxChildrenPerRegistration: 4,
  goalChildren: 500,
  minChildAge: 4,
  maxChildAge: 12,
} as const;

// Uniform size dropdown values, displayed as "Age {value}" on the form.
// Range matches the stock we actually carry (see back_to_school_stock).
export const UNIFORM_SIZES = [
  "3-4",
  "4",
  "4-5",
  "5",
  "5-6",
  "6",
  "6-7",
  "7",
  "7-8",
  "8",
  "8-9",
  "9",
  "9-10",
  "10",
  "10-11",
  "11",
  "11-12",
  "12-13",
] as const;

export type UniformSize = (typeof UNIFORM_SIZES)[number];

export type ChildSex =
  | "male"
  | "female"
  | "other"
  | "prefer_not_to_say";

export const CHILD_SEX_OPTIONS: Array<{ value: ChildSex; label: string }> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// Categories a family can request per child. `items_given` on the day mirrors
// these keys as booleans in a JSONB object.
export type NeedCategory = "uniform" | "stationery" | "bag";

export const NEED_OPTIONS: Array<{
  value: NeedCategory;
  label: string;
  hint: string;
}> = [
  { value: "uniform", label: "Uniform", hint: "Shirts, trousers, skirts" },
  { value: "stationery", label: "Stationery", hint: "Pens, pencils, pencil case" },
  { value: "bag", label: "School bag", hint: "Backpack" },
];

// Uniform preferences captured at registration when the family ticks
// "uniform" in the needs section. Stocked colour range is deliberately
// tight (grey/black/blue) to match what we can actually source in bulk.

export const UNIFORM_COLOURS = [
  { value: "grey", label: "Grey" },
  { value: "black", label: "Black" },
  { value: "blue", label: "Blue" },
] as const;
export type UniformColour = (typeof UNIFORM_COLOURS)[number]["value"];

export const BOTTOM_TYPES = [
  { value: "trousers", label: "Trousers" },
  { value: "skirt", label: "Skirt" },
  { value: "dress", label: "Dress" },
  { value: "shorts", label: "Shorts" },
] as const;
export type BottomType = (typeof BOTTOM_TYPES)[number]["value"];

export const POLO_COLOURS = [
  { value: "white", label: "White" },
  { value: "blue", label: "Blue" },
] as const;
export type PoloColour = (typeof POLO_COLOURS)[number]["value"];

export const SLEEVE_OPTIONS = [
  { value: "short", label: "Short sleeve" },
  { value: "long", label: "Long sleeve" },
] as const;
export type SleeveLength = (typeof SLEEVE_OPTIONS)[number]["value"];

export type UniformChoices = {
  bottom: { type: BottomType; colour: UniformColour };
  polo: { colour: PoloColour; sleeve: SleeveLength } | null;
  shirt: { sleeve: SleeveLength } | null;
};

// Human-readable summary for the admin list, approval email, and steward
// collection sheet.
export function uniformChoicesSummary(uc: UniformChoices | null): string {
  if (!uc) return "";
  const bottomLabel =
    BOTTOM_TYPES.find((b) => b.value === uc.bottom.type)?.label ?? uc.bottom.type;
  const colourLabel =
    UNIFORM_COLOURS.find((c) => c.value === uc.bottom.colour)?.label ?? uc.bottom.colour;
  const parts: string[] = [`${colourLabel} ${bottomLabel.toLowerCase()}`];
  if (uc.polo) {
    const c = POLO_COLOURS.find((p) => p.value === uc.polo!.colour)?.label ?? uc.polo.colour;
    parts.push(`${c} polo (${uc.polo.sleeve})`);
  }
  if (uc.shirt) {
    parts.push(`White shirt (${uc.shirt.sleeve})`);
  }
  return parts.join(" · ");
}

// Sponsorship tiers from the 2026 sponsorship pack. `amount` is the pounds figure a
// sponsor picks with a card payment via the DonationForm; `children` is what
// that gift kits (at £20/child). Champion/Major/Title Partner are inquiry-only
// because they involve invoicing, logo files and negotiated benefits.

export type SponsorTier =
  | "friend"
  | "bronze"
  | "silver"
  | "gold"
  | "family"
  | "champion"
  | "major"
  | "title"
  | "custom"
  | "undecided";

export const SPONSOR_LUKE = {
  name: "Luke Rogers",
  role: "Director, Evolution Impact Initiative CIC",
  mobile: "07495 699946",
  landline: "01634 907078",
  email: "luke@evolutionimpactinitiative.co.uk",
} as const;

export interface CommunityTierDef {
  value: Exclude<SponsorTier, "champion" | "major" | "title" | "custom" | "undecided">;
  label: string;
  amount: number; // pounds
  childrenReached: number;
  benefits: {
    socialThankYou: boolean;
    certificate: boolean;
    logoWebsite: boolean;
    logoCampaign: boolean;
    namedCollectionPoint: boolean;
    impactReportFeature: boolean;
  };
}

export const COMMUNITY_TIERS: CommunityTierDef[] = [
  {
    value: "friend",
    label: "Friend",
    amount: 50,
    childrenReached: 2,
    benefits: {
      socialThankYou: true,
      certificate: true,
      logoWebsite: false,
      logoCampaign: false,
      namedCollectionPoint: false,
      impactReportFeature: false,
    },
  },
  {
    value: "bronze",
    label: "Bronze",
    amount: 100,
    childrenReached: 5,
    benefits: {
      socialThankYou: true,
      certificate: true,
      logoWebsite: true,
      logoCampaign: false,
      namedCollectionPoint: false,
      impactReportFeature: false,
    },
  },
  {
    value: "silver",
    label: "Silver",
    amount: 250,
    childrenReached: 12,
    benefits: {
      socialThankYou: true,
      certificate: true,
      logoWebsite: true,
      logoCampaign: true,
      namedCollectionPoint: false,
      impactReportFeature: false,
    },
  },
  {
    value: "gold",
    label: "Gold",
    amount: 500,
    childrenReached: 25,
    benefits: {
      socialThankYou: true,
      certificate: true,
      logoWebsite: true,
      logoCampaign: true,
      namedCollectionPoint: true,
      impactReportFeature: false,
    },
  },
  {
    value: "family",
    label: "Family",
    amount: 750,
    childrenReached: 37,
    benefits: {
      socialThankYou: true,
      certificate: true,
      logoWebsite: true,
      logoCampaign: true,
      namedCollectionPoint: true,
      impactReportFeature: true,
    },
  },
];

export interface PremiumTierDef {
  value: "champion" | "major" | "title";
  eyebrow: string;
  label: string;
  priceLabel: string;
  childrenReached: number;
  benefits: string[];
  featured?: boolean;
}

export const PREMIUM_TIERS: PremiumTierDef[] = [
  {
    value: "champion",
    eyebrow: "Champion",
    label: "Back to School Champion",
    priceLabel: "£1,000+",
    childrenReached: 50,
    benefits: [
      "Logo on website & materials",
      "Social media thank-you",
      "Certificate of partnership",
      "Updates from the drive",
    ],
  },
  {
    value: "major",
    eyebrow: "Major",
    label: "Community Impact Partner",
    priceLabel: "£1,500",
    childrenReached: 75,
    benefits: [
      "Logo on materials & website",
      "Social media feature",
      "Named on collection points",
      "Certificate of partnership",
    ],
  },
  {
    value: "title",
    eyebrow: "Headline",
    label: "Title Partner",
    priceLabel: "£3,000",
    childrenReached: 150,
    benefits: [
      'Headline "in partnership with you" billing',
      "Logo on all materials & collection points",
      "Named sponsor of the drive",
      "Press mention + social feature",
      "Featured in impact report",
    ],
    featured: true,
  },
];

// Impact ladder rows shown on the sponsor page. £20 = one uniform.
export const IMPACT_LADDER: Array<{ amount: string; body: string }> = [
  { amount: "£20", body: "A full uniform for 1 child" },
  { amount: "£100", body: "Up to 5 children" },
  { amount: "£250", body: "Up to 12 children" },
  { amount: "£500", body: "Up to 25 children" },
  { amount: "£1,000", body: "Up to 50 children" },
  { amount: "£3,000", body: "Up to 150 children" },
];

// Sponsorship contact — Luke as per the 2026 sponsorship pack.
export const SPONSOR_CONTACT = SPONSOR_LUKE;

// Supply pledge items: what donors can pledge on the pledge form.
export const SUPPLY_PLEDGE_ITEMS = [
  "White shirts",
  "White polo shirts",
  "Grey & black trousers",
  "Black & grey skirts",
  "Pencil cases",
  "Pens, pencils & stationery",
  "Tights & socks",
  "Lunch boxes",
  "School bags",
] as const;

export type SupplyPledgeItem = (typeof SUPPLY_PLEDGE_ITEMS)[number] | string;
