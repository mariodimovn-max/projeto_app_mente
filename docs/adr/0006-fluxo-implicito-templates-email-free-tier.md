# 0006 — Links de e-mail usam o template padrão do Supabase e caem em `/auth/callback` (fluxo implícito)

**Status:** aceita
**Contexto original:** Reativação do projeto Supabase e preparação para teste em localhost (2026-11-10)

## Decisão

Convite e recuperação de senha usam os **templates de e-mail padrão do Supabase**
(`{{ .ConfirmationURL }}`). O link do e-mail passa pelo endpoint `/auth/v1/verify` do Supabase, que
valida o token e redireciona para **`/auth/callback`** do app com a sessão no fragmento da URL
(`#access_token=...&refresh_token=...&type=invite|recovery`). Essa página (Client Component) deixa o
client do Supabase ler o fragmento, gravar a sessão nos cookies e então segue para
`/auth/definir-senha` ou `/auth/redefinir-senha`, que continuam validando a sessão no servidor.

O `redirectTo` é informado por quem dispara o e-mail: `scripts/invite-beta.ts` no convite e
`requestPasswordReset.ts` na recuperação (ambos apontam para `/auth/callback?next=...`).

A rota `/auth/confirm` (token_hash + `verifyOtp`, Stories 1.4/1.6) **continua existindo** e é o
caminho preferido; os templates em `supabase/templates/*.html` já apontam para ela.

## Por quê

O plano gratuito do Supabase com o provedor de e-mail padrão **rejeita qualquer alteração de
template** ("Email template modification is not available for free tier projects using the default
email provider"). O fluxo original dependia de editar o template para injetar `{{ .TokenHash }}`;
sem isso, o link padrão nunca chega a `/auth/confirm` com `token_hash`, e o convite não funciona.

As alternativas eram contratar SMTP próprio (conta externa, domínio verificado) ou pagar o plano
Pro — ambas fora do "beta gratuito de 5 a 10 pessoas". O fluxo implícito resolve sem custo e sem
dependência externa.

## Trade-off assumido

Os tokens viajam no fragmento da URL (nunca chegam ao servidor nem a logs de requisição, mas ficam
no histórico do navegador até a navegação seguinte substituí-los). Para um beta fechado com links
de uso único e curta validade, é aceitável. Quando houver SMTP próprio, basta descomentar
`[auth.email.template.*]` em `supabase/config.toml`, rodar `supabase config push` e remover o
`redirectTo` dos dois disparadores — `/auth/confirm` volta a ser o único caminho.

## Onde isso aparece no código

- `apps/web/src/app/auth/callback/page.tsx` e `resolveCallback.ts` — captura da sessão e escolha
  do destino/erro
- `apps/web/src/lib/actions/requestPasswordReset.ts` — `redirectTo` da recuperação
- `apps/web/scripts/invite-beta.ts` — `redirectTo` do convite
- `supabase/config.toml` — `additional_redirect_urls` precisa conter o host do app (localhost
  hoje; domínio de produção depois)
