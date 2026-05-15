# Scope of Work — Captain's Cottage

**Living document.** Last updated: 2026-05-15. Owner: Will Phillips.

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
| Review surface | **GitHub PR + deployed preview.** Reuses existing GH Pages deploy. No new infra. |
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
- [ ] Agent runtime decision — Claude Code **routine** (`/schedule`) vs GitHub Actions cron. Static site cannot self-run; the orchestration brain lives outside it.
- [ ] Orchestration command/routine that runs the full chain for the next N calendar slots.

**Done when:** one command/routine produces a SEO-passing `draft:true` MDX post from a calendar slot with zero hand-editing.

---

## 5. Workstream C — Review, batch approval, scheduled publish (new)

Implements the locked review model: GitHub PR + preview, batch approve, auto-publish on date.

- [ ] Each drafted post (or a batch) → its own branch + Pull Request.
- [ ] PR carries a **deployed preview link** (preview build of the rendered post).
- [ ] Will reviews on GitHub: comment = feedback (routes back to Writer agent), approve = accept.
- [ ] **Batch approval:** approve several PRs/posts at once; approved posts get a confirmed `publishedAt` date in the calendar but stay `draft:true` until then.
- [ ] **Scheduled publisher** — a dated job that flips `draft:false` and merges/deploys on the agreed date. Nothing live before its date or without approval.
- [ ] Feedback loop: a commented PR re-enters the Writer/SEO agents and updates the same PR.

**Done when:** Will can bulk-approve a batch in one sitting and each post goes live on its own scheduled date with no further action.

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
