#!/usr/bin/env node
/**
 * indexnow-submit.mjs — pings the IndexNow API with the site's canonical
 * URLs so Bing / Copilot (and other IndexNow participants) recrawl on
 * publish instead of waiting for a scheduled crawl.
 *
 * IndexNow keys are public ownership tokens, not secrets: the key is hosted
 * at https://<host>/<key>.txt and echoed in the request. Run from
 * .github/workflows/indexnow.yml after content changes land on main.
 *
 * Submits: the core evergreen pages + every PUBLISHED (draft:false) journal
 * post. Drafts are excluded so we never announce an unpublished URL.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const HOST = "captainscottageva.com";
const ORIGIN = `https://${HOST}`;
const KEY = "a9f4c7e21b8d40539c6e1f0a7b3d5e82";
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

// Core evergreen pages (always live).
const corePaths = [
  "/",
  "/the-cottage",
  "/amenities",
  "/area/",
  "/activities/",
  "/getaway-guide",
  "/photos",
  "/faq",
  "/what-to-bring",
  "/journal/",
];

// Published journal posts (draft:false only).
const blogDir = resolve(process.cwd(), "src/content/blog");
const postPaths = [];
try {
  for (const f of readdirSync(blogDir).filter((f) => f.endsWith(".mdx"))) {
    const fm = readFileSync(join(blogDir, f), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    if (/^draft:\s*false\s*$/m.test(fm[1])) {
      postPaths.push(`/journal/${f.replace(/\.mdx$/, "")}`);
    }
  }
} catch {}

const urlList = [...corePaths, ...postPaths].map((p) => ORIGIN + p);

console.log(`IndexNow: submitting ${urlList.length} URLs (${postPaths.length} published posts).`);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});

// IndexNow returns 200 or 202 on success; log and don't fail the build on a
// transient non-2xx (the next publish will re-submit anyway).
console.log(`IndexNow responded: ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) {
  console.log("Non-success status — not fatal; URLs will be re-submitted on the next change.");
}
