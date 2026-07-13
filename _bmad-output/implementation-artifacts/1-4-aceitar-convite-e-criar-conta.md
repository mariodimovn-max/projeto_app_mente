# Story 1.4: Aceitar Convite e Criar Conta

Status: review

## Story

As a usuário convidado pelo administrador do beta,
I want receber um convite por email e definir minha senha para ativar minha conta,
so that eu consiga acessar o app com segurança sem um formulário público de cadastro.

## Acceptance Criteria

1. **Given** um administrador que enviou um convite via `supabase.auth.admin.inviteUserByEmail()`, **when** o usuário abrir o link do convite, **then** o fluxo de ativação é iniciado sem exigir um formulário público de cadastro.
2. **Given** o convite ativo, **when** o usuário definir a senha, **then** a conta é criada e vinculada ao email convidado.
3. **Given** o fluxo de ativação, **when** a conta for criada, **then** a senha é tratada pelo mecanismo de autenticação do Supabase conforme a política de segurança do projeto.
4. **Given** a conclusão do processo, **when** o usuário terminar a ativação, **then** ele é direcionado para o onboarding ou para o chat inicial.

## Tasks / Subtasks

- [x] Implementar o fluxo de ativação por convite.
- [x] Integrar a criação de conta com o fluxo de auth do Supabase.

## Dev Agent Record

### Implementation Plan

- Adotado o padrão oficial `@supabase/ssr` (client de browser + client de servidor lendo/gravando
  cookies via `next/headers`), conforme decidido em `architecture.md`. Nenhum cliente Supabase
  existia ainda no projeto — criados do zero em `lib/supabase/`.
- Fluxo de ativação segue o padrão de "confirm route" do Supabase para links de e-mail: o convite
  (`inviteUserByEmail`, enviado manualmente pelo admin fora do app) redireciona para
  `/auth/confirm?token_hash=...&type=invite`, que chama `supabase.auth.verifyOtp` e, em caso de
  sucesso, estabelece sessão via cookies e redireciona para `/auth/definir-senha`. Erros (token
  ausente/expirado) redirecionam para `/auth?erro=convite-invalido`, exibido como banner na página
  de login.
- `/auth/definir-senha` é um Server Component que verifica a sessão (estabelecida pelo passo
  anterior) via `supabase.auth.getUser()`; sem sessão válida, redireciona para `/auth` — não há
  como chegar ao formulário de senha sem passar pelo link de convite, atendendo à AC1 (nenhuma rota
  pública de criação de conta).
- A senha em si nunca é tratada/hasheada pelo código da aplicação — é enviada diretamente a
  `supabase.auth.updateUser({ password })`, que delega ao mecanismo de auth do Supabase (bcrypt),
  atendendo AC3.
- Removida a aba pública "Criar conta" da página `/auth` (mock da Story 1.3), já que ela violava
  diretamente a AC1. A página virou Server Component (lê `searchParams` para o banner de erro) com
  o formulário de login extraído para `LoginForm` (Client Component) — a lógica de login em si
  permanece um mock não funcional, pois pertence à Story 1.5.
- **Nota importante:** o projeto usa Next.js 16, onde `middleware.ts` foi renomeado/depreciado para
  `proxy.ts` (confirmado em `node_modules/next/dist/docs`). O refresh automático de cookie de
  sessão via `proxy.ts` (mencionado no `architecture.md` como "middleware") é responsabilidade da
  Story 1.5 (login) — não foi necessário para este fluxo de ativação pontual, já que a sessão é
  estabelecida e consumida dentro da mesma janela de requisições.
- Nenhum client Supabase real foi testado em produção nesta story — `.env.example` documenta as
  variáveis `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` necessárias, mas não há
  projeto Supabase provisionado neste ambiente de desenvolvimento; a verificação manual em
  `apps/web` confirmou que `/auth` renderiza corretamente (sem aba de criar conta, com banner de
  erro) e que `/auth/definir-senha` alcança o código do client Supabase (falha apenas por falta de
  credenciais reais no `.env.local`, esperado neste ambiente).
- Infraestrutura de testes: não havia `vitest.config.ts` nem setup de `@testing-library/jest-dom`
  no projeto (apesar de já ser dependência instalada) — criados `vitest.config.ts` (alias `@/` +
  `setupFiles`) e `vitest.setup.ts` (matchers do jest-dom + cleanup automático do RTL entre
  testes), já que os novos testes desta story precisavam de ambos e isso beneficia todas as
  stories futuras de UI.

### Completion Notes

- 50 testes passam (`npm test`), incluindo os 15 novos desta story cobrindo: clients Supabase
  (browser/server), route handler `/auth/confirm` (sucesso, `next` customizado, token inválido,
  parâmetros ausentes), página `/auth/definir-senha` (redirecionamento sem sessão, renderização com
  sessão válida) e `DefinirSenhaForm` (validação de tamanho mínimo, confirmação de senha, sucesso
  com redirecionamento, erro do Supabase).
- `npm run typecheck` e `npm run lint` sem erros/avisos.
- Verificação manual: servidor de dev iniciado, `/auth` confirmado sem "Criar conta" e exibindo o
  banner de erro para `?erro=convite-invalido`; `/auth/definir-senha` sem sessão real falha por
  falta de credenciais Supabase no ambiente local (não há projeto provisionado) — comportamento
  esperado, não testável ponta-a-ponta sem um projeto Supabase real configurado em `.env.local`.

## File List

- `apps/web/package.json` (dependências `@supabase/ssr`, `@supabase/supabase-js`)
- `apps/web/.env.example` (novo)
- `apps/web/vitest.config.ts` (novo)
- `apps/web/vitest.setup.ts` (novo)
- `apps/web/src/lib/supabase/client.ts` (novo; singleton do browser client após code review)
- `apps/web/src/lib/supabase/client.test.ts` (novo)
- `apps/web/src/lib/supabase/server.ts` (novo; `setAll` agora loga erro em vez de engolir silenciosamente)
- `apps/web/src/lib/supabase/server.test.ts` (novo)
- `apps/web/src/lib/actions/setPassword.ts` (novo, pós code review — Server Action que move
  `supabase.auth.updateUser` para fora do Client Component, conforme boundary do `architecture.md`)
- `apps/web/src/lib/actions/setPassword.test.ts` (novo)
- `apps/web/src/app/auth/confirm/route.ts` (novo; pós code review — `next` validado contra open
  redirect/valor vazio, `type` restrito a `"invite"`)
- `apps/web/src/app/auth/confirm/route.test.ts` (novo; casos de open redirect, `next` vazio e
  `type` não-invite)
- `apps/web/src/app/auth/definir-senha/page.tsx` (novo; comentário documentando limitação do gate
  de sessão para revisão na Story 1.5)
- `apps/web/src/app/auth/definir-senha/page.test.tsx` (novo)
- `apps/web/src/app/auth/definir-senha/DefinirSenhaForm.tsx` (novo; pós code review — chama a
  Server Action `setPassword` em vez do client Supabase diretamente)
- `apps/web/src/app/auth/definir-senha/DefinirSenhaForm.test.tsx` (novo)
- `apps/web/src/app/auth/page.tsx` (editado — removida aba pública "Criar conta", virou Server
  Component com leitura de `searchParams`)
- `apps/web/src/app/auth/page.test.tsx` (novo; inclui teste do botão de login desabilitado)
- `apps/web/src/app/auth/page.module.css` (editado — adicionada `.errorMessage`; pós code review —
  removidas classes mortas `.tabs`/`.tabButton`/`.tabButtonActive`, `.primaryButton` agora usa
  `composes` do módulo compartilhado)
- `apps/web/src/app/auth/LoginForm.tsx` (novo — formulário de login extraído da página; pós code
  review, botão de envio desabilitado com aviso "Login ainda não está disponível" em vez de um
  `onSubmit` mudo, já que a lógica real pertence à Story 1.5)
- `apps/web/src/app/page.module.css` (editado, pós code review — `.primaryButton` agora usa
  `composes` do módulo compartilhado em vez de duplicar os estilos)
- `apps/web/src/styles/shared.module.css` (novo, pós code review — `.primaryButton` compartilhado
  entre `app/page.module.css` e `app/auth/page.module.css`)

## Change Log

- 2026-07-12: Implementado fluxo de ativação de convite (`/auth/confirm` + `/auth/definir-senha`)
  integrado ao Supabase Auth (`@supabase/ssr`); removida rota pública de criação de conta da
  página `/auth`. Status → review.
- 2026-07-12: Aplicadas correções do code review (high effort, 10 achados): open redirect e `next`
  vazio no `/auth/confirm` corrigidos com validação de caminho interno; `type` restrito a
  `"invite"`; `setAll` do client de servidor agora loga erros em vez de engolir todos
  silenciosamente; atualização de senha movida para Server Action (`lib/actions/setPassword.ts`),
  corrigindo violação do boundary Client Component → Supabase do `architecture.md`; browser client
  memoizado como singleton; botão de login desabilitado com aviso em vez de `onSubmit` mudo; CSS
  morto (`.tabs`/`.tabButton`/`.tabButtonActive`) removido; `.primaryButton` deduplicado via
  `composes` num módulo CSS compartilhado. Gate de sessão de `/auth/definir-senha` (não específico
  de convite) documentado como limitação conhecida a revisar na Story 1.5, não corrigido agora por
  não ser explorável antes do login existir. 58 testes passam; `npm run build` valida a Server
  Action e o `composes` de CSS Modules com sucesso.
