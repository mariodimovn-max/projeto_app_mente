# Story 3.6: Abertura Adaptativa Conforme Histórico da Sessão

Status: planned

## Story

As a usuário iniciando uma nova conversa,
I want que a abertura do agente varie conforme meu padrão de resposta e o número de sessões que já tive,
so that a conversa não pareça um template genérico repetido todo dia.

## Acceptance Criteria

1. **Given** um usuário iniciando uma nova sessão, **when** for a primeira sessão do usuário, **then** a abertura usa a pergunta-guia estruturada padrão.
2. **Given** uma sessão subsequente, **when** o histórico indicar padrões recentes, **then** a abertura considera o perfil do usuário e a tendência de resposta.
3. **Given** a abertura gerada, **when** ela for apresentada, **then** ela não repete literalmente a frase da sessão imediatamente anterior.

## Tasks / Subtasks

- [ ] Implementar a lógica de abertura adaptativa.
- [ ] Garantir diversidade na abertura ao longo do tempo.
