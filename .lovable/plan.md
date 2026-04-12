

## Plan: Unified Property Assessment + Recommendations Flow

### Current State

**Property Assessment** (`/property-assessment`): User enters address + property type. The backend geocodes it, calls Google Solar API for roof data, fetches nearby solar permits from the database, queries green building benchmarks, and generates an AI assessment with solar stats, map, and efficiency rating.

**Recommendation Engine** (`/recommendations`): User fills out a 6-question lifestyle form (own/rent, home type, energy setup, transportation, commute, interests). The backend fetches city-wide solar/audit/weatherization/green-building data, builds a heatmap, and generates an AI action plan. No address or property-specific data is used.

These are currently completely separate — different pages, different edge functions, no shared state.

### Proposed Unified Flow

A single page at `/property-assessment` with a **two-step progressive experience**:

**Step 1 — Property Assessment (address-based)**
- User enters address + property type (same as today)
- Results show: Google Solar roof analysis, nearby permits map, green building comparison, AI assessment
- A prominent CTA appears at the bottom: "Get a Personalized Action Plan" — this transitions to Step 2

**Step 2 — Lifestyle Deep-Dive (optional, builds on Step 1)**
- The lifestyle form appears below or replaces the form area
- Address and property type are pre-filled / carried forward
- The `generate-recommendations` edge function receives the address, property type, AND lifestyle data
- The AI prompt now incorporates the Google Solar data and property-specific context alongside the lifestyle answers
- Results show the heatmap + strategic recommendations, now personalized to both the property AND the person

### Key Considerations

1. **Data continuity**: The property assessment results (Google Solar data, geocoded coordinates, nearby permits, green building stats) need to be passed into Step 2 so the recommendation engine can use them without re-fetching.

2. **Edge function changes**: The `generate-recommendations` function needs to accept optional property data (address, coords, solar insights, property type) and incorporate it into the AI prompt when available. This makes recommendations property-specific rather than generic city-wide.

3. **UX flow**: Users should be able to complete Step 1 only and leave satisfied, or continue to Step 2. The transition should feel natural — not like starting over. A stepper/progress indicator would help.

4. **Rate limiting**: Since the combined flow hits two edge functions, consider whether the rate limits (10/hr for property, 20/hr for recommendations) need adjustment.

5. **Loading states**: Two sequential API calls means potentially long wait times. Show Step 1 results immediately, then a separate loading state for Step 2.

6. **Navigation updates**: Remove the separate `/recommendations` route. Update the homepage cards from 3 modules to 2 (Area Analysis + Property Assessment). Redirect `/recommendations` to `/property-assessment` for any existing links.

7. **SEO**: Merge meta descriptions. Add a redirect from the old URL.

### Implementation Steps

1. **Update the `generate-recommendations` edge function** to accept optional `propertyData` (address, propertyType, solarInsights, coordinates) and weave it into the AI prompt when present.

2. **Refactor `PropertyAssessment.tsx`** into a multi-step page:
   - Step 1: Current address form + results display
   - Step 2: Lifestyle form (shown after Step 1 results, with a CTA button to expand)
   - Step 2 results: Heatmap + personalized recommendations displayed below

3. **Update the homepage** (`Index.tsx`): Change from 3 module cards to 2. Update the "Recommendation Engine" card to describe the combined flow, or merge its description into the Property Assessment card.

4. **Update routing** (`App.tsx`): Add a redirect from `/recommendations` to `/property-assessment`. Remove the standalone Recommendations page import.

5. **Update internal links**: Any references to `/recommendations` across the app (footer, data sources page, etc.) should point to `/property-assessment`.

### Technical Details

- **State management**: Store Step 1 results in component state; pass relevant fields (`solarInsights`, `center`, `address`, `propertyType`, `dataPoints`) to the `generate-recommendations` call body.
- **Edge function signature change**: `{ lifestyleData, propertyData? }` where `propertyData` includes address, propertyType, solarInsights summary, and green building context.
- **Backward compatibility**: The lifestyle-only flow still works if `propertyData` is absent (defensive coding in the edge function).
- Files affected: `PropertyAssessment.tsx`, `Recommendations.tsx` (delete or redirect), `Index.tsx`, `App.tsx`, `generate-recommendations/index.ts`, `Footer.tsx`, and any page linking to `/recommendations`.

