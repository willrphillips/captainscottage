/**
 * Which property is this Airbnb thread about?
 *
 * WHY THIS EXISTS. Will owns two Airbnb listings and this repo holds the facts
 * for exactly one of them. His rule, 2026-07-20: the Richmond monthly-stay
 * listing is a different property, it is always NEEDS-WILL, it is never
 * drafted for, and it is never called "the cottage" (he flagged that error
 * after it was made). Until 2026-10-08 that rule lived only in
 * `.claude/agents/guest-reply.md`, which the cloud watcher does not read: the
 * live script took every `from:airbnb.com` guest thread and drafted "for
 * Captain's Cottage" with no listing check at all.
 *
 * MATCH ON THE REAL LISTING TITLES, NOT THE NAMES WE USE INTERNALLY. This is
 * the part that would have broken a reasonable-looking implementation. The
 * brief for this change said to match "Captain's Cottage" for the cottage
 * path. That string appears in **zero** real guest notifications. Verified
 * 2026-10-08 by reading Will's actual Gmail: every guest message arrives from
 * `express@airbnb.com` with the listing title in the subject, like
 *
 *   RE: Reservation for Waterfront Cottage w Water Access, Sauna, Hot Tub, Oct 23 - 25
 *   RE: Reservation for Monthly Stays-Historic 4BR home-5 min to downtown, Jul 20 - Oct 20
 *   RE: Inquiry for Monthly Stays-Historic 4BR home-5 min to downtown, Jul 15 - Aug 14
 *
 * "Captain's Cottage" is the brand on the website. The Airbnb listing is
 * titled "Waterfront Cottage w Water Access, Sauna, Hot Tub". Matching the
 * brand would have escalated every single real thread and quietly killed the
 * automation while looking correct in review.
 *
 * FAILS SAFE BY REQUIRING A POSITIVE COTTAGE MATCH. "Not Apperson, therefore
 * the cottage" would be shorter and wrong: the day Will adds a third listing,
 * it would draft cottage facts at that property's guests. Nothing is drafted
 * unless the thread positively identifies as the cottage, so a listing-title
 * change on Airbnb's side shows up as a run full of NEEDS-WILL escalations,
 * which is visible and harmless, rather than as confidently wrong replies.
 *
 * Deterministic string matching, no model call, per the brief. The decision
 * about whether to draft at all must not depend on a model's reading.
 */

/**
 * The Apperson / Richmond monthly-stay listing. Any one of these is enough.
 *
 * Checked as separate fragments rather than as the whole title because the
 * real title joins its parts with em dashes
 * ("Monthly Stays—Historic 4BR home—5 min to downtown"), and an em dash is
 * exactly the character that goes wrong across encodings, quoted-printable
 * mail bodies and subject-line folding. Fragments survive all of that.
 *
 * "apperson" is in here because Airbnb's own internal nickname for the listing
 * appears in some notification bodies ("Richmond Apperson · Monthly Stays...").
 */
const APPERSON_MARKERS = [
  "monthly stays",
  "historic 4br",
  "historic 4 br",
  "5 min to downtown",
  "apperson",
];

/**
 * Captain's Cottage. The first three are fragments of the live Airbnb title;
 * the rest are brand and geography, kept so that a future retitle to something
 * branded still identifies correctly.
 */
const COTTAGE_MARKERS = [
  "waterfront cottage w water access",
  "waterfront cottage w/ water access",
  "sauna, hot tub",
  "captain's cottage",
  "captains cottage",
  "heathsville",
  "hull creek",
];

const hay = (...parts) => parts.filter(Boolean).join("\n").toLowerCase();
const hit = (text, markers) => markers.filter((m) => text.includes(m));

/**
 * @param {{subject?: string, body?: string, listingName?: string}} input
 * @returns {{property: string, listing: "cottage"|"apperson"|"unknown",
 *            draftable: boolean, why: string}}
 *
 * `property` is written into the run report for every thread, per Will's rule
 * that the report names the property it touched.
 */
export function identifyListing({ subject = "", body = "", listingName = "" } = {}) {
  const text = hay(listingName, subject, body);

  const apperson = hit(text, APPERSON_MARKERS);
  const cottage = hit(text, COTTAGE_MARKERS);

  // Apperson wins every tie. A thread carrying both is not a cottage thread
  // that happens to mention Richmond; it is ambiguous, and ambiguous is
  // NEEDS-WILL. Either way the outcome is the same, so order costs nothing and
  // buys a clearer reason string.
  if (apperson.length) {
    return {
      property: "1304 Apperson (Monthly Stays, Richmond)",
      listing: "apperson",
      draftable: false,
      why: cottage.length
        ? `both listings matched (apperson: ${apperson.join(", ")}; cottage: ${cottage.join(", ")})`
        : `matched ${apperson.join(", ")}`,
    };
  }

  if (cottage.length) {
    return {
      property: "Captain's Cottage",
      listing: "cottage",
      draftable: true,
      why: `matched ${cottage.join(", ")}`,
    };
  }

  return {
    property: "unidentified",
    listing: "unknown",
    draftable: false,
    why: "no listing marker found in the listing name, subject or body",
  };
}

export const MARKERS = { APPERSON_MARKERS, COTTAGE_MARKERS };
