# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical brief

`captains_cottage_brief.md` is the source of truth for product, stack, design system, SEO targets, page plan, and the 12-post blog calendar. Read it before non-trivial work. This file summarizes the parts most likely to bite a future session; the brief wins on any conflict.

`SCOPE_OF_WORK.md` is the living project tracker: completion %, locked decisions, workstreams, and the current resume point. Read it to see what's done and what's next.

## Phase status

Phase 1 (foundation + home page) is in. Phases 2–6 (blog content, full property page, area/activity guides, polish, direct booking) are still pending. Don't skip ahead.

**Owner override (2026-05-15):** Will explicitly directed building the real `/area` and `/activities` pages ahead of phase order, driven by the host Airbnb guidebook (`src/lib/guidebook.ts`). Those two pages are now live and indexed. This was a one-time, owner-authorized exception — it is not a precedent to skip phasing generally. Blog system (Workstream A) is still the next planned build; `/the-cottage`, `/amenities`, `/faq` remain `ComingSoon` stubs until their phases.

**Owner override (2026-05-19):** `/what-to-bring` — a real, indexed seasonal "what to pack" utility page (`src/pages/what-to-bring.astro`, content of record `content/what-to-bring.draft.md`) — was built ahead of phase order at Will's direction. Same one-time-exception status. It is currently orphaned (no nav/footer link in yet); placement is a pending chrome decision.

## Locked conventions added since launch (read these — newer than the stack/code sections below)

The stack/code sections further down predate launch and have drifted in spots; **`SCOPE_OF_WORK.md` is authoritative on current state.** Key conventions locked in mid-2026:

- **Live on a custom domain.** Site is live at https://captainscottageva.com. `BASE` is now `/` (not `/captainscottage`), and analytics is **Cloudflare Web Analytics**, not Plausible (those mentions below are stale). Most pages (`/the-cottage`, `/amenities`, `/area`, `/activities`, `/faq`, `/photos`, `/getaway-guide`, `/what-to-bring`) are real and indexed, not `ComingSoon` stubs.
- **Location wording (geo-SEO) — locked 2026-06-21.** Lead all titles/metas/H1s/hero/schema/`llms.txt` with recognizable geography: **Virginia's Northern Neck**, **where the Potomac meets the Chesapeake Bay**, near **Heathsville** / Northumberland County, ~2¾ hrs from DC. Use **"Hull Creek" as body texture only — never a headline, page title, or search keyword** (too hyperlocal to rank). Canonical tagline lives in `site.ts → PROPERTY.tagline`.
- **Agents (`.claude/agents/`, `.claude/workflows/`).** Blog pipeline `blog-editor → blog-researcher → blog-writer ⇄ blog-seo-editor`, plus `blog-reviewer` (read-only, citation-backed voice review) and `cottage-overseer` (read-only "state of the cottage" briefing). `cottage-pipeline` is a **workflow** (deterministic driver running the chain for the next N idea slots) — a workflow, not an agent, because subagents can't spawn subagents. Guest replies: `guest-reply`, `guest-reply-harvest` + the GitHub Actions watcher/tuner. Every agent stops at the human gate (never approves/publishes/sends).
- **Notifications → Discord.** Guest-reply alerts post to **Discord** via the `DISCORD_WEBHOOK_URL` secret. The earlier **Telegram** and **ntfy** paths are retired. Voice tuning learns from Will's **sent** Gmail replies (sent-vs-draft diff in `build-voice-diff.mjs`), not from reply-capture.
- **Human gate unchanged.** Posts stay `draft:true` at `in-review` until Will approves; approved posts auto-publish on their `publishedAt` date.

## Live flowchart status (when building the agent pipeline)

`FLOWSTATUS.md` is the integration contract for the Living Flowcharts app in the
Codex root. As you build each agent/workstream piece, update `.flowstatus.json`
(node ids per the table in `FLOWSTATUS.md`). Do not redefine the pipeline here —
structure lives in `living-flowcharts/data/projects/captainscottage.json`;
pipeline meaning lives in `SCOPE_OF_WORK.md`. This repo only emits live status.

## Stack (locked)

- **Astro 5** static site (near-zero JS by default — non-negotiable for SEO/Core Web Vitals).
- **MDX** for `src/content/blog/` and `src/content/guides/`, via typed content collections (`src/content/config.ts`). Uses the `glob()` loader.
- **Tailwind v4** via the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/styles/global.css`. Color/font tokens live in `@theme` in that same file — no `tailwind.config.*` file.
- **`@fontsource-variable/fraunces` + `@fontsource-variable/inter-tight`** — self-hosted, imported once in `global.css`.
- **Astro `<Image>` is intentionally _not_ used yet.** The home page uses plain `<img>` against expected slugs in `/public/images/` so the layout renders even before photos arrive. Swap to `<Image>` when real assets are placed in `src/assets/` (typed via `image()` in the content schema for blog heroes).
- **Plausible** analytics (placeholder `data-domain` in `src/lib/site.ts → SITE.plausibleDomain`).
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml` (Actions → upload-pages-artifact → deploy-pages). Triggered on push to `main`.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321/captainscottage
npm run build      # astro check + static build → ./dist
npm run preview
```

The `base: "/captainscottage"` setting means every URL is served under `/captainscottage/*` locally and on GH Pages. Internal links go through `withBase()` in `src/lib/site.ts` — never hard-code `/foo`, always `withBase("/foo")`. Canonical/OG URLs go through `absoluteUrl()`; default `pathname` in `BaseLayout` is derived via `stripBase(Astro.url.pathname)` because Astro's `Astro.url.pathname` already includes the base in static builds.

## Code layout (as built)

- `src/lib/site.ts` — single source of truth for property facts (`PROPERTY`), drive times, standout amenities, headline reviews, nav links, and the `SITE` deployment constants. Every page reads from here. Change a fact in one place, never in markup.
- `src/styles/global.css` — Tailwind import, fontsource imports, `@theme` tokens, base layer (grain overlay, selection color, heading defaults), and component-layer utilities (`.eyebrow`, `.display-hero`/`-xl`/`-lg`/`-md`, `.lede`, `.body-prose`, `.drop-cap`, `.btn`/`.btn-rust`/`.btn-ghost`, `.container-wide`/`-narrow`, `.section-pad`, `.reveal`). Use these utilities — don't redefine them inline.
- `src/layouts/BaseLayout.astro` — owns `<head>` (canonical, OG, Twitter, RSS link, sitemap link, Plausible script), the skip link, `<Nav>`/`<Footer>` chrome, and the scroll-reveal `IntersectionObserver`. Exposes a named `head` slot for per-page schema/meta injection. `BlogPost.astro` (Phase 2) will wrap this.
- `src/components/Schema*.astro` — emit JSON-LD via `<script is:inline type="application/ld+json">`. Pages that render in the head should pass them through the `head` slot of `BaseLayout`. Breadcrumbs are passed as a `breadcrumbs={[...]}` prop on `BaseLayout` and rendered automatically.
- `src/components/` — section components for the home page (`Hero`, `Marquee`, `StorySection`, `ReviewQuote`, `AmenityGrid`, `PhotoGallery`, `LocationSection`, `JournalPreview`, `BookingCTA`), plus `Nav`, `Footer`, `BlogCard`, and the `ComingSoon` placeholder used by stub pages.
- `src/pages/` — the home page is real. Every other page (`/the-cottage`, `/amenities`, `/area`, `/activities`, `/journal`, `/faq`) is a `ComingSoon` stub set to `noindex` until its phase fills it in. `/book` redirects to the Airbnb listing (meta-refresh + visible fallback) and stays that way until Phase 6.
- `src/content/config.ts` — typed `blog` and `guides` collections. The `blog` collection enforces `category: "Lifestyle" | "Travel" | "Real Estate"` to match the brief's content mix.
- `src/pages/rss.xml.js` + `@astrojs/sitemap` — feed and sitemap auto-generated. The RSS endpoint tolerates an empty `blog` collection (try/catch) so the build doesn't break before posts land.

## Adding a blog post

When Phase 2 begins, create `src/content/blog/<slug>.mdx` with the frontmatter shape in `src/content/config.ts`. The category enum is intentionally narrow — don't widen it without checking the brief's content plan. Add a hero image to `src/assets/blog/` so the schema can type it.

## Image workflow

Photos are wired in via plain `<img>` tags against fixed slugs in `/public/images/` — see `public/images/README.md` for the slot manifest. When real photos arrive:

1. Drop them at the exact slugs in the manifest, or share originals in chat and I'll rename + commit.
2. For blog post heroes, place under `src/assets/blog/` and import in MDX frontmatter so `image()` in the collection schema typechecks.
3. Once the hero/gallery photos are real, consider migrating those `<img>` tags to Astro `<Image>` for automatic WebP/AVIF/srcset. Do it when the assets are settled, not before.

## Design system invariants

These are aesthetic rules, not suggestions — the brief is explicit that "editorial-coastal" must not drift into generic beachy. Reference Aman Resorts, Inness NY, Plain Magazine; avoid shells, rope fonts, cottagecore.

- **Colors** (Tailwind tokens): `bone #f4eee3`, `bone-deep #ebe2d1`, `ink #1a2734`, `ink-soft #2d3a47`, `navy #16283d`, `rust #b8552e`, `rust-deep #8f3d1d`, `sage #5a6a52`, `sand #d9c9a8`, `rule rgba(26,39,52,0.18)`.
- **Type:** Fraunces (variable, opsz 9–144) for display, italics in `<em>` rendered rust. Inter Tight 300/400/500/600 for body. Fluid sizing via `clamp()` — hero `clamp(64px, 11vw, 168px)`.
- **Layout:** asymmetric grids, 120–160px vertical section padding on desktop, one bold element per section, drop caps (Fraunces italic, rust, ~72px) on first paragraph of long-form sections, subtle SVG grain overlay at 0.35 multiply.
- **Motion:** scroll-triggered fade-up only (40px translate, 1s cubic-bezier). Card hover `translateY(-2px)`. Nothing else.

## SEO requirements every page must satisfy

This is the whole reason the site exists — don't ship a page that misses any of these:

- Unique `<title>` 50–60 chars with the primary keyword front-loaded; meta description 140–160 chars.
- Single `<h1>` containing the primary keyword; secondary keywords in `<h2>`/`<h3>`.
- Descriptive image filenames (`hull-creek-sunset-dock.webp`, not `IMG_2847.jpg`) and alt text with natural keyword inclusion.
- JSON-LD schema appropriate to the page type (`VacationRental` on `/`, `FAQPage` on `/faq`, `BlogPosting` on posts, `BreadcrumbList` everywhere).
- OpenGraph + Twitter Card metadata and a canonical URL.
- Internal links to at least two related pages.
- Lighthouse ≥ 95 on all four metrics; LCP < 2.5s, INP < 200ms, CLS < 0.1.

`@astrojs/sitemap` auto-generates `sitemap.xml`; `src/pages/rss.xml.js` emits the blog feed; `public/robots.txt` allows all and points at the sitemap.

## Anti-patterns (explicit "do not build")

Section 12 of the brief lists these and they are firm:

- No live booking calendar yet — `/book` redirects to the Airbnb listing until Phase 6.
- No carousels, no hero video, no autoplay, no animated cursors, no live chat.
- No cookie banner (no consent-requiring tracking is in scope yet).
- No user accounts, no e-commerce, no multi-property support.
- No animations beyond the subtle scroll reveal described above.

## Phasing

Work happens in the phases defined in section 10 of the brief (Foundation+Home → Blog → Property/Amenities → Area/Activity guides → Polish/Launch → Direct booking). Don't jump ahead — for example, don't wire a booking widget while the home page is still being built.

## Property facts to reuse verbatim

Section 7 of the brief is the canonical source for property data (address, bedrooms/beds/baths, max guests 6, 4.92★/137 reviews, Wi-Fi 103 Mbps, drive times, Hull Creek coordinates ~37.95° N, 76.45° W). Pull from there rather than restating — mismatches across pages hurt both trust and schema validation.


## File location rule

Save all files inside this project folder (this directory or its subfolders). Do NOT save to Downloads, `C:\Users\willr\`, or any location outside this project. If saving elsewhere is truly required, STOP and confirm with Will first that it is the best choice for the job.
