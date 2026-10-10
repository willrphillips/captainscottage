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
const stale = [];

// How far a post's date may sit from the derived date before it is held back.
// 21 days is deliberately loose: the point is to catch a post whose season
// moved or whose draft sat for a quarter, not to argue about a few days.
const DRIFT_TOLERANCE_DAYS = 21;

/**
 * How many days a post's publishedAt differs from what the season model
 * derives for it, or null when the question does not apply.
 *
 * Returns null, meaning "do not block", when: the post carries no `season:`
 * key, the season is `evergreen`, the model is missing or unreadable, or the
 * season's own derived date has already passed (the model's rule in that case
 * is "publish as soon as the draft is clean", so any date is defensible).
 * A guard that cannot read its own inputs must let the post through rather
 * than silently hold the whole queue.
 */
function seasonDriftDays(fmBlock, publishedAt) {
  const key = (fmBlock.match(/^season:\s*"?([\w-]+)"?/m) || [])[1];
  if (!key || key === "evergreen") return null;
  let model;
  try {
    model = JSON.parse(readFileSync(join(process.cwd(), "content/season-model.json"), "utf8"));
  } catch { return null; }
  const season = (model.seasons || []).find((s) => s.key === key);
  if (!season || !season.seasonStart) return null;
  const runway = Number(model.rule?.pinterestRunwayDays ?? 45);
  const lead = Number(season.bookingLeadDays);
  if (!Number.isFinite(lead)) return null;

  // The occurrence that matters is the next one whose SEASON START is still
  // ahead. Keying off the derived date instead rolls a whole year forward the
  // moment the publish window closes, which would push a post for the
  // imminent season into the next one. That bug was caught by hand while
  // re-deriving these dates; it is the reason this comment exists.
  const [mm, dd] = season.seasonStart.split("-").map(Number);
  const now = new Date(`${today}T00:00:00Z`);
  let start = null;
  for (let y = now.getUTCFullYear(); y <= now.getUTCFullYear() + 2; y++) {
    const cand = new Date(Date.UTC(y, mm - 1, dd));
    if (cand > now) { start = cand; break; }
  }
  if (!start) return null;
  const derived = new Date(start.getTime() - (lead + runway) * 86400000);
  if (derived < now) return null;   // "publish when clean"; nothing to enforce
  return Math.round((new Date(`${publishedAt}T00:00:00Z`) - derived) / 86400000);
}

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

  // SEASON GUARD, added 2026-10-10 at Will's direction: "Remember we need to
  // rerun the dates on the blog posts before they go live."
  //
  // Dates are derived from content/season-model.json, and the model moves: it
  // was corrected three times on the day it was written. A draft approved
  // weeks ago can therefore carry a date the rule no longer produces, and the
  // failure is silent, because nothing here ever looked at the model.
  //
  // This is the last gate before a post is public, which is why the check sits
  // here rather than at approval: approval can happen months before the flip,
  // and the model can move in between. A stale post is SKIPPED, not published,
  // and the skip is loud. It never auto-corrects the date; a human decides
  // whether the season or the post changed.
  const staleness = seasonDriftDays(fmBlock, publishedAt);
  if (staleness !== null && Math.abs(staleness) > DRIFT_TOLERANCE_DAYS) {
    stale.push(`${f}: publishedAt ${publishedAt} is ${staleness > 0 ? staleness + " days later" : -staleness + " days earlier"} than the season model derives. NOT published.`);
    continue;
  }

  const newFmBlock = fmBlock.replace(/^draft:\s*true\s*$/m, "draft: false");
  writeFileSync(path, `---\n${newFmBlock}\n---${after}`, "utf8");
  flippedCount++;
  flippedSlugs.push(f.replace(/\.mdx$/, ""));
  log.push(`${f}  draft:true → draft:false  (publishedAt ${publishedAt})`);
}

if (stale.length) {
  // Loud on purpose. A post held back for a stale date must not look like a
  // post that simply was not due.
  console.log(`::warning::auto-publish held ${stale.length} post(s) back: their dates no longer match content/season-model.json.`);
  for (const line of stale) console.log(`  STALE DATE  ${line}`);
  console.log("  Re-derive with: node scripts/season-gaps.mjs, then re-date the post or correct the model.");
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
