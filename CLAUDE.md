# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical brief

`captains_cottage_brief.md` is the source of truth for product, stack, design system, SEO targets, page plan, and the 12-post blog calendar. Read it before non-trivial work. This file summarizes the parts most likely to bite a future session; the brief wins on any conflict.

`SCOPE_OF_WORK.md` is the living project tracker: completion %, locked decisions, workstreams, and the current resume point. Read it to see what's done and what's next.

## Phase status

Phase 1 (foundation + home page) is in. Phases 2–6 (blog content, full property page, area/activity guides, polish, direct booking) are still pending. Don't skip ahead.

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
