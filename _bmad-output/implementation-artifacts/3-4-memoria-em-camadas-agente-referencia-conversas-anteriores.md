# Story 3.4: Memória em Camadas — Agente Referencia Conversas Anteriores

Status: planned

## Story

As a usuário retornando para uma nova conversa,
I want que o agente lembre e referencie o que conversamos antes,
so that eu sinta continuidade real, não que cada sessão começa do zero.

## Acceptance Criteria

1. **Given** um usuário com pelo menos uma sessão anterior concluída, **when** ele iniciar uma nova sessão, **then** o prompt enviado ao modelo inclui as sínteses das últimas sessões e o agregado `user_patterns`, além das mensagens da sessão atual.
2. **Given** o contexto de memória em camadas, **when** o agente responder, **then** ele consegue referenciar explicitamente conversas anteriores.
3. **Given** a estratégia de contexto, **when** o prompt for montado, **then** o histórico bruto de mensagens não é reenviado por completo, apenas os resumos e agregados necessários.

## Tasks / Subtasks

- [ ] Montar o prompt com memória em camadas.
- [ ] Validar que referências a sessões passadas aparecem naturalmente.
