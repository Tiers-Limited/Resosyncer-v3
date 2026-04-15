alter table public.plan_region_prices
  add column if not exists billing_cycle text not null default 'monthly',
  add column if not exists stripe_price_id text;

update public.plan_region_prices
set region = 'EUROPE'
where upper(region) = 'EU';

update public.plan_region_prices
set region = 'GLOBAL'
where upper(region) in ('US', 'WORLD');

update public.plan_region_prices
set billing_cycle = 'monthly'
where billing_cycle is null or billing_cycle = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'plan_region_prices_region_check'
  ) then
    alter table public.plan_region_prices
      add constraint plan_region_prices_region_check
      check (region in ('EUROPE', 'GLOBAL'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'plan_region_prices_billing_cycle_check'
  ) then
    alter table public.plan_region_prices
      add constraint plan_region_prices_billing_cycle_check
      check (billing_cycle in ('monthly', 'yearly'));
  end if;
end $$;

delete from public.plan_region_prices p
using public.plan_region_prices d
where p.id > d.id
  and p.plan_id = d.plan_id
  and p.billing_cycle = d.billing_cycle
  and p.region = d.region;

alter table public.plan_region_prices
  drop constraint if exists plan_region_prices_plan_id_region_currency_key;

create unique index if not exists uq_plan_region_prices_plan_cycle_region
  on public.plan_region_prices(plan_id, billing_cycle, region);
