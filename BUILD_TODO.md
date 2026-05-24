# Captain's Cottage — Build Checklist (Status Tracker)

Living doc. Each item from the SEO/AEO/GEO build prompt is annotated below.
Content strategy + voice deliberately omitted (already built and recorded in
`SCOPE_OF_WORK.md`, `~/.claude/HANDBOOK.md`, and `content/voice-feedback-log.md`).

Legend:
- ✅ Done
- ⚠️ Partial — works but needs verification or a small follow-up
- ⏸ Deferred — owner-action or out of scope this round
- 🚫 Won't do — explicitly declined by Will (or by the brief)
- ❓ Awaiting Will input

---

## Technical Setup

- ✅ HTTPS enabled with active SSL cert (GH Pages cert; custom domain cert pending DNS)
- ✅ Fully mobile responsive
- ⏸ Page load under 3s (verify with PageSpeed Insights after custom domain swap)
- ✅ Images compressed (sharp pipeline; ~500–800 KB for hero photos)
- ⏸ WebP format used where practical (currently JPEG; swap to WebP via `<Image>` once stable assets land)
- ✅ Lazy loading on below-fold images (`loading="lazy"` set)
- ✅ Clean URL structure (no query strings; trailing slash normalized)
- ⏸ Custom 404 page (`src/pages/404.astro` exists — verify content)
- ⏸ Broken-link audit (run after each batch)
- ✅ Robots.txt configured (`public/robots.txt`, allows all, points at sitemap)
- ✅ XML sitemap generated (`@astrojs/sitemap`)
- ✅ Favicon installed (white anchor on navy tile, `public/favicon.svg`)
- ✅ Canonical URLs set on every page (`<link rel="canonical">` via `BaseLayout`)
- ✅ Open Graph tags added (`og:title`, `og:description`, `og:url`, `og:image`)
- ⚠️ Social preview image (`/images/og-default.jpg` placeholder — replace with real branded image)
- ⏸ Core Web Vitals (run after domain swap)

## Search Engine Registration

- ⏸ Google Search Console verified — **owner action**: add property at search.google.com/search-console after custom domain resolves
- ⏸ Bing Webmaster Tools verified — **owner action**: bing.com/webmasters
- ⏸ Sitemap submitted to Google (after GSC verification)
- ⏸ Sitemap submitted to Bing (after BWT verification)
- ⏸ Google Analytics 4 installed (currently using Plausible; either keep Plausible OR add GA4 if specifically needed)
- ⏸ Outbound clicks to Airbnb tracked in GA4 (configurable in Plausible too; Plausible "Outbound links" goal is one click)
- 🚫 Google Business Profile (per brief)
- 🚫 Bing Places (per brief)
- 🚫 Apple Business Connect (per brief)

## Privacy / Public Address Strategy

- ✅ Exact street address NOT published (no `streetAddress` in schema)
- ✅ General location: Hull Creek, Heathsville, Northern Neck, Virginia
- ✅ Nearby landmarks/towns referenced without exposing exact house location
- ✅ No embedded map at exact property (no `<iframe>` map; only schema `geo` with rounded coords ~37.95° N, 76.45° W — town-level only)
- ⚠️ Consider whether `geo` lat/lng in `SchemaVacationRental.astro` is too specific — currently 2-decimal-precision ~1.1 km grid; OK for area context, removable if owner prefers
- ✅ Contact page (FAQ + Footer) routes contact through Airbnb only; no public email/phone

## On-Page Basics (Every Page)

- ✅ Unique `<title>` < 60 chars per page
- ✅ Meta description 140–160 chars per page
- ✅ One `<h1>` per page
- ✅ Logical H2/H3 hierarchy
- ✅ Primary keyword in title, H1, URL, first 100 words
- ✅ Alt text on every meaningful image
- ✅ Descriptive image filenames (e.g., `cedar-sauna-creek-sunset.jpg`, no `IMG_xxxx`)
- ✅ Internal links between related pages (≥2 per blog post enforced by SEO-editor agent)
- ⚠️ External links to authoritative local sources (some present in guides; sweep `/area`, `/activities`, `/journal` posts to add 1–2 more where natural)
- ✅ No keyword stuffing (voice rules forbid it)
- ⏸ Visible "updated" date on evergreen guides (add `updatedAt` display to `/area`, `/activities`, `/what-to-bring`, blog posts)

## Schema Markup (JSON-LD)

- ✅ `VacationRental` schema on home (`SchemaVacationRental.astro`)
- ✅ `aggregateRating` only when rating > 4.80 (matches visual SocialProof rule)
- ✅ `FAQPage` schema on `/faq`
- ✅ `BlogPosting` schema on every post (`SchemaBlogPosting.astro`)
- ✅ `BreadcrumbList` on inner pages (auto via `BaseLayout` breadcrumbs prop)
- ⏸ `ImageObject` schema where useful (low priority)
- ⏸ Site-wide `WebSite`/`Organization` schema (add to `BaseLayout`)
- ⏸ Validate all schema via Google Rich Results Test after launch

## Core Pages Required

- ✅ Homepage with hook + Airbnb CTA
- ⏸ "About the property" — `/the-cottage` is still a `ComingSoon` stub
- ✅ Amenities (`/amenities` — conversational page from STANDOUT_AMENITIES + house numbers)
- ⚠️ Photos / gallery page — gallery on home; no standalone `/photos` page yet (could repurpose `/the-cottage`)
- ✅ The area / Northern Neck overview (`/area`)
- ✅ Things to do (`/activities`)
- ⏸ Combined fishing/crabbing/kayaking/boating guide (currently spread across `/activities` and journal posts — fold together when posts approve)
- ⏸ Restaurants nearby (in `/area` + driven by `src/lib/guidebook.ts`; standalone page optional)
- ⏸ Wineries/breweries page (Rivah Vineyards + Callao Brewing covered in `/area`)
- ⏸ History / museums / antiques / attractions page (Fishermen's Museum + Kilmarnock Antique Gallery in `/area`)
- ✅ What to bring (`/what-to-bring`)
- ✅ FAQ (`/faq` — 10 conversational Q&A with pet-allergy note)
- ✅ Blog index (`/journal`)
- ✅ Booking page (`/book` redirects to Airbnb listing)

## Combined Regional SEO Page

- ⏸ Single "Northern Neck Getaway Guide" page (currently the function is split across `/area` and `/activities`; consolidate when content load justifies it)
- ⏸ Section: Getting here from Richmond
- ⏸ Section: Getting here from Washington, DC
- ⏸ Section: Getting here from Norfolk / Virginia Beach
- ⚠️ Section: Nearby towns worth visiting (covered conversationally in `/area`)
- ⚠️ Section: Best activities near Hull Creek (covered in `/activities`)
- ⏸ Section: Family-friendly Northern Neck ideas
- ⏸ Section: Quiet romantic getaway ideas
- ⏸ Section: Seasonal notes (some in `/what-to-bring`)
- ⚠️ Section: Where Captain's Cottage fits into the trip (implicit; could be explicit)
- ⏸ Jump links / table of contents (when consolidated)
- ✅ Avoid thin per-town pages (confirmed; combined approach in `/area`)

## Town Coverage Strategy

- ✅ Heathsville, Reedville, Kilmarnock, Irvington, Tappahannock mentioned where relevant in `/area` and guidebook
- ⏸ White Stone, Wicomico Church, Burgess, Lottsburg — not yet mentioned (add if/when content warrants)
- ✅ Town sections inside broader guide pages (in `/area`)
- ✅ Drive times included (DRIVE_TIMES in `site.ts`, shown on `/area`)
- ✅ No thin town pages
- ✅ Only standalone town pages if substantial content

## Content Optimization

- ✅ One primary keyword per page
- ✅ Related keywords included naturally
- ✅ Cornerstone pages substantial (home, /area, /activities, /amenities, /what-to-bring, /faq)
- ✅ Original/local observations throughout (host guidebook is source of record)
- ✅ Practical details: distances, drive times, seasons, kid-friendliness
- ✅ No generic AI travel filler (voice model enforces)
- ✅ Honest local notes (jellyfish window, tides, sand shift) — positioned positively per voice rules
- ✅ Property stated as not pet friendly in `/faq` and via voice
- ✅ No pet-friendly keyword pages
- ✅ Family-friendly tone, not babyish
- ✅ Polished but not over-luxury

## AEO / GEO Optimization

- ⚠️ Questions as H2 where natural (mostly on `/faq`; consider on guides too)
- ✅ Direct answer first sentence under FAQ H2s
- ⏸ Short summary near top of major guide pages
- ⏸ Quick-facts box on major pages (added to `/amenities` "House numbers"; expand to others)
- ✅ Bullet lists and tables where useful
- ✅ FAQ section (one full page)
- ⏸ Author bio on blog posts (E-E-A-T) — add `author` byline already present from frontmatter, expand with `Person` schema
- ✅ Original photography prioritized (hot tub + sauna real, no stock)
- ✅ Specific local facts (names, distances)
- ✅ Primary sources cited where useful (mrc.virginia.gov, NOAA, VIMS in research briefs)
- ✅ Quotable phrasing (voice model targets it)

## Internal Linking System

- ✅ Homepage links to core hub pages (Nav + Footer)
- ✅ Hub pages link to supporting content
- ✅ Blog posts link back to hubs (≥2 internal links enforced)
- ✅ Each blog post has 2–5 internal links
- ✅ Each guide includes a soft Airbnb CTA
- ✅ FAQ links to deeper pages (`/amenities`, `/area`, `/what-to-bring`, `/journal`)
- ✅ Related-posts module on blog (`BlogPost.astro` shows related by category)
- ✅ Breadcrumbs enabled
- ✅ Descriptive anchor text

## Booking Funnel

- ✅ "Stay with us" / "Book on Airbnb" buttons throughout
- ✅ Soft CTA phrasing
- ⏸ Airbnb links open in new tab (some do, audit footer/CTA links)
- ⏸ Airbnb outbound clicks tracked in GA4 (Plausible if added)
- 🚫 Direct booking (per brief)
- 🚫 Email capture (per brief)
- ⏸ Future idea: email list
- ⏸ Future idea: downloadable packing checklist / itinerary PDF

## Blog Infrastructure

- ✅ Blog index page (`/journal`)
- ✅ RSS feed (`/rss.xml`)
- ✅ Category structure (Lifestyle | Travel | Real Estate)
- ⏸ Tag structure (not implemented; categories cover most needs)
- ✅ Related-posts module
- ⏸ Author bio block on posts (byline shown; bio block expandable)
- ✅ No comment system
- ⏸ Per-post audience tags (family / romantic / outdoor / food / seasonal / remote work) — add to frontmatter when calendar matures

## Backlink / Directory Plan (owner actions)

All ⏸ — outreach work outside the codebase:
- ⏸ Virginia.org / Virginia Tourism Corporation
- ⏸ Northern Neck Tourism Commission
- ⏸ Northumberland County Chamber of Commerce
- ⏸ Lancaster by the Bay Chamber
- ⏸ Town of Kilmarnock business directory
- ⏸ Northern Neck National Heritage Area
- ⏸ Virginia Green Travel
- ⏸ Local Scoop Vacay Rental Directory
- ⏸ Marina / fishing guide / kayak / winery / brewery partner pages

## Security and Maintenance

- ✅ Git history is the backup (no CMS to back up)
- ✅ No CMS/plugins to auto-update (static Astro site)
- 🚫 Spam protection (no forms collecting input on public side)
- ⏸ Privacy policy page (lightweight one needed if GA4/Plausible kept)
- ⏸ Cookie consent (only if required — Plausible is cookieless, so probably not needed)
- ⏸ Quarterly content refresh schedule
- ⏸ Annual evergreen-guide review

## Pre-Launch Verification

- ⏸ Search Console: no critical errors (after GSC setup)
- ⏸ Core Web Vitals passing (verify after domain swap)
- ⏸ Schema validates without errors (run Rich Results Test)
- ⏸ All internal links functional (audit)
- ⏸ All external links functional (audit)
- ⏸ Airbnb buttons tested
- ⏸ GA4/Plausible outbound click tracking tested
- ⏸ Sitemap submitted
- ⏸ Robots.txt tested
- ⏸ Mobile layout checked on multiple sizes
- ⏸ Titles / meta descriptions reviewed
- ⏸ All pages indexed (`site:` search after GSC)

## Custom Domain (Namecheap → GitHub Pages)

- ❓ Domain name confirmed by Will (?)
- ⏸ Add `public/CNAME` file containing the apex domain
- ⏸ GitHub repo Settings → Pages → set Custom Domain
- ⏸ Namecheap DNS: A records to GH Pages IPs + CNAME for `www`
- ⏸ Wait for DNS propagation
- ⏸ GitHub provisions Let's Encrypt cert
- ⏸ "Enforce HTTPS" toggle in GH Settings
- ⏸ `astro.config.mjs`: update `SITE` to `https://<domain>` and clear `BASE` to `""`
- ⏸ Re-test canonicals, sitemap, OG URLs

## Immediate Next Actions (when work resumes)

1. **Custom domain swap** (highest impact — see Custom Domain section).
2. **Approve / publish journal posts** (5 are `in-review`; nothing live until Will batch-approves).
3. **Search Console + sitemap submission** (after domain).
4. **`/the-cottage` page** (still a stub — write a real long-form tour page).
5. **Replace `og-default.jpg`** with a real branded social image.
6. **`/photos` standalone page** (or fold into `/the-cottage`).
7. **Updated-date display** on evergreen guides.
8. **Per-post audience tags** for finer journal sorting.
