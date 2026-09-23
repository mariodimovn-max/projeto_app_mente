---
titulo: Pendências Manuais (Migrations, Env Vars, Runbooks)
epico: "transversal"
status: "em andamento"
ultima_atualizacao: 2026-09-22
depende_de: []
relacionado: [auth, conversa-e-memoria, insights-e-resumos, lgpd-e-privacidade, ui-e-navegacao]
decisoes: []
tags: [migrations, env, deploy, ci, pendencias]
---

# Pendências Manuais

> Consolida tudo que precisa de uma ação manual do usuário fora do que o Claude Code pode fazer
> sozinho. Antes desta página, cada história repetia "ver nota da Story 3.1" — isso deve ser mantido
> atualizado aqui em vez de espalhado pelo `CLAUDE.md`.

## Por que isso é manual

O CLI do Supabase não está linkado ao projeto e não há automação de deploy configurada. Migrations
novas em `supabase/migrations/` **não chegam ao banco real sozinhas** — precisam ser aplicadas à mão
no Supabase Dashboard (SQL editor) ou via `supabase db push` depois de linkar o projeto.

## Migrations pendentes de aplicação manual

| Migration | Origem | Tópico |
|---|---|---|
| `session_synthesis_reactions` | Story 3.2 | [conversa-e-memoria.md](conversa-e-memoria.md) |
| `user_patterns` | Story 3.3 | [conversa-e-memoria.md](conversa-e-memoria.md) |
| `session_history_actions` (adiciona `sessions.marked` + policies) | Story 3.5 | [conversa-e-memoria.md](conversa-e-memoria.md) |
| `personal_milestones` | Story 4.3 | [insights-e-resumos.md](insights-e-resumos.md) |
| `session_syntheses_emotions_triggers` | Story 4.4 | [insights-e-resumos.md](insights-e-resumos.md) |
| `audit_log` | Story 5.1 | [lgpd-e-privacidade.md](lgpd-e-privacidade.md) |
| `audit_log_survives_account_deletion` (remove FK) | Story 5.3 | [lgpd-e-privacidade.md](lgpd-e-privacidade.md) — ver [ADR 0004](../adr/0004-audit-log-sem-fk.md) |
| `user_patterns_daily_greeting` | Ajuste de UI (Home) | [ui-e-navegacao.md](ui-e-navegacao.md) |

> Ao aplicar uma migration desta lista, remova a linha correspondente e registre em `CLAUDE.md`
> (ou aqui, se ainda houver mais de uma pendente) que ela foi aplicada.

## Variáveis de ambiente

`apps/web/.env.example` documenta as 4 necessárias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **sem prefixo `NEXT_PUBLIC_`**; necessária para qualquer operação
  `auth.admin.*` (hoje só `deleteAccount`, via `lib/supabase/admin.ts`). Precisa ser configurada
  manualmente em `.env.local` e no ambiente de produção (Vercel).
- `ANTHROPIC_API_KEY`

## CI

`.github/workflows/ci.yml` roda typecheck + Vitest em PR/push para `main`, com **dois `npm ci`
separados** — raiz e `apps/web` são `package.json`/lockfile independentes, não um workspace.

**Gate de cobertura ≥80% (NFR-8) está deliberadamente fora do CI**: não há `@vitest/coverage-v8`
instalado nem medição atual; ligar o gate às cegas poderia travar todo PR. Antes de ligar esse gate,
alguém precisa instalar o pacote de cobertura e medir a baseline real primeiro.

## Runbooks (execução manual, fora do app)

Documentados em `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-23.md`:

- **Deploy:** Vercel + Supabase Cloud — aplicar as migrations pendentes (tabela acima) e configurar
  Site URL/Redirect URLs no Supabase **antes** de convidar qualquer beta tester.
- **Convite de beta testers:** manual pelo Supabase Dashboard (por escolha do usuário — sem fluxo de
  convite automatizado no app).
