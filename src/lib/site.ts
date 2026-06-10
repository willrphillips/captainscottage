// Property facts pulled from captains_cottage_brief.md §7 — single source of truth.
// Update here; every page reads from this file.

export const PROPERTY = {
  name: "Captain's Cottage",
  shortName: "Captain's Cottage",
  tagline: "A waterfront retreat on Hull Creek where the Potomac meets the Bay.",
  city: "Heathsville",
  region: "VA",
  regionFull: "Virginia",
  county: "Northumberland County",
  postalCode: "22473",
  country: "US",
  waterway: "Hull Creek",
  geo: { lat: 37.95, lng: -76.45 },
  bedrooms: 3,
  beds: 4,
  bathrooms: 1.5,
  maxGuests: 6,
  wifiMbps: 103,
  checkIn: "4:00 PM",
  checkOut: "11:00 AM",
  rating: 4.92,
  reviewCount: 137,
  // Will's overall Superhost tenure (across prior properties + this cottage).
  // Captain's Cottage itself was acquired in fall 2022 — see `cottageAcquiredYear`.
  // Do NOT use `superhostYears` to imply hosting this cottage that long.
  superhostYears: 9,
  cottageAcquiredYear: 2022,
  // Airbnb has no host API — these are manually maintained. Flip to `false`
  // if/when Airbnb changes status; the SocialProof component hides each
  // badge independently. The rating badge also hides automatically when
  // `rating` drops to 4.80 or below (strict > 4.80 threshold).
  superhost: true,
  guestFavorite: true,
  top5Percent: true, // "Top 5% of homes" — Airbnb-side; flip if it ever falls off
  airbnbUrl: "https://www.airbnb.com/h/captainscottageva",
  // email intentionally removed — site directs all contact to the Airbnb listing
  owner: "Buffalo Rentals LLC",
} as const;

export const DRIVE_TIMES: { place: string; minutes: number }[] = [
  { place: "Reedville, VA", minutes: 15 },
  { place: "Kilmarnock, VA", minutes: 30 },
  { place: "Irvington, VA", minutes: 45 },
  { place: "Warsaw, VA", minutes: 45 },
  { place: "Richmond, VA", minutes: 110 },
  { place: "Norfolk / Virginia Beach", minutes: 120 },
  { place: "Washington, DC", minutes: 165 },
];

export const STANDOUT_AMENITIES: { title: string; detail: string }[] = [
  { title: "Waterfront & water access", detail: "Brackish, shallow, mostly fresh. The sand shifts with every passing season — sometimes a wide private beach, sometimes a small one, but it's always ready for wading." },
  { title: "Cedar sauna", detail: "West-facing window onto the creek. Heat, then cold plunge from the dock." },
  { title: "Hot tub", detail: "On the deck, lit by sunset. Open year-round." },
  { title: "Two screened porches", detail: "Sleeping porch off the back, dining porch over the water." },
  { title: "Dock & crab pots", detail: "Crabbing gear included. Run lines from the dock, pull at dawn." },
  { title: "West-facing sunsets", detail: "The creek lights up gold every evening from May to September." },
  { title: "Dedicated workspace", detail: "103 Mbps Wi-Fi and a quiet desk in the master." },
  { title: "Kid-ready", detail: "High chair, pack-n-play, removable bed guard. Tides shallow at the water's edge." },
  { title: "Move when you want", detail: "Yoga mats, kettlebells, two kayaks, a paddleboard." },
];

export const HEADLINE_REVIEWS: { quote: string; author: string }[] = [
  {
    quote:
      "We pulled crab pots at sunrise and watched osprey work the creek. Three days later none of us wanted to leave.",
    author: "Maya — Brooklyn, NY",
  },
  {
    quote:
      "The sauna alone is worth the trip. Add the dock, the porches, the way the light moves across the water — this is a real place.",
    author: "Daniel — Washington, DC",
  },
  {
    quote:
      "Will thought of everything. The cottage is beautiful, but the part that stayed with us was the quiet.",
    author: "Anna — Richmond, VA",
  },
];

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "The Cottage", href: "/the-cottage" },
  { label: "Amenities", href: "/amenities" },
  { label: "Area", href: "/area" },
  { label: "Activities", href: "/activities" },
  { label: "Journal", href: "/journal" },
  { label: "FAQ", href: "/faq" },
];

export const SITE = {
  origin: "https://captainscottageva.com",
  base: "/",
  defaultOgImage: "/images/og-default.jpg",
  // Email capture (Buttondown embed endpoint). Empty string = the signup
  // form is hidden site-wide. Flip it on by setting:
  // "https://buttondown.com/api/emails/embed-subscribe/<username>"
  // once Will's Buttondown account exists. List-building precedes the
  // Phase 6 direct-booking engine by design (see content/AIRBNB_OPTIMIZATION.md).
  newsletterAction: "https://buttondown.com/api/emails/embed-subscribe/captainscottage",
} as const;

// Build absolute URLs that account for the GH Pages base path.
export function absoluteUrl(pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const base = SITE.base.endsWith("/") ? SITE.base.slice(0, -1) : SITE.base;
  return `${SITE.origin}${base}${clean === "/" ? "" : clean}`;
}

export function withBase(pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const base = SITE.base.endsWith("/") ? SITE.base.slice(0, -1) : SITE.base;
  return `${base}${clean === "/" ? "/" : clean}`;
}

// Format a date-only value (stored at midnight UTC) as "June 3, 2026".
// Always formats in UTC so the authored calendar date renders exactly,
// regardless of the viewer's or build server's timezone — otherwise an
// Eastern viewer sees the date slip back a day.
export function formatDateUTC(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// Astro.url.pathname includes the configured base for static builds.
// stripBase reverses that so a path can be re-composed via absoluteUrl/withBase.
export function stripBase(astroPathname: string): string {
  const base = SITE.base.endsWith("/") ? SITE.base.slice(0, -1) : SITE.base;
  if (!base) return astroPathname || "/";
  if (astroPathname === base || astroPathname === `${base}/`) return "/";
  if (astroPathname.startsWith(`${base}/`)) {
    return astroPathname.slice(base.length);
  }
  return astroPathname || "/";
}
