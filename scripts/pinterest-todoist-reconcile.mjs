#!/usr/bin/env node
/**
 * Read completed Todoist tasks back into the pin queue.
 *
 * Publishing runs through Todoist: `pinterest-todoist-queue.mjs` creates one
 * task per pin carrying a pinterest.com save link, and Will taps it to publish.
 * Nothing told the repo that ever happened. Completion lived only in Todoist,
 * so `content/pins/*.json` drifted from reality every single time he published,
 * and someone had to patch `status` by hand. On 2026-08-26 the repo still read
 * 48 queued / 3 posted with a "next pin" date that had already gone by.
 *
 * This closes the loop. For every pin at `status: "queued"` holding a
 * `todoistTaskId`, ask Todoist whether that task is completed; if it is, set
 * `status: "posted"` and stamp `postedAt` with the completion date.
 *
 * WHAT IT WILL NOT DO
 *   - It never sets "approved". The gate is unchanged: agents write "draft",
 *     only Will approves, and this only ever moves queued -> posted.
 *   - It never creates, edits or completes a Todoist task. Read-only there.
 *   - It never touches a pin the queue script has not queued, because matching
 *     is by `todoistTaskId` and nothing else.
 *
 * A NOTE ON WHY COMPLETION MEANS PUBLISHED. Tapping the task opens Pinterest's
 * composer; the tick is Will saying "done". That is the only signal available
 * without the Pinterest API, which is dead to us (app 1600288 is stuck at Trial
 * and 403s on every create). So a task ticked for any other reason reads as
 * published here. That is why capcom DELETES the task of a rejected pin rather
 * than completing it: a completed task means published, and only that.
 *
 * Usage:
 *   node scripts/pinterest-todoist-reconcile.mjs
 *   node scripts/pinterest-todoist-reconcile.mjs --since 2026-08-01
 *   node scripts/pinterest-todoist-reconcile.mjs --dry-run
 *
 * Env:
 *   TODOIST_API_TOKEN   required to do anything; absent means dry run
 *   TODOIST_LABEL       default "pinterest"
 *   PIN_TIMEZONE        default "America/New_York", for stamping postedAt
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PINS_DIR = path.join(ROOT, "content/pins");
const API = "https://api.todoist.com/api/v1";

const LABEL = process.env.TODOIST_LABEL || "pinterest";
const TIMEZONE = process.env.PIN_TIMEZONE || "America/New_York";

const args = process.argv.slice(2);
const sinceArg = args.indexOf("--since");
const DRY = args.includes("--dry-run");

const token = process.env.TODOIST_API_TOKEN;
const dryRun = !token || DRY || process.env.DRY_RUN === "1";

if (!fs.existsSync(PINS_DIR)) {
  console.log("no content/pins directory yet; nothing to do.");
  process.exit(0);
}

function loadQueue() {
  return fs
    .readdirSync(PINS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const file = path.join(PINS_DIR, f);
      return { file, data: JSON.parse(fs.readFileSync(file, "utf8")), dirty: false };
    });
}

const queue = loadQueue();

// Every queued pin that is waiting on a tap, indexed by the task carrying it.
const byTask = new Map();
for (const entry of queue) {
  for (const pin of entry.data.pins || []) {
    if (pin.status !== "queued" || !pin.todoistTaskId) continue;
    byTask.set(String(pin.todoistTaskId), { entry, pin });
  }
}

if (!byTask.size) {
  console.log("no queued pins are waiting on a Todoist task; nothing to reconcile.");
  process.exit(0);
}

// Oldest queued pin, so a first run after a long gap still catches everything.
// Todoist's completed endpoint requires a bounded window, and defaulting to a
// week would silently miss anything published before that.
const defaultSince = [...byTask.values()]
  .map(({ pin }) => String(pin.queuedAt || pin.scheduledFor || "").slice(0, 10))
  .filter(Boolean)
  .sort()[0] || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
const SINCE = sinceArg === -1 ? defaultSince : args[sinceArg + 1];

if (!/^\d{4}-\d{2}-\d{2}$/.test(String(SINCE))) {
  console.error(`--since needs an ISO date, got "${SINCE}"`);
  process.exit(1);
}

console.log(`${byTask.size} queued pin(s) awaiting a tap; checking completions since ${SINCE}.`);

if (dryRun) {
  console.log(`DRY RUN${token ? "" : " (no TODOIST_API_TOKEN)"} — would check:`);
  for (const [taskId, { pin }] of byTask) console.log(`  ${pin.id}  task ${taskId}`);
  process.exit(0);
}

async function api(pathname) {
  const r = await fetch(API + pathname, { headers: { Authorization: "Bearer " + token } });
  if (!r.ok) {
    throw new Error(`todoist http ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  return r.json();
}

/**
 * Completed tasks in the window, paged. The endpoint caps each request's span,
 * so walk it in 12-week slices rather than asking for months at once.
 */
async function completedSince(sinceDate) {
  const out = [];
  const end = new Date();
  let from = new Date(sinceDate + "T00:00:00Z");
  const SLICE_DAYS = 84;

  while (from <= end) {
    const to = new Date(Math.min(from.getTime() + SLICE_DAYS * 86400000, end.getTime() + 86400000));
    let cursor = null;
    do {
      const qs = new URLSearchParams({
        since: from.toISOString().slice(0, 19),
        until: to.toISOString().slice(0, 19),
        limit: "200",
      });
      if (cursor) qs.set("cursor", cursor);
      const page = await api(`/tasks/completed/by_completion_date?${qs}`);
      out.push(...(page.items || page.results || []));
      cursor = page.next_cursor || null;
    } while (cursor);
    from = to;
  }
  return out;
}

const completed = await completedSince(SINCE);
console.log(`Todoist returned ${completed.length} completed task(s) in that window.`);

let posted = 0;
const changes = [];

for (const t of completed) {
  const taskId = String(t.task_id || t.id || "");
  const hit = byTask.get(taskId);
  if (!hit) continue;

  // The label check is a guard, not the lookup: the id already proves this is
  // the task the pin was queued as. A task that lost its label is still that
  // task, so warn rather than skip.
  const labels = t.labels || t.item_object?.labels || [];
  if (labels.length && !labels.includes(LABEL)) {
    console.warn(`  note: ${hit.pin.id} matched task ${taskId}, which no longer carries the "${LABEL}" label`);
  }

  const completedAt = t.completed_at || t.completed_date || null;
  hit.pin.status = "posted";
  hit.pin.postedAt = localDate(completedAt);
  delete hit.pin.lastError;
  delete hit.pin.lastErrorAt;
  hit.entry.dirty = true;
  changes.push(`${hit.pin.id}  ->  posted ${hit.pin.postedAt}`);
  posted++;
}

/**
 * postedAt is a plain date and the rest of the pipeline compares it against
 * other plain dates, so a UTC slice would put a 9pm Eastern publish on the
 * following day. Stamp the date Will actually published on.
 */
function localDate(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

for (const entry of queue) {
  if (!entry.dirty) continue;
  fs.writeFileSync(entry.file, JSON.stringify(entry.data, null, 2) + "\n");
}

if (!posted) {
  console.log("nothing to reconcile: no queued pin's task has been completed.");
  process.exit(0);
}

console.log(`\nreconciled ${posted} pin(s):`);
for (const line of changes) console.log(`  ${line}`);
