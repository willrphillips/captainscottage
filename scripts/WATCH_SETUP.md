# Real-time guest-reply → Telegram (Ubuntu box setup)

Every ~5 minutes, the box checks Gmail for **new** Airbnb guest messages,
drafts a reply (the `guest-reply` agent: knowledge base + voice rules +
property facts), saves it as a Gmail draft, and **pushes the draft to your
Telegram** so you can copy/paste it into the Airbnb app. **Nothing is ever
sent to a guest automatically** — you're always the send gate.

Builds on the same box + repo as the nightly harvester (`HARVEST_SETUP.md`).
Same Gmail-headless dependency — do that verification step first.

Pieces (in the repo):
- `scripts/guest-reply-watch.sh` — the ~5-min cron entrypoint
- `scripts/notify-telegram.mjs` — sends the Telegram message
- `scripts/.captainscottage.env.example` — copy to `.captainscottage.env` (gitignored)

---

## 1. Create the Telegram bot (2 minutes)
1. In Telegram, message **@BotFather** → `/newbot` → follow prompts → it gives
   you a **bot token** like `123456789:AA...`.
2. Open a chat with your new bot and send it any message (e.g. "hi") — this
   lets the bot message you back.
3. Get your **chat ID**: open
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser and find
   `"chat":{"id":123456789,...}` — that number is your `TELEGRAM_CHAT_ID`.

## 2. Drop the secrets on the box (gitignored)
```bash
cd ~/captainscottage/scripts
cp .captainscottage.env.example .captainscottage.env
nano .captainscottage.env       # paste the bot token + chat ID
chmod 600 .captainscottage.env
```

## 3. Test the notifier
```bash
cd ~/captainscottage
set -a; source scripts/.captainscottage.env; set +a
node scripts/notify-telegram.mjs "Captain's Cottage watcher is wired up ✅"
```
You should get that message in Telegram. If not, re-check the token/chat ID.

## 4. Test the full watch run once
```bash
bash ~/captainscottage/scripts/guest-reply-watch.sh
tail -n 40 ~/captainscottage/.harvest-logs/watch.log
```
If there are new guest messages, you'll get a Telegram draft per message and a
Gmail draft to match. If not, the log says so. (Same Gmail-headless caveat as
the harvester — if Gmail isn't reachable headless, use the API fallback in
`HARVEST_SETUP.md`.)

## 5. Schedule it (every 5 minutes)
```bash
crontab -e
```
Add:
```cron
*/5 * * * *  /usr/bin/env bash $HOME/captainscottage/scripts/guest-reply-watch.sh
```

---

## How it behaves
- **Answerable message** → Gmail draft + a Telegram message with the suggested
  reply, ready to copy/paste. Thread labeled `cottage-reply-draft` so you're
  not pinged again for it.
- **Refund / complaint / calendar / ambiguous** → no draft; a Telegram
  "NEEDS YOU" ping so you handle it directly. Thread labeled
  `cottage-needs-will`.
- **System/booking/payout mail** → ignored.
- **Follow-up in an already-drafted thread** (v1 limitation) → not re-notified,
  because the thread's already labeled. Run the `guest-reply` agent manually,
  or just reply in Airbnb. We can make follow-ups smarter later if it matters.

## Two layers, one brain
- **This (watch)** = push me a draft the moment a guest writes.
- **Nightly harvester** = grow the `content/replies/` knowledge base from new
  messages so the drafts keep getting better.
Both use the same `guest-reply`/`content/replies/` foundation and the same
draft-only, never-send gate.
