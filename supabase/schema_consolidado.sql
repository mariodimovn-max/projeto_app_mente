-- Schema consolidado: concatenação das 11 migrations de supabase/migrations/ em ordem cronológica.
-- Gerado em 2026-11-10. Cole inteiro no SQL Editor do Supabase (ou use 'supabase db push', que aplica os arquivos originais).

-- ===================== 20260716195536_chat_schema.sql =====================
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


-- ===================== 20260725120000_session_syntheses.sql =====================
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


-- ===================== 20260725220000_session_syntheses_title_depth_patterns.sql =====================
-- Alinha session_syntheses ao layout real da Story 3.1 ("Aura - Síntese"): adiciona o
-- título poético gerado pela IA e a profundidade da sessão, e transforma "patterns" de
-- frase única em lista (o design mostra padrões como cartões individuais).

alter table public.session_syntheses
  add column if not exists title text not null default '';

alter table public.session_syntheses
  add column if not exists depth integer not null default 0;

alter table public.session_syntheses
  drop constraint if exists session_syntheses_patterns_check;

alter table public.session_syntheses
  alter column patterns type text[] using
    case when patterns is null or char_length(patterns) = 0 then '{}'::text[] else array[patterns] end,
  alter column patterns set default '{}';

alter table public.session_syntheses
  add constraint session_syntheses_patterns_not_empty check (array_length(patterns, 1) > 0);


-- ===================== 20260726090000_session_synthesis_reactions.sql =====================
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


-- ===================== 20260728100000_user_patterns.sql =====================
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


-- ===================== 20260801090000_session_history_actions.sql =====================
-- Story 3.5: ações rápidas da tela de Histórico ("Marcar" e "Excluir", AC3). `sessions`
-- não tinha coluna de update nem policy de update/delete até agora (só select/insert) —
-- adiciona o mínimo necessário para essas duas ações, sem introduzir soft-delete: excluir
-- uma sessão remove a linha de fato, e `on delete cascade` nas FKs de `messages` e
-- `session_syntheses` já cuida de apagar as transcrições e a síntese junto.
alter table public.sessions
  add column if not exists marked boolean not null default false;

create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = user_id);


-- ===================== 20260810120000_personal_milestones.sql =====================
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


-- ===================== 20260810130000_session_syntheses_emotions_triggers.sql =====================
-- Story 4.4: o resumo semanal precisa de "emoções dominantes" com recorte por semana, mas
-- emotions/triggers hoje só existem como agregado vitalício em user_patterns (Story 3.3) —
-- sem granularidade por sessão/data não dá para saber quais emoções apareceram nos últimos
-- 7 dias especificamente. generateSessionSynthesis já calcula emotions/triggers por sessão
-- (lib/agent/synthesis.ts), só não eram persistidos; esta migration só abre espaço para
-- guardar o que já é gerado, sem nenhuma chamada nova à IA.
alter table public.session_syntheses
  add column if not exists emotions text[] not null default '{}';

alter table public.session_syntheses
  add column if not exists triggers text[] not null default '{}';


-- ===================== 20260819100000_audit_log.sql =====================
-- Story 5.1 (AC3): trilha mínima de auditoria para eventos sensíveis — hoje só exportação
-- de dados; login e deleção de conta foram cobertos na Story 5.3 reaproveitando esta mesma
-- tabela (login.ts/deleteAccount.ts também inserem em audit_log — nenhuma migration nova
-- precisou tocar esta tabela só para os inserts em si; a Story 5.3 trouxe uma migration
-- separada, 20260822090000, mas por outro motivo: remover o ON DELETE CASCADE abaixo). RLS
-- permite ao usuário inserir sua própria linha, mas não expõe select/update/delete: o
-- registro de auditoria não é visível nem editável pelo próprio usuário via UI (Story 5.3, AC2).
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (char_length(trim(action)) > 0),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_user_id on public.audit_log(user_id);

alter table public.audit_log enable row level security;

create policy "audit_log_insert_own" on public.audit_log
  for insert with check (auth.uid() = user_id);


-- ===================== 20260822090000_audit_log_survives_account_deletion.sql =====================
-- Story 5.3 (AC1): a FK original de audit_log.user_id tinha "on delete cascade" a partir de
-- auth.users, então excluir uma conta (Story 5.2) apagava junto o próprio registro de
-- auditoria do evento "delete_account" — exatamente o evento em que a trilha mais importa.
-- Remove a FK (mantém a coluna como uuid solto, sem integridade referencial) para que a
-- trilha de auditoria sobreviva à conta que a originou. Não conflita com "destruição
-- permanente e irreversível" (Story 5.2, AC4): audit_log nunca teve select/update/delete
-- exposto ao próprio usuário (AC2 desta história), então nenhum dado navegável pelo usuário
-- passa a sobreviver — só um log de compliance.
--
-- Busca o nome real da constraint em vez de assumir o padrão de nomenclatura do Postgres
-- (achado da revisão de código): como as migrations deste projeto são aplicadas manualmente
-- (ver nota em CLAUDE.md), um "drop constraint if exists audit_log_user_id_fkey" hardcoded
-- faria no-op silencioso — sem erro nenhum — caso o nome real divirja por qualquer motivo,
-- deixando o CASCADE intacto e voltando a apagar a trilha de auditoria na exclusão.
do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'audit_log'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'user_id';

  if fk_name is not null then
    execute format('alter table public.audit_log drop constraint %I', fk_name);
  end if;
end $$;


-- ===================== 20260823100000_user_patterns_daily_greeting.sql =====================
-- Cache diário da mensagem de boas-vindas gerada por IA para a Home (tela Início).
-- Guardada em user_patterns (não numa tabela nova) porque já é a linha lida a cada
-- carregamento da Home e o dono natural de "o que sabemos sobre este usuário" — evita
-- uma segunda tabela só para dois campos. Regenerada no máximo 1x por dia (comparação
-- por data, fuso America/Sao_Paulo, ver lib/dashboard/date.ts): daily_greeting_date
-- guarda a data (não timestamptz) porque só o dia importa para decidir se o cache
-- ainda é válido.
alter table public.user_patterns
  add column if not exists daily_greeting text,
  add column if not exists daily_greeting_date date;

