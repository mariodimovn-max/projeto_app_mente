# Story 5.2: Deletar Conta com Destruição Permanente

Status: planned

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

- [ ] Implementar a Server Action de exclusão da conta.
- [ ] Garantir o registro de auditoria e a remoção do perfil de auth.
