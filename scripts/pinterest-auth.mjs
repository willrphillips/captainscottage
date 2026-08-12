#!/usr/bin/env node
/**
 * pinterest-auth.mjs: mint a Pinterest v5 access token, then set up the boards.
 *
 * Pinterest v5 does not hand you a usable token on the app page. The app page
 * gives an App ID and an App secret, neither of which works as a bearer token.
 * You have to run an OAuth round trip: approve your own app in a browser, get a
 * `code` back on the redirect, and exchange that code for an access token.
 *
 * This does the whole thing in one run:
 *   1. prints the consent URL and waits
 *   2. takes the `code` you paste back from the browser address bar
 *   3. exchanges it for an access token and a refresh token
 *   4. saves both to .pinterest-token.local (gitignored, never committed)
 *   5. creates the five boards and prints the PINTEREST_BOARD_MAP value
 *
 * Nothing leaves the machine except the calls to Pinterest itself.
 *
 * Usage (PowerShell, from the repo root):
 *   node scripts/pinterest-auth.mjs
 *
 * It prompts for the App ID and App secret. To skip the prompts:
 *   $env:PINTEREST_APP_ID='1600288'; $env:PINTEREST_APP_SECRET='...'
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const TOKEN_FILE = path.join(ROOT, ".pinterest-token.local");
const API = "https://api.pinterest.com/v5";

// Must match a redirect URI registered on the app, exactly, including the
// trailing slash. The site is static so nothing handles the callback; the code
// just lands in the address bar and you copy it. That is fine and is the
// simplest flow that needs no local server.
const REDIRECT = process.env.PINTEREST_REDIRECT_URI || "https://captainscottageva.com/";

const SCOPES = ["boards:read", "boards:write", "pins:read", "pins:write"];

const rl = readline.createInterface({ input, output });
const ask = async (q, fallback) => {
  if (fallback) return fallback;
  const a = (await rl.question(q)).trim();
  return a;
};

function openBrowser(url) {
  try {
    // Windows: `start` needs an empty title arg because the URL is quoted.
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("\nPinterest token setup\n");

  const appId = await ask("App ID (from developers.pinterest.com/apps): ", process.env.PINTEREST_APP_ID);
  if (!appId) throw new Error("App ID is required.");
  const appSecret = await ask("App secret: ", process.env.PINTEREST_APP_SECRET);
  if (!appSecret) throw new Error("App secret is required.");

  const authUrl =
    "https://www.pinterest.com/oauth/?" +
    new URLSearchParams({
      client_id: appId,
      redirect_uri: REDIRECT,
      response_type: "code",
      scope: SCOPES.join(","),
      state: "captainscottage",
    }).toString();

  console.log("\nStep 1. Approve the app in your browser.\n");
  console.log(authUrl + "\n");
  openBrowser(authUrl);
  console.log("You will land on " + REDIRECT + " with ?code=... in the address bar.");
  console.log("The page itself will look normal; the code is in the URL.\n");

  let code = (await rl.question("Paste the code (or the whole URL): ")).trim();
  if (code.includes("code=")) {
    // Accept a pasted URL and pull the code out, since that is what people do.
    code = new URL(code).searchParams.get("code") || code;
  }
  if (!code) throw new Error("No code provided.");

  console.log("\nStep 2. Exchanging the code for a token...");
  const basic = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
    }).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `token exchange failed: ${res.status} ${JSON.stringify(json).slice(0, 400)}\n` +
        "Common causes: the redirect URI does not match the one registered on the app, " +
        "the code was already used (they are single use), or the app secret is wrong.",
    );
  }

  const token = json.access_token;
  if (!token) throw new Error(`no access_token in response: ${JSON.stringify(json).slice(0, 300)}`);

  const expiresAt = json.expires_in
    ? new Date(Date.now() + json.expires_in * 1000).toISOString()
    : null;

  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify(
      {
        access_token: token,
        refresh_token: json.refresh_token || null,
        expires_at: expiresAt,
        scopes: SCOPES,
        mintedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );

  console.log(`Token saved to .pinterest-token.local (gitignored).`);
  if (expiresAt) console.log(`It expires ${expiresAt.slice(0, 10)}. The refresh token was saved too.`);

  // Verify before doing anything that writes.
  const who = await fetch(`${API}/user_account`, { headers: { Authorization: `Bearer ${token}` } });
  if (!who.ok) throw new Error(`token minted but /user_account returned ${who.status}`);
  const acct = await who.json().catch(() => ({}));
  console.log(`Authenticated as: ${acct.username || "(unknown username)"}\n`);

  console.log("Step 3. Creating boards...\n");
  process.env.PINTEREST_ACCESS_TOKEN = token;
  await import("./pinterest-create-boards.mjs");
}

main()
  .catch((err) => {
    console.error(`\nFailed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
