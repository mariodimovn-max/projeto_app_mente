# 0008: Fonte mínima (NFR6) com 14px para conteúdo e interação, e 12px só para rótulos decorativos via `--fs-xs`

**Status:** aceita
**Contexto original:** Story 6.2 (polimento mobile), 2026-11-13

## Decisão

O NFR6 ("fonte mínima 14px") é aplicado de forma **híbrida**:

- **Conteúdo e interação ≥ 14px** (`var(--fs-sm)` ou maior). Inclui navegação, botões, links,
  chips, selos de status, textos de cards e mensagens, descrições, dicas, erros e controles de
  formulário.
- **Rótulos decorativos e metadados ≥ 12px**, **somente** via o token `--fs-xs`. Isso cobre:
  - rótulos em fonte mono, caixa alta e com `letter-spacing` ("eyebrows", títulos de bloco, selos
    de privacidade);
  - legendas decorativas da Aura;
  - horários, datas curtas e contadores;
  - ícones dentro de texto.

Na dúvida, é conteúdo (14px).

**Guardas:**

- `apps/web/src/lib/a11y/typography.test.ts` falha se qualquer CSS declarar fonte literal
  (`rem`/`em`/`px`, inclusive dentro de `clamp()`) abaixo de 14px. Texto menor só passa pelo token,
  o que torna o uso consciente e revisável.
- Reset global em `globals.css`: `button`/`input`/`select`/`textarea` herdam a família e partem de
  `var(--fs-sm)`. Sem isso, o navegador aplica 13,33px e a fonte do sistema, e o guarda de CSS não
  vê esse caso, porque não há literal no CSS.

## Por quê

A Story 1.2 interpretou "14px–24px" como a faixa de **ajuste de tamanho pelo usuário** (o layout
precisa aguentar o zoom), e não como mínimo por elemento. O design system Aura usa de propósito
rótulos mono pequenos como parte da identidade visual. A auditoria de 2026-11-13 achou cerca de 75
ocorrências entre 9 e 13px.

O autor escolheu a interpretação híbrida em vez de:

- uma varredura literal ≥ 14px, que mudaria bastante o visual do Aura e exigiria redesenhar cards e
  a navegação;
- corrigir só o selo de 11px do chat, que deixaria textos interativos de 11px, como a própria
  barra de navegação.

## Trade-off assumido

Rótulos decorativos de 12px ficam abaixo da meta literal do PRD. A troca é consciente: esses
rótulos acompanham sempre um título ou conteúdo em ≥ 14px que carrega a mesma informação ou a
complementa, e o WCAG 2.1 AA não fixa um tamanho mínimo de fonte (exige contraste e capacidade de
zoom, já cobertos pela Story 1.2).

## Onde isso aparece no código

- `apps/web/src/styles/variables.css`: `--fs-xs` (12px) e `--fs-sm` (14px), com comentários. Os
  dois tokens estão replicados na cópia do design system em `_bmad-output/`.
- `apps/web/src/lib/a11y/typography.test.ts`: o guarda.
- `apps/web/src/app/globals.css`: o reset de controles de formulário.
