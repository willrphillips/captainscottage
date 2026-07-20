#!/usr/bin/env node
/**
 * auto-publish.mjs — flips `draft: true` to `draft: false` on any blog
 * post that is:
 *   - currently a draft (`draft: true`)
 *   - has been Will-approved (`approvedAt` present in frontmatter)
 *   - has reached or passed its `publishedAt` date (UTC midnight)
 *
 * Run from .github/workflows/auto-publish.yml on a daily cron. Pure Node,
 * no dependencies beyond the standard library. Idempotent — running it
 * twice is harmless; nothing flips a second time.
 *
 * If anything flips, the workflow that called this script commits the
 * change and triggers the existing deploy workflow.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const blogDir = resolve(process.cwd(), "src/content/blog");
// `today` is UTC date-only so the comparison with `publishedAt: YYYY-MM-DD`
// is stable regardless of where the runner happens to live. `nowTime` is
// UTC "HH:MM" for the optional per-post `publishTime` gate — the Editor
// picks a time-of-day slot per post; the cron runs several times a day.
const now = new Date().toISOString();
const today = now.slice(0, 10);
const nowTime = now.slice(11, 16);
let flippedCount = 0;
const flippedSlugs = [];
const log = [];

for (const f of readdirSync(blogDir).filter((f) => f.endsWith(".mdx"))) {
  const path = join(blogDir, f);
  const raw = readFileSync(path, "utf8");
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fmBlock = fmMatch[1];
  const after = raw.slice(fmMatch[0].length);

  const isDraft = /^draft:\s*true\s*$/m.test(fmBlock);
  const hasApproved = /^approvedAt:\s*/m.test(fmBlock);
  const publishedMatch = fmBlock.match(/^publishedAt:\s*(\d{4}-\d{2}-\d{2})/m);

  if (!isDraft || !hasApproved || !publishedMatch) continue;
  const publishedAt = publishedMatch[1];
  // String compare is fine for ISO-prefixed dates.
  if (publishedAt > today) continue;
  // Optional time-of-day gate: `publishTime: "HH:MM"` (UTC). Only applies
  // on the publish date itself — an overdue post flips on the next run
  // regardless. Absent publishTime keeps the old date-only behavior.
  const timeMatch = fmBlock.match(/^publishTime:\s*"?(\d{2}:\d{2})"?/m);
  if (publishedAt === today && timeMatch && timeMatch[1] > nowTime) continue;

  const newFmBlock = fmBlock.replace(/^draft:\s*true\s*$/m, "draft: false");
  writeFileSync(path, `---\n${newFmBlock}\n---${after}`, "utf8");
  flippedCount++;
  flippedSlugs.push(f.replace(/\.mdx$/, ""));
  log.push(`${f}  draft:true → draft:false  (publishedAt ${publishedAt})`);
}

if (flippedCount === 0) {
  console.log(`auto-publish: no eligible posts (today ${today}).`);
} else {
  console.log(`auto-publish: flipped ${flippedCount} post(s) (today ${today}):`);
  for (const line of log) console.log("  " + line);
}

// Emit GITHUB_OUTPUT so the workflow can branch on whether anything changed.
// `slugs` feeds the newsletter step (space-separated, no .mdx extension).
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `flipped=${flippedCount}\nslugs=${flippedSlugs.join(" ")}\n`,
    { flag: "a" },
  );
}
