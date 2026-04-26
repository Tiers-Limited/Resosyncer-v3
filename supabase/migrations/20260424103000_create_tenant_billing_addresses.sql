create table if not exists public.tenant_billing_addresses (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  line1 text not null,
  line2 text null,
  city text not null,
  state text null,
  postal_code text null,
  country text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_billing_addresses enable row level security;

drop policy if exists "tenant_billing_addresses_select_own" on public.tenant_billing_addresses;
create policy "tenant_billing_addresses_select_own"
  on public.tenant_billing_addresses
  for select
  to authenticated
  using (
    tenant_id in (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

drop policy if exists "tenant_billing_addresses_insert_admin" on public.tenant_billing_addresses;
create policy "tenant_billing_addresses_insert_admin"
  on public.tenant_billing_addresses
  for insert
  to authenticated
  with check (
    tenant_id in (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "tenant_billing_addresses_update_admin" on public.tenant_billing_addresses;
create policy "tenant_billing_addresses_update_admin"
  on public.tenant_billing_addresses
  for update
  to authenticated
  using (
    tenant_id in (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'superadmin')
    )
  )
  with check (
    tenant_id in (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'superadmin')
    )
  );

