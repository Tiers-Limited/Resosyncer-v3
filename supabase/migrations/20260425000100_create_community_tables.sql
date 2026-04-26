create extension if not exists pgcrypto;

create table if not exists public.community_questions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  author_name text not null default 'Anonymous',
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.community_questions(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  author_name text not null default 'Anonymous',
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('question', 'answer')),
  target_id uuid not null,
  reaction smallint not null check (reaction in (-1, 1)),
  voter_key text not null check (char_length(trim(voter_key)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_id, voter_key)
);

create index if not exists idx_community_answers_question_id
  on public.community_answers(question_id);

create index if not exists idx_community_reactions_target
  on public.community_reactions(target_type, target_id);

create or replace function public.set_community_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_community_questions_updated_at on public.community_questions;
create trigger trg_community_questions_updated_at
before update on public.community_questions
for each row
execute function public.set_community_updated_at();

drop trigger if exists trg_community_answers_updated_at on public.community_answers;
create trigger trg_community_answers_updated_at
before update on public.community_answers
for each row
execute function public.set_community_updated_at();

drop trigger if exists trg_community_reactions_updated_at on public.community_reactions;
create trigger trg_community_reactions_updated_at
before update on public.community_reactions
for each row
execute function public.set_community_updated_at();

alter table public.community_questions enable row level security;
alter table public.community_answers enable row level security;
alter table public.community_reactions enable row level security;

drop policy if exists "Anyone can read community questions" on public.community_questions;
create policy "Anyone can read community questions"
on public.community_questions
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert community questions" on public.community_questions;
create policy "Anyone can insert community questions"
on public.community_questions
for insert
to anon, authenticated
with check (char_length(trim(title)) > 0 and char_length(trim(body)) > 0);

drop policy if exists "Anyone can read community answers" on public.community_answers;
create policy "Anyone can read community answers"
on public.community_answers
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert community answers" on public.community_answers;
create policy "Anyone can insert community answers"
on public.community_answers
for insert
to anon, authenticated
with check (char_length(trim(body)) > 0);

drop policy if exists "Anyone can read community reactions" on public.community_reactions;
create policy "Anyone can read community reactions"
on public.community_reactions
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can insert reactions" on public.community_reactions;
create policy "Anyone can insert reactions"
on public.community_reactions
for insert
to anon, authenticated
with check (
  reaction in (-1, 1)
  and char_length(trim(voter_key)) > 0
  and target_type in ('question', 'answer')
);

drop policy if exists "Anyone can update reactions" on public.community_reactions;
create policy "Anyone can update reactions"
on public.community_reactions
for update
to anon, authenticated
using (true)
with check (
  reaction in (-1, 1)
  and char_length(trim(voter_key)) > 0
  and target_type in ('question', 'answer')
);

drop policy if exists "Anyone can delete reactions" on public.community_reactions;
create policy "Anyone can delete reactions"
on public.community_reactions
for delete
to anon, authenticated
using (true);
