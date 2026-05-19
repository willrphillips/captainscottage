# Scope of Work — Captain's Cottage

**Living document.** Last updated: 2026-05-15. Owner: Will Phillips.

**Status:** This SOW is committed on branch `docs/scope-of-work` and open as PR #2 (doc-only, awaiting merge). No workstream code started yet. Resume point: **Workstream A — blog system**.

This tracks the marketing site **and** the AI content-agent pipeline layered on top of it.
`captains_cottage_brief.md` remains the product/SEO source of truth; `CLAUDE.md` is the build-rules summary. This file is the project tracker and the spec for the content-automation workstream, which did not exist in the original brief.

---

## 1. Overall completion

**~15% complete.**

Reasoning: the brief defines a 6-phase site build. Phase 1 (the heaviest infrastructure lift — scaffold, design system, home page, deploy pipeline) is done. Phases 2–6 are pending. On top of that, this SOW adds a net-new content-automation workstream (AI agents, review pipeline, publish scheduler) that was not previously scoped, which dilutes the overall percentage.

| Workstream | Weight | Done | Contribution |
|---|---:|---:|---:|
| Phase 1 — Foundation + Home (built) | 22% | 100% | 22.0% |
| Phase 2 — Blog system | 14% | ~22% | 3.1% |
| AI content-agent pipeline (new) | 16% | 0% | 0.0% |
| Review / approval / scheduled publish (new) | 8% | 0% | 0.0% |
| Phase 3 — Property + amenities pages | 12% | 0% | 0.0% |
| Phase 4 — Area + activity guides | 10% | 0% | 0.0% |
| Phase 5 — Polish + launch | 10% | 0% | 0.0% |
| Phase 6 — Direct booking | 8% | 0% | 0.0% |
| **Total** | **100%** | | **~15%** |

Weights are judgment estimates of build effort, not equal phases. Confidence: moderate. The Phase-1 figure is solid (it's shipped and deploying); the new-workstream weights are first-pass and will firm up once the blog system lands.

---

## 2. Decisions locked (2026-05-15)

| Decision | Choice |
|---|---|
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
- **RESUME POINTER:** next session/run — execute the QUEUED block above (3 feedback-driven revisions via the Writer, photo/hero wiring, recipes draft), then SEO pass. Feedback queue is committed in `content/feedback/`.
- **OPEN ITEM (draft preview):** `src/pages/journal/[...slug].astro` `getStaticPaths` filters `!data.draft`, so a `draft:true` post has **no rendered URL** (404) and isn't listed. Reviewing a draft today = reading the raw `.mdx`. Workstream C must add a draft-inclusive preview build (e.g. `INCLUDE_DRAFTS` env gate for the CMS/preview context; production stays draft-excluded) so Will can review rendered drafts before batch-approving.
- **OPEN ITEM:** FLOWSTATUS node `pr-preview` still describes "open a PR with a preview link," which conflicts with the locked CMS-at-`/admin` decision. The chart **structure** is owned by `living-flowcharts/data/projects/captainscottage.json` in the Codex root (outside this repo). That node needs renaming to a CMS-review node; requires editing the Codex-root structure file, not this repo.
