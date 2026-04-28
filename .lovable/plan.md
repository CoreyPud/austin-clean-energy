# Community Layer — Phase 2 Implementation Plan

Based on your answers, the scope shifts meaningfully:

- **No site-activity counter.** You're right — at current traffic, "3 neighbors this week" hurts more than it helps. We'll lean entirely on real permit momentum, which is always a healthy non-zero number.
- **Share button** lives at the bottom of results, after recommendations.
- **Community card** is inline below results.
- **No new database table needed** for now — all numbers come from existing `solar_installations` data via the authoritative `fiscal-year-stats` pipeline.

This keeps us aligned with the project's data-transparency core rule: every number shown has a real source.

---

## What we're building

### 1. Deep linking on Property Assessment

The `/property-assessment` page currently holds the address in local state only. After someone runs an assessment, the URL stays `/property-assessment` — unshareable.

Change:
- Read `?address=` from the URL on mount. If present, auto-populate the input and auto-run the assessment.
- When the user submits, push the address into the URL via `useSearchParams` (replace, not push, to avoid history spam).
- A recipient who opens a shared link lands directly on the populated results.

Edge cases handled:
- Invalid/malformed `address` param → show the form with the value pre-filled but don't auto-submit; user clicks Generate.
- Loading state while auto-running so the page doesn't flash empty.

### 2. Share button

Placement: at the **end** of the results, after the recommendations section, in its own subtle card ("Help a neighbor explore their options").

Behavior:
- Copies the current URL (which now includes `?address=...`) to clipboard via `navigator.clipboard.writeText`.
- Shows a sonner toast: "Link copied — share it with a neighbor."
- Falls back to a select-all textarea on browsers that block the Clipboard API.
- Optional secondary actions: native `navigator.share` on mobile (iOS/Android share sheet) when available, plus pre-filled mailto/SMS links as fallbacks. All optional, behind feature detection.

### 3. Community Momentum card (inline, below results)

A clean card titled **"Austin's clean energy momentum"** showing 3 real numbers, all derived from existing `solar_installations` data:

- **This week:** *N* new solar projects permitted in Austin
- **This month:** *N* projects · *X* kW capacity added
- **Council District {user's district}:** *N* installations in the past 12 months — *contextualizes their own neighborhood*

Below the numbers: a single line — *"You're not alone. Austin homeowners are going solar every week."* — and a link to `/city-progress` for the full picture.

Data source: a new lightweight edge function `community-momentum` that queries `solar_installations` for:
- count where `issued_date >= now() - 7 days`
- count + sum(installed_kw) where `issued_date >= now() - 30 days`
- count where `council_district = $1` and `issued_date >= now() - 365 days`

Cached via the existing `cached_stats` table pattern with a 1-hour TTL to keep load minimal.

### 4. What we are explicitly NOT building (yet)

- No "neighbors explored" counter — revisit when monthly site traffic clears ~500 unique assessments.
- No supporter wall, no name capture, no user-generated content.
- No heatmap layer (the existing solar map already serves this need).
- No new tables, no PII collection, zero moderation surface.

---

## Technical details

**Files to modify:**
- `src/pages/PropertyAssessment.tsx` — wire up `useSearchParams`, auto-run on mount when `?address=` present, add Share card and Community card to the results section.
- `src/components/ShareAssessmentCard.tsx` *(new)* — share button + copy logic + native share fallback.
- `src/components/CommunityMomentumCard.tsx` *(new)* — fetches and displays the 3 momentum numbers.
- `supabase/functions/community-momentum/index.ts` *(new)* — public edge function (no auth), accepts optional `?district=` query param, returns cached aggregates.
- `src/hooks/useSeo.ts` — when `?address=` is present, append the address to the page title and meta description so shared links preview meaningfully on social cards.

**SEO/share preview:** when address is in URL, set Open Graph `og:title` to *"See clean energy options for {address} — Austin Clean Energy"* so Slack/iMessage/Twitter unfurls show the personalized result, not a generic page.

**Privacy:** addresses in URLs are user-initiated and only persist if the user themselves shares the link. No server-side logging of shared addresses beyond standard edge function logs.

**Caching:** `community-momentum` writes results to `cached_stats` keyed by `momentum_global` and `momentum_district_{N}`, with the existing `updated_at` trigger. TTL check inside the function.

---

## Open question for after approval

Should the auto-run on shared links also re-call the AI recommendation engine (costs a Lovable AI call per shared-link visit), or should we cache the most recent assessment per-address for ~24h to make shared links cheap? My recommendation: **cache for 24h** in a new `cached_assessments` table keyed by normalized address — a shared link viewed by 10 friends should not cost 10 AI calls. I'll include this if you approve.
