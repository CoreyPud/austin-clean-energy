## Goal

Make `/property-assessment` results **scan-friendly, visually playful, and easy to digest** — instead of dense text and uniform stat grids, the page should feel like a personal energy dashboard with visual storytelling.

## What's text-heavy today

1. **Personalized plan** renders as long markdown paragraphs (the screenshot you shared).
2. **Solar Potential / Savings / Neighborhood** cards all use the same 4-column stat grid — no visual hierarchy, no hero metric.
3. **Recommendations** are dense bullet lists.
4. No visual indicators (gauges, progress bars, badges with personality) and no illustrations / emoji glyphs.

## The redesign

### 1. Hero Score Card (new — replaces the plain header summary)

A bold, large card at the top of results with:
- A circular **"Clean Energy Score"** gauge (0–100), composed deterministically from solar viability + neighborhood adoption + savings payback. SVG ring with animated fill.
- One-line headline: "Your home has **strong** clean energy potential."
- Three pill stats inline: Solar viability (sun emoji + score/10), Neighborhood adoption (home emoji + N installs), Estimated payback (clock emoji + N yrs).
- Subtle gradient background tied to the score (high = primary/green glow, medium = amber, low = neutral).

### 2. Solar Potential Card — visual upgrade

- Large hero number: **"X panels"** with sun icon, big and centered.
- Below it: a horizontal **roof-coverage progress bar** showing "Used roof area / Total roof area".
- A small annotated row of icon-stats (sunshine hours, CO₂ offset) — but smaller, secondary.
- Add a subtle animated sun-ray SVG decoration in the corner.

### 3. Savings Card — make it pop

- One huge hero number: **annual savings $** in display font, with a tiny up-arrow trend icon.
- A horizontal **payback timeline bar** (0 → 25 years) showing the payback marker visually with a flag, then "pure profit" zone shaded.
- Three secondary chips: Net cost, 25-yr savings, Production. Smaller than today.
- Confetti-style accent (small coin/leaf icons sprinkled in the corner).

### 4. Neighborhood Snapshot — give it a story

- Lead with a comparison sentence: **"You'd join 47 neighbors in 78703"** (big, friendly).
- A horizontal **adoption bar** comparing user's ZIP vs. Austin average (sourced from existing aggregate data, or a sensible default).
- 3 mini-stats (pending permits, avg system size, newest install) as small icon chips below.

### 5. Council Member Card — keep but humanize

- Add a circular avatar placeholder with the member's initials in a colored ring.
- Move priorities into a small "🎯 Currently focused on" bullet list (max 3 chips) instead of a paragraph.

### 6. Recommendation Cards — dense → playful

- Add a colored left border per impact tier (high = primary, medium = secondary, low = muted).
- Replace the icon-in-square with a larger circular tinted icon.
- Show only the **first 2 bullets** by default; "Show details" expands the rest.
- Add a small "⏱️ ~X hours to act" or "💰 ~$X cost" meta chip pulled from the card data when available.

### 7. Personalized Plan — structured, not a wall of text

Currently the AI returns markdown like "**Your Top 3 Moves** / 1. ... / 2. ...". Parse this into a **visual layout**:
- "Top 3 Moves" rendered as 3 numbered cards in a horizontal grid (each with rank circle 1/2/3, title, sentence).
- "This Month" → green-tinted checklist card with checkbox-style bullets.
- "This Year" → blue-tinted timeline card with bullets.
- Falls back to plain ReactMarkdown if parsing fails (no breakage).

### 8. Section dividers + section emoji headers

- Each section gets a friendly emoji-led mini-header: "☀️ Your Roof", "💰 The Money", "🏘️ Your Block", "🏛️ Your Rep", "✅ Smart Next Moves".
- Thin gradient horizontal rule between sections so the page breathes.

### 9. Animated counters

- All hero numbers (score, $ savings, panel count) use a count-up animation on first reveal (~600ms), so the page feels alive.

## Visual diagram

```text
┌──────────────────────────────────────────────────┐
│ HERO: ⚡ Clean Energy Score 84/100  [gauge ring] │
│ "Strong potential" • ☀️9/10 • 🏘️47 • ⏰9yr      │
└──────────────────────────────────────────────────┘
☀️ Your Roof ───────────────────────────────────
┌──────────────────────────────────────────────────┐
│        202 panels   [sun decoration]             │
│  ▓▓▓▓▓▓▓▓▓░░░ 80% of usable roof                 │
│  2,847h sun • 12,400 kg CO₂/yr                   │
└──────────────────────────────────────────────────┘
💰 The Money ───────────────────────────────────
┌──────────────────────────────────────────────────┐
│  $2,800 / yr  ↗                                  │
│  0 ────🏁9yr────────── pure profit ────── 25yr   │
│  [Net cost $37k] [25yr +$45k] [11,200 kWh/yr]    │
└──────────────────────────────────────────────────┘
🏘️ Your Block ──────────────────────────────────
┌──────────────────────────────────────────────────┐
│  Join 47 neighbors in 78703                      │
│  78703  ▓▓▓▓▓▓░░░░ above Austin avg              │
│  [12 pending] [6.2 kW avg] [Mar 2026 newest]     │
└──────────────────────────────────────────────────┘
🏛️ Your Rep ────────  ✅ Smart Next Moves ──────
[avatar card]         [recommendation cards grid]

[CTA: Get personalized plan ↓]
... lifestyle form / personalized plan as structured cards ...

[Bottom: AI / data disclaimer]
```

## Files I'll change

- `src/pages/PropertyAssessment.tsx` — section emoji headers, dividers, hero score card, render personalized plan via new structured component.
- `src/components/assessment/SolarPotentialCard.tsx` — hero panel count + roof progress bar.
- `src/components/assessment/SavingsCards.tsx` — hero $ + payback timeline bar.
- `src/components/assessment/NeighborhoodSnapshot.tsx` — comparison sentence + adoption bar.
- `src/components/assessment/CouncilMemberCard.tsx` — avatar + priority chips.
- `src/components/assessment/RecommendationCards.tsx` — collapsible details, impact left border, larger icons.
- **New:** `src/components/assessment/CleanEnergyScoreCard.tsx` (hero + gauge + score logic).
- **New:** `src/components/assessment/PersonalizedPlanDisplay.tsx` (parses markdown plan into Top 3 / This Month / This Year cards, with Markdown fallback).
- **New:** `src/components/assessment/SectionHeading.tsx` (emoji + title + thin gradient rule).
- **New:** `src/hooks/useCountUp.ts` (lightweight count-up animation hook, no new deps).

## Technical notes

- Score formula (deterministic, computed client-side from existing data): `solarViability*40 + min(neighbors/50,1)*30 + (paybackYears<=10 ? 30 : paybackYears<=15 ? 20 : 10)`. Capped 0–100.
- Gauge: pure SVG `<circle>` with `strokeDasharray` — no chart library needed.
- Count-up: simple `requestAnimationFrame` hook, respects `prefers-reduced-motion`.
- All colors via existing semantic tokens (`primary`, `secondary`, `accent`, `muted`) — no new tokens.
- Plan parser: regex-splits on `**Your Top 3 Moves**`, `**This Month**`, `**This Year**` headings; if any section is missing, falls back to current ReactMarkdown render.
- No new npm dependencies.
- No backend / edge-function changes — the personalized-plan prompt already produces the structure we need.

## Out of scope

- Changing the AI prompt itself (the existing structure works for the new parser).
- Adding new data sources / API calls.
- Print-stylesheet polish (existing print button still works).
