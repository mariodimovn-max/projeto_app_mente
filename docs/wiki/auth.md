---
titulo: Autenticação
epico: 1
status: completo
ultima_atualizacao: 2026-11-13
depende_de: []
relacionado: [lgpd-e-privacidade, ui-e-navegacao, pendencias-manuais]
decisoes: [0006-fluxo-implicito-templates-email-free-tier]
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
- `apps/web/src/app/auth/confirm/route.ts` — link com `token_hash` (`verifyOtp`); só funciona com
  templates de e-mail customizados
- `apps/web/src/app/auth/callback/` — link padrão do Supabase (sessão no fragmento da URL); é o
  caminho **em uso hoje** — ver [ADR 0006](../adr/0006-fluxo-implicito-templates-email-free-tier.md)
- `apps/web/scripts/invite-beta.ts` — envia convites com o `redirectTo` certo
- `apps/web/src/app/LogoutButton.tsx`
- `src/proxy.ts` (o antigo `middleware.ts` do Next 16) — renova o cookie de sessão do Supabase a
  cada request (padrão `@supabase/ssr`)

## Decisões e padrões

- Autorização de dados é 100% via RLS no Postgres, nunca filtrada em código de aplicação.
- Rate limiting: máx. 5 tentativas de login por 5 min (NFR do PRD).
- Beta fechado é garantido em duas camadas: não existe formulário de cadastro no app **e**
  `enable_signup = false` em `supabase/config.toml` (aplicado no projeto). Convites via
  `auth.admin.inviteUserByEmail` continuam funcionando com signup desligado.
- Dois caminhos de link de e-mail coexistem (`/auth/confirm` e `/auth/callback`). Quem dispara o
  e-mail decide: o `redirectTo` do convite/recuperação aponta para `/auth/callback?next=...`; os
  templates customizados (quando houver SMTP) apontam para `/auth/confirm?token_hash=...`.

## Gotchas conhecidos

- `login.ts` também grava em `audit_log` (best-effort) desde a Story 5.3 — ver
  [lgpd-e-privacidade.md](lgpd-e-privacidade.md).

- `/auth/redefinir-senha` exige `amr` com método `recovery` na sessão. No fluxo implícito isso
  continua valendo: o `/auth/v1/verify` do Supabase com `type=recovery` marca a sessão do mesmo
  jeito que `verifyOtp({ type: "recovery" })`.
- Convidar pelo botão do dashboard (sem `redirectTo`) manda o link para o Site URL raiz, onde nada
  captura o fragmento — use o script.
- **Recuperação de senha — erros não podem ser engolidos** (bug corrigido em 2026-11-13).
  - **Antes:** `requestPasswordReset` só tratava o 429; qualquer outra falha virava "enviamos o
    link", e o usuário ficava esperando um e-mail que nunca saía.
  - **Hoje:** conta inexistente (`user_not_found`) mantém o sucesso genérico, como proteção contra
    descobrir quais e-mails têm conta. Limite de envio mantém "muitas solicitações". Qualquer outra
    falha mostra "Não conseguimos enviar o e-mail de redefinição agora…".
  - **Log:** toda falha vai para o log do servidor só com `status` e `code`, nunca o e-mail nem a
    mensagem do Supabase, que pode conter o endereço.
  - **Trade-off aceito:** se o Supabase só falhar no envio para contas existentes, a diferença entre
    "enviado" e "falhou" vira um canal lateral fraco de descoberta de contas. Num beta fechado por
    convite isso é aceitável diante de mentir ao usuário.
- **Provedor de e-mail padrão do Supabase (plano gratuito):**
  - só envia para endereços de **membros da organização** no Supabase (`email_address_not_authorized`);
  - tem um limite de **2 e-mails/hora** por projeto (`email_sent = 2`).

  Isso afeta convite e recuperação. Antes de convidar alguém de fora da organização, configure SMTP
  próprio (ADR 0006).
- **Porta do servidor local:** os links de e-mail só funcionam com o app em `localhost:3000`, a única
  porta em `additional_redirect_urls`. Em outra porta, o `redirectTo` é ignorado e o link cai na raiz
  do Site URL, perdendo a sessão de recuperação.

## Pendências

- `.env.local` precisa apontar para o projeto reativado (`tzsblrycrymftjvbgona`) com as 4 variáveis
  — ver [pendencias-manuais.md](pendencias-manuais.md).
- Teste ponta a ponta do convite real (e-mail → `/auth/callback` → definir senha → login) ainda
  não foi feito após a reativação de 2026-11-10.
