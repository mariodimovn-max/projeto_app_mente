-- Story 4.3: marcos pessoais definidos pelo usuário (FR-7) — um objetivo de
-- autoconhecimento em texto livre (`title`) associado a uma palavra-chave curta (`theme`)
-- usada para casar com as chaves já normalizadas (trim + lowercase, ver
-- lib/patterns/userPatterns.ts) do agregado `user_patterns.themes` (AC2). Uma linha por
-- marco; um usuário pode ter vários. Progresso não é persistido aqui — é sempre derivado
-- na leitura a partir do agregado mais recente (ver lib/milestones/milestones.ts).
create table if not exists public.personal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  theme text not null check (char_length(trim(theme)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_personal_milestones_user_id on public.personal_milestones(user_id);

alter table public.personal_milestones enable row level security;

create policy "personal_milestones_select_own" on public.personal_milestones
  for select using (auth.uid() = user_id);

create policy "personal_milestones_insert_own" on public.personal_milestones
  for insert with check (auth.uid() = user_id);

create policy "personal_milestones_update_own" on public.personal_milestones
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "personal_milestones_delete_own" on public.personal_milestones
  for delete using (auth.uid() = user_id);
