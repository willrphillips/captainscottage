// Shared Gmail REST helpers (read-only) for the guest-reply Actions scripts.
// Used by guest-reply-cloud.mjs (watcher) and fetch-sent-replies.mjs (voice
// miner). Env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN.

export async function gmailAccessToken() {
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

export async function gmailList(token, query) {
  const url =
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?" +
    new URLSearchParams({ q: query, maxResults: "25" });
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  const j = await res.json();
  return j.messages || [];
}

export async function gmailGet(token, id) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  return res.json();
}

export function header(msg, name) {
  const h = (msg.payload?.headers || []).find(
    (x) => x.name.toLowerCase() === name.toLowerCase(),
  );
  return h?.value || "";
}

export function decodeB64Url(data) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

// Pull a plain-text body out of the message payload (falls back to snippet).
// maxLength caps the watcher's prompt size; pass Infinity for full bodies.
export function plainBody(msg, maxLength = 4000) {
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
  return maxLength === Infinity ? body : body.slice(0, maxLength);
}
