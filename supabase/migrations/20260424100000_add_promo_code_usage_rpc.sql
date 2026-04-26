-- Safely increment promo code usage from client calls without exposing broad table updates.
-- This function runs with definer privileges and applies guardrails:
-- - code must be active
-- - not expired
-- - usage limit not exceeded

create or replace function public.increment_promo_code_usage(
  p_code text default null,
  p_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_updated_id uuid;
begin
  if p_id is null and (p_code is null or btrim(p_code) = '') then
    return false;
  end if;

  v_code := nullif(btrim(p_code), '');

  update public.promo_codes
     set times_used = coalesce(times_used, 0) + 1,
         updated_at = now()
   where (
          (p_id is not null and id = p_id)
          or
          (p_id is null and v_code is not null and lower(code) = lower(v_code))
        )
     and coalesce(is_active, true) = true
     and (expires_at is null or expires_at > now())
     and (
          max_uses is null
          or coalesce(times_used, 0) < max_uses
        )
  returning id into v_updated_id;

  return v_updated_id is not null;
end;
$$;

revoke all on function public.increment_promo_code_usage(text, uuid) from public;
grant execute on function public.increment_promo_code_usage(text, uuid) to authenticated;
grant execute on function public.increment_promo_code_usage(text, uuid) to service_role;

