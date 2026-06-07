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

async function gmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error("Gmail token refresh failed: " + JSON.stringify(j));
  return j.access_token;
}

async function gmailList(token, query) {
  const url =
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?" +
    new URLSearchParams({ q: query, maxResults: "25" });
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  const j = await res.json();
  return j.messages || [];
}

async function gmailGet(token, id) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  return res.json();
}

function decodeB64Url(data) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function plainBody(msg) {
  const walk = (part) => {
    if (!part) return "";
    if (part.mimeType === "text/plain" && part.body?.data) return decodeB64Url(part.body.data);
    for (const p of part.parts || []) {
      const t = walk(p);
      if (t) return t;
    }
    return "";
  };
  return walk(msg.payload) || msg.snippet || "";
}

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
    const mine = justMyReply(plainBody(msg)).slice(0, 2000);
    if (!mine) continue;
    corpus += `\n---\n${mine}\n`;
    kept++;
  }
  console.log(`captured ${kept} reply body(ies) for voice mining (not committed).`);
} catch (e) {
  console.error("fetch-sent-replies failed (non-fatal):", e.message);
}
writeFileSync(out, corpus, "utf8");
