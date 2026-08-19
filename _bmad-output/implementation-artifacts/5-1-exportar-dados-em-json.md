# Story 5.1: Exportar Dados em JSON

Status: done

## Story

As a usuário que quer ter uma cópia dos meus dados,
I want exportar todos os meus dados em formato JSON a qualquer momento,
so that eu tenha controle total sobre minhas informações, conforme a LGPD.

## Acceptance Criteria

1. **Given** um usuário autenticado nas configurações da conta, **when** ele selecionar “Exportar meus dados”, **then** uma Server Action gera um arquivo JSON contendo sessões, mensagens, sínteses e agregados de padrões.
2. **Given** o arquivo gerado, **when** o usuário solicitar a exportação, **then** o download é disponibilizado imediatamente.
3. **Given** a ação de exportação, **when** ela for executada, **then** o evento é registrado na tabela `audit_log`.

## Tasks / Subtasks

- [ ] Implementar a Server Action para exportação JSON.
- [ ] Registrar o evento e disponibilizar o download.

### Review Findings

- [x] [Review][Patch] Cap de sessões (`SESSIONS_ROW_CAP`) ordena por `created_at` ascendente antes de aplicar `.limit()` — para um usuário com mais de 3000 sessões, descarta as sessões mais recentes em vez das mais antigas, contradizendo a expectativa de "cópia completa" mais recente possível [`apps/web/src/lib/actions/exportData.ts`]
- [x] [Review][Patch] Consultas de `messages` e `session_syntheses` não têm nenhum `.limit()` explícito — dependem do cap implícito do PostgREST, o que pode truncar silenciosamente o export de um usuário com muitas mensagens, sem erro nem aviso [`apps/web/src/lib/actions/exportData.ts`]
- [x] [Review][Defer] `.in("session_id", sessionIds)` com até 3000 ids pode aproximar-se de limites de tamanho de URL/query string do PostgREST — deferred, pre-existing risk tolerance pattern (mesma filosofia de "salvaguarda contra volume anômalo, não teto real" já usada em `dashboard.ts`/`weeklySummary.ts`); impacto teórico dado o volume do beta fechado (5–10 usuários) [`apps/web/src/lib/actions/exportData.ts`]
- [x] [Review][Defer] `exportUserData` não tem rate limiting próprio — deferred, mesmo padrão (ausência) de todas as outras Server Actions do projeto (`generateSummary`, `sessionHistory`, etc.) [`apps/web/src/lib/actions/exportData.ts`]
- [x] [Review][Defer] Falha transitória na consulta de `user_patterns` aborta a exportação inteira em vez de degradar para `patterns: null` — deferred, decisão consciente: falhar de forma visível é mais honesto que entregar um "export completo" silenciosamente incompleto (valor de honestidade do CLAUDE.md), mesma granularidade tudo-ou-nada já aceita em `buildMemoryContext` (Story 3.4) [`apps/web/src/lib/actions/exportData.ts`]
- [x] [Review][Defer] `JSON.stringify` + `Blob` síncronos no main thread podem travar a UI para payloads muito grandes — deferred, mesma tolerância de escala do restante do projeto (geração de PDF na Story 4.6 também é síncrona no main thread) [`apps/web/src/lib/export/downloadJson.ts`]
