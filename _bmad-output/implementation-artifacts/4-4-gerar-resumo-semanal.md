# Story 4.4: Gerar Resumo Semanal

Status: done

## Story

As a usuário querendo entender minha semana,
I want gerar um resumo semanal sob demanda,
so that eu veja os principais temas e emoções da semana de forma consolidada.

## Acceptance Criteria

1. **Given** um usuário com sessões na última semana, **when** ele clicar em “Gerar Resumo” e selecionar “Semana”, **then** uma Server Action gera um resumo com os top 5 tópicos, emoções dominantes e progresso.
2. **Given** o resumo gerado, **when** ele for exibido na tela de Insights, **then** ele aparece como texto e visualização simples, sem gráficos complexos.
3. **Given** o conteúdo do resumo, **when** ele for mostrado, **then** ele respeita privacidade e não expõe trechos literais sensíveis das conversas.

## Tasks / Subtasks

- [x] Implementar a Server Action de resumo semanal.
- [x] Apresentar o resumo na tela de Insights com o visual definido.

### Review Findings

- [x] [Review][Patch] Corrige comparação de datas em `getWeeklySummaryData` (string vs Date, sem limite superior no período atual) [apps/web/src/lib/summaries/weeklySummary.ts:87-109]
- [x] [Review][Patch] Formata as datas exibidas (período e linha do tempo) no fuso America/Sao_Paulo, alinhado à convenção do dashboard, em vez do fuso do navegador [apps/web/src/components/insights/WeeklySummaryCard.tsx]
- [x] [Review][Patch] Corrige concordância verbal/nominal em `buildProgressNote` ("as 1 da semana passada", "1 sessões") [apps/web/src/lib/summaries/weeklySummary.ts]
- [x] [Review][Patch] Ajusta o texto de "sem sessões" para refletir que a contagem é de sessões com síntese salva, não de toda conversa (mesma precisão já usada em `DashboardStats`) [apps/web/src/lib/actions/generateSummary.ts]
- [x] [Review][Patch] Corrige resumo desatualizado que continua visível junto com a mensagem de erro quando uma nova geração rejeita inesperadamente [apps/web/src/components/insights/WeeklySummaryCard.tsx]
- [x] [Review][Defer] Sem seletor real "Semana"/"Mês" — só existe o botão "Gerar resumo da semana", já que o resumo mensal (Story 4.5) ainda não existe [apps/web/src/components/insights/WeeklySummaryCard.tsx] — deferred, aguardando Story 4.5
- [x] [Review][Defer] Semanas que incluem sessões sintetizadas antes desta migration mostram "Emoções dominantes" vazio, sem indicação de que é uma lacuna de dados de transição, não ausência real de emoção [supabase/migrations/20260810130000_session_syntheses_emotions_triggers.sql] — deferred, sem backfill possível (dado nunca foi capturado para sessões antigas)
