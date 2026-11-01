# Pinterest playbook

**Retrieved 2026-11-01.** Second full pass (first was 2026-08-08). The `pin-writer` follows this file over its own defaults; where they disagree, this wins. Read `content/pinterest/decisions.md` alongside it: that file is what we do, this one is what Pinterest does.

## Sources

| Source | Retrieved | Used for |
|---|---|---|
| help.pinterest.com/article/review-pin-specs | 2026-11-01 | Official file, title, description, safe-zone and video specs |
| recurpost.com/best-pinterest-scheduler/best-time-to-post-on-pinterest/ | 2026-11-01 | Posting-time windows (vendor, no stated sample size) |
| tailwindapp.com/pinterest-marketing/research/2025-benchmark-study-part-three | 2026-11-01 | Fresh-pin distribution, timing finding |
| tailwindapp.com/blog/fresh-pin-definition-2025 | 2026-11-01 | What counts as fresh |
| community.pinterest.biz threads on fresh pins and repinning (titles only surfaced) | 2026-11-01 | Confirms the question is open; no official answer seen |
| tailwindapp.com/blog/can-you-schedule-pinterest-posts-natively | 2026-11-01 | 30-day, 10-pin native scheduler cap |
| search results pages for Pinterest best-time (eclincher, socialk.it, outfy, postiz, timetopost, hootsuite via third-party summary) | 2026-11-01 | Showing that timing sources disagree |
| pinterest.com/visitvirginia/ , pinterest.com/visitvabeach/ | 2026-11-01 | Search snippet only; direct fetch returned nothing usable |
| developers.pinterest.com/docs/web-features/rich-pins-overview/ | 2026-08-08 (not re-fetched) | Rich Pins automatic from page metadata |

## What changed since last run

1. **Description limit is now stated by Pinterest itself at 800 characters**, and the same page says descriptions do not show in the home or search feed. Third-party tools still say 500; the official page wins. Last run's "only the first 50 to 60 characters show" claim is not on the official page and stays classed as folklore.
2. **Official spec page gives no recommended ratio or pixel size.** It lists accepted formats (BMP, JPEG, PNG, TIFF, WEBP), a 20 MB web limit, a 100-character title, a 250-character textbox and safe zones (top 270 px, left 65 px, right 195 px, bottom 790 px, as given on the page). 1000x1500 at 2:3 is therefore a third-party recommendation, not an official number. Check `scripts/build-pins.mjs` does not put key text inside those safe-zone margins; not verified against the script this run.
3. **Posting times were re-checked and the finding stands: evidence is thin and contradictory. Nothing is recommended.** See the section below.
4. **Accounts to follow: this run could not produce a verified list.** Pinterest profile pages return nothing through the fetch tool. See that section.
5. The Tailwind "2026 benchmark, fresh pins drive 90%+ of traffic" claim circulating on blogs could not be traced to Tailwind's own pages. Treat as unverified.

## Format specs, current

| Field | Spec | Source |
|---|---|---|
| Image ratio / size | 2:3, 1000x1500 recommended by third parties (socialk.it, dreikon.de, via search 2026-11-01). Pinterest's spec page does not state one. | third-party |
| File | BMP, JPEG, PNG, TIFF, WEBP. Web upload 20 MB max. Our renders run 50 to 190 KB. | help.pinterest.com, 2026-11-01 |
| Title | 100 characters max. About the first 40 show in feed (one third-party tool; not on the official page). Front-load the keyword. | help.pinterest.com; third party |
| Description | 800 characters max. Not shown in the home or search feed. | help.pinterest.com, 2026-11-01 |
| Textbox | 250 characters max | help.pinterest.com |
| Video pin | 4 seconds to 5 minutes, 9:16 recommended, MP4/M4V on web | help.pinterest.com |
| Scheduler (native) | 10 scheduled pins at a time, up to 30 days out. Sources disagree: one reports 100 total, one reports 14 days. 10 and 30 appear in the most sources. | tailwindapp.com and others, 2026-11-01 |

## Ranking and distribution behavior

- **Fresh pins beat repins, and fresh means a new image.** Tailwind's benchmark (about 1M pins, vendor study, correlation not causation) says maximum distribution comes from a new page with new image, keywords, text and boards. Keeping the URL but shipping a new image and keywords is reported at roughly 64 to 77 percent of that. This is the basis for rendering distinct variants per post.
- **Multiple pins per URL is fine** if the images genuinely differ. The 72-hour spacing figure from the last pass came from one blog and was not re-verified. Our 5-day same-URL rule stays (see `decisions.md`).
- **Slow starts are normal.** About 20 percent of pins show no impressions after one week, and Tailwind advises judging over 2 to 3 weeks. Relevant to the day-90 review: do not retire a variant on week-one numbers.
- **Keyword placement** (title, board name, description, alt text) is the consensus order, but it is consensus from vendor blogs. One 2026 guide ranks save rate in the first 48 hours above outbound click rate; that ordering is one blog's estimate, not Pinterest's. Folklore.
- **Video / Idea pins vs static for outbound clicks: still unresolved.** No source found compares them on clicks. One unsourced blog claims Idea pins get 2 to 3x the saves but rank for 1 to 3 months versus 6 to 18 for static. Not actionable and not verified. Static stays primary.

## Cadence

**Pacing is owned by `pinterest-strategist`, not by this file.** (`content/pinterest/pacing.md` did not exist in the repo at this run; if the strategist has not written it, that is a gap for Will, not for this file.) What follows is the platform ceiling only.

Sources cluster at 3 to 5 pins per day for an established account, with 10 a day as the point where it reads as spam. That is what Pinterest tolerates. It is not what this account can sustain.

**The rule that was missing, added 2026-08-14 after getting it wrong:** cadence is an inventory problem before it is a platform problem. Multiply the burn rate by the content runway before setting a rate.

```
runway (weeks) = unposted pins / max(burn per week - replenishment per week, 0.01)
```

Under 8 weeks of runway means the cadence is too fast, whatever Pinterest allows. The 2026-08-10 schedule set 2 pins per day against 27 pins and a biweekly blog, which is 14 days of inventory and then silence. Silence after a burst costs more than a slower start, because Pinterest rewards consistency. Corrected 2026-08-14 to one pin every two days.

**Inventory is not only blog posts.** Every indexed evergreen page is a pin destination: `/what-to-bring`, `/getaway-guide`, `/area`, `/activities`, `/the-cottage`, `/amenities`, `/photos`, `/faq`. `/what-to-bring` is a packing list, one of the strongest travel formats on Pinterest. The other levers are a fourth and fifth variant where a genuinely different image exists, and new creative on old URLs, which Pinterest counts as fresh.

Sources suggest 3 to 5 distinct designs per post. We do 3, because the photo library is thin: of 80 originals only 2 are portrait, so every pin is a crop and a fourth variant would start repeating.

## Seasonality

Pinterest is a planning surface, so intent runs **earlier than booking**. Our own booking lead is 38.5 days (`content-calendar.json`), which is when someone books, not when they start looking.

**Working rule (carried from 2026-08-08, not re-verified this run, source was Pinterest's 2026 brand-moments guide): a seasonally-fit pin goes up 8 to 10 weeks before the experience date.**

| Trip | Pin from |
|---|---|
| Winter quiet, sauna and hot tub | Now (early November) through December |
| Spring shoulder season | January onward |
| Summer crabbing, swimming, low boil | March onward |
| Fall weekend, late Sept to Oct | Late July onward |

Today is 2026-11-01: fall pins are past their window and should not be newly queued as the lead item; winter and early-spring pins are the live window.

## Niche patterns

2026 travel trend reporting (carried from last run) points to weekend itineraries, shoulder-season travel, wellness getaways, nature stays and low-logistics family trips, which map onto this property. Formats that carry travel on Pinterest: destination guides, packing lists, road trip plans, seasonal ideas, area guides, food guides, things-to-do lists.

This run did not complete a systematic look at the top pins in the Northern Neck / Chesapeake overlap, because Pinterest search and profile pages were not retrievable with the tools available. So image-composition guidance (interior vs water, overlay or not) is **UNVERIFIED for this niche**. Do not treat last run's generalities as findings.

The earlier note that `/what-to-bring` is orphaned with no nav link is stale: it has been linked from the footer since the site audit (CLAUDE.md, corrected 2026-10-01).

## Accounts to follow

**Gap, stated plainly: a verified list could not be built this run.** Pinterest profile and board pages come back empty through the fetch tool, and web search surfaced no Pinterest profiles for Northern Neck operators, Visit Chesapeake, or the Eastern Shore of Virginia.

What was seen (search snippets only, retrieved 2026-11-01, follower counts from a cache the search tool itself described as very old, so likely stale):

| Handle | What was visible | What it likely does that we do not (inference, not seen) |
|---|---|---|
| @visitvirginia (Virginia is for Lovers) | 8.4k followers (stale cache) | Statewide board structure by region and season. Not verified. |
| @visitvabeach (Visit Virginia Beach) | 10.1k followers (stale cache) | Destination-board tourism model. Not verified. |

Neither is a single waterfront rental, and neither is in the Northern Neck. Monthly viewers is not public for any account, so no traffic number exists to rank by; "high-traffic" cannot be verified from outside. **Recommendation: a person with a logged-in Pinterest session should pull 5 to 8 handles by searching "Northern Neck Virginia", "Chesapeake Bay cottage" and "weekend getaways from DC", and record board names, pins per week and title shape by hand.** Do not copy their copy or images.

## Posting times

**The timing evidence is thin and contradictory. Nothing is recommended.** Checked again 2026-11-01.

- No first-party Pinterest source gives best-time guidance.
- RecurPost (vendor; "own dataset", no sample size or method stated on the page) lists audience-local windows by weekday: Mon 8 to 11 PM; Tue 8 to 10 AM and 8 to 10 PM; Wed 2 to 4 PM and 8 to 10 PM; Thu 10 AM to 1 PM and 6 to 8 PM; Fri 9 to 11 AM and 8 to 10 PM; Sat 10 AM to 1 PM and 7 to 9 PM; Sun 9 to 11 AM and 8 to 9 PM. US/Canada national window: 8 to 11 PM ET.
- A search summary attributes to Hootsuite (2025) 12 PM on Tuesdays and Fridays as the best single slot; to CoSchedule, Monday 8 PM and Sunday 8 PM; to Outfy, Sunday to Tuesday best and Thursday/Friday weaker. These were not fetched at source this run.
- These disagree on weekdays and on midday vs evening. Only "evenings and weekends come up most" is shared, and every source is a scheduling-tool vendor with no disclosed method.
- Tailwind's own benchmark page reports that posting time did not predict success; consistency and fresh content did (vendor study, correlation only).

The `decisions.md` slot table (weekday 20:00, weekend 10:00) therefore remains a session's guess. Nothing here contradicts it and nothing here supports it beyond "evenings are commonly cited." Our own Pinterest Analytics at the day-90 review (2026-11-19) is the first real evidence.

## What not to do

- Do not post the same image to multiple boards to inflate volume. It is a repin in Pinterest's eyes and it dilutes the fresh-pin advantage.
- Do not stack a post's variants on one day.
- Do not write clever titles. Pin titles are search queries, not headlines.
- Do not use "Hull Creek" in a title or as a keyword. Locked in `CLAUDE.md`, and independently correct here: nobody searches it.
- No hashtag stuffing. Pinterest is not Instagram.
- Do not judge a pin on its first week. See above.

## Open questions for the next run

1. Video or Idea pins vs static for **outbound clicks**. Still no source separates clicks from impressions.
2. A real competitor sweep, which needs a logged-in session (see Accounts to follow).
3. Whether `scripts/build-pins.mjs` keeps text and the cottage name out of the official safe-zone margins.
4. Whether a Pinterest-official source exists for the 10-pin / 30-day scheduler cap; every source seen is third-party.
5. Whether board count matters early. Nothing found either way.

## Our own operating decisions live elsewhere

Batching, the two-dates split, the inverted approve-then-schedule pipeline and the slot-table-is-a-guess note live in `content/pinterest/decisions.md` (moved there 2026-10-01), because this file gets rewritten wholesale by the monthly researcher and those decisions must not be.

**Dated lessons inside the research sections above are institutional memory, not scratch.** Any paragraph carrying a date and a correction (the 2026-08-10 cadence error and its 2026-08-14 fix, in particular) is carried forward by every rewrite of this file, reworded if the facts moved, never dropped.
