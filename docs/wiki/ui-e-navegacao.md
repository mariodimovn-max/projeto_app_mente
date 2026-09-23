---
titulo: Navegação Principal e Layout da Home
epico: "4, ajuste fora do sprint"
status: completo
ultima_atualizacao: 2026-09-22
depende_de: [auth]
relacionado: [insights-e-resumos, conversa-e-memoria]
decisoes: []
tags: [nav, home, layout, design-system, saudacao-ia]
---

# Navegação Principal e Layout da Home

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

## Onde está no código

- `apps/web/src/components/nav/` — `PrimaryNav`
- `apps/web/src/components/aura/`
- `apps/web/src/lib/agent/greeting.ts`, `apps/web/src/lib/dashboard/welcomeMessage.ts`
- `apps/web/src/app/page.tsx` — Home

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

## Gotchas conhecidos

- Sair de `/chat` pela nav e voltar dependia de retomar a sessão em andamento — sem isso,
  `ChatWindow` remontava vazio e criava uma sessão nova, órfã. Corrigido com `sessionId` guardado em
  `sessionStorage` e retomado via Server Action `resumeSession` ao montar. Qualquer mudança na
  navegação do chat precisa preservar esse comportamento.

## Pendências

Ver [pendencias-manuais.md](pendencias-manuais.md) — migration de `user_patterns_daily_greeting`
precisa ser aplicada manualmente no Supabase; teste manual em navegador pendente do usuário.
