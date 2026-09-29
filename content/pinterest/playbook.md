# Pinterest playbook

**Retrieved 2026-08-08.** First pass. The `pin-writer` follows this file over its
own defaults; where they disagree, this wins.

## Sources

| Source | Retrieved | Used for |
|---|---|---|
| developers.pinterest.com/docs/web-features/rich-pins-overview/ | 2026-08-08 | Rich Pins are automatic from page metadata; no validator, no application |
| socialrails.com/blog/pinterest-character-limits-guide | 2026-08-08 | Title and description limits |
| postfa.st/sizes/pinterest/pin, recurpost.com/blog/pinterest-pin-dimensions | 2026-08-08 | 1000x1500, 2:3, file limits |
| passhulk.com/blog/pinterest-algorithm-updates-fresh-pins-vs-repins | 2026-08-08 | Fresh pins vs repins, same-URL spacing |
| yourpincoach.com/how-often-to-post-on-pinterest, rankmypin.com/blog/pinterest-pin-optimization | 2026-08-08 | Cadence, pins per post |
| business.pinterest.com/blog/pinterest-brand-moments-guide-2026 | 2026-08-08 | Seasonal planning lead |

## What changed since last run

First run, so nothing to compare. One correction to a prior assumption in
`PINTEREST_PLAN.md`: Rich Pins no longer require validation or application.
Pinterest retired that flow; a page with correct metadata becomes an Article
Rich Pin when someone saves it. The site qualified only after the 2026-08-08
`og:type=article` fix.

## Format specs, current

| Field | Spec |
|---|---|
| Image | 1000x1500, 2:3. Taller than 1:2.1 gets cropped. |
| File | JPG, PNG, or WEBP. 20MB max. Our renders run 50 to 190KB. |
| Title | 100 characters hard limit. **The first ~40 characters are what show in feed.** Front-load the keyword. |
| Description | 800 character limit, but **only the first 50 to 60 show before truncation.** Write as though the limit were 60 and the rest is for search. |
| Alt text | Accessibility first. Keywords only where true of the image. |

`scripts/build-pins.mjs` already targets 1000x1500, so no change needed there.

## Ranking and distribution behavior

- **Fresh pins beat repins, and "fresh" means a new image file**, not the same
  image saved to another board. This is the whole basis for rendering three
  distinct variants per post rather than reusing one.
- **Multiple pins per URL is fine and encouraged**, with two conditions:
  space same-URL pins at least 72 hours apart, and make them genuinely
  different. Pinterest's visual search detects near-identical images, so a
  recolored duplicate counts as the same pin.
- **Our spacing rule stays at 5 days** between variants of one post, safely
  above the 72-hour floor.
- Keyword placement that matters, in order: pin title, board name, description,
  alt text.

## Cadence

**Pacing is owned by `pinterest-strategist`, not by this file.** See
`content/pinterest/pacing.md`. What follows is the platform ceiling only.

Sources cluster at 3 to 5 pins per day for an established account, with 10 a day
as the point where it reads as spam. That is what Pinterest tolerates. It is not
what this account can sustain.

**The rule that was missing, added 2026-08-14 after getting it wrong:** cadence
is an inventory problem before it is a platform problem. Multiply the burn rate
by the content runway before setting a rate.

```
runway (weeks) = unposted pins / max(burn per week - replenishment per week, 0.01)
```

Under 8 weeks of runway means the cadence is too fast, whatever Pinterest
allows. The 2026-08-10 schedule set 2 pins per day against 27 pins and a
biweekly blog, which is 14 days of inventory and then silence. Silence after a
burst costs more than a slower start, because Pinterest rewards consistency.
Corrected 2026-08-14 to one pin every two days.

**Inventory is not only blog posts.** Every indexed evergreen page is a pin
destination: `/what-to-bring`, `/getaway-guide`, `/area`, `/activities`,
`/the-cottage`, `/amenities`, `/photos`, `/faq`. `/what-to-bring` is a packing
list, one of the strongest travel formats on Pinterest, and it had no pins at
all until this was noticed. The other levers are a fourth and fifth variant
where a genuinely different image exists, and new creative on old URLs, which
Pinterest counts as fresh.

Sources also suggest 3 to 5 distinct designs per post. We do 3, because the
photo library is thin: of 80 originals only 2 are portrait, so every pin is a
crop and a fourth variant would start repeating.

## Seasonality

Pinterest is a planning surface, so intent runs **earlier than booking**.
Seasonal search builds months before the season. Our own booking lead is 38.5
days (`content-calendar.json`), which is when someone books, not when they start
looking.

**Working rule: a seasonally-fit pin goes up 8 to 10 weeks before the
experience date, roughly a month ahead of the blog post's own publish timing.**

| Trip | Pin from |
|---|---|
| Fall weekend, late Sept to Oct | Late July onward |
| Winter quiet, sauna and hot tub | Early October onward |
| Spring shoulder season | January onward |
| Summer crabbing, swimming, low boil | March onward |

## Niche patterns

Confirmed by search behavior in the 2026 travel trend reporting: weekend
itineraries, shoulder-season travel, wellness getaways, nature stays, and
family-friendly trips that do not require heavy logistics. That maps almost
exactly onto this property, which is a useful signal.

Formats that carry travel content on Pinterest: destination guides, packing
lists, road trip plans, seasonal travel ideas, area guides, food guides, and
"things to do" lists. **We already have posts in most of those shapes.** The
gaps worth noting to the blog editor: there is no packing-list pin target
(`/what-to-bring` is a page, not a post, and it is orphaned with no nav link),
and no road-trip-route piece beyond the DC drive comparison.

## What not to do

- Do not post the same image to multiple boards to inflate volume. It is a repin
  in Pinterest's eyes and it dilutes the fresh-pin advantage.
- Do not stack a post's variants on one day.
- Do not write clever titles. Pin titles are search queries, not headlines.
- Do not use "Hull Creek" in a title or as a keyword. Locked in `CLAUDE.md`, and
  independently correct here: nobody searches it.
- No hashtag stuffing. Pinterest is not Instagram.

## Open questions for the next run

1. Whether video or Idea pins currently out-pull static pins **for outbound
   clicks specifically**, as opposed to impressions. Sources conflate the two,
   and we care only about clicks. Unresolved.
2. Whether board count matters early. No good evidence found either way.
3. Actual competitor board performance in this niche. Pinterest search is
   fetchable but this pass did not do a systematic sweep. Do it next run.

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
