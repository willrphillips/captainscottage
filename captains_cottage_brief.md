# Captain's Cottage — Marketing Site Build Brief

**Project codename:** `captainscottage`
**Local path:** `C:\Users\willr\Sky Zone Phillips Dropbox\Will Phillips\1Personal Files\Codex\captainscottage`
**Owner:** Will Phillips (Good Old Boys LLC)
**Property:** airbnb.com/h/captainscottageva — Heathsville, VA on Hull Creek (Northern Neck)
**Status:** Active Airbnb, 4.92★, 137 reviews, Superhost 9 years, top 5% of homes
**Goal:** Drive direct bookings via SEO, reduce Airbnb commission dependency, build brand for the Northern Neck waterfront rental category.

---

## 1. Strategic context

### Why we're building this
1. **Reduce OTA dependency.** Airbnb takes 14–16% per booking. Direct bookings keep that margin.
2. **Own the guest relationship.** Email list, repeat bookings, referrals, off-season fills.
3. **Capture organic search traffic.** Travelers research on Google before booking on Airbnb. Catch them upstream.
4. **Build brand equity** as a property, not a listing — extensible if Will adds a second Northern Neck property.

### Who we're competing against on Google
- Direct property sites: Sea Duck Cottage (Maine), The Cottages at Cabot Cove, Bayside Cottage Rentals
- Aggregators: VRBO, Vacasa, Airbnb itself, NorthernNeckRentals.com, Chesapeake Bay vacation rental directories
- Long-tail wins, head-term loses. We will not rank for "Virginia vacation rental." We can absolutely rank for "Hull Creek cottage Heathsville" and "Potomac River cottage with sauna and hot tub."

### The SEO thesis
Modern vacation rental SEO in 2026 is **Search Everywhere Optimization**: Google + Google Vacation Rentals carousel + Bing + AI Overviews (Google SGE) + ChatGPT/Perplexity citations. The way to win all of those simultaneously is the same: **deep, structured, location-specific content with strong schema markup and fast page speed.**

---

## 2. Tech stack & architecture

### Stack (non-negotiable)
- **Framework:** Astro 5+ (static site generator, ships near-zero JS by default — best SEO scores)
- **Content:** MDX for blog posts and location guides
- **Styling:** Tailwind CSS v4
- **Typography:** `@fontsource` packages for self-hosted Fraunces + Inter Tight (faster than Google Fonts CDN, better Core Web Vitals)
- **Image optimization:** Astro's built-in `<Image>` component → WebP, AVIF, responsive `srcset`, lazy loading
- **Forms:** Netlify Forms or Formspree for contact (no backend needed)
- **Analytics:** Plausible (privacy-first, fast) or GA4
- **Hosting:** GitHub Pages → migrate to Cloudflare Pages later (free, faster edge, easier custom domain)
- **Repo:** `github.com/[will-username]/captainscottage` — public so GitHub Pages serves from `gh-pages` branch

### Why Astro over Next.js / Gatsby / WordPress
| | Astro | Next.js | WordPress |
|---|---|---|---|
| SEO score out of the box | 100/100 | Good with work | Good with plugins |
| Page speed | Fastest possible (static HTML) | Fast (SSR/SSG) | Slow without caching |
| Blog with MDX | First-class | First-class | Plugin-dependent |
| Hosting cost | $0 (GH Pages/Cloudflare) | $0–20/mo (Vercel) | $10–30/mo |
| Maintenance | None | Occasional | Constant (security) |
| Will's existing workflow fit | High (Markdown native) | Medium | Low |

### Folder structure
```
captainscottage/
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── _redirects                # for Cloudflare later
│   └── images/                   # static images (property photos, OG images)
├── src/
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── BookingCTA.astro
│   │   ├── AmenityGrid.astro
│   │   ├── PhotoGallery.astro
│   │   ├── ReviewQuote.astro
│   │   ├── LocationMap.astro
│   │   ├── BlogCard.astro
│   │   └── SchemaVacationRental.astro   # JSON-LD schema injection
│   ├── layouts/
│   │   ├── BaseLayout.astro      # head, fonts, analytics, schema
│   │   └── BlogPost.astro        # post layout with schema, related posts
│   ├── content/
│   │   ├── config.ts             # content collections (typed)
│   │   ├── blog/                 # MDX blog posts
│   │   └── guides/               # location/area guides (separate collection)
│   ├── pages/
│   │   ├── index.astro           # home (landing)
│   │   ├── the-cottage.astro     # full property details, all photos
│   │   ├── amenities.astro
│   │   ├── area/
│   │   │   ├── index.astro       # Northern Neck overview
│   │   │   ├── heathsville.astro
│   │   │   ├── reedville.astro
│   │   │   ├── kilmarnock.astro
│   │   │   ├── irvington.astro
│   │   │   └── warsaw.astro
│   │   ├── activities/
│   │   │   ├── index.astro
│   │   │   ├── crabbing.astro
│   │   │   ├── kayak-fishing.astro
│   │   │   ├── striped-bass.astro
│   │   │   └── birding.astro
│   │   ├── book.astro            # routes to Airbnb + future direct booking
│   │   ├── faq.astro
│   │   ├── journal/
│   │   │   ├── index.astro       # blog list
│   │   │   └── [...slug].astro   # dynamic blog post page
│   │   ├── rss.xml.js            # auto RSS feed
│   │   ├── sitemap.xml           # auto via @astrojs/sitemap
│   │   └── 404.astro
│   └── styles/
│       └── global.css
└── README.md
```

### Required Astro integrations
```bash
npx astro add tailwind mdx sitemap
npm install @astrojs/rss @fontsource/fraunces @fontsource/inter-tight
```

---

## 3. Design system

### Aesthetic direction
**Editorial-coastal.** Think: Kinfolk magazine meets a New England waterfront lifestyle brand. Not "beachy" (no shells, no rope fonts, no Pinterest cottagecore). Warm, refined, quiet confidence. The cottage is the hero — typography and whitespace defer to the photography.

### Color tokens (Tailwind config)
```js
colors: {
  bone:      '#f4eee3',  // primary background — warm off-white
  'bone-deep': '#ebe2d1', // section backgrounds for subtle break
  ink:       '#1a2734',  // primary text, navy-black
  'ink-soft':'#2d3a47',  // secondary text
  navy:      '#16283d',  // dark hero / footer
  rust:      '#b8552e',  // primary accent (CTAs, eyebrows, links on hover)
  'rust-deep':'#8f3d1d', // hover states
  sage:      '#5a6a52',  // secondary accent for variation
  sand:      '#d9c9a8',  // soft accent on dark backgrounds
  rule:      'rgba(26, 39, 52, 0.18)', // border/divider lines
}
```

### Typography
- **Display:** Fraunces (variable, opsz 9-144). Use italics liberally for accents — `em` tags inside headlines should be italic and rust-colored.
- **Body:** Inter Tight (weights 300, 400, 500, 600)
- **Pairing rule:** Fraunces for anything you want to look like a magazine. Inter Tight for everything else.
- **Type scale:** clamp() everywhere for fluid responsive. Hero: `clamp(64px, 11vw, 168px)`. H2: `clamp(48px, 6vw, 88px)`. Body: 16-18px.

### Layout principles
- **Asymmetry over symmetry.** Avoid centered everything. Pull headlines left, push numerals right, let images break the grid.
- **Generous whitespace.** Sections at 120-160px vertical padding on desktop.
- **One bold element per section.** Either a giant headline, a full-bleed image, a quote-band, or an asymmetric photo grid — not all four.
- **Grain texture overlay.** Subtle SVG noise at 0.35 opacity multiply blend over the body to break the digital flatness.
- **Drop caps on first paragraph of long-form sections.** Use Fraunces italic, rust color, ~72px, floated.

### Motion
- Scroll-triggered fade-up reveals on section entry (40px translate, 1s cubic-bezier ease)
- Hover states: subtle (translateY(-2px) on cards, opacity shifts on links)
- No autoplay video. No carousel. No animated cursors. Restraint is the design.

### Inspiration references for Claude Code
- Aman Resorts (aman.com) — typography hierarchy, photography weight
- The Lake (the-lake.co) — editorial blog layout
- Marfa Saint (marfasaint.com) — warm minimalism
- Plain Magazine (plainmagazine.com) — drop caps, asymmetric grids
- Inness (innessnewyork.com) — color palette territory

---

## 4. SEO strategy

### Primary keyword targets (in priority order)

**Tier 1 — high-intent, low-competition (the wins):**
1. `Hull Creek cottage rental`
2. `Heathsville VA vacation rental`
3. `Northern Neck waterfront cottage`
4. `Potomac River cottage with hot tub`
5. `Chesapeake Bay tributary rental`

**Tier 2 — moderate competition, achievable:**
6. `Northern Neck Airbnb`
7. `Virginia waterfront cottage with sauna`
8. `Reedville VA lodging`
9. `Potomac River vacation rental`
10. `private beach Virginia rental`

**Tier 3 — long-tail informational (blog magnets):**
11. `things to do in Reedville VA`
12. `crabbing on the Potomac River`
13. `Northern Neck Virginia travel guide`
14. `striped bass fishing Hull Creek`
15. `tide chart Heathsville Virginia`
16. `best time to visit Northern Neck`
17. `Virginia oyster country travel`
18. `weekend trips from Richmond VA`
19. `weekend trips from DC waterfront`
20. `Chesapeake Bay weekend getaway`

### Page-level SEO requirements

Every page must have:
- **Unique `<title>` tag**, 50-60 chars, primary keyword front-loaded
- **Meta description**, 140-160 chars, benefit-first with keyword
- **Single H1**, contains primary keyword
- **H2/H3 hierarchy** with secondary keywords
- **Descriptive image filenames** (`hull-creek-sunset-dock.webp`, not `IMG_2847.jpg`)
- **Alt text on every image** with natural keyword inclusion
- **Internal links** to related pages (cottage → activities → area → blog post)
- **JSON-LD schema markup** (VacationRental for home, FAQPage for FAQ, BlogPosting for posts, BreadcrumbList everywhere)
- **OpenGraph + Twitter Card** metadata for social shares
- **Canonical URL**

### Required schema markup

**Home page** — `VacationRental` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "VacationRental",
  "name": "Captain's Cottage",
  "description": "Waterfront cottage with private beach, hot tub, and sauna on Hull Creek in Heathsville, Virginia.",
  "image": ["..."],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Heathsville",
    "addressRegion": "VA",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 37.95,
    "longitude": -76.45
  },
  "amenityFeature": [
    {"@type": "LocationFeatureSpecification", "name": "Private beach", "value": true},
    {"@type": "LocationFeatureSpecification", "name": "Hot tub", "value": true},
    {"@type": "LocationFeatureSpecification", "name": "Sauna", "value": true},
    {"@type": "LocationFeatureSpecification", "name": "Wi-Fi 103 Mbps", "value": true}
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.92,
    "reviewCount": 137
  },
  "numberOfRooms": 3,
  "occupancy": {"@type": "QuantitativeValue", "maxValue": 6}
}
```

**FAQ page** — `FAQPage` schema (huge for AI Overviews and "People Also Ask")
**Blog posts** — `BlogPosting` with `author`, `datePublished`, `image`
**All pages** — `BreadcrumbList`

### Technical SEO checklist
- [ ] `sitemap.xml` auto-generated (`@astrojs/sitemap` integration)
- [ ] `robots.txt` allowing all, pointing to sitemap
- [ ] `rss.xml` for blog
- [ ] All images WebP or AVIF, responsive `srcset`
- [ ] Lazy loading on all below-fold images
- [ ] Lighthouse score: 95+ on all four metrics
- [ ] Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Mobile-first responsive — design at 375px first, then scale up
- [ ] HTTPS only (free via GitHub Pages → Cloudflare later)
- [ ] No render-blocking JS (Astro handles this)

### Off-page SEO actions for Will (post-launch)
1. **Google Business Profile** — list "Captain's Cottage" as a lodging business at the Heathsville address. Verify with postcard.
2. **Bing Places for Business** — mirror of Google Business
3. **TripAdvisor Vacation Rentals** listing
4. **Northern Neck Tourism Council** — pitch them for a local listing/partnership
5. **Visit Virginia** (virginia.org) — apply for partner inclusion
6. **Reedville Fishermen's Museum** — partnership cross-link
7. **Local guest post outreach** — Richmond Magazine, Washingtonian travel section, Chesapeake Bay Magazine
8. **Submit sitemap to Google Search Console + Bing Webmaster Tools** day one

---

## 5. Page-by-page content plan

### `/` — Home
Single-scroll landing. Sections in order:
1. **Hero** — full-bleed cottage exterior with sunset, headline "A waterfront retreat where the *Potomac* meets the *Bay*", booking CTA
2. **Marquee strip** — italicized phrases: "private beach · sauna · hot tub · 4.92 stars · 9 years hosting · superhost"
3. **The Cottage story** — asymmetric two-column with drop cap. The "disconnect from the hustle" narrative pulled from the Airbnb description.
4. **Reviews quote band** — dark navy section, large italic quote rotating between top 3 reviews
5. **Amenities grid** — 9-tile grid, numbered, hover state
6. **Photo gallery** — asymmetric 7-photo grid, all from the Airbnb listing
7. **Location section** — dark navy with custom "compass" graphic, list of nearby towns with drive times
8. **Journal preview** — latest 3 blog posts
9. **Booking CTA** — massive type, "Stay with us. The water is waiting."
10. **Footer**

H1: `Captain's Cottage — Waterfront Rental on Hull Creek, Heathsville VA`
Meta: `A waterfront cottage on Virginia's Northern Neck. Private beach, hot tub, sauna, and the quiet water where the Potomac meets the Chesapeake Bay.`

### `/the-cottage` — Full property page
Deep dive: every room, every amenity, full photo gallery (40+ photos), floor plan, what to expect (tides, jellyfish seasons, off-the-beaten-path note). H1: `The Cottage: 3 Bedrooms, Private Beach, Sauna & Hot Tub on Hull Creek`

### `/amenities` — Complete amenities list
All 80 amenities organized by category (water, kitchen, sleeping, outdoor, accessibility). Good for "vacation rental with [specific amenity]" long-tail traffic.

### `/area/` — Northern Neck Overview
"The Northern Neck is Virginia's quietest secret." Map, history, what makes it different. Internal links to each town page.

### `/area/heathsville` — Heathsville guide
Anchor for the property address. History, what's nearby, where to grocery shop (Reedville), why people come.

### `/area/reedville` — Reedville guide
Fishermen's Museum, restaurants (Crazy Crab, Tommy's), Gelati Celeste ice cream, menhaden fishing history.

### `/area/kilmarnock`, `/area/irvington`, `/area/warsaw` — each a real guide
Don't phone these in. Each 800-1200 words with photos, restaurants, shops, drive time.

### `/activities/` — Things to do
Hub page linking to specific activity pages.

### `/activities/crabbing` — A full crabbing guide
How to use the cottage crab pots, best baits, regulations, when crabs run. This is a *huge* long-tail SEO play — Will already knows this stuff cold.

### `/activities/kayak-fishing` — Hull Creek kayak fishing
Striped bass, when they run, launch points, what gear to bring.

### `/activities/striped-bass`, `/activities/birding` — same treatment

### `/journal/` — Blog index
Filterable by category: Lifestyle, Real Estate, Travel. Reverse-chrono. 12 posts at launch (see content calendar below).

### `/journal/[slug]` — Individual post template
Hero image, eyebrow category tag, H1, byline + date + read time, drop-cap on first para, body, related posts, single CTA at bottom ("Stay with us")

### `/book` — Booking page
Today: redirects to Airbnb listing. Future: integrate Hospitable, Lodgify, or OwnerRez direct booking widget. Build the page now with the future in mind.

### `/faq` — FAQ page with FAQPage schema
20 questions covering: check-in, pets, beach safety, jellyfish, tides, WiFi for remote work, kids amenities, distance from DC/Richmond/Norfolk, cancellation policy, off-season availability, nearest grocery, restaurants nearby.

### `/contact` — Simple form
Name, email, dates, group size, message. Powered by Netlify Forms.

---

## 6. Blog content calendar — 12 launch posts

Mix: 4 lifestyle, 4 travel, 4 real estate. Each post targets specific keywords, contains 800-1500 words, includes 2-4 images with descriptive alt text, internal links to at least 2 other site pages, and one CTA back to booking.

### Lifestyle (warm, narrative, brand-building)
1. **"The Art of the Slow Weekend: How to Actually Disconnect at a Waterfront Cottage"**
   *Target: "how to disconnect on vacation", "digital detox weekend"*
   First-person, Will's voice. The case for screen-free time.

2. **"A Crabber's Morning on Hull Creek"**
   *Target: "crabbing Potomac River", "Virginia crabbing guide"*
   How-to wrapped in narrative. Pulling the crab pots at sunrise.

3. **"Cottage Sauna Culture: Why a Hot Sauna and Cold Creek Belong Together"**
   *Target: "sauna with cold plunge", "Nordic sauna ritual"*
   Health-forward angle. Cardio benefits, recovery, Will's CrossFit background lightly hinted.

4. **"Family Recipes for a Waterfront Kitchen: 5 Easy Meals You Can Make on Vacation"**
   *Target: "vacation rental dinner ideas", "easy lake house meals"*
   Practical. Grocery-list-ready. Photos of food on the screen porch.

### Travel (the SEO workhorses)
5. **"The Complete Guide to Reedville, Virginia"**
   *Target: "things to do in Reedville VA", "Reedville fishermen's museum"*
   The definitive guide. Restaurants, museum, ice cream, marinas, history.

6. **"24 Hours in Irvington: Virginia's Most Charming Riverfront Town"**
   *Target: "Irvington VA travel", "Tides Inn"*
   Day-trip itinerary from the cottage. Tides Inn, restaurants, antique shops.

7. **"Weekend Getaways from Washington DC: Why the Northern Neck Beats the Eastern Shore"**
   *Target: "weekend trips from DC", "alternatives to Eastern Shore Maryland"*
   Comparison piece. Drive time, traffic, cost, vibe. Direct competitive positioning.

8. **"Tide Charts, Jellyfish Seasons, and What to Pack: The Real Northern Neck Travel Guide"**
   *Target: "Northern Neck Virginia travel", "tide chart Heathsville"*
   The practical info no one else publishes. Tide patterns, seasonal jellyfish, mosquito season, best months.

### Real Estate (broadens topical authority, attracts a different but adjacent audience)
9. **"What It Costs to Own a Waterfront Cottage on Virginia's Northern Neck"**
   *Target: "Northern Neck real estate", "Virginia waterfront property"*
   Real numbers. Property taxes, flood insurance, maintenance reality. Will's actual experience.

10. **"Should You Buy or Rent on the Water? A Frank Look at Vacation Property Math"**
    *Target: "vacation home investment", "should I buy a vacation rental"*
    Spreadsheet-honest. ROI of an Airbnb vs. just renting one when you want to go.

11. **"The Northern Neck vs. the Outer Banks: A Real Estate Reality Check"**
    *Target: "Northern Neck vs Outer Banks", "Virginia waterfront real estate"*
    Pricing comparison, market depth, rental demand.

12. **"How We Renovated a 1950s Waterfront Cottage Without Losing Its Soul"**
    *Target: "cottage renovation", "waterfront home renovation"*
    Visual-heavy. Before/after photos. What Will kept, what he changed, what it cost.

### Publishing cadence post-launch
- 1 new post per month minimum (Google rewards consistency)
- Refresh older posts every 6 months with new photos, updated info
- Each post gets shared to: email list (build it), Instagram, Pinterest (huge for travel)

---

## 7. Property data (drop-in)

### Listing facts
- **Name:** Captain's Cottage
- **Address:** Heathsville, Virginia 22473 (Northumberland County) — exact street withheld until booking
- **Location:** Hull Creek, off the Potomac River near where it meets the Chesapeake Bay
- **Coordinates (approx):** 37.95° N, 76.45° W
- **Bedrooms:** 3 (2 queen + sleeping porch with full + twin rollout)
- **Beds:** 4
- **Bathrooms:** 1.5
- **Max guests:** 6
- **Type:** Entire cottage
- **Check-in / out:** 4 PM / 11 AM
- **Self check-in:** smartlock
- **Wi-Fi:** 103 Mbps

### Standout amenities (lead with these)
- Private beach (brackish, mostly fresh, shallow — great for kids)
- Hot tub
- Sauna with water view
- Two big screened-in porches
- Dock for fishing and crabbing (crab pots provided)
- West-facing for sunset views
- Dedicated workspace in master bedroom
- Kid amenities: high chair, pack-n-play, removable guard rail
- Yoga mats and kettlebells available

### Ratings
- 4.92 overall (137 reviews)
- 5.0 accuracy, check-in, communication
- 4.9 cleanliness, location
- 4.8 value
- 93% five-star reviews
- Top 5% of homes
- Superhost, 9 years

### Hero photos (URLs from Airbnb CDN — re-download for self-hosting)
```
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/c91dbcba-3928-4b03-a5de-c112781f77fe.jpeg
https://a0.muscache.com/im/pictures/hosting/Hosting-39025485/original/20345ee0-cb63-4b1b-8405-335288f1af9b.jpeg
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/268417a9-5bd4-435c-abdc-08edaab35b25.jpeg
https://a0.muscache.com/im/pictures/d613aa93-9b34-474c-b773-04727897aa22.jpg
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/5029f455-973b-4176-855e-609e59ddb611.jpeg
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/e7a3ea5d-284f-4ac7-b025-1cd7d0861b49.jpeg
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/85e1ccd4-dc8f-44e3-99a7-b2caec54aafa.jpeg
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/f890d8c6-3766-4b7c-aedd-56f7d80d6e4e.jpeg
https://a0.muscache.com/im/pictures/miso/Hosting-39025485/original/bc8cbfc0-a4ab-4339-a9c4-2f14ab0e49ff.jpeg
```
**Action:** Download these, rename to descriptive slugs (`captains-cottage-sunset-dock.jpg`, etc.), run through Squoosh or `sharp` to generate WebP at multiple sizes, save in `/public/images/`.

### Distances (for location section)
- Reedville: 15 min
- Warsaw: 45 min
- Kilmarnock: 30 min
- Irvington: 45 min
- Richmond, VA: 1 hr 50 min
- Washington, DC: 2 hr 45 min
- Norfolk/Virginia Beach: 2 hr

---

## 8. Domain strategy

Will is starting on GitHub Pages (free, fine). Buy domain later. Ranked recommendations:

### Best domain candidates (check availability at Namecheap or Porkbun)

| Domain | SEO value | Brand value | Notes |
|---|---|---|---|
| `captainscottageva.com` | High | High | Matches Airbnb URL, includes state, brandable |
| `captainscottage.com` | Highest | High | Cleanest, no state qualifier, premium if available |
| `hullcreekcottage.com` | High | Strong | Includes the *exact* hyper-local keyword |
| `captainscottagevirginia.com` | Medium | Medium | Long but very explicit |
| `staycaptainscottage.com` | Medium | Strong | Action-oriented prefix |
| `captainscottagerental.com` | Lower | Lower | Keyword-stuffed, feels spammy |

**Recommendation:** Try `captainscottage.com` first (premium but worth $30-60/yr if available). Fallback: `captainscottageva.com`. Buy at Porkbun or Namecheap, never GoDaddy (upsell hell, higher renewals).

### GitHub Pages setup
1. Create repo `captainscottage` (public)
2. Build site, push `main` branch
3. Add GitHub Actions workflow to build Astro and deploy to `gh-pages` branch
4. Settings → Pages → Source: `gh-pages` branch
5. Initial URL: `[username].github.io/captainscottage`
6. When domain is purchased: Settings → Pages → Custom domain → add domain, enable HTTPS, set DNS at registrar:
   - `A` records pointing to GitHub's IPs (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)
   - `CNAME` for `www` → `[username].github.io`

### Migration to Cloudflare Pages (later, optional)
Better edge performance, free, slightly faster than GH Pages. Same git workflow. Recommend after the site is established and traffic starts coming in.

---

## 9. Kickoff prompt for Claude Code

Paste this exact prompt into a fresh Claude Code session at the project folder:

````
I'm building a marketing/landing site with integrated blog for my waterfront vacation rental, Captain's Cottage in Heathsville, VA (airbnb.com/h/captainscottageva).

The full brief lives at CAPTAINS_COTTAGE_BRIEF.md in this folder — read it completely before starting. It includes:
- Strategic context and SEO thesis
- Tech stack (Astro + MDX + Tailwind, GitHub Pages hosting)
- Folder structure
- Complete design system (colors, typography, layout principles)
- SEO keyword targets and schema markup requirements
- Page-by-page content plan
- 12-post blog content calendar
- All property data and photo URLs

Start with Phase 1:
1. Initialize the Astro project with the integrations listed in the brief
2. Set up Tailwind config with the color tokens
3. Install self-hosted Fraunces and Inter Tight fonts
4. Build the BaseLayout with all SEO meta tags, schema markup, and analytics placeholder
5. Build the home page (/) with all 10 sections from the brief
6. Download the 9 hero photos from the Airbnb CDN, optimize to WebP, save to /public/images/
7. Set up the GitHub Actions workflow for GH Pages deployment

Aesthetic direction is critical: editorial-coastal, NOT generic beachy. References: Aman Resorts, Inness NY, Plain Magazine. Warm bone background, deep navy, sun-bleached rust accent. Fraunces display + Inter Tight body. Asymmetric layouts. Drop caps. Subtle grain overlay. Restraint is the design.

Show me the home page rendering locally before moving to Phase 2 (blog system + journal posts).
````

---

## 10. Phasing plan

### Phase 1 — Foundation + Home (Week 1)
- Astro setup, design system, base layout, schema
- Home page complete with all 10 sections
- GH Actions deployment working
- **Deliverable:** Beautiful home page live at `[username].github.io/captainscottage`

### Phase 2 — Blog system + 4 launch posts (Week 2)
- MDX content collections
- Journal index page
- Post template with related posts
- First 4 posts (1 from each category + lifestyle hero post)
- RSS feed
- **Deliverable:** Working blog with real content

### Phase 3 — Property + amenities + photo gallery (Week 3)
- `/the-cottage` deep-dive page
- `/amenities` complete list
- Full photo gallery component (40+ photos)
- FAQ page with FAQPage schema
- **Deliverable:** All property content live

### Phase 4 — Location & activity guides (Week 4)
- `/area/` hub + 5 town pages
- `/activities/` hub + 4 activity pages
- Internal linking pass
- **Deliverable:** Full SEO surface area deployed

### Phase 5 — Polish & launch (Week 5)
- Remaining 8 blog posts
- Contact form (Netlify Forms)
- Email capture
- Analytics installed
- Lighthouse score audit (target 95+)
- Submit to Google Search Console + Bing Webmaster Tools
- Google Business Profile setup
- **Deliverable:** Ready to drive traffic

### Phase 6 — Direct booking (when ready, post-launch)
- Integrate Hospitable, Lodgify, or OwnerRez
- Replace Airbnb redirect on /book with real booking widget
- Add stripe payment processing
- **Deliverable:** Commission-free direct bookings

---

## 11. Success metrics (to track 90 days post-launch)

- Organic traffic: target 500+ visitors/month by month 3
- Top 10 ranking for at least 3 Tier 1 keywords
- Direct booking inquiries: 2+ per month by month 3
- Email list signups: 25+ by month 3
- Average time on site: 2+ minutes
- Bounce rate: < 60%

Track with Plausible (preferred) or GA4. Set up Google Search Console day one.

---

## 12. What NOT to build (avoid scope creep)

- Live booking calendar (use Airbnb redirect until Phase 6)
- User accounts or login system
- E-commerce / merchandise store
- Multi-property support (premature — only add if Will adds a second property)
- Live chat
- Animations beyond subtle scroll reveals
- Carousels (kills accessibility and SEO)
- Hero video (slows page, hurts Core Web Vitals)
- Cookie banner (no tracking that requires consent yet)

---

*End of brief. Save as CAPTAINS_COTTAGE_BRIEF.md in the project root. Paste the kickoff prompt (Section 9) into Claude Code to start.*
