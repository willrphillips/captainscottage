# Pinterest operating decisions

These are OUR decisions about how this pipeline runs, not research about
Pinterest. They were made in sessions with Will, each one is dated, and several
cost real mistakes to learn.

**They live in their own file because `pinterest-research.yml` rewrites
`playbook.md` wholesale.** That workflow had never run once when this split was
made (2026-10-01), so the risk was theoretical for two months and would have
become real on first contact: the monthly researcher was instructed to "rewrite
content/pinterest/playbook.md", and everything below would have gone with it.

**No agent may write to this file.** `pinterest-researcher` and
`pinterest-strategist` both read it and are forbidden to touch it. Changes here
come from a session with Will, and the `SCOPE_OF_WORK.md` entry goes in the same
session.

Anyone following the playbook must read this file too. The playbook describes
what Pinterest does; this describes what we do.

## Batching, locked 2026-09-27

Will opens Buffalo work twice a week and nowhere else: **Tue 20:30-22:00**
and **Fri 11:15-14:30** (`schedule.md`). A daily pin cadence aimed at that
schedule produced 37 untouched tasks and zero completions in five weeks, so
the queue is now batched to the blocks rather than spread across the week.

**Two dates per pin, deliberately different:**

| | what it is | where it lives |
|---|---|---|
| Task due | when Will taps the task | Todoist, Tue 20:30 / Fri 11:15 |
| `scheduledFor` | when the pin should go live | the pin JSON, shown in the task body |

Tapping a click-to-publish link IS publishing, so without this split, "approve
a batch" and "post a batch at once" are the same action, and a batch of six
becomes six pins in one burst. The task now says set-the-date-then-Schedule,
and the pin goes out on its own date through Pinterest's scheduler.

**Sizes:** 6 on Tuesday, 8 on Friday, which is 14 a week, about 2 a day, at
the top of the 1-3/day range above. That rate only works with the generator
replenishing; at a standing 37-pin inventory it is roughly three weeks of
runway, well under the 8-week floor in the runway rule.

**Two ceilings this has to respect:** Pinterest holds **10 scheduled pins at
a time, 30 days out**. Batches of 6 and 8 three days apart sit right at that
cap, so if a batch will not fit, the overflow is published immediately rather
than queued.

**UNVERIFIED:** whether the schedule-later toggle appears on the surface Will
taps from. If it does not, this whole split collapses and the sizes drop to
2 per session (about 4 a week, ~10 weeks of runway). The 2026-09-29 batch
carries the test.

**Amended 2026-09-29, before the first batch.** The 2/day spread above put
same-URL variants 3-4 days apart and tripped the playbook's own 5-day rule
21 times. Live dates are now spread to satisfy it: **2026-09-30 to
2026-10-20, at most 2 pins a day, no two pins to the same URL inside 5
days.** Tap dates did not move. This is the rule of thumb the spread has to
respect: with 3 variants per URL, a URL needs a 10-day span, so live dates
spread wider than the tap schedule and that is fine. Will taps on his
blocks; the pins land when they land.

**Re-cut 2026-09-29, same evening, after Will saw the first batch.** Six in one
sitting was too many: *"Fix it so the schedule restarts today but not with 5
todos today."* Sizes are now **2 per session**, Tue 20:30 and Fri 11:15, which
is 4 a week. Against a 36-pin inventory that is **9 weeks of runway**, above
the 8-week floor this playbook sets, where 6-and-8 was about 3 weeks and below
it. Live dates re-spread to 2026-09-30..2026-11-27, still no two pins to the
same URL inside 5 days. The lesson worth keeping: the batch size that fits the
calendar is not the same as the batch size that fits the person, and his
reaction to seeing it is better evidence than the arithmetic.

## The pipeline inverted, 2026-09-29 evening

Will: *"Can you remove all the buffalo pinterest posts from todoist if they
haven't been approved? Once they're approved, then there should be a workflow
where they schedule after approval, then send to todoist."*

| | before | after |
|---|---|---|
| where review happens | the Todoist task | CAPCOM's Pinterest pane |
| what a task means | decide, then publish | you already decided, post it |
| when a task exists | as soon as a pin is drafted | only once approved |
| who sets the dates | the drafter, weeks ahead | the queue script, at approval |

Tapping a task publishes a pin, so while tasks were the review surface,
"approve" and "publish" were the same keystroke. That is what this separates,
and it is why every cadence problem this week was hard: there was no way to
batch one without batching the other.

**`approvedAt` is the approval marker, not `status`.** CAPCOM's approvePin()
stamps `approvedAt` and, for a pin that was already queued, deliberately
leaves the status alone. A queued pin Will has approved still reads
`status: "queued"`, so anything asking "has he looked at this" must read
`approvedAt`.

**The scheduler lives in `scripts/pinterest-todoist-queue.mjs`, not in the
approve button.** Every placement rule is about the whole queue rather than
one pin: 2 per session, 5 days between pins to the same URL, at most 3 live
in a day, nothing more than 30 days past its own block. A single pin cannot
answer any of them. This is also what makes bulk approval safe: approve ten
in one sitting and they fill the next five sessions, because the slotter
fills sessions rather than days.

**The trade, stated plainly: an unapproved pin now has no presence in Todoist
at all.** If Will wants to review from his phone rather than at CAPCOM, that
is no longer possible, and the fix would be a CAPCOM change, not a Todoist
one. Intended, but worth knowing before he goes looking for a pin that is not
there.
