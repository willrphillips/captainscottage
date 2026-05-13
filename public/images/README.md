# Image manifest

Real photos of Captain's Cottage by Will Phillips. Each file in this folder was processed by `scripts/process-photos.mjs` from the originals — resized to a sensible web size, recompressed as progressive mozjpeg.

## Home page slots

| Filename | Slot on `/` | Subject |
|---|---|---|
| `hero-porch-creek.jpg` | Hero, full-bleed | The screened lounge porch — rattan sofa, ceiling fans, view onto Hull Creek through cedar-framed screens. |
| `og-default.jpg` | OpenGraph + Twitter card (1200×630) | Same shot, cropped for social. |
| `cottage-exterior-creek.jpg` | Gallery, large left tile | Cottage exterior with the deck Adirondack and Hull Creek beyond. |
| `stairs-to-dock.jpg` | Gallery, right portrait | Wooden stairs descending from the bank to the dock. |
| `living-room-rattan.jpg` | Gallery | Living room — rattan chairs, red rug, dining nook beyond. |
| `screened-porch-dining.jpg` | Gallery | Wooden dining table on the screened porch. |
| `kitchen-green-cabinets.jpg` | Gallery | Kitchen — green cabinets, open shelving, "Captain's Cottage" house manual on the counter. |
| `master-bedroom.jpg` | Gallery | Mahogany four-poster bed, wicker trunk, beach painting. |
| `dock-hull-creek.jpg` | Gallery, also passed to VacationRental schema | Private dock extending into Hull Creek, sandbar mid-creek. |

## Extras (saved for `/the-cottage`, `/amenities`, and blog hero images)

In `public/images/extras/`:

- `screened-porch-creek-view.jpg` — empty screened porch with creek view; great alternative hero or "the porches" detail
- `second-bedroom.jpg` — second/guest bedroom
- `living-room-sectional.jpg` — wider living room view with sectional and sage pillows
- `sitting-nook.jpg` — sitting nook with grey tufted chair and bird prints
- `yoga-mats.jpg` — yoga mats in wicker basket (amenity detail)
- `cottage-front-driveway.jpg` — cottage front from the gravel driveway

## Adding new photos

1. Drop the original (JPEG/PNG, ~2400px on the long edge is plenty) somewhere in the repo.
2. Add a slot definition to `scripts/process-photos.mjs` pointing at the source filename and the desired output slug.
3. Run `node scripts/process-photos.mjs`.

To replace an existing slot, overwrite the source filename in the script and re-run — no code changes elsewhere are needed.

## SEO conventions (from the brief, §4)

- Descriptive, hyphenated, lowercased filenames. **No `IMG_xxxx.jpg`.**
- Alt text lives in `src/components/Hero.astro` and `src/components/PhotoGallery.astro` — update it whenever you swap a photo.
- Originals over ~5MB should be resized to ~2400px long edge before being committed as sources; the processor will compress further on output.
