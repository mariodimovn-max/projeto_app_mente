# Story 5.3: Trilha de Auditoria para Eventos Sensíveis

Status: planned

## Story

As a desenvolvedor solo responsável por conformidade,
I want registrar automaticamente login, exportação e exclusão de dados,
so that exista uma trilha de auditoria para qualquer acesso sensível, conforme FR8.

## Acceptance Criteria

1. **Given** qualquer evento de login, exportação de dados ou exclusão de conta, **when** ele ocorrer, **then** um registro é criado em `audit_log` contendo usuário, ação e timestamp.
2. **Given** o registro de auditoria, **when** ele for persistido, **then** ele não é visível nem editável pelo próprio usuário via UI.

## Tasks / Subtasks

- [ ] Implementar a gravação de eventos sensíveis em `audit_log`.
- [ ] Garantir que o registro permaneça somente para auditoria.
