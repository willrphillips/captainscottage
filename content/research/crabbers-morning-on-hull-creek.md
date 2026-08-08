# Research Brief: "A Crabber's Morning on Hull Creek"

**Slug:** `crabbers-morning-on-hull-creek`
**Category:** Lifestyle (NOT Travel — see calendar note; flag for Will to confirm)
**Publish date (target):** 2026-05-20
**Status going in:** `researched`
**Prepared by:** Researcher agent, 2026-05-15

---

## Angle & reader

A first-person (Will's voice, or close-third on a guest) pre-dawn vignette: someone walks the dock before the sun is up, pulls the crab pots the cottage provides, sorts the catch on the dock planks in the growing light, steams the haul on the screened porch with Old Bay before the day properly starts. The how-to — baiting, timing, sexing a crab, the legal minimums — lives inside the story rather than in bullet lists. The post earns the Lifestyle label because the subject is not a crabbing tutorial; it is a specific kind of morning that only exists at this place. The target reader splits into two audiences that must both be served: (1) prospective guests who want to know whether crabbing is genuinely possible and easy at the cottage, and (2) search-intent readers arriving on "crabbing Potomac River" or "Virginia crabbing guide" who may not yet know Captain's Cottage exists. The post is a soft-sell awareness piece; it should surface the dock-and-crab-pots amenity organically rather than announcing it.

---

## Key facts (with sources)

### Property facts (from local files — authoritative)

- The cottage sits on Hull Creek, Heathsville, Northumberland County, Virginia. Coordinates approx. 37.95° N, 76.45° W.
  Source: `src/lib/site.ts` (PROPERTY object) and `captains_cottage_brief.md` §7

- The standout amenity is listed verbatim as: "Dock & crab pots — Crabbing gear included. Run lines from the dock, pull at dawn."
  Source: `src/lib/site.ts` (STANDOUT_AMENITIES)

- The water is described as brackish, shallow, mostly fresh — good for kids; the beach/shoreline shifts seasonally.
  Source: `src/lib/site.ts` (STANDOUT_AMENITIES — "Waterfront & water access")

- Verified guest review (usable as in-post pull quote, attributed): "We pulled crab pots at sunrise and watched osprey work the creek. Three days later none of us wanted to leave." — Maya, Brooklyn NY
  Source: `src/lib/site.ts` (HEADLINE_REVIEWS)

- The property also has two kayaks and a paddleboard; the cedar sauna faces west onto the creek; the hot tub is on the patio beside the porch (corrected 2026-08-08 by Will; it is not on the deck).
  Source: `src/lib/site.ts` (STANDOUT_AMENITIES)

- Max guests: 6. Bedrooms: 3. Rated 4.92 stars across 137 reviews. Superhost 9 years.
  Source: `src/lib/site.ts` (PROPERTY) and `captains_cottage_brief.md` §7

### Hull Creek geography

- Hull Creek is a 6.5-mile-long tidal tributary of the Potomac River, located in Northumberland County, Virginia.
  Source: Wikipedia — Hull Creek (Potomac River tributary), https://en.wikipedia.org/wiki/Hull_Creek_(Potomac_River_tributary) (article is a stub sourced from USGS NHGD and GNIS)

- Hull Creek meets the Potomac at sea level, confirming full tidal influence. The connection places it in the tidal/brackish zone of the lower Potomac, near where the Potomac opens toward the Chesapeake Bay.
  Source: Wikipedia (above); consistent with `captains_cottage_brief.md` §7 ("off the Potomac River near where it meets the Chesapeake Bay")

### Tide data

- NOAA does publish official tide predictions for the broader Potomac/lower Chesapeake region. Third-party tide sites (tideschart.com, tideking.com) publish Heathsville-specific forecasts. The nearest official NOAA reference station for this part of the lower Potomac appears to be Point Lookout, MD (NOAA Station 8578002), approximately 5 nautical miles from Northumberland County.
  Source: NOAA Tides & Currents search results, https://tidesandcurrents.noaa.gov/stationhome.html?id=8578002; secondary tide sites at https://www.tideschart.com/United-States/Virginia/Northumberland-County/Heathsville/ and https://tideking.com/United-States/Virginia/Northumberland-County/Hull-Neck/

- NOAA does not appear to have a dedicated in-creek gauge at Hull Creek itself; predictions for Hull Neck/Heathsville on third-party sites are derived/interpolated from the NOAA reference station.
  Source: NOAA station map review (no station returned for Hull Creek directly)

- **Practical tide note for the narrative:** Crabs are most active around tidal movement. Commercial watermen on the Rappahannock (nearest comparable river) drop pots around high tide and pull after; recreational guidance suggests pulling about an hour after high tide or early morning when crabs are feeding. The "pull at dawn" copy in site.ts aligns with real practice — Chesapeake watermen begin well before sunrise (3–4 a.m. on commercial boats; more manageable for recreation at first light).
  Source: https://www.rivahguide.com/crabbing-101-fishing-the-pots-on-the-rappahannock/; general crabbing forum consensus at https://www.tidalfish.com/threads/crab-pot-soak-time.34565/

### Blue crab season

- Blue crabs in the Chesapeake/Potomac system emerge from winter dormancy when water temps approach 50°F, typically by late April or May; the recreational pot season on Virginia waters runs March 17–December 20 (unlicensed, up to 2 pots) and June 1–September 15 (licensed, 3–5 pots).
  Source: VMRC Recreational Crabbing Rules, https://mrc.virginia.gov/regulations/VA-recreational-crabbing-rules.shtm

- Peak availability: summer (June–August) for volume; fall (September–mid-November) for larger, heavier crabs. The narrative's morning scene works best framed in midsummer when heat and the pre-dawn hour are most vivid.
  Source: https://cravincrabs.com/when-is-blue-crab-season-in-baltimore-and-how-to-tell-theyre-fresh/; https://www.cameronsseafood.com/blogs/faq/maryland-blue-crab-season

### VMRC regulations (Virginia, recreational)

- **Minimum size:** Male crabs — 5 inches tip-to-tip (point-to-point across the widest part of the shell). Immature females — 5 inches. Mature females (sooks) — no minimum size limit.
  Source: VMRC Recreational Crabbing Rules, https://mrc.virginia.gov/regulations/VA-recreational-crabbing-rules.shtm

- **Daily catch limit:** 1 bushel of hard crabs per person per day (approximately 40 lbs).
  Source: VMRC Recreational Crabbing Rules (same URL above)

- **Pot limits without a license:** Up to 2 crab pots per person, no license required. Season: March 17–December 20.
  Source: VMRC FAQ, https://www.mrc.virginia.gov/faq.shtm; VMRC Rules page (same URL above)

- **License for 3–5 pots:** $36 (with terrapin excluder devices, required) or $46 (without). Season for licensed pots: June 1–September 15.
  Source: VMRC license fees, https://www.mrc.virginia.gov/mrc_license_fees.shtm

- **Non-resident distinction:** The VMRC recreational crab pot license itself does not appear to have a resident/non-resident split in the published fee schedule. However, the underlying Virginia saltwater recreational fishing license (required base license) does: resident annual $17.50, non-resident annual $25.00, 10-day (resident or non-resident) $10.00.
  Source: VMRC license fees page (same URL above)

- **Writer's note on regulations:** The Writer should recommend guests check current VMRC rules at mrc.virginia.gov before their stay, as regulations can change year to year. Do not state fee amounts as permanent — list them as current at time of research (May 2026) and tell readers to verify.

- **Sponge crab (egg-bearing female) rule:** March 17–June 15, only bright orange sponge crabs may be kept; all dark sponge crabs must be returned. June 16 onward, all sponge crabs may be kept.
  Source: VMRC Recreational Crabbing Rules (same URL above)

### Bait

- Chicken necks are the traditional Chesapeake crab bait — cheap, widely available, tough enough to survive multiple pot pulls (can last 5–10 days in some conditions), and proven effective for blue crabs.
  Source: https://crabbingzone.com/best-bait-for-crabbing/ and https://crabbinghub.com/whats-the-best-bait-for-crabbing/

- Oily fish (menhaden/bunker, mackerel, bluefish) attract crabs faster due to stronger scent trail but degrade more quickly. Commercial watermen on the Rappahannock (nearest comparable system) bait with "bunker" (menhaden). Either works; chicken necks are easier for guests.
  Source: https://crabbingzone.com/best-bait-for-crabbing/; rivahguide.com article (Rappahannock watermen use bunker)

- **Note for the narrative:** Grocery-store chicken necks are the practical choice for guests — widely available at the Food Lion in Heathsville (15 min, per guidebook). The Writer can mention this without explicitly advertising the store.
  Source: `src/lib/guidebook.ts` (Food Lion note — "the nearest grocery store")

### Pot soak time

- Overnight or several hours is a common recreational approach. Watermen check pots at first light after setting in the evening; an alternative approach is setting in the afternoon and pulling at dawn. The "run lines from the dock, pull at dawn" framing in site.ts aligns with setting pots the evening before and pulling at first light.
  Source: https://www.tidalfish.com/threads/crab-pot-soak-time.34565/; https://www.rivahguide.com/crabbing-101-fishing-the-pots-on-the-rappahannock/

### How to sex a blue crab (jimmy vs. sook)

- **Jimmy (male):** Blue claw tips; long, pointed apron on the underside (often described as shaped like the Washington Monument or a capital T).
- **Sook (mature female):** Red/orange-tipped claws; wide, rounded apron (dome-shaped, sometimes compared to the Capitol Dome).
- This is the simplest cull the narrative needs to include — males over 5 inches, check. Females: mature sooks are keepers (no size minimum); immature females under 5 inches go back.
  Source: https://www.bluecrab.info/identification.html; https://crabsman.com/how-to-identify-male-vs-female-blue-crabs/; https://www.cameronsseafood.com/blogs/faq/difference-between-1-males-2-males-females-jumbo-crabs

### Steaming with Old Bay

- Steaming blue crabs with Old Bay is the canonical Chesapeake preparation. A brief one-paragraph beat (not a full recipe) is appropriate here; the full recipe post is calendar entry #4.
  Source: Calendar note in `content/content-calendar.json` ("One simple recipe beat — not the full recipes post, that is post #4")
  
- UNVERIFIED — do not state as fact: Specific steaming times, salt/vinegar ratios, or stovetop vs. outdoor burner details. Will can supply what setup exists at the cottage (outdoor burner? crab pot? stock pot?) — see Open Questions.

### Watermen culture / local lore

- Northumberland County is the birthplace of the modern crab pot: Benjamin Franklin Lewis, a Northumberland County waterman, invented and patented the wire crab pot in 1938 on the Yeocomico River. The modern commercial crab pot is essentially unchanged from his original design.
  Source: https://www.rivahguide.com/crabbing-101-fishing-the-pots-on-the-rappahannock/ (indirect reference); primary lore confirmed via watermen history search results, https://www.sherpaguides.com/chesapeake_bay/middle_peninsulas/northern_neck.html

- The watermen identity on the Northern Neck is genuine and living, not nostalgic: commercial crabbers still work the Potomac and its tributaries from towns like Reedville, going out before 4 a.m. This cultural context gives the post's dawn scene credibility and resonance.
  Source: https://www.rivahguide.com/crabbing-101-fishing-the-pots-on-the-rappahannock/; watermen history search results

- **Cross-post note (deconflict with post #14 "Oysters, Workboats, and Watermen"):** This post should touch watermen culture lightly — one paragraph of flavor, not a deep dive. The deep cultural treatment belongs in post #14. Do not duplicate the Reedville Fishermen's Museum angle here; save it for post #5.

### Atmosphere / sensory details

- Sensory anchors confirmed by geography and real guest experience: osprey on the creek (confirmed in Maya's guest review), fog off the water, pre-dawn quiet. Herons are common on Chesapeake Bay tributaries in summer mornings.
  Source: `src/lib/site.ts` (HEADLINE_REVIEWS — osprey mention); general ecological knowledge of tidal creek habitat

- UNVERIFIED — do not state as fact: specific bird species beyond osprey, exact fog patterns, specific dawn temperatures. Will should supply firsthand sensory details for the opening scene.

---

## Internal links

The post must link to at least two on-site pages. Both targets are live.

1. **`/activities/`** — The activities hub page. Link naturally when describing what the cottage makes possible: e.g., "the dock and the gear it holds" or when listing what a guest morning can look like. Anchor text should be descriptive, not "click here."

2. **`/area/`** — The Northern Neck overview page. Link when contextualizing Hull Creek within the broader geography ("the tidal creeks of the Northern Neck") or when noting the watermen tradition that runs through this region.

3. **Optional third link:** `/journal/the-art-of-the-slow-weekend` (already published). The calendar note suggests this if the narrative calls for a "slow morning" callback. The two posts share the same register — quiet, deliberate pace — and cross-linking strengthens both. Use only if it flows naturally; do not force it.

---

## Booking CTA

**Single CTA, bottom of post.**

Text: "Stay with us. The water is waiting." (This is the established CTA language from the site's BookingCTA component and the brief's section 5.)

Points to: `/book` (which redirects to https://www.airbnb.com/h/captainscottageva until Phase 6 direct booking is live).

Do not create a second CTA mid-post. One is enough; the narrative itself is the soft sell.

---

## Voice notes

- **Register:** Will's first-person, or close-third on a guest. Not instructional ("Step 1: bait the pot"). The how-to information should emerge through action: the character baits the pot, not "you should bait the pot." Warm, specific, unhurried.
- **Lifestyle category means:** The post belongs in the same register as "The Art of the Slow Weekend" — it is about a quality of morning, not a fishing tutorial. The crabbing mechanics are in service of the experience, not the other way around.
- **Drop cap on the opening paragraph,** per design system (Fraunces italic, rust, ~72px floated). The Writer should flag the opening paragraph for this treatment.
- **No shell emojis, no crabbing puns** ("crabby," "shell we," etc.) — the calendar note is explicit. Tone: Kinfolk meets Northern Neck, not a marina gift shop.
- **Italics in em tags** render rust-colored in the design system (Fraunces italic). Use sparingly for place names and emphasis.
- **Length target:** 800–1,200 words per the brief's blog content plan (section 6). The narrative arc should be: dock at dawn → baiting/setting → the wait (coffee, porch, light changing) → pulling pots → culling on the dock → steaming on the screened porch. That arc fits comfortably in 1,000 words.
- **Images:** Hero image should be dawn/dock oriented. Alt text must include natural keyword ("hull-creek-crabbing-dawn-dock.webp"). At least one additional image (e.g., crabs in a bushel, the screened porch). Descriptive filenames required per the brief's SEO rules.

---

## Open questions for Will

These cannot be resolved by research and require Will's direct input before the Writer drafts.

1. **How many crab pots are at the dock?** The site copy says "crab pots" (plural) and "run lines from the dock." The exact number is unknown. This is a question guests will ask, and the post should be able to answer it or deliberately leave it vague ("a few pots").

2. **Pot type — wire trap or crab ring/line?** The copy implies a pot (enclosed trap), but confirming the actual gear type matters for the "how to" accuracy. Commercial wire crab pots vs. open rings/nets have different techniques and soak times.

3. **Where does Will keep the bait and gear?** Is there a bait bucket, a cooler, a storage bin on the dock? Specific detail makes the scene real.

4. **Steaming setup at the cottage:** Does the cottage have an outdoor propane burner/crab cooker, or is guests' steaming done on the stovetop? What pot(s) are available? This determines whether the "steaming on the screened porch" beat is accurate.

5. **Will's own crabbing experience / anecdote:** Is there a specific morning Will remembers — a big catch, a funny moment, a guest reaction — that could anchor the narrative? The post is stronger with one true, specific story beat.

6. **Are chicken necks available locally?** The nearest grocery is Food Lion in Heathsville (per guidebook). Can Will confirm chicken necks are reliably stocked there, or is there a bait shop closer to the dock?

7. **Osprey and heron presence:** Can Will confirm these are regular at the dock in summer mornings? The guest review mentions osprey; herons are probable but not confirmed by a primary source.

8. **Category confirmation:** The calendar note flags that this post was incorrectly listed as Travel, corrected to Lifestyle per the brief §6. Will should confirm this is the intended category before drafting begins.

---

## Summary of what is solid and what gaps remain

**Solid (Writer can draft from without further fact-finding):**

- All property facts (dock and crab pots included, water characteristics, screened porch, coordinates, rating) — locked in local files.
- Virginia VMRC recreational crabbing regulations: 5-inch minimum for males, season dates (March 17–December 20 unlicensed up to 2 pots; June 1–September 15 licensed up to 5 pots), daily limit (1 bushel), license fee structure (saltwater fishing license required; non-residents pay $25 annual vs. $17.50 resident for the base license; crab pot license $36 with excluder devices). Source: official VMRC pages.
- How to sex a blue crab (jimmy vs. sook) — claws and apron shape. Well-sourced from bluecrab.info and others.
- Bait: chicken necks (durable, proven for Chesapeake blues) vs. oily fish (faster attraction, shorter life). Chicken necks are the practical guest recommendation.
- Soak time / pull timing: overnight soak → dawn pull is accurate and consistent with both site copy and Chesapeake watermen practice.
- Watermen lore: the crab pot was invented in Northumberland County (1938, Lewis patent) — a usable one-line local-color fact.
- Peak season framing: June–August for volume, September–November for size. Works for a post targeting summer guests.
- Internal links, CTA destination, voice register — all confirmed.

**Gaps (Writer must leave placeholders or Will must fill):**

- Exact number and type of crab pots at the dock.
- Steaming setup on the property (outdoor burner vs. stovetop).
- Firsthand sensory detail for the dawn scene — fog, sounds, specific light quality. Will's own memory or a guest anecdote is needed to make the opening scene specific rather than generic.
- Bait availability at local stores — plausible but unconfirmed.
- Non-resident vs. resident distinction for the crab pot license itself (only the underlying fishing license shows a fee split; the pot license fee appears uniform, but the VMRC fee schedule did not explicitly state this for the pot license — Writer should say "check VMRC for current fees" rather than quoting a dollar amount).

---

*Sources compiled during research session 2026-05-15. All external URLs accessed same date. Regulations are current as of that date — link to mrc.virginia.gov for the most current version.*
