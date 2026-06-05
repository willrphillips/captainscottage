#!/usr/bin/env node
/**
 * notify-telegram.mjs — send a message to Will's Telegram via the bot API.
 *
 * Reads TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID from the environment (set them
 * in scripts/.captainscottage.env on the box — gitignored, never committed).
 *
 * Usage:
 *   node notify-telegram.mjs "some text"
 *   node notify-telegram.mjs --file path/to/message.txt
 *   echo "text" | node notify-telegram.mjs
 *
 * Telegram caps a message at 4096 chars; long drafts are split.
 */
import { readFileSync } from "node:fs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error("notify-telegram: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set (see scripts/.captainscottage.env).");
  process.exit(2);
}

// Resolve the message text from --file, an arg, or stdin.
async function getText() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    return readFileSync(args[fileIdx + 1], "utf8");
  }
  if (args.length && args[0] !== "--file") {
    return args.join(" ");
  }
  // stdin
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

function chunk(str, size) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

const text = (await getText()).trim();
if (!text) {
  console.error("notify-telegram: empty message, nothing to send.");
  process.exit(1);
}

const parts = chunk(text, 3900); // headroom under the 4096 cap
let allOk = true;
for (const part of parts) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: part,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    allOk = false;
    const body = await res.text().catch(() => "");
    console.error(`notify-telegram: send failed ${res.status} ${res.statusText} ${body}`);
  }
}
process.exit(allOk ? 0 : 1);
