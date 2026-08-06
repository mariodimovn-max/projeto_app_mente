# Story 4.1: Navegação Principal entre Início, Histórico e Insights

Status: done

## Story

As a usuário navegando pelo app,
I want uma navegação simples entre as telas principais,
so that eu encontre facilmente onde revisar meu progresso sem me perder em menus complexos.

## Acceptance Criteria

1. **Given** um usuário autenticado em qualquer tela principal, **when** ele interagir com a barra de navegação, **then** ele acessa as telas de Início, Histórico e Insights sem perder o estado da sessão em andamento.
2. **Given** a navegação principal, **when** o usuário navegar entre telas, **then** ela permanece visível e consistente em todas as telas principais.

## Tasks / Subtasks

- [x] Implementar a navegação principal com 2–3 ícones.
  - [x] Novo `components/nav/PrimaryNav.tsx` (client component) — barra fixa no rodapé com 3 destinos (Início `/`, Histórico `/historico`, Insights `/insights`), landmark `<nav aria-label="Navegação principal">`, estado ativo via `usePathname` (`aria-current="page"`), seguindo o padrão visual "Aura" (`--color-accent-1`/`--color-muted`, blur, `--color-border`).
  - [x] Nova rota `/insights` (`app/insights/page.tsx`) — mesma checagem de autenticação (`SESSION_USER_HEADER`) das demais telas principais; conteúdo do dashboard em si é escopo das Stories 4.2/4.4/4.5, aqui só o destino alcançável pela nav.
  - [x] `PrimaryNav` integrada às 4 telas principais (`/`, `/chat`, `/historico`, `/insights`); removido o link avulso "Histórico" do cabeçalho da Home (Story 3.5), agora redundante com a nav.
  - [x] Novo token `--nav-height` (`styles/variables.css`, replicado em `design-system/variables.css`) usado como `padding-bottom` reservado nas telas que incluem a nav fixa, para o conteúdo (incluindo o composer do chat) não ficar coberto por ela.
- [x] Garantir persistência do estado da sessão em andamento.
  - [x] Novo `lib/actions/resumeSession.ts` (Server Action) + `ChatWindow` guarda o `sessionId` ativo em `sessionStorage` (chave `diario:activeSessionId`) e o retoma (mensagens + id) ao montar, se a sessão ainda não tiver síntese. Ver "Review Findings" — a primeira versão desta subtask assumia (incorretamente) que isso já acontecia "por construção"; a revisão de código pegou o gap antes do merge.

### Review Findings

- [x] [Review][Patch] AC1 violado: sair de `/chat` pela `PrimaryNav` e voltar não retomava a sessão em andamento — `ChatWindow` remontava com `messages: []` e `sessionIdRef.current: null`, então a próxima mensagem enviada criava uma sessão nova no banco (`ensureSessionId`), órfã e sem timer de inatividade. `apps/web/src/components/chat/ChatWindow.tsx` — corrigido: sessionId ativo salvo em `sessionStorage` a cada resposta do servidor, retomado (mensagens + id) num efeito de montagem via nova Server Action `resumeSession`, limpo ao encerrar a sessão; guarda (`hasSentRef`) evita que a retomada assíncrona sobrescreva uma conversa nova já iniciada pelo usuário antes dela terminar.
- [x] [Review][Patch] `--nav-height` (68px fixos) não incluía `env(safe-area-inset-bottom)`, enquanto a própria `PrimaryNav` soma esse inset ao seu padding — em iPhones com indicador de início, a barra renderizada ficava mais alta que o espaço reservado nas telas, cobrindo o fim do conteúdo (ex.: composer do chat). `apps/web/src/styles/variables.css`, `_bmad-output/planning-artifacts/design-system/variables.css` — corrigido: `--nav-height` agora é `calc(76px + env(safe-area-inset-bottom))` (76px por conta real do conteúdo da barra, recalculada), então toda tela que reserva esse espaço já contempla a safe area automaticamente.
- [x] [Review][Patch] `/insights` renderizava `<PrimaryNav />` como filha de `<main>`, diferente das outras 3 telas (Início/Chat/Histórico), que a renderizam como irmã de `<main>` — inconsistência de landmark (`nav` dentro de `main`) só nessa rota. `apps/web/src/app/insights/page.tsx` — corrigido: `PrimaryNav` movida para fora do `<main>`, mesmo padrão das demais.
- [x] [Review][Patch] A Home reservava `padding-bottom` de `--nav-height` incondicionalmente em `.content`, mas `PrimaryNav` só renderiza quando `isAuthenticated` — visitante anônimo via ~90px de respiro extra sem nav nenhuma para justificá-lo. `apps/web/src/app/page.tsx`, `apps/web/src/app/page.module.css` — corrigido: padding extra movido para uma classe `.contentWithNav` aplicada só quando autenticado.
- [x] [Review][Patch] `justify-content: center` repetido no media query desktop do `PrimaryNav`, já era o valor da regra base — código morto. `apps/web/src/components/nav/PrimaryNav.module.css` — corrigido: removido.
- [x] [Review][Dismiss] Suspeita de erro de compilação por `PrimaryNav.tsx` usar `React.ReactNode` sem importar `React` — falso positivo: `apps/web/src/app/layout.tsx` (pré-existente, não tocado por esta story) já usa o mesmo padrão sem import explícito, e `tsc --noEmit` roda limpo nos dois casos (o `@types/react` do projeto expõe `React` como namespace global). Nenhuma mudança.

## Dev Notes

- `PrimaryNav` é `position: fixed` (não participa do fluxo do documento), por isso cada tela que a inclui reserva espaço próprio no rodapé somando `var(--nav-height)` ao seu `padding-bottom` — sem isso a barra sobreporia o fim do conteúdo (no chat, o composer/botão "Encerrar sessão").
- A nav é renderizada individualmente em cada uma das 4 páginas (`page.tsx` de `/`, `/chat`, `/historico`, `/insights`), não num layout compartilhado: as 4 rotas não compartilham um segmento de pasta comum sob `app/` sem também englobar `/auth/*`, e criar um route group só para isso seria uma reestruturação maior do que o escopo desta story pedia.
- `/insights` só existe, nesta story, como destino de navegação — sem dashboard, sem dados. O conteúdo real (indicadores, resumos) é das Stories 4.2/4.4/4.5 e vai substituir o placeholder atual.
- Detalhe de sessão (`/historico/[sessionId]`) e telas de `/auth/*` não recebem a `PrimaryNav` — não são "telas principais" no sentido do AC2 (são detalhe/drill-down e fluxo pré-login, respectivamente).
- Retomada de sessão (AC1) é resolvida inteiramente no cliente, via `sessionStorage` — não por uma busca server-side de "sessão mais recente sem síntese" na `/chat/page.tsx`. Motivo: uma sessão pode ficar "aberta" no banco indefinidamente se o usuário mandar só uma mensagem e nunca voltar (o timer de inatividade de 60min só existe enquanto o `ChatWindow` está montado — Story 3.1); uma busca server-side por "a sessão sem síntese mais recente" resgataria essa sessão órfã dias depois, de forma surpreendente. `sessionStorage` expira sozinho ao fechar a aba, o que já delimita naturalmente o que conta como "em andamento" sem precisar de heurística de recência.
- Limitações conhecidas, não corrigidas por estarem fora do escopo desta story: (1) o medidor de profundidade (`depth`) não é persistido — uma sessão retomada volta com a profundidade zerada; (2) o timer de inatividade de 60min (Story 3.1, AC4) só roda enquanto `/chat` está montado, então uma sessão retomada reinicia a contagem a partir do momento da retomada, não do último timestamp real de atividade.

## Dev Agent Record

### Completion Notes

- Nenhuma migration nova — story é de navegação/UI; a retomada de sessão (patch de review) reutiliza as tabelas `sessions`/`messages`/`session_syntheses` já existentes, sem schema novo.
- Revisão de código adversarial em 3 camadas (Blind Hunter + Edge Case Hunter + Acceptance Auditor, via `bmad-code-review`) rodou sobre o diff completo antes do merge e encontrou 1 violação real de AC (AC1 — sessão de chat não era retomada ao voltar para `/chat`) e mais 4 patches menores (nav-height sem safe-area, `PrimaryNav` aninhada em `<main>` só em `/insights`, padding incondicional na Home, CSS redundante); todos os 5 corrigidos nesta mesma passada — ver "Review Findings" acima para detalhe e evidência de cada um. 1 achado (suspeita de erro de tipo em `React.ReactNode` sem import) foi verificado e descartado como falso positivo.
- Suíte completa (`vitest run`) após as correções: 430 testes passando em 52 arquivos (419 da implementação inicial + 11 novos dos patches: `resumeSession.test.ts` e o novo describe de retomada em `ChatWindow.test.tsx`). `tsc --noEmit` sem erros. `eslint` sem novos erros/warnings nos arquivos desta story — incluindo a regra `react-hooks/set-state-in-effect`, que pegou um `setState` síncrono no corpo do efeito de retomada na primeira versão do patch (corrigido roteando os dois ramos do efeito pelo mesmo `.then()` assíncrono). Os erros que o lint do projeto reporta fora disso estão todos em `apps/web/.next.bak-stale-cache`, diretório de cache de build ignorado pelo git, pré-existente e sem relação com esta mudança.
- Testes novos/atualizados cobrem: os 3 links e seus `href` (`PrimaryNav.test.tsx`), `aria-current="page"` no destino ativo e ausência dele fora das 3 rotas principais (ex.: `/chat`), landmark acessível; a rota `/insights` (redirect para `/auth` sem sessão, render autenticado com a nav); a presença da `PrimaryNav` nas páginas de Início, Chat e Histórico (mockada nos respectivos `page.test.tsx`); a Server Action `resumeSession` (UUID inválido, sem usuário autenticado, sessão alheia/inexistente, sessão já com síntese, mensagens em ordem cronológica); e em `ChatWindow.test.tsx` — gravação do sessionId no `sessionStorage`, retomada de mensagens ao montar (incluindo continuar enviando na mesma sessão), limpeza do `sessionStorage` quando a sessão salva já foi encerrada, supressão do estado vazio enquanto a checagem de retomada está pendente, a guarda contra a retomada assíncrona sobrescrever uma conversa nova já iniciada, e limpeza do `sessionStorage` ao encerrar a sessão. Os dois testes da Home que verificavam o antigo link avulso "Histórico" no cabeçalho foram substituídos por testes equivalentes checando a presença/ausência da `PrimaryNav`.

### File List

- `apps/web/src/components/nav/PrimaryNav.tsx` (novo)
- `apps/web/src/components/nav/PrimaryNav.module.css` (novo)
- `apps/web/src/components/nav/PrimaryNav.test.tsx` (novo)
- `apps/web/src/app/insights/page.tsx` (novo)
- `apps/web/src/app/insights/page.module.css` (novo)
- `apps/web/src/app/insights/page.test.tsx` (novo)
- `apps/web/src/lib/actions/resumeSession.ts` (novo — patch de review, AC1)
- `apps/web/src/lib/actions/resumeSession.test.ts` (novo — patch de review, AC1)
- `apps/web/src/app/page.tsx` (modificado — integra `PrimaryNav`, remove link avulso "Histórico"; patch: `.contentWithNav` condicional)
- `apps/web/src/app/page.module.css` (modificado — remove `.historyLink`; patch: padding de `--nav-height` movido para `.contentWithNav`, aplicado só quando autenticado)
- `apps/web/src/app/page.test.tsx` (modificado — mocka `PrimaryNav`, substitui testes do link antigo)
- `apps/web/src/app/chat/page.tsx` (modificado — integra `PrimaryNav`)
- `apps/web/src/app/chat/page.test.tsx` (modificado — mocka `PrimaryNav`)
- `apps/web/src/components/chat/ChatWindow.tsx` (modificado — patch de review, AC1: retomada de sessão via `sessionStorage` + `resumeSession`)
- `apps/web/src/components/chat/ChatWindow.test.tsx` (modificado — testes da retomada de sessão)
- `apps/web/src/components/chat/ChatWindow.module.css` (modificado — reserva `--nav-height` em `.main`, mobile e desktop)
- `apps/web/src/app/historico/page.tsx` (modificado — integra `PrimaryNav`)
- `apps/web/src/app/historico/page.module.css` (modificado — reserva `--nav-height` em `.main`)
- `apps/web/src/app/historico/page.test.tsx` (modificado — mocka `PrimaryNav`)
- `apps/web/src/styles/variables.css` (modificado — novo token `--nav-height`; patch: inclui `env(safe-area-inset-bottom)`)
- `_bmad-output/planning-artifacts/design-system/variables.css` (modificado — `--nav-height` replicado, conforme nota de sincronia do arquivo; patch: safe-area)

### Change Log

- Implementada a Story 4.1: navegação principal persistente (`PrimaryNav`) entre Início, Histórico e Insights, com nova rota `/insights` (placeholder, conteúdo real nas Stories 4.2/4.4/4.5) e ajustes de espaçamento nas 4 telas principais para acomodar a barra fixa sem cobrir conteúdo (composer do chat incluído).
- Aplicados os 5 achados `patch` da revisão de código: retomada de sessão de chat em andamento ao voltar para `/chat` (AC1, via `sessionStorage` + nova Server Action `resumeSession`); `--nav-height` passou a incluir `env(safe-area-inset-bottom)`; `PrimaryNav` movida para fora do `<main>` em `/insights`; padding reservado da nav na Home tornado condicional a `isAuthenticated`; CSS redundante removido do `PrimaryNav`.
