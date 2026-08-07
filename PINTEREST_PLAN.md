# Pinterest distribution plan

Written 2026-08-07 at Will's direction ("I'm thinking Pinterest cause it's the
least miserable social media platform I can think of"). This is Workstream E
from `SCOPE_OF_WORK.md`, previously deferred, now scoped to Pinterest only.
Instagram and the email list stay deferred.

Companion doc: `POST_LAUNCH_SEO.md`. Pinterest is a traffic channel, not an SEO
channel; the A/B search-term work is tracked separately.

---

## Why Pinterest is the right pick here, and what it will not do

Pinterest behaves like a visual search engine, not a feed. A pin keeps
returning traffic for months or years after it is posted, which suits an
evergreen journal about a place. The audience also matches: trip planning,
cabin and cottage stays, slow-weekend content, seasonal travel.

What it will not do is produce a spike. Pins typically take 3 to 6 months to
accumulate distribution, and the first 60 days usually look like nothing is
happening. If the measure of success is "clicks this month," this channel will
read as a failure while working correctly. Expect a slow compounding curve that shows up in month 3 and matters in month 6.

**The blocker is images, not copy.** Of 80 original photos, 2 are portrait. Of
26 site images, 3 are vertical. Pinterest's format is 2:3 (1000x1500), and
landscape pins get materially less distribution. Nothing in this plan works
until pin images exist, which is why Phase 1 is a render pipeline rather than a
posting integration.

---

## Phase 0: Account and site setup (Will's hands, ~30 minutes, once)

Nothing here is automatable; it all needs a human in the Pinterest UI.

1. **Business account.** Convert or create at pinterest.com/business. A personal
   account gets no analytics and no scheduler.
2. **Claim captainscottageva.com.** Settings → Claimed accounts → Claim website.
   Pinterest gives an HTML meta tag; it goes in `BaseLayout.astro` head, same
   pattern as the existing Cloudflare beacon. Claiming attributes every pin that
   links to the domain, including pins other people create, and unlocks domain
   analytics.
3. **Enable Rich Pins.** Run the site through the Rich Pins Validator with any
   journal post URL. The site already emits the OpenGraph tags Article Rich Pins
   read (`og:title`, `og:description`, `og:site_name`), so this should validate
   without code changes. Rich Pins pull the post title and description onto the
   pin automatically and mark it as coming from a real site.
4. **Boards.** Five to start, each a search phrase people actually use, not
   branded cuteness:
   - Virginia's Northern Neck
   - Chesapeake Bay Travel
   - Weekend Getaways from Washington DC
   - Waterfront Cottage Stays
   - Slow Travel and Cabin Weekends

   Board descriptions carry keyword weight. Write them like meta descriptions.

**Gate:** report back that the domain is claimed and Rich Pins validate. Phase 1
can be built in parallel; Phase 3 cannot start until this is done.

---

## Phase 1: Pin image pipeline (build the render target first)

Per the handbook rule: build the thing that produces the artifact before
building the approval loop around it.

**`scripts/build-pins.mjs`**, using `sharp` (already a dependency, no new
install):

- Input: a post slug. Reads the post's `hero` and any images referenced in the
  body, falling back to a per-category default set.
- Output: `public/pins/<slug>-<variant>.jpg` at 1000x1500, quality 82, plus a
  `content/pins/<slug>.json` manifest recording which source image each pin used.
- Transform: crop the landscape source to 2:3 with the crop anchored where the
  subject is (`sharp`'s attention strategy), then composite a text band in the
  site's own type. Fraunces for the title, Inter Tight for the small standfirst,
  bone-on-ink or ink-on-bone per the design tokens in `global.css`. This is the
  same visual system as the site, not a generic Canva template.
- Three variants per post, because Pinterest rewards multiple distinct pins per
  URL rather than one pin repeated: (a) title-overlay pin, (b) clean photo pin
  with no text, (c) a two-image split for posts where a contrast is the point
  (the DC weekend post's Eastern Shore vs. Northern Neck, for example).

**Acceptance:** run it against `the-art-of-the-slow-weekend` and
`weekend-getaways-from-washington-dc` and look at six images. If they look like
the site, it passes. If they look like stock travel-blog pins, the type
treatment is wrong.

**Effort:** one focused session. The crop and composite are straightforward;
the type layout is where the time goes.

---

## Phase 2: Pin copy agent

New agent `.claude/agents/pin-writer.md`, same shape and same gate as the blog
agents. It never posts.

- Input: a published post plus its pin manifest.
- Output: `content/pins/<slug>.json` gains a `pins[]` array. Per pin: `title`
  (max 100 chars, keyword-led), `description` (roughly 200 chars, natural
  keywords, no hashtag spam, one call to action), `board`, `altText`, and
  `destinationUrl` with UTM parameters.
- Voice rules carry over verbatim, including the two banned AI tells: no em
  dashes, no "honest". Pinterest copy is search copy, so it is written flatter
  and more literal than the journal voice, but it is still the same house.
- **Gate:** pins land as `status: "draft"` in the JSON. Will approves them the
  same way he approves posts. Nothing is ever posted by an agent without that.

**Backfill:** the 9 already-published posts get pins first, since they are live
and can absorb traffic immediately. That is 27 pins at three per post, which is
roughly a month of posting at the recommended pace.

---

## Phase 3: Publishing

Deliberately staged, cheapest first.

**Stage A, manual (start here, weeks 1 to 4).** Pinterest's native scheduler
holds 10 pins at a time, 30 days out, added one at a time. That is enough for
the recommended cadence of 1 to 3 pins per day, and it costs nothing but Will's
time. Run this for a month before automating anything, because it will surface
what actually gets saved, and building an API integration for a channel that
turns out not to convert is wasted work.

**Stage B, API v5 (only if Stage A shows signal).** The API is free at both
tiers. A new app starts in Trial, which can only post to the app owner's own
account, which is exactly our case, so Trial may be sufficient permanently.
Standard access requires submitting a video demo for review. Implementation
would be a scheduled GitHub Action alongside the existing `auto-publish.yml`,
reading approved pins from `content/pins/*.json` and posting `POST /v5/pins`
with OAuth credentials in repo secrets. Trial access is heavily rate-limited,
which is fine at 1 to 3 pins a day.

**Not recommended:** Tailwind or another paid scheduler. At this volume it
solves a problem we do not have.

---

## Phase 4: Measurement

Without this, the channel is unfalsifiable.

- **UTM on every pin:** `?utm_source=pinterest&utm_medium=social&utm_campaign=<slug>&utm_content=<variant>`.
  The variant parameter is what tells us whether title-overlay or clean-photo
  pins actually work, which is a real A/B test and feeds directly into item 2 of
  Will's list.
- **Pinterest analytics:** impressions, saves, outbound clicks per pin. Saves
  matter more than impressions, since a save is what gives a pin a second life.
- **Cloudflare Web Analytics:** referral traffic from pinterest.com, and whether
  it lands on posts or moves toward `/book`.
- **Extend `content/metrics/`:** a monthly `pinterest-metrics.json` in the same
  shape as the existing Airbnb metrics, so `blog-metrics` can read it.

**Review at day 90.** Three outcomes, decided in advance so the decision is not
made emotionally: outbound clicks are growing month over month, so continue and
build Stage B; clicks are flat but saves are growing, so continue manually for
another 90 days, since saves lead clicks; both flat, so stop, and take the
finding that Pinterest does not work for this property rather than pouring more
time in.

---

## Sequencing

| Phase | Whose hands | When |
|---|---|---|
| 0. Account, claim, Rich Pins, boards | Will | Once, ~30 min, unblocks Phase 3 |
| 1. `build-pins.mjs` render pipeline | Claude | One session, can start now |
| 2. `pin-writer` agent + backfill 9 posts | Claude, Will approves | After Phase 1 |
| 3A. Manual posting, 1 to 3 pins/day | Will | Weeks 1 to 4 |
| 3B. API v5 automation | Claude | Only if 3A shows signal |
| 4. Measurement + day-90 review | Both | Continuous, decide at day 90 |

**Recommended start:** Phase 1. It is the blocker, it needs no Pinterest account
to build, and the pin images are useful regardless of whether Pinterest itself
works out, since the same 2:3 renders serve Instagram and the Airbnb listing.

---

## Open questions for Will

1. Does a Captain's Cottage Pinterest account already exist, or is this from
   zero?
2. Pin under the property name, or under a person? Property is the default and
   the right call for a rental.
3. Is 1 to 3 pins a day of his time acceptable for the first month, or should
   Stage B be built up front and Stage A skipped? Skipping Stage A means
   building an integration before knowing the channel works.
