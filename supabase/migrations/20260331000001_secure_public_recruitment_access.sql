create extension if not exists pgcrypto;

alter table if exists public.recruitment_applicants
add column if not exists public_access_token uuid default gen_random_uuid();

update public.recruitment_applicants
set public_access_token = gen_random_uuid()
where public_access_token is null;

alter table if exists public.recruitment_applicants
alter column public_access_token set default gen_random_uuid();

create unique index if not exists recruitment_applicants_public_access_token_idx
on public.recruitment_applicants (public_access_token);

create or replace function public.get_public_recruitment_context(p_access_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  applicant_row public.recruitment_applicants%rowtype;
  job_row public.recruitment_jobs%rowtype;
begin
  select *
  into applicant_row
  from public.recruitment_applicants
  where public_access_token = p_access_token;

  if not found then
    return null;
  end if;

  select *
  into job_row
  from public.recruitment_jobs
  where id = applicant_row.job_id;

  return jsonb_build_object(
    'applicant', to_jsonb(applicant_row),
    'job', to_jsonb(job_row)
  );
end;
$$;

create or replace function public.complete_public_ai_interview(
  p_access_token uuid,
  p_score integer,
  p_answers jsonb,
  p_notes text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.recruitment_applicants
  set
    score = p_score,
    answers = p_answers,
    notes = p_notes
  where public_access_token = p_access_token;

  return found;
end;
$$;

grant execute on function public.get_public_recruitment_context(uuid) to anon, authenticated;
grant execute on function public.complete_public_ai_interview(uuid, integer, jsonb, text) to anon, authenticated;
