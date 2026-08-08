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

Sources cluster at 3 to 5 pins per day for an established account, with 10 a day
as the point where it reads as spam. **We stay at 1 to 3 per day.** The account
is new, the corpus is nine posts, and a small consistent cadence beats a burst
followed by nothing. Revisit once there are 50+ pins live.

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
