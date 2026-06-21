export type SlotsRegistration = {
  registration_children?: { id: string }[] | null;
  registration_attendees?: { id: string }[] | null;
};

// "mixed" events count the lead booker as a slot — the form treats their
// "Your Details" as attending implicitly, separate from optional Adult
// Attendees. "children" events treat the booker as drop-off only.
// "adults" events require the booker to self-add as the first attendee,
// so counting attendees alone already includes them.
export function slotsForRegistration(
  reg: SlotsRegistration,
  eventType: string | null | undefined,
): number {
  const childCount = reg.registration_children?.length || 0;
  const attendeeCount = reg.registration_attendees?.length || 0;

  switch (eventType) {
    case "children":
      return childCount;
    case "adults":
      return attendeeCount;
    default:
      return 1 + childCount + attendeeCount;
  }
}

export function slotsNeededForNewRegistration(
  childCount: number,
  attendeeCount: number,
  eventType: string | null | undefined,
): number {
  switch (eventType) {
    case "children":
      return childCount;
    case "adults":
      return attendeeCount;
    default:
      return 1 + childCount + attendeeCount;
  }
}
