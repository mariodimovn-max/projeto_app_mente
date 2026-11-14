---
titulo: Navegação Principal, Layout da Home e PWA (Android)
epico: "4, ajuste fora do sprint, 6"
status: "em andamento"
ultima_atualizacao: 2026-11-13
depende_de: [auth]
relacionado: [insights-e-resumos, conversa-e-memoria, pendencias-manuais]
decisoes: [0007-pwa-instalavel-twa-como-evolucao]
tags: [nav, home, layout, design-system, saudacao-ia, pwa, android, service-worker]
---

# Navegação Principal, Layout da Home e PWA (Android)

## O que faz

- **Story 4.1 — Navegação Principal:** `PrimaryNav` (barra fixa com Início/Histórico/Insights,
  estado ativo via `usePathname`) integrada às 4 telas principais (`/`, `/chat`, `/historico`,
  `/insights`), com espaçamento reservado (`--nav-height`, incluindo
  `env(safe-area-inset-bottom)`) para não cobrir conteúdo. O link avulso "Histórico" do cabeçalho da
  Home (da Story 3.5) foi removido por ficar redundante.
- **Ajuste de UI fora do sprint de épicos — layout de duas colunas + saudação por IA:** a Home
  autenticada (`/`) ganhou um layout de duas colunas inspirado no mockup "Aura - Dashboard" —
  lateral com a Aura e a saudação (`h1` "Bom te ver de novo."/"Seu espaço está pronto.", inalterado)
  mais uma frase de apoio, e coluna de conteúdo com os indicadores (`DashboardStats`) e marcos
  pessoais. Empilha em telas estreitas, vira duas colunas a partir de 960px, reaproveitando a mesma
  técnica (flex-direction column/row, mesma ordem de DOM) já usada no hero de onboarding.
- **Story 6.1 — App instalável no Android (PWA):**
  - manifest em `/manifest.webmanifest` (standalone, pt-BR, sem travar orientação);
  - ícone provisório Aura gerado por código: `/icon/32`, `/icon/192`, `/icon/512`,
    `/icon/512-maskable` e `/apple-icon`;
  - `themeColor` `#080f12` no `viewport`;
  - service worker mínimo que mostra `offline.html` quando uma navegação falha por falta de rede.

  O Chrome reporta o app como instalável, sem erros. A Story 6.2 (polimento mobile + convite de
  instalação em Configurações) ainda está pendente.

## Onde está no código

- `apps/web/src/components/nav/` — `PrimaryNav`
- `apps/web/src/components/aura/`
- `apps/web/src/lib/agent/greeting.ts`, `apps/web/src/lib/dashboard/welcomeMessage.ts`
- `apps/web/src/app/page.tsx` — Home
- PWA (Story 6.1):
  - `apps/web/src/lib/pwa/appIcon.tsx`: **fonte única da arte do ícone**, cores e variantes.
    Para trocar pela arte final, mexa só nele.
  - `apps/web/src/lib/pwa/appInfo.ts`: nome e descrição do app.
  - `apps/web/src/app/icon.tsx`, `apple-icon.tsx` e `manifest.ts`.
  - `apps/web/src/components/pwa/ServiceWorkerRegistrar.tsx`: renderizado no `layout.tsx`.
  - `apps/web/public/sw.js` e `apps/web/public/offline.html`.
  - Headers do `/sw.js` em `apps/web/next.config.ts`; exclusões no matcher de `apps/web/src/proxy.ts`.

## Decisões e padrões

- A frase de apoio abaixo da saudação é gerada pela Anthropic API (mesmo padrão não-streaming da
  síntese de sessão, `messages.parse` com `zodOutputFormat`) para não repetir a mesma frase a cada
  visita. **Cacheada 1x por dia** em `user_patterns.daily_greeting`/`daily_greeting_date` — não
  recalculada a cada carregamento — e best-effort com timeout de 4s; qualquer falha (IA, timeout,
  escrita do cache) cai numa mensagem estática fixa, nunca bloqueia a Home.
- Só é gerada para quem já tem ao menos uma sessão sintetizada (`user_patterns.session_count > 0`);
  na primeira visita de verdade a lateral mostra só o `h1` estático, sem chamar a IA.
- O app **não tem nome de exibição do usuário** (só email, sem tabela de perfil) — a saudação não
  tenta adivinhar um nome, decisão confirmada com o usuário.
- O gráfico de "tendência emocional dos últimos 7 dias" do mockup original continua fora de escopo
  (falta granularidade diária — ver [insights-e-resumos.md](insights-e-resumos.md)).
- **PWA — o service worker não guarda dados do usuário** (ADR 0007).
  - O cache tem só o `offline.html`.
  - O `fetch` só trata navegações e nunca grava respostas de rede (nem páginas, nem `/api/chat`,
    nem Server Actions).
  - Por isso logout e exclusão de conta não precisam limpar nada no SW.
  - Qualquer proposta de cache offline de conteúdo exige uma nova ADR.
- **PWA — versionamento:** ao alterar `public/offline.html`, incremente `CACHE` em `public/sw.js`.
  O `activate` apaga os caches antigos, e o `install` busca a página com `cache: "reload"`.
- **PWA — página offline estática e autocontida** (CSS/SVG inline, fontes do sistema), não uma
  rota do Next: os assets do Next têm hash de build e não estariam disponíveis offline.
- **PWA — SW só registra em produção** (`next build && next start`); em dev ele atrapalharia o HMR.

## Gotchas conhecidos

- Sair de `/chat` pela nav e voltar dependia de retomar a sessão em andamento — sem isso,
  `ChatWindow` remontava vazio e criava uma sessão nova, órfã. Corrigido com `sessionId` guardado em
  `sessionStorage` e retomado via Server Action `resumeSession` ao montar. Qualquer mudança na
  navegação do chat precisa preservar esse comportamento.
- **PWA — testar offline:** "Offline" no DevTools (Network) **não alcança o service worker**, que
  continua acessando a rede. Para ver a página offline, derrube o servidor ou use o modo avião no
  aparelho.
- **PWA — matcher do proxy:** excluir um path também pula as Server Actions dele. Só arquivos do PWA
  sem Server Action estão excluídos; o teste em `proxy.test.ts` (`unstable_doesMiddlewareMatch`)
  garante que as rotas do app continuam passando.

## Pendências

Ver [pendencias-manuais.md](pendencias-manuais.md) — migration de `user_patterns_daily_greeting`
precisa ser aplicada manualmente no Supabase; teste manual em navegador pendente do usuário.

- **Story 6.1 — teste num Android real** (instalar, abrir em tela cheia, sessão preservada, modo
  avião): passo a passo em [pendencias-manuais.md](pendencias-manuais.md#testar-o-pwa-num-android-real).
- **Story 6.2** (backlog): `viewport-fit=cover` + safe areas, `100vh` → `100dvh` em `auth/` e na Home,
  fonte de 11px do `.mobileDepthBadge`, paisagem, item "Instalar" em Configurações.
- Arte final do ícone (hoje provisória): trocar só `src/lib/pwa/appIcon.tsx`.
