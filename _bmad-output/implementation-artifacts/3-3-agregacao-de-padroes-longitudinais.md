# Story 3.3: Agregação de Padrões Longitudinais

Status: done

## Story

As a desenvolvedor construindo a base para insights de longo prazo,
I want que temas, emoções e gatilhos recorrentes sejam agregados automaticamente após cada sessão,
so that o dashboard e os resumos periódicos leiam um agregado pronto, sem recalcular do zero.

## Acceptance Criteria

1. **Given** uma síntese de sessão recém-gerada, **when** o processo de encerramento de sessão for concluído, **then** a tabela `user_patterns` é atualizada com os temas, emoções e gatilhos identificados.
2. **Given** o agregado em andamento, **when** a sessão terminar, **then** o valor é incremental e incorpora o histórico acumulado do usuário.
3. **Given** o uso do histórico para análise, **when** for a primeira vez, **then** um aviso de privacidade é exibido ao usuário antes da análise.

## Tasks / Subtasks

- [x] Implementar a atualização incremental de `user_patterns`.
- [x] Garantir a exposição do aviso de privacidade na primeira análise.

## Dev Agent Record

### Implementation Plan

- Nova tabela `user_patterns` (migration `20260728100000_user_patterns.sql`): uma linha por
  usuário (`user_id` como chave primária, `references auth.users(id) on delete cascade`), com
  três mapas `jsonb` (`themes`, `emotions`, `triggers` — cada um `{ rótulo: contagem }`) e
  `session_count`. RLS restrita ao próprio usuário (`auth.uid() = user_id`), seguindo o padrão
  já usado em `sessions`. Um agregado de contagem por rótulo (em vez de guardar a lista bruta de
  sessões) mantém a leitura barata para o dashboard/prompt futuros (Stories 3.4/4.2), conforme
  `architecture.md` ("user_patterns é a única fonte de leitura do dashboard/insights").
- `sessionSynthesisContentSchema` (`lib/validation/synthesis.ts`) ganhou `emotions` (1-3) e
  `triggers` (0-3) — gerados pela mesma chamada estruturada à Anthropic API que já produz
  título/temas/padrões/pergunta aberta (Story 3.1), em vez de uma segunda chamada só para
  isso. `triggers` aceita lista vazia porque nem toda sessão tem um gatilho identificável com
  segurança. Esses dois campos não são persistidos em `session_syntheses` nem exibidos no
  `SynthesisCard` — alimentam só o agregado `user_patterns`, que é o único requisito do AC1.
- `lib/patterns/userPatterns.ts` (novo): `updateUserPatterns(supabase, userId, { themes,
  emotions, triggers })` lê o agregado existente do usuário, funde as contagens (rótulos
  normalizados por `trim().toLowerCase()`, para que variações de capitalização da IA entre
  sessões — "Sono" vs "sono" — acumulem no mesmo rótulo) e faz upsert com `session_count`
  incrementado. Retorna `isFirstAnalysis` (verdadeiro só quando não havia linha prévia para o
  usuário) — usado para decidir o aviso de privacidade (AC3). Não é atômico (lê, funde em
  memória, grava) — duas sessões do mesmo usuário terminando no mesmo instante poderiam perder
  um incremento; aceitável para o volume de um beta fechado, mesmo compromisso já assumido
  noutras partes do MVP (ex.: `endSession.ts`).
- `endSession.ts` chama `updateUserPatterns` só no caminho em que a síntese foi de fato
  inserida (não no caminho de recuperação por conflito de unicidade — chamadas concorrentes
  para a mesma sessão —, para não contar a mesma sessão duas vezes no agregado). A chamada é
  best-effort: envolvida em `try/catch` própria, com erro logado mas sem derrubar o retorno da
  síntese já salva (a agregação é um efeito colateral secundário; falhar nela não deveria
  esconder do usuário uma síntese que já foi gerada e persistida com sucesso). O retorno de
  `endSession` ganhou `showPatternPrivacyNotice: boolean`.
- `PatternPrivacyNotice` (novo, `components/insights/`): aviso informativo — não bloqueia nem
  exige confirmação — renderizado acima do `SynthesisCard` só quando `showPatternPrivacyNotice`
  vier `true` do servidor (Story 3.3, AC3/FR-4). Como o servidor só sinaliza isso na primeira
  agregação de cada usuário, o aviso nunca mais aparece depois de dispensado uma vez ("Entendi"
  só esconde localmente; nada precisa ser persistido para lembrar que já foi mostrado).
  Integrado em `ChatWindow` ao lado do `SynthesisCard`, mesmo padrão visual/estrutural do
  `SessionRestedNotice` já existente.

### Completion Notes

- `lib/patterns/userPatterns.ts` + teste (5 casos): primeira análise (sem linha prévia),
  incremento sobre agregado existente, normalização de rótulo por capitalização, propagação de
  erro na leitura e no upsert.
- `lib/agent/synthesis.ts`/`lib/validation/synthesis.ts`: prompt e schema atualizados com
  `emotions`/`triggers`; teste de `synthesis.test.ts` ajustado para os novos campos
  obrigatórios/opcionais.
- `lib/actions/endSession.ts` + teste (5 novos casos, 12 no total no arquivo): agregação
  disparada e `showPatternPrivacyNotice: true` só sem linha prévia; nenhuma agregação/segunda
  contagem no caminho de recuperação por conflito de unicidade; síntese retornada normalmente
  (com `showPatternPrivacyNotice: false`) quando a agregação falha.
- `components/insights/PatternPrivacyNotice.tsx` + `.module.css` + teste: exibição do aviso e
  dispensa local ao clicar "Entendi".
- `components/chat/ChatWindow.tsx` + teste (1 novo caso): aviso renderizado acima da síntese
  revelada quando `showPatternPrivacyNotice` vem `true`, ausente quando `false`.
- Suíte completa: 311 testes passando (42 arquivos) — 1 teste de `route.test.ts` (runtime
  Node.js) que dá timeout só sob carga da suíte completa, não relacionado a esta story
  (confirmado passando isoladamente). `npm run typecheck` sem erros.
- **Nota para o próximo ambiente (mesma lacuna já registrada nas Stories 3.1/3.2):** a
  migration `supabase/migrations/20260728100000_user_patterns.sql` precisa ser aplicada
  manualmente no Supabase (Dashboard ou `supabase db push`) — nenhuma automação de deploy de
  schema existe neste projeto.

### File List

- `supabase/migrations/20260728100000_user_patterns.sql` (novo)
- `apps/web/src/lib/validation/synthesis.ts` (modificado)
- `apps/web/src/lib/agent/synthesis.ts` (modificado)
- `apps/web/src/lib/agent/synthesis.test.ts` (modificado)
- `apps/web/src/lib/patterns/userPatterns.ts` (novo)
- `apps/web/src/lib/patterns/userPatterns.test.ts` (novo)
- `apps/web/src/lib/actions/endSession.ts` (modificado)
- `apps/web/src/lib/actions/endSession.test.ts` (modificado)
- `apps/web/src/components/insights/PatternPrivacyNotice.tsx` (novo)
- `apps/web/src/components/insights/PatternPrivacyNotice.module.css` (novo)
- `apps/web/src/components/insights/PatternPrivacyNotice.test.tsx` (novo)
- `apps/web/src/components/chat/ChatWindow.tsx` (modificado)
- `apps/web/src/components/chat/ChatWindow.test.tsx` (modificado)

### Change Log

- 2026-07-28: Implementada a agregação incremental de padrões longitudinais (AC1/AC2): nova
  tabela `user_patterns` (temas/emoções/gatilhos como mapas de contagem por usuário), síntese
  estendida para gerar `emotions`/`triggers`, e `endSession` atualizando o agregado ao final de
  cada sessão (best-effort, sem duplicar contagem em chamadas concorrentes). Aviso de
  privacidade (AC3) exibido uma única vez, na primeira agregação de cada usuário, via novo
  componente `PatternPrivacyNotice` integrado ao `ChatWindow`.
- 2026-07-28: Aplicadas 4 correções de code review (revisão em 3 camadas: Blind Hunter, Edge
  Case Hunter, Acceptance Auditor): aviso de privacidade agora também aparece no encerramento
  automático por inatividade, antes de o usuário revelar a síntese (não só depois); rótulos
  duplicados dentro da mesma sessão não inflam mais a contagem no agregado; copy do aviso não
  promete mais exportação/deleção que ainda não existe; prompt de `emotions` ganhou instrução de
  fallback honesto para sessões sem carga emocional clara. 1 achado de decisão resolvido pelo
  usuário (manter o aviso informativo, não bloqueante). 5 achados de baixa severidade,
  pré-existentes ou fora do escopo, adiados para `deferred-work.md`. Suíte final: 312 testes
  passando (42 arquivos). `npm run typecheck` sem erros.

### Review Findings

- [x] [Review][Decision→Dismiss] AC3 diz que o aviso de privacidade deve aparecer "antes da análise" — hoje `updateUserPatterns` já leu o histórico acumulado e gravou o agregado antes de `endSession` sinalizar `showPatternPrivacyNotice` ao cliente; é uma divulgação depois do fato, não um gate antes da análise. [apps/web/src/lib/actions/endSession.ts:150-174] — **decisão do usuário:** manter o aviso informativo/não-bloqueante como está, sem redesenhar como gate bloqueante. Bate com a redação leve da task ("garantir a exposição do aviso", não "bloquear até confirmação") e com o padrão do resto do app, que nunca bloqueia por confirmação.
- [x] [Review][Patch] O aviso de privacidade fica aninhado só dentro do branch `synthesis && synthesisRevealed` — no encerramento automático por inatividade (`trigger === "auto"`), `synthesisRevealed` começa `false` e a síntese fica escondida atrás do `SessionRestedNotice`; se o usuário nunca clicar "Ver a síntese", o aviso da primeira análise nunca aparece, apesar de `user_patterns` já ter sido populado. Como a flag `isFirstAnalysis` é consumida no momento da agregação (não da exibição), essa é a única chance de mostrar o aviso e ela pode se perder para sempre. [apps/web/src/components/chat/ChatWindow.tsx:293-301] — corrigido: `PatternPrivacyNotice` agora também renderizado ao lado do `SessionRestedNotice`, antes da revelação; novo teste cobrindo o caminho automático.
- [x] [Review][Patch] `mergeCounts` conta cada item da lista de uma sessão sem deduplicar — se a IA retornar rótulos que normalizam para a mesma chave dentro da mesma sessão (ex.: `themes: ["Sono", "sono"]`), a contagem daquela sessão para "sono" sobe 2 em vez de 1, distorcendo o agregado. [apps/web/src/lib/patterns/userPatterns.ts:36-44] — corrigido: rótulos deduplicados (via `Set`) antes de incrementar; novo teste cobrindo rótulos repetidos na mesma sessão.
- [x] [Review][Patch] `PatternPrivacyNotice` promete que os dados "podem ser exportados ou apagados quando quiser" — não existe exportação/deleção de `user_patterns` implementada (Epic 5 ainda não construído), o que contraria o valor de honestidade do projeto ("não criar ilusão de capacidades que o app não tem"). [apps/web/src/components/insights/PatternPrivacyNotice.tsx] — corrigido: copy reescrita para não prometer uma capacidade que ainda não existe.
- [x] [Review][Patch] O prompt de `emotions` não tem a mesma orientação de "fallback honesto" que `patterns` já tem para sessões sem conteúdo claro ("se não houver um padrão claro, inclua pelo menos uma observação honesta") — como `emotions` exige `min(1)`, uma sessão neutra pressiona o modelo a inventar uma emoção em vez de descrever honestamente a ausência de uma. [apps/web/src/lib/agent/synthesis.ts] — corrigido: instrução adicionada para descrever o tom predominante (ex.: "neutralidade") em vez de inventar uma emoção.
- [x] [Review][Defer] `updateUserPatterns` faz leitura → fusão em memória → upsert sem lock/token de concorrência — duas sessões do mesmo usuário terminando ao mesmo tempo (duas abas, ou automático coincidindo com manual em sessões diferentes) podem perder um incremento. [apps/web/src/lib/patterns/userPatterns.ts:49-71] — deferred, risco de baixa probabilidade para o volume de um beta fechado, já assumido explicitamente no Dev Agent Record; corrigir exigiria uma função SQL atômica, padrão ainda inexistente neste projeto
- [x] [Review][Defer] Sessões antigas (anteriores a esta story) não contribuem retroativamente para `user_patterns` — o agregado só passa a acumular a partir do próximo `endSession` depois do deploy. [apps/web/src/lib/patterns/userPatterns.ts] — deferred, fora do escopo do AC (fala em "sessão recém-gerada"), um script de backfill fica para quando o dashboard/resumos (Stories 3.4/4.2) tornarem isso visível
- [x] [Review][Defer] Falha na agregação (`updateUserPatterns`) é só logada via `console.error`, sem fila de retry nem alerta — uma falha transitória descarta silenciosamente a contribuição daquela sessão ao agregado. [apps/web/src/lib/actions/endSession.ts:154-169] — deferred, consistente com a filosofia de tratamento de erro já usada em todo o projeto (Vercel logs nativos; Sentry é evolução pós-beta por `architecture.md`)
- [x] [Review][Defer] As colunas `jsonb` de `user_patterns` não têm nenhuma restrição de formato no banco — dependem inteiramente da aplicação manter o formato `{ rótulo: contagem }`. [supabase/migrations/20260728100000_user_patterns.sql] — deferred, mesmo nível de confiança na aplicação já usado em `session_syntheses.themes` (`text[]` sem validação adicional no banco)
- [x] [Review][Defer] Rótulos individuais de tema/emoção/gatilho não têm limite máximo de tamanho (só `min(1)` após trim). [apps/web/src/lib/validation/synthesis.ts] — deferred, lacuna pré-existente já presente em `themes`/`patterns` desde a Story 3.1, não introduzida por esta diff
