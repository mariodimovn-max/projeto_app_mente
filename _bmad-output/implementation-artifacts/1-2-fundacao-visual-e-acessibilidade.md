# Story 1.2: Fundação Visual e Acessibilidade

Status: review

## Story

As a usuário,
I want que a interface use os tokens visuais do design system (cores, tipografia, espaçamento) em modo escuro,
so that eu tenha uma experiência visual acolhedora e consistente desde a primeira tela.

## Acceptance Criteria

1. **Given** o design system com tokens definidos em `design-system/variables.css`, **when** o layout raiz do app for implementado, **then** as CSS custom properties de cores, tipografia e espaçamento são carregadas globalmente.
2. **Given** a aplicação em execução, **when** o usuário abrir o app, **then** o dark mode é o padrão com fundo `#0C1118` e texto `#E7F1FF`.
3. **Given** o conteúdo visual da interface, **when** ele for renderizado, **then** o contraste de texto/fundo atende o mínimo de 4.5:1 (WCAG 2.1 AA).
4. **Given** a base tipográfica do app, **when** o usuário ajustar o tamanho da fonte, **then** o layout permanece estável entre 14px e 24px sem quebra de estrutura.

## Tasks / Subtasks

- [x] Implementar o layout raiz e os tokens globais.
- [x] Validar contraste e acessibilidade básica no fluxo principal.

## Dev Notes

### Contexto arquitetural relevante

- **Fonte:** `_bmad-output/planning-artifacts/architecture.md` (seção "Project Structure &
  Boundaries") define `apps/web/src/styles/variables.css` como destino dos tokens, "movido de
  `design-system/variables.css`".
- **Desvio deliberado:** os tokens foram **copiados** (não movidos) para `apps/web/src/styles/`.
  O arquivo original em `_bmad-output/planning-artifacts/design-system/variables.css` foi mantido
  porque os wireframes estáticos (`wireframes/*.html`) referenciam esse caminho relativo
  (`../design-system/variables.css`) e quebrariam se o arquivo fosse removido. O app real passa a
  usar exclusivamente a cópia em `src/styles/`.
- Stack confirmada: CSS puro/CSS Modules (sem Tailwind), conforme `architecture.md`.

### Decisões técnicas

- **Tamanhos de fonte convertidos de `px` para `rem`** (`--fs-sm: 0.875rem` … `--fs-xxl:
  1.875rem`), com `html { font-size: 100% }`. Isso é o que torna a AC #4 (layout estável entre
  14px–24px quando o usuário ajusta o tamanho da fonte) realmente sustentável: valores em `px`
  ignoram a preferência de tamanho de fonte do navegador/SO, enquanto `rem` escala com ela (WCAG
  2.1 SC 1.4.4 — Resize Text). Demais tokens (espaçamento, `content-max-width`) permanecem em `px`
  por não serem tipográficos.
- **Dark mode fixo, não condicional a `prefers-color-scheme`** — o app não tem tema claro (PRD:
  "Dark mode: Obrigatório"). O `globals.css` padrão gerado pelo `create-next-app` fazia flip
  light/dark via media query; isso foi substituído pelos tokens únicos do design system e
  `color-scheme: dark` explícito no `:root`.
- Fonte `Geist`/`Geist Mono` (padrão do `create-next-app`) substituída por `Inter` via
  `next/font/google`, pois `--font-sans` no design system já assume `Inter` como primeira opção da
  pilha. A variável exposta (`--font-inter`) é referenciada de dentro de `variables.css`, mantendo
  o design system como fonte única de verdade sobre a pilha de fontes.
- `html lang` alterado de `"en"` para `"pt-BR"` — toda a interface e conteúdo do produto são em
  português; isso é relevante para leitores de tela (parte do "básico de acessibilidade" da AC #1
  do épico).
- `page.tsx`/`page.module.css` (boilerplate do `create-next-app` com logo do Next.js/Vercel e links
  de marketing) substituídos por um stub mínimo usando os tokens (`--fs-xxl`, `--color-muted`,
  `--space-lg` etc.) — não há tela de "Início" definida ainda (isso é escopo de história futura de
  Epic 4), então este é apenas um placeholder que comprova visualmente que os tokens/tema estão
  ativos.

### Testes e verificação

- **Sem infraestrutura de teste de componentes React ainda** (`@testing-library/react`/`jsdom` não
  estão instalados; `vitest.config` não existe, roda em modo Node puro). Adicionar essas
  dependências não fazia parte do escopo desta história — em vez disso, a verificação de
  contraste/tokens foi feita via teste de lógica pura (lê `variables.css` como texto e calcula a
  razão de contraste real, sem precisar renderizar componentes), e a verificação visual do layout
  raiz foi manual (ver abaixo). Sinalizado como possível melhoria futura, não bloqueante.
- `src/lib/a11y/contrast.ts` + `contrast.test.ts`: implementa a fórmula de contraste WCAG
  (luminância relativa sRGB) e valida que `--color-text`/`--color-muted` sobre `--color-bg` e
  `--color-surface` atingem ≥ 4.5:1 (AC #3) lendo os valores diretamente de `variables.css` —
  qualquer alteração futura nos tokens que quebre o contraste mínimo quebra o teste. Também valida
  que os tokens de fonte usam `rem` (AC #4).
- Verificação manual (sem `chromium-cli`/Playwright disponíveis neste ambiente — não instalados
  para não introduzir dependência nova fora do escopo): `npm run dev` + `curl` no HTML/CSS
  compilado confirmando `<html lang="pt-BR">`, `color-scheme: dark`, tokens de cor/fonte corretos
  no CSS gerado e fonte Inter carregada via `next/font`. Não foi feita captura de screenshot visual
  pixel-a-pixel.
- `npm run build`, `npm run typecheck` (raiz, cobrindo `scripts/` e `apps/web`) e `npm run lint`
  (apps/web) — todos limpos.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npm test` (apps/web, Vitest 4.1.9) → 29/29 testes passando (17 pré-existentes de
  `lib/agent/` + 12 novos de `lib/a11y/contrast.test.ts`)
- `npm run typecheck` (raiz) → zero erros
- `npm run lint` (apps/web) → zero erros
- `npm run build` (apps/web, Turbopack) → build de produção concluído sem erros
- `npm run dev` + `curl http://localhost:3000` e CSS compilado → confirmado `<html
  lang="pt-BR">`, `color-scheme: dark`, tokens de cor corretos (`--color-bg: #0c1118`, etc.),
  `--fs-sm/--fs-xl` em `rem`, fonte Inter carregada via `next/font`. Servidor de dev encerrado ao
  final da verificação.

### Completion Notes List

- Tokens do design system copiados de `_bmad-output/planning-artifacts/design-system/variables.css`
  para `apps/web/src/styles/variables.css` (arquivo original preservado — ver Dev Notes sobre o
  desvio de "mover" para "copiar").
- Tamanhos de fonte convertidos de `px` para `rem` para suportar redimensionamento de texto do
  navegador (WCAG 1.4.4), preservando os valores visuais equivalentes (14/16/18/24/30px na base
  padrão de 16px).
- `globals.css` reescrito: removido o esquema claro/escuro condicional do `create-next-app`,
  substituído pelos tokens do design system com dark mode fixo (`color-scheme: dark`).
- `layout.tsx`: fonte `Geist`→`Inter` (via `next/font/google`, alinhado ao `--font-sans` do design
  system), `lang="en"`→`"pt-BR"`, metadata atualizada para refletir o produto real.
- `page.tsx`/`page.module.css`: boilerplate de marketing do `create-next-app` substituído por stub
  mínimo usando os tokens, apenas para demonstrar visualmente o tema — não é a tela de "Início"
  final (fora de escopo desta história).
- `src/lib/a11y/contrast.ts` criado com função `contrastRatio` (fórmula WCAG de luminância
  relativa), com testes que leem os valores reais de `variables.css` e verificam contraste ≥ 4.5:1
  para as combinações texto/fundo e texto-secundário/fundo (incluindo sobre `--color-surface`), e
  que os tokens de fonte usam `rem`.
- **Limitação documentada (não bloqueante):** não há `@testing-library/react`/`jsdom` instalados
  no projeto, então não foi possível escrever um teste de render de componente. Também não havia
  `chromium-cli`/Playwright disponíveis neste ambiente para captura de screenshot. A verificação do
  AC #1/#2/#4 foi feita via inspeção do HTML/CSS servido pelo `npm run dev` (curl), não por
  screenshot visual. Recomendado avaliar `@testing-library/react` + `jsdom` como dependência de
  dev quando a primeira tela de fato interativa (Story 1.3+) precisar de testes de componente.

### File List

**Criados:**
- `apps/web/src/styles/variables.css`
- `apps/web/src/lib/a11y/contrast.ts`
- `apps/web/src/lib/a11y/contrast.test.ts`

**Modificados:**
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/page.module.css`
- `_bmad-output/planning-artifacts/design-system/variables.css` (resincronizado com a cópia do
  app na revisão de código)

## Change Log

- 2026-07-11: Implementação completa da Story 1.2 — tokens do design system carregados
  globalmente via `apps/web/src/styles/variables.css`, dark mode fixo como padrão
  (`color-scheme: dark`), tamanhos de fonte convertidos para `rem` (suporte a redimensionamento de
  texto), contraste texto/fundo validado automaticamente via `src/lib/a11y/contrast.ts`
  (≥ 4.5:1 confirmado para todas as combinações relevantes). Status atualizado para `review`.
- 2026-07-11: Code review (alto esforço, 8 ângulos + verificação individual) encontrou 5 achados
  (2 confirmados, 3 plausíveis); 4 corrigidos nesta sessão:
  - **[Corrigido]** `contrast.ts`: `hexToRgb` não validava formato de entrada e retornava `NaN`
    silenciosamente para valores não-hex (ex.: `--color-border: rgba(...)`). Adicionada validação
    com erro claro + teste de regressão.
  - **[Corrigido]** Os dois arquivos `variables.css` (app e wireframes) já haviam divergido
    (`px` vs `rem`, `color-scheme`, `.container`). Resincronizados e ambos passaram a ter um
    comentário no topo apontando para o outro arquivo, já que não há mecanismo automático de
    sincronia.
  - **[Corrigido]** `--font-sans` referenciava `var(--font-inter)` sem fallback interno — um
    `var()` não resolvido invalidaria a propriedade `font-family` inteira (CSS IACVT), risco latente
    caso um futuro `global-error.tsx` (que o Next.js exige fora do `RootLayout`) a use. Corrigido
    para `var(--font-inter, Inter)`. Não aplicado ao arquivo de wireframes (que não carrega
    `next/font`) — lá `--font-sans` continua sem essa variável, para não introduzir o mesmo problema
    nesse contexto.
  - **[Não corrigido, documentado]** A cobertura automatizada da AC #4 (estabilidade de layout ao
    redimensionar fonte) hoje só confere formato/aritmética dos tokens de fonte, não renderização
    real — os tokens de espaçamento (`--space-*`, `--content-max-width`) continuam em `px`. Aceito
    como limitação conhecida: não há UI real ainda para testar (apenas o stub da home), e converter
    espaçamento para `rem` sem uma tela real para validar seria especulativo.
  - **[Fora de escopo, documentado]** Breakpoint responsivo (`600px`) e guarda de hover para touch,
    presentes no boilerplate original, foram removidos e não substituídos. Não fazem parte das ACs
    desta história (que cobre tokens/dark mode/contraste/fonte, não breakpoints de viewport) — fica
    como nota para quando a primeira tela com conteúdo real for construída (Story 1.3+).
