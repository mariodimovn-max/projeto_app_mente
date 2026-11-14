---
titulo: Pendências Manuais (Migrations, Env Vars, Runbooks)
epico: "transversal"
status: "em andamento"
ultima_atualizacao: 2026-11-13
depende_de: []
relacionado: [auth, conversa-e-memoria, insights-e-resumos, lgpd-e-privacidade, ui-e-navegacao]
decisoes: [0006-fluxo-implicito-templates-email-free-tier, 0007-pwa-instalavel-twa-como-evolucao]
tags: [migrations, env, deploy, ci, supabase-cli, pendencias, pwa, android]
---

# Pendências Manuais

> Consolida tudo que precisa de uma ação manual do usuário fora do que o Claude Code pode fazer
> sozinho, e o estado da infraestrutura Supabase.

## Projeto Supabase (estado em 2026-11-10)

- **Projeto hospedado:** `diario-bem-estar-prod` (ref `tzsblrycrymftjvbgona`, região `sa-east-1`),
  na organização do próprio Mario. Em novembro/2026 ele estava **pausado** por inatividade do plano
  gratuito (não excluído) — foi reativado pelo dashboard ("Restore project"). Projetos gratuitos
  pausam de novo após ~7 dias sem uso; basta reativar, nada se perde.
- O outro projeto da organização (`mariodimovn-max's Project`, de julho) é o ambiente de
  desenvolvimento antigo e continua pausado; não é usado.
- **O repositório está linkado ao projeto via CLI** (`supabase link`, estado em `supabase/.temp/`,
  ignorado pelo git). Para operar o projeto, rode `supabase login` uma vez na máquina.
- **Banco:** as 11 migrations de `supabase/migrations/` foram aplicadas com `supabase db push` em
  2026-11-10 e constam na tabela de histórico do projeto. O banco não tinha nenhuma tabela antes
  disso (as "migrations pendentes" das histórias anteriores nunca haviam sido aplicadas lá).
- **Config de Auth** vive em `supabase/config.toml` e é aplicada com `supabase config push`:
  signup desligado (beta fechado), senha mínima 8, Site URL `http://localhost:3000`,
  `additional_redirect_urls` com localhost. Ao fazer deploy, trocar `site_url` e acrescentar o
  domínio de produção em `additional_redirect_urls`, depois `supabase config push`.
- **Templates de e-mail não podem ser editados** no plano gratuito com o provedor padrão — ver
  [ADR 0006](../adr/0006-fluxo-implicito-templates-email-free-tier.md). Os arquivos em
  `supabase/templates/` e as seções comentadas em `config.toml` ficam prontos para quando houver
  SMTP próprio.
- `supabase/schema_consolidado.sql` é só uma cópia concatenada das migrations para colar no SQL
  Editor em emergência; o caminho normal é `supabase db push`.

## Como aplicar uma migration nova

1. Criar o arquivo em `supabase/migrations/<timestamp>_nome.sql` (`supabase migration new nome`).
2. `supabase db push --dry-run` para conferir, depois `supabase db push`.
3. `supabase migration list` mostra local × remoto.

> Não há automação de deploy de schema (CI não roda `db push`). Continua sendo um passo manual,
> mas agora via CLI em vez de colar SQL no dashboard.

## Convidar beta testers

Escolha original de Mario: convite manual. Hoje há duas formas equivalentes (ambas usam
`auth.admin.inviteUserByEmail`):

- **Script:** em `apps/web`, `node --env-file=.env.local scripts/invite-beta.ts email@exemplo.com`
  (precisa de `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`). Para outro host, `--redirect-to=https://dominio`.
- **Dashboard:** Authentication → Users → Invite user. Nesse caso o link cai no Site URL raiz
  (`/`) com a sessão no fragmento, e **não** em `/auth/callback` — prefira o script, que informa o
  `redirectTo` correto.

Limite do e-mail padrão do Supabase no plano gratuito: poucos envios por hora. Convide aos poucos.

## Variáveis de ambiente

`apps/web/.env.example` documenta as 4 necessárias (valores em Project Settings → API do projeto
acima, ou `supabase projects api-keys --project-ref tzsblrycrymftjvbgona --reveal`):

- `NEXT_PUBLIC_SUPABASE_URL` — `https://tzsblrycrymftjvbgona.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **sem prefixo `NEXT_PUBLIC_`**; necessária para `deleteAccount`
  (`lib/supabase/admin.ts`) e para `scripts/invite-beta.ts`. Nunca no client nem no git.
- `ANTHROPIC_API_KEY`

## CI

`.github/workflows/ci.yml` roda typecheck + Vitest em PR/push para `main`, com **dois `npm ci`
separados** — raiz e `apps/web` são `package.json`/lockfile independentes, não um workspace.

**Gate de cobertura ≥80% (NFR-8) está deliberadamente fora do CI**: não há `@vitest/coverage-v8`
instalado nem medição atual; ligar o gate às cegas poderia travar todo PR. Antes de ligar esse gate,
alguém precisa instalar o pacote de cobertura e medir a baseline real primeiro.

## Testar o PWA num Android real

Pendente desde a Story 6.1 (2026-11-13). Tudo que dava para verificar no Chrome do computador
passou: manifest sem erros, instalável, cache só com `offline.html`, página offline, troca de versão
do SW. Falta confirmar no aparelho que o app abre em tela cheia e que a sessão se mantém. Não precisa
de deploy:

1. No computador: `npm run build --prefix apps/web && npm run start --prefix apps/web`. O SW só
   registra em produção, e a porta precisa ser 3000, que é a que o Supabase aceita nos redirects.
2. No celular: ativar Opções do desenvolvedor > Depuração USB e conectar o cabo.
3. No Chrome do computador: abrir `chrome://inspect`, entrar em **Port forwarding** e mapear
   `3000` → `localhost:3000`, com "Enable port forwarding" marcado.
4. No Chrome do celular: abrir `http://localhost:3000`. O Chrome trata `localhost` como contexto
   seguro, então a instalação funciona sem HTTPS.
5. Verificar:
   - menu ⋮ > **Instalar app** (ou "Adicionar à tela inicial");
   - abrir pelo ícone: tela cheia, sem barra de URL, barra de status escura;
   - fazer login, fechar o app e reabrir: continua logado;
   - modo avião + trocar de tela: aparece "Sem conexão".

Quando o app tiver deploy no Vercel, a mesma checagem vale direto pelo domínio HTTPS, sem cabo.

## Runbook de deploy (execução manual, fora do app)

Base em `_bmad-output/planning-artifacts/sprint-change-proposal-2026-08-23.md`, atualizado:

1. Vercel: importar o repositório com **Root Directory `apps/web`** e as 4 variáveis acima.
2. Com o domínio de produção em mãos, em `supabase/config.toml` trocar `site_url` e acrescentar
   `https://<dominio>/**` em `additional_redirect_urls`; `supabase config push`.
3. Convidar beta testers com `--redirect-to=https://<dominio>`.
