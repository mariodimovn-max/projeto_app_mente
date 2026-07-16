create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on public.sessions(user_id);

alter table public.sessions enable row level security;

create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_session_id on public.messages(session_id);

alter table public.messages enable row level security;

create policy "messages_select_own" on public.messages
  for select using (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
  );

create policy "messages_insert_own" on public.messages
  for insert with check (
    exists (
      select 1 from public.sessions
      where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
  );
