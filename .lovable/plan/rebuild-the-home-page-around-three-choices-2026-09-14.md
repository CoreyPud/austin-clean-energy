# Rebuild the home page around three choices

## New home page

A short hero, then three large buttons:

1. **Residential Savings** - opens the property assessment for a home
2. **Commercial Savings** - opens the property assessment already set to commercial
3. **Austin Clean Energy Progress and Resources** - opens a new page holding everything that is on the home page today

Below the buttons: an address box with Austin address suggestions and a search button. Entering an address opens the property assessment with that address already filled in. Nothing runs automatically, so people can confirm the property type and the other options first, then start it themselves.

The campaign popup stays on the home page.

## New Progress and Resources page

Every existing home page card and section moves here unchanged: Austin at a Glance (solar trends, property explorer, EV adoption, path to zero, building energy, Power Money, energy timeline, the case for Austin Energy, pricing pressure, load growth estimator, peaker vs battery) and the personal action section. Page gets its own title, description, and a link back home. Added to the site map.

## Property assessment changes

- An address in the link fills the field but no longer starts the assessment on its own. Existing shared links behave the same way, showing the address ready to run.
- A commercial link preselects the commercial property type.

## Technical details

- `src/pages/Index.tsx` becomes a short hero, three `Link` buttons, and an `AddressAutocomplete` + submit that navigates to `/property-assessment?address=...`.
- New `src/pages/ProgressResources.tsx` holds the current card grid and previews, chart data hooks, and imports moved out of `Index.tsx`. Route `/progress-resources` inside `PublicLayout`; added to `src/pages/Sitemap.tsx` and `public/sitemap.xml`.
- `PropertyAssessment.tsx`: drop the auto-run effect keyed on `sharedAddress`; read an optional `type=commercial` (or `propertyType`) param to seed `propertyType`. SEO title/description behavior unchanged.
- Verify in the preview: buttons route correctly, address prefills without running, mobile layout, no console errors.
