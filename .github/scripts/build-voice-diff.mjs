#!/usr/bin/env node
/**
 * build-voice-diff.mjs — sent-vs-draft correction mining (voice tuning).
 *
 * For each Airbnb guest thread Will replied to in the last 30 days:
 *   - fetch the guest's inbound question,
 *   - re-run the SAME drafting brain the watcher uses to get "what we'd draft",
 *   - pair it with what Will ACTUALLY sent (from Gmail Sent),
 * and where his sent reply differs from the draft, that delta is a direct voice
 * correction. The pairs are written to a THROWAWAY file ($VOICE_DIFF) in the
 * runner temp dir; the voice tuner reads it, distills the corrections into
 * voice-rules.md, and the file is discarded with the runner. Nothing here is
 * committed — guest text, Will's text, and any PII never touch this PUBLIC repo.
 *
 * Only works when Will replies THROUGH GMAIL (the compose.html → Gmail flow), so
 * his reply lands in Gmail Sent. Replies sent only inside the Airbnb app are
 * invisible here — that's an accepted limitation.
 *
 * Env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN,
 *      CLAUDE_CODE_OAUTH_TOKEN (for the re-draft), VOICE_DIFF (output path)
 */
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gmailAccessToken, gmailList, gmailGet, header, plainBody } from "../lib/gmail.mjs";

const ROOT = process.cwd();
const OUT = process.env.VOICE_DIFF;

// Same drafting brain as the watcher (guest-reply-cloud.mjs). Kept in sync by
// hand — if you change the watcher's prompt, change it here too.
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
    console.error("re-draft failed:", e.message);
    return "";
  }
}

// Keep only Will's own words — cut at the first quoted/original-message marker.
function justMyReply(text) {
  const markers = [/^On .+wrote:/m, /^>/m, /^_{5,}/m, /^-{5,}/m, /^From: /m];
  let cut = text.length;
  for (const re of markers) {
    const m = text.match(re);
    if (m && m.index < cut) cut = m.index;
  }
  return text.slice(0, cut).trim();
}

const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
const oneLine = (s) => (s || "").replace(/\s+/g, " ").trim();

if (!OUT) {
  console.error("VOICE_DIFF path not set; nothing to do.");
  process.exit(0);
}

let corpus =
  "# Sent-vs-draft corrections (throwaway — voice mining only)\n" +
  "# Each entry: the guest question, what the agent WOULD have drafted, what Will ACTUALLY sent.\n";

try {
  const token = await gmailAccessToken();

  // 1) Will's sent replies → threadId → his text (gmailList returns threadId).
  const sent = await gmailList(token, "in:sent to:reply.airbnb.com newer_than:30d");
  const sentByThread = new Map();
  for (const m of sent) {
    if (!m.threadId || sentByThread.has(m.threadId)) continue;
    const msg = await gmailGet(token, m.id);
    const mine = justMyReply(plainBody(msg, Infinity));
    if (mine) sentByThread.set(m.threadId, mine);
  }
  console.log(`sent replies: ${sentByThread.size} answered thread(s)`);

  // 2) Inbound guest questions for threads Will answered.
  const inbound = await gmailList(token, "from:airbnb.com newer_than:30d");
  const guestByThread = new Map();
  for (const m of inbound) {
    if (!m.threadId || !sentByThread.has(m.threadId) || guestByThread.has(m.threadId)) continue;
    const msg = await gmailGet(token, m.id);
    if (!/reply\.airbnb\.com/i.test(header(msg, "Reply-To"))) continue; // guest messages only
    const from = header(msg, "From");
    const fromName = (from.match(/^"?([^"<]+?)"?\s*</) || [, from])[1].trim();
    guestByThread.set(m.threadId, {
      guestText: plainBody(msg),
      subject: header(msg, "Subject"),
      fromName,
    });
  }
  console.log(`matched guest questions: ${guestByThread.size}`);

  // 3) Re-draft each + keep only the pairs where Will changed something.
  let pairs = 0;
  for (const [threadId, q] of guestByThread) {
    const willSent = sentByThread.get(threadId);
    const wouldDraft = draftReply(q);
    if (!wouldDraft || wouldDraft.startsWith("ESCALATE:")) continue; // nothing comparable
    if (norm(willSent) === norm(wouldDraft)) continue; // sent verbatim → no correction
    corpus +=
      `\n---\n` +
      `GUEST: ${oneLine(q.guestText).slice(0, 600)}\n\n` +
      `WOULD-DRAFT: ${oneLine(wouldDraft).slice(0, 900)}\n\n` +
      `WILL-SENT: ${oneLine(willSent).slice(0, 900)}\n`;
    pairs++;
  }
  console.log(`captured ${pairs} sent-vs-draft correction pair(s) (not committed).`);
} catch (e) {
  console.error("build-voice-diff failed (non-fatal):", e.message);
}

writeFileSync(OUT, corpus, "utf8");
