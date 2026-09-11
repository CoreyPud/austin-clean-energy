-- Stored submissions from the "Want help navigating your solar options?" contact form.
create table if not exists public.solar_help_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  source_page text,
  user_agent text,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.solar_help_requests to authenticated;
grant all on public.solar_help_requests to service_role;

alter table public.solar_help_requests enable row level security;

-- Reads and writes go through the service-role edge functions
-- (submit-solar-help-request, manage-solar-help-requests), so no anon/authenticated policies.

create index if not exists solar_help_requests_created_at_idx
  on public.solar_help_requests (created_at desc);
