# Pin queue contract (for capcom, or any other reviewer/publisher)

Hand this file to whoever builds the review-and-post UI. It is the integration
contract for `content/pins/*.json` in the **captainscottage** repo
(`c:\Code\buffalo-rentals\captainscottage`). Written 2026-08-10.

Capcom's job, as Will described it: **review pins and post them automatically.**
This file says exactly what that means, what capcom owns, and the one design
decision that has to be made before any of it ships.

---

## Who posts: WILL DOES, by hand (current since 2026-08-21)

**Nothing posts to Pinterest automatically, and nothing can.** The API route is
abandoned: app 1600288 sits at Trial access, which returns `403 code 29` on every
pin create, and Standard access needs a video demo plus a two-week review that
Will declined. `pinterest-publish.yml` is parked, cron removed.

The chain is now:

```
pin-writer  ──draft──>  Will reviews in capcom  ──approved──>  daily queue run
   ──Todoist task──>  Will taps it, composer opens pre-filled  ──>  PUBLISHED
   ──daily reconcile reads the completed task──>  status: "posted"
```

Capcom still holds **no Pinterest token and no Pinterest API code**, and that
part is permanent. It writes `status`, `scheduledFor`, `approvedAt`,
`rejectedReason` and `todoistTaskRemovedAt` to the queue files, and it acts on a
pin's Todoist task (deleting it on reject, moving it on reschedule). It does not
publish.

<details>
<summary>The 2026-08-10 decision this replaced, kept for whoever reads back</summary>

**Option A was locked on 2026-08-10:** capcom reviews, the existing GitHub Action
posts. Will: "I don't want pins to go out twice... capcom reviews, existing cron
posts will work fine. I'm just thinking if I can look at them and approve/reject
with notes in capcom, that should do it."

The reasoning was double-posting: `scripts/pinterest-publish.mjs`, run daily at
14:00 UTC, posted approved pins whose date had arrived. If capcom also posted,
both readers would see the same `status: "approved"` and the same date and
neither would know about the other.

| Option | Who posts | What changed |
|---|---|---|
| **A. Capcom reviews, GH Action posts** (chosen) | The existing cron | Capcom only ever writes `status` and commits. No token in capcom, no double-post risk. |
| B. Capcom does both | Capcom | Would have needed `pinterest-publish.yml` disabled first, plus `PINTEREST_ACCESS_TOKEN` in capcom. |

That fork is moot: option A's publisher turned out not to work at all. The
no-token half of it survived intact and is still the rule.

</details>

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
  Written by `scripts/pinterest-todoist-reconcile.mjs`, daily, from the task's
  completion; see "Closing the loop" below.
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

### Closing the loop: how a pin becomes `posted` (locked 2026-08-26)

Publishing happens when Will taps a Todoist task, and for five days nothing told
the repo that had happened. The queue files drifted on every publish: on
2026-08-26 the repo read 48 queued / 3 posted and believed the next pin was due
2026-08-23, which had already gone.

`scripts/pinterest-todoist-reconcile.mjs` runs **first** in the daily
`pinterest-todoist-queue.yml` workflow (13:30 UTC), so the queue pass works from
a true picture. For every pin at `status: "queued"` holding a `todoistTaskId`,
it asks Todoist whether that task is completed; if so, it sets `posted` and
stamps `postedAt` with the completion date in `PIN_TIMEZONE` (a UTC slice would
push an evening publish onto the next day).

What it will not do:

- It never writes `approved`. It only ever moves `queued → posted`, so the gate
  is untouched.
- It never creates, edits or completes a Todoist task. Read-only there.
- It never touches a pin the queue script has not queued: matching is by
  `todoistTaskId` and nothing else.

**A completed task means published, and only that.** There is no other signal
available. That is why a rejected pin's task is deleted rather than completed.

### Capcom's pin actions reach Todoist (locked 2026-08-26)

Capcom has held a full read/write Todoist token since 2026-07-22
(`TODOIST_TOKEN`, read from `C:\Code\dashboard\.env`). Until 2026-08-26 the pin
routes never used it, so rejecting a queued pin left its task on the list with a
working save link, and rescheduling left the task prompting on the old day.
Both now act on the task.

| Action in capcom | What happens in Todoist |
|---|---|
| **Reject** | The task is **deleted**. |
| **Reschedule** | The task moves to the new date at `PIN_PUBLISH_TIME` in `PIN_TIMEZONE`. |
| **Approve / Adjust** | Nothing. The task stands. |

**Reject deletes; it must never complete.** This is load-bearing, not a style
choice. `pinterest-todoist-reconcile.mjs` treats a completed `pinterest` task as
proof the pin was published, because the tap IS the publish signal now that the
Pinterest API is closed to us. Completing a rejected pin's task would therefore
tell the reconciler that rejected copy went live and stamp the pin `posted`.
`capcom/test/pinterest.test.mjs` asserts `/close` is never called on this path.

Two things capcom records or reports rather than hiding:

- `todoistTaskRemovedAt` is stamped when the delete succeeds, so the view stops
  flagging a live task. The `todoistTaskId` itself stays: it is the record of
  which task the pin was, and the queue script reads its presence to avoid
  re-queueing.
- Todoist drops a task's reminder when its due date changes. A rescheduled pin
  still appears on its new day but will not push-notify, and capcom says so.

If the Todoist call fails, the repo-side change still stands (it was written
first) and the response carries `staleTask` plus the error, because a working
save link on rejected copy is the dangerous half.

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

## Current state, 2026-08-26

- **51 pins: 46 `queued`, 5 `posted`, 0 `draft`**, running every other day at
  10:00 ET through 2026-11-25.
- **All 46 queued pins are unread.** They were queued from `draft` under the
  manual `--include-drafts` flag, so their Todoist tasks exist and say "Review +
  publish", and no one has read the copy. Clearing that backlog in capcom is the
  live job.
- **The five boards exist** and every pin's board name resolves. Every render is
  present.
- **The review portal is built** (capcom, Buffalo tab, Pinterest queue): unread
  first, feedback history on every card, Approve / Adjust / Reject / reschedule.
- **The loop is closed.** `pinterest-todoist-reconcile.mjs` runs daily and marks
  published pins `posted`, so the queue files no longer drift.
- The **Pinterest** access token expiring 2026-09-11 no longer matters: nothing
  calls the Pinterest API. `PINTEREST_ACCESS_TOKEN` and `PINTEREST_BOARD_MAP` are
  dormant secrets, used only if the parked publisher is ever revived.

### Earlier state, for the record

- **2026-08-13:** 27 pins across 9 posts, all `draft`, scheduled 08-17 to 08-31.
  The pipeline was waiting on exactly one thing, a human moving a pin from
  `draft` to `approved`, which is the job capcom was built to do.
