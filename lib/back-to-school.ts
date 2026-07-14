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

// Uniform size dropdown values, exactly as requested by the user.
// Displayed as "Age {value}" on the form so parents pick the size their child wears.
export const UNIFORM_SIZES = [
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
