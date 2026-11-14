# Story 6.1: Tornar o App Instalável no Android

Status: done

<!-- Origem: correct-course de 2026-11-13 — _bmad-output/planning-artifacts/sprint-change-proposal-2026-11-13.md -->

## Story

As a usuário beta com um celular Android,
I want instalar o Diário na tela inicial e abri-lo como um app,
so that eu chegue ao meu espaço de reflexão com um toque, sem barra de navegador.

## Acceptance Criteria

1. **Instalável e abre como app.** Com o app servido em contexto seguro (HTTPS ou `localhost`) e
   acessado pelo Chrome em Android ≥ 10, o menu do navegador oferece instalar o app. O painel
   "Application > Manifest" do DevTools não mostra erros de instalabilidade. Aberto pelo ícone da tela
   inicial, o app roda em modo `standalone` (sem barra de URL), com a barra de status na cor de fundo
   do app (`#080f12`, `--color-bg`).
2. **Manifest.** Servido pela convenção do Next (`src/app/manifest.ts` → `/manifest.webmanifest`),
   declara `name`, `short_name`, `description`, `lang: "pt-BR"`, `start_url: "/"`, `scope: "/"`,
   `display: "standalone"`, `background_color` e `theme_color` alinhados aos tokens da paleta Aura.
   **Não** declara `orientation` (portrait e landscape continuam suportados, NFR5).
3. **Ícone provisório.** Há um ícone derivado da paleta Aura (fundo `--color-bg`, marca em
   `--color-accent-1`) em 192×192 e 512×512, incluindo uma variante `purpose: "maskable"` com a marca
   dentro da área segura (círculo central de 80%), além de favicon e `apple-touch-icon` coerentes. A
   arte do ícone vive num **único ponto do código**: trocar pela arte final não exige mexer em
   manifest, layout e favicon separadamente.
4. **Página offline sem cache de dados.** Com o service worker registrado, uma navegação sem conexão
   mostra uma página offline em pt-BR, com o visual do app, que diz com honestidade que as conversas
   precisam de internet (sem prometer funcionamento offline). O service worker guarda em cache
   **apenas** a página offline (autocontida). Nunca guarda páginas autenticadas, respostas de
   `/api/chat`, Server Actions (POST) ou chamadas ao Supabase.
5. **Atualização sem ficar preso.** Um novo deploy (nova versão do `sw.js`) assume sem deixar o
   usuário preso numa versão antiga: `skipWaiting` + `clients.claim`, e os caches de versões
   anteriores são removidos no `activate`.
6. **Proxy.** O `config.matcher` de `src/proxy.ts` exclui manifest, `sw.js`, `offline.html` e as
   rotas de ícone gerado, sem disparar `supabase.auth.getUser()`. As rotas do app (`/`, `/chat`,
   `/historico`, `/insights`, `/configuracoes`, `/auth/*`, `/api/chat`) continuam passando pelo proxy.
7. **Sessão preservada.** Um usuário já logado no Chrome do celular continua logado ao abrir o app
   instalado (mesmos cookies). Os links de e-mail de convite e redefinição de senha continuam
   funcionando via `/auth/callback` (ADR 0006).
8. **Testes.** Há testes Vitest para:
   - os campos do manifest;
   - a exclusão e inclusão de rotas no `matcher` do proxy;
   - o componente de registro do service worker, incluindo navegador sem suporte;
   - o comportamento do `sw.js`: só intercepta navegações, só a página offline entra em cache e caches antigos são limpos.

   O teste manual registra a instalação num Android real e a página offline em modo avião.

## Tasks / Subtasks

- [x] **Task 1 — Ícone provisório gerado por código (AC: 3)**
  - [x] 1.1 Criar `src/lib/pwa/appIcon.tsx`, a **fonte única** da arte. Ele exporta uma função que
        recebe o tamanho e `maskable: boolean` e devolve o JSX para o `ImageResponse`: fundo sólido
        `#080f12`, com um orbe/círculo em teal (`#7fd0c8` → `#4ba39c`) inspirado na Aura. Em `maskable`, a marca
        ocupa no máximo cerca de 60% do lado, dentro do círculo seguro de 80%. Exportar também as constantes de
        cor (`PWA_BACKGROUND = "#080f12"`, `PWA_THEME = "#080f12"`) para o manifest e o viewport.
  - [x] 1.2 `src/app/icon.tsx`: usar `generateImageMetadata` para gerar `192` (purpose any),
        `512` (any) e `512-maskable` (`ImageResponse` de `next/og`, `contentType = "image/png"`).
        **Atenção Next 16:** `id` e `params` chegam como **Promise** (`const iconId = await id`).
  - [x] 1.3 `src/app/apple-icon.tsx`: 180×180, reaproveitando `appIcon.tsx`.
  - [x] 1.4 **Remover `src/app/favicon.ico`**, que é o favicon padrão do scaffold do Next (25.931
        bytes). O `<link rel="icon">` passa a vir do `icon.tsx`. Remover também `favicon.ico` do matcher do proxy
        só se não houver mais nenhuma referência (ver Task 4).
  - [x] 1.5 Rodar `npm run build` e **confirmar no output e no `<head>` renderizado as URLs reais**
        dos ícones gerados (com `generateImageMetadata` elas tendem a ser `/icon/<id>`, mas confirme
        antes de usar no manifest e no matcher).
- [x] **Task 2 — Manifest (AC: 2, 3)**
  - [x] 2.1 Criar `src/app/manifest.ts` (`MetadataRoute.Manifest`):
        - `name: "Diário Digital"` e `short_name: "Diário"`;
        - `description` igual à do `metadata` do layout;
        - `lang: "pt-BR"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`;
        - cores de `appIcon.tsx`;
        - `icons` apontando para as URLs confirmadas na Task 1.5, com `purpose` correto;
        - **sem `orientation`**.
- [x] **Task 3 — Viewport / tema no layout (AC: 1)**
  - [x] 3.1 Em `src/app/layout.tsx`, exportar `viewport: Viewport` com `themeColor: PWA_THEME` e
        `colorScheme: "dark"`. **Não** adicionar `viewportFit: "cover"`, que é escopo da Story 6.2
        (muda o comportamento das safe areas e exige ajuste de layout junto).
  - [x] 3.2 Não mexer no `metadata` existente (title/description) além do estritamente necessário.
        O Next já injeta o `<link rel="manifest">` pela convenção de arquivo.
- [x] **Task 4 — Proxy matcher (AC: 6)**
  - [x] 4.1 Estender a negative lookahead do `config.matcher` em `src/proxy.ts` para excluir
        `manifest.webmanifest`, `sw.js`, `offline.html`, `icon` e `apple-icon` (só a raiz dessas rotas
        geradas, ex.: `icon(?:/|$)`). Isso evita casar com rotas futuras que só comecem com "icon". Manter o
        valor como **literal constante**: o Next analisa o matcher estaticamente no build.
  - [x] 4.2 Testar com `unstable_doesMiddlewareMatch` de `next/experimental/testing/server`
        (é o helper do Next para isso, e funciona com o `config` exportado pelo `proxy.ts`). Cobrir:
        - URLs excluídas: manifest, sw, offline, cada URL de ícone;
        - URLs que **precisam continuar casando**: `/`, `/chat`, `/historico`, `/insights`, `/configuracoes`,
          `/auth/callback`, `/api/chat`.
- [x] **Task 5 — Página offline estática (AC: 4)**
  - [x] 5.1 Criar `public/offline.html` **autocontido**:
        - CSS inline com os valores dos tokens (`#080f12`, `#eef4f2`, `#b7c7c1`, `#7fd0c8`);
        - **fontes do sistema** (as fontes do `next/font` têm hash de build e não estariam em cache);
        - marca em SVG inline;
        - `lang="pt-BR"` e `<meta name="viewport">`.

        Copy honesta e curta, por exemplo: título "Sem conexão" e o texto "O Diário precisa de internet para
        conversar com você e guardar suas reflexões. Assim que a conexão voltar, é só tentar de novo."
        Incluir um botão "Tentar de novo" (`location.reload()`). Fonte ≥ 14px, contraste AA. Nenhum
        dado de usuário.
- [x] **Task 6 — Service worker (AC: 4, 5)**
  - [x] 6.1 Criar `public/sw.js` (JS puro, sem bundler, **sem `next-pwa`/Serwist**, como manda a
        arquitetura):
        - `const CACHE = "diario-offline-v1"` (incrementar a versão quando `offline.html` mudar);
        - `install`: `caches.open(CACHE).then(c => c.add("/offline.html"))` e `self.skipWaiting()`;
        - `activate`: apagar todo cache `!== CACHE` e `self.clients.claim()`;
        - `fetch`: **só** agir quando `event.request.mode === "navigate"`, com
          `event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")))`.
          Qualquer outra requisição (POST de Server Action, `/api/chat`, Supabase, assets) **não chama
          `respondWith`** e segue direto para a rede. Nunca chamar `cache.put` com respostas de rede.
  - [x] 6.2 Em `next.config.ts`, adicionar `headers()` para `/sw.js`, conforme o guia de PWA do Next 16:
        - `Content-Type: application/javascript; charset=utf-8`;
        - `Cache-Control: no-cache, no-store, must-revalidate`;
        - `Content-Security-Policy: default-src 'self'; script-src 'self'`.

        Preservar a config `turbopack.root` existente.
- [x] **Task 7 — Registro do service worker (AC: 4, 5)**
  - [x] 7.1 Criar `src/components/pwa/ServiceWorkerRegistrar.tsx` (`"use client"`, retorna `null`).
        No `useEffect`:
        - se `"serviceWorker" in navigator` e `process.env.NODE_ENV === "production"`, chamar
          `navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })`;
        - erro de registro só vai para o `console`, sem nada visível ao usuário.

        Em dev, não registrar: o SW atrapalha o HMR e mascara mudanças.
  - [x] 7.2 Renderizar `<ServiceWorkerRegistrar />` dentro do `<body>` em `src/app/layout.tsx`.
- [x] **Task 8 — Testes (AC: 8)**
  - [x] 8.1 `src/app/manifest.test.ts`: campos obrigatórios, ausência de `orientation`, ícones 192 e
        512 e um `maskable`, cores iguais às constantes.
  - [x] 8.2 `src/proxy.test.ts`: novos casos de matcher (Task 4.2), sem quebrar os testes existentes.
  - [x] 8.3 `src/components/pwa/ServiceWorkerRegistrar.test.tsx` (`// @vitest-environment jsdom`):
        - registra em produção com os argumentos certos;
        - não registra sem `serviceWorker` no navigator;
        - não registra fora de produção;
        - rejeição do `register` não lança.

        Usar `vi.stubEnv("NODE_ENV", ...)`.
  - [x] 8.4 `src/lib/pwa/sw.test.ts`: carregar `public/sw.js` com `node:vm` num contexto com `self`,
        `caches`, `fetch` e `clients` falsos, capturando os listeners. Afirmar que:
        - o `install` só adiciona `/offline.html`;
        - o `activate` apaga caches de outras versões;
        - um `fetch` não-navegação **não** chama `respondWith`;
        - uma navegação com rede ok devolve a resposta da rede **sem** gravar em cache;
        - uma navegação com rede falhando devolve a página offline.
  - [x] 8.5 `src/lib/pwa/appIcon.test.tsx` (opcional se coberto acima): o maskable respeita a área segura,
        afirmando sobre as dimensões do JSX devolvido.
  - [x] 8.6 `npm run typecheck`, `npm run lint` e `npm run test` verdes, e a cobertura não cai abaixo de 80%.
- [x] **Task 9 — Validação manual (AC: 1, 4, 5, 7)**
  - [x] 9.1 `npm run build && npm run start` (o SW só registra em produção).
  - [x] 9.2 No desktop: DevTools, Application > Manifest (sem erros, ícones renderizados) e Service
        Workers (ativo).
        - Network em "Offline" + navegar mostra `offline.html`.
        - Cache Storage contém **só** `diario-offline-v1` com `/offline.html`.
  - [ ] 9.3 **(pendente do Mario — ver docs/wiki/pendencias-manuais.md#testar-o-pwa-num-android-real)** **Android real sem deploy:** celular via USB com depuração USB ativa. No desktop, abrir
        `chrome://inspect` > Port forwarding `3000 → localhost:3000`, e no celular abrir
        `http://localhost:3000`. O Chrome trata `localhost` como contexto seguro, e o login funciona porque o
        Supabase já tem `localhost:3000` em `additional_redirect_urls`.
        - Instalar.
        - Abrir pelo ícone (standalone, barra de status escura).
        - Logar e fechar; reabrir continua logado.
        - Modo avião + navegar mostra a página offline.
  - [x] 9.4 Simular deploy novo: mudar `CACHE` para `v2`, rebuild e reabrir. O SW novo assume e o cache
        `v1` some.
- [x] **Task 10 — Documentação viva**
  - [x] 10.1 `docs/wiki/ui-e-navegacao.md`:
        - nova seção "PWA / instalação no Android" (o que faz, onde está no código, regra "SW sem cache
          de dados", ícone provisório em `src/lib/pwa/appIcon.tsx`, gotchas);
        - frontmatter: `epico` inclui 6, `ultima_atualizacao`, `decisoes: [0007]`, tags `pwa` e `android`.
  - [x] 10.2 `docs/wiki/index.md`: refletir o novo escopo do tópico.
  - [x] 10.3 ADR 0007: só atualizar "Onde isso aparece no código" com os caminhos finais, se divergirem.

## Dev Notes

### Contexto e valores que mandam nesta história

- **Privacidade acima de tudo:** a regra mais importante é que o SW **não** guarde conteúdo de usuário em cache.
  Um celular compartilhado com o app instalado não pode exibir conversas, sínteses ou o
  dashboard sem rede. Por isso o `fetch` só trata `navigate` e só **lê** do cache (nunca `put`).
  Logout e exclusão de conta não precisam limpar nada no SW, porque ele não guarda nada do usuário.
  Se algum dia isso mudar, a ADR 0007 tem de ser substituída.
- **Honestidade:** a página offline não promete modo offline nem "rascunho salvo".
- **Sem plugin:** a arquitetura e a ADR 0007 pedem service worker escrito à mão. `next-pwa` e Serwist ficam
  fora (o Serwist ainda exige webpack, e o projeto usa Turbopack).

### Estado atual dos arquivos que serão alterados (UPDATE)

- **`src/app/layout.tsx`:**
  - Server Component raiz; carrega 3 fontes `next/font/google` como CSS vars;
  - exporta `metadata` (title "Diário Digital" + description);
  - `<html lang="pt-BR">`, `<body>{children}</body>`;
  - não tem `viewport`.

  **Preservar:** fontes, classes no `<html>`, metadata.
- **`src/proxy.ts`:**
  - roda em toda requisição casada;
  - cria o server client do Supabase, chama `getUser()` (renova o token; **não remover**);
  - repassa `x-app-session-user` como header de request para os Server Components (`SESSION_USER_HEADER`, importado
    pelas páginas para decidir redirect);
  - **nunca redireciona**: a decisão de acesso é das páginas e da RLS;
  - matcher atual: `["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]`.

  **Só o matcher muda.** Atenção ao Server Functions: o guia diz que excluir um path no matcher também
  pula as Server Actions daquele path. Nenhuma das rotas excluídas tem Server Action, mas **não**
  exclua nada além do listado.
- **`src/proxy.test.ts`:** mocka `@supabase/ssr` e importa `./proxy` dinamicamente. Adicionar os
  testes de matcher num `describe` separado, importando `config`.
- **`next.config.ts`:** só tem `turbopack.root` (com um comentário explicando o porquê; mantenha).
  Acrescentar `async headers()`.
- **`src/app/favicon.ico`:** é o arquivo padrão do scaffold. Remover (Task 1.4).

### Detalhes do Next 16 (lido em `node_modules/next/dist/docs/`, conforme `apps/web/AGENTS.md`)

- `app/manifest.ts` é um Route Handler especial, cacheado por padrão, servido em `/manifest.webmanifest`, com
  `<link rel="manifest">` automático. [Source: docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md]
- `icon.tsx` e `apple-icon.tsx` são Route Handlers especiais, gerados estaticamente no build.
  - `favicon` **não** pode ser gerado por código; por isso usamos `icon`.
  - Com `generateImageMetadata`, cada item precisa de `id`, e no v16 `id`/`params` chegam como **Promise**.

  [Source: .../01-metadata/app-icons.md; .../04-functions/generate-image-metadata.md]
- `ImageResponse` (`next/og`) aceita só flexbox e um subconjunto de CSS (sem grid), com limite de 500KB.
  `radial-gradient`/`linear-gradient` em `background` funcionam. Não carregue fontes: a marca é
  geométrica, sem texto. [Source: .../04-functions/image-response.md]
- `viewport` é um export separado de `metadata` (`themeColor`, `colorScheme`, `viewportFit`).
  [Source: .../04-functions/generate-viewport.md]
- O `middleware.ts` foi renomeado para `proxy.ts`. O `matcher` precisa ser constante estática.
  [Source: .../03-file-conventions/proxy.md]
- Guia de PWA do Next: headers recomendados para `/sw.js`, `register('/sw.js', { scope: '/', updateViaCache: 'none' })`.
  O guia também lembra que o prompt de instalação **não exige suporte offline**: o SW aqui existe pela
  página offline e pelo requisito da arquitetura. [Source: .../02-guides/progressive-web-apps.md]

### Fora do escopo (não fazer aqui; é da Story 6.2)

- `viewportFit: "cover"` e ajustes de safe-area;
- trocar `100vh` por `100dvh`;
- corrigir a fonte de 11px do `.mobileDepthBadge`;
- auditoria de paisagem;
- item "Instalar app" em Configurações (`beforeinstallprompt`).

Não implementar nenhum convite de instalação nesta história.

### Gotchas previstos

- **ESLint em `public/sw.js`:** se o `eslint.config.mjs` analisar `public/`, ele vai acusar `self`, `caches` e `clients`
  como não definidos. Prefira um bloco de config com `globals.serviceworker` para `public/sw.js` a
  desligar regras no arquivo inteiro.
- **Teste do `sw.js` via `node:vm`:** resolva o caminho a partir do teste
  (`path.resolve(__dirname, "../../../public/sw.js")`) e dê ao contexto um `Response` real, porque o
  Node 20 tem `Response` global.
- **Navegações com redirect:** as páginas fazem `redirect("/auth")` no servidor. `fetch(event.request)`
  numa navegação devolve o redirect normalmente, sem tratamento extra. Não troque para
  `fetch(event.request.url)`, que perde `mode`/`credentials` e pode quebrar cookies.
- **Install falhando:** se `cache.add("/offline.html")` falhar, o SW não instala. Isso é aceitável, e o
  app continua funcionando online. Não esconda o erro com `catch` silencioso no `install`.

### Testing standards

- Vitest + RTL. Os arquivos de componente usam `// @vitest-environment jsdom` no topo (padrão do
  repo). O `vitest.setup.ts` já registra o `jest-dom` e o `cleanup`.
- Cobertura ≥ 80% (NFR8), com gate no CI.
- Testes em português, no estilo dos existentes ("registra o service worker em produção…").

### Project Structure Notes

- Pastas novas: `src/lib/pwa/` (arte do ícone + teste do sw) e `src/components/pwa/` (registrar),
  seguindo o padrão `lib/<domínio>` e `components/<domínio>` já usado (ex.: `lib/voice`,
  `components/nav`).
- Variância consciente em relação ao planejamento original: a arquitetura citava
  `public/manifest.json` + `public/icons/`, e este correct-course passou a usar `app/manifest.ts` + ícones gerados
  (já refletido no `architecture.md`). A tela offline é `public/offline.html` estático, não uma rota
  do Next, porque os assets com hash de build não ficariam disponíveis offline.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-11-13.md]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — PWA; árvore `apps/web`]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Instalação e Uso Offline (PWA)]
- [Source: docs/adr/0007-pwa-instalavel-twa-como-evolucao.md]
- [Source: docs/adr/0006-fluxo-implicito-templates-email-free-tier.md] (fluxo `/auth/callback`, que precisa continuar funcionando)
- [Source: docs/wiki/pendencias-manuais.md] (o app ainda não tem deploy de produção; o Supabase aceita `localhost:3000`)
- [Source: apps/web/src/styles/variables.css] (tokens Aura)

## Review Findings

Revisão crítica independente após o commit `46339a6`; correções em `98b3b99`.

- [x] [Review][Patch] **(média)** O `install` do SW usava `cache.add("/offline.html")`, que pode
  servir do cache HTTP. Uma versão nova do SW guardaria um `offline.html` antigo. Corrigido com
  `new Request(OFFLINE_URL, { cache: "reload" })`; o teste afirma o `cache: "reload"`.
- [x] [Review][Patch] **(baixa)** O `layout.tsx` importava constantes de `app/manifest.ts` (rota
  especial do Next). Nome e descrição foram movidos para `src/lib/pwa/appInfo.ts`.
- [x] [Review][Dismiss] Erros 5xx em navegação mostram o erro do servidor, não a página offline. É
  intencional: a página offline é só para falta de rede, e mostrá-la para 5xx seria desonesto.

## Dev Agent Record

### Agent Model Used

Claude Opus 5.5 (claude-opus-5-5), persona Dev (Amelia), fluxo `/dev-story`

### Debug Log References

- Vitest falhava em **todas** as suítes ("failed to find the current suite") quando rodado a partir de
  `d:\` minúsculo. O Windows carregava o módulo duas vezes. Com `D:\` maiúsculo passa. Registrado no `CLAUDE.md`.
- `npm run lint` acusou cerca de 26 mil problemas, todos vindos de `apps/web/.next.bak-stale-cache/`
  (backup local antigo, ignorado pelo git, fora do `globalIgnores` do ESLint). Sem essa pasta, o lint
  passa sem nenhum problema. A pasta não foi apagada (é do usuário).
- Na verificação manual, a emulação "offline" do DevTools não alcança o service worker (ele continua
  acessando a rede). A página offline foi verificada derrubando o servidor.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- O build confirmou as rotas geradas: `/icon/32`, `/icon/192`, `/icon/512`, `/icon/512-maskable` e
  `/apple-icon` (estáticas), além de `/manifest.webmanifest`.
- Adicionado um ícone de 32px (favicon de aba), além dos 192/512/maskable pedidos.
- Verificação manual via Chrome real (DevTools Protocol, servidor de produção): **8/8 OK**.
  - manifest sem erros;
  - 0 erros de instalabilidade;
  - SW ativo com escopo `/` e controlando a página;
  - cache só com `diario-offline-v1` → `/offline.html` após navegar por 5 telas;
  - SW v2 assumiu sozinho e apagou o v1;
  - servidor fora do ar mostrou a página "Sem conexão".
- AC1 (abrir em tela cheia num Android real) e AC7 (sessão no app instalado) dependem de aparelho
  físico. O teste ficou registrado como pendência manual com passo a passo (USB + `chrome://inspect`).
- Suíte completa: 78 arquivos e 636 testes passando (47 novos); typecheck e lint sem erros.
- Cobertura não medida: `@vitest/coverage-v8` não está instalado, e o gate segue fora do CI (ver
  pendencias-manuais). Todo o código novo tem teste dedicado.

### File List

- apps/web/public/sw.js (novo)
- apps/web/public/offline.html (novo)
- apps/web/src/app/icon.tsx (novo)
- apps/web/src/app/apple-icon.tsx (novo)
- apps/web/src/app/manifest.ts (novo)
- apps/web/src/app/manifest.test.ts (novo)
- apps/web/src/app/layout.tsx (alterado)
- apps/web/src/app/favicon.ico (removido)
- apps/web/src/lib/pwa/appIcon.tsx (novo)
- apps/web/src/lib/pwa/appIcon.test.tsx (novo)
- apps/web/src/lib/pwa/appInfo.ts (novo)
- apps/web/src/lib/pwa/sw.test.ts (novo)
- apps/web/src/components/pwa/ServiceWorkerRegistrar.tsx (novo)
- apps/web/src/components/pwa/ServiceWorkerRegistrar.test.tsx (novo)
- apps/web/src/proxy.ts (alterado — só o matcher)
- apps/web/src/proxy.test.ts (alterado — testes de matcher)
- apps/web/next.config.ts (alterado — headers do /sw.js)
- docs/wiki/ui-e-navegacao.md, docs/wiki/pendencias-manuais.md, docs/wiki/index.md
- docs/adr/0007-pwa-instalavel-twa-como-evolucao.md
- CLAUDE.md
