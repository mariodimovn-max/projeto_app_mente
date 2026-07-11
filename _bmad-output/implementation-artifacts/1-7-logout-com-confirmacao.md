# Story 1.7: Logout com Confirmação

Status: planned

## Story

As a usuário autenticado,
I want encerrar minha sessão explicitamente com uma confirmação,
so that eu tenha controle claro sobre quando saio da minha conta.

## Acceptance Criteria

1. **Given** um usuário autenticado navegando no app, **when** ele selecionar “Sair” no menu ou configurações, **then** uma confirmação é exibida antes de encerrar a sessão.
2. **Given** a confirmação exibida, **when** o usuário confirmar, **then** a sessão é encerrada e ele é redirecionado para a tela de login/onboarding.
3. **Given** a confirmação exibida, **when** o usuário cancelar, **then** o estado atual é preservado sem alteração.

## Tasks / Subtasks

- [ ] Implementar o fluxo de logout com confirmação.
- [ ] Garantir a invalidação da sessão após confirmação.
