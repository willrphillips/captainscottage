# Scope of Work — Captain's Cottage

**Living document.** Last updated: 2026-06-11. Owner: Will Phillips.

**Status:** This SOW is committed on branch `docs/scope-of-work` and open as PR #2 (doc-only, awaiting merge). No workstream code started yet. Resume point: **Workstream A — blog system**.

This tracks the marketing site **and** the AI content-agent pipeline layered on top of it.
`captains_cottage_brief.md` remains the product/SEO source of truth; `CLAUDE.md` is the build-rules summary. This file is the project tracker and the spec for the content-automation workstream, which did not exist in the original brief.

---

## 1. Overall completion

**~93% built — and LIVE at https://captainscottageva.com (launched 2026-05-26).**

Reasoning: the site is shipped on its production apex domain with 10 journal posts (5 live, 5 auto-publishing weekly through 08-05), a full AI content-agent pipeline proven end-to-end (two batches), a working guest-reply system on GitHub Actions, email capture live (Buttondown), journal→newsletter automation built (pending API key secret), professional photo set deployed (101-frame 2026 shoot), and full post-launch SEO (GSC+schema green, IndexNow, `/llms.txt` for GEO, Cloudflare Analytics). Remaining ~7% = newsletter flow + Telegram fix, batch-2 approvals, backlink outreach, and the deferred brief Phases (per-town deep guides, direct booking).

| Workstream | Weight | Done | Contribution |
|---|---:|---:|---:|
| Phase 1 — Foundation + Home (LIVE) | 22% | 100% | 22.0% |
| Phase 2 — Blog system + 10 posts (LIVE/scheduled) | 14% | 100% | 14.0% |
| AI content-agent pipeline | 16% | 100% | 16.0% |
| Review / approval / scheduled publish | 8% | 100% | 8.0% |
| Phase 3 — Property + amenities pages | 12% | ~90% | 10.8% |
| Phase 4 — Area + activity guides | 10% | ~80% | 8.0% |
| Phase 5 — Polish + launch (domain, analytics, GSC, Bing, IndexNow, perf) | 10% | ~95% | 9.5% |
| Phase 6 — Direct booking (deferred per brief) | 8% | 0% | 0.0% |
| **Total** | **100%** | | **~90% (live)** |

Notes: Pipeline 100% — both batches drafted, SEO-looped, gated. Review/publish 100% — inline ReviewPanel (artifact-style: select text → Suggest/Comment/Rewrite chip → structured `edits[]` → writer applies + emits rewrite manifest), `approvedAt` queue-filter, daily auto-publish cron (`.github/workflows/auto-publish.yml`). The earlier Decap/Sveltia `/admin` CMS was superseded by the in-page ReviewPanel — Will reviews drafts directly on the dev-preview page; no separate CMS needed. Phase 3 ~70% — `/amenities`, `/faq`, `/the-cottage`, `/photos` real; `/the-cottage` flagged for a room-by-room accuracy pass against the floorplan PDF (queued). Phase 5 ~70% — custom domain live, Cloudflare Web Analytics wired, GSC verified + sitemap + schema all-green; Bing/IndexNow + Airbnb backlink still pending. The headline number is now genuinely "live," not "on branch."

---

## 2. Decisions locked (2026-05-15)

| Decision | Choice |
|---|---|
| **Owning entity** | **Buffalo Rentals LLC** — Captain's Cottage is owned and operated under Buffalo Rentals LLC (corrected 2026-06-02; supersedes the earlier "Good Old Boys LLC", which was wrong and has been purged repo-wide). `PROPERTY.owner` in `src/lib/site.ts` is the single source — footer copyright + all schema (Organization, VacationRental brand, BlogPosting publisher) read from it. |
| Automation level | **Hybrid** — agents auto-draft on a schedule; nothing publishes without approval. |
| Review surface | **Git-based CMS at `/admin`** (Decap or Sveltia), scoped to the blog (`src/content/blog/`). Open from any browser/phone, GitHub-account login, editorial draft→review→publish workflow, commits to the repo. Supersedes the earlier "GitHub PR + preview" choice (owner decision, 2026-05-15). |
| Scheduled publish mechanism | Each post carries a `publishedAt` date and stays draft until then; a **weekly GitHub Actions cron** rebuilds the site so date-due posts go live (static sites don't self-release without a rebuild trigger). Batch-approve N posts, each releases on its own date (e.g. successive Wednesdays). |
| Approval gate | **Always gated.** Will can **bulk-approve in batches**, then posts **auto-publish on an agreed date**. |
| Build order | **Blog system first**, then agent pipeline. |
| Categories | Locked enum: `Lifestyle | Travel | Real Estate`. Health/amenity/culture angles map into Lifestyle/Travel. No schema change. |
| Cadence | ≥1 post/month (brief). 12-post launch calendar already defined in brief §6. |

---

## 3. Workstream A — Blog system (Phase 2)

Required before any agent output can render. Locked next phase per `CLAUDE.md`.

**Already built:** `src/content/config.ts` (typed `blog` collection, `draft` flag), `src/pages/rss.xml.js` (tolerates empty collection), `BlogCard.astro`, `JournalPreview.astro` (home page).

**To build:**
- [ ] `src/layouts/BlogPost.astro` — wraps `BaseLayout`; hero, eyebrow category, H1, byline + date + read time, drop-cap first para, body, related posts, single "Stay with us" CTA.
- [ ] `src/pages/journal/[...slug].astro` — dynamic post page; `BlogPosting` + `BreadcrumbList` JSON-LD.
- [ ] `src/pages/journal/index.astro` — replace `ComingSoon` stub with reverse-chrono list filterable by category; uses `BlogCard`.
- [ ] Related-posts logic (same category, nearest date).
- [ ] One real sample post end-to-end to validate schema, layout, SEO checklist, build (`astro check`).
- [ ] Confirm sitemap + RSS pick up posts; `draft:true` excluded from both.

**Done when:** a `draft:false` post renders at `/journal/<slug>`, passes the `CLAUDE.md` SEO checklist, builds clean, and shows in the journal index, RSS, and sitemap.

---

## 4. Workstream B — AI content-agent pipeline (new)

Claude Code subagents in `.claude/agents/`. Pipeline: **Editor → Researcher → Writer → SEO editor → human review.**

- [ ] **Editor agent** — owns `content/content-calendar.json`. Selects next slot from the brief's 12-post calendar + amenity-health/Northern-Neck-culture angles. Assigns slug, category, target keywords, publish date.
- [ ] **Researcher agent** — gathers verifiable facts (tide/jellyfish data, sauna/cold-plunge health literature, Reedville/Irvington specifics, property facts from brief §7). Outputs a per-article research brief. No invented stats.
- [ ] **Writer agent** — drafts `src/content/blog/<slug>.mdx`, `draft: true`, 800–1500 words, brief voice ("editorial-coastal," Will's first person where specified), ≥2 internal links, 1 booking CTA.
- [ ] **SEO editor agent** — validates against `CLAUDE.md` checklist: title 50–60 chars, meta 140–160, single keyworded H1, schema, internal links, alt text, word count. Returns pass/fail + concrete fixes; loops back to Writer until pass.
- [ ] Agent runtime — drafting chain runs as a Claude Code **routine** (`/schedule`); a separate **weekly GitHub Actions cron** rebuilds the site to release date-due posts. Static site cannot self-run; the orchestration brain lives outside it.
- [ ] Orchestration command/routine that runs the full chain for the next N calendar slots.

**Done when:** one command/routine produces a SEO-passing `draft:true` MDX post from a calendar slot with zero hand-editing.

### Workflow contract (for the Living Flowcharts app)

This is the pipeline definition of record (FLOWSTATUS.md says SOW §4–6 owns it). The Living Flowcharts structure file in the Codex root (`living-flowcharts/data/projects/captainscottage.json`) must mirror these node ids and edges; this repo only emits live status into `.flowstatus.json`.

Nodes and edges (handoffs):

- `editor` → `researcher` — Editor advances a calendar slot to `researched` with a handoff note.
- `researcher` → `writer` — Researcher emits `content/research/<slug>.md` (sourced, gaps flagged).
- `writer` → `seo-editor` — Writer emits `src/content/blog/<slug>.mdx` (`draft:true`), status `drafted`.
- `seo-editor` → `writer` — FAIL: numbered fix list, loop back.
- `seo-editor` → `approve` — PASS: status `in-review`. **Hard human gate. No agent crosses this.**
- `approve` → `scheduled-publish` — Will batch-approves in the CMS; post stays `draft:true` until `publishDate`.
- `cms-review` ⇄ `writer` — the preview Review panel writes `content/feedback/<slug>.json`; on the next run the Writer consumes it (request-changes → revise+re-loop; approve-for-batch → record, hold at `in-review`).
- `metrics` → `editor` (side input) — `blog-metrics` derives `bookingLeadDays`; the Editor's seasonal offset reads it. Never auto-runs.

Live-status emission: each pipeline agent sets its own node `active`/`idle` in `.flowstatus.json` per run (now in every agent's directive). That makes the chart live without a separate watcher — "automatic" in the only sense a static repo can be.

**Codex-root structure additions still required** (outside this repo — do in `living-flowcharts/data/projects/captainscottage.json`):
1. Rename node `pr-preview` → `cms-review` (review surface changed from PR to the `/admin` Git CMS + preview overlay).
2. Add node `metrics` (the `blog-metrics` agent / `content/metrics/airbnb-metrics.json`), side-edge into `editor`.
3. Add the `cms-review ⇄ writer` feedback edge.

---

## 5. Workstream C — Review, batch approval, scheduled publish (new)

Implements the locked review model: **Git-based CMS at `/admin`**, batch approve, auto-publish on date. (Supersedes the earlier GitHub-PR review model.)

- [ ] Decap or Sveltia CMS mounted at `/admin`, scoped to the `blog` collection. Editorial workflow enabled (draft → in review → ready).
- [ ] GitHub-backend auth: GitHub OAuth via a small OAuth proxy (e.g. a free Cloudflare/Netlify function). No new user system — Will logs in with his GitHub account.
- [ ] Agents write draft posts (`draft:true`) into `src/content/blog/`; they surface in the CMS "in review" column.
- [ ] **Batch approval:** Will approves several drafts in one sitting from any browser/phone. Each gets a confirmed `publishedAt` date (e.g. successive Wednesdays); posts stay draft/date-gated until then.
- [ ] **Scheduled publisher:** a weekly GitHub Actions cron rebuilds the site so any post whose `publishedAt` ≤ today goes live. Nothing live before its date or without approval.
- [ ] Feedback loop: a CMS rejection/comment routes the post back to the Writer/SEO agents, which update the same file.

**Done when:** Will can bulk-approve a batch in the `/admin` portal from anywhere in one sitting, and each post auto-publishes on its own scheduled date via the weekly cron with no further action.

---

## 6. Workstream D — Publish calendar (new)

- [ ] `content/content-calendar.json` — per slot: slug, title, category, target keywords, status (`idea → researched → drafted → in-review → approved → scheduled → published`), assigned date, PR link.
- [ ] Seeded from brief §6 (12 launch posts) + amenity-health/culture additions mapped to Lifestyle/Travel.
- [ ] Editor agent maintains it; it is the single source for what gets written and when.
- [ ] Optional human-readable calendar view (rendered from the JSON).

**Done when:** the calendar drives the whole pipeline and reflects true status at a glance.

---

## 7. Workstream E — Social distribution (deferred)

Per brief §6: each post shared to email list, Instagram, Pinterest. **Out of scope until A–D are working.**

- [ ] Social agent — published post → IG caption, Pinterest pin copy, email blurb.
- [ ] Email list capture on site (not yet built).
- [ ] Publish/scheduling integration decision.

---

## 8. Remaining brief phases (unchanged scope)

- [ ] **Phase 3** — full `/the-cottage` + `/amenities` pages (currently `ComingSoon` stubs).
- [ ] **Phase 4** — `/area` + `/activities` guides via `guides` collection.
- [ ] **Phase 5** — polish, Lighthouse ≥95 all metrics, launch.
- [ ] **Phase 6** — direct booking (replace Airbnb redirect on `/book`).

Phasing is locked in `CLAUDE.md`/brief §10 — do not jump ahead.

---

## 9. Immediate next step

Build Workstream A (blog system). Everything else depends on a post being able to render.

## 10. Status log

- **2026-05-15** — SOW authored, committed (`docs/scope-of-work`), pushed, opened as PR #2. 4 decisions locked (§2). Paused before Workstream A. Nothing else started.
- **2026-05-15** — "private beach" language replaced site-wide with "waterfront"/"water access"; seasonal sand note added to the waterfront amenity. Translucent nav banner added for hero legibility.
- **2026-05-15** — Host Airbnb guidebook (3989357) transcribed into `src/lib/guidebook.ts` (18 places + traveler advice), typed and staged for the Phase 4 `/area` + `/activities` pages and Phase 2 travel posts.
- **2026-05-15** — **Owner-authorized phasing override:** built real, indexed `/area` and `/activities` pages from `guidebook.ts` ahead of Phase 4. SEO + ItemList/BreadcrumbList schema in place. Recorded in `CLAUDE.md`. One-time exception, not a precedent. `/faq`, `/the-cottage`, `/amenities` still stubs; blog system (Workstream A) still next.
- **2026-05-15** — Closed businesses removed from `guidebook.ts` (The Crazy Crab, NN Burger); dependent Reedville Market note rewritten. Empty `BlogCard` image placeholders removed (text-only when no image).
- **2026-05-15** — **Decision change:** review surface is now a Git-based CMS at `/admin` (Decap/Sveltia), scoped to the blog, superseding GitHub-PR review. Scheduled publish = `publishedAt` date + weekly GitHub Actions rebuild cron. Cross-project agent concepts captured in the new global handbook `~/.claude/HANDBOOK.md`.
- **2026-05-15** — **Multi-agent reconciliation.** A parallel Living-Flowcharts agent had committed `f8ece9b` (full blog system — `BlogPost.astro`, `/journal/[...slug]`, real journal index, `SchemaBlogPosting`, sample post "The Art of the Slow Weekend") and `b1c603d` (flowchart contract: `FLOWSTATUS.md`, `.flowstatus.json`). **Workstream A is therefore DONE** (built by that agent, retained). Owner directed: single driver from here (this agent); other agent stopped; its files/notes kept and inform future work. All 3 commits pushed → PR #2.
- **2026-05-15** — Verified integrated build clean (10 pages incl. `/journal/` + post route). Durable fix for the Dropbox EBUSY blocker: Vite `cacheDir` relocated out of the synced tree in `astro.config.mjs` (no more kill-dev-server/clear-cache dance).
- **2026-05-15** — Workstream B built and test-run end-to-end. Agents `blog-editor → blog-researcher → blog-writer → blog-seo-editor` produced `crabbers-morning-on-hull-creek` (draft:true, ~1011 words, sourced brief, 6 TODOs for Will, SEO PASS, build clean). Calendar status `in-review`; human gate held (no approve/publish by agents). Committed `6597e81`.
- **2026-05-15** — Seasonal-offset + metrics. Calendar gains `bookingLeadDays` (38.5) + season-targeting rule (target `publishDate + leadDays`, the season the reader will *live*). `content/metrics/airbnb-metrics.json` created (occupancy/booked-nights/lead-time time series + wins log). New `blog-metrics` agent (Gmail-derived, privacy-scoped to Airbnb reservation mail, never auto-runs). **Decision:** conversion rate is tracked-for-context but explicitly NOT a blog KPI (listing-side); occupancy + booked-nights are the blog's metrics. **Fact:** no Airbnb host API exists — email + manual paste only.
- **OPEN ITEM:** `blog-metrics` is a new pipeline node not in the FLOWSTATUS structure owner (`living-flowcharts/data/projects/captainscottage.json`, Codex root). Needs a `metrics` node added there; tracked, not silently emitted into `.flowstatus.json`.
- **2026-05-15** — Feedback loop proven end-to-end: AdminOverlay gained localStorage persistence (survives HMR) and a real **Submit** button → dev-only Vite route writes `content/feedback/<slug>.json` directly. Will reviewed 4 posts and submitted feedback (committed as the queue).
- **QUEUED (resume here — execute next session/run; do NOT auto-run, usage-limited):**
  1. **crabbers-morning** (request-changes): only **1 crab pot** at the dock — state as a positive, not a caveat; lean positive throughout. Resolves the pot-count TODO.
  2. **northern-neck-travel-guide-tides-jellyfish** (request-changes): reframe — too negative. Don't bundle jellyfish+tides+mosquitoes. Clear jellyfish-season rundown + how it shifts + what to do when they're present. Couch negatives in "plenty else to do" + "some things are out of our control." Lighter.
  3. **cottage-sauna-culture** (request-changes): more narrative / the "magical, transformative" feel, less science; **needs a real sauna photo (Will to supply — none in repo).**
  4. **the-art-of-the-slow-weekend**: content approved by Will ("this one's good"); only wants listing photos added.
  5. **Photos/hero:** wire hero-image support into `BlogPost.astro` + schema; assign existing `public/images/` shots (dock/creek/porch) as heroes for crabbers/jellyfish/slow-weekend. Sauna blocked on Will's photo.
  6. **waterfront-kitchen-family-recipes:** still researched, not drafted (deferred).
  Mechanism: feedback JSONs are in `content/feedback/`; Writer consumes + clears each on rerun (request-changes → revise + re-loop SEO; stays gated at in-review).
- **2026-05-15** — Housekeeping: editor/atomic `*.tmp.*` artifacts had been swept into a commit by `git add -A`; untracked, deleted, and `*.tmp.*` added to `.gitignore`. Branch `docs/scope-of-work` pushed; PR #2 carries all work. **No Vercel deployment exists** — hosting is GitHub Pages from `main` (per CLAUDE.md). Nothing in this branch is live until it merges to `main`, and `draft:true` posts are excluded from the production build by design. Local `npm run dev` is the only preview surface and is not a shareable URL.
- **2026-05-17** — Tone rule sharpened (Will): the journal is positive stories only, **not** the utilities desk. Writer rule #2 rewritten; Editor gained a topic screen (caveat-core → utilities, not the calendar). Consequences: (a) `northern-neck-travel-guide-tides-jellyfish` **killed** as a blog post — draft + feedback deleted, research kept; slot repurposed to **`mornings-with-the-ospreys-hull-creek`** (2026-05-27, Lifestyle). (b) Jellyfish/tides/mosquito/what-to-pack content RELOCATES to a planned **seasonal "Before You Go / Good Things to Pack"** utilities section (Summer/Fall/Winter/Spring) — net-new, NOT a blog post; content being designed with Will. (c) **Birds = content pillar** (occupancy/shoulder-season strategy: birding peaks spring/fall, fills the summer-weak calendar; affluent, off-peak, longer-stay, repeat demographic). Needs Will's real dock species list.
- **2026-05-17** — Voice seeded to Will's authentic register (guidebook host notes; "match then elevate, never corporate-gloss"). Seasonal pack page named **"What to Bring"** (display) + SEO meta tuned separately; net-new page, NOT a blog post; build deferred until the 4 seasonal lists are locked with Will. Still need from Will: (a) real dock bird species for the ospreys post / birds pillar; (b) cut/add on the draft seasonal pack lists.
- **2026-05-19** — `What to Bring` content locked with Will (short suggested list, no em-dashes, his wording) and **built as a real indexed page** `src/pages/what-to-bring.astro` (owner-directed net-new page, like the area/activities override; recorded in CLAUDE.md). Source of record: `content/what-to-bring.draft.md`. Builds clean, in production output. **OPEN: page is orphaned** — nothing links *to* it yet; needs a nav or footer entry (chrome decision pending with Will). Birds species confirmed and recorded on the ospreys-post calendar entry.
- **2026-05-19 (batch run)** — Queue executed end-to-end. crabbers revised (one-pot → abundance framing, ~536w), sauna revised (science cut to one hedged line, narrative foregrounded, ~590w, photo TODO), recipes drafted (~706w), ospreys drafted (birds-pillar kickoff, ~623w). All four through Writer (Will-voice seed + positive-tone rules) → SEO+build gate: **all PASS, 0 build errors** (titles/descs trimmed, em-dashes→commas, CTAs normalized). Calendar `drafted → in-review`. Human gate intact (no approved/published/draft:false). Committed `cf54c72`, pushed. Feedback files consumed/cleared.
- **2026-05-26** — **SITE LAUNCHED.** Custom apex domain `captainscottageva.com` live (Namecheap A-records → GitHub Pages, `public/CNAME`, GH Pages custom-domain set via API, Let's Encrypt cert provisioned, HTTPS enforced, www→apex 301). `SITE.origin`/sitemap/robots all on the new origin. Pre-launch batch (real `/the-cottage`, `/photos`, `/getaway-guide`, site-wide WebSite+Org schema, author bio, audience tags, OG image) + post-launch SEO scaffolding (AI-crawler robots.txt, humans.txt, `POST_LAUNCH_SEO.md` playbook) merged to `main`.
- **2026-05-26** — Guest-reply agent system built (NOT yet run): `content/replies/` knowledge base + `guest-reply-bootstrap` (one-time Gmail mining) + `guest-reply` (on-demand drafter, Gmail drafts only, never sends, escalation routing). Account = willrphillips@gmail.com. Airbnb "Guests' messages → Email" toggle now on. Pending: Will triggers bootstrap to seed.
- **2026-05-30** — **ReviewPanel rebuild.** Replaced the corner AdminOverlay with an inline, side-by-side, independently-scrolling artifact-style panel (select text → Suggest/Comment/Rewrite chip → popover → structured `edits[]`). Writer agent contract extended to consume `edits[]`, emit a rewrite manifest at `content/rewrites/<slug>.json`, and honor retractions. `approvedAt` frontmatter field added + Vite plugin writes it on approve-for-batch → post leaves the review queue ("queued to publish"). Permanent feedback archive at `content/feedback-archive/`; panel surfaces full per-slug history (archive + voice-feedback-log backfill). Memory: [[review-url-listing]] rule (exclude `approvedAt` posts from review URLs, surface as "queued to publish").
- **2026-05-30** — **Batch 1 approved + scheduled.** All 5 first-batch posts (crabbers, ospreys, sauna, kitchen, slow-weekend) approved via ReviewPanel, `approvedAt` set, publish dates staggered weekly Wed 2026-06-03 → 07-01. **Auto-publish cron built** (`.github/workflows/auto-publish.yml` + `.github/scripts/auto-publish.mjs`): daily 12:00 UTC, flips `draft:false` when `approvedAt` set AND `publishedAt <= today`, commits → Deploy workflow ships. Editor agent confirmed Wednesday/weekly cadence. **Runs on GitHub's servers — laptop can be off.**
- **2026-05-30** — **Batch 2 drafted** (5 posts, full pipeline editor→researcher→writer→SEO, all `in-review`, gated): `complete-guide-to-reedville-virginia` (07-08), `24-hours-in-irvington-virginia` (07-15), `weekend-getaways-from-washington-dc` (07-22), `cost-to-own-waterfront-cottage-northern-neck` (07-29, 10 TODO placeholders for Will's real numbers), `wildlife-sightings-hull-creek` (08-05). Research briefs preserved in `content/research/`.
- **2026-05-30** — **Post-launch SEO started.** Analytics swapped Plausible→**Cloudflare Web Analytics** (free, before the $9/mo trial converted). **GSC**: domain verified (Namecheap TXT), sitemap submitted, home page indexed, VacationRental schema fixed over two rounds (identifier + containsPlace + reviews-with-datePublished + 11 images; dropped the invalid `additionalType` enum; inner occupancy `value` not `maxValue`) → **all green, rich-result eligible**. Manual indexing requests hit the daily quota (irrelevant — sitemap handles discovery).
- **2026-06-02** — **`/the-cottage` room-by-room accuracy pass DONE (PR #14, live).** Walked the page against the floorplan (`1212 Candy Point Rd ... .png`, now committed). Corrections: water opens into view on arrival (not "hear before you see"); kitchen is its own enclosed room + real breakfast nook added; porches fixed (EAST = driveway/dining table, WEST wraparound = water/lounge — was "both face the creek"); master is on the water/west side; sunroom = 3rd bedroom ("sleeping porch," brass daybed + trundle); sauna NORTH side, hot tub on a SOUTH-side patio (not the deck); two kayaks; mosquito caveat cut; living-room "survived a thousand kids" line softened. Two new per-room photos processed (`sleeping-porch-sunroom.jpg`, `dining-nook.jpg`). Layout captured as durable ground truth in `public/images/README.md` + memory [[cottage-floorplan-layout]].
- **2026-06-02** — **Photo library reorganized.** Will added a room-organized source set under `additional images/<room>/` (~164MB, 74 files incl. full bath, half bath, indoor dining, sunroom, second bedroom, dock, ~45 style shots). Decision: **gitignore the bulk local archive** (`additional images/`, `photos/`) — only the processed `public/images/` outputs ship; root photo originals de-tracked. `scripts/process-photos.mjs` made resilient (skips already-consumed sources, resolves room subpaths). Style shots reserved for future blog heroes (one-photo-per-room on the primary pages, per Will).
- **2026-06-02** — **what-to-bring:** added a life-jacket note (we provide a range; bring your own for a guaranteed fit, esp. kids) to the page + source-of-record draft.
- **2026-06-02** — **Fixes (PR #15):** journal date timezone slip — date-only `publishedAt` was formatted without a timeZone, so Eastern viewers saw the date a day early (a June 3 post showed "June 2"); pinned BlogPost + BlogCard formatting to `timeZone: "UTC"`. Capitalized nav label "The cottage" → "The Cottage".
- **2026-06-02** — **Owning entity corrected (PR #16):** property is owned/operated under **Buffalo Rentals LLC** (was incorrectly "Good Old Boys LLC"). Purged repo-wide; `PROPERTY.owner` in `site.ts` is the single source (footer + all schema). Added as a locked decision (§2) + memory [[owning-entity]].
- **2026-06-02** — **Post-launch SEO continued.** Confirmed the GSC "Page with redirect" email is benign (intentional `/book` → Airbnb redirect + trailing-slash normalization; no action). Verified the publish gate: **batch-2's 5 posts have NO `approvedAt`, so the cron will NOT auto-publish them on their July dates** until Will approves — dates are placeholders, approval is the trigger. Wrote the Christian-t-shirt-company SEO playbook for Will's friend at `C:\Users\willr\christian-tshirt-seo-roadmap.md` (outside this repo).
- **2026-06-04** — **Content engine proven in production.** First post (Crabbing) auto-published on schedule: cron flipped `draft:false` at 12:00 UTC → Deploy ran → live at `/journal/crabbers-morning-on-hull-creek` (200), listed on the journal index, date renders correctly (the UTC fix held — shows June 3, not June 2). Fully autonomous, laptop-independent.
- **2026-06-04** — **Post-launch SEO checklist essentially complete.** Shipped this session: **Bing Webmaster** imported from GSC (PR-less, account-side); **IndexNow** key (`public/a9f4c7e21b8d40539c6e1f0a7b3d5e82.txt`) + `.github/workflows/indexnow.yml` + `indexnow-submit.mjs` auto-pings published URLs on content changes to main (PR #19); **hero LCP fix** — responsive WebP variants (768/1280/1920/2400w) via `<picture>` srcset, mobile Performance **84→95**, LCP **4.4s→2.4s** (PR #20); **accommodation-intent SEO** on existing pages (home meta + FAQ Q&As + getaway-guide "where to stay" section — no directory page; honest, funnels to the Airbnb listing) (PRs 0cbdf61 + #22). GSC VacationRental schema confirmed all-green / rich-result eligible. GSC "page with redirect" email confirmed benign (intentional `/book` + trailing-slash). Cloudflare Web Analytics live.
- **2026-06-04** — **Airbnb backlink dropped:** Will can't edit the listing dashboard; the playbook's "add URL to listing" step is not actionable. (Lower SEO value than first stated anyway — Airbnb renders description URLs as plain text.)
- **2026-06-05** — **Decision + build: nightly guest-reply KB harvester.** Will runs an always-on Ubuntu box (Tailscale); we'll grow the `content/replies/` knowledge base automatically from new Airbnb messages. Built: `.claude/agents/guest-reply-harvest.md` (incremental miner — reads only NEW Gmail Airbnb threads since a `content/replies/.harvest-state.json` window, dedupes vs existing topics, anonymizes, appends, recency-wins; never sends/drafts), `scripts/harvest-airbnb-messages.sh` (cron entrypoint: pull → `claude -p` headless → commit+push only `content/replies/`), `scripts/HARVEST_SETUP.md` (Ubuntu install + crontab + the headless-Gmail verification step + Gmail-API refresh-token fallback). Deploy workflow `paths-ignore: content/replies/**` so nightly KB commits don't rebuild the site. **Source reality:** Gmail mirror only (no Airbnb API); only messages since forwarding was enabled ~2026-05-26. **Open dependency:** confirm the claude.ai Gmail MCP is reachable when `claude -p` runs headless on the box — if not, use the documented Gmail-API fallback. KB is internal (never served), so auto-append/commit is acceptable; the `guest-reply` drafter it feeds stays draft-only + gated.
- **2026-06-04** — **Known platform limit (logged, not a to-do):** GitHub Pages does not allow custom HTTP headers, so PageSpeed's "efficient cache lifetimes" + security headers (HSTS/CSP/COOP/XFO) cannot be set without fronting the site through a Cloudflare proxy (a DNS change). Not worth it for a static content site; do not chase.
- **2026-06-06/07** — **Guest-reply moved to GitHub Actions + closed the learning loop.** The gauge-claude box can't run Claude (old CPU → illegal-instruction crash), so the whole guest-reply pipeline now runs as **public-repo GitHub Actions** on the Claude subscription OAuth token (no API billing) + Gmail read-only refresh token + a Telegram bot. (a) **Watcher** (`.github/workflows/guest-reply-watch.yml` + `.github/scripts/guest-reply-cloud.mjs`, every ~10 min): reads NEW Airbnb guest messages (per-message, classified by `reply.airbnb.com` Reply-To), drafts in Will's MESSAGING voice or escalates, pushes to Telegram with a button → `captainscottageva.com/compose.html` → routes iOS to the Gmail app (`googlegmail://`) prefilled → Will sends (relays to guest). **Never sends; Will is the only send gate.** (b) **Feedback capture:** Will's Telegram replies (incl. swipe-reply context) → `content/replies/feedback-log.md` (getUpdates offset in `.watch-state.json`). (c) **Voice tuner** (`guest-reply-tune.yml`, daily): folds new feedback into `voice-rules.md` + KB, and **mines Will's real sent replies** for voice — securely: fetched to a runner-temp file only (`fetch-sent-replies.mjs`), distilled, NEVER committed (public repo; door codes/WiFi/addresses stay out). Proven end-to-end: a real "guest isn't staying yet, dates issue" correction was captured → tuner added a "don't assume mid-stay; flag dates problems" rule. (d) **mark-seen mode** run once to dismiss the backlog so only new messages notify. Memory: [[claude-oauth-token-expiry]] (renew ~2027-06).
- **2026-06-07** — **Photos: full refresh from the 2026 professional shoot** (`_inbox/20260619LDPhillipsRiverHome-*`, 101 frames; `_inbox/` gitignored, originals stay in Dropbox for the Airbnb listing). Triaged all 101; **new hero = frame #111** (water-side screened porch looking out to Hull Creek — owner pick, "capture the waterfront"). Regenerated every home-gallery + `/the-cottage` slug from the new shoot via `scripts/process-photos.mjs` (slot map rewritten, source-frame noted), incl. the sauna interior/exterior, hot-tub+fire-pit, dock, dock-stairs-at-golden-hour, refreshed living room, master, kitchen, dining nook, sleeping porch, second bedroom. New `extras/` for future amenities/blog: back-patio, fire-pit, creek-sunset, aerial-dusk, osprey (wildlife), rosé-on-dock (lifestyle). Alt text updated to match new scenes; `public/images/README.md` manifest refreshed. Build clean (`astro check` passed; local trailing EBUSY on `dist/pages` rmdir is the known Dropbox lock, CI unaffected). Committed `5be8721` → main → deploying. **Owner decision: full refresh** (not add-only). `/amenities` stays a stub (phase-gated) — sauna/hot-tub/fire-pit extras are staged for when that phase comes.
- **2026-06-08** — **GEO/AEO + blog polish batch (committed `7cf5d32`, deploying).** (1) **`/llms.txt`** added — the flagged GEO item; concise AI-summary (facts, primary pages, booking → Airbnb, assistant notes) so ChatGPT/Perplexity describe the cottage accurately. (2) **Blog heroes wired** — `hero` schema field changed from `image()` to a public `/images` path; rendered eager + `fetchpriority=high` at the top of each post, and **reused as the per-post OpenGraph/Twitter card + BlogPosting schema image** (was the shared default OG). Assigned a hero to all 10 posts from the new shoot (osprey→ospreys, sunset-rosé→slow-weekend, cedar-sauna-window→sauna, stairs-to-dock→crabbers, kitchen→recipes, aerial→cost-to-own, etc.). (3) **a11y:** rust button label `bone`→`#fff` (4.16:1→4.80:1, clears WCAG AA — the flagged "Stay with us" contrast item). (4) **perf:** preconnect the Cloudflare beacon origin (fonts are self-hosted/same-origin, so font preconnect was N/A). Build clean (0 errors); verified per-post OG + hero render on the one published post. **Remaining optional polish:** none flagged. **Still pending Will (gated):** approve batch-2's 5 drafts (now each has a hero); fill cost-to-own/etc. TODO numbers; backlink outreach.
- **2026-06-09** — **Full code/agent review + STR competitive research applied.** (a) **Dead code purged:** `AdminOverlay.astro` (replaced by ReviewPanel, was unreferenced), 4 superseded Ubuntu-box scripts (`guest-reply-watch.sh`, `harvest-airbnb-messages.sh`, `notify-telegram.mjs`, `generate-placeholders.mjs` — deprecation banners on both SETUP docs), `buildMailto()` in the watcher, unused `PROPERTY`/`absoluteUrl` imports, `start`/`astro` npm scripts, all `*.tmp.*` artifacts. (b) **DRY:** Gmail REST helpers extracted to `.github/lib/gmail.mjs` (shared by watcher + sent-replies miner, ~100 duplicated lines removed); date formatting unified as `formatDateUTC()` in `site.ts` (BlogPost + BlogCard). (c) **Workflows:** concurrency guards added to `auto-publish.yml` + `indexnow.yml` (prevents overlapping-cron commit races). (d) **Agents optimized:** `blog-editor` gained a "Proven formats" section benchmarked against AutoCamp/Postcard Cabins/Eastwind/Joshua Tree/Unyoked journals (seasonal posts 8–12 wks early, itinerary format with the DC angle, objection-content routing, property-page internal-link preference); `blog-researcher` gained a format-only exemplar scan for travel posts; `guest-reply` got an explicit boundary vs the Actions watcher (no double-handling); `guest-reply-harvest` description fixed (no nightly Ubuntu cron — Will-triggered/Actions). (e) **Research deliverables:** `content/AIRBNB_OPTIMIZATION.md` — ranked owner actions (review-velocity cadence, sharper title formula, fact-captions, description structure, pricing architecture incl. Fri/Sat premium + seasonal bands + AirDNA amenity premiums arguing peak ADR $300+, 12–24-mo calendar, cleaning-fee cap) + `content/replies/checkout-review-ask.md` (checkout thank-you/review-ask template, `needs-will`). **Highest-leverage NEW item surfaced: email capture on the site now** (every 80%-direct property built the list years before its booking engine) — needs Will's provider pick, not yet built. Build clean, 0 errors.
- **2026-06-09 (b)** — **Email capture approved by Will + built (ships dark).** Footer signup band ("Seasonal notes from Hull Creek") in `Footer.astro`, rendered ONLY when `SITE.newsletterAction` in `site.ts` is non-empty. Provider decision: **Buttondown** (free tier, plain HTML POST embed — no JS, fits the static site). **Waiting on Will:** create the Buttondown account, then set `newsletterAction` to `https://buttondown.com/api/emails/embed-subscribe/<username>` and the form goes live site-wide. Rationale logged in `content/AIRBNB_OPTIMIZATION.md` (list-building precedes Phase 6 direct booking).
- **2026-06-10** — **Journal → newsletter automation built (Option B: free, custom).** Will chose the no-cost route over Buttondown's $9/mo RSS-to-email. `auto-publish.mjs` now also outputs `slugs=`; new `.github/scripts/newsletter-send.mjs` runs as a final auto-publish step: for each freshly-flipped post it emails the Buttondown list a **teaser** (hero image + description + "Read the full post →" link — deliberately NOT the full body: no MDX→HTML conversion to maintain, and the email drives readers to the site). Best-effort by design: missing `BUTTONDOWN_API_KEY` or an API failure never blocks publishing. `NEWSLETTER_MODE=draft` env flips it to park-for-review instead of send. Idempotent via the draft-flip (each post passes through exactly once). Fixed a frontmatter-parse bug (regex quote-stripping backtracked badly on CRLF; now explicit trim+strip). **Waiting on Will:** create a Buttondown API key and add the `BUTTONDOWN_API_KEY` repo secret. **Caveat logged:** Buttondown paywalled some API surfaces 2026-04; if the first real send returns a payment-required error, fall back to the $9/mo plan (its native RSS-to-email also becomes available then).
- **RESUME POINTER (start here, 2026-06-04):** Site is LIVE, self-publishing, and SEO-complete on the build side. **Flagged for next session:** (1) **`llms.txt`** — add a `/llms.txt` AI-summary file (emerging GEO convention; we already allow AI crawlers, this completes it). **Optional polish (already at 95):** (2) accessibility contrast on the rust "Stay with us" button (96→100); (3) preconnect/preload the two web fonts to shave FCP/Speed-Index; (4) per-post OG images (posts share the default card). **Pending Will (content, gated):** approve batch-2's 5 drafts (no `approvedAt` → won't auto-publish until approved); answer the cost-to-own / wildlife / DC / Irvington TODO placeholders; trigger `guest-reply-bootstrap` when ready. **Ongoing (owner, per playbook):** backlink outreach (Northern Neck tourism dirs, regional blogs); AEO citation checks in a few weeks (ask ChatGPT/Perplexity "what is Captain's Cottage"); GSC query mining once ~1 month of data exists.
- **RESOLVED 2026-05-19 (was: draft preview):** drafts now render in `npm run dev` and `INCLUDE_DRAFTS` builds (gate in `journal/[...slug].astro` + index); production plain build still excludes them. Admin overlay + submit-to-`content/feedback/` route working. Reviewing a draft no longer means reading raw `.mdx`.
- **SUPERSEDED 2026-05-30 (was: CMS-at-`/admin` decision):** the Decap/Sveltia Git CMS was never built and is no longer planned. The in-page ReviewPanel (dev-preview only) replaced it — Will reviews drafts directly on the rendered page with inline structured editing. The FLOWSTATUS `pr-preview` node note is moot; review happens in-page now.
- **OPEN ITEM:** FLOWSTATUS node `pr-preview` still describes "open a PR with a preview link," which conflicts with the locked CMS-at-`/admin` decision. The chart **structure** is owned by `living-flowcharts/data/projects/captainscottage.json` in the Codex root (outside this repo). That node needs renaming to a CMS-review node; requires editing the Codex-root structure file, not this repo.
- **2026-06-10 (b)** — **Footer newsletter copy updated (commit `fa2bf6a`).** Eyebrow changed to "Notes from the Northern Neck" (matches Buttondown newsletter name); body changed to "An occasional letter about life out here — the water, the seasons, the small things worth a weekend. No noise, easy to leave." Removes all "when the creek changes" language per Will's request.
- **2026-06-11** — **Session closed. Two items flagged for next session (do NOT auto-start):**
  1. **Finish the newsletter flow** — the mechanics are built and deployed (`newsletter-send.mjs` + `auto-publish.yml` step), but emails will not send until Will adds the `BUTTONDOWN_API_KEY` GitHub repo secret (Settings → Secrets → Actions → new secret). First live test will be the sauna post on its scheduled date. If Buttondown returns a payment-required error on send, upgrade to the $9/mo Basic plan (its native RSS-to-email also becomes available). Optionally add `NEWSLETTER_MODE=draft` secret to park emails for review before sending.
  2. **Fix the Telegram messaging** — the guest-reply watcher pushes notifications via the Telegram bot + `captainscottageva.com/compose.html` → Gmail app prefill flow. Will reported this needs attention (specific failure not yet diagnosed). Start by pulling the latest Actions run log for `guest-reply-watch.yml` to see the current error, then check the compose.html routing and the Telegram bot getUpdates loop.
- **RESUME POINTER (start here next session):** (1) Add `BUTTONDOWN_API_KEY` GitHub secret (Will's action, ~2 min). (2) Diagnose Telegram messaging failure — check `guest-reply-watch.yml` run logs. (3) Approve batch-2's 5 drafts (`reedville`, `irvington`, `dc-getaways`, `cost-to-own`, `wildlife`) — fill `cost-to-own` financials and remaining TODOs first. (4) Backlink outreach per `content/backlink-log.md`. Everything else (FLOWSTATUS node rename, Phase 3–6) is deferred.
