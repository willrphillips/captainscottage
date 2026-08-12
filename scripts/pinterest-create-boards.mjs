#!/usr/bin/env node
/**
 * pinterest-create-boards.mjs: create the five boards from the keyword bank.
 *
 * Reads `content/pinterest/keywords.json` and creates any board named there
 * that does not already exist on the account, using that board's `sourceNote`
 * -derived description. Idempotent: existing boards are matched by exact name
 * and left untouched, so re-running is safe.
 *
 * Board names are the contract. Every pin in content/pins/*.json references a
 * board by name, so the names created here must match the bank exactly. That is
 * why this reads the bank rather than a list typed into this file.
 *
 * Env:
 *   PINTEREST_ACCESS_TOKEN   required. Needs scopes boards:read AND boards:write.
 *   DRY_RUN=1                print what would be created, create nothing.
 *
 * Usage:
 *   PINTEREST_ACCESS_TOKEN=... node scripts/pinterest-create-boards.mjs
 *   PINTEREST_ACCESS_TOKEN=... DRY_RUN=1 node scripts/pinterest-create-boards.mjs
 *
 * Prints the PINTEREST_BOARD_MAP secret value when done.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const API = "https://api.pinterest.com/v5";

// Prefer the env var; fall back to the token minted by pinterest-auth.mjs so
// this can be re-run without going through OAuth again.
function readSavedToken() {
  const f = path.join(ROOT, ".pinterest-token.local");
  if (!fs.existsSync(f)) return null;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")).access_token || null;
  } catch {
    return null;
  }
}

const token = process.env.PINTEREST_ACCESS_TOKEN || readSavedToken();
const dryRun = process.env.DRY_RUN === "1";

if (!token) {
  console.error(
    "No token. Either set PINTEREST_ACCESS_TOKEN or run scripts/pinterest-auth.mjs first.",
  );
  process.exit(1);
}

// Descriptions live here rather than in the bank because the bank's sourceNote
// is internal rationale, not public copy. Keys must match bank board names.
const DESCRIPTIONS = {
  "Virginia's Northern Neck":
    "Where the Potomac meets the Chesapeake Bay: Reedville, Irvington, Kilmarnock, Heathsville, and the quiet waterfront in between. Travel guides, day trips, and what to do on Virginia's Northern Neck.",
  "Weekend Getaways from Washington DC":
    "Weekend trips and long weekends within three hours of Washington DC. Waterfront stays, drive times, no Bay Bridge traffic, and where to go instead of the Eastern Shore.",
  "Chesapeake Bay Travel":
    "Chesapeake Bay travel on the Virginia side: tidal creeks, working fishing villages, crabbing, oysters, and small-town waterfronts worth the drive.",
  "Waterfront Cottage Stays":
    "Waterfront cottage rentals and cabin stays with a private dock. Cedar sauna, hot tub, kayaks, and swimming off the dock on a quiet tidal creek.",
  "Slow Weekends and Cabin Trips":
    "Slow travel and unplugged weekends. How to actually disconnect, what to pack, and the kind of trip you come home from rested instead of needing another vacation.",
};

async function api(pathname, options = {}) {
  const res = await fetch(API + pathname, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint =
      res.status === 401
        ? " (token wrong, expired, or missing a scope)"
        : res.status === 403
          ? " (token is missing boards:write)"
          : "";
    throw new Error(`${res.status}${hint} ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

async function main() {
  const bank = JSON.parse(
    fs.readFileSync(path.join(ROOT, "content/pinterest/keywords.json"), "utf8"),
  );
  const wanted = bank.boards.map((b) => b.name);

  const missingCopy = wanted.filter((n) => !DESCRIPTIONS[n]);
  if (missingCopy.length) {
    console.error(`No description written for: ${missingCopy.join(", ")}`);
    console.error("Add it to DESCRIPTIONS in this file, then re-run.");
    process.exit(1);
  }

  const { items: existing = [] } = await api("/boards?page_size=100");
  const byName = new Map(existing.map((b) => [b.name, b.id]));

  console.log(`${existing.length} board(s) already on the account.`);

  for (const name of wanted) {
    if (byName.has(name)) {
      console.log(`  SKIP  ${name} (exists, ${byName.get(name)})`);
      continue;
    }
    if (dryRun) {
      console.log(`  WOULD CREATE  ${name}`);
      continue;
    }
    const board = await api("/boards", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: DESCRIPTIONS[name],
        privacy: "PUBLIC", // a secret board is invisible to search, which defeats the point
      }),
    });
    byName.set(name, board.id);
    console.log(`  CREATED  ${name} -> ${board.id}`);
  }

  if (dryRun) {
    console.log("\nDry run, nothing created.");
    process.exit(0);
  }

  const map = Object.fromEntries(wanted.map((n) => [n, byName.get(n)]));
  const unresolved = wanted.filter((n) => !map[n]);
  if (unresolved.length) {
    console.error(`\nNo id for: ${unresolved.join(", ")}. Re-run.`);
    process.exit(1);
  }

  console.log("\nPaste this as the PINTEREST_BOARD_MAP secret:\n");
  console.log(JSON.stringify(map));
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`);
  console.error("Nothing was created. Fix the token or scopes and re-run; the script is idempotent.");
  // exitCode rather than exit(): exit() with an in-flight fetch handle trips a
  // libuv assertion on Windows and buries the real error message.
  process.exitCode = 1;
});
