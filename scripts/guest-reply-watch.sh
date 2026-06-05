#!/usr/bin/env bash
#
# guest-reply-watch.sh — near-real-time guest-reply drafting + phone push.
#
# Runs every ~5 min on the Ubuntu box. Finds NEW Airbnb guest messages in
# Gmail, drafts a reply (the guest-reply agent: KB + voice rules + facts),
# saves it as a Gmail draft, AND pushes the draft text to Will's Telegram so
# he can copy/paste into the Airbnb app. NOTHING is ever auto-sent to guests.
#
# Dedupe: the agent labels threads `cottage-reply-draft` (already drafted) and
# `cottage-needs-will` (escalation), and the watch query skips both, so each
# message is handled once.
#
# See scripts/WATCH_SETUP.md for setup (BotFather token, env file, crontab).

set -euo pipefail

# --- Load secrets/config (gitignored) ---------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.captainscottage.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

REPO_DIR="${CAPTAINSCOTTAGE_DIR:-$HOME/captainscottage}"
NOTIFY_DIR="$REPO_DIR/runtime/notify"
LOG_DIR="$REPO_DIR/.harvest-logs"
TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

mkdir -p "$NOTIFY_DIR" "$LOG_DIR"
exec >> "$LOG_DIR/watch.log" 2>&1
echo "=== watch run $TS ==="

cd "$REPO_DIR"
git pull --ff-only origin main || echo "(git pull skipped/failed — continuing with local KB)"

# --- Draft any new guest messages (guest-reply agent, headless) -------------
# The agent creates a Gmail draft per answerable message and labels the thread.
# We additionally ask it to drop the human-facing text for each new item into
# runtime/notify/<id>.txt so this wrapper can push it to Telegram.
PROMPT='Run the guest-reply agent now against NEW Airbnb guest threads in Gmail (exclude threads already labeled cottage-reply-draft or cottage-needs-will). For each thread:
- DRAFT (answerable from the knowledge base / facts): create the Gmail draft and label the thread cottage-reply-draft as usual. THEN also write a file runtime/notify/<threadid>.txt whose entire contents are a phone-ready message in this shape:
    "New guest message — DRAFT ready\n\nThey asked: <one-line anonymized summary>\n\nSuggested reply:\n<the full drafted reply text>\n\n(Saved as a Gmail draft too. Copy/paste into Airbnb — nothing was sent.)"
- NEEDS-WILL (refund/complaint/calendar/ambiguous): do NOT draft; label cottage-needs-will and write runtime/notify/<threadid>.txt containing:
    "New guest message — NEEDS YOU\n\nThey asked: <one-line anonymized summary>\n\nThis one is a <reason> — handle it directly in Airbnb."
- SKIP: ignore, write nothing.
Anonymize (no guest names). If there is nothing new, write no files and say so. If Gmail is unreachable, report it and write nothing.'

claude -p "$PROMPT" \
  --permission-mode bypassPermissions \
  --allowedTools "Read,Write,Edit,Glob,Grep,mcp__claude_ai_Gmail__search_threads,mcp__claude_ai_Gmail__get_thread,mcp__claude_ai_Gmail__create_draft,mcp__claude_ai_Gmail__list_labels,mcp__claude_ai_Gmail__create_label,mcp__claude_ai_Gmail__label_thread" \
  || { echo "claude run failed"; exit 1; }

# --- Push each new notification, then clear it ------------------------------
shopt -s nullglob
sent=0
for f in "$NOTIFY_DIR"/*.txt; do
  if node "$SCRIPT_DIR/notify-telegram.mjs" --file "$f"; then
    rm -f "$f"
    sent=$((sent + 1))
  else
    echo "notify failed for $f — leaving it for the next run"
  fi
done
echo "=== watch run $TS complete — $sent notification(s) sent ==="
