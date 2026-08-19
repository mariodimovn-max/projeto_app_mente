-- Story 5.1 (AC3): trilha mínima de auditoria para eventos sensíveis — hoje só exportação
-- de dados; login e deleção de conta ficam para a Story 5.3, que deve evoluir esta mesma
-- tabela em vez de criar outra. RLS permite ao usuário inserir sua própria linha, mas não
-- expõe select/update/delete: o registro de auditoria não deve ser visível nem editável
-- pelo próprio usuário via UI (arquitetura já prevê esse comportamento para a 5.3).
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
