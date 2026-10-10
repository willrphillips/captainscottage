#!/usr/bin/env node
/**
 * Which demand seasons have nothing scheduled into their booking window?
 *
 * The counting half of the seasonal planner. `content/season-model.json` says
 * when each season's post needs to be live; this walks the next N months,
 * derives each season's publish date under the rule, and reports the ones with
 * no post pointed at them. The editor agent then decides what to write. Facts
 * from a script, judgment from the agent, the same split as
 * pinterest-staleness.mjs.
 *
 * WHY A SCRIPT AND NOT JUST THE AGENT. The old schedule was wrong for five
 * months because nothing computed the gap between a season's start and the date
 * a post had to exist. An agent asked "are we covered?" has to hold seven
 * seasons, two lead times each and a 45-day runway in its head, and it will
 * round. This does not round.
 *
 * Usage:
 *   node scripts/season-gaps.mjs                  # human-readable
 *   node scripts/season-gaps.mjs --months 6       # horizon, default 6
 *   node scripts/season-gaps.mjs --markdown       # for the planner prompt
 *   node scripts/season-gaps.mjs --json
 *
 * Exit code is always 0. This reports; it does not gate.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MODEL = path.join(ROOT, "content/season-model.json");
const BLOG = path.join(ROOT, "src/content/blog");
const CAL = path.join(ROOT, "content/content-calendar.json");

const args = process.argv.slice(2);
const AS_JSON = args.includes("--json");
const AS_MD = args.includes("--markdown");
const mi = args.indexOf("--months");
const MONTHS = mi === -1 ? 6 : Number(args[mi + 1]) || 6;

const model = JSON.parse(fs.readFileSync(MODEL, "utf8"));
const RUNWAY = model.rule.pinterestRunwayDays;
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

/**
 * Every post that exists, published or not, with its date and season tag.
 * A post is "pointed at" a season by its `season:` frontmatter when present,
 * and otherwise by whether its publish date falls inside that season's
 * derived publish window. The frontmatter tag is preferred because a post can
 * legitimately be published far from the season it serves, which is the whole
 * point of the rule.
 */
function readPosts() {
  if (!fs.existsSync(BLOG)) return [];
  return fs.readdirSync(BLOG).filter((f) => f.endsWith(".mdx")).map((f) => {
    const text = fs.readFileSync(path.join(BLOG, f), "utf8");
    const fm = (text.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || "";
    const get = (k) => (fm.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, "m")) || [])[1] || null;
    return {
      slug: f.replace(/\.mdx$/, ""),
      publishedAt: get("publishedAt"),
      season: get("season"),
      draft: /^draft:\s*true/m.test(fm),
    };
  });
}

/** Calendar entries still at `idea` are already-planned future work. */
function readIdeas() {
  try {
    const cal = JSON.parse(fs.readFileSync(CAL, "utf8"));
    return (cal.posts || []).filter((p) => p.status === "idea")
      .map((p) => ({ slug: p.slug, season: p.season || null, publishDate: p.publishDate || null }));
  } catch { return []; }
}

const posts = readPosts();
const ideas = readIdeas();
const horizon = addDays(today, MONTHS * 30);

/**
 * A season recurs, so check the next occurrence whose DERIVED PUBLISH DATE
 * falls inside the horizon. That is the thing with a deadline, not the season
 * start: by the time the season starts it is far too late to write for it.
 */
const rows = [];
for (const s of model.seasons) {
  const [mm, dd] = s.seasonStart.split("-").map(Number);
  for (const year of [today.getUTCFullYear(), today.getUTCFullYear() + 1, today.getUTCFullYear() + 2]) {
    const start = new Date(Date.UTC(year, mm - 1, dd));
    const due = addDays(start, -(s.bookingLeadDays + RUNWAY));
    if (due < today) continue;          // this occurrence's window has closed
    if (due > horizon) break;           // beyond the planning horizon

    // Covered if any post or idea is tagged to this season, or dated within
    // 21 days of the derived date (an untagged post serving it in practice).
    const near = (d) => d && Math.abs((new Date(d + "T00:00:00Z") - due) / 86400000) <= 21;
    // A TAGGED post counts only for its own season. Proximity is a fallback
    // for untagged posts only, because on its own it lies: an evergreen
    // place-story dated three weeks from the spring-rockfish date read as
    // covering spring rockfish on the very first run.
    const hits = [
      ...posts.filter((p) => (p.season ? p.season === s.key : near(p.publishedAt))),
      ...ideas.filter((i) => (i.season ? i.season === s.key : near(i.publishDate))),
    ];
    rows.push({
      season: s.key, label: s.label, priority: s.priority,
      seasonStart: iso(start), derivedPublish: iso(due),
      daysUntilDue: Math.round((due - today) / 86400000),
      bookingLeadDays: s.bookingLeadDays, segment: s.segment, why: s.why,
      covered: hits.length > 0,
      coveredBy: hits.map((h) => h.slug),
      anchorVerified: s.anchorVerified !== false,
      unverified: s.unverified || null,
    });
    break;                              // one occurrence per season is enough
  }
}

rows.sort((a, b) => a.derivedPublish.localeCompare(b.derivedPublish));
const gaps = rows.filter((r) => !r.covered).sort((a, b) => a.priority - b.priority);

if (AS_JSON) {
  console.log(JSON.stringify({ today: iso(today), horizonMonths: MONTHS, runway: RUNWAY, rows, gaps }, null, 2));
} else if (AS_MD) {
  console.log(`# Season coverage, next ${MONTHS} months\n`);
  console.log(`Run ${iso(today)}. Rule: publish = seasonStart - bookingLead - ${RUNWAY}.\n`);
  console.log("| season | season starts | post must be live | days left | covered |");
  console.log("|---|---|---|---|---|");
  for (const r of rows) {
    console.log(`| ${r.label} | ${r.seasonStart} | **${r.derivedPublish}** | ${r.daysUntilDue} | ${r.covered ? r.coveredBy.join(", ") : "**NOTHING**"} |`);
  }
  if (!gaps.length) {
    console.log("\nEvery season inside the horizon has a post pointed at it. Propose nothing.");
  } else {
    console.log(`\n## ${gaps.length} gap(s), highest revenue priority first\n`);
    for (const g of gaps) {
      console.log(`### ${g.label} (priority ${g.priority})`);
      console.log(`- post must be live by **${g.derivedPublish}**, ${g.daysUntilDue} days from now`);
      console.log(`- season starts ${g.seasonStart}; guests decide ~${g.bookingLeadDays} days ahead`);
      console.log(`- segment: ${g.segment}`);
      console.log(`- why it matters: ${g.why}`);
      if (g.unverified) console.log(`- CAUTION, unverified anchor: ${g.unverified}`);
      console.log("");
    }
  }
} else {
  console.log(`Season coverage, next ${MONTHS} months (today ${iso(today)})`);
  for (const r of rows) {
    console.log(`  ${r.covered ? "ok   " : "GAP  "} ${r.derivedPublish}  ${r.label}  ${r.covered ? "<- " + r.coveredBy.join(", ") : ""}`);
  }
  console.log(gaps.length ? `\n${gaps.length} gap(s): ${gaps.map((g) => g.season).join(", ")}` : "\nno gaps");
}
