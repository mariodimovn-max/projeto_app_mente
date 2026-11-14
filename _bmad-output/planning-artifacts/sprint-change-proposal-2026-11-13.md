# Sprint Change Proposal — 2026-11-13

**Projeto:** Aplicativo de Diário Digital para Bem-Estar Mental
**Autor da mudança:** Mario Dimov
**Facilitado por:** Claude Code (`/bmad-correct-course`)
**Modo de trabalho:** Lote (batch)
**Status:** Aprovado por Mario em 2026-11-13. Edições A–F aplicadas e ADR 0007 criada na mesma sessão; Stories 6.1 e 6.2 seguem para `bmad-create-story` → `dev-story`

---

## 1. Issue Summary

**Problema:** o app ainda não pode ser instalado no Android, embora o Android seja a **plataforma primária** na especificação de UX (`ux-design-specification.md`, "Platform Strategy") e esteja coberto pelo NFR-5 do PRD.

**Como foi descoberto:** numa auditoria de prontidão para Android pedida pelo autor em 2026-11-13, depois do fechamento dos 5 épicos. O problema não surgiu de uma história específica.

**Tipo:** lacuna de planejamento. O requisito estava decidido, mas nunca virou história:

- `architecture.md`, decisões importantes e a seção "Frontend": "PWA: manifest + service worker mínimo escrito à mão (sem `next-pwa`), sem cache offline completo".
- `architecture.md`, "Implementation Sequence", item 11: "Manifest PWA + prompt de instalação no Android".
- `epics.md`, "Additional Requirements" (linha 132): o mesmo requisito, mas **sem nenhuma história** que o cubra.

**Evidências no código (`apps/web`):**

| Lacuna | Onde |
|---|---|
| Nenhum manifest (`manifest.json` / `app/manifest.ts`) | ausente |
| Nenhum ícone de app; `public/` tem só os SVGs do scaffold (`next.svg`, `vercel.svg`…) | `apps/web/public/` |
| Nenhum service worker nem registro | ausente |
| `layout.tsx` sem `viewport` / `themeColor` / `viewport-fit=cover` | `src/app/layout.tsx` |
| `env(safe-area-inset-bottom)` em uso, mas inerte sem `viewport-fit=cover` | `src/components/nav/PrimaryNav.module.css` |
| O filtro do proxy não exclui as rotas de PWA, e cada requisição de manifest/SW faria uma chamada ao Supabase Auth | `src/proxy.ts` (`config.matcher`) |
| `100vh` em vez de `100dvh` (o teclado virtual pode cobrir o conteúdo) | `src/app/auth/page.module.css:3`, `src/app/page.module.css:48` |
| Fonte de 11px (`0.6875rem`), abaixo do mínimo de 14px do NFR | `src/components/chat/ChatWindow.module.css` (`.mobileDepthBadge`) |
| Nenhuma regra para paisagem, que o NFR-5 promete | — |

**O que já está pronto:** layout pensado primeiro para o celular, `100dvh` na maioria das telas, navegação inferior fixa, dark mode, voz via Web Speech API (funciona no Chrome Android) e sessão por cookies (compatível com PWA).

---

## 2. Impact Analysis

**Impacto nos épicos:** os épicos 1 a 5 continuam concluídos, e nenhum é reaberto. **Criamos um novo Épico 6**, porque encaixar o PWA como história do Épico 4 (navegação) seria artificial: a entrega é de plataforma, não de navegação.

**Impacto nas histórias:** duas histórias novas (6.1 e 6.2). Nenhuma história existente muda.

**Conflitos com os documentos:**

| Documento | Conflito | Ação |
|---|---|---|
| PRD | Nenhum. O PRD já diz "Aplicativo nativo **ou PWA**" e o NFR-5 cobre Android ≥ 10 | Nenhuma edição |
| Arquitetura | A árvore de arquivos cita `public/manifest.json` (o padrão do Next 16 é `app/manifest.ts`) e `middleware.ts` (renomeado para `proxy.ts` no Next 16) | Edição pequena + registro da evolução TWA |
| UX | Não descreve o convite de instalação, a tela offline nem o ícone | Nova subseção curta em "Platform Strategy" |
| Épicos | O requisito existe sem história | Épico 6 + histórias 6.1 e 6.2 |

**Impacto técnico:**

- Nenhuma mudança de schema, de API ou de dependência paga.
- A geração dos ícones pode usar `next/og` (`ImageResponse`), que já vem com o Next, sem dependência nova.
- Ponto de atenção de **privacidade**: o service worker não pode guardar em cache conteúdo autenticado (conversas, sínteses, `/api/chat`). Em um celular compartilhado, isso exporia conteúdo íntimo fora da sessão. Isso vira critério de aceite explícito na 6.1.
- O Vercel já serve o site em HTTPS, que é requisito da instalação.
- O deploy não muda.

---

## 3. Recommended Approach

**Opção escolhida: ajuste direto (opção 1) com um novo épico.**

- **Esforço:** baixo (cerca de 1 dia para a 6.1 e meio a 1 dia para a 6.2).
- **Risco:** baixo. O risco principal é um service worker mal versionado deixar usuários presos numa versão antiga; isso é mitigado por um critério de aceite.
- **Prazo:** não afeta o beta, e na prática o destrava para os testadores com Android.

**Alternativas consideradas e descartadas:**

- **Capacitor:** o app depende de Server Actions e de rotas de servidor, então não pode ser empacotado como site estático. Seria apenas um navegador embutido apontando para o servidor. Além disso, a Web Speech API **não funciona** no navegador embutido do Android, o que quebraria a Story 2.3 (voz).
- **React Native:** reescreveria toda a interface. É desproporcional para um beta de 5 a 10 pessoas e para um desenvolvedor solo.
- **TWA na Play Store já agora:** exige conta Google Play (US$ 25), vínculo entre domínio e app (`assetlinks.json`) e, para contas pessoais novas, um teste fechado com cerca de 12 testadores por 14 dias antes da publicação. **Fica registrado como evolução pós-MVP.** Ela reaproveita 100% do PWA, porque a TWA é só um invólucro em volta dele.

**Divisão (decidida com o autor):** duas histórias.

- A 6.1 entrega o resultado verificável principal: o app instala e abre como app.
- A 6.2 reúne o polimento de layout e o convite de instalação, que concentram as decisões de UX.
- Assim, cada revisão de código e cada teste manual fica pequeno.

---

## 4. Detailed Change Proposals

### 4.1 Épicos (`epics.md`)

#### Edição A — FR Coverage Map

**ANTES:**

```
FR8: Epic 5 — Segurança de dados e conformidade LGPD
```

**DEPOIS:**

```
FR8: Epic 5 — Segurança de dados e conformidade LGPD
NFR5 (Android) + requisito adicional "PWA instalável": Epic 6 — App instalável no Android
```

**Justificativa:** deixar visível qual épico cobre o requisito que antes não tinha história.

#### Edição B — Epic List (acrescentar ao final)

```
### Epic 6: App Instalável no Android (PWA)
Usuário com Android consegue instalar o Diário na tela inicial e usá-lo como um app — tela cheia,
ícone próprio, layout que respeita teclado, barra de gestos e rotação — sem loja e sem app nativo
separado. Adicionado via correct-course de 2026-11-13: o requisito "PWA instalável" existia na
arquitetura e nos Additional Requirements, mas nenhuma história o cobria.
**FRs covered:** nenhum FR novo — fecha NFR5 (Android ≥10, portrait/landscape) e o requisito
adicional de PWA; reforça NFR6 (fonte mínima 14px).
```

#### Edição C — Seção do Épico 6 (acrescentar ao final do arquivo)

```
## Epic 6: App Instalável no Android (PWA)

Usuário com Android consegue instalar o Diário na tela inicial e usá-lo como um app, sem loja e sem
app nativo separado. Empacotamento para a Play Store (TWA) fica como evolução pós-MVP.

### Story 6.1: Tornar o App Instalável no Android

As a usuário beta com um celular Android,
I want instalar o Diário na tela inicial e abri-lo como um app,
So that eu chegue ao meu espaço de reflexão com um toque, sem barra de navegador.

**Acceptance Criteria:**

**Given** o app servido em HTTPS e acessado pelo Chrome em Android ≥ 10
**When** o usuário abre o menu do navegador
**Then** a opção de instalar o app está disponível (critérios de instalabilidade do Chrome
atendidos, verificados no painel "Application > Manifest" do DevTools sem erros)
**And** ao abrir pelo ícone da tela inicial, o app abre em modo `standalone` (sem barra de URL),
com a barra de status na cor de fundo do app (`--color-bg`)

**Given** o manifest do app
**When** ele é servido pela convenção do Next (`app/manifest.ts`)
**Then** declara `name`, `short_name`, `description`, `lang: "pt-BR"`, `start_url: "/"`,
`scope: "/"`, `display: "standalone"`, `background_color` e `theme_color` alinhados aos tokens da
paleta Aura
**And** não trava orientação (portrait e landscape continuam suportados — NFR5)

**Given** que ainda não existe arte final de ícone
**When** os ícones são gerados
**Then** existe um ícone provisório derivado da paleta Aura (fundo `--color-bg`, marca em
`--color-accent-1`) nos tamanhos 192×192 e 512×512, incluindo uma variante `maskable` com a marca
dentro da área segura, além de favicon e `apple-touch-icon` coerentes
**And** a origem do ícone fica concentrada num único ponto do código, para que trocar pela arte
final não exija mexer em manifest, layout e favicon separadamente

**Given** o service worker registrado
**When** o usuário navega sem conexão
**Then** vê uma página offline em pt-BR, com o visual do app, que diz com honestidade que as
conversas precisam de internet (sem prometer funcionamento offline)
**And** o service worker armazena em cache **apenas** a página offline e os recursos estáticos
dela (ícones, CSS) — nunca páginas autenticadas, respostas de `/api/chat`, Server Actions ou
chamadas ao Supabase (privacidade acima de tudo: em um aparelho compartilhado, nenhum conteúdo
íntimo pode ficar legível fora da sessão)

**Given** um novo deploy do app
**When** o usuário abre o app instalado
**Then** a nova versão do service worker assume sem deixar o usuário preso numa versão antiga
(caches de versões anteriores são removidos na ativação)

**Given** requisições ao manifest, ao service worker, aos ícones e à página offline
**When** passam pelo `proxy.ts`
**Then** o `matcher` as exclui, sem disparar `supabase.auth.getUser()`

**Given** um usuário já logado no Chrome do celular
**When** abre o app instalado
**Then** continua logado (mesma sessão por cookies), e os links de e-mail de convite e de
redefinição de senha continuam funcionando via `/auth/callback` (ADR 0006)

**Given** a entrega da história
**When** os testes rodam
**Then** há testes Vitest para os campos do manifest, para a exclusão de rotas no `matcher` do
proxy e para o componente de registro do service worker (incluindo navegador sem suporte)
**And** o teste manual registra a instalação num Android real e a página offline em modo avião

### Story 6.2: Polimento da Experiência no Celular e Convite de Instalação

As a usuário que usa o Diário no celular,
I want que as telas se ajustem ao teclado, à barra de gestos e à rotação, e saber que posso
instalar o app,
So that a experiência pareça de um app de verdade, sem que o app me pressione.

**Acceptance Criteria:**

**Given** o layout raiz
**When** o app é exibido em um Android com barra de gestos ou recorte de câmera
**Then** o `viewport` declara `viewport-fit=cover` e o conteúdo e a `PrimaryNav` respeitam as
áreas seguras (`env(safe-area-inset-*)`), sem nada escondido sob barras do sistema

**Given** as telas de autenticação e a Home
**When** o teclado virtual abre (ex.: digitando senha, ou mensagem no chat)
**Then** o campo em foco e o botão de ação continuam visíveis (`100vh` substituído por `100dvh` em
`auth/page.module.css` e `page.module.css`)

**Given** qualquer tela do app
**When** se audita o tamanho de fonte
**Then** nenhum texto fica abaixo de 14px (NFR6), incluindo o selo de profundidade do chat
(`.mobileDepthBadge`, hoje 11px)

**Given** um celular de 4,5" a 6,7" em paisagem
**When** o usuário usa chat, Home, Histórico, Insights e Configurações
**Then** todas as telas permanecem utilizáveis, sem conteúdo cortado e sem scroll horizontal, e o
composer do chat continua acessível com o teclado aberto

**Given** o navegador oferece instalação (`beforeinstallprompt`) e o app ainda não está instalado
**When** o usuário abre Configurações
**Then** vê um item discreto "Instalar o Diário na tela inicial", com uma linha de explicação
**And** ao tocar, o prompt nativo de instalação do Android é aberto
**And** se o app já roda instalado (`display-mode: standalone`) ou o navegador não suporta o
evento, o item não aparece
**And** não há banner, pop-up, lembrete ou convite de instalação em nenhuma outra tela

**Given** a entrega da história
**When** os testes rodam
**Then** há testes Vitest para o item de instalação (visível/oculto conforme suporte e estado
instalado) e para os ajustes testáveis de layout
**And** o teste manual percorre as telas principais em portrait e landscape num Android real
```

**Justificativa:** cobrir o requisito que estava sem história. A divisão separa "instalar"
(técnico, verificável) de "polir" (layout + decisão de UX), conforme decidido com o autor.

### 4.2 Arquitetura (`architecture.md`)

#### Edição D — Árvore de arquivos, bloco `apps/web`

**ANTES:**

```
│       ├── public/
│       │   ├── manifest.json               # PWA — instalável no Android
│       │   └── icons/
│       └── src/
│           ├── middleware.ts                # refresh de sessão Supabase (padrão @supabase/ssr)
│           ├── app/
│           │   ├── layout.tsx
```

**DEPOIS:**

```
│       ├── public/
│       │   └── sw.js                       # PWA — service worker mínimo (só página offline, sem cache de dados)
│       └── src/
│           ├── proxy.ts                     # refresh de sessão Supabase (padrão @supabase/ssr; `middleware.ts` renomeado no Next 16)
│           ├── app/
│           │   ├── layout.tsx               # viewport/themeColor + registro do service worker
│           │   ├── manifest.ts              # PWA — instalável no Android (convenção do Next)
│           │   ├── icon.tsx / apple-icon.tsx # ícones gerados (placeholder Aura — trocar pela arte final)
│           │   ├── offline/page.tsx         # página exibida pelo SW sem conexão
```

**Justificativa:** alinhar a árvore às convenções do Next 16 que serão usadas. O nome `middleware.ts`
já estava desatualizado desde a Story 1.1. Outras divergências da árvore (`login/` → `auth/`,
`settings/` → `configuracoes/`) existem, mas ficam fora do escopo desta mudança.

#### Edição E — "Deferred Decisions (Post-MVP)" (acrescentar item)

```
- Publicação na Play Store via TWA (Trusted Web Activity, ex.: Bubblewrap/PWABuilder) reaproveitando
  o PWA do Epic 6 — só se o beta mostrar necessidade de presença na loja. Capacitor/React Native
  descartados: o app depende de Server Actions/Route Handlers (não exporta estático) e a Web Speech
  API não está disponível no WebView do Android. Ver ADR 0007.
```

### 4.3 UX (`ux-design-specification.md`)

#### Edição F — Nova subseção logo após "Platform Strategy"

```
### Instalação e Uso Offline (PWA)

- **Instalação:** o app é um PWA instalável no Android (sem loja no MVP). O convite para instalar
  vive **apenas** em Configurações, como item discreto exibido só quando o navegador permite a
  instalação e o app ainda não está instalado — sem banners, pop-ups ou lembretes. Coerente com o
  princípio de não pressionar o usuário.
- **Ícone:** provisório, derivado da paleta Aura (fundo noturno, marca em teal). Arte final pendente.
- **Sem conexão:** página offline honesta ("suas conversas precisam de internet"), no visual do app.
  Nenhum conteúdo de conversa é guardado no aparelho para uso offline.
- **Layout:** respeita áreas seguras (barra de gestos/recorte), teclado virtual (`dvh`) e paisagem.
```

### 4.4 Documentação viva (aplicada junto com as histórias, conforme o CLAUDE.md)

- **ADR 0007** (nova, criada na aprovação desta proposta): "PWA instalável agora; TWA como
  evolução; Capacitor/React Native descartados", e atualização de `docs/adr/index.md`.
- **`docs/wiki/ui-e-navegacao.md`:** atualizado ao concluir cada história (PWA, ícone provisório,
  regra "SW sem cache de dados", convite de instalação), com frontmatter e `docs/wiki/index.md`.
- **`CLAUDE.md`, "Estado atual":** novo item `[ ] Epic 6 — App Instalável no Android (PWA)`,
  marcado ao concluir.
- **`sprint-status.yaml`:** não existe no projeto, então não se aplica.

---

## 5. PRD / MVP Impact

**O MVP não é afetado.** Nenhum requisito funcional ou não funcional muda. A mudança fecha uma
lacuna de execução: o PWA estava decidido, mas sem história. Na prática, ela **habilita** o
NFR-5 (Android) para o beta.

**Plano de ação em alto nível:**

1. Aprovar esta proposta e aplicar as edições A–F + ADR 0007.
2. Story 6.1: `bmad-create-story` → `dev-story` (implementação, revisão e teste em Android real).
3. Story 6.2: idem, depois da 6.1 (depende do manifest e do registro do SW para o convite de instalação).
4. Opcional: substituir o ícone provisório quando houver arte final (troca num único ponto).

---

## 6. Implementation Handoff

**Classificação do escopo: Moderado.** Entra um épico novo no backlog, mas sem replanejamento
de produto ou arquitetura.

| Papel | Responsabilidade |
|---|---|
| PO/SM (`bmad-create-story`) | Gerar os arquivos de história 6.1 e 6.2 em `implementation-artifacts/` a partir do Épico 6 |
| Dev (`dev-story`) | Implementar 6.1 e depois 6.2, com revisão de código e teste manual por critério de aceite |
| Mario | Teste em Android real (instalação, modo avião, paisagem); decidir depois sobre a arte final do ícone e sobre a TWA |

**Critérios de sucesso:**

- O DevTools mostra o app como instalável, sem erros de manifest.
- A instalação foi feita e verificada num Android real, abrindo em tela cheia.
- No modo avião, aparece a página offline, e nenhum dado de conversa fica em cache (verificado no painel Application > Cache Storage).
- Nenhum texto fica abaixo de 14px, e as telas principais são utilizáveis em paisagem.
- O CI passa (typecheck + testes + cobertura ≥ 80%).
