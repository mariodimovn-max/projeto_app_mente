# Story 2.6: Limite Diário de Mensagens

Status: done

## Story

As a desenvolvedor solo mantendo o custo da API sob controle,
I want limitar o número de mensagens que cada usuário pode enviar por dia,
so that o custo da API Anthropic não fique descontrolado sem orçamento definido.

## Acceptance Criteria

1. **Given** um usuário que já enviou N mensagens no dia corrente, **when** ele tentar enviar uma mensagem além do limite configurado, **then** o envio é bloqueado com mensagem gentil explicando o limite e o momento de renovação.
2. **Given** uma mensagem de fluxo de crise, **when** o limite diário estiver ativo, **then** ela não é bloqueada pelo controle de custo.
3. **Given** a passagem de um novo dia, **when** o contador for verificado, **then** ele é reiniciado automaticamente.

## Tasks / Subtasks

- [x] Implementar o contador de mensagens por usuário/dia.
- [x] Expor comportamento de bloqueio e recuperação para o usuário.

## Notas de implementação

- Limite configurado: **60 mensagens de usuário por dia** (`DAILY_MESSAGE_LIMIT` em
  `apps/web/src/lib/rate-limit.ts`) — um teto de sanidade generoso, não uma restrição de
  orçamento: com Claude Sonnet 5, mesmo uma sessão longa custa centavos de dólar, então o
  limite existe para pegar anomalias (loop de bug, script), não para racionar reflexão.
- Contador é calculado sob demanda (sem tabela/coluna dedicada): conta mensagens com
  `role = 'user'` do dia corrente (UTC) via join com `sessions.user_id`. Isso satisfaz o
  AC3 (reset automático a cada novo dia) sem job de reset — "hoje" é sempre derivado de
  `created_at` no momento da consulta.
- Checagem posicionada em `route.ts` logo após a detecção de crise e antes de qualquer
  persistência — mensagens de fluxo de crise (Story 2.5) nunca passam por ela (AC2).
- Bloqueio retorna `429` com `{ error: { code: "daily_limit_reached", message } }`, no
  formato padrão de erro do projeto. O frontend já tinha tratamento genérico de erro
  (banner + botão "Tentar novamente" em `ChatWindow.tsx`), então nenhuma UI nova foi
  necessária para expor o bloqueio/recuperação ao usuário.
