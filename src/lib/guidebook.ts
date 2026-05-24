// Guidebook data transcribed from the host's Airbnb Northern Neck guidebook
// (guidebook 3989357). Single source of truth for area/activity recommendations.
// Consumed by the Phase 4 /area + /activities pages and Phase 2 travel posts.
// Update here; never restate a recommendation inline in markup.

export type GuidebookCategory =
  | "Food & drink"
  | "Sightseeing"
  | "Shopping"
  | "Entertainment"
  | "Watercraft";

export interface GuidebookPlace {
  name: string;
  category: GuidebookCategory;
  /** Nearest town, where the host names one. */
  town?: string;
  /** Airbnb "locals recommend" count at time of capture; omitted where absent. */
  locals?: number;
  /** Host's note, lightly cleaned from the guidebook. First person = the host. */
  note: string;
}

export const GUIDEBOOK: GuidebookPlace[] = [
  {
    name: "The Office Bistro",
    category: "Food & drink",
    locals: 43,
    note: "We enjoyed this with our two little girls. The decor evokes the dentist office it used to be. The girls liked the pizza; we liked the pasta and burger. A quirky, fun spot.",
  },
  {
    name: "Chao Phraya",
    category: "Food & drink",
    town: "Kilmarnock",
    locals: 31,
    note: "One of our favorites in Kilmarnock. Sushi plus a long list of Thai options — the curry dishes were really nice.",
  },
  {
    name: "Reedville Market",
    category: "Food & drink",
    town: "Reedville",
    locals: 71,
    note: "Solid waterfront dining in Reedville — decent food and a relaxed spot to settle in by the water for an evening.",
  },
  {
    name: "Chitterchats",
    category: "Food & drink",
    locals: 50,
    note: "The best ice cream stop around. They serve Richmond's Gelati Celeste, our personal favorite in all of Virginia.",
  },
  {
    name: "Food Lion",
    category: "Food & drink",
    locals: 39,
    note: "Not fancy, but this is the nearest grocery store. Friendly, helpful staff.",
  },
  {
    name: "Callao Brewing Company & Restaurant",
    category: "Food & drink",
    town: "Callao",
    locals: 29,
    note: "A great local brewery, a favorite with visitors from near and far, and a pretty short drive from the house.",
  },
  {
    name: "Kellum Farms",
    category: "Food & drink",
    locals: 16,
    note: "Great local produce — fruits and lovely flowers in season. Call ahead to confirm hours and offerings; contact info is on their social media page.",
  },
  {
    name: "Kellum Farms Produce & Seafood",
    category: "Food & drink",
    note: "A second Kellum location. For hours and offerings, contact their Irvington store.",
  },
  {
    name: "Rivah Vineyards at The Grove",
    category: "Food & drink",
    locals: 23,
    note: "A delightful afternoon adventure nearby. Typically open weekends only — check their website. They host events from time to time, so see if anything lines up with your stay.",
  },
  {
    name: "Reedville Fishermen's Museum",
    category: "Sightseeing",
    town: "Reedville",
    locals: 54,
    note: "A local spot the locals love. They run lots of events through the year — call or check the website to see what's on during your stay, and whether events are members-only or open to guests.",
  },
  {
    name: "Kilmarnock Antique Gallery",
    category: "Shopping",
    town: "Kilmarnock",
    locals: 40,
    note: "A cute little store for antique hunting and a nice souvenir to remember your time here.",
  },
  {
    name: "Friends of the Northumberland County Animal Shelter Thrift Shop",
    category: "Shopping",
    note: "We like to stop here for antiques. Call to confirm hours before going — plenty of treasures to be found.",
  },
  {
    name: "Rivah Consignments",
    category: "Shopping",
    locals: 6,
    note: "Another antique and thrift shop if you enjoy treasure hunting like we do.",
  },
  {
    name: "Jeff's Country Market",
    category: "Shopping",
    note: "A nice little local country market. They partner with local farmers, fishermen, and butchers for great local eats and odds and ends.",
  },
  {
    name: "Compass Entertainment Complex",
    category: "Entertainment",
    locals: 134,
    note: "Loads of fun for the whole family — a huge fun zone with movies, go-karts, mini golf, and lots more. Our kids love it.",
  },
  {
    name: "The Slips // Kinsale",
    category: "Watercraft",
    town: "Kinsale",
    locals: 13,
    note: "Kayak rentals and other watercraft. Primarily a summer operation, but give them a call — they also offer kayak deliveries if it's the right time of year.",
  },
];

export interface TravelerTip {
  title: string;
  body: string;
}

export const TRAVELER_ADVICE: TravelerTip[] = [
  {
    title: "Pack skin-covering swimwear for late summer and fall",
    body: "The house sits on a tributary of the Chesapeake Bay, so we share the water with its wildlife. In late summer and early fall it's common to see jellyfish drift past the dock on the current; they can sting swimmers as they pass. To minimize the effect, wear skin-covering swimwear — swim leggings, a full-body rash guard, and/or a wetsuit. Searching \"stinger suit\" online turns up inexpensive options. Message us with any questions before you come.",
  },
  {
    title: "Fishing tours",
    body: "If you're interested in a fishing tour, let us know. We know a few local guides who would love to take you out — contact us ahead of time so we can connect you. Availability and price vary.",
  },
];
