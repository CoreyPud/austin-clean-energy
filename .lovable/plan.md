# Split Progress and Resources into two pages

## Home page
- Keep **Residential Savings** as the first choice.
- Replace the second choice with **What You Can Do**, linking to `/what-you-can-do`.
- Rename the third choice to **Austin at a Glance**, linking to `/austin-at-a-glance`.
- Keep the address search and campaign popup unchanged.

## Austin at a Glance
- Move the complete current **Austin at a Glance** card collection to its own page at `/austin-at-a-glance`.
- Give the page a focused title, description, and existing public footer.

## What You Can Do
- Move the complete current **What You Can Do** card collection to its own page at `/what-you-can-do`.
- Keep its solar, EV, and personalized-plan tools, plus the existing closing action section.

## Links and compatibility
- Update the visual sitemap and XML sitemap with both new pages.
- Redirect the old `/progress-resources` address to `/austin-at-a-glance` so existing links continue to work.
- Verify all three home choices, both new pages, mobile layout, and browser errors.

## Technical details
- Split the existing `ProgressResources` implementation so each page loads only the charts, data, and cards it uses.
- Add both routes inside the existing public layout and use the current shared page header, cards, footer, and design tokens.
