# Sprint Change Proposal — 2026-08-23

**Projeto:** Aplicativo de Diário Digital para Bem-Estar Mental
**Autor da mudança:** Mario Dimov
**Facilitado por:** Claude Code (`/bmad-correct-course`)
**Modo de trabalho:** Incremental
**Status:** Aprovado e implementado nesta sessão (itens 3 e 4 e correções de suporte); itens 1 e 2 são runbooks operacionais para execução manual por Mario

---

## 1. Issue Summary

Com os 5 épicos do MVP concluídos, Mario quer preparar o app para o primeiro lote de beta testers (até 5 pessoas) no desktop. Isso trouxe 4 pedidos:

1. Conseguir cadastrar/convidar até 5 usuários beta por email.
2. Colocar o site no ar (hospedagem).
3. Bug: a barra de rolagem do chat não acompanha o fim da conversa — o usuário pode ficar preso numa etapa antiga.
4. UX: Enter deveria enviar a mensagem; Shift+Enter deveria quebrar linha (hoje só o clique no botão envia).

**Evidência:** relato direto do autor a partir do uso real do app; itens 3 e 4 foram confirmados lendo o código de `ChatWindow.tsx`/`ChatComposer.tsx` — nenhum dos dois tinha essa lógica implementada.

## 2. Impact Analysis

**Epic Impact:** nenhum. Os 5 épicos já estão `done`; nenhum precisa reabrir, e nenhum épico novo é necessário.

**Artifact Conflicts:** nenhum.
- **PRD:** sem conflito — os 4 itens não alteram objetivo, escopo do MVP ou requisitos.
- **Arquitetura:** sem conflito — itens 1 e 2 são exatamente o que `architecture.md` já especificou (`supabase.auth.admin.inviteUserByEmail()` / convite manual fora do app; Vercel + Supabase Cloud). Itens 3 e 4 não tocam nenhuma decisão arquitetural.
- **UX:** sem conflito — item 4 preenche um detalhe de interação não coberto explicitamente pelas especificações; item 3 é puramente correção de um comportamento nunca implementado.

**Technical Impact (achado durante a análise, fora do trigger original):**
- `architecture.md` já previa `.github/workflows/ci.yml` (typecheck + Vitest, gate obrigatório — NFR-8) e `.env.example` na estrutura do projeto — **nenhum dos dois existia** no repositório. Resolvido como parte da preparação para produção (ver Proposta 4).
- Ao ligar esse CI, descobri que `npm run typecheck` na raiz do monorepo estava **quebrado**: `lib/agent/prompts.ts` (Story 3.6) importa `SessionOpeningContext` de `lib/agent/memory.ts`; como esse tipo vivia dentro de `memory.ts`, o TypeScript precisa resolver todo o grafo de imports de `memory.ts` (`@/lib/supabase/server`, `@/lib/agent/crisis`, `@/lib/patterns/userPatterns`) — que não resolvem sob o `tsconfig.json` da raiz (sem alias `@/*`, sem tipos DOM, por design, conforme o próprio comentário no arquivo). Regressão pré-existente, não relacionada aos 4 itens pedidos, corrigida nesta sessão (ver Proposta 4) porque bloquearia o CI recém-criado em todo PR.

## 3. Recommended Approach

**Opção escolhida: Ajuste Direto (Option 1)**, sem reorganização de backlog nem mudança de PRD/Épicos/Arquitetura.

- **Esforço:** Baixo
- **Risco:** Baixo
- Itens 3 e 4 são correções pontuais de implementação, dentro do escopo já coberto pela Story 2.1.
- Itens 1 e 2 são execução de decisões operacionais já documentadas na arquitetura — não exigem código de produto novo, apenas configuração de infraestrutura e um runbook.

**Justificativa:** nenhuma das 4 mudanças altera o que o produto faz ou como foi desenhado — apenas corrige bugs de implementação e executa passos operacionais que sempre estiveram no plano. Uma reabertura formal de épico seria desproporcional ao tamanho real do trabalho.

## 4. Detailed Change Proposals

### Proposta 1 — Auto-scroll do chat (implementada)

**Arquivo:** `apps/web/src/components/chat/ChatWindow.tsx`

- Adicionada uma `ref` (`historyEndRef`) a um elemento sentinela no fim de `.history`.
- Novo `useEffect` que rola até ele (`scrollIntoView({ block: "end" })`) sempre que `state.messages` ou `isThinking` mudam — cobre novas mensagens, chunks de streaming, e o aparecimento/desaparecimento do indicador "pensando".
- Chamada defensiva (`?.scrollIntoView?.(...)`) porque o jsdom (ambiente de teste) não implementa `scrollIntoView` — sem a guarda, todos os testes de `ChatWindow` quebravam.

**Antes:** nenhuma lógica de scroll automático existia; `.history` tinha `overflow-y: auto` mas nada nunca chamava scroll.
**Depois:** o chat sempre acompanha a mensagem/streaming mais recente.

### Proposta 2 — Enter envia, Shift+Enter quebra linha (implementada)

**Arquivo:** `apps/web/src/components/chat/ChatComposer.tsx`

- Novo `onKeyDown` no `<textarea>`: Enter sem Shift (e fora de composição de IME, via `event.nativeEvent.isComposing`) chama `formRef.current?.requestSubmit()`.
- Shift+Enter continua quebrando linha — comportamento padrão do `<textarea>`, sem código adicional necessário.

**Antes:** Enter dentro do `<textarea>` nunca disparava o `submit` do formulário (comportamento padrão de HTML); só o clique no botão enviava.
**Depois:** replica o padrão universal de apps de chat.

### Proposta 3 — Correção do typecheck da raiz (implementada, achado de suporte)

**Arquivos:** novo `apps/web/src/lib/agent/sessionOpeningContext.ts`; `memory.ts`, `prompts.ts`, `prompts.test.ts` ajustados.

- `ResponsePattern` e `SessionOpeningContext` (tipos puros, sem imports) movidos de `memory.ts` para um arquivo novo sem dependências.
- `prompts.ts` (e seu teste) passam a importar desse novo arquivo em vez de `./memory` — restaura o isolamento que `scripts/agent-test.ts` → `prompts.ts` precisa para type-checar sob o `tsconfig.json` da raiz.
- `memory.ts` importa os mesmos tipos do novo arquivo, sem mudança de comportamento.

**Justificativa:** sem essa correção, o CI recém-criado (Proposta 4) falharia em todo PR por um problema pré-existente, não relacionado aos 4 itens originais.

### Proposta 4 — CI + `.env.example` (implementada)

**Arquivos novos:** `.github/workflows/ci.yml`, `apps/web/.env.example`

- CI roda em PR e push para `main`: instala dependências da raiz e de `apps/web` (são dois `package-lock.json` distintos, não é um workspace npm), depois `npm run typecheck` e `npm run test --prefix apps/web`.
- `.env.example` documenta as 4 variáveis de ambiente reais do projeto (confirmadas lendo o código-fonte): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.

**Gap conhecido, deferido conscientemente:** o gate de cobertura ≥80% (NFR-8) descrito na arquitetura não foi incluído — o projeto não tem `@vitest/coverage-v8` instalado nem uma medição atual de cobertura, e ligar um gate sem saber se o número atual passa poderia travar todo PR futuro sem aviso. Fica como item de fast-follow separado, fora do escopo desta mudança.

### Proposta 5 — Runbook: convidar beta testers (operacional, não é código)

Decisão de Mario: convite manual pelo Supabase Dashboard (não um script).

1. Acesse o projeto no [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Users**.
2. Clique em **Invite user**, informe o email do beta tester e confirme. Repita para cada um dos até 5 convidados.
3. O Supabase envia um email com um link para o convidado definir a própria senha e ativar a conta — exatamente o fluxo da Story 1.4 (`supabase.auth.admin.inviteUserByEmail()` por trás da tela), sem formulário público de cadastro.
4. **Pré-requisito crítico:** em **Authentication** → **URL Configuration**, o **Site URL** (e a lista de **Redirect URLs**) precisa apontar para o domínio de produção (ex.: `https://seu-app.vercel.app`), não para `localhost`. Se isso não estiver configurado antes de convidar, o link do email leva para o ambiente errado. Faça isso **depois** do primeiro deploy (Proposta 6), quando o domínio de produção já existir.
5. Recomendação: convide a si mesmo primeiro como teste, confirme que o link funciona, só depois convide os beta testers de verdade.

### Proposta 6 — Runbook: colocar o site no ar (operacional, não é código)

Você não confirmou se já tem conta Vercel/projeto Supabase de produção; não encontrei `.vercel/` nem projeto linkado no repositório, então este runbook assume início do zero — pule os passos que já tiver feito.

**A. Supabase (produção)**
1. Se ainda não existir, crie um projeto novo em [supabase.com](https://supabase.com) (separado de qualquer projeto de desenvolvimento local, se houver).
2. Aplique as 11 migrations em `supabase/migrations/` **em ordem cronológica** (pelo timestamp no nome do arquivo) via **SQL Editor** do dashboard — cole e rode o conteúdo de cada arquivo, um de cada vez, do mais antigo (`20260716195536_chat_schema.sql`) ao mais recente (`20260823100000_user_patterns_daily_greeting.sql`). O CLI do Supabase não está linkado a este repositório (nenhuma automação de deploy de schema existe hoje), então este passo manual é necessário até isso mudar.
3. Em **Project Settings** → **API**, anote: `Project URL` (→ `NEXT_PUBLIC_SUPABASE_URL`), `anon public key` (→ `NEXT_PUBLIC_SUPABASE_ANON_KEY`), `service_role key` (→ `SUPABASE_SERVICE_ROLE_KEY`, **secreta**, nunca no client).

**B. Anthropic**
4. Gere uma API key em [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`.

**C. Vercel**
5. Suba o repositório para o GitHub, se ainda não estiver lá.
6. Crie um projeto novo no [Vercel Dashboard](https://vercel.com), importando esse repositório.
7. **Root Directory: `apps/web`** — é crítico, já que este não é um workspace npm (raiz e `apps/web` têm `package.json`/`package-lock.json` independentes); sem isso o build do Vercel não encontra o app Next.js.
8. Em **Settings** → **Environment Variables**, adicione as 4 variáveis coletadas acima (Production, e Preview se quiser testar PRs) — os nomes exatos estão em `apps/web/.env.example`.
9. Faça o primeiro deploy (deploy manual pelo dashboard, ou um push para `main` — deploys automáticos em `main` já são o padrão do Vercel).

**D. Fechar o laço**
10. Com o domínio de produção em mãos (ex.: `https://seu-app.vercel.app`), volte ao Supabase (**Authentication** → **URL Configuration**) e configure **Site URL**/**Redirect URLs** com esse domínio — sem isso, os links de convite e de redefinição de senha apontam para o lugar errado.
11. Só então siga a Proposta 5 (convidar os beta testers).

**Sobre o CI (Proposta 4):** a partir de agora, todo push para `main` roda o typecheck + testes automaticamente antes do Vercel também disparar seu próprio build/deploy — os dois pipelines são independentes; o CI do GitHub Actions não bloqueia o deploy do Vercel (o Vercel builda por conta própria), mas dá visibilidade de regressão em PRs.

## 5. PRD / MVP Impact

**MVP não é afetado.** Nenhum requisito funcional ou não-funcional muda. Esta mudança fecha uma lacuna de execução (deploy/CI nunca haviam sido feitos) e dois bugs de implementação — não altera o que o MVP entrega.

## 6. Implementation Handoff

| Item | Classificação | Responsável | Status |
|---|---|---|---|
| Proposta 1 (auto-scroll) | Minor — Direct Adjustment | Developer agent | ✅ Implementado e testado nesta sessão |
| Proposta 2 (Enter para enviar) | Minor — Direct Adjustment | Developer agent | ✅ Implementado e testado nesta sessão |
| Proposta 3 (fix typecheck raiz) | Minor — Direct Adjustment (achado de suporte) | Developer agent | ✅ Implementado e testado nesta sessão |
| Proposta 4 (CI + .env.example) | Minor — Direct Adjustment | Developer agent | ✅ Criado nesta sessão |
| Proposta 5 (convidar beta testers) | Operacional | Mario (manual, fora do app) | ⏳ Runbook entregue, execução pendente |
| Proposta 6 (deploy) | Operacional | Mario (manual, contas externas) | ⏳ Runbook entregue, execução pendente |

**Critério de sucesso:** `npm run typecheck` e `npm test` passam localmente e no CI (verificado nesta sessão — resta o gap conhecido de cobertura, deferido); o chat rola sozinho e aceita Enter para enviar (verificar manualmente no navegador); o site está acessível publicamente e ao menos 1 beta tester real consegue aceitar o convite e logar.

## 7. Known Gaps (não resolvidos nesta mudança, fora do trigger original)

- **Gate de cobertura ≥80% (NFR-8):** não implementado — requer instalar `@vitest/coverage-v8` e medir a cobertura atual antes de travar o CI nela.
- **`dashboard.test.ts` falhando:** 1 teste pré-existente falha (`combina sessionCount e temas do agregado com o streak calculado a partir das sessões`), em código já modificado e não commitado antes desta sessão (trabalho em andamento da saudação diária por IA, fora do escopo desta mudança) — não foi tocado aqui.
