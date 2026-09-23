---
titulo: Autenticação
epico: 1
status: completo
ultima_atualizacao: 2026-09-22
depende_de: []
relacionado: [lgpd-e-privacidade, ui-e-navegacao]
decisoes: []
tags: [auth, supabase, rls, convite, login]
---

# Autenticação (Epic 1)

## O que faz

Beta fechado: só quem recebe convite consegue criar conta. Email + senha com confirmação, login,
recuperação de senha e logout. Fundação visual e de acessibilidade do app (base para todas as telas
seguintes) também nasceu nesta épica.

Stories 1.1 a 1.7, todas concluídas: setup do repo, fundação visual/acessibilidade, onboarding,
convite/criação de conta, login, recuperação de senha, logout.

## Onde está no código

- `apps/web/src/lib/actions/login.ts`, `logout.ts`, `requestPasswordReset.ts`, `setPassword.ts`
- `apps/web/src/app/auth/` — telas de login/onboarding/convite
- `apps/web/src/app/LogoutButton.tsx`
- `middleware.ts` — renova o cookie de sessão do Supabase a cada request (padrão `@supabase/ssr`)

## Decisões e padrões

- Autorização de dados é 100% via RLS no Postgres, nunca filtrada em código de aplicação.
- Rate limiting: máx. 5 tentativas de login por 5 min (NFR do PRD).

## Gotchas conhecidos

- `login.ts` também grava em `audit_log` (best-effort) desde a Story 5.3 — ver
  [lgpd-e-privacidade.md](lgpd-e-privacidade.md).

## Pendências

Nenhuma pendência manual conhecida específica desta área — ver
[pendencias-manuais.md](pendencias-manuais.md) para o estado geral de migrations/env vars.
