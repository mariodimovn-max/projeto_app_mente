# 0005 — Resumos periódicos calculados deterministicamente, sem nova chamada à IA

**Status:** aceita
**Contexto original:** Story 4.4 (Resumo Semanal), estendida na 4.5 (Resumo Mensal)

## Decisão

Os resumos semanal e mensal (FR-6) são **calculados em código, deterministicamente**, agregando
`emotions`/`triggers`/temas já persistidos em `session_syntheses` — nenhuma chamada nova à Anthropic
API acontece na hora de gerar um resumo.

## Por quê

A síntese de cada sessão (FR-5) já usa a IA para abstrair temas/emoções/gatilhos daquela sessão.
Reprocessar mensagens brutas com IA de novo para produzir o resumo semanal seria mais lento, mais
caro, e pior para privacidade (mais dados brutos passando pelo modelo do que o necessário). Como
`session_syntheses` originalmente não persistia `emotions`/`triggers` (eram efêmeros, só agregados
direto em `user_patterns`), a Story 4.4 precisou estender o schema para persistir os dois por sessão.

## Implicação prática

Qualquer feature futura de "insight sobre o histórico" deveria, por padrão, tentar reusar os dados
já abstraídos em `session_syntheses`/`user_patterns` em vez de reprocessar mensagens brutas com IA —
só justificar uma nova chamada à IA se o dado necessário genuinamente não existir agregado ainda.

**Gotcha relacionado (não é uma decisão, é um bug-trap):** `created_at` do Postgres/PostgREST não
usa o mesmo formato de string de `Date.prototype.toISOString()` do JS (ex: sufixo `+00:00` em vez de
`Z`). Comparar essas strings diretamente (`>=`/`<`) classifica linhas incorretamente mesmo
representando o mesmo instante. Qualquer split de período em memória deve comparar por
`new Date(x).getTime()`, nunca por string.

## Onde isso aparece no código

- `apps/web/src/lib/summaries/weeklySummary.ts`, `monthlySummary.ts`
- `apps/web/src/lib/actions/generateSummary.ts`
