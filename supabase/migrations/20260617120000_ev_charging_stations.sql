
create table public.ev_charging_stations (
  id                  bigint primary key,
  station_name        text not null,
  latitude            numeric(9,6) not null,
  longitude           numeric(9,6) not null,
  ev_network          text,
  ev_level1_evse_num  integer not null default 0,
  ev_level2_evse_num  integer not null default 0,
  ev_dc_fast_num      integer not null default 0,
  open_date           date,
  open_year           integer generated always as (extract(year from open_date)::integer) stored,
  access_code         text,
  street_address      text,
  city                text,
  state               text,
  zip                 text,
  status_code         text default 'E',
  synced_at           timestamptz default now()
);

grant select on public.ev_charging_stations to anon, authenticated;
grant all    on public.ev_charging_stations to service_role;

alter table public.ev_charging_stations enable row level security;
create policy "public read" on public.ev_charging_stations for select using (true);

create index ev_stations_open_year_idx  on public.ev_charging_stations (open_year);
create index ev_stations_network_idx    on public.ev_charging_stations (ev_network);
