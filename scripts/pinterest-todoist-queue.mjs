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
 *   (there is no PIN_PUBLISH_TIME any more: the posting time comes from the
 *    slot table below, because a single constant cannot vary by weekday.)
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
//   scheduledFor  the day the pin goes live
//   todoistDue    the moment Will is asked to post it, which is now the SAME
//                 moment, to the hour
//
// REWRITTEN 2026-10-01 at Will's direction: *"The todoist task is a good
// reminder of when I need to post to pin... But I'd like to approve a bank of
// them in capcom, then have them schedule on todoist for time to post."*
//
// So the two dates collapsed. Until today the task was due in one of Will's
// two Buffalo blocks (Tue 20:30 / Fri 11:15) and carried a separate live date
// for him to type into Pinterest's scheduler. Now the task fires at the moment
// the pin should go out and he just posts it. Approving is the batched act;
// posting is spread.
//
// WHAT WENT, AND WHY: the per-session cap of 2. It existed only because
// tapping a click-to-publish link WAS publishing, so batching his attention
// and batching the pins were the same action. The 2026-09-29 inversion broke
// that link and this finishes the job. A bank approval may now produce as many
// tasks as he approves; each fires at its own moment rather than landing on him
// at once, which is the whole point.
//
// WHAT STAYED, AND WHY: the rules that protect the ACCOUNT rather than his
// attention. Five days between pins to the same URL, at most three live in a
// day, and a 30-day placement horizon so one bank approval cannot sprawl into
// next quarter. Pinterest's own 10-scheduled/30-day scheduler ceiling no
// longer binds, because he is posting rather than scheduling, but the horizon
// is kept as a sanity bound on how far ahead a pin may be placed at all.
const GAP_DAYS = 5;
const MAX_LIVE_PER_DAY = 3;
const HORIZON_DAYS = 30;

// THE SLOT TABLE, and read the caveat before trusting it.
//
// Two constants, and they are a SESSION'S GUESS, not a finding. The researcher
// ran for the first time on 2026-10-01 specifically to source these and came
// back with: "The timing evidence is thin and contradictory, and I recommend
// nothing." No first-party Pinterest source gives best-time guidance; every
// source is a scheduler vendor's marketing blog with no stated method; and they
// contradict each other on weekdays (one ranks Wednesday last, another ranks it
// among the best). The only thing they agree on is evenings and weekend
// mornings, and several of those same sources say timing barely matters for
// evergreen pins because Pinterest is search-driven and a pin lives for months.
//
// So: two slots, not four. Four would imply a weekday pattern the evidence does
// not support. These stand until Pinterest Analytics can answer it from our own
// data, which the day-90 review (2026-11-19) is the first chance to do.
// See content/pinterest/decisions.md and content/pinterest/playbook.md.
const SLOT_BY_WEEKDAY = {
  0: "10:00", // Sunday, weekend morning
  1: "20:00", // Monday, evening
  2: "20:00",
  3: "20:00",
  4: "20:00",
  5: "20:00", // Friday, evening
  6: "10:00", // Saturday, weekend morning
};

const dayNum = (iso) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
const dayISO = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const urlKeyOf = (pin) => String(pin.destinationUrl || "").split("?")[0];
const slotFor = (iso) => SLOT_BY_WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()];

// Reads what is already committed to, then places each new pin on the first
// day that breaks none of the rules. Fills DAYS now rather than sessions,
// because there are no sessions any more.
function planSlots(pins, allPins, todayISO) {
  const perDay = new Map();
  const lastForUrl = new Map();
  for (const p of allPins) {
    if (p.status !== "queued" || !p.scheduledFor) continue;
    const d = dayNum(p.scheduledFor);
    perDay.set(d, (perDay.get(d) || 0) + 1);
    const k = urlKeyOf(p);
    lastForUrl.set(k, Math.max(lastForUrl.get(k) ?? -Infinity, d));
  }

  // Never today: the daily job runs at 13:30 UTC (09:30 ET) and the earliest
  // slot is 10:00 local, so a task placed today could be due within half an
  // hour of being created, or already past. Start tomorrow.
  const first = dayNum(todayISO) + 1;
  const plan = [];
  for (const pin of pins) {
    const k = urlKeyOf(pin);
    let live = Math.max(first, (lastForUrl.get(k) ?? -Infinity) + GAP_DAYS);
    while ((perDay.get(live) || 0) >= MAX_LIVE_PER_DAY) live++;
    if (live > first + HORIZON_DAYS) {
      console.error(`  SKIP ${pin.id}: no live date inside ${HORIZON_DAYS} days`);
      continue;
    }
    perDay.set(live, (perDay.get(live) || 0) + 1);
    lastForUrl.set(k, live);
    const iso = dayISO(live);
    plan.push({ pin, scheduledFor: iso, todoistDue: `${iso}T${slotFor(iso)}:00` });
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
      // The task is due AT the posting moment now, so there is no date to type
      // and no scheduler to drive. Saying "post it now" is the whole
      // instruction, and the old set-the-date-then-Schedule wording would
      // actively mislead: following it would schedule the pin for a date that
      // has already arrived.
      `**Post it now.** This task is due at the moment the pin should go out.`,
      "",
      `Image and description arrive pre-filled. Pick the board, paste the title,`,
      `then publish.`,
      "",
      // The tick is the only "it went out" signal there is: the Pinterest API
      // is dead to us, so the reconcile job reads a completed task as
      // published and nothing else. Ticking one he did not post would record
      // it as posted and drop it out of review, silently.
      `Changed your mind? Reject it in CAPCOM rather than ticking this off.`,
      `Ticking it is what tells the repo the pin went out.`,
      "",
      `Pin id: \`${pin.id}\``,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    // Due = the moment the pin should go live, to the hour. Rewritten
    // 2026-10-01: this used to be Will's next Buffalo block, a separate thing
    // from pin.scheduledFor. They are the same moment now. `scheduledFor` is
    // kept as the date half of it because the rest of the pipeline, CAPCOM's
    // pane and the reconcile job included, compares plain dates.
    due: { date: pin.todoistDue, timezone: TIMEZONE },
    labels: [LABEL],
    // Todoist's integer is inverted: 4 is p1, 1 is p4. Will asked for p1
    // (2026-10-01) and the rest of the Buffalo Rentals Dated project is p1, so
    // p2 made the pins the odd ones out in his own list.
    priority: 4, // Todoist p1
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
