# Story 2.5: Fluxo de Crise — Resposta a Sinais de Risco Severo

Status: review

## Story

As a usuário que menciona uma crise severa (pensamentos suicidas, abandono de medicação),
I want que o agente reconheça a gravidade e me direcione a ajuda profissional,
so that eu não fique apenas em uma reflexão estruturada quando preciso de ajuda imediata.

## Acceptance Criteria

1. **Given** uma mensagem do usuário contendo sinais explícitos de crise severa, **when** o agente processar o texto, **then** a resposta prioriza reconhecimento e direcionamento seguro a recursos de crise e ajuda profissional.
2. **Given** o fluxo de crise, **when** a resposta for gerada, **then** ela comunica claramente os limites do app e orienta para ajuda imediata.
3. **Given** a mensagem de crise, **when** o limite diário de mensagens estiver ativo, **then** a resposta de crise ainda é entregue sem ser bloqueada.

## Tasks / Subtasks

- [x] Implementar a detecção de sinais de crise severa.
- [x] Garantir uma resposta acolhedora e segura com direcionamento apropriado.

## Dev Agent Record

### Implementation Plan

- Nova lib `src/lib/agent/crisis.ts`, independente de `emotional-state.ts` (a intensidade "high" de melancolia não é crise — ver comentário já existente em `prompts.ts`). Exporta `detectCrisisSignal(message)` (heurística de substring com frases explícitas em PT-BR, com e sem acento, para ideação suicida, autolesão e abandono de medicação) e a constante `CRISIS_RESPONSE_MESSAGE`.
- Decisão de produto (confirmada com o usuário): a resposta de crise é um **texto fixo e pré-revisado**, não gerado pelo LLM — evita risco do modelo omitir/suavizar/alucinar os recursos de ajuda no momento mais delicado. Copy segue a referência de `ux-design-specification.md` ("Cenário Crítico"): "Você está em crise. Fale com profissional agora. Aqui é espaço para depois." Inclui CVV (188 / cvv.org.br), emergência (192/190) e orientação sobre abandono de medicação.
- `route.ts`: sinais de crise são checados na mensagem **crua** do corpo da requisição, antes da validação de tamanho mínimo (10 caracteres) do `chatRequestSchema` — assim uma mensagem curta como "overdose" (8 caracteres) ainda dispara o fluxo de crise em vez de receber um erro de validação genérico. Essa checagem também fica posicionada à frente de onde a futura Story 2.6 (limite diário) fará sua checagem — comentário explícito nesse ponto para o bypass futuro. A mensagem do usuário continua sendo persistida normalmente. Quando `isCrisis` é verdadeiro, o handler persiste `CRISIS_RESPONSE_MESSAGE` como mensagem do assistente (com try/catch e log de erro) **antes** de responder, e retorna um `Response` simples (sem `ReadableStream`, já que o texto inteiro é conhecido de antemão) com o header `X-Crisis-Response: true` — sem chamar a Anthropic API.

### Completion Notes

- 24 testes em `crisis.test.ts` (ideação suicida, autolesão, abandono de medicação, variantes com/sem acento, negação explícita ("não penso em suicídio"), idiomatismos comuns ("morrer de rir", "overdose de cafeína"), proteção de limite de palavra, menção a terceiros, e conteúdo da mensagem fixa).
- 10 testes em `route.test.ts` cobrindo o fluxo de crise (bypass da Anthropic API, header `X-Crisis-Response`, bypass do mínimo de 10 caracteres, persistência mesmo com falha no insert, sessão reutilizada, e não-desvio quando o sinal está negado).
- 2 testes em `ChatWindow.test.tsx` (medidor de profundidade não avança em resposta de crise, avança normalmente em resposta comum).
- Suíte completa: 237 testes passando (32 arquivos). `npx eslint` e `npx tsc --noEmit` sem erros.
- AC3 (bypass do limite diário) é hoje trivialmente satisfeito porque a Story 2.6 ainda não existe; a checagem de crise roda antes de qualquer futura porta de bloqueio, com comentário explícito, para que a 2.6 possa consultar `isCrisis` e pular o bloqueio sem retrabalho.

**Correções aplicadas após code review** (9 achados, todos corrigidos):
- Negação: `detectCrisisSignal` agora ignora um sinal imediatamente precedido por "não"/"nao"/"nunca"/"jamais" (só a negação diretamente adjacente ao sinal, para não suprimir um sinal real só porque "não" apareceu antes em outro trecho da frase).
- Menção a terceiros: `CRISIS_RESPONSE_MESSAGE` foi reescrita para cobrir tanto "é você" quanto "é alguém que você conhece", já que a heurística não distingue com segurança entre os dois casos.
- Falsos positivos por idiomatismo: lista de sufixos seguros ("de rir", "de cafeína", "de série" etc.) que, logo após o sinal, suprimem o match (ex.: "quero morrer de rir", "overdose de cafeína").
- Proteção de limite de palavra: `detectCrisisSignal` agora exige início de palavra (mesma técnica de `emotional-state.ts`), evitando que um sinal curto capture como substring de uma palavra maior não relacionada.
- Mínimo de 10 caracteres bloqueava mensagens de crise muito curtas ("overdose", "me cortar"): a checagem de crise agora roda sobre o corpo bruto da requisição, antes da validação de schema.
- Ordem enqueue-antes-de-persistir causava UX contraditória (texto de crise + banner de erro) e duplicava a linha da mensagem em um retry: a persistência agora acontece antes da resposta ser montada, com try/catch e log, sem nunca sinalizar erro de stream para esse caminho.
- Branch de crise sem try/catch: adicionado, com `console.error` para qualquer falha (retornada ou lançada) ao salvar a resposta.
- Medidor de profundidade avançava numa resposta de crise: `ChatWindow.tsx` agora lê o header `X-Crisis-Response` e pula o incremento de profundidade nesse caso.
- Simplificação: o branch de crise deixou de usar `ReadableStream`/`TextEncoder` (desnecessário para uma string já conhecida por inteiro) e passou a retornar um `Response` direto.

### File List

- `apps/web/src/lib/agent/crisis.ts` (novo)
- `apps/web/src/lib/agent/crisis.test.ts` (novo)
- `apps/web/src/app/api/chat/route.ts` (modificado)
- `apps/web/src/app/api/chat/route.test.ts` (modificado)
- `apps/web/src/components/chat/ChatWindow.tsx` (modificado)
- `apps/web/src/components/chat/ChatWindow.test.tsx` (modificado)

### Change Log

- 2026-07-20: Implementado fluxo de crise (detecção heurística + resposta fixa com recursos de ajuda), com bypass total do LLM e posicionamento para futuro bypass do limite diário de mensagens (Story 2.6).
- 2026-07-20: Aplicadas 9 correções de code review (negação, menção a terceiros, falsos positivos por idiomatismo, limite de palavra, bypass do mínimo de caracteres, ordem de persistência/entrega, logging, medidor de profundidade, simplificação do branch de crise).
