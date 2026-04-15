create table if not exists public.plan_region_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null,
  region text not null,
  currency text not null,
  price numeric(10,2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, region, currency)
);

create index if not exists idx_plan_region_prices_plan_id
  on public.plan_region_prices(plan_id);

alter table public.plan_region_prices enable row level security;

drop policy if exists "plan_region_prices_select_auth" on public.plan_region_prices;
create policy "plan_region_prices_select_auth"
  on public.plan_region_prices
  for select
  to authenticated
  using (true);

drop policy if exists "plan_region_prices_insert_auth" on public.plan_region_prices;
create policy "plan_region_prices_insert_auth"
  on public.plan_region_prices
  for insert
  to authenticated
  with check (true);

drop policy if exists "plan_region_prices_update_auth" on public.plan_region_prices;
create policy "plan_region_prices_update_auth"
  on public.plan_region_prices
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "plan_region_prices_delete_auth" on public.plan_region_prices;
create policy "plan_region_prices_delete_auth"
  on public.plan_region_prices
  for delete
  to authenticated
  using (true);
