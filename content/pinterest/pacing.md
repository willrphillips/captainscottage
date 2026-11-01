# Pinterest pacing and runway

**Written 2026-11-01** by `pinterest-strategist` (monthly run). First version of this file in the repo: no earlier `pacing.md` existed, so "what changed" is measured against `decisions.md` and the queue.

## 1. The recommendation

**3 pins per week, starting the first Tuesday after Will approves a bank (assumed 2026-11-03).**

| Scenario | Inventory | Runway at 3/wk | Queue runs dry |
|---|---|---|---|
| Existing queue only | 18 | 6.0 weeks | **2026-12-15** |
| Existing, minus 3 fall pins that are out of season | 15 | 5.0 weeks | 2026-12-08 |
| Existing + 21 pins for URLs that have none (section 5) | 39 | 13.0 weeks | **2027-02-02** |

On the existing queue alone, **no rate reaches the 8-week floor above 2.25/wk** (18 / 8) and none reaches 12 weeks above 1.5/wk. So 3/wk is only defensible if the 21 pins in section 5 are written. If they are not, drop to 2/wk (9 weeks, dry 2027-01-05) and write them anyway.

## 2. The arithmetic

Counted from `content/pins/*.json` and `src/content/blog/*.mdx` on 2026-11-01.

| Term | Value | Basis |
|---|---|---|
| Posted to date | 14 pins | 9 URLs; first 2026-08-21, last 2026-09-22 |
| Rejected | 1 | reedville variant |
| Unposted pins that exist | **18** | all `status: draft`: activities 3, area 3, getaway-guide 3, northern-neck-in-fall 3, northern-neck-vs-outer-banks 3, what-to-bring 3 |
| Approved (`approvedAt`) among them | **0** | the 6 `approvedAt` stamps are all on already-posted pins |
| Replenishment from new posts | **~0 per week** | Will, 2026-08-14: blog slows way down. 6 posts are `draft: true`; if they publish they add 3 pins each, but nothing firm |
| Burn at the 2026-09-29 plan | 4/wk | `decisions.md` |
| Burn at 14/wk (the 6+8 plan) | 14/wk | `decisions.md`, retired |

```
runway = inventory / max(burn - replenishment, 0.01)

at 4/wk :  18 / (4 - 0) = 4.5 weeks     under the 8-week floor
at 3/wk :  18 / 3       = 6.0 weeks     under the floor
at 2/wk :  18 / 2       = 9.0 weeks     clears 8, short of 12
at 1.5/wk: 18 / 1.5     = 12.0 weeks
with 39 pins: 39/3 = 13.0 weeks; 39/4 = 9.75 weeks
```

**The 9-week figure in `decisions.md` (36 pins at 4/wk) no longer holds.** The queue is 18, not 36, because 14 posted and 1 was rejected. This is the same error the account was built to avoid, arriving a second time: the plan was right when written and the inventory then fell underneath it.

### Platform ceilings, as the rate has to respect them

The per-session cap is retired (`decisions.md`, 2026-10-01), so these are the only binding limits:

| Ceiling | Limit | Implied max weekly rate today |
|---|---|---|
| Pins live per day | 3 | 21/wk |
| Same URL spacing | 5 days | 1 pin per URL per 5 days. 6 URLs have unposted pins, so 6 x 7/5 = **8.4/wk** |
| Native scheduler | 10 scheduled in 30 days | does not bind while Will posts by Todoist task |

Inventory, not any platform ceiling, binds at every rate above 2/wk. The same-URL rule becomes the tighter ceiling than the daily cap whenever fewer than 15 URLs carry pins.

## 3. What changed since the last plan

| Item | Plan said | Observed 2026-11-01 |
|---|---|---|
| Posting | 4/wk from 2026-09-30 | **Last pin posted 2026-09-22. No pin in the 40 days since.** |
| Queue dates | live dates 2026-09-30..2026-11-27 | The 18 drafts carry `scheduledFor` 2026-10-19 to 2026-11-05. Most are already in the past and none is approved, so none has a task |
| Inventory | 36 | 18 |
| Pinterest metrics | day-90 review needs them | `content/metrics/` holds only `airbnb-metrics.json`. No Pinterest figures are recorded |

**The recommendation of 4/wk was not followed**, and the reason is visible in the data rather than guessed: nothing has been approved since the 2026-09-29 inversion, and approval is now the only trigger for a task. The account has been silent for 40 days. This is the burst-then-silence shape the file exists to prevent, and it came from an empty approval bank, not from a too-fast rate. Day 90 from the first pin is 2026-11-19; with 14 pins over 33 days and then nothing, that review will be judging a stopped account.

Stale dates: whoever re-slots should re-spread all 18 from the first approval date. They should not be posted on their old `scheduledFor`.

## 4. Benchmarks

**No verified per-account benchmark was obtained this run.** Searches on 2026-11-01 returned vendor and agency blogs, not account profiles. Pinterest profile pages return nothing through the fetch tool (same gap the researcher recorded in `playbook.md`). I am not naming handles I did not see, and per-pin impressions and clicks for other accounts are not observable at all.

What was found, all vendor or agency material, none with a disclosed method (searched 2026-11-01):

| Source | Claim | Class |
|---|---|---|
| houfy.com/blog/pinterest-ideas-that-drive-vacation-rental-bookings (Houfy, rental platform) | About 3 to 7 pins per week for a single property; keyword accuracy and photo quality matter more than volume | Vendor rule of thumb |
| houfy.com, "Promoting Short-Term Rentals on Pinterest" | Steady small pinning beats a large batch then a long gap | Vendor rule of thumb |
| meetedgar.com/blog/how-many-pinterest-pins-should-i-pin-per-day (Edgar, scheduler) | 1 to 5 per day to start, 15 to 25 per day later, no official limit | Vendor, aimed at larger accounts |
| blog.travefy.com | At least 5 per day as a starting point, citing an unnamed brand study | Vendor, unverified |
| hostaway.com/pinterest-for-your-vacation-rental-business | Re-pinning the same content too often can flag the account as spam | Vendor |

**Pattern, labelled as inference:** the only source written for a single rental (Houfy) lands at 3 to 7 per week, and the one point every source shares is steadiness over bursts. That fits 3/wk. The 5-per-day and 15-to-25-per-day figures come from content-rich blogs and scheduler vendors, and this property has 18 pins, so they are not comparable.

**Not answerable from what was observed:** how sustainable accounts differ from stalled ones. No stalled-versus-sustained account comparison was found, and no case study of a rental that stopped posting. The strongest local evidence is our own: the account stalled once already (section 3).

**Action for Will or a logged-in session:** pull 5 to 8 single-property or small-regional handles by searching "Northern Neck Virginia", "Chesapeake Bay cottage" and "weekend getaways from DC", and record pins per week, pins per URL, board count and visible gaps by hand. That is the only way to get a real benchmark.

## 5. Inventory actions

### URLs with no pins (the main runway lever)

| URL | Kind | Pins to write (3 each) | Season fit now |
|---|---|---|---|
| `/the-cottage` | page | 3 | evergreen |
| `/amenities` | page | 3 | sauna and hot tub fit winter now |
| `/photos` | page | 3 | evergreen |
| `/faq` | page | 3 | evergreen, lower search intent |
| `fall-rockfish-northern-neck` | post, published | 3 | fall; hold for next July |
| `wildlife-sightings-hull-creek` | post, published | 3 | spring and summer; queue from March |
| `winter-birding-northern-neck` | post, published | 3 | fits the live winter window |

That is 21 pins. Priority order for the winter window: `/amenities`, `winter-birding-northern-neck`, `/the-cottage`, `/photos`. Fall and wildlife items add to the bank but should not be scheduled now.

### Variants and old URLs

- **Fourth and fifth variants:** not justified. Only 2 of 80 originals are portrait (`playbook.md`), so a fourth is a repeat crop. Revisit only when new portrait photography exists.
- **New creative for old URLs:** 9 URLs have posted pins (the 14 above). With the first posts now 10 weeks old, `weekend-getaways-from-washington-dc` (3 pins) and `northern-neck-long-weekend-from-dc` are the best candidates for a fresh image plus fresh title, once the unpinned URLs are in. Plan one such cycle per month from December 2026 as a third supply line that does not depend on the blog.
- **Out of season in the existing 18:** 3 `northern-neck-in-fall-from-dc` pins. Playbook rule is 8 to 10 weeks ahead, so these belong in late July 2027. `northern-neck-vs-outer-banks` and `/activities`, `/area` suit a spring push, but are not harmful in winter.
- **Draft posts** (`christmas-on-the-northern-neck`, `health-case-for-hot-tub-and-cold-creek`, `northern-neck-watermen-culture`, `reedville-charter-fishing-guide`, `fishing-from-the-dock-hull-creek`) are `draft: true`. Not counted. If published, each adds 3 pins at the pin-writer's usual rate.

## 6. Triggers to revisit

| Change | Trigger |
|---|---|
| Speed up to 4/wk | Approved-and-unposted bank is 32 or more pins (8 weeks at 4/wk), with replenishment counted at 0 |
| Speed up to 5/wk | Bank at 40 or more, and day-90 outbound clicks growing month on month |
| Slow to 2/wk | Bank under 18 with no pins in production, or fewer than 6 weeks of runway |
| Pause the plan and re-ask Will | Bank under 9 (3 weeks at 3/wk) |
| Day-90 review | 2026-11-19. Needs Pinterest Analytics figures entered in `content/metrics/pinterest-metrics.json`; none exist now |
| Same-URL ceiling binds | Fewer than 6 URLs carry unposted pins |

The immediate dependency is not a rate. It is **approving a bank**: 18 drafts are waiting, 0 approved, and the account has been silent since 2026-09-22.

## 7. Open items for a session with Will

1. Approve a first bank so tasks exist; re-spread the 18 stale `scheduledFor` dates from the approval date.
2. Commission the 21 pins in section 5.
3. `decisions.md` still states 4/wk and a 36-pin inventory; the arithmetic above argues for 3/wk and 18. Only a session with Will can amend that file.
4. `pinterest-queue.yml` floor is 12 approved pins (three weeks at 4/wk); at 3/wk the equivalent three-week floor is 9.
