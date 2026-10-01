#!/usr/bin/env node
/**
 * Has anything in the Pinterest operation quietly stopped?
 *
 * WHY THIS EXISTS. On 2026-10-01 an inventory found that three of the four
 * Pinterest workflows were switched off and two of them had never executed at
 * all: `pinterest-queue` (the pin writer) off since 2026-08-16,
 * `pinterest-briefing` off since 2026-08-14, `pinterest-research` zero runs
 * ever. Nobody noticed for six weeks. The reason nobody noticed is that the one
 * job whose entire purpose was to say "this stopped" was itself one of the
 * jobs that stopped, and the briefing it used to post only ever reported STATE
 * ("here is the queue") rather than STALENESS ("the queue has not moved").
 *
 * A weekly card that only ever says "all fine" is indistinguishable from no
 * card at all. So the numbers are computed here, deterministically, and handed
 * to Edwin as facts. Judgment stays with the agent; counting does not.
 *
 * Every check carries its own threshold and the reason for it. A check that
 * cannot be made reads UNKNOWN and never silently passes: `gh` is optional, so
 * on a machine without it the workflow-run checks report UNKNOWN rather than
 * vanishing.
 *
 * Usage:
 *   node scripts/pinterest-staleness.mjs              # human-readable report
 *   node scripts/pinterest-staleness.mjs --markdown   # for the briefing prompt
 *   node scripts/pinterest-staleness.mjs --json       # for a workflow step
 *
 * Exit code is 0 either way: this reports, it does not gate. The `alarm` field
 * is what a caller should branch on.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const PINS_DIR = path.join(ROOT, "content/pins");
const BLOG_DIR = path.join(ROOT, "src/content/blog");

// From content/pinterest/pacing.md, 2026-10-01: 4 pins a week, and Todoist
// tasks exist only for approved pins, so an empty approved bank silences the
// account even with drafts piled up behind it.
const BANK_FLOOR = 12;
const RATE_PER_WEEK = 4;

const WORKFLOWS = [
  { file: "pinterest-todoist-queue.yml", label: "Todoist queue", cadence: "daily", maxDays: 3 },
  { file: "pinterest-queue.yml", label: "Pin writer", cadence: "weekly", maxDays: 14 },
  { file: "pinterest-briefing.yml", label: "This briefing", cadence: "weekly", maxDays: 14 },
  { file: "pinterest-research.yml", label: "Researcher", cadence: "monthly / on demand", maxDays: 60 },
];

const args = process.argv.slice(2);
const AS_JSON = args.includes("--json");
const AS_MARKDOWN = args.includes("--markdown");

const today = new Date();
const daysSince = (iso) => {
  if (!iso) return null;
  const t = new Date(String(iso).length === 10 ? `${iso}T12:00:00Z` : iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((today.getTime() - t) / 86400000);
};

/** Every pin in the repo, flattened. */
function readPins() {
  if (!fs.existsSync(PINS_DIR)) return [];
  const out = [];
  for (const f of fs.readdirSync(PINS_DIR).filter((f) => f.endsWith(".json"))) {
    let j;
    try {
      j = JSON.parse(fs.readFileSync(path.join(PINS_DIR, f), "utf8"));
    } catch {
      continue;
    }
    for (const p of j.pins || []) out.push(p);
  }
  return out;
}

/**
 * The last run of a workflow, newest first, via gh. Returns UNKNOWN rather than
 * null-as-zero when gh is missing or the call fails, because "I could not
 * check" and "it has never run" are different findings and conflating them is
 * how the August gap stayed invisible.
 */
function lastRun(file) {
  try {
    const raw = execFileSync(
      "gh",
      ["run", "list", "--workflow", file, "--limit", "1", "--json", "createdAt,conclusion,event"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 25000 },
    );
    const rows = JSON.parse(raw);
    if (!rows.length) return { state: "never", days: null };
    return { state: "ok", days: daysSince(rows[0].createdAt), at: rows[0].createdAt.slice(0, 10),
             conclusion: rows[0].conclusion, event: rows[0].event };
  } catch {
    return { state: "unknown", days: null };
  }
}

const pins = readPins();
const posted = pins.filter((p) => p.status === "posted" && p.postedAt);
const lastPostedAt = posted.map((p) => p.postedAt).sort().at(-1) || null;
const bank = pins.filter((p) => p.approvedAt && p.status !== "posted" && p.status !== "rejected").length;
const drafts = pins.filter((p) => (p.status || "draft") === "draft").length;
const queued = pins.filter((p) => p.status === "queued").length;

let uncovered = [];
if (fs.existsSync(BLOG_DIR)) {
  for (const f of fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))) {
    const text = fs.readFileSync(path.join(BLOG_DIR, f), "utf8");
    if (!/^draft:\s*false/m.test(text)) continue;
    if (!fs.existsSync(path.join(PINS_DIR, f.replace(/\.mdx$/, ".json")))) uncovered.push(f.replace(/\.mdx$/, ""));
  }
}

const checks = [];
const add = (name, ok, detail, why) => checks.push({ name, ok, detail, why });

// Silence is the headline symptom. At 4 a week a pin is due about every 1.75
// days, so 7 days is already four missed and not a quiet patch. Set at 7 rather
// than 10 deliberately: on 2026-10-01 the gap was 9 days, the strategist called
// it the kind of silence the account should avoid, and a threshold that let it
// pass would have been a threshold tuned to make the dashboard look calm.
const SILENT_DAYS_MAX = 7;
const silentDays = daysSince(lastPostedAt);
add(
  "Last pin posted",
  silentDays !== null && silentDays <= SILENT_DAYS_MAX,
  lastPostedAt ? `${lastPostedAt}, ${silentDays} days ago` : "no pin has ever been marked posted",
  `at ${RATE_PER_WEEK}/week a pin is due every ~1.75 days, so past ${SILENT_DAYS_MAX} days is four or more missed`,
);

add(
  "Approved bank",
  bank >= BANK_FLOOR,
  `${bank} approved and not yet posted (floor ${BANK_FLOOR})`,
  "tasks exist only for approved pins, so an empty bank silences the account however many drafts are waiting",
);

add(
  "Waiting on Will",
  true,
  `${drafts} drafts awaiting approval, ${queued} queued with a task`,
  "reported, not judged: a big number means approvals are the bottleneck, a zero means the writer is",
);

add(
  "Published posts with no pins",
  uncovered.length === 0,
  uncovered.length ? `${uncovered.length}: ${uncovered.join(", ")}` : "none",
  "every published post should have pins; a gap here is free inventory going unused",
);

for (const w of WORKFLOWS) {
  const r = lastRun(w.file);
  const detail =
    r.state === "never" ? "HAS NEVER RUN"
    : r.state === "unknown" ? "UNKNOWN (could not query GitHub)"
    : `${r.at}, ${r.days} days ago (${r.conclusion}, via ${r.event})`;
  add(
    `${w.label} (${w.cadence})`,
    r.state === "ok" && r.days !== null && r.days <= w.maxDays,
    detail,
    `expected inside ${w.maxDays} days`,
  );
}

const failing = checks.filter((c) => !c.ok);
const alarm = failing.length > 0;
const headline = alarm
  ? failing.map((c) => c.name).join("; ")
  : "nothing stale";

if (AS_JSON) {
  console.log(JSON.stringify({ alarm, headline, bankFloor: BANK_FLOOR, bank, drafts, queued, lastPostedAt, checks }, null, 2));
} else if (AS_MARKDOWN) {
  console.log("# Staleness check, measured not inferred\n");
  console.log(`Run ${today.toISOString().slice(0, 10)}. ${alarm ? `**${failing.length} check(s) failing.**` : "All checks pass."}\n`);
  for (const c of checks) {
    console.log(`- ${c.ok ? "OK  " : "**STALE**"} ${c.name}: ${c.detail}`);
    if (!c.ok) console.log(`  - why it matters: ${c.why}`);
  }
  console.log(
    "\nThese numbers are computed from the repo and the GitHub API, not inferred. " +
      "Report them as given. A check reading UNKNOWN was not verifiable on this run and must not be reported as passing.",
  );
} else {
  console.log(`Pinterest staleness, ${today.toISOString().slice(0, 10)}`);
  for (const c of checks) console.log(`  ${(c.ok ? "ok" : "STALE").padEnd(6)} ${c.name.padEnd(34)} ${c.detail}`);
  console.log(`\n${alarm ? `ALARM: ${headline}` : "nothing stale"}`);
}
