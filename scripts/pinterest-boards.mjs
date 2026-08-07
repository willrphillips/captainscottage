#!/usr/bin/env node
/**
 * pinterest-boards.mjs: list your Pinterest boards and their IDs.
 *
 * The publisher needs a board-name to board-id map, and board IDs are not
 * visible anywhere useful in the Pinterest UI. Run this once after the boards
 * exist and paste the printed JSON into the PINTEREST_BOARD_MAP repo secret.
 *
 * Usage:
 *   PINTEREST_ACCESS_TOKEN=... node scripts/pinterest-boards.mjs
 *
 * Read-only. It lists boards and nothing else.
 */

const token = process.env.PINTEREST_ACCESS_TOKEN;
if (!token) {
  console.error("PINTEREST_ACCESS_TOKEN is not set. See PINTEREST_SETUP.md step 5.");
  process.exit(1);
}

const res = await fetch("https://api.pinterest.com/v5/boards?page_size=50", {
  headers: { Authorization: `Bearer ${token}` },
});

if (!res.ok) {
  const body = await res.text();
  console.error(`Pinterest returned ${res.status}: ${body.slice(0, 400)}`);
  if (res.status === 401) console.error("\nThe token is wrong, expired, or missing the boards:read scope.");
  process.exit(1);
}

const { items = [] } = await res.json();
if (!items.length) {
  console.log("No boards found. Create them first (PINTEREST_SETUP.md step 4).");
  process.exit(0);
}

console.log(`${items.length} board(s):\n`);
for (const b of items) console.log(`  ${b.name}  ->  ${b.id}`);

const map = Object.fromEntries(items.map((b) => [b.name, b.id]));
console.log("\nPaste this as the PINTEREST_BOARD_MAP secret:\n");
console.log(JSON.stringify(map));
