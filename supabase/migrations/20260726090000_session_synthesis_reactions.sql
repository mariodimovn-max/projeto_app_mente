-- Story 3.2: reação (emoji ou comentário curto) à síntese de uma sessão.
-- Uma síntese tem no máximo uma reação (índice único em synthesis_id); reagir de novo
-- substitui a reação anterior (upsert) e "desfazer" apaga a linha. Emoji e comentário são
-- mutuamente exclusivos (AC1 fala em "emoji OU comentário") em vez de um registro que
-- acumula os dois — mantém o dado salvo simples de um único par por síntese.
create table if not exists public.session_synthesis_reactions (
  id uuid primary key default gen_random_uuid(),
  synthesis_id uuid not null references public.session_syntheses(id) on delete cascade,
  emoji text check (emoji in ('onda', 'gota', 'bolha', 'broto', 'vela')),
  comment text check (comment is null or (char_length(comment) > 0 and char_length(comment) <= 80)),
  created_at timestamptz not null default now(),
  constraint session_synthesis_reactions_exactly_one check (
    (emoji is not null) <> (comment is not null)
  )
);

create unique index if not exists idx_session_synthesis_reactions_synthesis_id
  on public.session_synthesis_reactions(synthesis_id);

alter table public.session_synthesis_reactions enable row level security;

create policy "session_synthesis_reactions_select_own" on public.session_synthesis_reactions
  for select using (
    exists (
      select 1 from public.session_syntheses
      join public.sessions on sessions.id = session_syntheses.session_id
      where session_syntheses.id = session_synthesis_reactions.synthesis_id
        and sessions.user_id = auth.uid()
    )
  );

create policy "session_synthesis_reactions_insert_own" on public.session_synthesis_reactions
  for insert with check (
    exists (
      select 1 from public.session_syntheses
      join public.sessions on sessions.id = session_syntheses.session_id
      where session_syntheses.id = session_synthesis_reactions.synthesis_id
        and sessions.user_id = auth.uid()
    )
  );

create policy "session_synthesis_reactions_update_own" on public.session_synthesis_reactions
  for update using (
    exists (
      select 1 from public.session_syntheses
      join public.sessions on sessions.id = session_syntheses.session_id
      where session_syntheses.id = session_synthesis_reactions.synthesis_id
        and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.session_syntheses
      join public.sessions on sessions.id = session_syntheses.session_id
      where session_syntheses.id = session_synthesis_reactions.synthesis_id
        and sessions.user_id = auth.uid()
    )
  );

create policy "session_synthesis_reactions_delete_own" on public.session_synthesis_reactions
  for delete using (
    exists (
      select 1 from public.session_syntheses
      join public.sessions on sessions.id = session_syntheses.session_id
      where session_syntheses.id = session_synthesis_reactions.synthesis_id
        and sessions.user_id = auth.uid()
    )
  );
