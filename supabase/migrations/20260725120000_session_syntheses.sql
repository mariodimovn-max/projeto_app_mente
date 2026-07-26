create table if not exists public.session_syntheses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  themes text[] not null default '{}',
  explored text not null check (char_length(explored) > 0),
  patterns text not null check (char_length(patterns) > 0),
  open_question text not null check (char_length(open_question) > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_session_syntheses_session_id on public.session_syntheses(session_id);

alter table public.session_syntheses enable row level security;

create policy "session_syntheses_select_own" on public.session_syntheses
  for select using (
    exists (
      select 1 from public.sessions
      where sessions.id = session_syntheses.session_id
        and sessions.user_id = auth.uid()
    )
  );

create policy "session_syntheses_insert_own" on public.session_syntheses
  for insert with check (
    exists (
      select 1 from public.sessions
      where sessions.id = session_syntheses.session_id
        and sessions.user_id = auth.uid()
    )
  );
