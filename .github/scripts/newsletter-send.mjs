#!/usr/bin/env node
/**
 * newsletter-send.mjs — emails each freshly-published journal post to the
 * Buttondown list ("Notes from the Northern Neck").
 *
 * Runs as a step in auto-publish.yml, AFTER the draft flip is committed and
 * the deploy is triggered. Input: FLIPPED_SLUGS env (space-separated slugs
 * from auto-publish.mjs's GITHUB_OUTPUT). For each slug it reads the post's
 * frontmatter and sends a short teaser email — hero image + description +
 * "read the full post" link — NOT the full body. Rationale: no fragile
 * MDX→HTML conversion, and the email drives readers to the site.
 *
 * Idempotent by construction: a post flips draft:true→false exactly once,
 * so each slug reaches this script exactly once.
 *
 * Env:
 *   FLIPPED_SLUGS        e.g. "cottage-sauna-culture mornings-with-the-ospreys"
 *   BUTTONDOWN_API_KEY   repo secret; if missing, logs and exits 0 (posts
 *                        still publish — email is best-effort, never a gate)
 *   NEWSLETTER_MODE      "send" (default) or "draft" (create Buttondown draft
 *                        for manual review instead of sending)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SITE_ORIGIN = "https://captainscottageva.com";
const API = "https://api.buttondown.com/v1/emails";

const slugs = (process.env.FLIPPED_SLUGS || "").trim().split(/\s+/).filter(Boolean);
if (!slugs.length) {
  console.log("newsletter: no flipped slugs; nothing to send.");
  process.exit(0);
}
const key = process.env.BUTTONDOWN_API_KEY;
if (!key) {
  console.log("newsletter: BUTTONDOWN_API_KEY not set — skipping email for:", slugs.join(", "));
  process.exit(0);
}
// "about_to_send" queues the email immediately; "draft" parks it for review.
const status = process.env.NEWSLETTER_MODE === "draft" ? "draft" : "about_to_send";

// Minimal frontmatter reader. Match the raw line, then trim + strip the
// surrounding quotes explicitly — quote-stripping inside the regex backtracks
// badly against CRLF line endings.
function fm(block, name) {
  const m = block.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"));
  let v = m ? m[1].trim() : "";
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

let sent = 0;
let failed = 0;
for (const slug of slugs) {
  const path = resolve(process.cwd(), `src/content/blog/${slug}.mdx`);
  if (!existsSync(path)) {
    console.error(`newsletter: ${slug}.mdx not found — skipped`);
    failed++;
    continue;
  }
  const raw = readFileSync(path, "utf8");
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    console.error(`newsletter: ${slug} has no frontmatter — skipped`);
    failed++;
    continue;
  }
  const block = fmMatch[1];
  const title = fm(block, "title");
  const description = fm(block, "description");
  const hero = fm(block, "hero");
  const heroAlt = fm(block, "heroAlt") || title;
  const url = `${SITE_ORIGIN}/journal/${slug}/`;

  const lines = [];
  if (hero) lines.push(`![${heroAlt}](${SITE_ORIGIN}${hero})`, "");
  lines.push(
    description,
    "",
    `[Read the full post →](${url})`,
    "",
    "— Will",
    "",
    `[Captain's Cottage](${SITE_ORIGIN}) · Hull Creek, Virginia's Northern Neck`,
  );

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject: title, body: lines.join("\n"), status }),
    });
    if (res.ok) {
      console.log(`newsletter: ${status === "draft" ? "drafted" : "queued"} "${title}" (${slug})`);
      sent++;
    } else {
      console.error(`newsletter: API ${res.status} for ${slug}:`, (await res.text()).slice(0, 500));
      failed++;
    }
  } catch (e) {
    console.error(`newsletter: request failed for ${slug}:`, e.message);
    failed++;
  }
}

console.log(`newsletter: ${sent} ${status === "draft" ? "drafted" : "queued"}, ${failed} failed.`);
// Email is best-effort: never fail the publish workflow over it, but a
// non-zero exit on total failure makes the run visibly red in Actions.
process.exit(failed > 0 && sent === 0 ? 1 : 0);
