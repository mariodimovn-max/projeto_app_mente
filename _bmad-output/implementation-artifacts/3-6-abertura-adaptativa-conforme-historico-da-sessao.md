# Story 3.6: Abertura Adaptativa Conforme Histórico da Sessão

Status: done

## Story

As a usuário iniciando uma nova conversa,
I want que a abertura do agente varie conforme meu padrão de resposta e o número de sessões que já tive,
so that a conversa não pareça um template genérico repetido todo dia.

## Acceptance Criteria

1. **Given** um usuário iniciando uma nova sessão, **when** for a primeira sessão do usuário, **then** a abertura usa a pergunta-guia estruturada padrão.
2. **Given** uma sessão subsequente, **when** o histórico indicar padrões recentes, **then** a abertura considera o perfil do usuário e a tendência de resposta.
3. **Given** a abertura gerada, **when** ela for apresentada, **then** ela não repete literalmente a frase da sessão imediatamente anterior.

## Tasks / Subtasks

- [x] Implementar a lógica de abertura adaptativa.
  - [x] `lib/agent/memory.ts`: `buildSessionOpeningContext` — determina se é a primeira sessão do usuário, recupera a frase de abertura (primeira mensagem do assistente) da sessão imediatamente anterior e deriva o padrão de resposta recente (curto/longo) a partir do tamanho médio das mensagens do usuário nessa sessão.
  - [x] `lib/agent/prompts.ts`: `buildSystemPrompt` ganha um 4º parâmetro `openingContext`; instrução de abertura (`buildOpeningAddendum`) anexada ao prompt apenas quando fornecida — pergunta-guia padrão verbatim na primeira sessão, ou orientação de estímulo/espaço + anti-repetição em sessões subsequentes.
  - [x] `/api/chat`: busca `openingContext` apenas quando a mensagem atual é a primeira da sessão (`conversation.length === 1`), best-effort (erro logado, conversa segue sem a instrução de abertura).
- [x] Garantir diversidade na abertura ao longo do tempo.
  - [x] AC3 coberto via instrução explícita no prompt citando a frase de abertura da sessão imediatamente anterior e proibindo repeti-la literalmente.

### Review Findings

- [x] [Review][Defer] `.catch(() => null)` em `buildSessionOpeningContext` (route.ts) não distingue "falha transitória na consulta" de "não é abertura de sessão" — um erro passageiro no Supabase na primeira mensagem de um usuário derruba silenciosamente a instrução obrigatória da pergunta-guia padrão (AC1), sem log diferenciado nem caminho de recuperação. `apps/web/src/app/api/chat/route.ts` — deferred: decisão do usuário de manter o padrão best-effort (mesmo usado em `memoryContext`), risco baixo dado o volume do beta fechado.
- [x] [Review][Patch] Lacuna no AC2: `user_patterns` não é efetivamente considerado na abertura — a única linha do addendum que referencia "os padrões descritos acima" só é usada quando `responsePattern` é `null`, o que na prática é inalcançável (toda sessão começa com pelo menos uma mensagem do usuário). O addendum deveria puxar explicitamente um sinal de `user_patterns` (ex.: temas recorrentes), não só o padrão de resposta curto/longo. `apps/web/src/lib/agent/prompts.ts` (`buildOpeningAddendum`) — corrigido: `buildSessionOpeningContext` agora busca `user_patterns` em paralelo e expõe `topThemes` (top 3 temas recorrentes); `buildOpeningAddendum` inclui uma linha incondicional referenciando esses temas quando existem.
- [x] [Review][Patch] Retry manual após falha no streaming derruba a detecção de "primeira sessão" — `ChatWindow.handleRetry` reenvia `pendingText` com o mesmo `sessionId` já capturado do header `X-Session-Id`; se o stream falhar depois da sessão criada mas antes de qualquer resposta do assistente ser persistida, o retry insere uma segunda linha de mensagem do usuário na mesma sessão. `conversation.length` passa a ser 2 antes de qualquer resposta do assistente ter existido, `isSessionOpening` vira `false`, e um usuário genuinamente novo perde a pergunta-guia padrão obrigatória (AC1). `apps/web/src/app/api/chat/route.ts:178` (ver também `apps/web/src/components/chat/ChatWindow.tsx:165-169`) — corrigido: `isSessionOpening` agora é `!conversation.some((m) => m.role === "assistant")` em vez de `conversation.length === 1`, então qualquer sessão sem resposta ainda do assistente (incluindo depois de um retry) continua sendo tratada como abertura.
- [x] [Review][Patch] A busca da "sessão imediatamente anterior" só exclui a sessão atual por id, sem garantir que ela seja estritamente anterior no tempo — em duplo envio ou múltiplas abas criando sessões quase simultâneas, duas sessões-irmãs podem se referenciar mutuamente como "anterior", fabricando `previousOpeningPhrase`/`responsePattern` a partir de uma sessão que não é realmente anterior. `apps/web/src/lib/agent/memory.ts` (`fetchPreviousSessionId`) — corrigido: a função agora busca primeiro o `created_at` da sessão atual e filtra as demais sessões do usuário por `created_at` estritamente menor antes de ordenar/limitar.
- [x] [Review][Patch] Uma troca do fluxo de crise na sessão anterior pode ser capturada como "frase de abertura anterior" (a primeira mensagem do assistente pode ser o `CRISIS_RESPONSE_MESSAGE` fixo) e distorcer a classificação de padrão de resposta curto/longo — `derivePreviousOpeningPhrase`/`deriveResponsePattern` não diferenciam uma resposta de crise de uma reflexão normal. `apps/web/src/lib/agent/memory.ts` (`derivePreviousOpeningPhrase`, `deriveResponsePattern`) — corrigido parcialmente: `derivePreviousOpeningPhrase` agora ignora mensagens do assistente iguais a `CRISIS_RESPONSE_MESSAGE` ao procurar a frase de abertura. Não foi alterado `deriveResponsePattern`: excluir a mensagem do próprio usuário que disparou a crise exigiria reaplicar `detectCrisisSignal` sobre mensagens históricas, um escopo maior que este patch — registrado como limitação conhecida, não uma correção completa.
- [x] [Review][Patch] `previousOpeningPhrase` é inserido literalmente e sem limite de tamanho no novo prompt do sistema — uma resposta anterior incomum longa é reembutida por inteiro a cada nova sessão, sem truncamento. `apps/web/src/lib/agent/prompts.ts` (`buildOpeningAddendum`) — corrigido: nova função `truncatePreviousOpeningPhrase` corta a frase em 200 caracteres antes de inseri-la no prompt.
- [x] [Review][Defer] Sem chave de desempate além de `created_at` ao ordenar `sessions`/`messages` [apps/web/src/lib/agent/memory.ts] — deferred, pré-existente (mesma limitação já em `buildConversationMessages`/`fetchRecentSyntheses` desde as Stories 3.1/3.4)
- [x] [Review][Defer] Histórico completo de mensagens da sessão anterior buscado sem `.limit()` [apps/web/src/lib/agent/memory.ts, `buildSessionOpeningContext`] — deferred, pré-existente (espelha o mesmo padrão já usado por `buildConversationMessages`)

## Dev Notes

- Não existe abertura estática no cliente: a "abertura" é a primeira resposta do agente à primeira mensagem do usuário na sessão, guiada pelo `systemPrompt` — por isso a lógica inteira vive no backend (prompt), não na UI.
- "Primeira sessão do usuário" é decidido por uma consulta a `sessions` filtrando por `created_at` estritamente anterior ao da sessão atual (ordenada desc, limit 1): se não há nenhuma, é a primeira sessão. A busca de contexto de abertura roda apenas quando o assistente ainda não respondeu nada na sessão atual (`!conversation.some(role === "assistant")`), para não somar uma leitura extra a cada mensagem da conversa nem quebrar em cenários de retry (ver Review Findings).
- Padrão de resposta ("curto"/"longo") é calculado a partir da sessão imediatamente anterior (tamanho médio das mensagens do usuário, limiar de 80 caracteres, excluindo a resposta fixa de crise). `topThemes` (top 3 temas de `user_patterns`) é buscado à parte, em paralelo, e entra na instrução de abertura independentemente do padrão de resposta.
- A instrução de abertura é independente do bloco de memória em camadas (Story 3.4) e é anexada depois dele no prompt.

## Dev Agent Record

### Completion Notes

- Nenhuma migration nova — reutiliza as tabelas `sessions`, `messages` e `user_patterns` já existentes.
- `buildSessionOpeningContext` propaga erros do Supabase (mesmo padrão de `buildConversationMessages`/`fetchRecentSyntheses`); a chamada em `/api/chat` é best-effort (`.catch`), como já acontece com `buildMemoryContext` — mantido assim por decisão do usuário após revisão (ver Review Findings, item deferred).
- Revisão de código (Blind Hunter + Edge Case Hunter + Acceptance Auditor) encontrou 1 achado que exigia decisão do usuário e 5 patches; todos os 5 patches foram aplicados nesta mesma passada: (1) `user_patterns` agora entra explicitamente na instrução de abertura via `topThemes`; (2) detecção de "abertura de sessão" baseada em "assistente ainda não respondeu", não em contagem de mensagens, sobrevivendo a um retry manual; (3) busca da sessão anterior agora exige `created_at` estritamente menor que o da sessão atual; (4) a resposta fixa de crise nunca mais é escolhida como "frase de abertura anterior"; (5) `previousOpeningPhrase` truncada em 200 caracteres antes de entrar no prompt. Detalhes e o que ficou como limitação conhecida (exclusão do texto do usuário que disparou uma crise do cálculo de padrão de resposta) estão na seção Review Findings.
- Testes cobrem: derivação de `isFirstSession`/`previousOpeningPhrase`/`responsePattern`/`topThemes` (incluindo o filtro de `created_at` e a exclusão da resposta de crise) em `memory.test.ts`; o texto do addendum de abertura (verbatim da pergunta padrão, linhas de estímulo/espaço/temas, anti-repetição truncada, ordenação após o bloco de memória) em `prompts.test.ts`; e a integração na rota (contexto de abertura buscado quando o assistente ainda não respondeu — inclusive após um retry — não no fluxo de crise, resiliente a falha) em `route.test.ts`.
- Suíte completa executada (`vitest run`) após os patches: 410 testes passando em todos os 49 arquivos, incluindo os dois que antes tinham falhado por timeout sob carga de ambiente. `tsc --noEmit` e `eslint` sem erros nos arquivos alterados.
- **Validação manual pós-review (rodando `next dev` de verdade) encontrou 2 problemas, fora do escopo desta story, corrigidos na mesma sessão:**
  1. Uma regressão que eu mesmo introduzi ao aplicar o patch do achado AC2: `buildSessionOpeningContext` buscava `fetchPreviousSessionId` e `getUserPatterns` no mesmo `Promise.all` sem catch individual — uma falha na consulta de `user_patterns` (ex.: RLS, tabela indisponível) derrubava o `Promise.all` inteiro e descartava também `previousOpeningPhrase`/`responsePattern`, que não dependem de `user_patterns`. Corrigido isolando `getUserPatterns(...).catch(() => null)` dentro de `buildSessionOpeningContext`; teste novo em `memory.test.ts` cobre o cenário.
  2. Um bug pré-existente da Story 3.5 (`HistoryCard.tsx`, tela de Histórico): o gesto de swipe chamava `setPointerCapture` já no `pointerdown`, mesmo para um toque simples sem arrastar — em vários navegadores isso redireciona o `click` resultante para a `div` que capturou o ponteiro em vez do `<Link>` aninhado, impedindo a navegação para `/historico/[id]` ao tocar num cartão. Corrigido adiando a captura de ponteiro e o estado de arraste até o deslocamento ultrapassar `DRAG_THRESHOLD_PX` (8px) — um toque simples nunca captura o ponteiro, e o clique chega normalmente ao link. Dois testes novos em `HistoryCard.test.tsx` cobrem toque simples (não captura, não abre o painel) e arraste real (ainda abre o painel via swipe).

### File List

- `apps/web/src/lib/agent/memory.ts` (modificado)
- `apps/web/src/lib/agent/memory.test.ts` (modificado)
- `apps/web/src/lib/agent/prompts.ts` (modificado)
- `apps/web/src/lib/agent/prompts.test.ts` (modificado)
- `apps/web/src/app/api/chat/route.ts` (modificado)
- `apps/web/src/app/api/chat/route.test.ts` (modificado)
- `apps/web/src/components/history/HistoryCard.tsx` (modificado — correção de bug pré-existente da Story 3.5, fora do escopo desta story, encontrado na validação manual)
- `apps/web/src/components/history/HistoryCard.test.tsx` (modificado)

### Change Log

- Implementada a Story 3.6: abertura adaptativa da sessão via novo `buildSessionOpeningContext` (memory.ts), novo parâmetro `openingContext` em `buildSystemPrompt` (prompts.ts) e integração best-effort em `/api/chat`, restrita à primeira mensagem de cada sessão.
- Aplicados os 5 achados `patch` da revisão de código: `user_patterns` (`topThemes`) considerado explicitamente na abertura; detecção de abertura de sessão resiliente a retry; busca da sessão anterior restrita a `created_at` estritamente menor; resposta de crise excluída da frase de abertura anterior; `previousOpeningPhrase` truncada a 200 caracteres.
- Corrigidos, durante validação manual: regressão de resiliência em `buildSessionOpeningContext` (patterns com catch isolado) e bug pré-existente de navegação no cartão de Histórico (Story 3.5, `HistoryCard.tsx` capturando o ponteiro em todo toque).
