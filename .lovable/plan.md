# Make the Council Decisions page load fast

The page currently downloads all ~5,200 decisions (about 8 MB) and draws over a thousand entries at once.

## What changes
- Load decisions in pages of 50 from the database, newest first, with a "Load more" button.
- Search, topic, outcome, year and "climate only" filters run in the database, so only matching items download.
- Typing in search waits briefly (debounce) before refetching, so the list doesn't stutter.
- Filter dropdown options (topics, years, counts) come from one small summary query instead of the full dataset.
- Drop the 8 MB file fallback from normal loading (kept only if the database is unreachable, loaded lazily).

## Technical details
- `src/pages/CouncilDecisions.tsx`: replace the unbounded `.range()` loop with a filtered, paginated query on `council_decisions` (`visible = true`, `ilike` on title/description, `eq` on topic/outcome/is_climate, `order meeting_date desc`, `range(offset, offset+49)`), `count: 'exact'` for the result total.
- 300 ms debounce on `q`.
- Optional: add an index on `(is_climate, meeting_date desc)` if queries are slow.
