/**
 * guest-email-trigger — Cloudflare Email Worker.
 *
 * Turns the guest-reply watcher from a polled cron into a push system.
 *
 * Flow:
 *   Gmail filter auto-forwards Airbnb guest mail → an address on
 *   captainscottageva.com routed (Cloudflare Email Routing) to this Worker →
 *   the Worker fires a GitHub `repository_dispatch` (type: guest-email) →
 *   .github/workflows/guest-reply-watch.yml runs within seconds → reads the
 *   real message from Gmail, drafts a reply, and pings Discord.
 *
 * The Worker is ONLY a trigger. It never reads the message body, never drafts,
 * never sends — the watcher still does all of that from Gmail. We dispatch on
 * the bare fact that an Airbnb email arrived.
 *
 * Secrets (set with `wrangler secret put`):
 *   GH_DISPATCH_TOKEN  — a GitHub fine-grained PAT scoped to this repo with
 *                        Contents: read & write (required by the dispatches API).
 *
 * Vars (in wrangler.toml [vars]):
 *   GH_OWNER, GH_REPO, GH_EVENT_TYPE, FORWARD_TO (optional fallback mailbox).
 */

const AIRBNB_RE = /(^|[@.])airbnb\.com$/i;

function senderDomain(message) {
  // Envelope from is most reliable; fall back to the From header.
  const addr =
    message.from ||
    (message.headers.get("from") || "").match(/<([^>]+)>/)?.[1] ||
    message.headers.get("from") ||
    "";
  return (addr.split("@")[1] || "").trim().toLowerCase();
}

async function fireDispatch(env, payload) {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      // GitHub rejects requests without a User-Agent.
      "User-Agent": "captainscottage-guest-email-trigger",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: env.GH_EVENT_TYPE || "guest-email",
      client_payload: payload,
    }),
  });
  // 204 No Content = success.
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`dispatch failed: ${res.status} ${body}`);
  }
}

export default {
  async email(message, env, ctx) {
    const domain = senderDomain(message);
    const isAirbnb = AIRBNB_RE.test(domain);

    // Best-effort: keep a copy flowing to a real inbox if one is configured.
    // (Also how you complete Gmail's forward-address verification — see setup.)
    if (env.FORWARD_TO) {
      try {
        await message.forward(env.FORWARD_TO);
      } catch (e) {
        console.error("forward failed:", e.message);
      }
    }

    if (!isAirbnb) {
      // Not guest mail — do nothing (no dispatch, no wasted Actions run).
      console.log(`skip: sender domain ${domain || "(unknown)"} is not airbnb.com`);
      return;
    }

    // Don't block mail delivery on the dispatch; let it finish in the background.
    ctx.waitUntil(
      fireDispatch(env, {
        source: "cloudflare-email-worker",
        from_domain: domain,
        subject: message.headers.get("subject") || "",
        received_at: new Date().toISOString(),
      })
        .then(() => console.log("dispatched guest-email"))
        .catch((e) => console.error(e.message)),
    );
  },
};
