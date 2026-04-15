-- Allow tenant admins to sync billing status fields after Stripe actions.
-- This prevents client-side status mismatch (e.g., cancelled in Stripe but active in tenants row).

alter table public.tenants enable row level security;

drop policy if exists "Tenant admins can update own tenant billing" on public.tenants;

create policy "Tenant admins can update own tenant billing"
  on public.tenants
  for update
  to authenticated
  using (
    id in (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'superadmin')
    )
  )
  with check (
    id in (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'superadmin')
    )
  );

