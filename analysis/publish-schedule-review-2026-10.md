# Is the publish schedule researched or arbitrary?

Will, 2026-10-10, looking at CAPCOM's Buffalo Rentals pane: *"Every blog is set to
publish every other Wednesday at 12pm. I'm working on reviewing those, but that
looks far more like an un-researched schedule rather than based on best
practice."*

Short answer: **the schedule was researched, and it is still wrong.** Those are
two separate findings and both matter.

## 1. Three corrections to what the pane shows

| Will saw | Reality |
|---|---|
| every other Wednesday | **2 Wednesdays, 4 Thursdays**, with gaps of 8, 14 and 6 days |
| 12pm | **12:00 UTC, which is 8am EDT / 7am EST.** Not noon |
| arbitrary | reasoned in writing, commit `1047c79`, 2026-05-30 |

The `publishTime` frontmatter is UTC (`auto-publish.mjs` line 47, `CLAUDE.md`).
If CAPCOM's pane renders it as local time it is off by four or five hours, and
that is worth fixing in the pane regardless of what happens to the schedule.

## 2. Where it came from, and why it has expired

`content/content-calendar.json` holds the cadence. The Wednesday/12:00 rhythm was
set by the blog-editor agent in commit **`1047c79` (2026-05-30)**, with reasoning:

> - Audience (DC/Richmond/N-VA weekenders) plans Thu/Fri; a Wed 08:00 ET publish
>   gives Google 24-48h to index before that window opens.
> - Brand-new domain with zero indexed blog content; five weekly posts in
>   June/July establishes crawler freshness.
> - Cadence relaxes to natural biweekly after 2026-07-01.

Commit **`f6e165f` (2026-07-20)** then switched weekly to biweekly at Will's
direction and introduced per-post day and time slots, with the calendar stating
the intent: *"trip-planning posts Thu morning ET, evergreen midweek, long-read
essays weekend morning."*

**Two things went wrong since.** The per-post intent was never implemented, and
all six pending drafts sit at a uniform `12:00`. And the central premise, that a
Wednesday publish is indexed in time for Thursday planning, **confuses indexing
with ranking**. Those are different events separated by months.

## 3. The research, and what it says about this schedule

**Finding 1: ranking takes months, so the publish weekday is close to
irrelevant for search.** Only **1.74%** of new pages reach Google's top 10 within
a year; 3 to 6 months is typical to start ranking at all, and the average
number-one page is 5 years old. On an established domain new posts can rank in
days to weeks, which is now partly true here (12 posts indexed), but nothing
ranks in 24 to 48 hours.
[bloggerspassion](https://bloggerspassion.com/how-long-does-it-take-to-rank-on-google/) ·
[Grow and Convert](https://www.growandconvert.com/content-marketing/how-long-does-it-take-to-rank-on-the-first-page-of-google/)

**Finding 2: Pinterest needs 45 to 60 days of runway, and Pinterest is this
property's live channel.** Pinterest's own creator guidance is to publish
seasonal content **45 days** before the event; 45 to 60 days is the common
recommendation, and one cited study found pins posted 45 to 60 days ahead took
**68% higher impressions** than the same pins posted within two weeks of the
occasion. A pin cannot precede its destination post, so the post must be live
before the pin, which must be live 45 to 60 days before the search peak.
[Sprout Social](https://sproutsocial.com/insights/schedule-pinterest-posts/) ·
[Burnpedia](https://burnpedia.com/blog/pinterest-seasonal-content)

**Finding 3: off-season booking decisions happen 2 to 3 months out.** Shoulder
season (May, Sep, Oct) runs a 2 to 4 month lead; off-season (Nov to early Dec,
late Jan to Feb) is 2 to 3 months. Overall US STR booking windows have
compressed to about 15 days on average, but that average is dragged down by
last-minute peak bookings and does not describe the off-season traveller.
Larger properties book further out: 6-bedroom homes average 83 days.
[AvantStay](https://avantstay.com/blog/how-far-in-advance-book-vacation-rental/) ·
[Staystra](https://staystra.com/str-booking-window-compression-2026/)

**Finding 4: consistency beats both frequency and clever timing.** Day of week
matters for the audience, not for SEO, and the returns on frequency flatten
around 30 posts a month, which is far above anything contemplated here.
[SEO.co](https://seo.co/how-often-should-i-blog/) ·
[Social Media Today](https://www.socialmediatoday.com/content/scheduling-your-blog-how-often-and-best-times-publish)

**Finding 5, the one that indicts the current dates: every seasonal post is
scheduled into its season rather than ahead of it.**

**Corrected after drafting, and it makes the gap worse.** This section first
cited Virginia's **Chesapeake Bay** rockfish season, Oct 4 to Dec 31. That is the
wrong zone for this property. Will's own feedback of 2026-10-10 on the rockfish
draft says *"I believe we are a potomac tributary and NOT a chesapeake bay
house"*, and he is right: `site.ts` describes the property as where the Potomac
meets the Chesapeake, and Hull Creek is a Potomac tributary. The governing season
is therefore **4 VAC 20-252-100: May 16 to Jul 6 and Aug 21 to Dec 31**, not the
Bay dates.
[Virginia Administrative Code, Ch. 252](https://law.lis.virginia.gov/admincodefull/title4/agency20/chapter252/)

The fall season opened **Aug 21**, seven weeks earlier than the Bay's. So the
rockfish post needed to be live around **2026-04-23** and is scheduled for
2026-10-07: **167 days late, and 47 days into the season.**

Chaining findings 2 and 3 backwards from a stay gives the rule:

```
stay date
  - 60 to 90 days   guest decides and books
  - 45 to 60 days   pin needs to be circulating by then
  = ~120 days       the post must be LIVE
```

| Draft | Target season | Needed live by | Currently | Verdict |
|---|---|---|---|---|
| `fall-rockfish-northern-neck` | Potomac tributary, opened **Aug 21** | ~Apr 23 | 2026-10-07 | **5.5 months late**, publishes 47 days into the season |
| `winter-birding-northern-neck` | winter, Dec to Feb | ~Aug 3 | 2026-11-04 | **3 months late** |
| `health-case-for-hot-tub-and-cold-creek` | winter, Dec to Feb | ~Aug 3 | 2026-10-15 | **2 months late** |
| `reedville-charter-fishing-guide` | spring, May 16 | ~Jan 16 | 2027-03-18 | **2 months late** |
| `fishing-from-the-dock-hull-creek` | summer, Jun | ~Feb 1 | 2027-04-15 | **2.5 months late** |
| `northern-neck-watermen-culture` | evergreen | any | 2026-10-29 | fine |

**This compounds the Candy Point finding of 2026-10-09.** The off-season is down
31% year over year while peak is up 29%. The two strongest off-season assets the
property has, the sauna/hot-tub piece and winter birding, are scheduled to go
live *after* the Dec-to-Feb booking decision has largely been made. The content
answering the actual revenue problem is the content arriving latest.

## Options

**A. Publish the off-season backlog now, then move to a seasonal calendar.**
The Dec-to-Feb booking window is open right now (decisions happen Oct to Dec), so
these three still earn something this winter:

| Date | Post | Why |
|---|---|---|
| 2026-10-14 | `health-case-for-hot-tub-and-cold-creek` | strongest off-season asset; sauna and hot tub are the winter sell |
| 2026-10-21 | `winter-birding-northern-neck` | already approved; Jan-Feb stays still bookable |
| 2026-10-28 | `fall-rockfish-northern-neck` | salvages Nov-Dec of a season that runs to Dec 31 |
| 2026-11-18 | `northern-neck-watermen-culture` | evergreen, no urgency |
| 2027-01-13 | `reedville-charter-fishing-guide` | 120 days ahead of the May 16 spring season |
| 2027-02-03 | `fishing-from-the-dock-hull-creek` | 120 days ahead of summer |

*Effort: six date edits. Impact: recovers most of one off-season's worth of
runway. Cost: three posts in three weeks, then a five-week gap.*

**BLOCKER on the first two dates.** Will filed four corrections on 2026-10-10
that are still open in `AGENT_FEEDBACK.md`, three on the rockfish post and one on
the hot-tub post, and two of them are factual rather than stylistic: the
Potomac-versus-Bay zone above, and *"the creek is 50 feet from the hot tub"*
against a draft saying twenty. Neither post can publish until those are applied
and he re-approves. That is a Rewrite-button run, not a date edit, and it has to
happen first. `winter-birding-northern-neck` is the only one of the three already
approved and clean.

**B. Keep the biweekly rhythm, only re-order it.**
Same cadence and spacing, but the two winter posts move to the front of the queue
and the evergreen one moves to the back. Nothing publishes sooner than the
current first slot.
*Effort: two swaps. Impact: partial; the winter posts still land weeks after the
booking decision. Cost: none.*

**C. Abandon fixed cadence for a seasonal calendar.**
Standing rule: `publish date = first day of target season minus 120 days`,
recorded in `content-calendar.json`, with evergreen posts used as filler to keep
the gaps from getting embarrassing. Cadence becomes a consequence rather than an
input.
*Effort: a rule in the calendar plus a line in `blog-editor.md`. Impact:
structural, fixes every future post. Cost: uneven gaps, and the editor agent has
to be told that uneven is correct.*

**Recommendation: A now, C as the standing rule, skip B.**

A because the winter window is closing this month and B's tidiness buys nothing
that matters. C because A is a one-time catch-up and the defect will recur on the
next batch otherwise. B is the option that looks most responsible and achieves
least: it preserves a cadence whose original justification, same-week indexing,
turns out not to exist.

On time of day: stop optimising it. Any morning works, since the post only has to
be live before its pins fire, and the pin slots (weekday evenings 20:00, weekend
mornings 10:00, per `content/pinterest/decisions.md`) are where timing actually
has evidence behind it. Worth relabelling the pane so 12:00 UTC is not read as
noon.

**Nothing has been changed.** No publish date edited, nothing posted. Six drafts
still sit at `draft: true` awaiting Will's review.
