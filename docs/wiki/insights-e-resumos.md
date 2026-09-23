---
titulo: Indicadores, Marcos e Resumos Periódicos
epico: 4
status: completo
ultima_atualizacao: 2026-09-22
depende_de: [conversa-e-memoria]
relacionado: [ui-e-navegacao]
decisoes: [0002-jspdf-v4-por-cve, 0003-streak-timezone-fixo, 0005-resumo-deterministico-sem-ia]
tags: [dashboard, marcos, resumo, pdf, insights, evolucao]
---

# Indicadores, Marcos e Resumos Periódicos (Epic 4)

## O que faz

FR-6 (resumos semanais/mensais sob demanda) e FR-7 (indicadores de evolução), sem gamification
(sem badges/pontos, por valor do produto).

- **4.1 — Navegação Principal:** `PrimaryNav` (barra fixa Início/Histórico/Insights) e rota
  `/insights`. Ver [ui-e-navegacao.md](ui-e-navegacao.md) para detalhes de navegação.
- **4.2 — Dashboard de Indicadores:** `getDashboardData`/`computeStreakDays` — dias consecutivos,
  sessões concluídas e temas explorados. Sessões/temas vêm do agregado `user_patterns`; streak vem
  de `sessions.created_at` com fuso fixo — ver [0003](../adr/0003-streak-timezone-fixo.md). O
  gráfico de "tendência emocional dos últimos 7 dias" (parte do AC1 original) foi **adiado por
  decisão do usuário**: não há hoje dado de emoção com granularidade diária persistido em nenhuma
  tabela; exigiria migration nova.
- **4.3 — Marcos Pessoais:** cada marco tem um título livre + um `theme` curto normalizado
  (trim + lowercase) para casar com as chaves de `user_patterns.themes`. O progresso **não é uma
  coluna persistida** — é recalculado na leitura, e também devolvido pelas próprias Server Actions
  de criar/editar (para refletir na hora a contagem que o tema já tinha antes de virar marco).
- **4.4 — Resumo Semanal:** calculado deterministicamente a partir de `session_syntheses` (sem nova
  chamada à IA) — ver [0005](../adr/0005-resumo-deterministico-sem-ia.md).
- **4.5 — Resumo Mensal:** janela rolante de 30 dias, mesma estratégia da 4.4; componente virou
  `SummaryCard` (renomeado de `WeeklySummaryCard`) com seletor Semana/Mês. Cada chip de tema/emoção
  é anotado com a direção frente ao período anterior (alta/queda/novo/estável), linguagem neutra por
  ser espelho não-prescritivo — atende ao AC1 completo do `epics.md` ("evolução... e tendências de
  melhora/piora em áreas específicas"), não só o resumo simplificado da story-file.
- **4.6 — Exportar Resumo em PDF:** gerado 100% client-side a partir do "view model" já formatado
  na tela (mesmas strings de data/tendência exibidas, nunca recalculadas). Biblioteca: jsPDF — ver
  [0002](../adr/0002-jspdf-v4-por-cve.md).

## Onde está no código

- `apps/web/src/lib/dashboard/dashboard.ts`, `date.ts`, `welcomeMessage.ts`
- `apps/web/src/lib/milestones/milestones.ts`
- `apps/web/src/lib/summaries/weeklySummary.ts`, `monthlySummary.ts`
- `apps/web/src/lib/pdf/summaryPdf.ts`
- `apps/web/src/lib/actions/personalMilestones.ts`, `generateSummary.ts`
- `apps/web/src/components/dashboard/`, `apps/web/src/components/insights/`
- `apps/web/src/app/insights/`

## Gotchas conhecidos

- **Nunca comparar `created_at` do Postgres como string.** Formato difere de
  `Date.prototype.toISOString()` do JS (`+00:00` vs `Z`); qualquer split de período em memória deve
  usar `new Date(x).getTime()`. Detalhe em [0005](../adr/0005-resumo-deterministico-sem-ia.md).
- Ao usar `epics.md` como referência de AC, a story-file às vezes resume/simplifica o critério —
  vale conferir a redação completa em `epics.md` antes de considerar um AC atendido (achado real na
  revisão da Story 4.5).

## Pendências

Ver [pendencias-manuais.md](pendencias-manuais.md) — migrations de `personal_milestones` e
`session_syntheses_emotions_triggers` precisam ser aplicadas manualmente no Supabase; testes manuais
em navegador com dado real pendentes do usuário (Stories 4.3, 4.4, 4.6).
