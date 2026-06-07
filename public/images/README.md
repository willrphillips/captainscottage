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

**Full refresh 2026-06-07:** all slugs below are regenerated from the
professional shoot `_inbox/20260619LDPhillipsRiverHome-*.jpg` (frame # in the
Original column). Originals live in `_inbox/` (gitignored — not committed; full
-res copies stay in Will's Dropbox for the Airbnb listing). Earlier shoot frames
(`_07A*`, `_MG_*`) are retired.

| Filename | Frame | Slot on `/` | Subject |
|---|---|---|---|
| `hero-porch-creek.jpg` (+ `-768/-1280/-1920/-2400.webp`) | `#111` | Hero, full-bleed | **Water-side screened porch** looking out to Hull Creek through the screens. |
| `og-default.jpg` | `#111` | OpenGraph + Twitter (1200×630) | Hero, cropped for social. |
| `cottage-exterior-creek.jpg` | `#87` | Gallery / the-cottage | Cottage exterior with Hull Creek opening up beside it. |
| `stairs-to-dock.jpg` | `#90` | Gallery, right portrait | Wooden stairs descending to the dock at golden hour. |
| `living-room-rattan.jpg` | `#155` | Gallery / the-cottage | Living room — grey sofa, rattan armchairs, vintage rug, framed landscape. |
| `screened-porch-dining.jpg` | `#70` | Gallery / the-cottage | **East/driveway screened porch** with the long dining table + benches. |
| `kitchen-green-cabinets.jpg` | `#3` | Gallery / the-cottage | Kitchen — green cabinets, open shelving, brass faucet, window over sink. |
| `master-bedroom.jpg` | `#54` | Gallery / the-cottage | Master (water-facing) — four-poster, wicker trunk, ensuite beyond. |
| `dock-hull-creek.jpg` | `#95` | Gallery + VacationRental schema | Private dock reaching into Hull Creek, far shore beyond. |
| `cedar-sauna-creek-sunset.jpg` | `#79` | Gallery / the-cottage / blog | Cedar barrel sauna outside, door open, creek + treeline behind. |
| `cedar-sauna-window.jpg` | `#159` | the-cottage | ★ Inside the sauna, round window onto the creek at sunset. |
| `hot-tub-hull-creek.jpg` | `#73` | Gallery / the-cottage | Hot tub + paver fire-pit circle, Hull Creek beyond, golden hour. |
| `dining-nook.jpg` | `#160` | the-cottage | Breakfast nook off the kitchen — round table, banquette, pendant. |
| `sleeping-porch-sunroom.jpg` | `#add-5` | the-cottage | Sleeping porch / sunroom (3rd bedroom) — brass daybed + trundle. |

## Extras (for `/the-cottage`, `/amenities`, blog heroes)

In `public/images/extras/`:

- `second-bedroom.jpg` — `#22` — second/guest bedroom, upholstered headboard + sconces.
- `screened-porch-creek-view.jpg` — `#112` — **water-side wraparound porch**, creek view (hero porch, different angle).
- `back-patio-hot-tub-fire-pit.jpg` — `#100` — back patio: hot tub + fire-pit circle + Adirondacks, cottage behind.
- `fire-pit-creek.jpg` — `#74` — fire-pit circle with Adirondacks and a kayak on the lawn.
- `creek-sunset.jpg` — `#206` — ★ sunset over Hull Creek, oak silhouette (seasonal/blog hero).
- `aerial-cottage-dusk.jpg` — `#dji` — aerial of the cottage + lit sauna at dusk (establishing/blog).
- `osprey-hull-creek.jpg` — `#167` — osprey in a creekside tree (wildlife blog hero).
- `sunset-rose-dock.jpg` — `#168` — two glasses of rosé on the dock at sunset (lifestyle/blog).
- `cottage-front-driveway.jpg` — *(retained from earlier shoot)* — cottage front from the gravel driveway.

Retired (earlier shoot, still on disk, unreferenced): `living-room-sectional.jpg`,
`sitting-nook.jpg`, `yoga-mats.jpg`.

## Adding new photos

1. Drop the original (JPEG/PNG) in `_inbox/` (gitignored) or `photos/`.
2. Add a slot to `scripts/process-photos.mjs` (source path → output slug + `desc`).
   A slot `src` may be a full repo-relative path, e.g. `_inbox/<file>.jpg`.
3. Run `node scripts/process-photos.mjs`.

To replace a slot, overwrite the source filename in the script and re-run.

## SEO conventions (brief §4)

- Descriptive, hyphenated, lowercased filenames. **No `IMG_xxxx.jpg`.**
- Alt text lives in the components/pages that render each image — update it whenever a photo is swapped. Respect the orientation facts above (don't call the driveway porch a creek view, etc.).
- Originals over ~5MB should be resized to ~2400px long edge before commit.
