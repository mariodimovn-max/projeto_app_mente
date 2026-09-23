# 0003 — Agregações por "dia" usam America/Sao_Paulo fixo, não UTC nem por-usuário

**Status:** aceita
**Contexto original:** Story 4.2 (Dashboard de Indicadores de Evolução)

## Decisão

Qualquer cálculo que agrupe eventos por "dia de calendário" (ex: dias consecutivos de uso) decide
o dia usando o fuso **America/Sao_Paulo fixo no código**, nunca `toISOString().slice(0, 10)`
(que trunca em UTC) e nunca um fuso configurável por usuário — não existe timezone por usuário
salvo em lugar nenhum do sistema.

## Por quê

`computeStreakDays` precisa decidir se duas sessões aconteceram "no mesmo dia" a partir de
timestamps UTC do Postgres. Truncar em UTC quebra a contagem para qualquer usuário fora do fuso 0
(sessões perto da meia-noite local caem no dia errado).

## Implicação prática

Qualquer feature futura que agrupe algo por dia (o gráfico de "tendência emocional dos últimos 7
dias", adiado na própria Story 4.2, é o exemplo mais provável) deve reusar a mesma lógica de fuso
fixo — não inventar uma nova truncagem de data.

## Onde isso aparece no código

- `apps/web/src/lib/dashboard/date.ts` — utilitário de fuso
- `apps/web/src/lib/dashboard/dashboard.ts` — `computeStreakDays`
