# Story 6.2: Polimento da Experiência no Celular e Convite de Instalação

Status: ready-for-dev

<!-- Origem: correct-course de 2026-11-13 — _bmad-output/planning-artifacts/sprint-change-proposal-2026-11-13.md -->

## Story

As a usuário que usa o Diário no celular,
I want que as telas se ajustem ao teclado, à barra de gestos e à rotação, e saber que posso instalar o app,
so that a experiência pareça de um app de verdade, sem que o app me pressione.

## Acceptance Criteria

1. **Áreas seguras.** O `viewport` declara `viewport-fit=cover` (`viewportFit: "cover"`). Em um
   Android com barra de gestos ou recorte de câmera, inclusive em **paisagem** (recorte na lateral),
   o conteúdo, a `PrimaryNav` fixa e as caixas de diálogo respeitam `env(safe-area-inset-*)`, e nada
   fica escondido sob barras do sistema ou sob o recorte.
2. **Teclado virtual.** `100vh` passa a `100dvh` em `src/app/auth/page.module.css` (`.main`) e em
   `src/app/page.module.css` (`.hero`). Com o teclado aberto (senha no login, mensagem no chat), o
   campo em foco e o botão de ação continuam visíveis.
3. **Tipografia (interpretação híbrida do NFR6, ADR 0008):**
   - todo texto de **conteúdo ou interativo** tem ≥ 14px (`var(--fs-sm)` ou maior), incluindo o
     `.mobileDepthBadge` (hoje 11px). Isso vale para rótulos da navegação, botões, links, textos de
     cards e mensagens, descrições, erros e status;
   - **rótulos decorativos** (mono, em caixa alta, com `letter-spacing`) e **metadados** (horários,
     contadores, datas curtas) têm ≥ 12px, **somente** via o novo token `--fs-xs`;
   - um teste automatizado falha se algum `*.module.css`/`globals.css` declarar fonte em `rem`/`px`
     literal abaixo de 14px.
4. **Paisagem.** Num celular de 4,5" a 6,7" em paisagem (cerca de 640–915 × 360–412 CSS px), chat,
   Home, Histórico, Insights, Configurações, login e política de privacidade continuam utilizáveis,
   sem conteúdo cortado e sem scroll horizontal. O composer do chat continua acessível com o teclado
   aberto, e as caixas de diálogo (sair e excluir conta) cabem na tela ou rolam por dentro, com os
   botões sempre alcançáveis.
5. **Convite de instalação.** Quando o navegador oferece instalação (`beforeinstallprompt`) e o app
   ainda não está instalado, Configurações mostra um item discreto "Instalar o Diário na tela inicial",
   com uma linha de explicação e um botão. Tocar abre o prompt nativo do Android. O item **não
   aparece** quando:
   - o app já roda instalado (`display-mode: standalone`);
   - o navegador não suporta o evento;
   - o app acabou de ser instalado (`appinstalled`);
   - o prompt já foi usado nesta carga de página.

   O banner automático do Chrome (mini-infobar) é suprimido. Não há banner, pop-up, lembrete ou
   convite em nenhuma outra tela.
6. **Testes.** Há testes Vitest para:
   - o item de instalação (visível/oculto em cada condição do AC5, clique chama `prompt()`);
   - o armazenamento do evento de instalação (capturado antes de Configurações montar);
   - o guarda de tipografia (AC3);
   - o `viewport` com `viewportFit: "cover"`.

   O teste manual percorre as telas em portrait e landscape, por emulação de dispositivo no Chrome
   real e num Android real (pendência do usuário, como na 6.1).

## Tasks / Subtasks

- [ ] **Task 1 — Viewport e áreas seguras (AC: 1)**
  - [ ] 1.1 Em `src/app/layout.tsx`, acrescentar `viewportFit: "cover"` ao `viewport` existente (já
        tem `themeColor` e `colorScheme` da 6.1). **Não** definir `interactiveWidget`: o padrão do
        Chrome Android (`resizes-visual`) mantém a `PrimaryNav` fixa atrás do teclado em vez de
        empurrá-la para cima, comendo a área útil.
  - [ ] 1.2 `src/app/globals.css`: no `body`, adicionar `padding-top: env(safe-area-inset-top)`,
        `padding-left: env(safe-area-inset-left)` e `padding-right: env(safe-area-inset-right)`.
        **Não** adicione `padding-bottom`: o inset inferior já é tratado pela `PrimaryNav` (o
        `--nav-height` inclui `safe-area-inset-bottom`). Nas telas **sem** nav (auth, privacidade,
        diálogos), confira no screenshot se o último elemento não fica sob a barra de gestos e, se
        ficar, some o inset no padding inferior **daquela tela**.
  - [ ] 1.3 `src/components/nav/PrimaryNav.module.css`: o `.nav` é `position: fixed` e não herda o
        padding do body. Usar `padding-left/right: max(var(--space), env(safe-area-inset-left/right))`.
  - [ ] 1.4 Overlays fixos (`.overlay` em `src/app/LogoutButton.module.css` e
        `src/components/settings/DeleteAccountButton.module.css`): `padding` com
        `max(var(--space), env(safe-area-inset-*))` nos quatro lados.
- [ ] **Task 2 — Altura com teclado (AC: 2)**
  - [ ] 2.1 `100vh` → `100dvh` em `app/auth/page.module.css` (`.main`) e `app/page.module.css`
        (`.hero`). São as **duas únicas** ocorrências restantes (auditado em 2026-11-13).
- [ ] **Task 3 — Tipografia híbrida (AC: 3)**
  - [ ] 3.1 `src/styles/variables.css`: adicionar `--fs-xs: 0.75rem; /* 12px — SÓ rótulos
        decorativos mono em caixa alta e metadados (horários, contadores); ver ADR 0008 */`.
        **Replicar** em `_bmad-output/planning-artifacts/design-system/variables.css` (o comentário do
        topo de `variables.css` exige isso).
  - [ ] 3.2 Percorrer **todas** as ocorrências abaixo de 14px (lista completa em Dev Notes →
        "Auditoria de fontes") e classificar cada uma:
        - **decorativo/meta** (tem `text-transform: uppercase` + `letter-spacing` e é rótulo, ou é
          horário, contador ou data curta) → `var(--fs-xs)`;
        - **todo o resto** (navegação, botões, chips, textos de card, mensagens, erros, status,
          dicas) → `var(--fs-sm)`.

        Ao usar o shorthand `font:`, manter peso e família, por exemplo
        `font: 400 0.6875rem var(--font-mono)` vira `font: 400 var(--fs-xs) var(--font-mono)`.
  - [ ] 3.3 Casos especiais:
        - `app/page.module.css:84` usa `clamp(0.6875rem, 0.2vw + 0.6rem, 0.8125rem)`; substituir pelo
          token adequado e remover o `clamp`;
        - `SynthesisReactionDock.module.css:59` tem 0.5625rem (9px). Verificar o que é: se for o rótulo
          de um emoji, vira `--fs-xs`; se for texto lido, `--fs-sm`;
        - `PersonalMilestones.module.css:80` e `SummaryCard.module.css:174` usam `font-size: 0.75rem`
          sem shorthand: classificar igual.
  - [ ] 3.4 Depois da troca, **checar visualmente** cada componente afetado (Task 6). Os textos maiores
        podem quebrar linha em chips, botões compactos e na `PrimaryNav`. Ajustar `gap`, `padding`,
        `white-space` ou `min-width` onde preciso, sem voltar a reduzir a fonte. Se o `.item` da nav
        crescer, revisar os `76px` de `--nav-height`.
  - [ ] 3.5 Criar `src/lib/a11y/typography.test.ts`, um guarda no mesmo espírito do `contrast.test.ts`:
        - ler todos os `src/**/*.css`;
        - extrair valores de `font-size:` e do tamanho dentro de `font:` (shorthand), sempre que
          forem `rem`, `em` ou `px` literais (inclusive dentro de `clamp()`/`calc()`);
        - falhar se algum for < 0.875rem (14px), listando arquivo:linha no erro;
        - `var(--fs-*)` passa (os tokens já são testados no `contrast.test.ts`);
        - **adicionar** a esse arquivo um teste de que `--fs-xs` vale 12px.
- [ ] **Task 4 — Paisagem e diálogos (AC: 4)**
  - [ ] 4.1 `.dialog` em `LogoutButton.module.css` e `DeleteAccountButton.module.css`:
        `max-height: calc(100dvh - 2 * var(--space))` + `overflow-y: auto`. O diálogo de excluir conta
        tem campo de confirmação e botões no fim, que precisam ser alcançáveis em 360px de altura.
  - [ ] 4.2 Auditar cada tela em paisagem por emulação (Task 6.2) e corrigir o que cortar. Pontos de
        atenção já conhecidos:
        - a `PrimaryNav` fixa ocupa cerca de 76px de cerca de 360px. Se a auditoria mostrar perda real
          de área útil, um `@media (orientation: landscape) and (max-height: 500px)` pode compactá-la
          (ícone e rótulo lado a lado, menos padding) **atualizando `--nav-height` no mesmo media
          query**, porque as telas reservam esse espaço;
        - os heros de auth e Home (`min-height: 100dvh`, conteúdo centralizado) têm de rolar, e não
          cortar, quando o conteúdo passa de 360px;
        - o chat (`.shell` 100dvh, `.history` com `overflow-y: auto`) com o teclado aberto.
  - [ ] 4.3 Nenhuma tela pode ter scroll horizontal (`document.documentElement.scrollWidth <=
        innerWidth`) em 640×360 e 915×412.
- [ ] **Task 5 — Convite de instalação em Configurações (AC: 5)**
  - [ ] 5.1 `src/types/before-install-prompt.d.ts`: declarar `BeforeInstallPromptEvent`
        (`prompt(): Promise<void>`, `userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform:
        string }>`) e `WindowEventMap["beforeinstallprompt"]`. O tipo não existe em `lib.dom`.
        Seguir o padrão de `src/types/speech-recognition.d.ts`.
  - [ ] 5.2 `src/lib/pwa/installPrompt.ts`, armazenamento em nível de módulo (sem dependência nova).
        **Por quê:** o evento dispara uma vez, no carregamento da primeira página, e um usuário que
        entra pela Home e navega (client-side) até Configurações perderia o evento se só o componente
        da tela escutasse.
        - `startInstallPromptCapture()`: idempotente, registra os listeners de `window` uma única vez.
          - Em `beforeinstallprompt`: `event.preventDefault()` (suprime o mini-infobar do Chrome, por
            "sem pressão"), guarda o evento e notifica os inscritos.
          - Em `appinstalled`: descarta o evento, marca como instalado e notifica.
        - `getInstallPromptState()` devolve `"unavailable" | "available" | "installed"`.
          - `"installed"` se `matchMedia("(display-mode: standalone)").matches` ou se `appinstalled`
            disparou.
          - Para o `useSyncExternalStore`, o snapshot precisa ser **estável**: devolva a string, não
            um objeto novo.
        - `subscribeInstallPrompt(callback)` devolve a função de cancelamento.
        - `promptInstall()`: chama `deferred.prompt()`, aguarda `userChoice` e **descarta** o evento em
          qualquer resultado, porque um `BeforeInstallPromptEvent` só pode ser usado uma vez. Notifica
          os inscritos.
        - Exportar `resetInstallPromptForTests()` (ou equivalente) para isolar os testes.
  - [ ] 5.3 Chamar `startInstallPromptCapture()` no `useEffect` do `ServiceWorkerRegistrar`
        **antes** do `return` de "não é produção". A captura do evento não depende do SW e deve
        funcionar também em dev. Renomear o componente é desnecessário; atualizar o comentário do
        topo. Alternativa aceitável: um componente irmão `InstallPromptCapture` no layout. Escolha um
        e justifique no Dev Agent Record.
  - [ ] 5.4 `src/components/settings/InstallAppItem.tsx` (`"use client"`):
        - `useSyncExternalStore(subscribeInstallPrompt, getInstallPromptState, () => "unavailable")`;
          o snapshot de servidor `"unavailable"` evita hydration mismatch;
        - renderiza **somente** em `"available"`;
        - visual: mesmo padrão de card do `ExportDataButton` (`section` com `aria-label`, `.card`,
          `.heading` mono em caixa alta, `.description`, botão com
          `composes: primaryButton from "../../styles/shared.module.css"`).
          Copy:
          - heading "Instalar o Diário na tela inicial";
          - descrição "Abra o Diário direto da tela inicial do celular, em tela cheia, como um app.";
          - botão "Instalar".

          Enquanto o prompt está aberto, desabilitar o botão.
  - [ ] 5.5 `src/app/configuracoes/page.tsx`: renderizar `<InstallAppItem />` **depois** do
        `<ExportDataButton />` e **antes** do `<DeleteAccountButton />`. A ação destrutiva continua por
        último. Atualizar o comentário do topo ("qualquer preferência futura deve entrar aqui").
- [ ] **Task 6 — Testes e verificação (AC: 6)**
  - [ ] 6.1 Testes Vitest:
        - `installPrompt.test.ts`:
          - captura antes de qualquer inscrito;
          - `preventDefault` chamado;
          - `appinstalled` vira `installed`;
          - `standalone` vira `installed`;
          - `promptInstall` descarta o evento após `accepted` **e** após `dismissed`;
          - chamada sem evento não lança;
          - listeners registrados uma vez só.
        - `InstallAppItem.test.tsx` (jsdom): oculto por padrão, aparece após o evento, some após
          `appinstalled`, clique chama `prompt()`, botão desabilitado durante o prompt.
        - Ajuste em `ServiceWorkerRegistrar.test.tsx`: a captura começa também fora de produção.
        - `typography.test.ts` (Task 3.5).
        - `layout`: `viewport.viewportFit === "cover"`. Pode ser testado importando `viewport` de
          `src/app/layout.tsx`; se o import das fontes `next/font` atrapalhar no Vitest, mova o objeto
          `viewport` para `src/lib/pwa/` e teste lá.
        - Rodar a suíte inteira a partir de `D:\` maiúsculo (gotcha do CLAUDE.md).
  - [ ] 6.2 Verificação no Chrome real via DevTools Protocol, reaproveitando a abordagem da 6.1
        (`Emulation.setDeviceMetricsOverride` com `mobile: true` e
        `screenOrientation: { type: "landscapePrimary", angle: 90 }`):
        - capturar screenshots de cada tela em 412×915 (portrait) e 915×412 / 640×360 (landscape);
        - checar `scrollWidth <= innerWidth`;
        - abrir os diálogos em 640×360 e conferir que os botões são alcançáveis;
        - telas autenticadas precisam de login: **pedir ao Mario uma conta de teste** ou, na falta dela,
          verificar só as públicas (`/`, `/auth`, `/privacidade`, `/offline.html`) e registrar as
          demais como pendência manual.
  - [ ] 6.3 Convite de instalação em produção (`next build && next start`): o Chrome headless não
        dispara `beforeinstallprompt` de forma confiável. Verificar pelo teste de unidade e no Android
        real (pendência manual).
- [ ] **Task 7 — Documentação viva**
  - [ ] 7.1 **ADR 0008** "NFR6 — fonte mínima: 14px para conteúdo/interação, 12px para rótulos
        decorativos e metadados via `--fs-xs`". Contexto: a Story 1.2 tratou 14–24px como faixa de zoom;
        a auditoria de 2026-11-13 achou cerca de 75 ocorrências entre 9 e 13px; o autor escolheu a
        interpretação híbrida para preservar a identidade Aura. Inclui a regra objetiva de
        classificação e o guarda `typography.test.ts`. Atualizar `docs/adr/index.md`.
  - [ ] 7.2 `docs/wiki/ui-e-navegacao.md`:
        - convite de instalação (store, supressão do mini-infobar, posição em Configurações);
        - áreas seguras;
        - regra tipográfica;
        - frontmatter (`decisoes` + 0008; status `completo` se o Epic 6 fechar).
  - [ ] 7.3 `docs/wiki/pendencias-manuais.md`: estender o roteiro do Android real com paisagem e o item
        "Instalar" em Configurações.
  - [ ] 7.4 `CLAUDE.md`: marcar o Epic 6 como concluído (se for o caso) e, na tabela de NFRs, deixar
        "Fonte mínima" apontando para a ADR 0008.

## Dev Notes

### Contexto e valores

- **Sem pressão (UX, Platform Strategy → "Instalação e Uso Offline"):** o convite vive **só** em
  Configurações. Suprimir o mini-infobar com `preventDefault()` é coerente com isso. A instalação
  continua possível pelo menu ⋮ do Chrome.
- **Honestidade:** o item só aparece quando instalar é realmente possível, nunca como botão morto.
- **Privacidade:** nada novo é armazenado. O estado de instalação é só memória da página; **não**
  usar `localStorage` para "já recusou".

### Aprendizados da Story 6.1 (ler antes de começar)

- **Rode o Vitest a partir de `D:\` maiúsculo** (`cd "D:/projeto_app_mente/apps/web"`). Com `d:\`,
  toda suíte falha com "failed to find the current suite".
- `npm run lint` acusa cerca de 26 mil problemas vindos de `apps/web/.next.bak-stale-cache/`, um backup
  local do usuário fora do `globalIgnores`. Valide com `npx eslint . --ignore-pattern
  ".next.bak-stale-cache/**"` e **não apague** a pasta.
- O SW só registra em produção, e a emulação "offline" do DevTools não alcança o SW. Não é tema desta
  história, mas a verificação manual roda em `next build && next start`.
- A verificação via Chrome real + DevTools Protocol (Node 24 tem `WebSocket` global) funcionou bem na
  6.1. O script de referência é `pwa-check.mjs`, no scratchpad daquela sessão; reescreva se não
  estiver disponível.
- Padrão de testes do SW e do proxy: `unstable_doesMiddlewareMatch` e `node:vm`. Esta história não
  mexe no SW nem no proxy.
- A 6.1 já criou `src/lib/pwa/` (`appIcon.tsx`, `appInfo.ts`) e
  `src/components/pwa/ServiceWorkerRegistrar.tsx`, que é renderizado no `<body>` do layout raiz. É o
  lugar natural para iniciar a captura do evento de instalação.

### Estado atual dos arquivos que serão alterados (UPDATE)

- **`src/app/layout.tsx`:** `viewport = { themeColor: PWA_THEME, colorScheme: "dark" }`. Renderiza
  `<ServiceWorkerRegistrar />` no fim do `<body>`. Preservar as fontes `next/font` (3 variáveis no
  `<html>`) e o `metadata` (de `lib/pwa/appInfo.ts`).
- **`src/app/globals.css`:**
  - `html`/`body` com `max-width: 100vw; overflow-x: hidden`;
  - `body` em `display: flex; flex-direction: column`, com fundo `--color-bg`.

  O padding de safe-area entra no `body` sem quebrar o `flex`.
- **`src/styles/variables.css`:**
  - tokens `--fs-sm` (14px) a `--fs-xxl`;
  - `--nav-height: calc(76px + env(safe-area-inset-bottom))`, com um comentário longo sobre o porquê
    (preservar);
  - `contrast.test.ts` lê tokens deste arquivo e exige hex sólido em
    `color-bg`/`surface`/`text`/`muted`.
- **`src/components/nav/PrimaryNav.module.css`:**
  - `.nav` fixa com padding inferior que já soma `safe-area-inset-bottom`;
  - `.item` com `font: 500 0.6875rem` (11px), que é **interativo** e vai a `--fs-sm`;
  - `min-width: 64px`.

  São 3 itens ("Início", "Histórico", "Insights"); Configurações fica num link da Home, fora da nav.
  Com 14px, verifique se cabem lado a lado em 360px de largura.
- **`src/app/LogoutButton.module.css` / `src/components/settings/DeleteAccountButton.module.css`:**
  `.overlay` fixo (`inset: 0`, centralizado, `padding: var(--space)`) e `.dialog` (`max-width: 420px`,
  sem `max-height`).
- **`src/components/settings/ExportDataButton.tsx` + `.module.css`:** referência visual e estrutural
  do card de Configurações. `.heading` com 11px mono em caixa alta, que é **decorativo**, vai a
  `--fs-xs`; o `.description` já usa `--fs-sm`.
- **`src/app/configuracoes/page.tsx`:** Server Component; redirect para `/auth` sem sessão (via header
  `SESSION_USER_HEADER` do proxy). Renderiza o header, `<ExportDataButton />` e
  `<DeleteAccountButton />`, mais a `<PrimaryNav />`.
- **`src/components/pwa/ServiceWorkerRegistrar.tsx`:** `useEffect` que retorna cedo fora de produção
  ou sem `serviceWorker`. A captura do install prompt precisa vir **antes** desses `return`s.

### Auditoria de fontes (2026-11-13), todas as ocorrências abaixo de 14px

Formato `arquivo:linha → tamanho`. Classifique cada uma pela regra da Task 3.2, olhando o seletor no
arquivo.

- `app/auth/page.module.css`: 27 → 10px, 42 → 11px
- `app/page.module.css`: 13 → 13px, 24 → 13px, 63 → 10px, 84 → clamp(11–13px), 358 → 10px
- `app/privacidade/page.module.css`: 26 → 11px, 55 → 12px
- `components/chat/ChatComposer.module.css`: 25, 106, 116, 203, 216, 228, 241, 251
- `components/chat/ChatWindow.module.css`: 34 → 11px (`.mobileDepthBadge`)
- `components/chat/DepthMeter.module.css`: 15, 47, 98, 104
- `components/chat/MessageBubble.module.css`: 10, 44
- `components/chat/TranscriptBlock.module.css`: 9, 41, 54, 64
- `components/dashboard/DashboardStats.module.css`: 26, 98
- `components/dashboard/PersonalMilestoneCard.module.css`: 30, 52, 118
- `components/dashboard/PersonalMilestones.module.css`: 19, 30, 80, 95
- `components/history/HistoryCard.module.css`: 24, 66, 125, 136, 161, 174, 179, 184, 190
- `components/history/HistoryList.module.css`: 17
- `components/insights/PatternPrivacyNotice.module.css`: 15
- `components/insights/SessionRestedNotice.module.css`: 20
- `components/insights/SummaryCard.module.css`: 25, 49, 85, 106, 126, 152, 167, 174
- `components/insights/SynthesisCard.module.css`: 68, 79, 106, 115, 169
- `components/insights/SynthesisReactionDock.module.css`: 22, 59 (9px), 111, 161, 169
- `components/nav/PrimaryNav.module.css`: 25 (interativo)
- `components/settings/DeleteAccountButton.module.css`: 22
- `components/settings/ExportDataButton.module.css`: 22

O guarda `typography.test.ts` é a fonte de verdade final: se ele passar, nenhuma ficou para trás.

### Next 16: `viewport`

`viewportFit` é um campo do `Viewport` (`"auto" | "contain" | "cover"`), ao lado de `themeColor`
e `colorScheme`, e gera `<meta name="viewport" content="...viewport-fit=cover">`. Lido em
`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md`. Não use
`interactiveWidget` (ver Task 1.1).

### `beforeinstallprompt` (Chromium)

- Dispara quando o app atende os critérios de instalação e ainda não está instalado. **Não é
  garantido** em toda carga: o Chrome pode suprimir o evento por heurística.
- `preventDefault()` impede o mini-infobar automático e permite chamar `prompt()` depois.
- Cada evento permite **um** `prompt()`. Depois de `userChoice`, descarte-o.
- O guia de PWA do Next desaconselha botão próprio por não ser multiplataforma (não existe no Safari
  iOS). Aqui o produto é Android-first e o item simplesmente não aparece onde o evento não existe, o
  que é coerente com o AC5.

### Gotchas previstos

- **Hydration:** `InstallAppItem` não pode ler `window` no render do servidor. O
  `useSyncExternalStore` com server snapshot `"unavailable"` resolve.
- **Testes do store:** como o estado vive no módulo, isole cada teste com
  `resetInstallPromptForTests()` ou `vi.resetModules()` + import dinâmico. Simule o evento com
  `Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice })`.
- **`matchMedia` no jsdom** não existe por padrão; faça stub por teste.
- **Padding de safe-area no `body` + `--nav-height`:** não conte o inset inferior duas vezes (ver
  Task 1.2).
- **Fontes maiores na `PrimaryNav`:** a altura real da barra pode passar dos 76px reservados e cobrir
  o fim do conteúdo, como já aconteceu com o composer em iOS (ver o comentário de `--nav-height`).
  Meça no screenshot.

### Fora do escopo

- Arte final do ícone e publicação na Play Store (TWA).
- Qualquer cache offline de conteúdo (ADR 0007).
- Reescrever o design system ou mudar a paleta.
- Mudar fontes que **já** estão em ≥ 14px.

### Testing standards

Vitest + RTL. Componentes começam com `// @vitest-environment jsdom`. O `vitest.setup.ts` já registra
o `jest-dom` e o `cleanup`. Os nomes dos testes ficam em português. A cobertura não é medida (sem
`@vitest/coverage-v8`), mas todo código novo leva teste dedicado.

### Project Structure Notes

- Novos arquivos:
  - `src/lib/pwa/installPrompt.ts` (+ teste);
  - `src/components/settings/InstallAppItem.tsx` (+ `.module.css`, + teste);
  - `src/types/before-install-prompt.d.ts`;
  - `src/lib/a11y/typography.test.ts`;
  - `docs/adr/0008-...md`.
- O item de instalação mora em `components/settings/`, ao lado dos outros itens de Configurações. A
  lógica de PWA fica em `lib/pwa/`, como na 6.1.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] (AC de tipografia ajustado em 2026-11-13 para a interpretação híbrida)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Instalação e Uso Offline (PWA)]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-5 Compatibilidade] (portrait + landscape, telas de 4,5" a 6,7")
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-6 Acessibilidade] (fonte min 14px)
- [Source: _bmad-output/implementation-artifacts/1-2-fundacao-visual-e-acessibilidade.md] (AC4: 14–24px como faixa de ajuste)
- [Source: _bmad-output/implementation-artifacts/6-1-tornar-o-app-instalavel-no-android.md] (aprendizados, Debug Log)
- [Source: docs/adr/0007-pwa-instalavel-twa-como-evolucao.md]
- [Source: docs/wiki/ui-e-navegacao.md] (PrimaryNav, `--nav-height`, PWA)
- [Source: apps/web/src/lib/a11y/contrast.test.ts] (padrão de teste que lê tokens de CSS)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List
