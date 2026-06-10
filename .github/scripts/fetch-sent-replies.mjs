#!/usr/bin/env node
/**
 * fetch-sent-replies.mjs — pull Will's REAL sent guest replies for voice mining.
 *
 * Reads Gmail Sent (read-only) for messages Will sent to the Airbnb relay
 * (reply.airbnb.com), strips the quoted original, and writes ONLY his own words
 * to a throwaway file in the runner temp dir (NOT the repo). The voice tuner
 * reads that temp file to learn his phrasing, then it is discarded with the
 * runner — so door codes / WiFi / addresses in real replies never get committed
 * to this PUBLIC repo.
 *
 * Output path: $SENT_CORPUS (set by the workflow to a runner-temp file).
 * Env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, SENT_CORPUS
 */
import { writeFileSync } from "node:fs";
import { gmailAccessToken, gmailList, gmailGet, plainBody } from "../lib/gmail.mjs";

// Keep only what Will wrote — cut at the first quoted/original-message marker.
function justMyReply(text) {
  const markers = [/^On .+wrote:/m, /^>/m, /^_{5,}/m, /^-{5,}/m, /^From: /m];
  let cut = text.length;
  for (const re of markers) {
    const m = text.match(re);
    if (m && m.index < cut) cut = m.index;
  }
  return text.slice(0, cut).trim();
}

const out = process.env.SENT_CORPUS;
if (!out) {
  console.error("SENT_CORPUS path not set; nothing to do.");
  process.exit(0);
}

let corpus = "# Will's real sent guest replies (throwaway — for voice mining only)\n";
try {
  const token = await gmailAccessToken();
  const list = await gmailList(token, "in:sent to:reply.airbnb.com newer_than:30d");
  console.log(`sent list: ${list.length} reply(ies) to the Airbnb relay in the last 30 days`);
  let kept = 0;
  for (const { id } of list) {
    const msg = await gmailGet(token, id);
    const mine = justMyReply(plainBody(msg, Infinity)).slice(0, 2000);
    if (!mine) continue;
    corpus += `\n---\n${mine}\n`;
    kept++;
  }
  console.log(`captured ${kept} reply body(ies) for voice mining (not committed).`);
} catch (e) {
  console.error("fetch-sent-replies failed (non-fatal):", e.message);
}
writeFileSync(out, corpus, "utf8");
