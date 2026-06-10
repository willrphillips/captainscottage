# Airbnb listing optimization — ranked actions (researched 2026-06-09)

Benchmarked against Guest-Favorite waterfront/sauna listings (300+ reviews,
4.9+), AirDNA amenity-premium data, and the Reedville submarket (AirDNA: 77
rentals, ~42% occupancy, ~$337 ADR). Your stack (waterfront + sauna + hot tub
+ dock, $170–400) justifies pushing ADR, not chasing occupancy.

Owner actions only — none of this is automatable. Ranked by expected impact.

## 1. Review velocity (protects Guest Favorite ≈ 25% of search rank)
Recent, specific review text now outweighs old 5-stars.
- Checkout-morning message: thank + ask. Template lives in
  `content/replies/checkout-review-ask.md` — the guest-reply system can draft
  it; you send it.
- Nudge guests to NAME amenities ("if the sauna or the sunset off the dock
  made your stay, mentioning it helps other travelers") — review-text
  sentiment feeds ranking.
- Review the guest promptly; reciprocation lifts review rate.
- Keep inquiry responses under 1 hour (≈50% more bookings, 3x Superhost odds).

## 2. Title (50 chars, rarest amenity first)
Current: "Waterfront Cottage w Water Access, Sauna, Hot Tub" — close. Sharper:
`Waterfront Cottage · Sauna + Hot Tub · Private Dock`
"Private dock" is concrete and scarce; "water access" is redundant next to
"waterfront". No "beautiful/cozy" filler — specificity ranks.

## 3. Photo captions that add what the photo can't show
The 97-photo categorized set is done. As you upload, caption with facts:
"Dock has a crab-line cleat; water is kid-shallow at the ladder" beats
"Beautiful dock". Activity-led captions (crabbing, kid-shallow water, pier
fishing) are what the Chesapeake winners sell — experiences, not fixtures.

## 4. Description structure
First 400 chars (above the fold): waterfront + sauna/hot tub/dock + "2h45
from DC". Then bulleted amenity stack ordered by search priority, one short
review quote, distances (DC / Richmond / Reedville / Irvington). State one
honest limitation proactively (e.g. the east porch faces the garden) — the
pros-and-cons framing measurably protects ratings.

## 5. Pricing architecture (drive-to leisure market)
- Fri/Sat premium (near-universal among top performers).
- 3–4 demand seasons; up to ~30% off-peak discount.
- 2-night minimum default; 3-night only on holiday weekends; drop minimums
  inside 7 days with a 15–25% last-minute discount.
- 10–15% weekly discount.
- Amenity premiums say push peak ADR toward $300+: hot tub +14–34%,
  waterfront ~+13%, sauna ~+7% (AirDNA).

## 6. Calendar open 12–24 months out
Airbnb explicitly weights long availability for Guest Favorite/ranking.
Two minutes in the dashboard.

## 7. Cleaning fee
Keep under ~$75 or bake it into the nightly rate — fee shock is a top
booking-abandonment driver in this price band.

---

# Website follow-ons surfaced by the same research (for the build plan)

- **Email capture now, before direct booking exists** (highest-leverage new
  item): a footer signup ("Seasonal notes from Hull Creek"). Every property
  that hit 80% direct bookings built the list YEARS before the booking
  engine. Needs Will: provider choice (Buttondown/ConvertKit). Phase-6 head
  start; not yet built — decide and we wire it.
- Blog formats codified in the Editor agent (seasonal 8–12 wks early,
  itineraries, DC angle) — done 2026-06-09.
- "Arrival Essentials"-style verifiable-facts page (measured Wi-Fi, drive
  times, dock specifics) — candidate for the /faq or a small page when
  phase allows.
