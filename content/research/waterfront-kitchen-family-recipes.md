# Research Brief: "Family Recipes for a Waterfront Kitchen"

**Slug:** `waterfront-kitchen-family-recipes`
**Category:** Lifestyle
**Publish date (target):** 2026-06-10
**Experiment note:** Evergreen baseline — no seasonal signal. publish+38.5d ~mid-July; content is season-neutral (control post in the lead-time experiment).
**Status going in:** `idea`
**Prepared by:** Researcher agent, 2026-05-15

---

## Angle & reader

A short journal entry, not a recipe index. The one idea: the cottage kitchen is good enough to cook a real meal, and a slow waterfront evening is the right occasion to do it. The reader is a family or small group already booked or seriously considering the cottage — they're wondering whether they'll mostly eat out or whether cooking in is worth it. The post reassures them that cooking in is part of the experience: the screened dining porch over the water, the local grocery fifteen minutes away, the rhythm of a meal that ends at sunset. The Writer should gesture at 3–5 simple meals (not recipe cards — impressions: what they look like, how they smell, why they fit a vacation pace) and let the sourcing story — Food Lion, Kellum Farms produce, the possibility of fresh seafood at Kellum's Irvington store — do the atmospheric work. This post explicitly owns the cooking beat; the crabbing post's single cooking sentence (steaming with Old Bay on the screened porch) is its ceiling, not its floor.

---

## Key facts (with sources)

### Property facts — authoritative, use verbatim

- The cottage has two screened porches: a sleeping porch off the back and a dining porch over the water. The dining porch is the natural setting for the meal scenes in this post.
  Source: `src/lib/site.ts` (STANDOUT_AMENITIES — "Two screened porches: Sleeping porch off the back, dining porch over the water.")

- Max guests: 6. Bedrooms: 3. Rated 4.92 stars, 137 reviews, Superhost 9 years.
  Source: `src/lib/site.ts` (PROPERTY); `captains_cottage_brief.md` §7

- The cottage is in Heathsville, Northumberland County, Virginia 22473. Located on Hull Creek, off the Potomac River near where it meets the Chesapeake Bay.
  Source: `captains_cottage_brief.md` §7

- The cottage is described as "kid-ready" (high chair, pack-n-play, removable bed guard).
  Source: `src/lib/site.ts` (STANDOUT_AMENITIES)

- UNVERIFIED — do not state as fact: Specific kitchen appliances (oven type, number of burners, whether there is a grill or outdoor burner, dishwasher, coffee maker brand, knife quality, cookware). The brief and site.ts do not itemize the kitchen. This is the primary Open Question for Will. Do not assert any specific equipment.

### Local sourcing — confirmed from guidebook

- **Food Lion** is the nearest grocery store, approximately 15 minutes from the cottage. The host's guidebook note: "Not fancy, but this is the nearest grocery store. Friendly, helpful staff."
  Source: `src/lib/guidebook.ts` (GUIDEBOOK — Food Lion entry)

- **Kellum Farms** (primary location): Local produce — fruits and flowers in season. The guidebook notes to call ahead to confirm hours and offerings; contact info is on their social media page. Locally known (16 locals recommend on Airbnb guidebook).
  Source: `src/lib/guidebook.ts` (GUIDEBOOK — Kellum Farms entry)

- **Kellum Farms Produce & Seafood** (second location, Irvington): A second Kellum location. The guidebook advises contacting their Irvington store for hours and offerings.
  Source: `src/lib/guidebook.ts` (GUIDEBOOK — Kellum Farms Produce & Seafood entry)

- External confirmation of Kellum Farms: The Irvington location is at 3443 Irvington Rd, Irvington, VA 22480. Carries produce, seafood (oysters, shrimp, crabs sourced from local waters), Homestead Creamery products, and other local goods. Hours as of search: Mon–Fri 9 AM–5:30 PM, Sat 9 AM–5 PM, closed Sunday. The Kellum family has a multi-generational oyster business on the Northern Neck.
  Source: Yelp listing (updated March 2026), https://www.yelp.com/biz/kellum-farms-produce-and-seafood-irvington; Virginia's River Realm directory, https://www.virginiasriverrealm.com/find-the-freshness-shopping-for-seafood-and-produce-in-the-river-realm/

- CAUTION — hours/stock are seasonal and subject to change. The Writer must tell readers to call ahead, consistent with the host's own guidebook note. Do not state current hours as permanent fact.

- **Jeff's Country Market**: The guidebook describes it as a local country market partnering with local farmers, fishermen, and butchers for "great local eats and odds and ends."
  Source: `src/lib/guidebook.ts` (GUIDEBOOK — Jeff's Country Market entry)

- CAUTION — Jeff's Country Market status: The Heathsville location (10919 Northumberland Hwy) appears to be CLOSED as of May 2026 per Yelp. A second location is listed at 16658 Northumberland Hwy, Reedville, VA 22539 (Tue–Sat 9 AM–6 PM, Sun 10 AM–5 PM). Do NOT state Jeff's Country Market as open and nearby without Will confirming current status. Mark as UNVERIFIED for the Writer; omit or flag with a TODO if used.
  Source: Yelp — "CLOSED — Updated May 2026" for Heathsville location, https://www.yelp.com/biz/jeffs-country-market-heathsville; Reedville location listing, https://www.yelp.com/biz/jeffs-country-market-reedville

- **Reedville Market**: The host guidebook describes it as "solid waterfront dining in Reedville — decent food and a relaxed spot to settle in by the water for an evening." (71 locals recommend.) This is a restaurant, not a grocer — it fits a "night off from cooking" beat if the Writer needs contrast, not a sourcing reference.
  Source: `src/lib/guidebook.ts` (GUIDEBOOK — Reedville Market entry)

### The cooking beat boundary with the crabbing post

- The crabbers-morning post (`crabbers-morning-on-hull-creek`) owns one sentence of cooking: steaming crabs with Old Bay on the screened porch. That is its ceiling.
- This post owns all recipe content. It should not repeat the Old Bay steaming beat as if it were introducing it — but it may reference "the catch from the dock" as one possible meal protein, in a single gesture, without repeating the crabbing-post's how-to detail.
  Source: `content/content-calendar.json` (post #4 note: "Do NOT overlap the crabbing post's one cooking beat — this one owns recipes"); `content/research/crabbers-morning-on-hull-creek.md` (cooking section confirms the single-beat rule)

### Meal register and tone

- The brief calls for "practical, grocery-list-ready, 5 easy meals" — but the writer agent's voice model (Inness/Kinfolk register, ~500–900 words, one idea, gestured not over-detailed) means: impressions of 3–5 meals, not recipe cards with measurements. Think: what it looks like to set the table on the dining porch, not step-by-step instructions.
  Source: `captains_cottage_brief.md` §6 (post #4 description); `.claude/agents/blog-writer.md` (voice model)

- The meal list should be short, simple, and genuinely easy for a vacation kitchen — things a family of 4–6 can make without specialist equipment, special skills, or a pantry they packed from home. Grocery-list-ready means: everything at Food Lion, possibly supplemented with one stop at Kellum Farms.

- UNVERIFIED — do not state as fact: Any specific named dishes or recipes. The Writer should invent plausible, true-to-place meal impressions (e.g., pasta with shrimp from Kellum, a one-pot corn chowder, grilled sausages, a big salad with local tomatoes), but these should be treated as illustrative suggestions, not documented cottage recipes. Mark any specific dish with a TODO if Will wants to swap it for something he actually cooks there.

---

## Internal links

Both targets are live pages. The post must link to at least two.

1. **`/the-cottage`** — The full property page (currently a ComingSoon stub but the path is live in the nav). Link naturally when describing the kitchen or the screened dining porch. Anchor text: something like "the dining porch" or "the cottage kitchen" — descriptive, not "click here."
   Note: `/the-cottage` is a ComingSoon stub as of 2026-05-15. The link is correct and should be included; it will be meaningful content once Phase 3 builds that page.

2. **`/area/`** — The Northern Neck overview page (live). Link when contextualizing the sourcing story — Kellum Farms, the rhythm of a Northern Neck afternoon, what it means to cook and eat in this part of Virginia.

Optional third link: `/journal/the-art-of-the-slow-weekend` (published). The slow-weekend post and this one share the same register — the case for unhurried vacation time. Cross-link only if it flows naturally.

---

## Booking CTA

**Single CTA, bottom of post.**

Text: "Stay with us. The water is waiting."
Points to: `/book` (redirects to https://www.airbnb.com/h/captainscottageva until Phase 6 direct booking).

Do not add a second CTA mid-post.

---

## Voice notes

- **Register:** Practical and warm, first-person host or close-third on the family. Not a food blog. Not a recipe site. The food is in service of a feeling: the evening slows down, someone opens a bottle of wine, something smells good from the kitchen, the light on the water goes gold. The meal is a vehicle for the porch.
- **Lifestyle category:** Same register as "The Art of the Slow Weekend." The post is about a quality of evening, not a cooking tutorial.
- **Drop cap on the opening paragraph,** per design system (Fraunces italic, rust, ~72px floated).
- **3–5 meals, gestured:** Each gets a sentence or two — what it is, why it works, one sensory detail. No ingredient lists, no measurements, no numbered steps. A reader should feel they could make it, not feel they have received instructions.
- **Grocery sourcing as atmosphere:** The fifteen-minute drive to Food Lion, the possibility of a detour to Kellum Farms for tomatoes or oysters — this is local color, not logistics. Keep it light.
- **No overlap with crabbing post's cooking beat:** Do not re-narrate the Old Bay steaming scene. This post may gesture at "the crabs you pulled from the dock that morning" as one protein option, briefly, then move on.
- **Kids present in the frame:** The cottage is kid-ready; one or two of the meals should be plausible with children at the table.
- **Length:** Target 500–800 words. This is a shorter journal entry — the meal impressions should breathe, not accumulate.
- **Images:** Hero should be the dining porch or a simple meal set on the porch table at dusk. Alt text: `captains-cottage-screened-porch-dinner-hull-creek.webp` (or similar descriptive slug). A second image of local produce or a simple plated dish if available.

---

## Open questions for Will

These cannot be resolved by research. Writer must leave visible TODOs where they apply.

1. **What is actually in the kitchen?** Oven, stovetop (gas or electric?), number of burners, grill (outdoor? charcoal or propane?), outdoor burner/crab cooker, cookware quality, knives, coffee situation. Guests frequently ask; a post that gestures at "the full kitchen" is weaker than one that says "the six-burner gas stove" or "the cast-iron skillet that lives on the back burner." Even a general characterization ("a proper kitchen, not a vacation afterthought") is helpful.

2. **Does the cottage have a grill?** If yes — charcoal, propane, or flat-top? This matters for meal suggestions (grilled fish, corn, sausages are different from oven-roasted).

3. **What meals does Will or his family actually make there?** The post is strongest with one true, specific recipe beat — something Will has literally cooked on the screened porch, or a dish a family of guests made. Even a short answer ("we always do a big pot of pasta the first night") gives the Writer a true anchor.

4. **Is Jeff's Country Market still open?** The Heathsville location appears closed on Yelp (May 2026). If it is closed, remove it from all sourcing references. If the Reedville location is open and relevant, confirm whether it is worth mentioning.

5. **Kellum Farms hours / call-ahead requirement:** The guidebook already says "call ahead." Can Will confirm whether the call-ahead is still the right advice, or whether they now have reliable posted hours? (The Yelp listing shows Mon–Fri 9–5:30, Sat 9–5, but hours for farm stands can shift seasonally.)

6. **Any specific local seafood the cottage guests have cooked?** Oysters from Kellum, shrimp, spot croaker from a fishing trip? One specific locally-sourced protein makes the sourcing story real rather than aspirational.

7. **Screened porch dining specifics:** Is the dining porch table large enough to seat 6? Any details (string lights, views west toward the creek sunset) that ground the scene?

---

## Summary: what is solid and what gaps remain

**Solid — Writer can draft from without further fact-finding:**

- All property facts: two screened porches (dining porch over water explicitly confirmed), max 6 guests, kid amenities, location, rating. From `src/lib/site.ts` and `captains_cottage_brief.md` §7.
- Food Lion is the nearest grocery, 15 minutes away. Confirmed by guidebook.
- Kellum Farms (both locations) is confirmed open and carries local produce and seafood. External verification agrees with guidebook. Writer should preserve the call-ahead caveat.
- The meal register: 3–5 gestured impressions, not recipe cards. Tone: practical, warm, family, porch-first. Per brief §6, writer agent voice model.
- Internal links (/the-cottage, /area/) confirmed. CTA destination confirmed.
- Boundary with crabbing post clearly defined: no re-narrating the Old Bay steaming scene.

**Gaps — Will must fill before or during draft:**

- Exact kitchen equipment (the most important gap — the whole post hinges on "the kitchen is good enough to cook in").
- Whether a grill exists and what type.
- Any true meal Will or a guest has actually made there (the specific anchor the post needs most).
- Jeff's Country Market status — likely closed at Heathsville location; omit until confirmed.
- Kellum Farms seasonal hours — guidebook says call ahead; current Yelp hours may not be reliable year-round.

---

*Sources compiled during research session 2026-05-15. All external URLs accessed same date.*
