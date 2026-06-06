#!/usr/bin/env node
/**
 * mint-gmail-token.mjs — one-time helper to get a Gmail READ-ONLY refresh
 * token for the guest-reply watcher. Run locally (e.g. on Windows). It opens
 * a Google sign-in, you approve read-only Gmail access, and it prints a
 * refresh token to paste into the GitHub secret GMAIL_REFRESH_TOKEN.
 *
 * Scope is gmail.readonly ONLY — this token can read mail, never send or
 * modify it.
 *
 * Usage:
 *   node scripts/mint-gmail-token.mjs <CLIENT_ID> <CLIENT_SECRET>
 * (or set GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET env vars and run with no args)
 */
import http from "node:http";
import { exec } from "node:child_process";

const CLIENT_ID = process.argv[2] || process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.argv[3] || process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Usage: node scripts/mint-gmail-token.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  }).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  if (err) {
    res.end(`Authorization failed: ${err}. You can close this tab.`);
    console.error("Authorization error:", err);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.end("Waiting for Google authorization…");
    return;
  }
  // Exchange the code for tokens.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  const tok = await tokenRes.json();
  res.setHeader("content-type", "text/html");
  if (tok.refresh_token) {
    res.end("<h2>Success ✅</h2><p>Refresh token minted. Back to the terminal — you can close this tab.</p>");
    console.log("\n=== GMAIL_REFRESH_TOKEN (copy this into the GitHub secret) ===\n");
    console.log(tok.refresh_token);
    console.log("\n=============================================================\n");
  } else {
    res.end("<h2>No refresh token returned.</h2><p>See the terminal.</p>");
    console.error("No refresh_token in response:", JSON.stringify(tok, null, 2));
    console.error("\nTip: revoke prior access at https://myaccount.google.com/permissions and re-run (prompt=consent forces a fresh refresh token).");
  }
  server.close();
  process.exit(tok.refresh_token ? 0 : 1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("\nOpen this URL in your browser and approve read-only Gmail access:\n");
  console.log(authUrl + "\n");
  // Best-effort auto-open (Windows/macOS/Linux).
  const opener =
    process.platform === "win32" ? `start "" "${authUrl}"`
    : process.platform === "darwin" ? `open "${authUrl}"`
    : `xdg-open "${authUrl}"`;
  exec(opener, () => {});
});
