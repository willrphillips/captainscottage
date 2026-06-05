#!/usr/bin/env bash
#
# harvest-airbnb-messages.sh — nightly cron entrypoint for the guest-reply
# knowledge base. Pulls the repo, runs the guest-reply-harvest agent headless
# (it reads new Airbnb threads from Gmail and appends to content/replies/),
# then commits + pushes only the knowledge-base changes.
#
# Designed to run on Will's always-on Ubuntu box (Tailscale). See
# scripts/HARVEST_SETUP.md for one-time setup + the Gmail-access caveat.
#
# Safe to run repeatedly: the agent is idempotent and only touches
# content/replies/. If nothing new, it commits nothing.

set -euo pipefail

# --- Config (edit REPO_DIR for your box) ------------------------------------
REPO_DIR="${CAPTAINSCOTTAGE_DIR:-$HOME/captainscottage}"
BRANCH="main"
LOG_DIR="$REPO_DIR/.harvest-logs"
TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_DIR/$TS.log") 2>&1
echo "=== harvest run $TS ==="

cd "$REPO_DIR"

# --- 1. Sync ----------------------------------------------------------------
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

# --- 2. Run the harvester headless ------------------------------------------
# `claude -p` runs non-interactively. --permission-mode bypassPermissions lets
# the agent read Gmail + write content/replies/ without prompts. The agent
# itself is constrained to that directory + read-only Gmail by its tool list.
PROMPT='Run the guest-reply-harvest agent now. Read content/replies/.harvest-state.json for the window, mine only NEW Airbnb guest-message threads from Gmail since then, dedupe against the existing content/replies/ topic files, append genuinely-new Q&A topics (anonymized, recency-wins), advance the state file, and append one line to content/replies/harvest-log.md. If Gmail is unreachable, report it and change nothing.'

claude -p "$PROMPT" \
  --permission-mode bypassPermissions \
  --allowedTools "Read,Write,Edit,Glob,Grep,mcp__claude_ai_Gmail__search_threads,mcp__claude_ai_Gmail__get_thread" \
  || { echo "claude run failed — leaving repo untouched"; exit 1; }

# --- 3. Commit + push ONLY the knowledge base -------------------------------
if [[ -n "$(git status --porcelain content/replies/)" ]]; then
  git add content/replies/
  git commit -m "Harvest: append new Airbnb guest-message topics ($TS)

Automated nightly run of the guest-reply-harvest agent on the Ubuntu box.
Anonymized, deduped, recency-wins. KB only (content/replies/); never
touches the site or sends anything."
  git push origin "$BRANCH"
  echo "=== committed + pushed knowledge-base changes ==="
else
  echo "=== no new knowledge-base changes this run ==="
fi

echo "=== harvest run $TS complete ==="
