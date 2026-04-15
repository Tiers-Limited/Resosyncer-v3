-- Allow cancellation lifecycle statuses on tenants.status
-- Existing installs may reject "cancelled" with tenants_status_check.

alter table public.tenants
  drop constraint if exists tenants_status_check;

alter table public.tenants
  add constraint tenants_status_check
  check (
    status in (
      'active',
      'trial',
      'past_due',
      'suspended',
      'inactive',
      'cancelled',
      'cancel_pending',
      'expired'
    )
  );

