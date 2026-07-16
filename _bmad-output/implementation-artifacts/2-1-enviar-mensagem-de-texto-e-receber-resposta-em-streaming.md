# Story 2.1: Enviar Mensagem de Texto e Receber Resposta em Streaming

Status: pronto (validado end-to-end)

## Story

As a usuário autenticado,
I want enviar uma mensagem de texto para o agente e ver a resposta chegando em tempo real,
so that eu possa conversar de forma fluida sem esperar a resposta completa carregar.

## Acceptance Criteria

1. **Given** um usuário autenticado sem sessão de conversa ativa, **when** ele digitar uma mensagem entre 10 e 5000 caracteres e enviar, **then** uma nova sessão é criada e a mensagem é salva associada a ela.
2. **Given** a mensagem enviada, **when** ela for processada, **then** a requisição é enviada ao Route Handler `/api/chat` com runtime Node.js e a resposta do agente chega em streaming.
3. **Given** a resposta chegando em tempo real, **when** o usuário observar a interface, **then** a mensagem do agente aparece incrementalmente na tela.
4. **Given** o streaming concluído, **when** a resposta final for recebida, **then** ela é salva em `messages` e o histórico exibe timestamp para cada mensagem.
5. **Given** mensagens fora do intervalo permitido, **when** o usuário tentar enviar, **then** a interface rejeita com validação clara.

## Tasks / Subtasks

- [x] Migration Supabase `sessions`/`messages` com RLS (`supabase/migrations/20260716195536_chat_schema.sql`)
- [x] Schema Zod compartilhado (`lib/validation/message.ts`) — 10–5000 caracteres
- [x] `lib/agent/client.server.ts` (client Anthropic) e `lib/agent/memory.ts` (monta histórico da sessão)
- [x] Route Handler `app/api/chat/route.ts` — runtime Node.js, cria sessão quando necessário, persiste mensagem do usuário, faz streaming da resposta via `ReadableStream`, persiste a resposta do agente ao final
- [x] Componentes `ChatComposer`, `MessageBubble`, `ChatWindow` (`useReducer` com estados `'idle' | 'loading' | 'streaming' | 'error'`) e página `/chat`
- [x] Link "Ir para o chat" na home autenticada
- [x] Testes (Vitest + RTL): validação, memória de conversa, Route Handler (incl. streaming e falha da API) e componentes de chat
- [x] `npm run typecheck`, `npm run lint`, `npm run build` e `vitest run` — todos verdes (135 testes)

## Dev Notes

- **Modelo Anthropic:** `claude-sonnet-5`, escolhido com o usuário (não `claude-opus-4-8`, default do skill de API) por ser um app conversacional de baixa latência (NFR: resposta <5s) com custo de API ainda sem orçamento definido (`architecture.md`). `thinking` explicitamente `disabled` para manter a latência baixa numa conversa reflexiva simples — não é um caso de raciocínio complexo.
- **Estado emocional:** o Route Handler já usa `buildSystemPrompt` de `lib/agent/prompts.ts` (portado na Story 1.1), mas fixo em `"neutral"` nesta história. A adaptação de tom via `detectEmotionalState` fica para a Story 2.2, que é dona dessa AC.
- **Schema de dados (novo):** `sessions` (`id`, `user_id`, `created_at`) e `messages` (`id`, `session_id`, `role`, `content`, `created_at`), ambas com RLS restringindo leitura/escrita ao dono da sessão (`auth.uid()`), conforme `architecture.md`. Tabelas futuras (`session_syntheses`, `user_patterns`, `audit_log`) ficam para as histórias que as introduzem (3.x/4.x/5.3), evitando modelar dados que ainda não têm consumidor.
- **Streaming:** o Route Handler constrói um `ReadableStream` manualmente (não usa `MessageStream.toReadableStream()` da SDK, que emite eventos SSE tipados pensados para reconsumo pela própria SDK) — o cliente é um `fetch` simples lendo texto puro, conforme decidido em `architecture.md` ("sem WebSocket... ReadableStream consumido via fetch"). O `sessionId` (criado ou reaproveitado) volta ao cliente pelo header `X-Session-Id`, lido antes do corpo começar a chegar.
- **Persistência da resposta do agente:** acontece só depois que o streaming termina (`finalMessage()`), e **antes** de fechar o controller — se a inserção falhar, o controller emite erro em vez de fechar com sucesso, evitando perder a resposta silenciosamente.
- **Erros:** nunca há retry automático (`ChatWindow` guarda `pendingText` e exibe um botão "Tentar novamente" explícito), conforme padrão de erro do `architecture.md` (evita duplicar custo de chamada à Anthropic API).

## Validação end-to-end

Validado manualmente com dados reais (Mario, 2026-07-16): login real via Supabase Auth → `/chat` → mensagem enviada → streaming da resposta da Claude Sonnet 5 renderizado na tela → `POST /api/chat` retornando `200`. A migration `20260716195536_chat_schema.sql` foi aplicada pelo usuário direto no SQL Editor do Supabase (a tentativa inicial falhou com `PGRST205 — Could not find the table 'public.sessions'` antes da aplicação; o erro agora é logado via `console.error` no Route Handler para facilitar diagnóstico futuro).

## Limitações conhecidas desta sessão

- `apps/web/.env.example` não pôde ser lido nem editado (bloqueado pelas permissões do ambiente, mesma limitação já registrada nas Stories 1.4–1.7) — falta documentar ali a variável `ANTHROPIC_API_KEY` (já configurada com sucesso em `.env.local`, fora do controle de versão).
- O log de dev do Next.js (`next dev`) expôs a senha do usuário em texto puro no terminal ao logar os argumentos da Server Action `login` — comportamento padrão do modo dev do framework, não do código da aplicação. Recomendado trocar a senha usada no teste por precaução.
