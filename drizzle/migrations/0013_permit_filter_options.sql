create or replace function public.permit_filter_options()
returns table(filter_kind text, option_value text)
language sql
stable
security invoker
set search_path = public
as $$
  select 'permit_class'::text, v.permit_class
  from public.solar_installations_view v
  where v.permit_class is not null
  group by v.permit_class
  union all
  select 'status'::text, v.status_current
  from public.solar_installations_view v
  where v.status_current is not null
  group by v.status_current
  order by 1, 2;
$$;

grant execute on function public.permit_filter_options() to anon, authenticated;
grant all on function public.permit_filter_options() to service_role;