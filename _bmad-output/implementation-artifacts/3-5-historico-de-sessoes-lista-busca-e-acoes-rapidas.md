# Story 3.5: Histórico de Sessões — Lista, Busca e Ações Rápidas

Status: done

## Story

As a usuário querendo revisitar conversas passadas,
I want ver uma lista cronológica das minhas sessões com busca por tema ou data,
so that eu encontre rapidamente uma conversa específica sem rolar tudo manualmente.

## Acceptance Criteria

1. **Given** um usuário com uma ou mais sessões concluídas, **when** ele acessar a tela de Histórico, **then** ele vê uma lista cronológica com data/hora, título gerado, chips de tema, badge de síntese disponível e selo de privacidade.
2. **Given** a lista de sessões, **when** o usuário buscar por palavra-chave ou tema, **then** os resultados aparecem em menos de 1 segundo.
3. **Given** um cartão de sessão, **when** o usuário deslizar para as ações rápidas, **then** ele consegue revisar, marcar ou excluir a sessão com confirmação.
4. **Given** um cartão selecionado, **when** ele for aberto, **then** a sessão completa com síntese é exibida.

## Tasks / Subtasks

- [x] Implementar a tela de histórico e lista cronológica.
- [x] Adicionar busca e ações rápidas por sessão.

### Review Findings

- [x] [Review][Patch] `confirmingDelete` não é resetado ao fechar o painel de ações por swipe ou pelo botão "⋯" — reabrir cai direto na confirmação de exclusão em vez de Revisar/Marcar/Excluir [apps/web/src/components/history/HistoryCard.tsx]
- [x] [Review][Patch] Painel de confirmação de exclusão usa `width: 100%` dentro de uma camada que cobre o cartão inteiro, mas só os 216px revelados pelo swipe ficam visíveis — texto/botões saem cortados ou desalinhados [apps/web/src/components/history/HistoryCard.module.css]
- [x] [Review][Patch] `setSessionMarked` valida `sessionId` com zod mas não `marked` — um valor não-booleano passaria direto para o `.update()` [apps/web/src/lib/actions/sessionHistory.ts]
- [x] [Review][Patch] Handlers de arraste não rastreiam `pointerId` — um segundo toque simultâneo sobrescreve `dragStartX`/`dragBaseline` do primeiro e corrompe o estado do swipe [apps/web/src/components/history/HistoryCard.tsx]
- [x] [Review][Patch] Sem guarda de desmontagem em `handleToggleMark`/`handleConfirmDelete` — se "Excluir" resolver primeiro e desmontar o cartão, um "Marcar" ainda em voo chama `setState` num componente já desmontado [apps/web/src/components/history/HistoryCard.tsx]
- [x] [Review][Patch] Formatação de data não distingue sessões antigas de recentes, como pede `ux-patterns.md` ("Sessões mais antigas aparecem com data completa; recentes exibem apenas o dia e a hora") [apps/web/src/components/history/HistoryCard.tsx]
- [x] [Review][Patch] Falta o status "sem síntese" — `ux-patterns.md` pede três estados por item ("síntese disponível" / "sem síntese" / "mais recente"), só o primeiro está implementado [apps/web/src/components/history/HistoryCard.tsx]
- [x] [Review][Defer] Lista de sessões (`listSessionHistory`) não é paginada — cresce sem limite conforme o histórico do usuário aumenta [apps/web/src/lib/history/sessions.ts] — deferred, fora de escopo para o volume de um beta fechado
- [x] [Review][Defer] Excluir uma sessão não reverte sua contribuição ao agregado `user_patterns` (temas/emoções/gatilhos ficam contados para sempre) [apps/web/src/lib/actions/sessionHistory.ts] — deferred, exigiria persistir emoções/gatilhos por sessão (mudança de schema fora do escopo desta story); a copy de confirmação já é precisa sobre o que de fato apaga
- [x] [Review][Defer] Policies novas da migration não são idempotentes (`create policy` sem `drop policy if exists`) [supabase/migrations/20260801090000_session_history_actions.sql] — deferred, pre-existing (nenhuma migration do projeto usa esse padrão)
- [x] [Review][Defer] Sem filtro/visão dedicada para sessões marcadas — "Marcar" só adiciona um selo na mesma lista cronológica [apps/web/src/components/history/HistoryList.tsx] — deferred, fora do escopo do AC3 (só pede a ação, não uma visão filtrada)

## Dev Agent Record

### Completion Notes

- Migration `supabase/migrations/20260801090000_session_history_actions.sql`: `sessions` não
  tinha coluna nem policy de update/delete até esta história (só select/insert desde a
  Story 2.x) — adiciona `sessions.marked boolean` e as policies `sessions_update_own`/
  `sessions_delete_own`, mínimo necessário para "Marcar" e "Excluir". Sem soft-delete:
  excluir remove a linha de fato, e `on delete cascade` nas FKs de `messages`/
  `session_syntheses`/`session_synthesis_reactions` já apaga a conversa e a síntese junto.
  **Precisa ser aplicada manualmente no Supabase**, mesma observação das migrations
  anteriores (ver Story 3.1).
- `lib/history/sessions.ts`: `listSessionHistory(supabase, userId)` (AC1) busca sessões e
  sínteses em duas queries separadas — a relação `sessions` → `session_syntheses` é 1:1 via
  índice único, não FK direta, então um embed do PostgREST traria um formato de array
  incerto; duas queries simples + merge em memória evitam essa ambiguidade. Sessões sem
  síntese entram na lista com `title: null`/`themes: []`/`hasSynthesis: false` (não são
  escondidas — o badge "síntese disponível" é o que distingue). `getSessionDetail(supabase,
  userId, sessionId)` (AC4) busca a sessão + mensagens + síntese em paralelo, calcula
  `durationMinutes`/`exchangeCount` do mesmo jeito que `endSession.ts`, e retorna `null`
  quando a sessão não existe ou não pertence ao usuário (RLS já impede a leitura, mas o
  caller precisa distinguir isso de "sessão sem mensagens" para decidir `notFound()`).
- `lib/history/search.ts`: `filterSessionsByQuery` é um filtro síncrono em memória sobre a
  lista já carregada pela página (título + temas, case-insensitive) — não há round-trip ao
  servidor, então o resultado é instantâneo por construção (AC2, "menos de 1 segundo").
- `lib/actions/sessionHistory.ts`: duas Server Actions, mesmo esqueleto de
  `endSession.ts`/`synthesisReaction.ts` (zod, `createClient`, checagem explícita de posse
  antes de agir mesmo com RLS ativa, erro genérico em pt-BR, `try/catch` com log
  estruturado). `setSessionMarked(sessionId, marked)` faz o toggle de "Marcar/Desmarcar".
  `deleteSession(sessionId)` exclui a sessão (cascade cuida do resto) — copy de confirmação
  no cartão segue a sugestão do `ux-patterns.md`: "Excluir esta sessão e suas transcrições
  para sempre?".
- `components/history/HistoryCard.tsx`: cartão de sessão (AC1/AC3/AC4) — corpo inteiro é um
  `<Link>` para `/historico/[id]` (toque abre a sessão), com data/hora, título (ou "Conversa
  sem síntese" quando não há), até 3 chips de tema, badge "Síntese disponível", badge
  "Marcada" quando aplicável, selo "Privado" e rótulo "Última sessão" no primeiro item da
  lista. Ações rápidas (Revisar/Marcar/Excluir) são reveladas tanto por swipe (pointer
  events, arraste horizontal com "snap" para aberto/fechado) quanto por um botão "⋯"
  sempre visível — o botão garante que teclado e leitor de tela alcancem as mesmas ações sem
  depender do gesto, já que o swipe por si só não é acessível. "Excluir" abre um painel de
  confirmação inline (copy do `ux-patterns.md`) antes de chamar a Server Action.
- `components/history/HistoryList.tsx`: estado da lista (busca + sessões, atualizado
  localmente após marcar/excluir sem novo fetch) e o campo de busca (AC2); estado vazio
  quando o usuário não tem nenhuma sessão, e mensagem separada quando a busca não encontra
  nada.
- `app/historico/page.tsx` e `app/historico/[sessionId]/page.tsx`: seguem o mesmo padrão de
  guarda de autenticação de `app/chat/page.tsx` (header `x-app-session-user` repassado pelo
  `proxy.ts`). A busca de dados (`listSessionHistory`/`getSessionDetail`) é envolvida em
  `try/catch` com mensagem amigável em pt-BR em vez de deixar a página quebrar — não havia
  precedente de página que busca lista do Supabase diretamente antes desta história, então
  esse tratamento é nesta história, não um padrão pré-existente. A página de detalhe reusa
  `MessageBubble` e `SynthesisCard` (a `SynthesisCard` já tinha o botão "Ver a conversa"
  desabilitado, comentado como pendente até "essas telas existirem" — permanece desabilitado
  por ora, fora do escopo desta história abrir esse link a partir de lá). `sessionId`
  inválido (não é UUID) ou sessão inexistente/de outro usuário → `notFound()`.
- Link para `/historico`: adicionado no cabeçalho autenticado da landing (`app/page.tsx`,
  "seu espaço"), já que a navegação principal completa (Início/Histórico/Insights) é a
  Story 4.1, fora do escopo desta história — só o mínimo para a tela ficar alcançável.
- Testes novos: `lib/history/sessions.test.ts`, `lib/history/search.test.ts`,
  `lib/actions/sessionHistory.test.ts`, `components/history/HistoryCard.test.tsx`,
  `components/history/HistoryList.test.tsx`, `app/historico/page.test.tsx`,
  `app/historico/[sessionId]/page.test.tsx`, mais 2 casos novos em `app/page.test.tsx`
  (link "Histórico" aparece/some conforme autenticação). Os testes de `HistoryCard` cobrem a
  interação via o botão "⋯" (acessível) em vez do gesto de swipe em si — jsdom não
  implementa a Pointer Capture API dos navegadores reais, e a mesma máquina de estados
  (`open`) é exercida por ambos os caminhos. Suíte completa: 377 testes, todos passando;
  `tsc --noEmit` limpo; `eslint` limpo em todos os arquivos novos/alterados desta história
  (rodado explicitamente por arquivo — o `npm run lint` do projeto também varre
  `.next.bak-stale-cache`, um diretório de cache pré-existente e não rastreado pelo git, que
  não é deste trabalho).

### File List

- supabase/migrations/20260801090000_session_history_actions.sql
- apps/web/src/types/history.ts
- apps/web/src/lib/history/sessions.ts
- apps/web/src/lib/history/sessions.test.ts
- apps/web/src/lib/history/search.ts
- apps/web/src/lib/history/search.test.ts
- apps/web/src/lib/actions/sessionHistory.ts
- apps/web/src/lib/actions/sessionHistory.test.ts
- apps/web/src/components/history/HistoryCard.tsx
- apps/web/src/components/history/HistoryCard.module.css
- apps/web/src/components/history/HistoryCard.test.tsx
- apps/web/src/components/history/HistoryList.tsx
- apps/web/src/components/history/HistoryList.module.css
- apps/web/src/components/history/HistoryList.test.tsx
- apps/web/src/app/historico/page.tsx
- apps/web/src/app/historico/page.module.css
- apps/web/src/app/historico/page.test.tsx
- apps/web/src/app/historico/[sessionId]/page.tsx
- apps/web/src/app/historico/[sessionId]/page.module.css
- apps/web/src/app/historico/[sessionId]/page.test.tsx
- apps/web/src/app/page.tsx
- apps/web/src/app/page.module.css
- apps/web/src/app/page.test.tsx

## Change Log

- 2026-08-01: Implementada a tela de Histórico (AC1-AC4): lista cronológica de sessões com
  busca local por palavra-chave/tema, cartões com ações rápidas (Revisar/Marcar/Excluir) via
  swipe ou botão acessível, e página de detalhe da sessão com a síntese. Nova migration
  adiciona `sessions.marked` e as policies de update/delete que faltavam.
- 2026-08-01: Code review — 7 patches aplicados (reset de `confirmingDelete` ao fechar o
  painel por qualquer caminho; largura do painel de confirmação corrigida para caber na área
  revelada pelo swipe; validação zod de `marked`; rastreio de `pointerId` no arraste para
  resistir a multi-touch; guarda de desmontagem em marcar/excluir; formatação de data
  distinguindo sessões antigas/recentes; status "Sem síntese" adicionado), 4 itens adiados
  para `deferred-work.md` (paginação da lista, reversão do agregado `user_patterns` ao
  excluir, idempotência das policies da migration, filtro de sessões marcadas), 4 descartados
  como ruído (entre eles, a alegação de que o cascade de exclusão não estaria configurado —
  verificado como falso ao ler as migrations de `session_syntheses`/`session_synthesis_reactions`,
  que já encadeiam `on delete cascade` desde as Stories 3.1/3.2). Suíte completa (381 testes),
  `tsc --noEmit` e `eslint` (nos arquivos tocados) seguem limpos após os patches.
