#!/usr/bin/env node
/**
 * guest-reply-cloud.mjs — the GitHub Actions guest-reply watcher.
 *
 * Every run:
 *   1. Reads NEW Airbnb guest-message emails from Gmail (read-only) since the
 *      last processed message (state in content/replies/.watch-state.json).
 *   2. For each new guest message, drafts a reply with Claude Code (the
 *      subscription OAuth token — no API billing), grounded in
 *      content/replies/ + voice-rules + src/lib/site.ts, in Will's MESSAGING
 *      voice.
 *   3. Builds a prefilled `mailto:` (To = the email's Reply-To relay address,
 *      Subject = Re:…, Body = the draft) and pushes it to Telegram with the
 *      draft text, so Will taps → Gmail compose opens → Send → relays to guest.
 *
 * Never sends or modifies mail (Gmail scope is readonly; we don't even create
 * drafts). Will is the only thing that sends. Escalations (refund/complaint/
 * calendar/ambiguous) get a "handle it yourself" ping instead of a draft.
 *
 * Env (from GitHub secrets):
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   CLAUDE_CODE_OAUTH_TOKEN  (consumed by the `claude` CLI, not read here)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const STATE_PATH = resolve(ROOT, "content/replies/.watch-state.json");
const MAX_PER_RUN = 8; // safety cap per run

// ---- Gmail REST helpers (read-only) ----------------------------------------

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

function header(msg, name) {
  const h = (msg.payload?.headers || []).find(
    (x) => x.name.toLowerCase() === name.toLowerCase(),
  );
  return h?.value || "";
}

function decodeB64Url(data) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

// Pull a plain-text body out of the message payload (falls back to snippet).
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
  const body = walk(msg.payload) || msg.snippet || "";
  return body.slice(0, 4000);
}

// ---- State ------------------------------------------------------------------

function loadState() {
  if (existsSync(STATE_PATH)) {
    try {
      return JSON.parse(readFileSync(STATE_PATH, "utf8"));
    } catch {}
  }
  return { processedIds: [], lastRunAt: null };
}
function saveState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  // keep the processed-id list bounded
  state.processedIds = state.processedIds.slice(-500);
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");
}

// ---- Claude drafting --------------------------------------------------------

function draftReply({ guestText, subject, fromName }) {
  const prompt = `You are drafting a reply to an Airbnb guest message for Captain's Cottage.

Read these for voice + facts (use the Read tool):
- content/replies/voice-rules.md  (CRITICAL: use Will's MESSAGING voice, short/plain/texting register — NOT the journal/blog voice)
- content/replies/ topic files (the canonical Q&A knowledge base)
- src/lib/site.ts (PROPERTY facts), src/lib/guidebook.ts, src/pages/faq.astro, src/pages/amenities.astro, src/pages/what-to-bring.astro, src/pages/the-cottage.astro

The guest message (from ${fromName || "a guest"}, subject "${subject}"):
"""
${guestText}
"""

Decide:
- If this is answerable from the knowledge base / property facts, output ONLY the drafted reply text — no preamble, no quotes, no signature beyond how Will signs in voice-rules. Short and warm, his messaging voice.
- If it is a refund, complaint, cancellation, calendar/date negotiation, or anything sensitive/ambiguous where a wrong answer has cost, output exactly: ESCALATE: <one short reason>

Output nothing else.`;

  try {
    const out = execFileSync(
      "claude",
      ["-p", prompt, "--permission-mode", "bypassPermissions", "--allowedTools", "Read,Glob,Grep"],
      { cwd: ROOT, encoding: "utf8", timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
    );
    return out.trim();
  } catch (e) {
    console.error("claude draft failed:", e.message);
    return "ESCALATE: drafting failed (see Actions log)";
  }
}

// ---- Telegram ---------------------------------------------------------------

async function telegram(text, button) {
  const payload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    disable_web_page_preview: true,
  };
  // An inline button renders as a clean, reliably-tappable button on mobile
  // and desktop (avoids Telegram's flaky auto-linking of long URLs). Button
  // URLs must be http/https — so we use the Gmail compose URL, not mailto.
  if (button?.url) {
    payload.reply_markup = { inline_keyboard: [[{ text: button.text, url: button.url }]] };
  }
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) },
  );
  if (!res.ok) console.error("telegram send failed:", res.status, await res.text().catch(() => ""));
}

function reSubject(subject) {
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

// Gmail web/app compose URL — opens a prefilled compose (to + subject + body).
// A clean https link, so Telegram always renders it tappable, and on a phone
// it opens the Gmail app's compose. This is the primary "open & send" link.
function buildGmailCompose(to, subject, body) {
  return (
    "https://mail.google.com/mail/?view=cm&fs=1" +
    "&to=" + encodeURIComponent(to) +
    "&su=" + encodeURIComponent(reSubject(subject)) +
    "&body=" + encodeURIComponent(body)
  );
}

// Fallback for non-Gmail default mail apps.
function buildMailto(to, subject, body) {
  return (
    "mailto:" + encodeURIComponent(to) +
    "?subject=" + encodeURIComponent(reSubject(subject)) +
    "&body=" + encodeURIComponent(body)
  );
}

// ---- Main -------------------------------------------------------------------

// Test mode: run the REAL drafting brain on a simulated guest question, then
// Telegram the result (draft + prefilled mailto to yourself, or escalation).
// Exercises the whole chain except the Gmail read (already proven). Triggered
// via workflow_dispatch; an optional test_question input overrides the sample.
if (process.env.TEST_MODE === "true") {
  const q =
    process.env.TEST_QUESTION ||
    "Hi! Is the dock safe for young kids, and do you have life jackets? Also what time is check-in?";
  console.log("test mode: drafting a reply to a simulated question…");
  const reply = draftReply({ guestText: q, subject: "Test guest message", fromName: "Test Guest" });
  if (reply.startsWith("ESCALATE:")) {
    await telegram(
      `🔴 TEST — the agent ESCALATED this one\n\n` +
        `Simulated question: ${q}\n\n` +
        `Reason: ${reply.replace(/^ESCALATE:\s*/, "")}\n\n` +
        `(Test only. Escalations are expected while the knowledge base is still thin.)`,
    );
  } else {
    const gmail = buildGmailCompose("willrphillips@gmail.com", "Test guest message", reply);
    await telegram(
      `✉️ TEST — full draft (Gmail read skipped)\n\n` +
        `Simulated question: ${q}\n\n` +
        `Agent's proposed reply:\n${reply}\n\n` +
        `Tap the button below → opens prefilled in Gmail → Send.\n` +
        `(Test only — addressed to you, so Send just emails yourself.)`,
      { text: "✉️ Open in Gmail & send", url: gmail },
    );
  }
  console.log("test mode: done.");
  process.exit(0);
}

const state = loadState();
const seen = new Set(state.processedIds);
const token = await gmailAccessToken();

// Any Airbnb mail in the window; we classify per-message below by Reply-To.
const query = "from:airbnb.com newer_than:3d";
const list = await gmailList(token, query);
console.log(`gmail list: ${list.length} message(s) from airbnb.com in the last 3 days`);

let newCount = 0;
let drafted = 0;
let escalated = 0;

for (const { id } of list) {
  if (seen.has(id)) continue;
  const msg = await gmailGet(token, id);

  const replyTo = header(msg, "Reply-To");
  const subject = header(msg, "Subject");
  const from = header(msg, "From");

  // SAFE diagnostic (no names/subjects/tokens/body — log is public):
  const fromEmail = (from.match(/<([^>]+)>/)?.[1] || from).trim().toLowerCase();
  const replyToDomain = replyTo.match(/@([^>\s]+)/)?.[1] || "(none)";
  const isGuestMsg = /reply.*@.*airbnb\.com/i.test(replyTo);
  console.log(`candidate from=${fromEmail} replyToDomain=${replyToDomain} guest=${isGuestMsg}`);

  if (!isGuestMsg) {
    seen.add(id); // mark non-guest mail seen so we don't re-fetch it
    continue;
  }

  newCount++;
  const fromName = (from.match(/^"?([^"<]+?)"?\s*</) || [, from])[1].trim();
  const guestText = plainBody(msg);

  const reply = draftReply({ guestText, subject, fromName });

  if (reply.startsWith("ESCALATE:")) {
    escalated++;
    await telegram(
      `🔴 New guest message — NEEDS YOU\n\n` +
        `${reply.replace(/^ESCALATE:\s*/, "")}\n\n` +
        `Handle this one directly in Airbnb.`,
    );
  } else {
    drafted++;
    const gmail = buildGmailCompose(replyTo, subject, reply);
    await telegram(
      `✉️ New guest message — DRAFT ready\n\n` +
        `Proposed reply:\n${reply}\n\n` +
        `Tap the button below → opens prefilled in Gmail → Send.\n` +
        `(Sends from your Gmail → relays to the guest. Nothing was sent automatically.)`,
      { text: "✉️ Open in Gmail & send", url: gmail },
    );
  }

  seen.add(id);
  if (newCount >= MAX_PER_RUN) {
    console.log(`Hit per-run cap (${MAX_PER_RUN}); remaining will process next run.`);
    break;
  }
}

// Only persist (→ a commit) when a guest message was actually handled, so we
// don't churn a commit every 10 minutes on empty runs.
if (newCount > 0) {
  state.processedIds = [...seen];
  state.lastRunAt = new Date().toISOString();
  saveState(state);
}

console.log(`watch: ${newCount} new guest message(s), ${drafted} drafted, ${escalated} escalated.`);
