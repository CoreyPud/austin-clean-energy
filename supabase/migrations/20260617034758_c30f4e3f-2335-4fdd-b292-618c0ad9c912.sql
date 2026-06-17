
create table public.power_plants (
  plantid            integer primary key,
  plant_name         text,
  fuel               text,
  capacity_mw        numeric,
  latitude           numeric,
  longitude          numeric,
  county             text,
  owner              text,
  commission_period  text,
  retirement_year    integer,
  avg_output_mw      numeric,
  co2_tons           numeric,
  ae_pct             numeric
);
grant select on public.power_plants to anon, authenticated;
grant all on public.power_plants to service_role;
alter table public.power_plants enable row level security;
create policy "public read" on public.power_plants for select using (true);

create table public.plant_monthly_gen (
  plantid  integer references public.power_plants(plantid) on delete cascade,
  period   text,
  avg_mw   numeric,
  primary key (plantid, period)
);
grant select on public.plant_monthly_gen to anon, authenticated;
grant all on public.plant_monthly_gen to service_role;
alter table public.plant_monthly_gen enable row level security;
create policy "public read" on public.plant_monthly_gen for select using (true);

create index plant_monthly_gen_plantid_idx on public.plant_monthly_gen(plantid);
