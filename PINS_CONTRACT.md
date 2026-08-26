# Pin queue contract (for capcom, or any other reviewer/publisher)

Hand this file to whoever builds the review-and-post UI. It is the integration
contract for `content/pins/*.json` in the **captainscottage** repo
(`c:\Code\buffalo-rentals\captainscottage`). Written 2026-08-10.

Capcom's job, as Will described it: **review pins and post them automatically.**
This file says exactly what that means, what capcom owns, and the one design
decision that has to be made before any of it ships.

---

## Who posts: DECIDED 2026-08-10

**Option A is locked.** Capcom reviews; the existing GitHub Action posts. Will:
"I don't want pins to go out twice... capcom reviews, existing cron posts will
work fine. I'm just thinking if I can look at them and approve/reject with notes
in capcom, that should do it."

So capcom needs no Pinterest token and no Pinterest API code. It writes `status`
(and `rejectedReason` / `approvedAt` / `scheduledFor`) to the queue files,
commits, and stops there. Do not add posting to capcom without first deleting
the `schedule:` block in `.github/workflows/pinterest-publish.yml`.

The reasoning is kept below for whoever reads this later.

## The decision, for the record

There is already a publisher in this repo. `scripts/pinterest-publish.mjs`, run
daily at 14:00 UTC by `.github/workflows/pinterest-publish.yml`, posts approved
pins whose date has arrived.

**If capcom also posts, every pin goes out twice.** Both readers see the same
`status: "approved"` and the same date, and neither knows about the other.

Pick one:

| Option | Who posts | What changes |
|---|---|---|
| **A. Capcom reviews, GH Action posts** (recommended) | The existing cron | Capcom only ever writes `status` and commits. No token in capcom, no Pinterest API code, no double-post risk. |
| B. Capcom does both | Capcom | **Disable `pinterest-publish.yml` first** (delete the `schedule:` block). Capcom needs `PINTEREST_ACCESS_TOKEN` and must replicate the posting rules below. |

A is recommended because posting is already built, tested, and rate-limited, and
because the failure mode of B is public and embarrassing rather than quiet.

---

## Where things live

| Thing | Path |
|---|---|
| Queue files | `content/pins/<slug>.json`, one per blog post |
| Pin images | `public/pins/<pin-id>.jpg`, 1000x1500 JPEG |
| Keyword bank | `content/pinterest/keywords.json` (board names, keyword variants) |
| Playbook | `content/pinterest/playbook.md` (specs, cadence, seasonality) |
| Publisher | `scripts/pinterest-publish.mjs` |

Both repos are on the same machine, so the simplest integration is a direct
filesystem read/write plus `git commit`. No API layer is needed. If capcom
prefers the GitHub API, that works too, but the file shapes below are the same
either way.

## Queue file shape

```json
{
  "slug": "weekend-getaways-from-washington-dc",
  "postUrl": "https://captainscottageva.com/journal/weekend-getaways-from-washington-dc/",
  "renderedAt": "2026-08-10T11:02:33.918Z",
  "sources": { "weekend-getaways-from-washington-dc-v1": "public/images/hero-porch-creek.jpg" },
  "pins": [
    {
      "id": "weekend-getaways-from-washington-dc-v1",
      "title": "Weekend Getaways from Washington DC: Virginia's Northern Neck",
      "description": "Weekend getaways from Washington DC, compared straight...",
      "altText": "A screened porch at Captain's Cottage looking west over a quiet tidal creek at golden hour.",
      "board": "Weekend Getaways from Washington DC",
      "destinationUrl": "https://captainscottageva.com/journal/<slug>/?utm_source=pinterest&utm_medium=social&utm_campaign=<slug>&utm_content=v1",
      "scheduledFor": "2026-08-17",
      "keywordVariant": "v1",
      "status": "draft"
    }
  ]
}
```

### Fields capcom may write

| Field | Rule |
|---|---|
| `status` | `draft` to `approved`, or to `rejected`. **Nothing else may set `approved`.** A `queued` pin keeps its status when reviewed; see the lifecycle note below. |
| `scheduledFor` | ISO date. May be changed while `draft`, `approved` or `queued`. Never set it in the past. On a queued pin this moves the repo only, not the Todoist task. |
| `approvedAt` | ISO timestamp, set when Will reads the pin. **This is the review record**, and on a queued pin it is the only thing that changes. Not optional. |
| `rejectedReason` | Free text, when status becomes `rejected`. Feeds future pin-writer runs. |

### Fields capcom must not touch

`id`, `title`, `description`, `altText`, `board`, `destinationUrl`,
`keywordVariant`, `sources`, `renderedAt`, and anything the publisher writes
(`postedAt`, `pinterestId`, `lastError`, `lastErrorAt`).

If the copy is wrong, the fix is a note to the pin-writer, and the pin-writer
rewrites it. Editing copy in the reviewer bypasses the voice rules in
`.claude/agents/pin-writer.md`, which is how AI tells creep back in.

Two ways to send that note, added 2026-08-26:

| Ask | What it does |
|---|---|
| **Adjust** (`POST /api/pinterest/pins/:id/feedback`) | Appends to `AGENT_FEEDBACK.md`. The pin keeps its status, its slot, and its id. |
| **Reject** | Terminal. `rejectedReason` is recorded and the replacement needs a **new id**. |

Adjust exists because rejection was the only channel and it costs a whole pin,
so small notes went unsent. `AGENT_FEEDBACK.md` is also read back now: capcom
shows every note already sent on a pin or draft, and flags the ones still
unticked, so nothing gets reviewed twice from a blank slate.

## Status lifecycle

```
draft ──approve──> approved ──queue run──> queued ──Will clicks the task──> posted
  │                                          ▲
  └──────────── --include-drafts ────────────┘
  │
  └──reject──> rejected   (terminal; pin-writer may supersede it with a new pin)
```

- **`draft`** is the only status an agent may write. This is the safety model.
- **`approved`** means Will has seen it. Only a human action in a UI produces it.
- **`queued`** means a Todoist task exists carrying the pin's save link, with
  `todoistTaskId` and `queuedAt` recorded. Written by
  `scripts/pinterest-todoist-queue.mjs`. Nothing has reached Pinterest yet.
- **`posted`** is set once Will has actually published from the Todoist task.
- **`rejected`** is terminal. Do not recycle the id; a replacement gets a new one.

### `queued` is reviewable, not finished (locked 2026-08-26)

`queued` answers "does a Todoist task exist", not "has anyone read the copy".
Those came apart the moment 47 pins were queued from `draft` under
`--include-drafts`: their tasks exist and their save links work, and nobody has
read a word of them.

**`approvedAt` is the review record, and it is independent of status.** Capcom
reviewing a queued pin stamps `approvedAt` and leaves `status: "queued"` alone.
It must not move a queued pin back to `approved`: the queue script skips
anything holding a `todoistTaskId`, so the round trip would gain nothing and
would hide the fact that a live task exists.

So the test for "unread" is `status is draft/approved/queued AND no approvedAt`,
not a status check. Capcom's pin pane was filtering on `draft`/`approved` and
therefore displayed "no pins waiting" while all 47 sat unread; fixed 2026-08-26.

### The pin routes do not reach Todoist (open)

**Correction, same day:** an earlier draft of this section said capcom holds no
Todoist token. That is wrong. Capcom has had a full read/write Todoist
integration since 2026-07-22 (`/api/todoist/today`, `/inbox`, `/quick-add`,
`/close`, `/update`), reading `TODOIST_TOKEN` from `C:\Code\dashboard\.env`.

What is actually true is narrower: **the pin routes never call it.**
`src/pinterest.js` was written under a no-token rule that was about *Pinterest*,
and the Todoist helper lives in `server.js`, so the pin paths never used it.
Rejecting or rescheduling a queued pin changes the repo and leaves the task
untouched, which means:

- a **rejected** pin's task still carries a working save link, so tapping it
  publishes copy that was rejected;
- a **rescheduled** pin's task keeps its original due date and reminder.

Capcom now warns loudly on both paths rather than reporting plain success, and
`pinterestView()` surfaces a `stale-todoist-task` warning. Closing the task is
still manual. Wiring the existing `/api/todoist/close` and `/update` calls into
the pin reject and reschedule paths is a small change needing no new
credentials, and it is undecided only because nobody has asked for it yet.

### Queueing a draft (`--include-drafts`)

Since 2026-08-21 the publisher is `pinterest-todoist-queue.mjs`, and a queued
pin publishes only when Will clicks its Todoist task. That makes the task itself
a usable review surface, so drafts may be queued directly with the manual
`--include-drafts` flag. Such a task is titled "Review + publish" and opens with
"Not reviewed yet", so nothing unread can be mistaken for approved copy.

This does **not** loosen the gate. `--include-drafts` never sets `approved`, the
scheduled workflow never passes it, and no pin reaches Pinterest without Will's
click. Pair it with `--until <ISO date>` so a run cannot queue further ahead
than intended.

**Queued 2026-08-22 at Will's direction:** first the 19 pins through 2026-09-30,
then the remaining 28 on his go-ahead. The whole queue is now in Todoist: 50
tasks, 2026-08-21 through 2026-11-25, every other day at 10:00 ET. 47 of them
are draft-origin and read "Review + publish".

## Rules any publisher must honor

Taken from `content/pinterest/playbook.md`, which is the authority and is
re-verified monthly. Read it rather than hardcoding these numbers.

1. Queue only when `status` is `approved`, or `draft` under an explicit
   manual `--include-drafts` run. Never post without Will's click.
2. Maximum 3 pins per day across the whole account. The queue is currently built
   at 2 per day.
3. At least 5 days between two pins pointing at the same URL. Pinterest's spam
   filter cares; the documented floor is 72 hours and we sit above it.
4. Never post the same image twice. A repost is a repin and loses the fresh-pin
   advantage.
5. Board is resolved by **name** through `PINTEREST_BOARD_MAP`. If a name does
   not resolve, skip the pin and report it. Do not guess a board.
6. On failure, record `lastError` on the pin and leave the status alone so the
   next run retries.

## What capcom should show Will

The point of the UI is a fast yes or no, so lead with the image.

- The 1000x1500 render, large enough to judge (it is what people actually see).
- Title and description as Pinterest truncates them: **~40 characters of the
  title in feed, 50 to 60 characters of the description** before the fold.
- Board name, scheduled date, and which keyword variant it tests.
- Approve, reject with a reason, and change date. That is the whole surface.
- A queue view: counts by status, what is scheduled this week, and any published
  post with zero pins.

## Things worth getting right

- **Timezone.** `scheduledFor` is a plain date, compared against UTC today by the
  publisher. Do not introduce local-time comparisons on the capcom side or pins
  will post a day early.
- **Concurrent writes.** The Sunday cron writes these same files. Capcom should
  re-read before writing and commit promptly rather than holding state in memory
  across a long session.
- **Do not invent pins.** Rendering and copy come from `build-pins.mjs` and the
  pin-writer. Capcom is a reviewer, not an author.
- **Images are committed to the repo.** They are not fetched from anywhere at
  post time, so a missing `public/pins/<id>.jpg` is a hard error.

## Current state, 2026-08-13

- 27 pins across 9 posts, **all `draft`**, scheduled 2026-08-17 through 08-31.
- **The five boards exist** and every pin's board name resolves.
- **Both repo secrets are set.** The publisher ran green against the real
  credentials and correctly reported nothing due, because nothing is approved.
- So the pipeline is live and waiting on exactly one thing: a human moving a pin
  from `draft` to `approved`. That is the job capcom is being built to do.
- The access token expires **2026-09-11**. After that the publisher 401s until
  the secret is refreshed.
