# Story 2.5: Fluxo de Crise — Resposta a Sinais de Risco Severo

Status: planned

## Story

As a usuário que menciona uma crise severa (pensamentos suicidas, abandono de medicação),
I want que o agente reconheça a gravidade e me direcione a ajuda profissional,
so that eu não fique apenas em uma reflexão estruturada quando preciso de ajuda imediata.

## Acceptance Criteria

1. **Given** uma mensagem do usuário contendo sinais explícitos de crise severa, **when** o agente processar o texto, **then** a resposta prioriza reconhecimento e direcionamento seguro a recursos de crise e ajuda profissional.
2. **Given** o fluxo de crise, **when** a resposta for gerada, **then** ela comunica claramente os limites do app e orienta para ajuda imediata.
3. **Given** a mensagem de crise, **when** o limite diário de mensagens estiver ativo, **then** a resposta de crise ainda é entregue sem ser bloqueada.

## Tasks / Subtasks

- [ ] Implementar a detecção de sinais de crise severa.
- [ ] Garantir uma resposta acolhedora e segura com direcionamento apropriado.
