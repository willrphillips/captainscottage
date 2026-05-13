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

// Resolve a source filename by trying the three places photos landed.
async function locate(filename) {
  for (const dir of ["_inbox**", "photos**", "."]) {
    const path = join(root, dir, filename);
    try {
      await access(path, constants.R_OK);
      return path;
    } catch {}
  }
  throw new Error(`Could not find ${filename} in _inbox**/, photos**/, or root`);
}

// Slot list — mirrors public/images/README.md exactly.
const slots = [
  {
    src: "_07A1961.jpeg",
    dest: "hero-porch-creek.jpg",
    maxLong: 2400,
    quality: 78,
    desc: "Hero — rattan lounge porch with creek view",
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
    desc: "Wooden dining table on the screened porch",
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
];

await mkdir(outDir, { recursive: true });
await mkdir(join(outDir, "extras"), { recursive: true });

for (const slot of slots) {
  const srcPath = await locate(slot.src);
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
  console.log(
    `  ✓ ${slot.dest.padEnd(42)} ${(out.length / 1024).toFixed(0).padStart(5)} KB   ${slot.desc}`
  );
}

console.log(`\nWrote ${slots.length} optimized JPEGs to public/images/.`);
