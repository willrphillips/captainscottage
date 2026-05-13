# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Canonical brief

`captains_cottage_brief.md` is the source of truth for product, stack, design system, SEO targets, page plan, and the 12-post blog calendar. Read it before non-trivial work. This file summarizes the parts most likely to bite a future session; the brief wins on any conflict.

## Repository status

Greenfield. Only `README.md`, this file, and the brief exist. There is no `package.json`, no Astro project, no CI workflow yet. The first substantive commit should be the Astro scaffold described in Phase 1 of the brief, after which this file should be updated with real commands and component locations.

## Stack (locked)

- **Astro 5+** static site (near-zero JS by default — non-negotiable for SEO/Core Web Vitals).
- **MDX** for `src/content/blog/` and `src/content/guides/`, wired through typed content collections (`src/content/config.ts`).
- **Tailwind v4** with custom color tokens (see below). Don't pull in a component library.
- **`@fontsource/fraunces` + `@fontsource/inter-tight`** — self-hosted, not Google Fonts CDN.
- **Astro `<Image>`** for every photo (WebP/AVIF, responsive `srcset`, lazy by default).
- **Netlify Forms or Formspree** for the contact form. No backend.
- **Hosting:** GitHub Pages via GitHub Actions deploying the `gh-pages` branch. Cloudflare Pages migration is a later optional step.

Bootstrap (Phase 1, once a session is ready to scaffold):

```bash
npm create astro@latest .
npx astro add tailwind mdx sitemap
npm install @astrojs/rss @fontsource/fraunces @fontsource/inter-tight
```

Once scaffolded, standard Astro scripts apply (`npm run dev`, `npm run build`, `npm run preview`). Replace this section with the real commands at that point.

## Layout the brief expects

See section 2 of the brief for the full tree. Key conventions:

- `src/pages/area/` and `src/pages/activities/` are flat directories of location/activity pages — each a real 800–1200 word guide, not a stub.
- `src/pages/journal/[...slug].astro` renders posts from the `blog` collection; `src/pages/journal/index.astro` is the filterable list.
- `src/layouts/BaseLayout.astro` owns `<head>`, fonts, analytics, and per-page schema injection. `src/layouts/BlogPost.astro` extends it for posts.
- Schema is a component concern: `src/components/SchemaVacationRental.astro` (and siblings for `FAQPage`, `BlogPosting`, `BreadcrumbList`) emit JSON-LD. Every page gets at least breadcrumbs.

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
