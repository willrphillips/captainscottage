# Post-launch SEO / AEO / GEO playbook

> **Live progress (updated 2026-05-30):**
> - ✅ Domain live: https://captainscottageva.com (HTTPS, cert, www→apex)
> - ✅ Analytics: Cloudflare Web Analytics (free) — replaced Plausible
> - ✅ Google Search Console: verified, sitemap submitted, home indexed,
>   VacationRental schema all-green / rich-result eligible
> - ✅ Auto-publish cron live (5 posts ship weekly 06-03 → 07-01;
>   5 more drafted for 07-08 → 08-05)
> - ⬜ Bing Webmaster + IndexNow key + IndexNow Action (next)
> - ⬜ PageSpeed Insights spot check
> - ⬜ Airbnb listing description → add the new URL (top backlink)
> - ⬜ Per-town deep guides, guest-reply bootstrap run


A staged proliferation plan for **Captain's Cottage** once the production
domain is live. Operates inside the project's locked constraints:

- **No social media** (no Facebook, Instagram, X, TikTok, Threads, etc.)
- **No email collection or newsletter** on-site
- **No direct booking** — every CTA routes to the Airbnb listing
- **No Google Business Profile / Bing Places** (no walk-in location)
- **No on-site reviews UI** — review proof comes through schema + Airbnb
- All contact runs through the Airbnb listing message thread

That means every channel below is a **discoverability channel**, not a
direct-conversion channel. The funnel is: search / AI surface → site →
Airbnb listing → booking.

---

## Phase 0 — Day-of-launch (Will's hands, ~30 min)

Owner actions that can only happen once the production domain resolves.

1. **DNS swap on Namecheap** → CNAME (or A records) → `willrphillips.github.io`.
2. Add a `CNAME` file at `public/CNAME` containing the bare apex domain.
3. Update `SITE.origin` in [src/lib/site.ts](src/lib/site.ts) to the new
   origin so canonical / OG / sitemap URLs reflect it.
4. Update the `Sitemap:` line in [public/robots.txt](public/robots.txt) to
   the new domain.
5. Push to `main`. Wait for the GitHub Pages deploy. Verify HTTPS resolves.
6. Update the Airbnb listing description with the new URL (this is the
   single most valuable backlink the site will ever get — listing pages on
   Airbnb are crawled and the outbound link counts).

---

## Phase 1 — Week 0 (search engine bootstrap)

Get the site into the index pipelines.

1. **Google Search Console**
   - Add the property (use the HTML-file verification — drop the
     verification file at `public/google<token>.html`).
   - Submit `https://<domain>/sitemap-index.xml`.
   - Request indexing for these key URLs:
     - `/` (home)
     - `/the-cottage`
     - `/area/`
     - `/activities/`
     - `/getaway-guide`
     - `/photos`
     - `/amenities`
     - `/faq`
     - `/what-to-bring`
     - `/journal/` (index)
2. **Bing Webmaster Tools**
   - Add property; sitemap submission.
   - **Enable IndexNow** (Bing → Settings → IndexNow). Generate a key,
     drop it at `public/<key>.txt`, then we can scaffold a GitHub Action
     that pings IndexNow on every push to `main` (deferred — see "scaffold
     not yet live" below).
3. **Rich Results Test** every page-type schema once:
   - `VacationRental` → `/`
   - `FAQPage` → `/faq`
   - `BlogPosting` + `Person` → `/journal/<any-approved-post>`
   - `BreadcrumbList` → any non-home page
4. **PageSpeed Insights** on `/`, `/the-cottage`, `/journal/<first-post>`.
   Target Lighthouse ≥ 95 across all four categories — the brief is firm
   on this and Astro + the design system should clear it. If not, fix
   before publishing more.

---

## Phase 2 — Week 1 (AI surfaces)

These are the AEO / GEO surfaces the
[robots.txt](public/robots.txt) explicitly invites.

- **No direct submission** exists for ChatGPT, Claude, or Perplexity —
  ingestion is automatic for any site their crawlers can reach. The robots
  rules are the entire opt-in. Verify after a week by:
  - Asking ChatGPT (`gpt-4` with browsing) "What is Captain's Cottage on
    Hull Creek?" — expect a quote from the site.
  - Asking Perplexity "Where to stay on Virginia's Northern Neck near Hull
    Creek?" — expect a citation.
  - Asking Claude (with web tools) "Tell me about Captain's Cottage VA."
- **Google AI Overviews** — coverage tracks Google's regular index, so
  this lights up as GSC indexes pages.
- **If a query returns a stale or wrong description**, the fix is on-site
  (rewrite the meta description, tighten the H1, beef the FAQPage schema).
  Do not chase the model.

---

## Phase 3 — Month 1 (content cadence + first proof of life)

1. **Approve the 5 in-review journal posts** (currently `draft:true`):
   - Stagger live dates per `content/content-calendar.json` so a new post
     ships each Wednesday. The editor agent already enforces a Wednesday
     publishDate.
   - Each post's `BlogPosting` + author `Person` schema fires the
     E-E-A-T signal needed for travel content.
2. **Begin biweekly drafting routine** — the next two posts in
   [content/content-calendar.json](content/content-calendar.json) should
   be assigned to the researcher → writer chain. Owner approves at the
   gate.
3. **Crawl-depth check**: every long-form page links to at least two
   internal pages. Audit once. Fix orphans (e.g.
   [/what-to-bring](src/pages/what-to-bring.astro) currently has no nav
   link — needs placement decision).
4. **First quote check in AI surfaces**: run the prompts from Phase 2.
   Save what's quoted in `content/aeo-citations.md` (new file when
   needed). This tells us which pages are landing in AI answers and which
   need rewrites.

---

## Phase 4 — Month 3 (cornerstones + backlinks)

1. **Cornerstone audit**: `/the-cottage`, `/area/`, `/activities/`,
   `/getaway-guide` are the four cornerstones. After 3 months of indexed
   life, look at which queries are pulling traffic in GSC and rewrite the
   weakest cornerstone's intro to match real-search intent. Don't add
   pages — improve the four.
2. **Backlink cadence** (Will-driven, no automation):
   - Submit the site to **2-3 regional tourism aggregators** per month
     (e.g. Northern Neck Tourism Commission, Visit Virginia, Heathsville
     Chamber if it has a directory). Track in
     `content/backlink-log.md`.
   - **Guest posts** in Virginia / Mid-Atlantic travel blogs are the
     highest-leverage backlinks. The journal posts already model the
     editorial voice — repurpose one as a pitch.
   - **Avoid paid link networks**, comment-spam, and PBNs. Travel
     verticals get manually reviewed and a single bad backlink can
     suppress all the good signals.
3. **No social** stays no — if a partner directory requires a social
   profile to link, decline the listing. The constraint is firm.

---

## Phase 5 — Month 6 (compounding)

1. **GSC query-mining pass**: pull the top 50 queries, identify the ones
   where Captain's Cottage ranks 5-15 (the "almost there" band). For
   each, decide: rewrite an existing page (preferred), or add it to the
   content-calendar as a new journal post (only if a real first-hand
   story exists — the voice rule still applies).
2. **Schema enrichment**: by month 6 there should be enough live posts to
   justify expanding the `VacationRental` schema on `/` to include
   `aggregateRating` (pulled from Airbnb reviews, with `reviewCount`
   updated quarterly).
3. **Quarterly rebuild of [POST_LAUNCH_SEO.md](POST_LAUNCH_SEO.md)** —
   this document is a plan, not a record. Update what worked / didn't
   each quarter so the next quarter's actions are informed.

---

## Scaffolded but not yet live

These are wired into the codebase but require an owner action to
activate. None block launch.

- **IndexNow** — generate a key in Bing Webmaster Tools, drop it at
  `public/<key>.txt`. After that we can add a one-step GitHub Action that
  pings the IndexNow endpoint on every push to `main`.
- **`<link rel="me">` to a Mastodon / Bluesky profile** — deliberately
  omitted (no social).
- **`aggregateRating` on `VacationRental` schema** — held until there's a
  defensible reviewCount drawn from a stable source.

---

## What we are deliberately not doing

Re-stating the constraints, because every SEO / AEO consultant on the
internet will recommend at least one of these:

| Tactic                              | Why we skip it                                      |
| ----------------------------------- | --------------------------------------------------- |
| Google Business Profile             | No walk-in location; would misrepresent property    |
| Bing Places                         | Same                                                |
| Instagram / Facebook / X            | No social — owner constraint                        |
| Email newsletter capture            | No email channel — owner constraint                 |
| Live chat widget                    | Brief explicitly forbids                            |
| Paid review platforms (Yelp etc.)   | Off-brand and not the booking channel               |
| Booking widgets / OTA mirrors       | Phase 6 only; Airbnb is the channel until then      |
| Cookie banner                       | No consent-requiring tracking is in scope           |
| Carousel hero / autoplay video      | Brief explicitly forbids                            |

If a future SEO tool or partner pitches one of these as "essential," the
answer is no by default. Re-open only with owner sign-off.

---

## Owning the work

- Owner (Will): GSC verification, Bing verification, DNS, domain swap,
  Namecheap → GitHub Pages CNAME, journal-post approvals, backlink
  outreach.
- Agent system: content production (researcher → writer → SEO-editor →
  human gate), drafts only — never publishes without owner approval.
- This document: Will edits as channels prove (or disprove) themselves.
  It is not a one-time plan.
