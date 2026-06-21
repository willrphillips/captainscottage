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
 *   3. Builds a prefilled compose link (To = the email's Reply-To relay address,
 *      Subject = Re:…, Body = the draft) and posts it to Will's Discord with the
 *      draft text + an "Open in Gmail" link, so Will taps → Gmail compose opens,
 *      prefilled → Send → relays to the guest.
 *
 * Never sends or modifies mail (Gmail scope is readonly; we don't even create
 * drafts). Will is the only thing that sends. Escalations (refund/complaint/
 * calendar/ambiguous) get a "handle it yourself" ping instead of a draft.
 *
 * Notifications go through a Discord webhook (replaced Telegram, then ntfy).
 * Discord delivers to Will's phone/desktop but does NOT capture replies back,
 * so voice-tuning instead learns from Will's real *sent* Gmail replies (the
 * daily tuner diffs what he sent vs what the agent would have drafted).
 *
 * Env (from GitHub secrets):
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 *   DISCORD_WEBHOOK_URL        (the Discord channel incoming-webhook URL — kept
 *                               in a secret; it embeds a token)
 *   CLAUDE_CODE_OAUTH_TOKEN    (consumed by the `claude` CLI, not read here)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { gmailAccessToken, gmailList, gmailGet, header, plainBody } from "../lib/gmail.mjs";

const ROOT = process.cwd();
const STATE_PATH = resolve(ROOT, "content/replies/.watch-state.json");
const MAX_PER_RUN = 8; // safety cap per run

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

// ---- Discord push -----------------------------------------------------------

// Posts to a Discord channel via an incoming webhook (URL kept in a secret — it
// embeds a token). Plain webhooks can't render interactive buttons (that needs a
// bot application), so the "Open in Gmail" action is a markdown link inside the
// embed instead — same tap-through flow.
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

async function notify({ title, message, clickUrl, action, priority }) {
  if (!DISCORD_WEBHOOK) {
    console.error("DISCORD_WEBHOOK_URL not set — skipping notification (add it as a GitHub secret).");
    return;
  }
  // priority >= 5 (escalation/urgent) → rust-red; otherwise cottage navy.
  const color = priority && priority >= 5 ? 0xb8552e : 0x16283d;
  let description = message || "";
  if (action?.url) description += `\n\n**[${action.label}](${action.url})**`;
  const embed = {
    title: (title || "Captain's Cottage").slice(0, 256),
    description: description.slice(0, 4000), // Discord embed description cap is 4096
    color,
  };
  if (clickUrl) embed.url = clickUrl; // makes the embed title clickable too
  const payload = { username: "Captain's Cottage", embeds: [embed] };
  try {
    const res = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // Discord returns 204 No Content on success.
    if (!res.ok) console.error("discord send failed:", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.error("discord send failed:", e.message);
  }
}

function reSubject(subject) {
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

// The Discord "Open in Gmail" link points here (https). On iOS this page bounces
// to the Gmail APP compose (googlegmail://), prefilled; on desktop/other it
// falls back to Gmail web compose. See public/compose.html.
function buildComposeLink(to, subject, body) {
  return (
    "https://captainscottageva.com/compose.html?to=" + encodeURIComponent(to) +
    "&su=" + encodeURIComponent(reSubject(subject)) +
    "&body=" + encodeURIComponent(body)
  );
}

// ---- Main -------------------------------------------------------------------

// Test mode: run the REAL drafting brain on a simulated guest question, then
// post the result (draft + prefilled compose link to yourself, or escalation)
// to Discord. Exercises the whole chain except the Gmail read (already proven).
// Triggered via workflow_dispatch; an optional test_question input overrides.
if (process.env.TEST_MODE === "true") {
  const q =
    process.env.TEST_QUESTION ||
    "Hi! Is the dock safe for young kids, and do you have life jackets? Also what time is check-in?";
  console.log("test mode: drafting a reply to a simulated question…");
  const reply = draftReply({ guestText: q, subject: "Test guest message", fromName: "Test Guest" });
  if (reply.startsWith("ESCALATE:")) {
    await notify({
      title: "TEST — agent escalated this one",
      message:
        `Simulated question: ${q}\n\n` +
        `Reason: ${reply.replace(/^ESCALATE:\s*/, "")}\n\n` +
        `(Test only. Escalations are expected while the knowledge base is still thin.)`,
      priority: 5,
    });
  } else {
    const gmail = buildComposeLink("willrphillips@gmail.com", "Test guest message", reply);
    await notify({
      title: "TEST — full draft (Gmail read skipped)",
      message:
        `Simulated question: ${q}\n\n` +
        `Agent's proposed reply:\n${reply}\n\n` +
        `Tap → opens prefilled in Gmail → Send. (Test only — addressed to you, so Send just emails yourself.)`,
      clickUrl: gmail,
      action: { label: "Open in Gmail & send", url: gmail },
    });
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

// Mark-seen mode: dismiss the current backlog. Marks every Airbnb message in
// the window as processed (no drafts, no pings), so only genuinely NEW messages
// notify going forward. Triggered via workflow_dispatch (mark_seen input).
if (process.env.MARK_SEEN === "true") {
  for (const { id } of list) seen.add(id);
  state.processedIds = [...seen];
  state.lastRunAt = new Date().toISOString();
  saveState(state);
  console.log(`mark-seen: ${list.length} message(s) marked processed.`);
  process.exit(0);
}

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
  const isGuestMsg = /reply\.airbnb\.com/i.test(replyTo);
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
    await notify({
      title: "New guest message — needs you",
      message: `${reply.replace(/^ESCALATE:\s*/, "")}\n\nHandle this one directly in Airbnb.`,
      priority: 5,
    });
  } else {
    drafted++;
    const gmail = buildComposeLink(replyTo, subject, reply);
    await notify({
      title: "New guest message — draft ready",
      message:
        `${reply}\n\n` +
        `Tap → opens prefilled in Gmail → Send. (Sends from your Gmail → relays to the guest. Nothing was sent automatically.)`,
      clickUrl: gmail,
      action: { label: "Open in Gmail & send", url: gmail },
    });
  }

  seen.add(id);
  if (newCount >= MAX_PER_RUN) {
    console.log(`Hit per-run cap (${MAX_PER_RUN}); remaining will process next run.`);
    break;
  }
}

// Persist (→ a commit) only when a guest message was handled. Empty runs change
// nothing → no commit churn.
if (newCount > 0) {
  state.processedIds = [...seen];
  state.lastRunAt = new Date().toISOString();
  saveState(state);
}

console.log(`watch: ${newCount} new guest message(s), ${drafted} drafted, ${escalated} escalated.`);
