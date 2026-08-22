-- Story 5.3 (AC1): a FK original de audit_log.user_id tinha "on delete cascade" a partir de
-- auth.users, então excluir uma conta (Story 5.2) apagava junto o próprio registro de
-- auditoria do evento "delete_account" — exatamente o evento em que a trilha mais importa.
-- Remove a FK (mantém a coluna como uuid solto, sem integridade referencial) para que a
-- trilha de auditoria sobreviva à conta que a originou. Não conflita com "destruição
-- permanente e irreversível" (Story 5.2, AC4): audit_log nunca teve select/update/delete
-- exposto ao próprio usuário (AC2 desta história), então nenhum dado navegável pelo usuário
-- passa a sobreviver — só um log de compliance.
alter table public.audit_log drop constraint if exists audit_log_user_id_fkey;
