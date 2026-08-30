# People With Power: retirements and coverage through 2026

Two gaps to close on `/people-with-power`:

1. The page only tracks *additions* of new fuel types. It should also show plants **retired** or shut down, and who was running Austin Energy when that decision was authorized.
2. The last event is the 2015/2016 battery contract, so the table appears to stop at 2016. Austin Energy signed plenty after that (large wind and solar PPAs, utility-scale batteries, community solar, the Fayette exit fight, and the current dispatchable-gas plan under Stuart Reilly). Those need adding so the story runs to 2026.

## What gets added

**A new "Plants retired and wound down" table** with the same discipline as the existing tables: decision/authorization date, leader at the time of the decision, actual closure date, leader at closure, note, and source links. Candidate rows to research and include only where sourced:

- Seaholm Power Plant — shut down 1989/1996
- Holly Street Power Plant — phased shutdown, final units 2007
- Decker Creek steam units — retired 2020s
- Fayette Power Project coal — Austin's repeated exit resolutions and the still-unresolved share
- Any retired gas peaking capacity documented by Austin Energy

**New rows in the existing contract table for 2016-2026**, again only what can be sourced with a date:

- Post-2016 utility-scale solar PPAs listed on Austin Energy's renewable generation page
- Post-2016 wind PPAs from the same table
- Utility-scale battery storage additions after the first 2015 contract
- Community solar / customer program expansions
- The current dispatchable gas generation proposal under Stuart Reilly (2025-2026)

**Leader coverage** — the leadership table already runs to Reilly; each new row gets attributed to Sargent, Kahn, or Reilly based on the documented decision date.

## Do you need to send more data?

No — Austin Energy's own renewable power generation page publishes contract dates for the post-2016 fleet, and Council authorizations plus Austin Monitor coverage carry the rest. Retirement dates are public. If a specific contract has no findable public authorization date, that row stays marked "not documented" rather than guessed, consistent with the rest of the page. If you have an internal list of retirements or PPA signing dates, sending it would let me fill rows that would otherwise stay blank.

## Technical notes

- Extend `src/lib/people-with-power.ts`: add a `Retirement` interface plus a `RETIREMENTS` array, new `SOURCES` entries, and new `MILESTONES` entries for 2016-2026. `fuel` stays the same union so colors and legends keep working.
- Add a third table section to `src/pages/PeopleWithPower.tsx` rendering `RETIREMENTS`, reusing the existing `Swatch`, source-link, and "not documented" patterns.
- Update the page caveats to say retirements are included and describe the additions-vs-retirements distinction.
- No database or edge function changes; all data is static and sourced.
