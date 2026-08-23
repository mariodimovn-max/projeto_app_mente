# Story 5.4: Política de Privacidade e Indicadores Visíveis

Status: done

## Story

As a usuário preocupado com a segurança dos meus dados,
I want ver claramente como meus dados são protegidos e usados,
so that eu confie no app antes de compartilhar algo íntimo.

## Acceptance Criteria

1. **Given** qualquer tela onde dados sensíveis são exibidos, **when** o usuário visualizar a interface, **then** um selo discreto de privacidade é visível com copy clara sobre criptografia e armazenamento.
2. **Given** o selo de privacidade, **when** o usuário clicar em “Como seus dados são usados”, **then** ele acessa uma política de privacidade que descreve com precisão o modelo real de proteção implementado.
3. **Given** telas de exclusão, **when** o usuário interagir com elas, **then** a copy usa linguagem clara sobre permanência e irreversibilidade dos dados.

## Tasks / Subtasks

- [x] Implementar indicadores visíveis de privacidade no app.
- [x] Criar a página/política de uso de dados com copy precisa.

## Review Findings

- [x] [Review][Patch] Contradição de E2EE na política ("ponta a ponta na infraestrutura" reaparecendo logo após negar E2EE literal) [apps/web/src/app/privacidade/page.tsx]
- [x] [Review][Patch] Teste vazio que só verificava `render()` sem exercitar comportamento real [apps/web/src/app/privacidade/page.test.tsx]
- [x] [Review][Defer] Link "← Voltar" de `/privacidade` fixo em `/` em vez de `router.back()`, pode perder rascunho de chat/resumo gerado ao voltar — deferred, pre-existing [apps/web/src/app/privacidade/page.tsx]

## Dev Agent Record

- Novo componente `PrivacySeal` (selo + link "Como seus dados são usados") integrado a `ChatWindow`, `/historico`, `/historico/[sessionId]` e `/insights`; nova rota pública `/privacidade` (sem checagem de auth — acessível de qualquer tela, inclusive anônima).
- Copy segue o modelo real de criptografia documentado em `architecture.md` (TLS 1.3+ em trânsito + AES-256 em repouso, sem E2EE literal) — decisão consciente de não seguir a copy desatualizada "armazenadas localmente" de `ux-patterns.md`, que é factualmente incorreta (dados ficam no Supabase Cloud).
- AC3 (telas de exclusão) já estava satisfeito pelas Stories 3.5 e 5.2, sem alteração necessária.
- Sem migration nova.
- Teste manual em navegador pendente do usuário — não há `.env.local` neste ambiente e o middleware (`proxy.ts`) exige as variáveis do Supabase em toda rota, então não foi possível subir o servidor local para verificação visual.
