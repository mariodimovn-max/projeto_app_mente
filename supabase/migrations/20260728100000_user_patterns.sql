-- Story 3.3: agregado incremental de padrões longitudinais (temas, emoções e gatilhos)
-- por usuário. Uma linha por usuário (chave primária = user_id), atualizada — nunca
-- recriada — ao final de cada sessão, junto à geração da síntese (AC1/AC2). Cada campo
-- é um mapa jsonb `{ rótulo: contagem }`, incrementado por sessão em vez de guardar a
-- lista bruta de sessões — mantém o agregado pequeno e barato de ler no dashboard/prompt
-- (arquitetura: "user_patterns é a única fonte de leitura do dashboard/insights").
create table if not exists public.user_patterns (
  user_id uuid primary key references auth.users(id) on delete cascade,
  themes jsonb not null default '{}'::jsonb,
  emotions jsonb not null default '{}'::jsonb,
  triggers jsonb not null default '{}'::jsonb,
  session_count integer not null default 0 check (session_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_patterns enable row level security;

create policy "user_patterns_select_own" on public.user_patterns
  for select using (auth.uid() = user_id);

create policy "user_patterns_insert_own" on public.user_patterns
  for insert with check (auth.uid() = user_id);

create policy "user_patterns_update_own" on public.user_patterns
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
