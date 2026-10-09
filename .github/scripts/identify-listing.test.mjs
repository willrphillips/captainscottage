/**
 * Fixtures for the listing guard. Run: node .github/scripts/identify-listing.test.mjs
 *
 * The subjects and body fragments below are REAL, copied from Will's Gmail on
 * 2026-10-08 (guest names removed). That matters: the point of this guard is
 * that it matches what Airbnb actually sends, and the obvious implementation
 * ("Captain's Cottage") matches none of it.
 */
import { identifyListing } from "./identify-listing.mjs";

let pass = 0, fail = 0;

function check(name, input, wantListing, wantDraftable) {
  const got = identifyListing(input);
  const ok = got.listing === wantListing && got.draftable === wantDraftable;
  if (ok) pass++; else fail++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}\n` +
    `      -> ${got.listing} / draftable=${got.draftable} / ${got.property}\n` +
    `         ${got.why}` +
    (ok ? "" : `\n      EXPECTED ${wantListing} / draftable=${wantDraftable}`),
  );
}

console.log("--- the three cases the brief asked for ---\n");

check(
  "Cottage: real guest-message subject",
  { subject: "RE: Reservation for Waterfront Cottage w Water Access, Sauna, Hot Tub, Oct 23 – 25" },
  "cottage", true,
);

check(
  "Apperson: real guest-message subject",
  { subject: "RE: Reservation for Monthly Stays—Historic 4BR home—5 min to downtown, Jul 20 – Oct 20" },
  "apperson", false,
);

check(
  "Ambiguous: a guest message with no listing anywhere",
  { subject: "RE: your reservation", body: "Hi Will, what time is check-in?" },
  "unknown", false,
);

console.log("\n--- the ones that would bite later ---\n");

check(
  "Apperson: inquiry, not reservation (different subject verb)",
  { subject: "RE: Inquiry for Monthly Stays—Historic 4BR home—5 min to downtown, Jul 15 – Aug 14" },
  "apperson", false,
);

check(
  "Apperson: em dashes mangled to hyphens in transit",
  { subject: "RE: Reservation for Monthly Stays-Historic 4BR home-5 min to downtown, Jul 20 - Oct 20" },
  "apperson", false,
);

check(
  "Apperson: listing only in the body, generic subject",
  {
    subject: "Your reservation change was accepted",
    body: "Richmond Apperson · Monthly Stays—Historic 4BR home—5 min to downtown",
  },
  "apperson", false,
);

check(
  "Apperson wins when both listings appear in one thread",
  {
    subject: "RE: Reservation for Monthly Stays—Historic 4BR home—5 min to downtown",
    body: "asking about the waterfront cottage w water access too",
  },
  "apperson", false,
);

check(
  "Cottage: listing only in the body",
  {
    subject: "Your reservation change was accepted",
    body: "Guest\nRichmond, VA\nWaterfront Cottage w Water Access, Sauna, Hot Tub",
  },
  "cottage", true,
);

check(
  "Cottage: brand name, in case Airbnb's title is ever changed to it",
  { subject: "RE: Reservation for Captain's Cottage, Oct 23 – 25" },
  "cottage", true,
);

check(
  "Nothing at all: empty input escalates rather than defaulting to the cottage",
  {},
  "unknown", false,
);

check(
  "A third listing Will might add tomorrow is NOT assumed to be the cottage",
  { subject: "RE: Reservation for Some New Beach Place, Dec 1 – 5" },
  "unknown", false,
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
