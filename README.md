# Captain's Cottage

Marketing site and journal for [Captain's Cottage](https://www.airbnb.com/h/captainscottageva) — a waterfront rental on Hull Creek in Heathsville, Virginia.

See `captains_cottage_brief.md` for product context, SEO targets, and the multi-phase plan. See `CLAUDE.md` for the architectural notes future Claude sessions should read first.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321/captainscottage
npm run build      # type-check + static build into ./dist
npm run preview    # serve the built site locally
```

Astro 5 + MDX + Tailwind v4 + self-hosted Fraunces & Inter Tight. Deploys to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

## Add images

Drop the originals (JPEG/PNG, ~2400px long edge) into `public/images/` using the slugs documented in `public/images/README.md`. The home page is wired to those exact filenames — no code change needed.
