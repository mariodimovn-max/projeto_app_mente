# Story 4.2: Dashboard de Indicadores de Evolução

Status: done

## Story

As a usuário acompanhando meu progresso,
I want ver um resumo simples de dias consecutivos, sessões, temas e tendência emocional,
so that eu perceba minha evolução sem métricas de gamification.

## Acceptance Criteria

1. **Given** um usuário com pelo menos uma sessão concluída e `user_patterns` populado, **when** ele acessar a tela Início, **then** ele vê dias consecutivos de uso, total de sessões completadas, temas explorados e ~~tendência emocional dos últimos 7 dias~~ (ver Nota de escopo).
2. **Given** os dados de dashboard, **when** eles forem carregados, **then** eles vêm do agregado pré-computado e não exigem recalcular a partir das mensagens brutas.
3. **Given** a tela de evolução, **when** o usuário observar o conteúdo, **then** nenhum elemento de gamification é exibido.

## Nota de escopo (decisão tomada durante a implementação)

O gráfico de "tendência emocional dos últimos 7 dias" (parte do AC1 original) foi **adiado para
uma história futura**, por decisão explícita do usuário. Motivo: nem `user_patterns` (só guarda
contagens acumuladas de todo o histórico, sem quebra por dia) nem `session_syntheses` (não
persiste as emoções que a síntese já calcula por sessão — hoje descartadas em
`lib/actions/endSession.ts` após irem para o agregado) têm dado com granularidade diária. Fazer
esse gráfico exigiria uma migration nova (ex.: coluna `emotions` em `session_syntheses`) — fora do
escopo desta entrega. Os outros três indicadores do AC1 (dias consecutivos, sessões concluídas,
temas explorados) foram entregues.

## Tasks / Subtasks

- [x] Implementar o dashboard de indicadores básicos (`lib/dashboard/dashboard.ts`,
      `components/dashboard/DashboardStats.tsx`, integrado à Home `/` para usuários
      autenticados — substitui o hero de onboarding só para quem já tem sessão).
- [x] Carregar os dados do agregado `user_patterns` (sessões concluídas via
      `getUserPatterns`, temas via o mesmo agregado; dias consecutivos calculados a partir
      de `sessions.created_at`, já que não há coluna de streak pré-computada).

### Review Findings

Revisão adversarial em contexto limpo (Blind Hunter + Edge Case Hunter + Acceptance Auditor,
commit de checkpoint `99e4d67`). Acceptance Auditor não encontrou nenhuma violação de AC. Os
achados reais dos outros dois revisores (convergentes entre si) foram corrigidos num segundo
commit antes do fechamento da história:

- [x] [Review][Patch] Streak calculado em dia UTC, não no fuso do usuário — sessão perto da
      meia-noite em horário de Brasília podia cair no dia UTC seguinte e quebrar o streak
      indevidamente [`lib/dashboard/dashboard.ts`]. Corrigido: dia de calendário agora decidido
      via `Intl.DateTimeFormat` fixado em `America/Sao_Paulo` (único fuso do beta hoje).
- [x] [Review][Patch] Janela de busca do streak limitada por `LIMIT 90` linhas de sessão, não
      por dias — um usuário com múltiplas sessões por dia esgotava a janela bem antes do streak
      real terminar, subestimando-o silenciosamente [`lib/dashboard/dashboard.ts`]. Corrigido:
      filtro por intervalo de datas (`gte`, 120 dias) em vez de contagem de linhas.
- [x] [Review][Patch] Divergência entre o header de sessão (proxy) e a sessão real do Supabase
      renderizava o cabeçalho autenticado com uma lacuna vazia no lugar dos indicadores, sem
      erro nem redirecionamento [`app/page.tsx`]. Corrigido: nesse caso agora redireciona para
      `/auth`, mesmo padrão já usado em `/historico` e `/insights`.
- [x] [Review][Patch] Estado vazio do `DashboardStats` era decidido só por `sessionCount === 0`
      (agregado, só sessões encerradas), escondendo um streak real de quem já tem sessões em
      dias consecutivos mas ainda não encerrou nenhuma [`components/dashboard/DashboardStats.tsx`].
      Corrigido: o estado vazio agora exige `sessionCount === 0 && streakDays === 0`.
- [x] [Review][Patch] Saudação "Bom te ver de novo." aparecia mesmo para quem nunca teve
      nenhuma sessão, contradizendo o texto do estado vazio logo abaixo ("primeira conversa")
      [`app/page.tsx`]. Corrigido: saudação varia conforme `isFirstVisitEver`.
- [x] [Review][Patch] Landmark de acessibilidade redundante — a `<section>` externa em
      `page.tsx` e a `<section>` interna do `DashboardStats` formavam duas regiões aninhadas
      para o mesmo conteúdo. Corrigido: removido o `aria-labelledby` da seção externa.
- [x] [Review][Patch] Classe CSS `.contentWithNav` ficou órfã depois que a Home passou a
      renderizar `DashboardStats` (com seu próprio espaçamento) em vez da seção `.content`
      para usuários autenticados [`app/page.module.css`]. Removida.
- [x] [Review][Dismiss] "Nota de escopo auto-atribuída" (Blind Hunter, sem visibilidade da
      conversa) — a decisão de adiar o gráfico de tendência emocional foi de fato feita pelo
      usuário, perguntada explicitamente antes da implementação começar, não uma reclassificação
      unilateral do autor.
- [x] [Review][Dismiss] Barra visual de streak limitada a 7 slots "perde informação" acima de
      7 dias — decorativa (`aria-hidden`) por design; o número exato continua exposto no texto.
- [x] [Review][Dismiss] `getUserPatterns` supostamente poderia engolir erros e mascarar uma
      falha real como "sem dados" — verificado falso, a função já relança qualquer erro
      (`lib/patterns/userPatterns.ts`). Teste de propagação de erro adicionado mesmo assim por
      completude.
- [x] [Review][Dismiss] Mocks de teste usam `as never` sem checagem estrutural do builder do
      Supabase — mesmo padrão já usado em todos os outros testes de `lib/` do projeto
      (`sessions.test.ts`, `userPatterns.test.ts`), não uma lacuna introduzida por esta diff.
- [x] [Review][Dismiss] Classe `errorMessage` referenciada por `composes` não estaria
      confirmada — verificado que existe em `styles/shared.module.css`.
- [x] [Review][Dismiss] Temas com contagem zero/negativa não filtrados — infundado dado o
      schema real: `mergeCounts` em `userPatterns.ts` só incrementa, nunca decrementa.
- [x] [Review][Dismiss] Colisão de chips de tema por diferença de maiúsculas/minúsculas —
      infundado: os rótulos já são normalizados para minúsculas antes de gravar no agregado.
- [x] [Review][Defer] Banner de erro dos indicadores não tem botão de "tentar novamente", só a
      atualização manual da página como saída — mesmo padrão já usado no banner de erro de
      `/historico` (Story 3.5), não uma regressão desta diff. Registrado em `deferred-work.md`.
