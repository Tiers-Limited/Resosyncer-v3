alter table public.plans
  add column if not exists stripe_monthly_price_id text,
  add column if not exists stripe_yearly_price_id text;

update public.plans
set stripe_monthly_price_id = coalesce(stripe_monthly_price_id, stripe_price_id)
where stripe_monthly_price_id is null;

create index if not exists idx_plans_stripe_monthly_price_id
  on public.plans(stripe_monthly_price_id);

create index if not exists idx_plans_stripe_yearly_price_id
  on public.plans(stripe_yearly_price_id);
