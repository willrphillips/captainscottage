#!/usr/bin/env node
/**
 * pinterest-publish.mjs: post APPROVED pins whose date has arrived.
 *
 * The gate: this script posts a pin only when `status === "approved"` and
 * `scheduledFor <= today`. A pin at "draft" is never posted, whatever else is
 * true of it. Agents write "draft"; only Will writes "approved". That
 * separation is the whole safety model, so do not add a flag that bypasses it.
 *
 * Pinterest API v5, POST /v5/pins. Trial access is enough here because we only
 * ever post to the token owner's own account.
 *
 * Env:
 *   PINTEREST_ACCESS_TOKEN   required to post. Absent = dry run, exit 0.
 *   PINTEREST_BOARD_MAP      optional JSON, {"Board Name": "board_id"}.
 *   SITE_ORIGIN              default https://captainscottageva.com
 *   DRY_RUN=1                force a dry run.
 *
 * Usage: node scripts/pinterest-publish.mjs [--limit 3]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PINS_DIR = path.join(ROOT, "content/pins");
const API = "https://api.pinterest.com/v5/pins";
const ORIGIN = process.env.SITE_ORIGIN || "https://captainscottageva.com";

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg === -1 ? 3 : Number(args[limitArg + 1]) || 3;

const token = process.env.PINTEREST_ACCESS_TOKEN;
const dryRun = !token || process.env.DRY_RUN === "1";
const boardMap = process.env.PINTEREST_BOARD_MAP ? JSON.parse(process.env.PINTEREST_BOARD_MAP) : {};
const today = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(PINS_DIR)) {
  console.log("no content/pins directory yet; nothing to do.");
  process.exit(0);
}

const files = fs.readdirSync(PINS_DIR).filter((f) => f.endsWith(".json"));
const due = [];

for (const file of files) {
  const p = path.join(PINS_DIR, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const pin of data.pins || []) {
    if (pin.status !== "approved") continue; // the gate
    if (!pin.scheduledFor || pin.scheduledFor > today) continue;
    due.push({ file: p, data, pin });
  }
}

if (!due.length) {
  console.log(`nothing due (checked ${files.length} queue files, ${today}).`);
  process.exit(0);
}

due.sort((a, b) => (a.pin.scheduledFor < b.pin.scheduledFor ? -1 : 1));
const batch = due.slice(0, LIMIT);
console.log(`${due.length} pin(s) due; posting ${batch.length}${dryRun ? " (DRY RUN)" : ""}.`);

let posted = 0;
let failed = 0;

for (const { file, data, pin } of batch) {
  const imagePath = path.join(ROOT, "public/pins", `${pin.id}.jpg`);
  if (!fs.existsSync(imagePath)) {
    console.error(`  SKIP ${pin.id}: image missing at public/pins/${pin.id}.jpg`);
    failed++;
    continue;
  }

  const boardId = pin.boardId || boardMap[pin.board];
  if (!boardId && !dryRun) {
    console.error(`  SKIP ${pin.id}: no board id for "${pin.board}". Add it to PINTEREST_BOARD_MAP.`);
    failed++;
    continue;
  }

  if (dryRun) {
    console.log(`  WOULD POST ${pin.id} -> ${pin.board} | ${pin.title}`);
    posted++;
    continue;
  }

  const body = {
    board_id: boardId,
    title: pin.title,
    description: pin.description,
    alt_text: pin.altText,
    link: pin.destinationUrl || `${ORIGIN}/journal/${data.slug}/`,
    media_source: {
      source_type: "image_base64",
      content_type: "image/jpeg",
      data: fs.readFileSync(imagePath).toString("base64"),
    },
  };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 300)}`);

    pin.status = "posted";
    pin.postedAt = new Date().toISOString();
    pin.pinterestId = json.id || null;
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    console.log(`  POSTED ${pin.id} -> pinterest ${json.id}`);
    posted++;
  } catch (err) {
    pin.lastError = String(err.message).slice(0, 300);
    pin.lastErrorAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    console.error(`  FAILED ${pin.id}: ${err.message}`);
    failed++;
  }
}

console.log(`done: ${posted} posted, ${failed} failed, ${due.length - batch.length} still due.`);
// A failed pin is recorded in the queue file and retried next run, so the job
// itself does not fail the workflow.
process.exit(0);
