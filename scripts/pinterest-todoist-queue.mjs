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

function taskFor(pin) {
  const link = saveUrl(pin);
  // A draft has not been read by Will yet: the task is where he reviews it.
  const unreviewed = pin.status === "draft";
  return {
    content: `[${unreviewed ? "Review + publish" : "Publish"} pin: ${pin.title}](${link})`,
    description: [
      unreviewed ? "_Not reviewed yet. Read it, then publish or delete this task._\n" : null,
      `**Board:** ${pin.board}`,
      "",
      `**Title** (paste into the composer, it cannot be pre-filled):`,
      pin.title,
      "",
      `**Alt text:** ${pin.altText}`,
      "",
      `Image and description arrive pre-filled. Pick the board, paste the title, publish.`,
      "",
      `Pin id: \`${pin.id}\``,
    ]
      .filter((line) => line !== null)
      .join("\n"),
    due: { date: `${pin.scheduledFor}T${PUBLISH_TIME}:00`, timezone: TIMEZONE },
    labels: [LABEL],
    priority: 3, // Todoist p2
    project_id: PROJECT_ID,
  };
}

const pending = [];
for (const entry of queue) {
  for (const pin of entry.data.pins || []) {
    const queueable = INCLUDE_DRAFTS
      ? pin.status === "approved" || pin.status === "draft"
      : pin.status === "approved";
    if (!queueable) continue; // the gate
    if (pin.todoistTaskId) continue; // already queued
    if (!pin.scheduledFor) continue;
    if (UNTIL && pin.scheduledFor > UNTIL) continue;
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

pending.sort((a, b) => (a.pin.scheduledFor < b.pin.scheduledFor ? -1 : 1));
const batch = pending.slice(0, LIMIT);
const scope = INCLUDE_DRAFTS ? "approved+draft" : "approved";
const bound = UNTIL ? ` through ${UNTIL}` : "";
console.log(`${pending.length} ${scope} pin(s) unqueued${bound}; queueing ${batch.length}${dryRun ? " (DRY RUN)" : ""}.`);

if (dryRun) {
  for (const { pin } of batch) {
    console.log(`  WOULD QUEUE ${pin.id} -> ${pin.scheduledFor} ${PUBLISH_TIME} ${TIMEZONE} | ${pin.board}`);
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
    pin.queuedAt = new Date().toISOString();
    pin.status = "queued";
    delete pin.lastError;
    delete pin.lastErrorAt;
    console.log(`  QUEUED ${pin.id} -> task ${taskId} @ ${pin.scheduledFor} ${PUBLISH_TIME}`);
    queued++;
  }
  save(entry);
}

console.log(`done: ${queued} queued, ${failed} failed, ${pending.length - batch.length} still waiting.`);
process.exit(failed ? 1 : 0);
