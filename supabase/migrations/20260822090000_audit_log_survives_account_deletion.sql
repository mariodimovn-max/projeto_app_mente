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
