alter table public.plans
  add column if not exists trial_days integer not null default 14;

update public.plans
set trial_days = 14
where trial_days is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'plans_trial_days_check'
  ) then
    alter table public.plans
      add constraint plans_trial_days_check
      check (trial_days >= 0);
  end if;
end $$;
