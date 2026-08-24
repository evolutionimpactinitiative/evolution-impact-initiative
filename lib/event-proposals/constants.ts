// Single source of truth for who can review event proposals — the
// only account that can move-to-review, request-more-info, approve
// or reject. Kept as a plain email so it works on both server and
// client without a DB roundtrip.
//
// To change the reviewer, update this constant. To open reviews up
// to multiple people, swap this for a `can_review_proposals` boolean
// flag on `team_members` (mirrors the `is_treasurer` pattern) and
// point the guards + UI at the flag instead.
export const PROPOSAL_REVIEWER_EMAIL = "info@evolutionimpactinitiative.co.uk";
