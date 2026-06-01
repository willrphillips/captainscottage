# Image manifest

Real photos of Captain's Cottage by Will Phillips. Each file in this folder was
processed by `scripts/process-photos.mjs` from the originals (the `_07A*.jpeg` /
`_MG_*.jpeg` files, archived in **`photos/originals/`**) — resized to a web size,
recompressed as progressive mozjpeg. Original filename is noted per row so the
source is traceable.

## Property layout — ground truth (confirmed by Will 2026-05-30, from floorplan)

Floorplan file: `1212 Candy Point Rd, Heathsville, VA 22473-1.png` (repo root).
On that plan, **east is up**. Orientation facts that the copy must respect:

- **Water / Hull Creek = WEST = bottom of the plan.** Sunset side. The brand's
  "west-facing sunset over the creek" lives here.
- **Driveway = EAST = top of the plan** (above the big screened porch).
- **3 bedrooms:** the two labeled on the plan **+ the SUNROOM**, which Will calls
  the **"sleeping porch"** — it is the 3rd bedroom (has a **pull-out trundle**).
- **Master** = the big bottom-right bedroom (21'0"×17'8"), **faces the water
  (west)**, next to the full bath. (NOT "morning light first" — it gets evening
  light.)
- **4 beds, sleeps 6:** master four-poster (1) + second bedroom (1) + sleeping
  porch trundle (2).
- **Kitchen is its own enclosed room** (12'8"×9'9") — NOT open-plan to the house.
- There is a **separate small indoor dining room** (8'3"×7'7") *and* a long
  dining table on the east screened porch.
- **Two screened porches:**
  - **East screened porch** (big, top of plan) faces the **DRIVEWAY**, holds the
    long dining table + pendants. → `screened-porch-dining.jpg`
  - **West wraparound back porch** (bottom-right of plan) faces the **WATER**, the
    lounge/couch porch, wraps around the SW corner. → `hero-porch-creek.jpg` +
    `extras/screened-porch-creek-view.jpg`
- **Cedar barrel sauna = NORTH side** of the house, window oriented toward the
  creek (west) for evening gold.
- **Hot tub = SOUTH side**, on the deck.
- **1.5 baths** = one full bath (tub, east/right on plan) + one WC/Laundry half
  bath (center).

## Home page slots

| Filename | Original | Slot on `/` | Subject |
|---|---|---|---|
| `hero-porch-creek.jpg` | `_07A1961.jpeg` | Hero, full-bleed | **West/water-side wraparound back porch** — rattan sofa + coffee table, ceiling fans, Hull Creek through cedar screens. The lounge porch. |
| `og-default.jpg` | `_07A1961.jpeg` | OpenGraph + Twitter (1200×630) | Same shot, cropped for social. |
| `cottage-exterior-creek.jpg` | `_07A1967.jpeg` | Gallery, large left tile | Cottage exterior with the deck Adirondack and Hull Creek beyond. |
| `stairs-to-dock.jpg` | `_07A2014.jpeg` | Gallery, right portrait | Wooden stairs descending from the bank to the dock. |
| `living-room-rattan.jpg` | `_MG_1803.jpeg` | Gallery | Living room — rattan chairs, red rug. (Will: "the living room.") |
| `screened-porch-dining.jpg` | `_mg_1995.jpeg` | Gallery | **East/front/driveway screened porch** with the long dining table. Faces the driveway, NOT the creek. |
| `kitchen-green-cabinets.jpg` | `_07A1929.jpeg` | Gallery | Kitchen (enclosed room) — green cabinets, open shelving, house manual on the counter. |
| `master-bedroom.jpg` | `_07A1727.jpeg` | Gallery | Master (water-facing) — mahogany four-poster, wicker trunk, beach painting. |
| `dock-hull-creek.jpg` | `_MG_2050.jpeg` | Gallery + VacationRental schema | Private dock into Hull Creek, sandbar mid-creek. |

## Extras (for `/the-cottage`, `/amenities`, blog heroes)

In `public/images/extras/`:

- `screened-porch-creek-view.jpg` — `_07A1956.jpeg` — the **west/water wraparound back porch**, shot standing in the carved-out SW corner (the unlabeled box bottom-right of the floorplan). Same porch as the hero, different angle.
- `second-bedroom.jpg` — `_07A1703.jpeg` — second/guest bedroom.
- `living-room-sectional.jpg` — `_07A1769.jpeg` — wider living room with sectional + sage pillows.
- `sitting-nook.jpg` — `_MG_1819.jpeg` — living-room corner / sitting nook, grey tufted chair + bird prints. (Will: "also the living room.")
- `yoga-mats.jpg` — `_MG_1998.jpeg` — yoga mats in wicker basket (amenity detail).
- `cottage-front-driveway.jpg` — `_07a2054.jpeg` — cottage front from the gravel driveway (good for the "Arriving" section).

### Pending uploads (Will, 2026-05-30)
- **Sunroom / sleeping porch (3rd bedroom)** — no photo yet; Will to upload 1–2.
  Destination slug when it lands: `extras/sleeping-porch-sunroom.jpg`.

## Adding new photos

1. Drop the original (JPEG/PNG, ~2400px on the long edge is plenty) in the repo root, `_inbox*/`, or `photos*/`.
2. Add a slot to `scripts/process-photos.mjs` (source filename → output slug + `desc`).
3. Run `node scripts/process-photos.mjs`.

To replace a slot, overwrite the source filename in the script and re-run.

## SEO conventions (brief §4)

- Descriptive, hyphenated, lowercased filenames. **No `IMG_xxxx.jpg`.**
- Alt text lives in the components/pages that render each image — update it whenever a photo is swapped. Respect the orientation facts above (don't call the driveway porch a creek view, etc.).
- Originals over ~5MB should be resized to ~2400px long edge before commit.
