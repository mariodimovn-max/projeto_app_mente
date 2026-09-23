# 0004 — `audit_log.user_id` sem FK — sobrevive à exclusão da conta

**Status:** aceita (substitui a decisão implícita da Story 5.1)
**Contexto original:** Story 5.1 → revertido na Story 5.3

## Decisão

`audit_log` **não tem foreign key** de `user_id` para `auth.users`. A linha vira um UUID solto, sem
integridade referencial — decisão consciente, confirmada com o usuário.

## Por quê

Toda outra tabela de dados do usuário tem `ON DELETE CASCADE` a partir de `auth.users` (decisão da
Story 5.2, correta para essas tabelas — destruição total é o próprio requisito de LGPD). A Story 5.1
criou `audit_log` com o mesmo padrão de FK+cascade, mas isso apaga junto o registro de auditoria do
evento `delete_account` — exatamente o evento em que a trilha mais precisa sobreviver. A Story 5.3
corrigiu isso removendo a FK.

## Implicação prática

Qualquer tabela nova cujo propósito seja **provar que algo aconteceu** (auditoria, compliance, log
de consentimento) não deve usar `ON DELETE CASCADE` a partir de `auth.users` — o padrão-cascade só
vale para dados que o usuário tem o direito de apagar por completo, não para o registro de que ele
pediu para apagar. Ao remover uma FK existente via migration, buscar o nome real da constraint via
`information_schema` em vez de hardcodar (o nome pode divergir em bancos aplicados manualmente).

## Onde isso aparece no código

- `supabase/migrations/` — migration que remove a FK (`audit_log_survives_account_deletion`)
- `apps/web/src/lib/actions/deleteAccount.ts`, `exportData.ts`, `login.ts` — escrevem em `audit_log`
