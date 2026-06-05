# Nightly Airbnb-message harvester — Ubuntu box setup

Goal: every night, your always-on Ubuntu box (Tailscale) reads **new** Airbnb
guest messages from Gmail and appends new Q&A topics to `content/replies/`,
keeping the guest-reply knowledge base growing on its own.

Pieces (already in the repo):
- `.claude/agents/guest-reply-harvest.md` — the incremental miner agent
- `scripts/harvest-airbnb-messages.sh` — the cron entrypoint (pull → run → commit/push)
- `content/replies/.harvest-state.json` — created on first run (tracks the window)

> **Reminder on scope:** Airbnb has no API; this reads the **Gmail mirror** of
> your messages, so it only sees messages from when Gmail forwarding was on
> (~2026-05-26 onward). The older back-catalog is what Claude Cowork mines
> separately. This job handles ongoing capture.

---

## One-time setup on the Ubuntu box

### 1. Prerequisites
```bash
# Node 20+ and git
node -v && git --version

# Claude Code CLI
npm install -g @anthropic-ai/claude-code     # or your preferred install
claude --version
```

### 2. Clone the repo + authenticate git push
```bash
cd ~
git clone https://github.com/willrphillips/captainscottage.git
cd captainscottage

# Auth for pushing. Easiest: GitHub CLI
gh auth login            # choose HTTPS, authenticate
# (or add a deploy key / PAT remote — any method that lets `git push` work
#  non-interactively from cron)
```

### 3. Authenticate Claude Code (once, interactively)
```bash
claude            # log in with your Anthropic account, then /exit
```

### 4. ⚠️ Verify Gmail works HEADLESS (the one real dependency)
This is the make-or-break check. Run the harvester's read step
non-interactively and confirm it can reach Gmail:
```bash
cd ~/captainscottage
claude -p "Using the Gmail tools, search threads for: from:(@airbnb.com OR @reply.airbnb.com) newer_than:30d — just report how many threads you can see. Do not write any files." \
  --permission-mode bypassPermissions \
  --allowedTools "mcp__claude_ai_Gmail__search_threads"
```
- **If it returns a count** → Gmail works headless. You're done; go to step 5.
- **If it says Gmail/the connector is unavailable** → the claude.ai Gmail
  integration isn't reachable in headless mode on this box. Use the
  **Fallback** below instead of the MCP path.

### 5. First manual run
```bash
cd ~/captainscottage
CAPTAINSCOTTAGE_DIR=~/captainscottage bash scripts/harvest-airbnb-messages.sh
```
Check `.harvest-logs/<timestamp>.log`, and confirm `content/replies/` got a
commit (or "no new changes"). Confirm `content/replies/.harvest-state.json`
now exists.

### 6. Schedule it nightly (cron)
```bash
crontab -e
```
Add (runs 03:15 local time nightly; adjust path/time):
```cron
15 3 * * *  CAPTAINSCOTTAGE_DIR=$HOME/captainscottage /usr/bin/env bash $HOME/captainscottage/scripts/harvest-airbnb-messages.sh >> $HOME/captainscottage/.harvest-logs/cron.log 2>&1
```
That's it — it now grows the knowledge base every night.

---

## Fallback (only if step 4 fails): Gmail API + refresh token

If the headless box can't use the claude.ai Gmail connector, give it its own
Gmail access:

1. Google Cloud Console → new project → enable **Gmail API**.
2. OAuth consent screen (External, Testing is fine; add your Gmail as a test
   user). Create an **OAuth client (Desktop app)**.
3. Run a one-time local OAuth flow to mint a **refresh token** with the
   `gmail.readonly` scope; store it on the box (e.g. `~/.config/captainscottage/gmail-token.json`, `chmod 600`).
4. A small reader script (Node/Python) pulls the new Airbnb threads and writes
   them to a temp JSON; the cron then feeds that file to
   `claude -p` for the extraction/append step (same agent, but the Gmail read
   is done by the script instead of the MCP).

Ping me if you land here and I'll write the reader script + adjust the agent
to read from the temp file instead of the Gmail tools.

---

## Notes
- **Safe + gated:** the harvester only writes `content/replies/` and only reads
  Gmail. It never sends mail, never drafts replies, never touches the site. The
  `guest-reply` drafter (which the KB feeds) still produces Gmail drafts only,
  on your trigger.
- **No wasted deploys:** `content/replies/` is excluded from the Pages deploy
  trigger (`.github/workflows/deploy.yml` `paths-ignore`), so nightly KB
  commits don't rebuild the site.
- **Idempotent:** running twice won't duplicate topics (dedupe + state window).
- **Tailscale:** nothing here needs inbound access; it's all outbound (Gmail
  read, git push). Tailscale just means you can SSH in to check logs.
