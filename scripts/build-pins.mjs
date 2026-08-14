#!/usr/bin/env node
/**
 * build-pins.mjs: render 2:3 Pinterest pins from the site's own photos.
 *
 * Pinterest's format is 1000x1500. Nearly every photo we own is 3:2 landscape
 * (of 80 originals, 2 are portrait), so every pin is a crop. sharp's attention
 * strategy picks the crop window by visual salience, which beats a centre crop
 * on photos where the subject sits off-centre.
 *
 * Usage:
 *   node scripts/build-pins.mjs <slug> [--source path] [--no-text] [--force]
 *   npm run build:pins -- <slug>
 *
 * Writes:
 *   public/pins/<slug>-v{1,2,3}.jpg   the pin images
 *   content/pins/<slug>.json          manifest (merges; never clobbers copy
 *                                     the pin-writer already wrote)
 *
 * Type note: text is composited as SVG, which librsvg renders with fontconfig.
 * Fraunces ships in node_modules via @fontsource-variable and is registered at
 * runtime on Linux (see registerFonts). Where registration is not possible the
 * render falls back through Georgia to a generic serif, so a local preview on
 * Windows may not be pixel-identical to CI. The v2 pin carries no text and is
 * always identical everywhere.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PIN_W = 1000;
const PIN_H = 1500;
const QUALITY = 82;

// Design tokens, mirrored from src/styles/global.css. Keep in sync by hand;
// they change about once a year and a build-time import of CSS is not worth it.
const INK = "#1a2734";
const BONE = "#f4eee3";
const RUST = "#b8552e";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};

if (!slug) {
  console.error("usage: node scripts/build-pins.mjs <slug> [--source path] [--no-text] [--force]");
  process.exit(1);
}

/** Make Fraunces available to librsvg. No-op where fontconfig is absent. */
function registerFonts() {
  const src = path.join(ROOT, "node_modules/@fontsource-variable/fraunces/files");
  if (!fs.existsSync(src)) return false;
  const ttf = fs.readdirSync(src).find((f) => /fraunces.*normal\.woff2?$/i.test(f));
  if (!ttf) return false;
  try {
    const dir = path.join(os.homedir(), ".fonts");
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(src, ttf), path.join(dir, ttf));
    execFileSync("fc-cache", ["-f"], { stdio: "ignore" });
    return true;
  } catch {
    return false; // Windows, or no fontconfig. SVG falls back to serif.
  }
}

// Evergreen site pages are pin destinations too, and for a while they were the
// forgotten half of the inventory. Each maps to an .astro page plus the hero
// images that suit it. Keyed by the slug used on the command line.
const PAGES = {
  "what-to-bring": { file: "src/pages/what-to-bring.astro", url: "/what-to-bring/", category: "Before you come",
    images: ["/images/extras/sunset-rose-dock.jpg", "/images/dock-hull-creek.jpg", "/images/extras/screened-porch-creek-view.jpg"] },
  "getaway-guide": { file: "src/pages/getaway-guide.astro", url: "/getaway-guide/", category: "Getaway guide",
    images: ["/images/extras/aerial-cottage-dusk.jpg", "/images/extras/creek-sunset.jpg", "/images/cottage-exterior-creek.jpg"] },
  "area": { file: "src/pages/area/index.astro", url: "/area/", category: "The area",
    images: ["/images/extras/creek-sunset.jpg", "/images/extras/fire-pit-creek.jpg", "/images/stairs-to-dock.jpg"] },
  "activities": { file: "src/pages/activities/index.astro", url: "/activities/", category: "Activities",
    images: ["/images/dock-hull-creek.jpg", "/images/extras/osprey-hull-creek.jpg", "/images/extras/yoga-mats.jpg"] },
  "the-cottage": { file: "src/pages/the-cottage.astro", url: "/the-cottage/", category: "The cottage",
    images: ["/images/hero-porch-creek.jpg", "/images/extras/second-bedroom.jpg", "/images/living-room-rattan.jpg"] },
  "amenities": { file: "src/pages/amenities.astro", url: "/amenities/", category: "Amenities",
    images: ["/images/cedar-sauna-creek-sunset.jpg", "/images/hot-tub-hull-creek.jpg", "/images/kitchen-green-cabinets.jpg"] },
  "photos": { file: "src/pages/photos.astro", url: "/photos/", category: "Photos",
    images: ["/images/sleeping-porch-sunroom.jpg", "/images/screened-porch-dining.jpg", "/images/master-bedroom.jpg"] },
  "faq": { file: "src/pages/faq.astro", url: "/faq/", category: "Good to know",
    images: ["/images/extras/back-patio-hot-tub-fire-pit.jpg", "/images/dining-nook.jpg", "/images/extras/sitting-nook.jpg"] },
};

/** Read title/description out of an .astro page's frontmatter script. */
function readPage(slug) {
  const cfg = PAGES[slug];
  const p = path.join(ROOT, cfg.file);
  if (!fs.existsSync(p)) throw new Error(`no such page: ${p}`);
  const raw = fs.readFileSync(p, "utf8");
  const grab = (k) => {
    const re = new RegExp("const " + k + "\\s*=\\s*\\n?\\s*\"([\\s\\S]*?)\";");
    const m = raw.match(re);
    return m ? m[1].replace(/\s+/g, " ").trim() : "";
  };
  return {
    title: grab("title").split(" | ")[0],
    description: grab("description"),
    category: cfg.category,
    isDraft: false,
    isPage: true,
    url: cfg.url,
    body: "",
    poolOverride: cfg.images,
  };
}

/** Pull frontmatter fields we need without a YAML dependency. */
function readPost(slug) {
  const p = path.join(ROOT, "src/content/blog", `${slug}.mdx`);
  if (!fs.existsSync(p)) throw new Error(`no such post: ${p}`);
  const raw = fs.readFileSync(p, "utf8");
  const fm = raw.split("---")[1] || "";
  const get = (k) => {
    const m = fm.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, "m"));
    return m ? m[1].trim() : "";
  };
  return {
    title: get("title"),
    description: get("description"),
    hero: get("hero"),
    category: get("category"),
    isDraft: /^draft:\s*true/m.test(fm),
    body: raw,
  };
}

// Most posts reference only their hero, which would make v2 the same photo as
// v1 minus the text. These fill the remaining variants so each pin is a
// visually distinct piece of inventory. Ordered strongest first.
const FALLBACK_POOL = [
  "/images/extras/creek-sunset.jpg",
  "/images/dock-hull-creek.jpg",
  "/images/cedar-sauna-creek-sunset.jpg",
  "/images/extras/aerial-cottage-dusk.jpg",
  "/images/hot-tub-hull-creek.jpg",
  "/images/extras/screened-porch-creek-view.jpg",
  "/images/extras/fire-pit-creek.jpg",
];

/** Every local image the post points at, hero first, deduped, then the pool. */
function candidateImages(post) {
  const out = [];
  if (post.hero) out.push(post.hero);
  for (const m of post.body.matchAll(/\/images\/[\w./-]+\.(?:jpg|jpeg|png|webp)/gi)) {
    out.push(m[0]);
  }
  out.push(...FALLBACK_POOL);
  if (post.poolOverride) out.unshift(...post.poolOverride);
  const seen = new Set();
  return out
    .map((rel) => path.join(ROOT, "public", rel.replace(/^\//, "")))
    .filter((abs) => {
      if (seen.has(abs) || !fs.existsSync(abs)) return false;
      seen.add(abs);
      return true;
    });
}

const escapeXml = (s) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

/** Greedy wrap at an approximate advance width. Display type, so it is close enough. */
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Bottom scrim + title, in the site's register. */
function titleOverlay(title, eyebrow) {
  const lines = wrap(title, 20).slice(0, 4);
  const size = lines.length > 3 ? 62 : 72;
  const lh = size * 1.12;
  const blockH = lines.length * lh + 150;
  const top = PIN_H - blockH;
  const baseline = top + 118;

  const text = lines
    .map(
      (l, i) =>
        `<text x="70" y="${baseline + i * lh}" font-family="Fraunces, Georgia, serif" font-size="${size}" font-weight="600" fill="${BONE}">${escapeXml(l)}</text>`,
    )
    .join("");

  return Buffer.from(`<svg width="${PIN_W}" height="${PIN_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${INK}" stop-opacity="0"/>
      <stop offset="38%" stop-color="${INK}" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="${INK}" stop-opacity="0.93"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${top - 150}" width="${PIN_W}" height="${blockH + 150}" fill="url(#scrim)"/>
  <text x="70" y="${top + 46}" font-family="'Inter Tight', Helvetica, sans-serif" font-size="24" letter-spacing="3.5" fill="${RUST}">${escapeXml(eyebrow.toUpperCase())}</text>
  ${text}
  <rect x="70" y="${PIN_H - 74}" width="86" height="3" fill="${RUST}"/>
</svg>`);
}

const cropTo = (file) =>
  sharp(file).resize(PIN_W, PIN_H, { fit: "cover", position: sharp.strategy.attention });

async function main() {
  const fontsOk = registerFonts();
  const post = PAGES[slug] ? readPage(slug) : readPost(slug);

  if (post.isDraft && !flag("force")) {
    console.error(
      `refusing: ${slug} is draft:true, so it has no live URL and a pin would 404.\n` +
        `pass --force only to preview renders.`,
    );
    process.exit(2);
  }

  const override = opt("source");
  const images = override ? [path.resolve(override)] : candidateImages(post);
  if (!images.length) throw new Error(`no usable source images found for ${slug}`);

  const outDir = path.join(ROOT, "public/pins");
  fs.mkdirSync(outDir, { recursive: true });

  const sources = {};
  const written = [];

  // v1, title overlay on the strongest image.
  const v1 = `${slug}-v1.jpg`;
  const base = cropTo(images[0]);
  await (flag("no-text")
    ? base
    : base.composite([{ input: titleOverlay(post.title, post.category || "Journal") }])
  )
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(path.join(outDir, v1));
  sources[`${slug}-v1`] = path.relative(ROOT, images[0]);
  written.push(v1);

  // v2, clean photo, no text. Identical on every platform.
  const v2src = images[1] || images[0];
  const v2 = `${slug}-v2.jpg`;
  await cropTo(v2src).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(path.join(outDir, v2));
  sources[`${slug}-v2`] = path.relative(ROOT, v2src);
  written.push(v2);

  // v3, vertical split, for posts whose subject is a contrast. Needs 2 images.
  if (images.length > 1) {
    const half = Math.round(PIN_H / 2);
    const [a, b] = await Promise.all(
      [images[0], images[1]].map((f) =>
        sharp(f).resize(PIN_W, half, { fit: "cover", position: sharp.strategy.attention }).toBuffer(),
      ),
    );
    const v3 = `${slug}-v3.jpg`;
    await sharp({ create: { width: PIN_W, height: PIN_H, channels: 3, background: INK } })
      .composite([
        { input: a, top: 0, left: 0 },
        { input: b, top: half, left: 0 },
        { input: Buffer.from(`<svg width="${PIN_W}" height="6"><rect width="${PIN_W}" height="6" fill="${BONE}"/></svg>`), top: half - 3, left: 0 },
      ])
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(path.join(outDir, v3));
    sources[`${slug}-v3`] = `${path.relative(ROOT, images[0])} + ${path.relative(ROOT, images[1])}`;
    written.push(v3);
  }

  // Manifest. Merge so pin copy already written by the pin-writer survives.
  const manifestPath = path.join(ROOT, "content/pins", `${slug}.json`);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const prev = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  const manifest = {
    ...prev,
    slug,
    postUrl: `https://captainscottageva.com${post.isPage ? post.url : `/journal/${slug}/`}`,
    renderedAt: new Date().toISOString(),
    sources,
    pins: prev.pins || [],
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`rendered ${written.length} pins for ${slug}:`);
  written.forEach((f) => console.log(`  public/pins/${f}`));
  console.log(`manifest: content/pins/${slug}.json`);
  if (!fontsOk && !flag("no-text")) {
    console.log("note: Fraunces not registered with fontconfig here, v1 fell back to a system serif.");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
