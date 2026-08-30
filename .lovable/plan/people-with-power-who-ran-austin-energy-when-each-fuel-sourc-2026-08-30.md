# People With Power — who ran Austin Energy when each fuel source arrived

A new public page at `/people-with-power` that pairs Austin Energy's leadership history with the moment each new type of generation first entered the utility's portfolio, so readers can see which decisions happened on whose watch.

## What the page shows

1. **Timeline / table of first-of-its-kind additions** — one row per fuel source with the year it first came online for Austin Energy, and the general manager (or equivalent utility director) in office at that time. Sources covered: gas (Decker, Holly), coal (Fayette), nuclear (South Texas Project), wind (West Texas PPAs), landfill methane / biomass, utility-scale solar (Webberville and later), customer-sited local solar (rebate era), and battery storage.

2. **Leader cards** — one card per general manager with tenure years and a short factual background: professional discipline (engineer, lawyer, career utility manager, conservation program leader), where they came from, and the perspective they were publicly known for (e.g. conservation-first vs. traditional supply-side operations). Each claim carries a citation link.

3. **Cross-reference column** — for each fuel addition, a one-line note on how that leader publicly framed the decision when a quotable public record exists.

## Honest-data rules for this page

- **Party affiliation will not be shown.** Austin Energy general managers are appointed city staff, not elected officials, and party registration is not public in Texas. The page will say this explicitly rather than guess or infer.
- Where the GM at the time of an addition is unclear (older gas and coal units predate the modern GM role, when the utility sat under a city electric department), the row shows the actual title-holder or an explicit "not documented" marker — never a guess.
- Every year and biography line gets a source link (Austin Monitor, Austin Chronicle, Austin Energy, city archives). Interpretive lines are labeled as characterization, not fact.
- Fuel first-year dates are cross-checked against the plant data already in the project (`public/ae_plants.json`, `plant_monthly_gen`) where those tables cover the unit.

## Technical notes

- New page `src/pages/PeopleWithPower.tsx`, routed under `PublicLayout` in `src/App.tsx` at `/people-with-power`, using the existing `PageHeader` component and semantic design tokens.
- Data lives in a typed static module `src/lib/people-with-power.ts` (leaders array, fuel-first-added array, source citation list) — same pattern as `src/lib/federal-support.ts` and `src/lib/local-resources.ts`. No new database tables or edge functions.
- SEO via the existing `useSeo` hook; add the route to `public/sitemap.xml` per the project's manual sitemap policy.
- Link to the page from the Power Money page and from the site footer/sitemap page so it is discoverable.

## Open item

Research pass will be run as part of the build to nail down each GM's tenure dates and background from public reporting; anything that cannot be sourced is left blank with a visible "not documented" marker rather than filled in.
