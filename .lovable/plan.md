## Goal
Add a gated "Join the Community" page. Visitors submit a short form; on success, the Slack invite link is revealed. Admins can review submissions and export them as CSV.

## New public page: `/join-the-community`
- Route added to `src/App.tsx` inside `PublicLayout` (so global footer applies).
- New file `src/pages/JoinCommunity.tsx`:
  - SEO via `useSeo` (title "Join the Austin Clean Energy Community", meta description, canonical).
  - Intro: who we are, what the Slack community is for, why we ask for info first.
  - Form (zod validated):
    - Name (required, ≤100)
    - Email (required, valid, ≤255)
    - Involvement area — single-select `Select` dropdown:
      1. Outreach & community building
      2. Data validation
      3. Technical work
      4. Engineering / volunteering at events
    - "Tell us more about your skills or interest" — `Textarea` (optional, ≤2000)
    - Honeypot hidden field for bot deterrence.
  - On submit → insert into `volunteer_signups` → success state reveals Slack invite as a primary button:
    `https://join.slack.com/t/solaraustingroup/shared_invite/zt-40tsu7gxh-8exWmLou1xHM2l3NmfM9hQ`
  - Success state also includes a copy-link button and short "what to expect in Slack" note.

## Database (migration)
New table `public.volunteer_signups`:
- Columns: `id uuid pk`, `name text`, `email text`, `involvement_area text` with `CHECK` constraint limiting to the 4 values, `notes text`, `user_agent text`, `created_at timestamptz`.
- RLS enabled.
- Grants: `INSERT` to `anon` + `authenticated`; `ALL` to `service_role`. No SELECT for anon/authenticated — admin reads go through an edge function using the service role.
- Policy: `INSERT` allowed for anon + authenticated. No SELECT policy (locked down).

## Footer
- `src/components/Footer.tsx`: add "Join the Community" link → `/join-the-community`.

## Sitemap
- Add `/join-the-community` to `public/sitemap.xml` and `src/pages/Sitemap.tsx` (manual sitemap policy).

## Admin: review + CSV export
- New edge function `supabase/functions/manage-volunteer-signups/index.ts`:
  - Requires `x-admin-token` (matches existing admin pattern; validates against `ADMIN_CORRECTIONS_PASSWORD`).
  - Uses service role to read `volunteer_signups`.
  - Actions:
    - `GET ?action=list` → JSON list of all signups (most recent first).
    - `GET ?action=export` → CSV file (`Content-Type: text/csv`, `Content-Disposition: attachment; filename=volunteer-signups.csv`), columns: `created_at, name, email, involvement_area, notes`.
  - Returns CORS headers; sanitized error messages.
- New admin page `src/pages/AdminVolunteerSignups.tsx`:
  - Route `/admin/volunteer-signups` in `src/App.tsx` (outside PublicLayout, like other admin pages).
  - Reuses the same admin token pattern (sessionStorage `admin_token`) as `AdminCorrections`.
  - Shows table: Date, Name, Email, Involvement Area, Notes (truncated with expand).
  - "Download CSV" button calls the edge function `?action=export` with the admin token and triggers a browser download.
  - Back button → `/admin/dashboard` (per admin nav convention).
- `src/pages/AdminDashboard.tsx`: add a card/link "Volunteer Signups" → `/admin/volunteer-signups`.

## Technical notes
- Reuse shadcn primitives: `Card`, `Input`, `Textarea`, `Select`, `Button`, `Table`.
- Public form insert uses anon key + INSERT-only RLS policy — safe.
- Admin read/export goes through service-role edge function gated by `x-admin-token`, matching project security conventions.
- Slack invite URL is a constant in `JoinCommunity.tsx` for easy future updates.

## Out of scope (can add later)
- Email auto-reply or Slack notification on new signup.
- CAPTCHA beyond honeypot.
- Per-row delete/edit in the admin view.