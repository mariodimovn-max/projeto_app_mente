# Story 2.2: Adaptação de Tom Conforme Estado Emocional Detectado

Status: pronto (validado end-to-end)

## Story

As a usuário conversando com o agente,
I want que o agente ajuste seu tom conforme meu estado emocional aparente,
so that eu me sinta genuinamente compreendido, não respondido de forma genérica.

## Acceptance Criteria

1. **Given** uma mensagem do usuário contendo sinais de melancolia, confiança excessiva, confusão ou neutralidade, **when** o Route Handler processar a mensagem, **then** o estado emocional é identificado pela lógica já portada.
2. **Given** o estado emocional detectado, **when** a resposta for gerada, **then** o tom reflete o perfil apropriado: reconfortante, reflexivo-provocador, estruturante ou equilibrado.
3. **Given** a resposta do agente, **when** ela for exibida, **then** ela integra as quatro perspectivas filosóficas de forma orgânica, sem citar os nomes explicitamente.
4. **Given** sinais de intensidade emocional, **when** a resposta for produzida, **then** o comprimento é adaptado para não parecer excessivo nem superficial.

## Tasks / Subtasks

- [x] Integrar a detecção emocional ao fluxo de resposta.
- [x] Ajustar o estilo de resposta com base no tom mapeado.

## Dev Agent Record

### Implementation Plan

- **AC1 (detecção do estado):** `detectEmotionalState` já existia (portado na Story 1.1, `apps/web/src/lib/agent/emotional-state.ts`), mas o Route Handler chamava `buildSystemPrompt("neutral")` fixo — decisão deliberada da Story 2.1, que citava esta story como dona da AC. `apps/web/src/app/api/chat/route.ts` agora chama `detectEmotionalState(message)` sobre a mensagem recebida antes de montar o prompt.
- **AC2 (tom por estado):** `buildSystemPrompt` e `TONE_MAP` (`apps/web/src/lib/agent/prompts.ts`) também já existiam prontos da Story 1.1 com os quatro perfis (`melancholy` → reconfortante, `inflated` → reflexivo-provocador, `confused` → estruturante, `neutral` → equilibrado); só faltava alimentá-los com o estado real em vez de `"neutral"` fixo, o que o item acima resolve.
- **AC3 (perspectivas filosóficas sem citar nomes):** já coberto pelo `BASE_SYSTEM_PROMPT` (Story 1.1), que instrui o modelo a integrar Estoica/Jungiana/Freudiana/Budista "de forma sutil e orgânica" sem pedir para nomeá-las. Nenhuma mudança de código nesta story — é uma AC de comportamento do modelo em produção, não verificável por teste automatizado (os testes mockam o stream da Anthropic API), então fica registrada como validação qualitativa pendente de uso real, não como lacuna de implementação.
- **AC4 (comprimento adaptado à intensidade) — trabalho novo desta story:**
  - `detectEmotionalIntensity(message, state)` (`emotional-state.ts`): classifica `"low" | "high"` reaproveitando os mesmos sinais/pesos de `detectEmotionalState` — `"high"` quando 3 ou mais sinais distintos do estado vencedor aparecem na mensagem (uma menção isolada vs. uma expressão intensa/repetida). Estado `"neutral"` é sempre `"low"` (não há sinais a contar).
  - `resolveMaxTokens(state, intensity)` (`prompts.ts`): orçamento padrão de 1024 tokens em intensidade baixa (mesmo valor fixo que já estava no Route Handler, preservando o comportamento anterior por padrão); 400 tokens para melancolia intensa (sinal de tipo crise — resposta curta e contida, presença antes de elaboração); 1400 tokens para intensidade alta em qualquer outro estado (engajamento reflexivo mais profundo).
  - `buildSystemPrompt(state, intensity = "low")`: ganhou um segundo parâmetro opcional (mantém compatibilidade retroativa — chamadas com um único argumento continuam idênticas ao comportamento anterior) que, em intensidade alta, acrescenta uma instrução textual de comprimento ao prompt (reforça o `max_tokens` com orientação explícita ao modelo, para o caso de o limite duro sozinho não bastar): "seja breve" para melancolia intensa, "pode se aprofundar" para os demais estados intensos.
  - O Route Handler agora calcula `emotionalState`/`emotionalIntensity` uma única vez e usa ambos para montar o `system` e o `max_tokens` da chamada `anthropic.messages.stream`.

### Completion Notes

- 15 novos testes/casos: 4 em `emotional-state.test.ts` (`detectEmotionalIntensity`), 6 em `prompts.test.ts` (intensidade em `buildSystemPrompt`, `resolveMaxTokens`), 2 em `route.test.ts` (mensagem neutra usa tom equilibrado + 1024 tokens; mensagem com melancolia intensa usa tom reconfortante, instrução de brevidade e 400 tokens).
- Ciclo TDD seguido em cada peça: testes escritos e confirmados falhando antes da implementação (`detectEmotionalIntensity` inexistente, `resolveMaxTokens` inexistente, wiring do Route Handler ainda fixo em `"neutral"`), depois implementação mínima até ficarem verdes.
- Suíte completa: **147 testes passando** (28 arquivos). `tsc --noEmit`, `eslint` e `next build` sem erros.
- AC3 não tem cobertura automatizada própria nesta story (ver Implementation Plan) — os testes de `prompts.ts` continuam validando que o `BASE_SYSTEM_PROMPT` existe e é incluído no prompt final, mas a qualidade da integração das perspectivas só é observável na resposta real do modelo. Recomenda-se validação manual numa conversa real antes de considerar a story fechada para produção.
- Mesma limitação das stories anteriores do Epic 2: sem acesso a uma chamada real da Anthropic API neste ambiente, o wiring foi validado via mocks do `messages.stream` (asserções sobre `system` e `max_tokens` recebidos pela chamada mockada).

### Validação end-to-end

Validado manualmente pelo usuário (Mario, 2026-07-18) numa conversa real em `/chat`, com login e chave Anthropic reais: mensagens com diferentes cargas emocionais (melancolia intensa, neutra, ego inflado, confusão) geraram respostas com tom e comprimento visivelmente distintos entre si, confirmando em produção o que os testes automatizados só verificavam contra o stream mockado — incluindo a AC3 (integração das quatro perspectivas filosóficas sem citá-las por nome), que não tinha cobertura automatizada própria. Servidor de dev iniciado nesta sessão (`npm run dev` em `apps/web`) especificamente para esse teste.

### Post-Review Fixes (AI code-review, 8 ângulos + 1-voto verify)

- ✅ Resolvido [Alto, correção]: a resposta podia ser cortada pelo `max_tokens` (especialmente os 400 tokens de melancolia intensa) sem que nada detectasse o corte — o texto truncado era persistido e exibido como se estivesse completo, arriscando encerrar uma resposta a um usuário angustiado no meio de uma frase, antes da pergunta reflexiva de fechamento que o `BASE_SYSTEM_PROMPT` exige. Corrigido em `route.ts`: `finalMessage()` agora tem seu `stop_reason` inspecionado; quando é `"max_tokens"`, um `console.warn` registra o corte (sessão, estado, intensidade, orçamento) para diagnóstico — a resposta parcial ainda é persistida (perder a resposta inteira seria pior que entregá-la truncada), mas o truncamento deixa de ser silencioso.
- ✅ Resolvido [Médio, eficiência]: `detectEmotionalIntensity` refazia uma segunda passada completa de regex (`message.toLowerCase()` + `countSignals`) sobre a mesma mensagem que `detectEmotionalState` já tinha escaneado uma linha antes, em todo request de chat. Corrigido com nova função `analyzeEmotionalState(message)` (`emotional-state.ts`) que calcula os scores uma única vez e deriva estado e intensidade juntos; `detectEmotionalState` passou a ser implementado em cima dela (sem duplicar a lógica de escolha do vencedor). `route.ts` e `scripts/agent-test.ts` agora usam `analyzeEmotionalState` em vez de duas chamadas separadas. `detectEmotionalIntensity` foi mantida como estava (aceita um `state` arbitrário, usada assim pelos testes) para não quebrar sua API.
- ✅ Resolvido [Médio, altitude/nomenclatura]: a constante `CRISIS_MAX_TOKENS` sugeria detecção de crise, mas era só um limite de tokens para melancolia intensa via contagem de 3+ palavras-chave — risco de confundir a futura Story 2.5 (fluxo de crise dedicado, ver `epics.md`), que é quem de fato deve tratar sinais de risco severo. Renomeada para `INTENSE_MELANCHOLY_MAX_TOKENS`, com comentário explicando que crise é responsabilidade de uma story separada.
- ✅ Resolvido [Baixo, NFR]: `DEEP_ENGAGEMENT_MAX_TOKENS` (resposta mais longa em engajamento intenso não-melancólico) reduzido de 1400 para 1200 — ainda maior que o padrão de 1024 (atende à AC4), mas com um aumento mais conservador (~17% em vez de ~37%) frente à NFR "Resposta do agente < 5s" do `CLAUDE.md`, já que o streaming mitiga mas não elimina o risco de uma geração mais longa.
- ✅ Resolvido [Baixo, simplificação]: `resolveMaxTokens` usava um ternário (`state === "melancholy" ? ... : ...`) em vez de um `Record<EmotionalState, number>` exaustivo como `TONE_MAP`/`INTENSITY_ADDENDUM` — um estado emocional futuro cairia silenciosamente no orçamento de resposta longa, sem erro de compilação para reconsiderar. Corrigido com `HIGH_INTENSITY_MAX_TOKENS: Record<EmotionalState, number>`.
- ✅ Resolvido [Baixo, simplificação]: `INTENSITY_ADDENDUM` tinha 3 entradas (`inflated`/`confused`/`neutral`) quase idênticas, com só uma cláusula curta trocada — sem diferença real de instrução para o modelo além do que `TONE_MAP` já cobre. Colapsadas numa constante compartilhada `DEEPEN_ENGAGEMENT_ADDENDUM`, mantendo apenas a de `melancholy` (genuinamente distinta) separada.
- ✅ Resolvido [Baixo, test-coverage]: `scripts/agent-test.ts` (ferramenta manual de validação do prompt) ainda chamava `buildSystemPrompt(state)` sem intensidade — quem usasse o script para validar a Story 2.2 manualmente nunca veria o comportamento de brevidade/aprofundamento. Atualizado para usar `analyzeEmotionalState` + `resolveMaxTokens`, espelhando o `route.ts` (a divergência de `model`/`thinking` entre o script e o Route Handler é pré-existente da Story 1.1 e ficou fora do escopo desta correção).
- Não endereçado (achados refutados na verificação, sem ação necessária): risco de exceção não tratada em `route.ts` nas novas chamadas síncronas (nenhuma delas tem caminho real de `throw` dado o código atual — e o mesmo padrão já existia antes desta story); suposta sobreposição de instrução entre `TONE_MAP.melancholy` e `INTENSITY_ADDENDUM.melancholy` (são instruções complementares — tom geral vs. comprimento sob intensidade alta —, não uma cópia redundante).
- 5 novos testes/casos nesta rodada: `analyzeEmotionalState` (4, `emotional-state.test.ts`), 1 em `prompts.test.ts` (trava o compartilhamento do `DEEPEN_ENGAGEMENT_ADDENDUM`), 2 em `route.test.ts` (log de truncamento por `stop_reason`, e ausência do log quando a resposta termina normalmente).
- Suíte completa após as correções: **154 testes passando**. `tsc --noEmit` (raiz + `apps/web`), `eslint` e `next build` sem erros.

## File List

- `apps/web/src/lib/agent/emotional-state.ts` (modificado — novo tipo `EmotionalIntensity`, função `detectEmotionalIntensity`; ajustado no review — nova função `analyzeEmotionalState` computando estado+intensidade numa só passada, `detectEmotionalState` reimplementada em cima dela)
- `apps/web/src/lib/agent/emotional-state.test.ts` (modificado — testes de `detectEmotionalIntensity`; ajustado no review — testes de `analyzeEmotionalState`)
- `apps/web/src/lib/agent/prompts.ts` (modificado — `buildSystemPrompt` aceita `intensity` opcional com instrução de comprimento; nova função `resolveMaxTokens`; ajustado no review — `CRISIS_MAX_TOKENS` renomeada para `INTENSE_MELANCHOLY_MAX_TOKENS`, `DEEP_ENGAGEMENT_MAX_TOKENS` reduzida para 1200, `resolveMaxTokens` usa `Record` exaustivo, `INTENSITY_ADDENDUM` colapsado com `DEEPEN_ENGAGEMENT_ADDENDUM` compartilhado)
- `apps/web/src/lib/agent/prompts.test.ts` (modificado — testes de intensidade em `buildSystemPrompt` e de `resolveMaxTokens`; ajustado no review — teste do addendum compartilhado)
- `apps/web/src/app/api/chat/route.ts` (modificado — usa `detectEmotionalState`/`detectEmotionalIntensity` em vez de `"neutral"` fixo; `max_tokens` dinâmico via `resolveMaxTokens`; ajustado no review — usa `analyzeEmotionalState`, loga truncamento via `stop_reason`)
- `apps/web/src/app/api/chat/route.test.ts` (modificado — testes de tom/orçamento de tokens por estado emocional; `streamMock` tipado; ajustado no review — `createFakeMessageStream` aceita `stopReason`, novos testes de log de truncamento)
- `scripts/agent-test.ts` (ajustado no review — usa `analyzeEmotionalState`/`resolveMaxTokens` em vez de `buildSystemPrompt` sem intensidade)

## Change Log

- 2026-07-18: Detecção de estado emocional conectada ao Route Handler `/api/chat` (antes fixo em `"neutral"`, herdado da Story 2.1); adicionada detecção de intensidade emocional (`detectEmotionalIntensity`) e adaptação de comprimento de resposta por tom/intensidade (`resolveMaxTokens` + instrução textual no system prompt) — Story 2.2. 147 testes passando.
- 2026-07-18: Aplicadas 7 correções de code review (detecção/log de truncamento por `stop_reason`, `analyzeEmotionalState` eliminando passada dupla de regex, renomeação de `CRISIS_MAX_TOKENS`, orçamento de tokens de engajamento profundo reduzido de 1400 para 1200, `Record` exaustivo em `resolveMaxTokens`, `INTENSITY_ADDENDUM` colapsado, `scripts/agent-test.ts` atualizado) — 154 testes passando.
