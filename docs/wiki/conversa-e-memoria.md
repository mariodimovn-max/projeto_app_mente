---
titulo: Conversa, Memória e Histórico de Sessões
epico: "2, 3"
status: completo
ultima_atualizacao: 2026-09-22
depende_de: [auth]
relacionado: [insights-e-resumos, ui-e-navegacao]
decisoes: [0005-resumo-deterministico-sem-ia]
tags: [chat, streaming, memoria, sintese, historico, crise, voz]
---

# Conversa, Memória e Histórico de Sessões (Epic 2 + Epic 3)

## O que faz

O núcleo do app: conversa com a IA (FR-2), memória persistente entre sessões (FR-3), síntese ao
final de cada sessão (FR-5) e histórico navegável (FR-4).

### Conversação (Epic 2 — completo)

Chat com streaming, adaptação de tom conforme estado emocional detectado (baixa autoestima →
reconfortante, ego inflado → reflexivo/provocador, neutro → equilibrado), gravação e transcrição de
voz (Web Speech API), edição da transcrição antes de enviar, fluxo de crise com resposta fixa a
sinais de risco severo, limite diário de mensagens, indicador de "pensando" e recuperação de erros
com retry manual. Dois redesigns visuais aplicados sobre essa base ("Aura", depois o modelo único
com medidor de profundidade).

### Memória e Síntese (Epic 3 — completo)

- **3.1 — Encerrar Sessão e Gerar Síntese:** síntese gerada via Anthropic API, separada da chamada
  de chat (não-streaming); tabela `session_syntheses`; `SynthesisCard`; botão manual "Encerrar
  sessão" e encerramento automático por 60 min de inatividade.
- **3.2 — Reagir à Síntese:** `SynthesisReactionDock` embutido no `SynthesisCard`; emoji ou
  comentário curto mutuamente exclusivos; tabela `session_synthesis_reactions` (RLS, upsert por
  síntese).
- **3.3 — Agregação de Padrões Longitudinais:** tabela `user_patterns` — agregado incremental de
  temas/emoções/gatilhos por usuário (mapas jsonb de contagem, RLS); síntese estendida para gerar
  `emotions`/`triggers`; `endSession` atualiza o agregado ao final de cada sessão (best-effort, sem
  duplicar contagem em chamadas concorrentes); aviso de privacidade (`PatternPrivacyNotice`) na
  primeira análise.
- **3.4 — Memória em Camadas:** `buildMemoryContext` junta as últimas 5 sínteses de sessões
  anteriores com o agregado `user_patterns` num bloco de texto compacto; `/api/chat` injeta esse
  bloco no prompt (`buildSystemPrompt` recebe `memoryContext`); best-effort e fora do fluxo de
  crise; nunca reenvia histórico bruto de outras sessões.
- **3.5 — Histórico de Sessões:** rota `/historico` (lista cronológica, busca local por
  palavra-chave/tema, cartões com data/hora, título, chips de tema, badge de síntese, selo
  "Privado", destaque "Última sessão") e `/historico/[sessionId]` (sessão completa + `SynthesisCard`);
  ações rápidas Revisar/Marcar/Excluir por swipe ou botão acessível "⋯".
- **3.6 — Abertura Adaptativa:** `buildSessionOpeningContext` decide se é a primeira sessão do
  usuário; quando não é, recupera a frase de abertura da sessão anterior, o padrão de resposta
  recente (curto/longo) e os temas mais recorrentes; `buildSystemPrompt` ganha `openingContext` que
  instrui o agente a nunca repetir a frase da sessão anterior; busca acontece sempre que o
  assistente ainda não respondeu na sessão (resiliente a retry), best-effort, fora do fluxo de
  crise.

### Correções pré-beta

Auto-scroll do chat (ref sentinela + `useEffect` a cada mudança de mensagens/thinking) e Enter para
enviar / Shift+Enter para nova linha (respeitando IME via `isComposing`) — nenhum dos dois existia
antes da correção.

## Onde está no código

- `apps/web/src/lib/agent/prompts.ts`, `emotional-state.ts`, `memory.ts`, `sessionOpeningContext.ts`,
  `synthesis.ts`, `crisis.ts`
- `apps/web/src/app/api/chat/route.ts` — único Route Handler real do app, streaming, runtime Node.js
- `apps/web/src/lib/actions/endSession.ts`, `resumeSession.ts`, `sessionHistory.ts`,
  `synthesisReaction.ts`
- `apps/web/src/components/chat/`, `apps/web/src/components/history/`
- `apps/web/src/app/chat/`, `apps/web/src/app/historico/`

## Decisões e padrões

- Resumos/insights reusam dado já abstraído por `session_syntheses`, não reprocessam mensagens
  brutas — ver [0005](../adr/0005-resumo-deterministico-sem-ia.md).
- `lib/agent/sessionOpeningContext.ts` existe separado de `memory.ts` deliberadamente: evita que o
  grafo de imports de `prompts.ts` arraste `@/lib/supabase/server`/`crisis`/`userPatterns` para
  dentro do `tsconfig.json` da raiz (que não resolve alias `@/*` nem tipos DOM) — isso já quebrou o
  `npm run typecheck` da raiz uma vez.

## Gotchas conhecidos

- Toda injeção de memória/contexto no prompt é best-effort e **nunca acontece no fluxo de crise** —
  não adicionar novo contexto ali sem preservar essa exclusão.
- Retomar sessão pela navegação principal depende do `sessionId` guardado em `sessionStorage` e da
  Server Action `resumeSession` — ver [ui-e-navegacao.md](ui-e-navegacao.md).

## Pendências

Ver [pendencias-manuais.md](pendencias-manuais.md) — migrations de `session_synthesis_reactions`,
`user_patterns` e `session_history_actions` precisam ser aplicadas manualmente no Supabase.
