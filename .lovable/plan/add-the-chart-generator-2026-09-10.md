# Add the AI Chart Generator

Port `switchdev00/s_austin_app` ("Solar Austin Chart Generator") into Austin Clean Energy
as a public tool at `/chart-studio`.

## What the source app does

A single-screen tool. Left pane: type a prompt (or attach a CSV / JSON / TXT data file
or a screenshot of a chart). An LLM returns a complete Chart.js v4 config as raw JSON.
Right pane: the chart renders live. Follow-up plain-English instructions refine it
("make it a bar chart", "use blue tones", "log scale on Y"). A Download button exports a
2400x1350 PNG for social media or reports.

Source stack: Next.js 16 App Router, React 19, Tailwind v4, `chart.js` + `react-chartjs-2`,
`@anthropic-ai/sdk` / `openai`, `lucide-react`. Two API routes do all server work.

## What will be built

- One Supabase edge function `chart-generator` replacing both Next API routes, calling the
  Lovable AI gateway (`LOVABLE_API_KEY`, already configured for 6 existing functions) instead
  of the Anthropic/OpenAI SDKs.
- A `src/components/chart-generator/` folder holding the ported UI (composer, chart pane,
  split pane, PNG export helper), restyled onto Austin Clean Energy's shadcn token system.
- A thin `/chart-studio` page wrapper with `useSeo`, rendered inside the standard
  `PublicLayout` (Footer + ShareWidget), reached from the existing router.
- Route + sitemap registration (`src/App.tsx`, `src/pages/Sitemap.tsx`, `public/sitemap.xml`).
- Two new client deps: `chart.js@^4`, `react-chartjs-2@^5`.

Chart-generation logic, prompts, refine loop, font-floor export rules, and all interaction
behavior stay unchanged. Only the server transport, the styling tokens, and the routing/SEO
shell are adapted.

## File mapping

| Source | Destination | Change |
|---|---|---|
| `app/api/data/generate/route.ts` + `app/api/data/tweak/route.ts` | `supabase/functions/chart-generator/index.ts` | Merge into one Deno function, `action: "generate" \| "tweak"` |
| `lib/llm.ts` | folded into the edge function | Replace 3 SDK adapters with one `fetch` to `https://ai.gateway.lovable.dev/v1/chat/completions` |
| `lib/chartgen.ts` | inline in the edge function | Keep `CHARTJS_SYSTEM`, `CHARTJS_TWEAK_SYSTEM`, `extractJson`, `validateChartJs`, file->message-part logic verbatim |
| `lib/chartExport.ts` | `src/components/chart-generator/chart-export.ts` | Verbatim; framework-agnostic, browser-only, depends only on `chart.js` |
| `components/data/DataComposer.tsx` | `src/components/chart-generator/ChartGenerator.tsx` | Swap `fetch(FormData)` for `supabase.functions.invoke` with a base64 JSON body; token restyle |
| `components/data/ComposerPane.tsx` | `src/components/chart-generator/ComposerPane.tsx` | Token restyle; swap example prompts to Austin Clean Energy topics; reuse `@/components/ui/button` |
| `components/data/ChartPane.tsx` | `src/components/chart-generator/ChartPane.tsx` | Token restyle; keep `customCanvasBackgroundColor` plugin + download logic as-is |
| `components/workspace/SplitPane.tsx` | `src/components/chart-generator/SplitPane.tsx` | Verbatim (works on React 18); rename storage key to `austin-clean-energy:chart-split` |
| `components/ui/Button.tsx` | dropped | Use existing `@/components/ui/button` |
| `components/site/Nav.tsx`, `app/layout.tsx`, `app/page.tsx` | dropped | `PageHeader` + `PublicLayout` + `useSeo` replace them |
| `app/globals.css` | not copied | Its tokens are mapped, not imported (see below) |
| n/a | `src/pages/ChartStudio.tsx` | New 12-line wrapper, mirrors `src/pages/LoadEstimator.tsx` |

## Edge function `chart-generator`

- `POST` JSON: `{ action, prompt?, instruction?, currentSpec?, file?: { name, mimeType, base64 } }`.
- Standard `corsHeaders` + `OPTIONS` short-circuit, matching the other functions.
- Per-IP rate limit (in-memory `Map`, 20/hour), copied from `generate-recommendations`.
- Build gateway messages:
  - system = `CHARTJS_SYSTEM` for generate, `CHARTJS_TWEAK_SYSTEM` for tweak.
  - user content array: for `tweak`, prepend `Existing Chart.js config:\n<pretty JSON>`.
    Image files -> `{ type: "image_url", image_url: { url: "data:<mime>;base64,..." } }`.
    Text files (CSV/JSON/TXT) -> inline first 8000 chars as text. Then the prompt/instruction.
- Call gateway with `model: "google/gemini-2.5-flash"`, `temperature: 0.3`, `max_tokens: 2500`.
  Gemini 2.5 Flash is vision-capable and handles the JSON-only contract; the source default was
  `claude-haiku-4-5`, so budget a prompt-tuning pass and consider `google/gemini-2.5-pro` if
  spec quality regresses.
- Parse: `extractJson` -> `JSON.parse` -> `validateChartJs` (must have `type` + `data`).
- Always respond HTTP 200 with `{ spec }` or `{ error: string }` so the client stays simple
  (`supabase.functions.invoke` only surfaces the body cleanly on 2xx). Map gateway 429/402 to
  a friendly "high demand / out of credits" message.
- Register in `supabase/config.toml`: `[functions.chart-generator]` with `verify_jwt = false`.
- No new secret. `LOVABLE_API_KEY` is already set in the Supabase project.

## Client data flow

`ChartGenerator.tsx` keeps its `spec` / `history` / loading state machine. Only the two
network calls change:

```
const filePayload = file
  ? { name: file.name, mimeType: file.type, base64: await toBase64(file) }
  : undefined;
const { data, error } = await supabase.functions.invoke("chart-generator", {
  body: { action: "generate", prompt, file: filePayload },   // or action: "tweak", instruction, currentSpec
});
const err = error?.message ?? (data as any)?.error;
```

Keep the source 4 MB attachment cap (base64 inflates ~1.35x; still under the parse-bill
precedent). Accept `image/png,image/jpeg,image/gif,image/webp,text/csv,application/json,text/plain`.

## Styling: token map (source Tailwind v4 -> target shadcn v3)

The source "accent" is the brand green, which is Austin Clean Energy's `primary`, not its
`accent` (gold). Map deliberately:

| Source | Target |
|---|---|
| `bg-bg`, `bg-background` | `bg-background` |
| `bg-elevated`, `.surface` | `bg-card` (+ `border border-border shadow-sm`) |
| `bg-subtle` | `bg-muted` |
| `text-text` | `text-foreground` |
| `text-muted` | `text-muted-foreground` |
| `text-faint` | `text-muted-foreground/70` |
| `border-line` | `border-border` |
| `border-line-strong` | `border-input` |
| `text-accent`, `bg-accent`, Button `variant="accent"` | `text-primary`, `bg-primary`, `<Button>` default |
| `bg-accent-glow` | `bg-primary/15` |
| `bg-accent-muted`, `border-accent-muted` | `bg-primary/20`, `border-primary/30` |
| `pt-(--nav-h)` | delete (PageHeader owns top spacing) |
| `max-w-336` | `max-w-7xl` |
| `lg:basis-(--split)` | `lg:basis-[var(--split)]` |
| `z-200` | `z-[200]` |
| `.grain` overlay, skip-link | drop (PublicLayout handles chrome) |

Doing the swap through shadcn tokens gives working light + dark mode for free (source was
dark-only). The `#f07178` hard-coded error red becomes `text-destructive` /
`border-destructive/30` / `bg-destructive/10`.

## Wiring

- `src/App.tsx`: `import ChartStudio from "./pages/ChartStudio";` and
  `<Route path="/chart-studio" element={<ChartStudio />} />` inside the `PublicLayout` block.
- `src/pages/ChartStudio.tsx`: `useSeo({ title: "Austin Energy Chart Generator", description: "..." })`,
  render `<PageHeader title="Chart Generator" subtitle="..." />` then `<ChartGeneratorView />`.
- `src/pages/Sitemap.tsx`: add `{ path: "/chart-studio", title: "Chart Generator" }`.
- `public/sitemap.xml`: add a `<url>` entry.
- `package.json`: add `chart.js` `^4.5.1`, `react-chartjs-2` `^5.3.1`.
- Example prompts -> Austin Clean Energy topics (solar installs by year, generation mix,
  EV adoption by zip, load growth by sector, weatherization uptake).

## Verification

- `npx tsc --noEmit` clean (loose config will not catch bad JSX props, so eyeball the new
  call sites).
- Live page at desktop and mobile widths: generate from a prompt, refine twice, download PNG,
  upload a CSV, upload a chart screenshot, hit an error path (empty key / rate limit).
- Confirm split-pane drag + keyboard resize and the mobile Compose/Chart tab switch.
- Confirm dark mode renders (source assumed dark; verify the token swap holds in light).

## Decisions / risks

- **New dep, ~200 KB**: `chart.js` + `react-chartjs-2`. The repo standardizes on `recharts`,
  but the LLM prompt contract and the export pipeline are Chart.js-specific; re-targeting
  recharts is a rewrite, not a port. Accept Chart.js for this tool.
- **Model swap**: Claude Haiku -> Gemini 2.5 Flash via the gateway. Keeps us on the existing
  key and billing path; costs a prompt-tuning pass.
- **base64 over multipart**: `supabase.functions.invoke` is JSON-first. A 4 MB image becomes a
  ~5.4 MB request; within precedent (`parse-bill` caps at 5 MB). Lower the cap to 3 MB if
  edge payload limits bite.
- **Public + paid LLM**: the route is unauthenticated and every call spends gateway credits,
  so the per-IP rate limit is required, not optional.
