

## Plan: Unified "My Austin Energy Profile" — Full Build (with Council Lookup)

### What changes overall

Today the site has two overlapping address tools (`/area-analysis` for ZIP, `/property-assessment` for address) plus an opt-in lifestyle deep-dive. This plan collapses them into **one card-driven flow at `/property-assessment`** ("My Austin Energy Profile"). One address entry produces a dashboard covering property, neighborhood, savings, local advocacy (with live council-district lookup + admin-editable contact info), and prioritized recommendations. The lifestyle questionnaire stays as an optional "Go Deeper" step.

### Page structure (after address submit)

```text
┌───────────────────────────────────────────────────────────┐
│  Header: 1234 Main St · Austin, TX 78704                  │
│  [ Print/PDF ]  [ Start Over ]                            │
├───────────────────────────────────────────────────────────┤
│  NEIGHBORHOOD SNAPSHOT (4 stat cards)                     │
│   Solar in your ZIP · Permits 90d · Green-rated · Avg ★   │
│                                                           │
│  YOUR ROOF (Google Solar card — existing)                 │
│   Max panels · roof area · sunshine hrs · CO₂ offset      │
│                                                           │
│  POTENTIAL SAVINGS (3 cards)                              │
│   $/yr · payback yrs · 25-yr savings                      │
│                                                           │
│  MAP: your pin + nearby installations                     │
│                                                           │
│  LOCAL ADVOCACY                                           │
│   District N · Council Member · Email · Phone · Office    │
│   Current priorities (from admin-editable .md)            │
│                                                           │
│  TOP RECOMMENDATIONS (3 action cards, not prose)          │
│   icon · headline · expected $ impact · [Take action →]   │
│                                                           │
│  Compact AI summary (3-4 sentences max)                   │
│                                                           │
│  [ Get a personalized lifestyle action plan → ]           │
│   expands to existing LifestyleAssessmentForm + plan      │
└───────────────────────────────────────────────────────────┘
```

### Data sources per section

- **Neighborhood snapshot** — existing `solar_installations` table filtered by geocoded ZIP, plus existing Austin Open Data feeds (audits `tk9p-m8c7`, green buildings `dpvb-c5fy`, weatherization)
- **Your roof / savings** — existing Google Solar API; savings computed deterministically (kWh × $0.13 Austin Energy avg residential rate; payback from `financialAnalyses` when present, else Austin averages from `data-sources.md`)
- **Local advocacy** —
  - **District** via Austin's public ArcGIS `ContactCouncilMember` MapServer (spatial query against geocoded lat/lng); always live
  - **Member contact + priorities** from a new admin-editable markdown file `council-members.md` stored in `knowledge_files`
  - **Always-live fallback link**: `COUNCIL_DISTRICT_PATH` returned by ArcGIS (e.g., `austintexas.gov/department/district-5`) so even stale markdown still routes users to the official page
- **Top recommendations** — deterministic rules engine (no AI). Picks 3 from a fixed library based on solar viability score, current housing/energy setup if Step 2 is done, and neighborhood adoption percentile
- **Compact AI summary** — Lovable AI Gateway (`google/gemini-2.5-flash`), tight prompt: "3-4 sentences max. Do NOT repeat numbers shown in the cards. Focus on the single biggest opportunity for this property and one local-advocacy hook." Matches existing "knowledgeable local advisor" persona memory

### Backend

**New edge function `unified-assessment`** consolidating today's `property-assessment` + `area-analysis` work
- Input: `{ address, propertyType }`
- Geocode → extract lat/lng + ZIP
- Parallel fetch: Google Solar, neighborhood permit counts (DB by ZIP), city-wide audits/weatherization/green building, council district via ArcGIS
- Deterministically compute savings + pick top-3 recommendations
- Single short AI summary call
- Return structured JSON for all cards + summary string

**Council lookup utility (new)** `supabase/functions/_shared/councilLookup.ts`
- `getCouncilDistrict(lat, lng)` — calls ArcGIS, returns `{ district, districtPath }`
- `parseCouncilMembers(markdown)` — parses `council-members.md` into `{ district | "mayor" → { name, email, phone, officePage, priorities } }`

**Admin-editable contact directory (new)** `supabase/functions/_shared/knowledge/council-members.md`
- Seed content for Mayor + Districts 1–10 (name, email, phone, office page, current priorities)
- Loaded the same way as the other knowledge files; structured headings so the parser is reliable but file stays human-editable in the admin UI

```markdown
# Austin City Council Contact Directory
Last Updated: 2026-04-23

## Mayor
**Name:** Kirk Watson
**Email:** mayor@austintexas.gov
**Phone:** 512-978-2100
**Office Page:** https://austintexas.gov/mayor
**Current Priorities:** Climate equity plan implementation, Project Connect

## District 1
**Name:** Natasha Harper-Madison
...
## District 10
...
```

**`generate-recommendations` (kept)** — receives richer property context (savings stats, neighborhood adoption percentile, council district + member) so the optional lifestyle plan can also reference local advocacy hooks

### Knowledge-file plumbing

- **Modified** `supabase/functions/_shared/loadKnowledge.ts` — add `'council-members'` to the loaded set
- **Modified** `supabase/functions/save-knowledge-file/index.ts` — add `'council-members'` to `validNames` so the admin save endpoint accepts it
- **Migration** — insert one row into `knowledge_files` with `name = 'council-members'` and the seed markdown so `/admin/knowledge-base` shows it as a 5th editable file alongside priorities, resources, expert-context, data-sources
- No admin UI code changes needed — the page lists `knowledge_files` rows dynamically

### Frontend

- **`src/pages/PropertyAssessment.tsx`** — major refactor to the card grid above. Replace the long `<ReactMarkdown>` block with discrete `<Card>` components per section. Compact AI summary stays as a small markdown block at the bottom. Keep existing print styles, "Start Over", strict address validation (number + street + Austin keyword), and 32px pulsing target pin
- **`src/pages/Index.tsx`** — collapse "Three Ways to Get Started" → two primary CTAs: City-Wide Progress + **My Austin Energy Profile** (folds in former Area Analysis copy)
- **`src/pages/AreaAnalysis.tsx`** — convert to `<Navigate to="/property-assessment" replace />`
- **`src/App.tsx`** — add `/area-analysis` redirect; keep `/recommendations` redirect
- **`src/pages/DataSources.tsx`** — document new methodology (savings calculation, ArcGIS council lookup, admin-editable contact source)
- **`src/components/Footer.tsx`** — link cleanup
- **New components** under `src/components/assessment/`:
  - `NeighborhoodSnapshot.tsx`
  - `SavingsCards.tsx`
  - `CouncilMemberCard.tsx`
  - `RecommendationCards.tsx`

### What stays the same

- Lovable AI Gateway (`google/gemini-2.5-flash`) for the short summary and the optional lifestyle plan — no new keys
- Lifestyle questionnaire and personalized plan output (now reached via the same page's "Go Deeper" CTA)
- Existing print/PDF, map pin styling, address validation rules, all RLS policies
- Embedded route `/embed/area-analysis` continues to use `area-analysis` edge function for backward compat (flagged for future removal)

### Files affected

**Created**
- `supabase/functions/unified-assessment/index.ts`
- `supabase/functions/_shared/councilLookup.ts`
- `supabase/functions/_shared/knowledge/council-members.md` (seed)
- New migration: insert seed `knowledge_files` row for `council-members`
- `src/components/assessment/NeighborhoodSnapshot.tsx`
- `src/components/assessment/SavingsCards.tsx`
- `src/components/assessment/CouncilMemberCard.tsx`
- `src/components/assessment/RecommendationCards.tsx`

**Modified**
- `src/pages/PropertyAssessment.tsx` (card-grid rebuild, calls `unified-assessment`)
- `src/pages/Index.tsx` (single primary CTA + City Overview)
- `src/pages/AreaAnalysis.tsx` (redirect-only)
- `src/App.tsx` (`/area-analysis` redirect)
- `src/pages/DataSources.tsx` (new methodology section)
- `src/components/Footer.tsx` (link cleanup)
- `supabase/functions/generate-recommendations/index.ts` (accept extended property + council context)
- `supabase/functions/_shared/loadKnowledge.ts` (load `council-members`)
- `supabase/functions/save-knowledge-file/index.ts` (allow `council-members` name)

**Deprecated (kept temporarily)**
- `supabase/functions/area-analysis/index.ts` — still serves `/embed/area-analysis`; flag for future removal

### AI prompt discipline

Summary call is capped at 3-4 sentences and explicitly told not to duplicate stat-card numbers, addressing prior "too text-heavy / instruction language leaking" feedback. Same persona ("knowledgeable local advisor") used in both the summary and the lifestyle plan.

### Why this design

- **One entry point** removes the Area-vs-Property confusion
- **Cards over prose** matches the "less text-heavy, more visual cues" requirement
- **Deterministic savings + recommendations** keeps numbers accurate and consistent
- **Live ArcGIS district lookup** means zero maintenance for boundaries
- **Admin-editable `council-members.md`** lets non-developers refresh names/contacts/priorities through the existing Knowledge Base UI; the ArcGIS `districtPath` is the always-fresh fallback if the markdown drifts after an election

