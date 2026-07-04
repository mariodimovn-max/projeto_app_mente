# Story 1.1: Inicialização do Projeto e Fundação Técnica

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a desenvolvedor solo,
I want o projeto inicializado com Next.js 16, App Router e TypeScript, seguindo a estrutura
definida na arquitetura, com o scaffold antigo removido e o protótipo do agente portado,
so that eu tenha uma base de código consistente para construir todas as funcionalidades seguintes.

## Acceptance Criteria

1. **Given** o repositório com o scaffold parcial existente (`package.json` raiz, `apps/mobile`,
   `packages/ui`, `packages/types` vazios, `scripts/agent-test.ts`), **when** o Next.js 16.x é
   inicializado em `apps/web`, **then** o app roda localmente via `npm run dev` (a partir da raiz)
   sem erros.
2. `apps/mobile`, `packages/ui` e `packages/types` são removidos, e `tsconfig.json` (raiz) não
   referencia mais `packages/**`.
3. A lógica de `scripts/agent-test.ts` (tipo `EmotionalState`, `detectEmotionalState`, `TONE_MAP`,
   `BASE_SYSTEM_PROMPT`, `buildSystemPrompt`) está portada para `apps/web/src/lib/agent/`, com
   testes Vitest cobrindo `detectEmotionalState` para os 4 estados (melancholy, inflated, confused,
   neutral). `scripts/agent-test.ts` passa a **referenciar** essa lógica (import relativo) em vez
   de manter uma cópia duplicada, e continua funcional como CLI (`npm run agent:test`).
4. `npm run typecheck` (raiz) passa sem erros, cobrindo tanto `scripts/` quanto `apps/web`.

## Tasks / Subtasks

- [x] **Task 1: Remover scaffold prematuro do monorepo** (AC: #2)
  - [x] Remover `apps/mobile/`, `packages/ui/`, `packages/types/`
  - [x] Editar `tsconfig.json` raiz: remover `"packages/**/*"` do array `include` (fica apenas
    `["scripts/**/*"]`)

- [x] **Task 2: Inicializar Next.js 16 em `apps/web`** (AC: #1)
  - [x] Rodar `npx create-next-app@latest apps/web --typescript --app --no-tailwind --eslint
    --src-dir --import-alias "@/*"` — isso cria **`apps/web/package.json` próprio** (com `next`,
    `react`, `react-dom`, `eslint`, `typescript`, `@types/*`), Turbopack já vem como padrão em
    Next.js 16 (não precisa de flag extra). Versão instalada: Next.js 16.2.10.
  - [x] **Ajustar o `package.json` da raiz** para não duplicar dependências que agora vivem em
    `apps/web/package.json`: remover `next`, `react`, `react-dom`, `@types/react`,
    `@types/react-dom` das dependências da raiz (mantendo apenas `@anthropic-ai/sdk`, `tsx`,
    `typescript`, `@types/node`, usados por `scripts/agent-test.ts`)
  - [x] Atualizar os scripts do `package.json` raiz para delegar a `apps/web`:
    `"dev": "npm run dev --prefix apps/web"`, `"build": "npm run build --prefix apps/web"`
  - [x] Instalar `@anthropic-ai/sdk` como dependência própria de `apps/web`
    (`npm install @anthropic-ai/sdk --prefix apps/web`) — será usado pelo Route Handler de chat em
    histórias futuras, mas a dependência já deve existir na base do app
  - [x] Validar `npm run dev` (a partir da raiz) sobe o servidor Next.js sem erros — confirmado
    (`GET / 200`). Ajuste adicional não previsto originalmente: `next.config.ts` recebeu
    `turbopack.root` explícito para resolver o aviso de "multiple lockfiles" causado por termos
    dois `package.json`/lockfiles sem workspaces (comportamento esperado da decisão arquitetural).

- [x] **Task 3: Portar a lógica do agente e atualizar `scripts/agent-test.ts`** (AC: #3)
  - [x] Criar `apps/web/src/lib/agent/emotional-state.ts` com o tipo `EmotionalState` e a função
    `detectEmotionalState` (lógica movida de `scripts/agent-test.ts`)
  - [x] Criar `apps/web/src/lib/agent/prompts.ts` com `TONE_MAP`, `BASE_SYSTEM_PROMPT` e
    `buildSystemPrompt` (lógica movida de `scripts/agent-test.ts`)
  - [x] Atualizar `scripts/agent-test.ts` para importar de `../apps/web/src/lib/agent/` (caminho
    relativo) em vez de manter as definições inline — remove a duplicação
  - [x] Confirmar manualmente que `npm run agent:test "mensagem de teste"` continua funcionando
    (é uma ferramenta CLI interativa, não coberta por Vitest) — confirmado: a importação relativa
    resolve corretamente e a CLI chega até a checagem esperada de `ANTHROPIC_API_KEY`
  - [x] Instalar Vitest em `apps/web` (`npm install -D vitest --prefix apps/web`) — versão instalada
    4.1.9
  - [x] Criar `apps/web/src/lib/agent/emotional-state.test.ts` cobrindo os 4 estados, reaproveitando
    os arrays de sinais já validados em `scripts/agent-test.ts`
  - [x] Adicionar script `"test": "vitest run"` em `apps/web/package.json`
  - [x] Rodar os testes e confirmar 100% de aprovação — 5/5 testes passando

- [x] **Task 4: Configurar validação de tipos na raiz** (AC: #4)
  - [x] Atualizar o script `"typecheck"` do `package.json` raiz para cobrir ambos os projetos:
    `"typecheck": "tsc --noEmit -p tsconfig.json && npm run typecheck --prefix apps/web"` — o
    `create-next-app` NÃO gerou um script `typecheck` em `apps/web/package.json`; foi adicionado
    manualmente (`"typecheck": "tsc --noEmit"`)
  - [x] Rodar `npm run typecheck` (raiz) e confirmar zero erros — **encontrado e corrigido um bug
    pré-existente** em `scripts/agent-test.ts`: o parâmetro `thinking: { type: "adaptive" }` não é
    aceito pelo overload de streaming do SDK instalado (`Type '"adaptive"' is not assignable to
    type '"enabled" | "disabled"'`); removido por não ser necessário ao funcionamento da CLI

- [x] **Task 5: Higiene de repositório**
  - [x] Criar `.gitignore` na raiz (não existia) cobrindo `node_modules/`, `dist/`, `.next/`,
    `.env*.local`, `coverage/` — `apps/web/.gitignore` já vem do `create-next-app`, não precisou de
    ajuste manual

## Dev Notes

### Contexto arquitetural relevante

- **Fonte:** `_bmad-output/planning-artifacts/architecture.md`, seções "Starter Template
  Evaluation", "Core Architectural Decisions" e "Project Structure & Boundaries"
- Decisão de starter: `create-next-app` puro (sem Tailwind/shadcn) — o design system do projeto já
  usa CSS puro (`_bmad-output/planning-artifacts/design-system/variables.css`), não portar isso
  ainda (é escopo da Story 1.2)
- **Esclarecimento importante sobre estrutura de pacotes:** a arquitetura descreve "um único
  `package.json`/`tsconfig.json` — sem workspaces". Na prática, `create-next-app apps/web` SEMPRE
  gera seu próprio `package.json` dentro de `apps/web/` — isso não é uma violação da decisão, é
  simplesmente como a ferramenta funciona. O espírito da decisão (nenhum npm workspaces, nenhum
  hoisting compartilhado, simplicidade para 1 dev) é preservado tratando `apps/web` como um projeto
  Next.js autocontido, e a raiz como um wrapper fino que delega `dev`/`build` para ele e mantém
  apenas as dependências de `scripts/` (`@anthropic-ai/sdk`, `tsx`, `typescript`). NÃO duplicar
  `next`/`react`/`react-dom` na raiz.
- Escopo estrito desta história: **apenas** a fundação técnica (Next.js rodando, agente portado,
  typecheck limpo). NÃO criar `app/chat`, `app/login`, `app/history` etc. — isso pertence a
  histórias futuras (Story 1.3 em diante, Epic 2, Epic 3). Não antecipar UI de nenhuma tela.
- Story 1.2 (próxima) cuidará dos design tokens (`variables.css`) e do layout raiz — não fazer isso
  aqui.

### Arquivos existentes sendo modificados — estado atual e o que muda

**`package.json` (raiz) — estado atual:**
```json
{
  "name": "diario-digital",
  "scripts": {
    "agent:test": "tsx scripts/agent-test.ts",
    "dev": "next dev apps/web",
    "build": "next build apps/web",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.55.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0", "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0", "tsx": "^4.0.0", "typescript": "^5.7.0"
  }
}
```
**O que muda:** remove `next`/`react`/`react-dom`/`@types/react`/`@types/react-dom` (passam a viver
só em `apps/web/package.json`, gerado pelo `create-next-app`); `next` estava fixado em `^15.0.0` —
**desatualizado**, a versão estável atual é a linha 16.x (LTS), então `apps/web` deve ser criado
com Next.js 16, não 15. Scripts `dev`/`build` passam a delegar via `--prefix apps/web`.
**O que preservar:** `agent:test` continua igual (só o arquivo que ele executa muda por dentro).

**`tsconfig.json` (raiz) — estado atual:** `include: ["scripts/**/*", "packages/**/*"]`,
`exclude: ["node_modules", "dist", "apps"]`. **O que muda:** `include` perde `"packages/**/*"`
(pasta removida). `exclude` continua com `"apps"` — `apps/web` terá seu próprio `tsconfig.json`
gerado pelo `create-next-app`, não deve ser coberto pelo tsconfig da raiz.

**`scripts/agent-test.ts` — estado atual:** arquivo standalone com `EmotionalState`, `TONE_MAP`,
`BASE_SYSTEM_PROMPT`, `detectEmotionalState`, `buildSystemPrompt` e `main()` (CLI interativa via
`readline`, streaming da Anthropic API). **O que muda:** as definições de tipo/lógica
(`EmotionalState`, `TONE_MAP`, `BASE_SYSTEM_PROMPT`, `detectEmotionalState`, `buildSystemPrompt`)
saem daqui e passam a ser importadas de `../apps/web/src/lib/agent/`. **O que preservar:** a função
`chat()`, `main()` e todo o comportamento de CLI (streaming, leitura de stdin, tratamento de
`ANTHROPIC_API_KEY` ausente) permanecem exatamente iguais — é só a fonte da lógica de detecção que
muda de lugar.

### Requisitos técnicos e versões (verificadas nesta sessão)

- **Next.js:** usar `create-next-app@latest` — resolve para 16.x (atual: 16.2.10 LTS, Turbopack
  estável e padrão, não precisa de flag `--turbopack`)
- **Vitest:** ~4.1.x (atual: 4.1.9) — API compatível com Jest (`describe`/`it`/`expect`), sem config
  extra necessária para TypeScript/ESM
- Manter o mesmo rigor de `tsconfig` já usado na raiz (target ES2022, `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) — se o `tsconfig.json` gerado pelo
  `create-next-app` em `apps/web` for menos estrito, alinhar manualmente essas flags

### Padrões de implementação a seguir

- **Fonte:** seção "Implementation Patterns & Consistency Rules" de `architecture.md`
- Testes co-localizados junto ao arquivo fonte (`emotional-state.test.ts` ao lado de
  `emotional-state.ts`), não em pasta `__tests__/` separada
- Nomes de arquivo: camelCase para módulos de lógica (`emotional-state.ts`, `prompts.ts`)

### Project Structure Notes

- Alinhado com a árvore definida em `architecture.md` (seção "Project Structure & Boundaries"):
  apenas as pastas/arquivos relevantes a esta história devem existir ao final (`apps/web/src/app/`
  mínimo gerado pelo starter, `apps/web/src/lib/agent/`) — o restante da árvore (`components/`,
  `app/chat`, etc.) é construído em histórias futuras, não aqui
- Nenhuma variância detectada em relação à arquitetura, exceto o esclarecimento sobre
  `package.json` duplo documentado acima

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Acesso Seguro ao Diário — Story 1.1]
- [Source: scripts/agent-test.ts]
- [Source: package.json]
- [Source: tsconfig.json]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npm run dev` (raiz) → `GET / 200` confirmado via curl após scaffold do Next.js 16.2.10
- `npm test` (apps/web, Vitest 4.1.9) → 5/5 testes passando em `emotional-state.test.ts`
- `npm run typecheck` (raiz) → zero erros após correção do bug pré-existente em `agent-test.ts`
- `npm run lint` (apps/web, ESLint 9 + eslint-config-next) → zero erros

### Completion Notes List

- Scaffold prematuro (`apps/mobile`, `packages/ui`, `packages/types`) removido; eram apenas
  placeholders `.gitkeep` vazios, nenhuma lógica perdida.
- Next.js inicializado via `create-next-app@latest` em `apps/web` → resolveu para **16.2.10 LTS**
  (a versão antiga fixada no `package.json` raiz, `^15.0.0`, estava desatualizada).
- **Achado durante a implementação:** `create-next-app` sempre gera seu próprio `package.json`
  dentro do diretório de destino — isso não é uma violação da decisão arquitetural de "sem
  workspaces", mas exigiu esclarecimento: a raiz agora é um wrapper fino (mantém só
  `@anthropic-ai/sdk`/`tsx`/`typescript` para `scripts/agent-test.ts`) e delega `dev`/`build`/`test`
  para `apps/web` via `--prefix`. Documentado no Dev Notes da história.
- Alinhado `apps/web/tsconfig.json` ao rigor da raiz (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`), que o `create-next-app` não habilita por padrão.
- Resolvido um aviso de "multiple lockfiles" do Turbopack (consequência esperada de dois
  `package.json`/lockfiles sem workspaces) definindo `turbopack.root` explícito em
  `next.config.ts`.
- Lógica do agente (`EmotionalState`, `detectEmotionalState`, `TONE_MAP`, `BASE_SYSTEM_PROMPT`,
  `buildSystemPrompt`) portada para `apps/web/src/lib/agent/`, com 5 testes Vitest cobrindo os 4
  estados emocionais. `scripts/agent-test.ts` agora importa essa lógica via caminho relativo em vez
  de duplicá-la.
- **Bug pré-existente encontrado e corrigido** (não introduzido nesta história): o parâmetro
  `thinking: { type: "adaptive" }` em `scripts/agent-test.ts` não é aceito pelo overload de
  streaming do `@anthropic-ai/sdk` instalado — bloqueava `npm run typecheck` (AC #4). Removido por
  não ser necessário ao funcionamento da CLI.
- **Limitação pré-existente observada, não corrigida** (fora do escopo desta história — é sobre
  precisão de detecção, não sobre portar código): `detectEmotionalState` usa correspondência de
  substring simples, não de palavra inteira. Isso pode gerar falsos positivos (ex: a palavra
  "normalmente" contém a substring "mal", um sinal de melancolia). Vale revisar quando a Story 2.2
  (adaptação de tom) for implementada.
- `npm run agent:test` confirmado funcional manualmente (chega à checagem de `ANTHROPIC_API_KEY`
  sem erro de importação); não foi possível testar uma chamada real à API nesta sessão por falta de
  chave configurada no ambiente — fora do escopo desta história (a CLI já se comportava assim antes).

### File List

**Criados:**
- `.gitignore` (raiz — não existia)
- `apps/web/` — app Next.js 16 completo, gerado por `create-next-app` (`package.json`,
  `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`,
  `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`,
  `src/app/globals.css`, `src/app/page.module.css`, `src/app/favicon.ico`, `public/*.svg`)
- `apps/web/src/lib/agent/emotional-state.ts`
- `apps/web/src/lib/agent/emotional-state.test.ts`
- `apps/web/src/lib/agent/prompts.ts`
- `apps/web/src/lib/agent/prompts.test.ts` (adicionado na revisão de código — cobertura ausente)

**Modificados:**
- `package.json` (raiz — dependências deduplicadas, scripts delegando para `apps/web`; SDK
  atualizado para `^0.110.0` na revisão de código para alinhar com `apps/web`)
- `package-lock.json` (raiz — regenerado)
- `tsconfig.json` (raiz — removida referência a `packages/**`; comentário explicativo adicionado na
  revisão sobre a checagem transitiva de `apps/web/src/lib/agent/*`)
- `scripts/agent-test.ts` (lógica de detecção/prompt extraída para `apps/web/src/lib/agent/`; bug
  pré-existente de tipo removido, depois restaurado corretamente na revisão de código após
  alinhamento de versão do SDK; try/catch adicionado ao loop do REPL)
- `apps/web/src/lib/agent/emotional-state.ts` (revisão de código: corrigido falso positivo de
  substring em "mal", typo em "inutl"→"inutil", contagem duplicada em "o que fazer", e unificação
  das três arrays de sinais em um único `Record`)
- `apps/web/src/lib/agent/emotional-state.test.ts` (3 testes de regressão adicionados na revisão)
- `apps/web/next.config.ts` (comentário explicativo adicionado na revisão sobre o motivo do
  `turbopack.root`)

**Removidos:**
- `apps/mobile/.gitkeep`
- `packages/ui/.gitkeep`
- `packages/types/.gitkeep`
- `apps/web/public/.gitkeep`, `apps/web/src/{app,components,lib,styles}/.gitkeep` (placeholders do
  scaffold antigo, substituídos pelo conteúdo real do `create-next-app`)

## Change Log

- 2026-07-04: Implementação completa da Story 1.1 — projeto inicializado com Next.js 16.2.10 em
  `apps/web`, scaffold prematuro removido, lógica do agente portada com testes Vitest, typecheck e
  lint limpos em todo o repositório. Status atualizado para `review`.
- 2026-07-04: Code review (alto esforço, 8 ângulos + verificação individual) encontrou 10 achados
  confirmados; todos corrigidos — 6 bugs de correção (falso positivo "mal", typo "inutl", contagem
  duplicada em "o que fazer", rejeição não tratada no REPL, SDK desalinhado que causou a remoção
  indevida de `thinking: "adaptive"`, checagem transitiva de tipos documentada), 1 achado
  arquitetural documentado via comentário (`turbopack.root`), 1 lacuna de cobertura de teste
  fechada (`prompts.test.ts`), 1 checklist do `CLAUDE.md` atualizado, 1 simplificação aplicada
  (arrays de sinais unificadas em `Record`). Suite completa (17 testes, typecheck, lint) validada
  após as correções.
