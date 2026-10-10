# Research brief: christmas-on-the-northern-neck

Written 2026-10-10. Commissioned out of cycle: the seasonal planner found the
`holidays` season uncovered with its publish window already shut, and the
holidays carry the longest booking lead of any season in
`content/season-model.json` (150 days for Christmas, 120 Thanksgiving, 90 New
Year). December revenue has gone **$3,151 (2023), $476 (2024), $0 (2025)**, so
this is the single emptiest month on the property and the one with no content
pointed at it.

## Angle

**Not a what's-open guide.** Voice principle #2 keeps logistics out of the
journal, and an opening-hours listing would be out of date by December anyway.
The subject is the house in winter, when the three amenities that are merely
nice in August (sauna, hot tub, fire pit) become the actual reason to come. The
holiday events up the road are garnish, one short section, and they are there to
prove the area is alive in December rather than to serve as an itinerary.

Target reader: a couple or a small family in the DC or Richmond drive market
deciding where to spend the week between Christmas and New Year. They assume a
waterfront rental is a summer thing. The post exists to say it is better in the
cold and to make the empty week sound like the find it is.

## Verified facts, with sources

| Fact | Source |
|---|---|
| Cedar sauna, west-facing window onto the creek, cold plunge from the dock | `src/lib/site.ts` STANDOUT_AMENITIES |
| Hot tub on the patio beside the porch, **open year-round** | same |
| Two screened porches; dock; fire pit | same, and `extras/back-patio-hot-tub-fire-pit.jpg` |
| Kilmarnock 30 minutes, Irvington 45 minutes | `src/lib/site.ts` DRIVE_TIMES |
| **46th Annual Lighted Kilmarnock Christmas Parade, December 11, 2026** | kilmarnockva.com/kilmarnock-events, fetched 2026-10-10 |
| **Holiday lights, Town Centre Park, Nov 29 to Jan 1, 5pm to 8pm nightly** | same |
| **Movies on the Half Shell, free, from your car: ELF Thu Dec 10, The Polar Express Thu Dec 17, both 5pm** | same |
| Steamboat Era Museum Holiday Marketplace, Irvington, weekends Nov 25 to Dec 21 | virginiasriverrealm.com and hopeandglory.com, 2026-10-10 |

## Do NOT write

- **No golden winter sunsets.** The canonical amenity line says the creek lights
  up gold "every evening from May to September". December is not that, and
  claiming it contradicts the property's own facts file.
- **No precise sunset time.** Early dark is true and worth using; a clock time
  needs a source nobody has pulled.
- **No snow.** Unverified for this location and unlikely to be reliable.
- **No swimming.** Wading and a cold plunge from the dock are the water in
  winter; the creek is brackish and shallow.
- No "Hull Creek" in the title, headings or keywords. Body texture only, per the
  locked location rule in `CLAUDE.md`.

## UNVERIFIED, left out of the draft

Restaurant and shop opening hours over the holidays; whether the Tides Inn or
the Dog and Oyster run anything seasonal; church services; whether the parade
has a rain date. None of it is checkable to a standard worth printing, and all
of it dates badly. If Will wants an itinerary section he can supply the places
and it can be added.

## Structure

Lede scene, then: the house in winter (the real argument), one short section on
what is on up the road, then the week between Christmas and New Year as the
quiet find, then the close. Benchmark for length and restraint is
`the-art-of-the-slow-weekend.mdx`, around 900 words of body.

Internal links, at least two: `/the-cottage`, `/journal/cottage-sauna-culture`,
`/area`. One CTA to `/book`.
