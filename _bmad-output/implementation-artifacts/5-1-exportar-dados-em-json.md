# Story 5.1: Exportar Dados em JSON

Status: planned

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
