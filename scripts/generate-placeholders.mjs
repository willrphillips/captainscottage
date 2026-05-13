// Generates atmospheric Northern Neck-palette placeholder JPEGs into
// public/images/ at the exact filenames the home page references. Run with:
//   node scripts/generate-placeholders.mjs
// Real photos overwrite these one-for-one tomorrow — no code changes needed.

import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images");

// Design tokens (mirror src/styles/global.css @theme)
const C = {
  bone: "#f4eee3",
  boneDeep: "#ebe2d1",
  ink: "#1a2734",
  inkSoft: "#2d3a47",
  navy: "#16283d",
  rust: "#b8552e",
  rustDeep: "#8f3d1d",
  sage: "#5a6a52",
  sand: "#d9c9a8",
};

// A subtle SVG noise overlay to break the digital flatness
const noiseDef = `
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.13  0 0 0 0 0.17  0 0 0 0.18 0"/>
  </filter>
`;

/** Returns an SVG string for a horizontal multi-stop linear gradient + optional features. */
function compose({ w, h, stops, horizonY, horizonColor, sunCx, sunCy, sunR, sunColor, marshBands, frame }) {
  const gradientStops = stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("");
  const horizon = horizonY != null
    ? `<line x1="0" y1="${horizonY}" x2="${w}" y2="${horizonY}" stroke="${horizonColor || C.ink}" stroke-width="${Math.max(1, h * 0.0015)}" stroke-opacity="0.35"/>`
    : "";
  const sun = sunR
    ? `<circle cx="${sunCx}" cy="${sunCy}" r="${sunR}" fill="${sunColor || C.rust}" opacity="0.92"/>
       <circle cx="${sunCx}" cy="${sunCy}" r="${sunR * 1.6}" fill="${sunColor || C.rust}" opacity="0.18"/>`
    : "";
  const marsh = (marshBands || [])
    .map(({ y, color, opacity }) => `<rect x="0" y="${y}" width="${w}" height="${Math.max(2, h * 0.004)}" fill="${color}" opacity="${opacity ?? 0.35}"/>`)
    .join("");
  const frameRect = frame
    ? `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${frame.color}" stroke-width="${frame.width}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${gradientStops}</linearGradient>
    ${noiseDef}
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${marsh}
  ${horizon}
  ${sun}
  ${frameRect}
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.55"/>
</svg>`;
}

const slots = [
  {
    file: "hero-cottage-sunset.jpg",
    w: 2400, h: 1500, mood: "sunset over Hull Creek",
    stops: [
      ["0%", C.ink],
      ["30%", C.inkSoft],
      ["55%", C.rustDeep],
      ["70%", C.rust],
      ["82%", C.sand],
      ["100%", C.navy],
    ],
    horizonY: 1500 * 0.7, horizonColor: C.ink,
    sunCx: 2400 * 0.78, sunCy: 1500 * 0.66, sunR: 90, sunColor: C.rust,
  },
  {
    file: "og-default.jpg",
    w: 1200, h: 630, mood: "sunset, social card",
    stops: [
      ["0%", C.ink],
      ["35%", C.inkSoft],
      ["60%", C.rustDeep],
      ["75%", C.rust],
      ["88%", C.sand],
      ["100%", C.navy],
    ],
    horizonY: 630 * 0.7, horizonColor: C.ink,
    sunCx: 1200 * 0.78, sunCy: 630 * 0.66, sunR: 40, sunColor: C.rust,
  },
  {
    file: "dock-sunset-creek.jpg",
    w: 1920, h: 2400, mood: "dock at golden hour, portrait",
    stops: [
      ["0%", C.sand],
      ["18%", C.rust],
      ["32%", C.rustDeep],
      ["46%", C.inkSoft],
      ["72%", C.navy],
      ["100%", C.ink],
    ],
    horizonY: 2400 * 0.32, horizonColor: C.ink,
    sunCx: 1920 * 0.62, sunCy: 2400 * 0.22, sunR: 70, sunColor: C.rust,
  },
  {
    file: "cottage-exterior-creek.jpg",
    w: 2400, h: 1800, mood: "cottage exterior with creek and marsh",
    stops: [
      ["0%", C.inkSoft],
      ["28%", C.navy],
      ["52%", C.sage],
      ["72%", C.boneDeep],
      ["100%", C.navy],
    ],
    horizonY: 1800 * 0.52, horizonColor: C.ink,
    marshBands: [
      { y: 1800 * 0.74, color: C.sage, opacity: 0.5 },
      { y: 1800 * 0.78, color: C.ink, opacity: 0.35 },
      { y: 1800 * 0.82, color: C.sage, opacity: 0.3 },
    ],
  },
  {
    file: "sauna-cedar-window.jpg",
    w: 2400, h: 1800, mood: "cedar sauna interior, window on creek",
    stops: [
      ["0%", C.rustDeep],
      ["35%", C.rust],
      ["65%", "#a04822"],
      ["100%", C.ink],
    ],
    // No horizon — the "window" is rendered as the frame
    frame: { color: C.bone, width: 6 },
  },
  {
    file: "screened-porch-dining.jpg",
    w: 2400, h: 1600, mood: "screened porch over the creek",
    stops: [
      ["0%", C.bone],
      ["40%", C.boneDeep],
      ["62%", C.sage],
      ["80%", C.navy],
      ["100%", C.ink],
    ],
    horizonY: 1600 * 0.7, horizonColor: C.ink,
    marshBands: [
      { y: 1600 * 0.74, color: C.sage, opacity: 0.4 },
      { y: 1600 * 0.78, color: C.ink, opacity: 0.3 },
    ],
  },
  {
    file: "hot-tub-deck.jpg",
    w: 2400, h: 1600, mood: "hot tub deck at sunset",
    stops: [
      ["0%", C.inkSoft],
      ["28%", C.navy],
      ["50%", C.rustDeep],
      ["62%", C.rust],
      ["78%", C.boneDeep],
      ["100%", "#8a7e64"],
    ],
    horizonY: 1600 * 0.62, horizonColor: C.ink,
    sunCx: 2400 * 0.82, sunCy: 1600 * 0.55, sunR: 50, sunColor: C.rust,
  },
  {
    file: "master-bedroom.jpg",
    w: 2400, h: 1600, mood: "master bedroom, soft morning light",
    stops: [
      ["0%", C.bone],
      ["35%", C.boneDeep],
      ["68%", C.sand],
      ["88%", C.sage],
      ["100%", C.inkSoft],
    ],
  },
  {
    file: "private-beach-shallow.jpg",
    w: 1920, h: 2400, mood: "private beach, shallow water, portrait",
    stops: [
      ["0%", C.sage],
      ["18%", C.navy],
      ["38%", C.inkSoft],
      ["55%", C.sand],
      ["80%", C.boneDeep],
      ["100%", C.bone],
    ],
    horizonY: 2400 * 0.38, horizonColor: C.ink,
    marshBands: [
      { y: 2400 * 0.18, color: C.sage, opacity: 0.4 },
      { y: 2400 * 0.22, color: C.ink, opacity: 0.3 },
    ],
  },
];

await mkdir(outDir, { recursive: true });

for (const s of slots) {
  const svg = compose(s);
  const buf = await sharp(Buffer.from(svg))
    .jpeg({ quality: 78, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const out = join(outDir, s.file);
  await writeFile(out, buf);
  console.log(`  ✓ ${s.file}  (${(buf.length / 1024).toFixed(0)} KB)  — ${s.mood}`);
}

console.log(`\nWrote ${slots.length} placeholder JPEGs to public/images/.`);
console.log(`Replace any of them tomorrow by overwriting the same filename.`);
