# Add the Load Growth Estimator

## What will be built
- Place the uploaded component, data, and stylesheet together under the requested load-estimator folder.
- Keep all estimator calculations, controls, defaults, copy, and interactions unchanged.
- Restyle the uploaded stylesheet with Austin Clean Energy’s green, blue, gold, surface, border, typography, and dark-mode tokens.
- Add a dedicated `/load-estimator` page with page-specific search metadata and the standard public footer.
- Add the page to the public sitemap and XML sitemap so it is discoverable.

## Technical details
- Copy `LoadEstimator.tsx` and `load-estimator-data.ts` without logic changes.
- Adapt only scoped CSS variables and presentation rules; retain the component’s class structure.
- Create a thin page wrapper and register it in the existing router.
- Verify type safety and test the live page at desktop and mobile widths, including slider updates and overflow.
