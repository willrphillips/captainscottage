// One-shot photo processor: takes the uploaded originals from _inbox/,
// photos**/, and the repo root, resizes to a sensible web size, recompresses
// as progressive JPEG (or WebP for the hero variants), and writes to
// public/images/ with SEO-friendly slugs.
//
// Run: node scripts/process-photos.mjs
//
// 2026-06 full refresh: slugs now map to the professional shoot in _inbox/
// (20260619LDPhillipsRiverHome-*.jpg). Originals stay local (gitignored);
// only the optimized outputs below are committed. Source frame noted per slot.

import sharp from "sharp";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const outDir = join(root, "public", "images");

// Resolve a source filename by trying the places originals may live.
async function locate(filename) {
  // A slot `src` may be a full path relative to the repo root
  // (e.g. "_inbox/20260619LDPhillipsRiverHome-111.jpg") — try that first.
  try {
    const direct = join(root, filename);
    await access(direct, constants.R_OK);
    return direct;
  } catch {}
  for (const dir of ["_inbox", "photos/originals", "photos", "."]) {
    const path = join(root, dir, filename);
    try {
      await access(path, constants.R_OK);
      return path;
    } catch {}
  }
  throw new Error(`Could not find ${filename} (tried direct path, _inbox, photos/originals, photos, root)`);
}

// New shoot lives here; helper keeps the slot list readable.
const SHOOT = "_inbox/20260619LDPhillipsRiverHome";
const f = (n) => `${SHOOT}-${n}.jpg`;

// Slot list — mirrors public/images/README.md. ★ = standout frame.
const slots = [
  // ---- HERO (frame #111 — water-side screened porch looking out to the creek)
  { src: f(111), dest: "hero-porch-creek.jpg", maxLong: 2400, quality: 78,
    desc: "Hero ★ — water-side screened porch, Hull Creek through the screens" },
  { src: f(111), dest: "og-default.jpg", width: 1200, height: 630, fit: "cover", quality: 80,
    desc: "OpenGraph / Twitter card (from hero)" },
  // Responsive WebP hero variants — served via <picture> srcset in Hero.astro.
  { src: f(111), dest: "hero-porch-creek-768.webp", maxLong: 768, quality: 72, format: "webp",
    desc: "Hero WebP — mobile (768w)" },
  { src: f(111), dest: "hero-porch-creek-1280.webp", maxLong: 1280, quality: 72, format: "webp",
    desc: "Hero WebP — tablet (1280w)" },
  { src: f(111), dest: "hero-porch-creek-1920.webp", maxLong: 1920, quality: 72, format: "webp",
    desc: "Hero WebP — desktop (1920w)" },
  { src: f(111), dest: "hero-porch-creek-2400.webp", maxLong: 2400, quality: 72, format: "webp",
    desc: "Hero WebP — large/retina (2400w)" },

  // ---- HOME GALLERY + THE COTTAGE main slugs ------------------------------
  { src: f(95), dest: "dock-hull-creek.jpg", maxLong: 2400, quality: 76,
    desc: "Private dock reaching into Hull Creek, far shoreline beyond" },
  { src: f(90), dest: "stairs-to-dock.jpg", maxLong: 2400, quality: 76,
    desc: "★ Wooden stairs descending to the dock at golden hour" },
  { src: f(87), dest: "cottage-exterior-creek.jpg", maxLong: 2400, quality: 76,
    desc: "Cottage exterior with Hull Creek opening up beside it" },
  { src: f(79), dest: "cedar-sauna-creek-sunset.jpg", maxLong: 2400, quality: 76,
    desc: "Cedar barrel sauna outside, creek + treeline behind, evening light" },
  { src: f(159), dest: "cedar-sauna-window.jpg", maxLong: 2400, quality: 76,
    desc: "★ Inside the cedar sauna looking out the round window to the creek at sunset" },
  { src: f(73), dest: "hot-tub-hull-creek.jpg", maxLong: 2400, quality: 76,
    desc: "Hot tub and fire pit on the patio, Hull Creek beyond at golden hour" },
  { src: f(70), dest: "screened-porch-dining.jpg", maxLong: 2400, quality: 76,
    desc: "Screened porch with the long wooden dining table" },
  { src: f(3), dest: "kitchen-green-cabinets.jpg", maxLong: 2400, quality: 76,
    desc: "Kitchen — deep-green cabinets, open shelving, brass faucet, window over sink" },
  { src: f(155), dest: "living-room-rattan.jpg", maxLong: 2400, quality: 76,
    desc: "Living room — grey sofa, rattan chairs, vintage rug, soft lamplight" },
  { src: f(54), dest: "master-bedroom.jpg", maxLong: 2400, quality: 76,
    desc: "Master bedroom — mahogany four-poster, wicker trunk, ensuite beyond" },
  { src: f(160), dest: "dining-nook.jpg", maxLong: 2400, quality: 76,
    desc: "Breakfast nook off the kitchen — round table, banquette, pendant" },
  { src: f("add-5"), dest: "sleeping-porch-sunroom.jpg", maxLong: 2400, quality: 76,
    desc: "Sleeping porch / sunroom (3rd bedroom) — brass daybed + trundle, three walls of windows" },

  // ---- EXTRAS (the-cottage + future amenities/blog) -----------------------
  { src: f(22), dest: "extras/second-bedroom.jpg", maxLong: 2000, quality: 76,
    desc: "Second bedroom — upholstered headboard, sconces, soft light" },
  { src: f(112), dest: "extras/screened-porch-creek-view.jpg", maxLong: 2000, quality: 76,
    desc: "Water-side wraparound screened porch, looking west across Hull Creek" },
  { src: f(100), dest: "extras/back-patio-hot-tub-fire-pit.jpg", maxLong: 2400, quality: 76,
    desc: "Back patio — hot tub, paver fire-pit circle with Adirondacks, the cottage behind" },
  { src: f(74), dest: "extras/fire-pit-creek.jpg", maxLong: 2000, quality: 76,
    desc: "Fire-pit circle with Adirondack chairs and a kayak on the lawn" },
  { src: f(206), dest: "extras/creek-sunset.jpg", maxLong: 2400, quality: 76,
    desc: "★ Sunset over Hull Creek, oak silhouette (seasonal/blog)" },
  { src: f("dji"), dest: "extras/aerial-cottage-dusk.jpg", maxLong: 2400, quality: 76,
    desc: "Aerial of the cottage + lit sauna at dusk (establishing/blog)" },
  { src: f(167), dest: "extras/osprey-hull-creek.jpg", maxLong: 2000, quality: 76,
    desc: "Osprey perched in a creekside tree over the water (wildlife/blog)" },
  { src: f(168), dest: "extras/sunset-rose-dock.jpg", maxLong: 2000, quality: 76,
    desc: "Two glasses of rosé on the dock at sunset (lifestyle/blog)" },
];

await mkdir(outDir, { recursive: true });
await mkdir(join(outDir, "extras"), { recursive: true });

let wrote = 0;
let skipped = 0;
for (const slot of slots) {
  let srcPath;
  try {
    srcPath = await locate(slot.src);
  } catch {
    console.log(`  – ${slot.dest.padEnd(42)}  (source ${slot.src} not present — skipped)`);
    skipped++;
    continue;
  }
  const buf = await readFile(srcPath);
  let pipeline = sharp(buf).rotate();

  if (slot.width && slot.height) {
    pipeline = pipeline.resize({
      width: slot.width,
      height: slot.height,
      fit: slot.fit ?? "cover",
      position: "attention",
      withoutEnlargement: true,
    });
  } else if (slot.maxLong) {
    const meta = await sharp(buf).metadata();
    const isPortrait = (meta.height ?? 0) > (meta.width ?? 0);
    pipeline = pipeline.resize({
      width: isPortrait ? undefined : slot.maxLong,
      height: isPortrait ? slot.maxLong : undefined,
      withoutEnlargement: true,
    });
  }

  const out =
    slot.format === "webp"
      ? await pipeline.webp({ quality: slot.quality }).toBuffer()
      : await pipeline
          .jpeg({
            quality: slot.quality,
            mozjpeg: true,
            progressive: true,
            chromaSubsampling: "4:2:0",
          })
          .toBuffer();

  const outPath = join(outDir, slot.dest);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, out);
  wrote++;
  console.log(
    `  ✓ ${slot.dest.padEnd(42)} ${(out.length / 1024).toFixed(0).padStart(5)} KB   ${slot.desc}`
  );
}

console.log(`\nWrote ${wrote} optimized files to public/images/ (${skipped} skipped — sources not present).`);
