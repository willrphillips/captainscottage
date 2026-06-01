// One-shot photo processor: takes the uploaded originals from _inbox**/,
// photos**/, and the repo root, resizes to a sensible web size, recompresses
// as progressive JPEG, and writes to public/images/ with SEO-friendly slugs.
//
// Run: node scripts/process-photos.mjs

import sharp from "sharp";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const outDir = join(root, "public", "images");

// Resolve a source filename by trying the places originals may live.
// `photos/originals` is the tidy archive; the legacy glob-ish names and
// root are kept for back-compat with earlier uploads.
async function locate(filename) {
  // Allow a slot `src` to be a full path relative to the repo root
  // (e.g. "additional images/sunroom/_07A1855.jpg") — try that first.
  try {
    const direct = join(root, filename);
    await access(direct, constants.R_OK);
    return direct;
  } catch {}
  for (const dir of ["photos/originals", "photos", "_inbox**", "photos**", "."]) {
    const path = join(root, dir, filename);
    try {
      await access(path, constants.R_OK);
      return path;
    } catch {}
  }
  throw new Error(`Could not find ${filename} (tried direct path, photos/originals, photos, root)`);
}

// Slot list — mirrors public/images/README.md exactly.
const slots = [
  {
    src: "_07A1961.jpeg",
    dest: "hero-porch-creek.jpg",
    maxLong: 2400,
    quality: 78,
    desc: "Hero — WEST/water-side wraparound back porch (lounge, creek view)",
  },
  {
    src: "_07A1961.jpeg",
    dest: "og-default.jpg",
    width: 1200,
    height: 630,
    fit: "cover",
    quality: 80,
    desc: "OpenGraph / Twitter card",
  },
  {
    src: "_MG_2050.jpeg",
    dest: "dock-hull-creek.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Dock with sandbar on Hull Creek",
  },
  {
    src: "_07A1967.jpeg",
    dest: "cottage-exterior-creek.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "Cottage exterior with creek visible",
  },
  {
    src: "_MG_1803.jpeg",
    dest: "living-room-rattan.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "Living room — rattan chairs, red rug, dining nook",
  },
  {
    src: "_mg_1995.jpeg",
    dest: "screened-porch-dining.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "EAST/front/driveway screened porch — long dining table (faces driveway, NOT creek)",
  },
  {
    src: "_07A1929.jpeg",
    dest: "kitchen-green-cabinets.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "Kitchen — green cabinets, open shelving, Captain's Cottage sign",
  },
  {
    src: "_07A1727.jpeg",
    dest: "master-bedroom.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "Master bedroom — four-poster bed, wicker trunk, beach painting",
  },
  {
    src: "_07A2014.jpeg",
    dest: "stairs-to-dock.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Wooden stairs descending to the dock and Hull Creek",
  },

  // Bonus shots — saved for the cottage / amenity pages in later phases.
  {
    src: "_07A1956.jpeg",
    dest: "extras/screened-porch-creek-view.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Empty screened porch with creek view (extra)",
  },
  {
    src: "_07A1703.jpeg",
    dest: "extras/second-bedroom.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Second bedroom (extra)",
  },
  {
    src: "_07A1769.jpeg",
    dest: "extras/living-room-sectional.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Living room with sectional and sage pillows (extra)",
  },
  {
    src: "_MG_1819.jpeg",
    dest: "extras/sitting-nook.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Sitting nook with grey tufted chair (extra)",
  },
  {
    src: "_MG_1998.jpeg",
    dest: "extras/yoga-mats.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Yoga mats in wicker basket (extra)",
  },
  {
    src: "_07a2054.jpeg",
    dest: "extras/cottage-front-driveway.jpg",
    maxLong: 2000,
    quality: 76,
    desc: "Cottage front from gravel driveway (extra)",
  },

  // Added 2026-05-30 from the room-organized "additional images/" set.
  {
    src: "additional images/sunroom/_07A1855.jpg",
    dest: "sleeping-porch-sunroom.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "Sleeping porch / sunroom (3rd bedroom) — brass daybed + trundle, windows on three sides",
  },
  {
    src: "additional images/indoordiningroom/_07A1938.jpg",
    dest: "dining-nook.jpg",
    maxLong: 2400,
    quality: 76,
    desc: "Indoor dining nook off the kitchen — round table, banquette bench, pendant",
  },
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
    // Many first-run originals were cleaned up after processing; their
    // outputs already live in public/images/. Skip rather than abort so
    // newly-added slots still process.
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

  const out = await pipeline
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

console.log(`\nWrote ${wrote} optimized JPEGs to public/images/ (${skipped} skipped — sources already consumed).`);
