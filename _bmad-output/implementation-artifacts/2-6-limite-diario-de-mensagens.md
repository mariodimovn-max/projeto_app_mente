# Story 2.6: Limite Diário de Mensagens

Status: planned

## Story

As a desenvolvedor solo mantendo o custo da API sob controle,
I want limitar o número de mensagens que cada usuário pode enviar por dia,
so that o custo da API Anthropic não fique descontrolado sem orçamento definido.

## Acceptance Criteria

1. **Given** um usuário que já enviou N mensagens no dia corrente, **when** ele tentar enviar uma mensagem além do limite configurado, **then** o envio é bloqueado com mensagem gentil explicando o limite e o momento de renovação.
2. **Given** uma mensagem de fluxo de crise, **when** o limite diário estiver ativo, **then** ela não é bloqueada pelo controle de custo.
3. **Given** a passagem de um novo dia, **when** o contador for verificado, **then** ele é reiniciado automaticamente.

## Tasks / Subtasks

- [ ] Implementar o contador de mensagens por usuário/dia.
- [ ] Expor comportamento de bloqueio e recuperação para o usuário.
