alter table public.plans
  add column if not exists contact_for_pricing boolean not null default false;
