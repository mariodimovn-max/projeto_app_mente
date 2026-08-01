# Story 3.4: Memória em Camadas — Agente Referencia Conversas Anteriores

Status: done

## Story

As a usuário retornando para uma nova conversa,
I want que o agente lembre e referencie o que conversamos antes,
so that eu sinta continuidade real, não que cada sessão começa do zero.

## Acceptance Criteria

1. **Given** um usuário com pelo menos uma sessão anterior concluída, **when** ele iniciar uma nova sessão, **then** o prompt enviado ao modelo inclui as sínteses das últimas sessões e o agregado `user_patterns`, além das mensagens da sessão atual.
2. **Given** o contexto de memória em camadas, **when** o agente responder, **then** ele consegue referenciar explicitamente conversas anteriores.
3. **Given** a estratégia de contexto, **when** o prompt for montado, **then** o histórico bruto de mensagens não é reenviado por completo, apenas os resumos e agregados necessários.

## Tasks / Subtasks

- [x] Montar o prompt com memória em camadas.
- [x] Validar que referências a sessões passadas aparecem naturalmente.

### Review Findings

- [x] [Review][Patch] Paralelizar `buildConversationMessages` e `buildMemoryContext` em vez de aguardá-los em sequência [apps/web/src/app/api/chat/route.ts:159-169]
- [x] [Review][Patch] Reforçar no bloco de memória que sínteses passadas são contexto, não instrução, reduzindo o risco de uma síntese futura ser lida como comando pelo modelo [apps/web/src/lib/agent/memory.ts:141]
- [x] [Review][Patch] Corrigir `hasPatterns` em `formatMemoryContext` para também considerar `sessionCount > 0`, não só os mapas não vazios [apps/web/src/lib/agent/memory.ts:107-115]
- [x] [Review][Defer] Memória em camadas é buscada a cada mensagem da sessão, não uma vez só [apps/web/src/app/api/chat/route.ts:159-169; apps/web/src/lib/agent/memory.ts:149-160] — deferred, pre-existing
- [x] [Review][Defer] `Promise.all` interno de `buildMemoryContext` é tudo-ou-nada: falha transitória numa das duas leituras descarta as duas [apps/web/src/lib/agent/memory.ts:149-160] — deferred, pre-existing
- [x] [Review][Defer] `getUserPatterns` lê os mapas completos de temas/emoções/gatilhos só para manter os 5 mais frequentes [apps/web/src/lib/patterns/userPatterns.ts] — deferred, pre-existing
- [x] [Review][Defer] `formatSessionDate` corta o timestamp UTC bruto sem conversão de fuso horário [apps/web/src/lib/agent/memory.ts:95-97] — deferred, pre-existing

## Dev Agent Record

### Completion Notes

- `lib/patterns/userPatterns.ts`: nova função `getUserPatterns(supabase, userId)`, leitura
  do agregado `user_patterns` (retorna `null` quando o usuário ainda não tem nenhuma sessão
  sintetizada — mesma condição de `isFirstAnalysis`).
- `lib/agent/memory.ts`: três novas funções, mantendo a responsabilidade de "montar o
  prompt: sessão atual + sínteses + user_patterns" descrita na arquitetura:
  - `fetchRecentSyntheses(supabase, userId, excludeSessionId)` — busca as últimas 5
    sínteses de sessões anteriores do usuário (join `sessions!inner(user_id)`, exclui a
    sessão atual, mais recente primeiro).
  - `formatMemoryContext(syntheses, patterns)` — função pura que monta o bloco de texto
    "MEMÓRIA DE SESSÕES ANTERIORES" (sínteses recentes + top 5 rótulos mais frequentes por
    categoria de `user_patterns`); retorna `null` quando não há nenhuma memória ainda
    (primeira sessão do usuário), para não poluir o prompt com uma seção vazia.
  - `buildMemoryContext(supabase, userId, currentSessionId)` — orquestra as duas buscas em
    paralelo (`Promise.all`) e delega a `formatMemoryContext`; é o ponto de entrada usado
    pela rota de chat.
- `lib/agent/prompts.ts`: `buildSystemPrompt` ganhou um terceiro parâmetro opcional
  `memoryContext: string | null`, anexado ao final do prompt (depois do ajuste de
  intensidade) quando presente.
- `app/api/chat/route.ts`: chama `buildMemoryContext` logo após montar a conversa da sessão
  atual (fora do fluxo de crise — uma resposta de crise não precisa de memória de longo
  prazo) e passa o resultado para `buildSystemPrompt`. Best-effort: falha na leitura da
  memória é logada e a conversa segue sem essa camada, em vez de derrubar a resposta do
  agente.
- AC3 (não reenviar o histórico bruto por completo) já era satisfeito antes desta história:
  `buildConversationMessages` sempre foi escopado à sessão atual. Esta história adiciona a
  camada que faltava — sínteses + agregado de sessões *anteriores* — sem tocar nesse
  comportamento.
- Testes novos: `userPatterns.test.ts` (`getUserPatterns`), `memory.test.ts`
  (`fetchRecentSyntheses`, `formatMemoryContext`, `buildMemoryContext` — incluindo o caso
  "sem memória" e o truncamento para os 5 rótulos mais frequentes), `prompts.test.ts`
  (`buildSystemPrompt` com/sem `memoryContext`), `route.test.ts` (memória incluída no
  `system` enviado à Anthropic, ausente na primeira sessão, tolerância a falha na leitura
  da memória, não é buscada no fluxo de crise). Suíte completa: 331 testes, todos passando.
  `tsc --noEmit` limpo; `eslint` limpo nos arquivos tocados (o restante dos erros do lint
  global vem de `.next.bak-stale-cache`, um diretório de cache pré-existente, não deste
  trabalho).
- Não há migration nova nesta história — reutiliza as tabelas `session_syntheses` e
  `user_patterns` já existentes (Stories 3.1/3.3).

### File List

- apps/web/src/lib/patterns/userPatterns.ts
- apps/web/src/lib/patterns/userPatterns.test.ts
- apps/web/src/lib/agent/memory.ts
- apps/web/src/lib/agent/memory.test.ts
- apps/web/src/lib/agent/prompts.ts
- apps/web/src/lib/agent/prompts.test.ts
- apps/web/src/app/api/chat/route.ts
- apps/web/src/app/api/chat/route.test.ts

## Change Log

- 2026-08-01: Implementada a memória em camadas do agente (AC1-AC3): prompt do chat passa a
  incluir as sínteses das últimas 5 sessões e o agregado `user_patterns` do usuário, sem
  reenviar histórico bruto de sessões anteriores.
- 2026-08-01: Code review — 3 patches aplicados (leituras de conversa/memória paralelizadas
  em `route.ts`; bloco de memória reforçado como contexto, não instrução; `hasPatterns`
  corrigido para considerar `sessionCount > 0`), 4 itens adiados para `deferred-work.md`, 7
  descartados como ruído. Suíte completa (331 testes) e `tsc --noEmit` seguem limpos após os
  patches.
