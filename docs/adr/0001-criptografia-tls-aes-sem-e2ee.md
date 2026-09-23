# 0001 — Criptografia em trânsito (TLS) e em repouso (AES-256), não E2EE literal

**Status:** aceita
**Contexto original:** Story 5.4 (Política de Privacidade)

## Decisão

O app usa TLS 1.3+ em trânsito e AES-256 em repouso (modelo padrão do Supabase Cloud). **Não há
criptografia ponta-a-ponta (E2EE) literal** — o backend acessa o conteúdo em texto plano das
conversas para gerar respostas e detectar padrões (é isso que faz a IA funcionar).

## Por quê

Já era a decisão registrada em `architecture.md`. Isso virou uma ADR porque a primeira versão da
copy da política de privacidade (Story 5.4) contradizia a si mesma: negava E2EE literal numa frase
e, na seguinte, reusava "ponta a ponta" para descrever TLS+repouso ("criptografia de ponta a ponta
na infraestrutura"). Dois revisores independentes pegaram a contradição no code review.

## Implicação prática

Qualquer copy nova sobre privacidade/criptografia deve dizer exatamente "criptografia em trânsito
(TLS) e em repouso (AES-256)" — nunca a expressão "ponta a ponta"/E2EE, mesmo em sentido figurado.
`_bmad-output/planning-artifacts/ux-patterns.md` ainda tem copy desatualizada ("armazenadas
localmente" — os dados ficam no Supabase Cloud, não local); em caso de conflito, prevalece
`architecture.md`/`epics.md`, que são mais recentes e tecnicamente precisos.

## Onde isso aparece no código

- `apps/web/src/app/privacidade/` — página pública com a política completa
- `apps/web/src/components/privacy/` — `PrivacySeal`
