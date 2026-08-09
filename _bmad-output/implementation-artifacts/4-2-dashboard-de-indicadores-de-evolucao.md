# Story 4.2: Dashboard de Indicadores de Evolução

Status: review

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
