# Story 5.2: Deletar Conta com Destruição Permanente

Status: done

## Story

As a usuário que decide não usar mais o app,
I want deletar minha conta com a garantia de que meus dados são destruídos permanentemente,
so that eu tenha confiança total de que nada da minha vida íntima permanece armazenado.

## Acceptance Criteria

1. **Given** um usuário autenticado nas configurações da conta, **when** ele solicitar “Excluir minha conta” e confirmar explicitamente, **then** a Server Action remove permanentemente as sessões, mensagens, sínteses e agregados associados ao usuário.
2. **Given** a exclusão da conta, **when** ela for concluída, **then** a conta de autenticação no Supabase Auth é removida.
3. **Given** a ação de exclusão, **when** ocorrer, **then** ela é registrada em `audit_log` antes da destruição dos dados.
4. **Given** a confirmação da ação, **when** ela for dada, **then** não há forma de recuperar a conta ou os dados após isso.

## Tasks / Subtasks

- [x] Implementar a Server Action de exclusão da conta.
- [x] Garantir o registro de auditoria e a remoção do perfil de auth.

### Review Findings

- [x] [Review][Decision] A linha de `audit_log` de uma exclusão bem-sucedida é destruída pela mesma cascata que deveria registrá-la — `apps/web/src/lib/actions/deleteAccount.ts`. Decisão do usuário: manter como está — a destruição total (incluindo o próprio `audit_log`) é consistente com AC4 e o valor "privacidade acima de tudo" do CLAUDE.md; uma trilha persistente sem FK para `auth.users` fica para a Story 5.3.
- [x] [Review][Patch] Falha em `admin.auth.admin.deleteUser` após o `audit_log` já gravado deixa um registro `delete_account` permanentemente enganoso [apps/web/src/lib/actions/deleteAccount.ts] — corrigido com um segundo registro compensatório `delete_account_failed` gravado quando a exclusão no Auth falha.
- [x] [Review][Patch] `signOut()` fica fora do `try/catch` na Server Action e `handleConfirm` no client não tem `try/catch/finally` [apps/web/src/lib/actions/deleteAccount.ts, apps/web/src/components/settings/DeleteAccountButton.tsx] — corrigido: `signOut()` envolvido em try/catch no servidor, `handleConfirm` com try/catch/finally no client.
- [x] [Review][Patch] `handleConfirm` sem guarda de reentrância [apps/web/src/components/settings/DeleteAccountButton.tsx] — corrigido com `if (submitting) return;` no início de `handleConfirm`.
- [x] [Review][Patch] `admin.ts` sem guard `server-only` [apps/web/src/lib/supabase/admin.ts] — corrigido com um guard `typeof window !== "undefined"` (sem adicionar a dependência `server-only`).
- [x] [Review][Defer] Checkboxes de Tasks/Subtasks não marcados durante a implementação — deferred, será fechado na Fase 7 do fluxo de dev-story junto com o status final da história.
