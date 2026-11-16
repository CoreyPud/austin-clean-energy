create or replace view public.permit_filter_options_view
with (security_invoker = true)
as
  select 'permit_class'::text as filter_kind, v.permit_class as option_value
  from public.solar_installations_view v
  where v.permit_class is not null
  group by v.permit_class
  union all
  select 'status'::text as filter_kind, v.status_current as option_value
  from public.solar_installations_view v
  where v.status_current is not null
  group by v.status_current
  order by 1, 2;

grant select on public.permit_filter_options_view to anon, authenticated;
grant all on public.permit_filter_options_view to service_role;