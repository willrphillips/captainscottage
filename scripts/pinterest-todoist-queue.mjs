#!/usr/bin/env node
/**
 * pinterest-todoist-queue.mjs: turn APPROVED pins into click-to-publish
 * Todoist tasks, due at the exact moment the pin should go live.
 *
 * Why this exists: the Pinterest API path is dead for us. A Trial-access app
 * cannot create pins on api.pinterest.com (403 code 29), and Standard access
 * needs a video demo and a multi-week review. Pinterest's public save endpoint
 * needs no app, no token, no review:
 *
 *   https://www.pinterest.com/pin/create/button/?url=...&media=...&description=...
 *
 * That link opens Pinterest's composer already filled with our image, our
 * destination link (UTM intact) and our description. Will picks the board and
 * clicks Publish. One click, no API.
 *
 * The gate is unchanged from pinterest-publish.mjs: a pin is queued only when
 * `status === "approved"`. Agents write "draft"; only Will writes "approved".
 * The scheduled workflow never queues anything else.
 *
 * `--include-drafts` is the one exception, and it is manual-only. It queues
 * pins still at "draft", which makes the Todoist task itself the review step:
 * Will reads the pin there and either publishes it or deletes the task. That is
 * safe because a Todoist task posts nothing on its own; only his click reaches
 * Pinterest. It does NOT mark anything approved, and the workflow never passes
 * it. Use `--until` with it to bound how far ahead you queue.
 *
 * Board and title cannot be pre-filled by the save endpoint, so both are
 * written into the task description for copy/paste.
 *
 * Env:
 *   TODOIST_API_TOKEN    required to create tasks. Absent = dry run, exit 0.
 *   TODOIST_PROJECT_ID   default 6FwqXhv2wM64hGGg ("Buffalo Rentals Dated").
 *   TODOIST_LABEL        default "pinterest".
 *   PIN_PUBLISH_TIME     default "10:00", local time, HH:MM 24h.
 *   PIN_TIMEZONE         default "America/New_York".
 *   SITE_ORIGIN          default https://captainscottageva.com
 *   DRY_RUN=1            force a dry run.
 *
 * Usage:
 *   node scripts/pinterest-todoist-queue.mjs [--limit 25]
 *   node scripts/pinterest-todoist-queue.mjs --include-drafts --until 2026-09-30
 *   node scripts/pinterest-todoist-queue.mjs --mark <pinId>=<taskId>[,<pinId>=<taskId>...]
 *
 * `--mark` records tasks that were created outside this script (for example by
 * an agent holding a Todoist MCP connection) so the queue file still knows the
 * pin is spoken for. It writes state only; it calls nothing.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(import.meta.dirname, "..");
const PINS_DIR = path.join(ROOT, "content/pins");
const SYNC_API = "https://api.todoist.com/api/v1/sync";
const SAVE_ENDPOINT = "https://www.pinterest.com/pin/create/button/";

const ORIGIN = process.env.SITE_ORIGIN || "https://captainscottageva.com";
const PROJECT_ID = process.env.TODOIST_PROJECT_ID || "6FwqXhv2wM64hGGg";
const LABEL = process.env.TODOIST_LABEL || "pinterest";
const PUBLISH_TIME = process.env.PIN_PUBLISH_TIME || "10:00";
const TIMEZONE = process.env.PIN_TIMEZONE || "America/New_York";

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg === -1 ? 25 : Number(args[limitArg + 1]) || 25;
const markArg = args.indexOf("--mark");
const INCLUDE_DRAFTS = args.includes("--include-drafts");
const untilArg = args.indexOf("--until");
const UNTIL = untilArg === -1 ? null : args[untilArg + 1];

if (UNTIL && !/^\d{4}-\d{2}-\d{2}$/.test(UNTIL)) {
  console.error(`--until needs an ISO date, got "${UNTIL}"`);
  process.exit(1);
}

const token = process.env.TODOIST_API_TOKEN;
const dryRun = !token || process.env.DRY_RUN === "1";

if (!fs.existsSync(PINS_DIR)) {
  console.log("no content/pins directory yet; nothing to do.");
  process.exit(0);
}

/** Load every queue file once so writes can be batched per file. */
function loadQueue() {
  const files = fs.readdirSync(PINS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const file = path.join(PINS_DIR, f);
    return { file, data: JSON.parse(fs.readFileSync(file, "utf8")) };
  });
}

function save(entry) {
  fs.writeFileSync(entry.file, JSON.stringify(entry.data, null, 2) + "\n");
}

const queue = loadQueue();

// --- --mark mode: record externally-created task ids, then stop. ------------
if (markArg !== -1) {
  const pairs = String(args[markArg + 1] || "")
    .split(",")
    .filter(Boolean)
    .map((s) => s.split("="));
  if (!pairs.length) {
    console.error("--mark needs <pinId>=<taskId> pairs");
    process.exit(1);
  }
  let marked = 0;
  for (const [pinId, taskId] of pairs) {
    let found = false;
    for (const entry of queue) {
      for (const pin of entry.data.pins || []) {
        if (pin.id !== pinId) continue;
        found = true;
        pin.todoistTaskId = taskId;
        pin.queuedAt = new Date().toISOString();
        pin.status = "queued";
        delete pin.lastError;
        delete pin.lastErrorAt;
        save(entry);
        marked++;
      }
    }
    if (!found) console.error(`  no such pin: ${pinId}`);
  }
  console.log(`marked ${marked} pin(s) as queued.`);
  process.exit(0);
}

// --- normal mode: build tasks for approved pins that have none yet. ---------

/**
 * The save endpoint pre-fills image, destination and description. Board and
 * title are chosen in the composer, so they ride along in the task body.
 */
function saveUrl(pin) {
  const params = new URLSearchParams({
    url: pin.destinationUrl,
    media: `${ORIGIN}/pins/${pin.id}.jpg`,
    description: pin.description,
  });
  return `${SAVE_ENDPOINT}?${params.toString()}`;
}

// ---- The slotter -----------------------------------------------------------
//
// Approval decides WHETHER a pin goes out. This decides WHEN. Both dates are
// assigned here, at queue time, and nowhere else:
//
//   todoistDue    the Buffalo block where Will is asked to post it
//   scheduledFor  the day the pin should actually go live
//
// It lives here rather than in CAPCOM's approve button because every rule is
// about the whole queue, not one pin: two per session, five days between pins
// to the same URL, at most three live on a day, and nothing scheduled further
// than 30 days past its own block (Pinterest's scheduler horizon). A single
// pin cannot answer any of those. Keeping it here is also what makes bulk
// approval safe: approve ten at once and they fill the next five sessions,
// because the slotter fills SESSIONS, not days.
//
// Will gets two blocks a week (schedule.md): Tue 20:30 and Fri 11:15.
const SESSION_SIZE = 2;
const GAP_DAYS = 5;
const MAX_LIVE_PER_DAY = 3;
const HORIZON_DAYS = 30;

const dayNum = (iso) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
const dayISO = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const urlKeyOf = (pin) => String(pin.destinationUrl || "").split("?")[0];

function upcomingSessions(fromISO, count = 120) {
  const out = [];
  for (let i = 0; out.length < count; i++) {
    const d = new Date(`${fromISO}T00:00:00Z`).getTime() + i * 86400000;
    const w = new Date(d).getUTCDay();
    if (w === 2 || w === 5) {
      out.push(`${new Date(d).toISOString().slice(0, 10)}T${w === 2 ? "20:30" : "11:15"}:00`);
    }
  }
  return out;
}

// Reads what is already committed to, then places each new pin in the first
// slot that breaks none of the rules.
function planSlots(pins, allPins, todayISO) {
  const perSession = new Map();
  const perDay = new Map();
  const lastForUrl = new Map();
  for (const p of allPins) {
    if (p.status !== "queued") continue;
    if (p.todoistDue) perSession.set(p.todoistDue, (perSession.get(p.todoistDue) || 0) + 1);
    if (!p.scheduledFor) continue;
    const d = dayNum(p.scheduledFor);
    perDay.set(d, (perDay.get(d) || 0) + 1);
    const k = urlKeyOf(p);
    lastForUrl.set(k, Math.max(lastForUrl.get(k) ?? -Infinity, d));
  }

  const sessions = upcomingSessions(todayISO);
  const plan = [];
  let si = 0;
  for (const pin of pins) {
    while (si < sessions.length && (perSession.get(sessions[si]) || 0) >= SESSION_SIZE) si++;
    if (si >= sessions.length) break;
    const slot = sessions[si];
    const slotDay = dayNum(slot.slice(0, 10));
    const k = urlKeyOf(pin);
    let live = Math.max(slotDay, (lastForUrl.get(k) ?? -Infinity) + GAP_DAYS);
    while ((perDay.get(live) || 0) >= MAX_LIVE_PER_DAY) live++;
    if (live > slotDay + HORIZON_DAYS) {
      console.error(`  SKIP ${pin.id}: no live date inside ${HORIZON_DAYS} days of ${slot}`);
      continue;
    }
    perSession.set(slot, (perSession.get(slot) || 0) + 1);
    perDay.set(live, (perDay.get(live) || 0) + 1);
    lastForUrl.set(k, live);
    plan.push({ pin, todoistDue: slot, scheduledFor: dayISO(live) });
  }
  return plan;
}

// A task only exists for a pin Will has already approved in CAPCOM, so it is
// a do-it item, not a review item. Nothing here asks him to judge the pin
// again; it tells him what he already decided and when it goes out.
function taskFor(pin) {
  const link = saveUrl(pin);
  return {
    content: `[Post pin: ${pin.title}](${link})`,
    description: [
      `_You approved this on ${String(pin.approvedAt || "").slice(0, 10)}. Nothing to decide, just post it._\n`,
      `**Board:** ${pin.board}`,
      "",
      `**Title** (paste into the composer, it cannot be pre-filled):`,
      pin.title,
      "",
      `**Alt text:** ${pin.altText}`,
      "",
      `**Schedule this pin in Pinterest for ${pin.scheduledFor}.**`,
      "",
      `Image and description arrive pre-filled. Pick the board, paste the title,`,
      `set the date above, then Schedule. Only publish now if the composer will`,
      `not let you pick a date.`,
      "",
      `Pinterest holds 10 scheduled pins at a time, 30 days out. If you hit`,
      `either limit, publish the rest of this batch now and say so.`,
      "",
      `Pin id: \`${pin.id}\``,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    // Due = when Will TAPS the task (his Buffalo block), which is deliberately
    // not the same as pin.scheduledFor, the date the pin should go LIVE. See
    // the 2026-09-27 cadence entry in SCOPE_OF_WORK.md: he approves in batches
    // on Tue/Fri, the pins themselves go out spread via Pinterest's scheduler.
    due: { date: pin.todoistDue, timezone: TIMEZONE },
    labels: [LABEL],
    priority: 3, // Todoist p2
    project_id: PROJECT_ID,
  };
}

// A pin whose destination is still an unpublished draft would hand Will a
// task linking to a 404: the journal route filters on `draft`, so the page
// does not exist until auto-publish flips it. Cheap to check here, from the
// frontmatter, and far better than letting the pin reach his phone. Site
// pages (/area/, /what-to-bring/ and the rest) are always live, so only
// /journal/<slug>/ destinations are gated.
function destinationIsLive(pin) {
  const url = String(pin.destinationUrl || "").split("?")[0];
  const m = url.match(/\/journal\/([^/]+)\/?$/);
  if (!m) return true; // not a journal post; a site page or an odd URL
  const mdx = path.join(ROOT, "src/content/blog", `${m[1]}.mdx`);
  if (!fs.existsSync(mdx)) return false; // post does not exist at all
  const fm = (fs.readFileSync(mdx, "utf8").split("---")[1] || "");
  return !/^draft:\s*true\s*$/m.test(fm);
}

const pending = [];
for (const entry of queue) {
  for (const pin of entry.data.pins || []) {
    // THE GATE, inverted 2026-09-29 at Will's direction. A task used to be
    // where a pin got reviewed; now it only exists after review. `approvedAt`
    // is the marker, not `status`: CAPCOM's approvePin() stamps it and, for a
    // pin that was already queued under the old flow, deliberately leaves the
    // status alone, so status cannot answer "has he looked at this".
    if (!pin.approvedAt) continue;
    if (pin.status === "posted" || pin.status === "rejected") continue;
    if (pin.todoistTaskId) continue; // already queued
    if (!destinationIsLive(pin)) {
      console.log(`  SKIP ${pin.id}: destination post is not published yet`);
      continue;
    }
    const image = path.join(ROOT, "public/pins", `${pin.id}.jpg`);
    if (!fs.existsSync(image)) {
      console.error(`  SKIP ${pin.id}: image missing at public/pins/${pin.id}.jpg`);
      continue;
    }
    pending.push({ entry, pin });
  }
}

if (!pending.length) {
  console.log(`nothing to queue (checked ${queue.length} queue files).`);
  process.exit(0);
}

// Oldest approval first, so the queue is served in the order he reviewed.
pending.sort((a, b) => String(a.pin.approvedAt).localeCompare(String(b.pin.approvedAt)));

// Assign both dates now. Everything downstream (the task body, the due date,
// what gets written back to the pin) just reads them off the pin.
const allPins = queue.flatMap((e) => e.data.pins || []);
const today = new Date().toISOString().slice(0, 10);
const plan = planSlots(pending.map((p) => p.pin), allPins, today);
const planned = new Map(plan.map((s) => [s.pin.id, s]));
for (const { pin, todoistDue, scheduledFor } of plan) {
  pin.todoistDue = todoistDue;
  pin.scheduledFor = scheduledFor;
}

const slotted = pending.filter(({ pin }) => planned.has(pin.id));
const batch = slotted.slice(0, LIMIT);
const bound = UNTIL ? ` through ${UNTIL}` : "";
console.log(
  `${slotted.length} approved pin(s) awaiting a task${bound}; queueing ${batch.length}${dryRun ? " (DRY RUN)" : ""}.`,
);

if (dryRun) {
  for (const { pin } of batch) {
    console.log(`  WOULD QUEUE ${pin.id}  tap ${pin.todoistDue}  live ${pin.scheduledFor}`);
    console.log(`    ${saveUrl(pin)}`);
  }
  console.log(`done: ${batch.length} would be queued, ${pending.length - batch.length} left over.`);
  process.exit(0);
}

/**
 * One sync call carries both the task and its absolute reminder. The reminder
 * references the task by temp_id, which Todoist resolves inside the batch.
 */
const commands = [];
const tempIds = new Map();

for (const { pin } of batch) {
  const tempId = crypto.randomUUID();
  tempIds.set(pin.id, tempId);
  const task = taskFor(pin);
  commands.push({ type: "item_add", temp_id: tempId, uuid: crypto.randomUUID(), args: task });
  commands.push({
    type: "reminder_add",
    temp_id: crypto.randomUUID(),
    uuid: crypto.randomUUID(),
    args: { item_id: tempId, type: "absolute", due: task.due },
  });
}

const res = await fetch(SYNC_API, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ commands: JSON.stringify(commands) }),
});

const json = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`sync failed: ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
  process.exit(1);
}

const mapping = json.temp_id_mapping || {};
const status = json.sync_status || {};
let queued = 0;
let failed = 0;

for (const { entry, pin } of batch) {
  const tempId = tempIds.get(pin.id);
  const taskId = mapping[tempId];
  const cmd = commands.find((c) => c.temp_id === tempId);
  const result = status[cmd.uuid];

  if (!taskId || (result && result !== "ok")) {
    pin.lastError = `todoist: ${JSON.stringify(result || "no task id returned").slice(0, 300)}`;
    pin.lastErrorAt = new Date().toISOString();
    console.error(`  FAILED ${pin.id}: ${pin.lastError}`);
    failed++;
  } else {
    pin.todoistTaskId = String(taskId);
    // The tap date, persisted so readers (CAPCOM's Pinterest tab) can show
    // "live X / tap Y" and flag a pin whose live date falls before the day
    // Will is asked to schedule it. Without this the two dates exist only in
    // two systems that cannot see each other.
    // scheduledFor and todoistDue were assigned by planSlots() above.
    pin.queuedAt = new Date().toISOString();
    pin.status = "queued";
    delete pin.lastError;
    delete pin.lastErrorAt;
    console.log(`  QUEUED ${pin.id} -> task ${taskId} @ live ${pin.scheduledFor} / tap ${pin.todoistDue}`);
    queued++;
  }
  save(entry);
}

console.log(`done: ${queued} queued, ${failed} failed, ${pending.length - batch.length} still waiting.`);
process.exit(failed ? 1 : 0);
