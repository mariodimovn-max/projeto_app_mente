# Story 2.7: Indicador de Resposta em Andamento e Recuperação de Erros

Status: done

## Story

As a usuário aguardando ou enfrentando uma falha no envio,
I want ver um indicador claro de que o agente está pensando, e uma forma simples de tentar de novo se algo falhar,
so that eu nunca fique sem saber o que está acontecendo ou perca minha mensagem.

## Acceptance Criteria

1. **Given** uma mensagem enviada e aguardando resposta do agente, **when** a requisição estiver em andamento, **then** um indicador visual orgânico é exibido com a copy “Estou pensando sobre o que você trouxe...”.
2. **Given** uma falha no envio, **when** o usuário observar a interface, **then** uma mensagem breve e gentil é exibida com botão explícito de “Tentar novamente”.
3. **Given** a falha de requisição, **when** ela ocorrer, **then** não há retry automático silencioso.
4. **Given** uma mensagem original do usuário, **when** a requisição falhar, **then** a mensagem não é perdida e pode ser reprocessada.

## Tasks / Subtasks

- [x] Implementar indicador de carregamento e estados de erro no chat.
- [x] Garantir recuperação manual sem duplicação silenciosa.

## Dev Agent Record

### Implementation Plan

- AC2, AC3 e AC4 (banner de erro gentil com "Tentar novamente", sem retry automático, mensagem
  original preservada para reenvio) já existiam em `ChatWindow.tsx` desde a Story 2.1 — o
  `catch`/branch `!response.ok` despacha `{ type: "error" }`, guarda o texto original em
  `pendingText`, e `handleRetry` reenvia esse mesmo texto ao clicar no botão. Nenhuma mudança
  foi necessária nesse trecho; a Story 2.6 já havia confirmado essa cobertura ao reaproveitar o
  mesmo banner para o bloqueio de limite diário.
- O gap real era o AC1: não havia indicador visual enquanto a resposta estava em andamento. Novo
  componente `ThinkingIndicator` (orbe `Aura` pequeno + copy "Estou pensando sobre o que você
  trouxe..." exportada como `THINKING_COPY`, animação de pulsação suave com
  `prefers-reduced-motion` respeitado) segue a diretriz de `ux-design-specification.md`
  ("Loading/Thinking Moments": movimento orgânico, sensação de presença, duração real e não
  fake-delay). Sem `role`/`aria-live` próprios — o componente já renderiza dentro do `.history`
  (`aria-live="polite"`) de `ChatWindow`, e uma segunda região ao vivo aninhada duplicaria
  anúncios de leitor de tela (corrigido em review, ver Review Findings).
- `route.ts` já envia os headers da resposta (e o `fetch()` do browser já resolve) antes do
  primeiro token da Anthropic chegar — o `ReadableStream` só produz bytes quando
  `messageStream.on("text")` dispara. Ou seja, boa parte do tempo de espera real acontece com
  `status === "streaming"` e a mensagem do assistente ainda vazia, não apenas em
  `status === "loading"`. `ChatWindow.tsx` agora computa `isThinking` cobrindo os dois casos
  (`loading`, ou `streaming` com a última mensagem do assistente com `content === ""`) para que
  o indicador realmente acompanhe a espera do modelo, não só a ida da requisição.
- Para não duplicar presença (bolha vazia do agente + indicador logo abaixo), `visibleMessages`
  filtra qualquer mensagem do assistente com `content === ""` do que é renderizado —
  independentemente do `status` atual, não só enquanto `isAwaitingFirstToken` é verdadeiro. Isso
  também evita que a bolha vazia fique visível para sempre se o stream terminar sem nenhum chunk
  ou falhar entre os cabeçalhos e o primeiro token (achado de review corrigido).

### Completion Notes

- Novo componente `ThinkingIndicator.tsx` + `.module.css`, com teste dedicado confirmando a copy
  exata (`THINKING_COPY`) via texto visível.
- Teste em `ChatWindow.test.tsx` com um mock de streaming controlável (`pushChunk`/`finish`/`fail`
  manuais, além de uma Promise de `fetch` resolvida manualmente) que verifica: (1) o indicador
  aparece assim que a mensagem é enviada (`status === "loading"`), sem bolha do agente duplicada;
  (2) permanece visível após os cabeçalhos da resposta chegarem mas antes do primeiro token
  (`status === "streaming"`, conteúdo vazio); (3) desaparece assim que o primeiro chunk real
  chega, e a bolha real aparece. Mais dois testes de regressão adicionados na review: stream que
  termina sem nenhum chunk, e stream que falha depois dos cabeçalhos — ambos confirmando que
  nenhuma bolha vazia fica presa na tela.
- AC2/AC3/AC4 confirmados por cobertura já existente (teste "mostra um banner de erro com retry
  explícito... sem reenviar automaticamente" em `ChatWindow.test.tsx`) — nenhum código novo
  necessário nesse caminho.
- Suíte completa após as correções de review: 249 testes passando (34 arquivos). `npx eslint` e
  `npx tsc --noEmit` sem erros.

### File List

- `apps/web/src/components/chat/ThinkingIndicator.tsx` (novo)
- `apps/web/src/components/chat/ThinkingIndicator.module.css` (novo)
- `apps/web/src/components/chat/ThinkingIndicator.test.tsx` (novo)
- `apps/web/src/components/chat/ChatWindow.tsx` (modificado)
- `apps/web/src/components/chat/ChatWindow.test.tsx` (modificado)

### Change Log

- 2026-07-23: Implementado indicador orgânico de "pensando" cobrindo tanto a fase de loading
  quanto a espera pelo primeiro token durante o streaming (AC1). Confirmada, sem alterações, a
  cobertura já existente para recuperação de erro com retry manual e sem duplicação (AC2-AC4).
- 2026-07-23: Aplicadas 6 correções de code review (aninhamento de `role="status"`, bolha vazia
  do assistente podendo ficar visível para sempre, `prefers-reduced-motion` incompleto, copy
  duplicada sem constante, mock de teste com resolver único, cobertura de teste para bolha
  duplicada) e adicionados 2 testes de regressão. 3 achados de baixa severidade, pré-existentes
  a esta story, adiados para `deferred-work.md`.

### Review Findings

- [x] [Review][Patch] `role="status"` do `ThinkingIndicator` aninhado dentro do `.history` (já `aria-live="polite"`) — risco de anúncios duplicados/inconsistentes em leitores de tela (WCAG 4.1.3) [apps/web/src/components/chat/ThinkingIndicator.tsx:9] — corrigido: removido o `role`/`aria-live` próprio, o componente agora só é anunciado pela região viva já existente do `.history`.
- [x] [Review][Patch] Bolha vazia do assistente pode ficar visível permanentemente sem indicador e sem conteúdo — ocorre se o stream terminar sem nenhum chunk, ou se falhar entre o recebimento dos cabeçalhos e o primeiro token [apps/web/src/components/chat/ChatWindow.tsx:158] — corrigido: `visibleMessages` agora filtra qualquer mensagem do assistente com `content === ""` independentemente do `status`, não só enquanto aguarda o primeiro token.
- [x] [Review][Patch] `@media (prefers-reduced-motion: reduce)` cobre só a pulsação do texto (`.copy`), não a animação de entrada (`rise`) do `.indicator` [apps/web/src/components/chat/ThinkingIndicator.module.css:280] — corrigido: a media query agora desliga a animação de ambos os elementos.
- [x] [Review][Patch] Copy "Estou pensando sobre o que você trouxe..." duplicada como string literal em 3 arquivos, sem constante compartilhada [apps/web/src/components/chat/ThinkingIndicator.tsx:11] — corrigido: extraída para `export const THINKING_COPY`, importada nos dois arquivos de teste.
- [x] [Review][Patch] Mock `createControllableStreamResponse.read()` guarda só um resolver pendente por vez — chamada concorrente antes de `pushChunk`/`finish` trava a promise silenciosamente [apps/web/src/components/chat/ChatWindow.test.tsx:44] — corrigido: trocado para uma fila de resolvers/rejeitadores; também ganhou um método `fail()` para simular falha de leitura pós-cabeçalhos.
- [x] [Review][Patch] Novo teste do indicador de pensamento não afirma explicitamente a ausência de uma bolha vazia duplicada do agente durante a espera do primeiro token [apps/web/src/components/chat/ChatWindow.test.tsx:172] — corrigido: teste existente reforçado com contagem de ocorrências de "a aura" (rótulo também aparece fixo no cabeçalho mobile), mais dois novos testes cobrindo stream sem nenhum chunk e falha pós-cabeçalhos.
- [x] [Review][Defer] Sem timeout/`AbortController` na requisição `/api/chat` — `status` fica em "loading" indefinidamente se a requisição nunca resolver [apps/web/src/components/chat/ChatWindow.tsx:92] — deferred, pré-existente desde a Story 2.1
- [x] [Review][Defer] Clique duplo em "Tentar novamente" ou envio concorrente não tem guarda explícita além do `disabled` do composer [apps/web/src/components/chat/ChatWindow.tsx:148] — deferred, pré-existente desde a Story 2.1
- [x] [Review][Defer] Se o primeiro delta do streaming for só espaço/quebra de linha (não string vazia), o indicador some cedo e a bolha aparece "congelada" em branco até o próximo chunk [apps/web/src/components/chat/ChatWindow.tsx:154] — deferred, baixa probabilidade prática com o modelo atual, revisitar se streaming de outro provedor for adotado
