---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: [
  "_bmad-output/planning-artifacts/prd.md",
  "_bmad-output/planning-artifacts/ux-design-specification.md",
  "_bmad-output/planning-artifacts/ux-patterns.md",
  "_bmad-output/planning-artifacts/stack-research.md"
]
workflowType: 'architecture'
project_name: 'Aplicativo de Diário Digital para Bem-Estar Mental'
user_name: 'Mario Dimov'
date: '2026-07-04'
lastStep: 8
status: 'complete'
completedAt: '2026-07-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
8 FRs cobrindo: autenticação por convite (FR-1), interface de conversação com texto/áudio (FR-2),
agente IA único com adaptação de tom e perspectivas filosóficas (FR-3), memória persistente e
detecção de padrões longitudinais (FR-4), síntese de insights ao fim de sessão (FR-5), resumos
semanais/mensais sob demanda com exportação PDF (FR-6), indicadores de evolução sem gamification
(FR-7), e segurança/LGPD (FR-8).

Arquiteturalmente, FR-3 + FR-4 são o núcleo técnico real do produto: exigem uma estratégia de
gerenciamento de contexto/memória para o LLM (não apenas armazenar mensagens, mas alimentá-las de
volta de forma que caiba na janela de contexto e ainda assim detecte padrões de longo prazo).

**Non-Functional Requirements:**
- Performance: resposta do agente <5s, API p95 <200ms, resumo <10s — implica streaming e cache de
  padrões pré-computados, não geração do zero a cada resumo.
- Disponibilidade: uptime 99.5%, crash rate ≤0.1%, backup automático horário.
- Escalabilidade: NFR-3 pede suporte a 10.000+ usuários concorrentes, mas as constraints do PRD
  fixam o MVP em 5-10 beta testers com 1 dev em 3 meses. Tratado como decisão arquitetural aberta:
  construir para o beta, garantir que a escolha de stack não bloqueie escalar depois.
- Segurança: TLS 1.3+, AES-256 em repouso, bcrypt, rate limiting, prevenção SQLi/XSS. FR-8 também
  menciona "E2EE" para conversas — fisicamente incompatível com um agente de IA que precisa ler o
  conteúdo em texto plano no backend para gerar respostas e detectar padrões. Tratado como decisão
  arquitetural a esclarecer (criptografia em repouso + TLS em trânsito é o que é realmente entregável).
- Compatibilidade: navegadores modernos (Chrome/Firefox/Safari/Edge) + Android 10+.
- Acessibilidade: WCAG 2.1 AA, dark mode obrigatório, fonte mínima 14px.
- Usabilidade: onboarding <5min, primeira conversa deve gerar insight real.
- Manutenibilidade: cobertura de testes ≥80%, CI/CD, logs estruturados, rollback automático.

**Scale & Complexity:**
- Primary domain: Full-stack web (Next.js) + integração IA/LLM + PWA instalável no Android
- Complexity level: MÉDIA
- Estimated architectural components: Auth, Conversação/Chat (streaming), Pipeline de
  transcrição de áudio, Armazenamento de histórico (Postgres), Motor de detecção de padrões,
  Gerador de síntese de sessão, Gerador de resumos periódicos + exportação PDF, Dashboard de
  indicadores, Camada de segurança/LGPD (criptografia, auditoria, export/delete)

### Technical Constraints & Dependencies

- Solo developer, MVP em 3 meses (setembro/2026) — arquitetura deve minimizar superfície de
  manutenção (uma codebase, um deploy)
- 5-10 usuários beta fechado, sem Play Store — sem necessidade de distribuição via loja de apps
- Prioridade explícita: velocidade de iteração > production-readiness / escalabilidade inicial
- Stack candidata já pesquisada (`stack-research.md`): Next.js + Supabase + Anthropic API,
  recomendação de PWA em vez de app nativo separado
- Sem orçamento definido — assume-se free tier de provedores cloud no MVP

### Cross-Cutting Concerns Identified

1. **Gerenciamento de contexto/memória do LLM** — como alimentar histórico crescente sem estourar
   janela de contexto, mantendo detecção de padrões precisa (afeta FR-3, FR-4, FR-5, FR-6)
2. **Transcrição de áudio** — decisão técnica ainda em aberto (client-side vs. serviço externo),
   afeta UX central e NFR de performance
3. **Streaming de respostas + timeout de infraestrutura serverless** — risco já identificado,
   precisa de decisão explícita de arquitetura de API
4. **Modelo real de criptografia/privacidade** — alinhar expectativa do PRD (E2EE) com o que é
   tecnicamente entregável dado que um LLM precisa processar o conteúdo
5. **LGPD (export/deleção)** — implica design de schema (soft vs. hard delete) e trilha de auditoria
6. **Tensão de escala** — MVP para 5-10 pessoas vs. NFR de 10k usuários concorrentes; decisão sobre
   o que se constrói agora vs. o que se deixa como caminho de evolução

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web (Next.js App Router) com integração de LLM (Anthropic API) — aplicação única
(web responsiva + PWA instalável no Android), sem monorepo de mobile separado.

### Starter Options Considered

1. **create-next-app --example with-supabase** (template oficial Vercel/Supabase): auth SSR via
   `@supabase/ssr` pronta, mas acopla Tailwind CSS + shadcn/ui, conflitando com o design system
   em CSS puro já construído (`_bmad-output/planning-artifacts/design-system/`).
2. **Templates de comunidade completos** (Razikus, nextbase, etc.): incluem billing, i18n,
   multi-tenancy — sobre-engenharia para MVP solo de 5-10 usuários beta.
3. **create-next-app puro + padrão de auth SSR copiado do exemplo oficial**: mantém controle total
   sobre estilização (reutiliza o design system já pronto), adota apenas o padrão testado de auth
   SSR do Supabase para App Router.

### Selected Starter: create-next-app (base limpa) + padrão @supabase/ssr

**Rationale for Selection:**
O design system (cores, tipografia, componentes de mic/synthesis/transcript) já foi construído em
CSS puro na fase de UX. Um starter que embute Tailwind/shadcn exigiria descartar ou re-trabalhar
esse investimento. A parte de maior risco técnico — autenticação SSR com Supabase + RLS no App
Router — é resolvida adotando o padrão oficial (`@supabase/ssr`, middleware de refresh de sessão,
clients de browser/server) como referência de implementação, sem herdar o resto do template.

**Initialization Command:**

```bash
npx create-next-app@latest apps/web --typescript --app --no-tailwind --eslint --src-dir --import-alias "@/*"
npm install @supabase/ssr @supabase/supabase-js
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript estrito, Next.js 15 App Router, React 19 (já presentes no
`package.json` raiz).

**Styling Solution:** CSS puro / CSS Modules, reaproveitando `design-system/variables.css` e os
componentes CSS já prototipados — sem framework de utilitários.

**Build Tooling:** Next.js built-in (Turbopack em dev), sem configuração adicional de bundler.

**Testing Framework:** Vitest + React Testing Library para testes unitários/componentes
(cobertura ≥80% por NFR-8); Playwright para E2E fica como decisão futura, focada nos fluxos
críticos (login, primeira sessão de conversa) quando essas telas existirem.

**Code Organization:** App Router com rotas em `apps/web/src/app`, componentes em
`apps/web/src/components`, lógica compartilhada (Supabase clients, tipos, prompts do agente) em
`apps/web/src/lib`.

**Development Experience:** Next.js dev server com Turbopack, TypeScript checado via
`npm run typecheck`, ESLint padrão do Next.js.

**Nota de limpeza de scaffold:** como parte da primeira história de implementação, remover os
placeholders `apps/mobile/`, `packages/ui/`, `packages/types/` (decisão de simplificação já
tomada) e ajustar `tsconfig.json` (remover `packages/**` do `include`). O protótipo funcional em
`scripts/agent-test.ts` (detecção de estado emocional + prompt com as 4 perspectivas filosóficas)
deve ser portado para `apps/web/src/lib/agent/` como base real da FR-3, não descartado — já valida
boa parte da lógica do agente.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Estratégia de memória do agente: camadas (mensagens da sessão atual + sínteses das últimas N
  sessões + agregado de padrões pré-computado) — sem RAG/vetor no MVP
- Autenticação por convite via `supabase.auth.admin.inviteUserByEmail()` (admin-driven, sem
  allowlist/trigger customizado)
- Runtime Node.js (não Edge) para o endpoint de streaming de chat — remove o risco de timeout de
  30s identificado no `stack-research.md`
- Transcrição de áudio via Web Speech API (client-side, sem custo) para o MVP

**Important Decisions (Shape Architecture):**
- Modelagem de dados: `sessions`, `messages`, `session_syntheses`, `user_patterns` (Postgres via
  Supabase, migrations via Supabase CLI, validação com Zod)
- Rate limiting de custo: limite de mensagens/dia por usuário no endpoint de chat, para conter
  custo da API Anthropic sem orçamento definido
- SWR para data fetching client-side (histórico, dashboard); Server Components para renderização
  inicial
- PWA: manifest + service worker mínimo escrito à mão (sem `next-pwa`), sem cache offline completo
- Trilha de auditoria: tabela `audit_log` simples para eventos sensíveis (login, export, delete)

**Deferred Decisions (Post-MVP):**
- pgvector/busca semântica sobre histórico — só se a memória em camadas se mostrar insuficiente
- Migração de transcrição para serviço externo (Whisper API) — se a qualidade do Web Speech API
  não for suficiente nos testes com beta users
- Monitoramento externo (Sentry ou similar) — Vercel logs nativos bastam no MVP
- Testes E2E com Playwright — Vitest + React Testing Library cobre o MVP

### Data Architecture

- **Banco de dados:** Supabase (Postgres gerenciado), já decidido no `stack-research.md`
- **Modelagem:** tabelas `sessions` (metadados de sessão), `messages` (mensagens individuais,
  role + conteúdo + timestamp), `session_syntheses` (síntese gerada ao final de cada sessão — FR-5),
  `user_patterns` (agregado de temas/emoções por usuário, atualizado ao final de cada sessão),
  `audit_log` (trilha de auditoria)
- **Estratégia de memória do agente (resolve a preocupação transversal #1):** o prompt enviado ao
  Claude a cada turno é composto por (1) mensagens da sessão atual (contexto de trabalho), (2) as
  sínteses (`session_syntheses`) das últimas N sessões — texto curto, poucos tokens — em vez do
  histórico bruto completo, e (3) o agregado `user_patterns` como bloco estruturado compacto. Isso
  atende FR-4 (padrões longitudinais) sem estourar a janela de contexto conforme o histórico cresce,
  e sem exigir um banco vetorial
- **Validação:** Zod, schemas compartilhados entre client e server
- **Migrations:** Supabase CLI (SQL versionado em `supabase/migrations`, já scaffolded)
- **Caching:** `user_patterns` é pré-computado ao final de cada sessão (junto ao processo de síntese
  do FR-5), não recalculado a cada acesso ao dashboard — atende NFR-1 (home <2s)

### Authentication & Security

- **Autenticação:** Supabase Auth (email + senha), fluxo de convite via
  `supabase.auth.admin.inviteUserByEmail()` — admin (Mario) cria a conta e envia o convite,
  sem formulário público de signup (atende FR-1: beta fechado por convidados)
- **Autorização:** Row Level Security (RLS) do Postgres para isolamento de dados por usuário
- **Rate limiting de login:** rate limiting nativo do Supabase Auth (NFR: máx 5 tentativas/5min)
- **Segredo da API Anthropic:** nunca exposto ao client — chamadas exclusivamente via Route
  Handlers Next.js no servidor, chave em variável de ambiente server-side
- **Modelo de criptografia real (resolve a tensão do FR-8 "E2EE"):** criptografia em repouso
  (Supabase/Postgres, AES-256) + TLS 1.3+ em trânsito. Verdadeira E2EE (onde nem o servidor lê o
  conteúdo) é incompatível com um agente de IA que precisa processar o texto em claro para gerar
  respostas e detectar padrões — a política de privacidade deve comunicar "criptografia de ponta a
  ponta na infraestrutura", não "nem o servidor consegue ler seus dados"
- **Trilha de auditoria:** tabela `audit_log` (user_id, ação, timestamp) para eventos sensíveis
  (login, export de dados, deleção de conta)

### API & Communication Patterns

- **Endpoint de chat:** Route Handler (`app/api/chat/route.ts`), runtime Node.js, retorna
  `ReadableStream` fazendo proxy do streaming da Anthropic API. Runtime Node.js (não Edge) elimina
  o risco de timeout de 30s do Edge Runtime — Fluid Compute do Vercel já dá 300s de duração padrão
- **Mutações simples** (encerrar sessão, gerar resumo sob demanda, deletar conta): Server Actions
- **Formato de erro:** padronizado `{ error: { code, message } }` no backend, traduzido para copy
  acolhedor no frontend — nunca expor termos técnicos ao usuário (conforme `ux-patterns.md`)
- **Rate limiting de custo:** limite de mensagens por dia por usuário no endpoint de chat, contador
  simples em Postgres — protege contra custo descontrolado da API Anthropic dado que não há
  orçamento definido para o MVP
- **Comunicação entre serviços:** monólito — um único Next.js app fala diretamente com Supabase e
  Anthropic API, sem decomposição em microserviços

### Frontend Architecture

- **Gerenciamento de estado:** Server Components para dados (histórico, dashboard) + estado local
  (`useState`/`useReducer`) para UI de gravação/chat em andamento — sem biblioteca de state global
- **Data fetching client-side:** SWR para histórico e dashboard (cache automático, evita re-fetch
  desnecessário)
- **Streaming de mensagens na UI:** `ReadableStream` consumido via `fetch` no client — sem
  WebSocket, já que o padrão é request/response com streaming de texto, não conexão persistente
- **Transcrição de áudio:** Web Speech API (client-side, sem custo) para o MVP. Web Speech API
  tem suporte inconsistente entre navegadores (mais fraco em Firefox/Safari) — decisão explícita de
  aceitar essa limitação no MVP, com migração para serviço externo (Whisper API) como caminho de
  evolução se a qualidade não for suficiente nos testes com beta users
- **PWA:** manifest + service worker mínimo escrito à mão (sem plugin `next-pwa`) — só precisa ser
  instalável no Android, sem cache offline completo (já descartado no `stack-research.md`)
- **Roteamento:** App Router (file-based), conforme starter

### Infrastructure & Deployment

- **Hosting:** Vercel (app) + Supabase Cloud (banco/auth/storage)
- **CI/CD:** deploy automático do Vercel em push para `main` + GitHub Actions rodando `typecheck` e
  testes Vitest como check obrigatório antes do merge
- **Configuração de ambiente:** Vercel Environment Variables (produção/preview) + `.env.local`
  (gitignored) para desenvolvimento local
- **Monitoramento/Logs:** Vercel logs nativos + `console` estruturado (JSON) no MVP; Sentry fica
  como evolução pós-beta
- **Rollback:** rollback instantâneo nativo do Vercel para deploy anterior — atende NFR-8 sem
  lógica customizada
- **Escala:** autoscaling nativo do Vercel + Supabase cobre a tensão identificada entre NFR-3
  (10k usuários) e as constraints do MVP (5-10 beta testers) sem decisão de infraestrutura
  adicional — o ponto de atenção real em escala é custo da API Anthropic, não infraestrutura

### Decision Impact Analysis

**Implementation Sequence:**
1. Inicialização do projeto (comando do starter) + limpeza do scaffold (`apps/mobile`,
   `packages/ui`, `packages/types`) + ajuste do `tsconfig.json`
2. Portar `scripts/agent-test.ts` (detecção de estado emocional + prompt das 4 perspectivas) para
   `apps/web/src/lib/agent/` como base real da FR-3
3. Migrations do Supabase: `sessions`, `messages`, `session_syntheses`, `user_patterns`, `audit_log`
4. Fluxo de autenticação (convite admin-driven, login, políticas RLS)
5. Route Handler de chat (Node.js runtime, streaming, rate limit de mensagens/dia)
6. UI de chat + gravação de áudio (Web Speech API)
7. Geração de síntese ao final de sessão (FR-5) + atualização do agregado `user_patterns`
8. Dashboard de indicadores (FR-7) lendo o agregado pré-computado
9. Resumos periódicos sob demanda (FR-6) + exportação PDF
10. Fluxos de LGPD: export JSON, deleção irreversível, `audit_log`
11. Manifest PWA + prompt de instalação no Android
12. CI (GitHub Actions: typecheck + testes) + configuração de deploy Vercel

**Cross-Component Dependencies:**
- O Route Handler de chat depende do schema (`sessions`/`messages`) e do contador de rate limit
- A síntese de sessão depende da conclusão do chat e dispara a atualização de `user_patterns`
- O dashboard depende do agregado `user_patterns`, nunca recalcula a partir de `messages` bruto
- Os resumos semanais/mensais dependem de `session_syntheses` + `user_patterns`
- A transcrição de áudio (Web Speech API) é puramente client-side, sem dependência de backend
  no MVP

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming:**
- Tabelas: snake_case, plural (`sessions`, `messages`, `session_syntheses`, `user_patterns`, `audit_log`)
- Colunas: snake_case (`user_id`, `created_at`)
- Chaves estrangeiras: `<entidade_singular>_id` (ex: `session_id`, `user_id`)
- Índices: `idx_<tabela>_<coluna>` (ex: `idx_messages_session_id`)

**API Naming:**
- Route Handlers usam substantivos no plural para coleções (`/api/sessions`), exceto endpoints de
  ação única sem coleção (`/api/chat`)
- Paths multi-palavra em kebab-case (`/api/session-syntheses`)
- Query params em camelCase (`?sessionId=...`) — mapeamento snake_case↔camelCase acontece na
  camada de acesso a dados, nunca vaza para fora dela

**Code Naming:**
- Componentes React: PascalCase, arquivo com o mesmo nome (`ChatWindow.tsx`)
- Funções/variáveis: camelCase
- Hooks customizados: prefixo `use` (`useChatStream`, `useAudioRecorder`)
- Módulos server-only: sufixo `.server.ts` quando ambíguo (ex: acesso a `ANTHROPIC_API_KEY`)

### Structure Patterns

**Project Organization:**
- Componentes organizados por feature: `src/components/chat/`, `src/components/history/`,
  `src/components/insights/`, `src/components/auth/`; componentes genéricos do design system em
  `src/components/ui/` (mic-button, synthesis-card, transcript-block — nomes já definidos no
  design system)
- Lógica de negócio/utilitários em `src/lib/` (`src/lib/agent/`, `src/lib/supabase/`,
  `src/lib/validation/`)
- Route Handlers em `src/app/api/<nome>/route.ts`

**File Structure:**
- Testes co-localizados junto ao arquivo fonte (`ChatWindow.test.tsx` ao lado de `ChatWindow.tsx`),
  não em árvore `__tests__/` separada — mais simples de manter sozinho
- Migrations do Supabase em `supabase/migrations/`, numeradas por timestamp (padrão da CLI)

### Format Patterns

**API Response Formats:**
- Sucesso: retorna o recurso diretamente (sem wrapper `{data: ...}`)
- Erro: sempre `{ error: { code, message } }` (decidido na Categoria 3 de decisões)
- Datas: strings ISO 8601 em JSON (`"2026-07-04T10:00:00Z"`); formatação para exibição fica em um
  util compartilhado, nunca formatada no backend
- Campos JSON: camelCase na fronteira da API (client-facing), mesmo com colunas `snake_case` no
  banco — a conversão acontece na camada de acesso a dados
- Booleanos: `true`/`false` nativos, nunca `0`/`1`

### Communication Patterns

**State Management:**
- Atualizações de estado sempre imutáveis (nunca mutação direta)
- Estado complexo de chat (mensagens, status de streaming) via `useReducer`, não múltiplos
  `useState` soltos
- Sem sistema de eventos/pub-sub — é um monólito, não há necessidade

**Loading States:**
- Estados nomeados como união de status (`'idle' | 'loading' | 'streaming' | 'error'`), não
  múltiplos booleanos soltos quando há mais de 2 estados possíveis
- UI de carregamento segue o padrão "loading humano" já definido em `ux-patterns.md` (animação
  orgânica + copy reconfortante), nunca um spinner genérico

### Process Patterns

**Error Handling:**
- Validação com Zod na fronteira da API (Route Handler/Server Action), nunca checagens inline
  espalhadas pelo código
- Erros internos nunca vazam stack trace ou termos técnicos ao client — sempre mapeados para copy
  acolhedor conforme `ux-patterns.md` ("Não consegui entender bem. Pode tentar novamente?")
- Falhas de envio de mensagem no chat: botão de retry explícito, **nunca** retry automático
  silencioso (evita duplicar custo de chamada à API Anthropic)
- Falhas de gravação/transcrição de áudio: affordance de "Regravar" explícita (já definida em
  `ux-patterns.md`)

### Enforcement Guidelines

**All AI Agents MUST:**
- Seguir as convenções de nomenclatura acima sem exceção, mesmo quando o padrão do framework
  sugerir outra coisa
- Consultar este documento antes de criar uma nova tabela, endpoint ou componente
- Propor uma atualização a este documento (não improvisar) se um padrão novo for necessário

**Pattern Enforcement:**
- Revisão de código (manual, solo dev) confere aderência antes de commit
- Divergências encontradas depois do fato são corrigidas e este documento é atualizado para
  refletir a decisão real

## Project Structure & Boundaries

### Complete Project Directory Structure

```
projeto_app_mente/
├── README.md
├── package.json
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── CLAUDE.md
├── .github/
│   └── workflows/
│       └── ci.yml                          # typecheck + vitest, gate antes do merge
├── docs/
│   └── adr/                                # decisões arquiteturais pontuais pós-MVP
├── _bmad-output/
│   └── planning-artifacts/                 # prd.md, ux-*.md, architecture.md, design-system/, wireframes/
├── apps/
│   └── web/
│       ├── public/
│       │   ├── manifest.json               # PWA — instalável no Android
│       │   └── icons/
│       └── src/
│           ├── middleware.ts                # refresh de sessão Supabase (padrão @supabase/ssr)
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── globals.css
│           │   ├── page.tsx                 # Dashboard/home — FR-7
│           │   ├── login/page.tsx           # FR-1
│           │   ├── chat/page.tsx            # FR-2 / FR-3
│           │   ├── history/page.tsx         # FR-4 (ux-patterns Padrão 1)
│           │   ├── insights/page.tsx        # FR-6 / FR-7 (ux-patterns Padrão 2)
│           │   ├── settings/page.tsx        # FR-8 (export/delete de conta)
│           │   └── api/
│           │       └── chat/route.ts        # ÚNICO Route Handler — streaming, runtime Node.js
│           ├── components/
│           │   ├── ui/                      # mic-button, synthesis-card, transcript-block, chip
│           │   │                             #   (portados do design-system, sem lógica de negócio)
│           │   ├── chat/                    # ChatWindow, MessageBubble, AudioRecorder, ChatComposer
│           │   ├── history/                 # SessionList, SessionCard
│           │   ├── insights/                # SynthesisCard, TrendChart, MilestoneList
│           │   └── auth/                    # LoginForm
│           ├── lib/
│           │   ├── agent/
│           │   │   ├── prompts.ts           # portado de scripts/agent-test.ts (BASE_SYSTEM_PROMPT + TONE_MAP)
│           │   │   ├── emotional-state.ts   # portado de scripts/agent-test.ts (detectEmotionalState)
│           │   │   └── memory.ts            # monta prompt: sessão atual + sínteses + user_patterns
│           │   ├── supabase/
│           │   │   ├── client.ts            # browser client
│           │   │   └── server.ts            # server client (Server Components/Actions/Route Handlers)
│           │   ├── actions/                 # Server Actions
│           │   │   ├── endSession.ts        # FR-5 — gera síntese, atualiza user_patterns
│           │   │   ├── generateSummary.ts   # FR-6 — resumo semanal/mensal sob demanda
│           │   │   ├── exportData.ts        # FR-8 — export JSON
│           │   │   └── deleteAccount.ts     # FR-8 — deleção irreversível
│           │   ├── validation/              # schemas Zod (message, session)
│           │   └── rate-limit.ts            # contador de mensagens/dia por usuário
│           ├── types/                       # tipos compartilhados (gerados do schema Supabase)
│           └── styles/
│               └── variables.css            # movido de design-system/variables.css
├── supabase/
│   ├── migrations/
│   │   └── <timestamp>_init_schema.sql      # sessions, messages, session_syntheses, user_patterns, audit_log
│   └── functions/                           # reservado, vazio no MVP
└── scripts/
    └── agent-test.ts                        # mantido como CLI de teste manual do prompt, referenciando lib/agent/
```

### Architectural Boundaries

**API Boundaries:**
- Único Route Handler real: `/api/chat` (streaming, runtime Node.js). Toda mutação que não exige
  streaming é Server Action — não existe uma API REST tradicional para sessions/messages
- Autenticação/sessão: `middleware.ts` renova o cookie de sessão do Supabase em toda request
  (padrão `@supabase/ssr`); autorização de dados é 100% via RLS no Postgres, não filtrada em código

**Component Boundaries:**
- `components/ui/` é puramente apresentacional — nunca importa Supabase ou lógica de negócio
  diretamente, só recebe props
- `components/{chat,history,insights,auth}/` consomem dados via Server Components (props) ou
  Server Actions — nunca chamam o client do Supabase diretamente de dentro de um Client Component

**Data Boundaries:**
- Apenas `src/lib/supabase/` e `src/lib/actions/` tocam o banco. Nenhum componente importa o
  client do Supabase diretamente
- `user_patterns` é a única fonte de leitura do dashboard/insights — nunca se recalcula varrendo
  `messages` bruto em tempo de request

### Requirements to Structure Mapping

- **FR-1 (Auth):** `app/login/`, `components/auth/`, `lib/supabase/` — convite admin-driven é uma
  ação manual fora do app (Supabase dashboard/CLI), não uma tela
- **FR-2/FR-3 (Conversação + Agente adaptativo):** `app/chat/`, `components/chat/`, `lib/agent/`,
  `app/api/chat/route.ts`
- **FR-4 (Memória/histórico):** `app/history/`, `components/history/`, tabelas `sessions`/`messages`,
  `lib/agent/memory.ts`
- **FR-5 (Síntese de sessão):** `lib/actions/endSession.ts`, tabela `session_syntheses`,
  `components/insights/SynthesisCard`
- **FR-6 (Resumos periódicos):** `lib/actions/generateSummary.ts`, `app/insights/` — biblioteca de
  geração de PDF ainda não escolhida (decisão de leaf-detail, fica para a história de implementação
  do resumo, não é um risco arquitetural)
- **FR-7 (Indicadores):** `app/page.tsx` (dashboard), `components/insights/TrendChart`, tabela
  `user_patterns`
- **FR-8 (Segurança/LGPD):** `lib/actions/{exportData,deleteAccount}.ts`, tabela `audit_log`,
  `app/settings/`

### Integration Points

**Internal Communication:** Server Components buscam dados direto via `lib/supabase/server.ts`;
Client Components usam SWR só onde precisam de refresh sem reload (histórico, dashboard); Server
Actions tratam todas as mutações exceto o streaming de chat.

**External Integrations:** Anthropic API (via `lib/agent` + `api/chat/route.ts`, chave só
server-side); Supabase (auth + Postgres); Web Speech API é uma API do navegador, chamada
diretamente do `components/chat/AudioRecorder` via hook `useAudioRecorder` — não é um serviço
externo.

**Data Flow:** mensagem do usuário → POST para `/api/chat` → `lib/agent/memory.ts` monta o prompt
(sessão atual + sínteses recentes + `user_patterns`) → streaming da Anthropic → streaming de volta
ao client → ao fim do stream, mensagens (usuário + agente) persistidas em `messages` dentro do
mesmo Route Handler. Ao encerrar sessão → Server Action gera síntese (chamada separada, menor
custo) → grava em `session_syntheses` e atualiza `user_patterns`.

### File Organization Patterns

Configuração na raiz (único `package.json`/`tsconfig.json` — sem workspaces); testes
co-localizados junto ao código-fonte; assets estáticos em `apps/web/public/`.

### Development Workflow Integration

`npm run dev` sobe o Next.js apontando para `apps/web`; `npm run typecheck` roda TS strict;
GitHub Actions roda typecheck + Vitest em toda PR; deploy automático via push para `main` no
Vercel, com rollback nativo caso necessário.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Next.js 16.2.10 LTS (App Router, runtime Node.js) + React 19 +
Supabase (Postgres/Auth/RLS) + Anthropic SDK + Vitest + SWR + CSS puro — nenhuma incompatibilidade
de versão. CSS puro é coerente com o design system já construído e com a escolha de starter limpo
(sem Tailwind/shadcn).

**Pattern Consistency:** todos os padrões de nomenclatura, estrutura e formato derivam diretamente
das decisões arquiteturais das Categorias 1–5, sem contradição entre eles.

**Structure Alignment:** a árvore de diretórios reflete exatamente os limites definidos —
`components/ui/` sem lógica de negócio, `lib/` como único ponto de acesso a dados, um único Route
Handler (`/api/chat`) para o único caso real de streaming.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:** FR-1 a FR-8 mapeados explicitamente para diretórios/tabelas
específicos na seção "Requirements to Structure Mapping" — nenhuma FR sem suporte arquitetural.

**Non-Functional Requirements Coverage:**
- NFR-1 (Performance): streaming + `user_patterns` pré-computado + runtime Node com Fluid Compute
- NFR-2 (Disponibilidade): **revisado nesta validação** — backup diário do tier gratuito do
  Supabase aceito conscientemente como trade-off do MVP, em vez do backup horário original do PRD.
  Pior caso de perda de dados: até 24h de conversas. Aceitável para validação de conceito com 5-10
  beta testers avisados; upgrade para Supabase Pro (point-in-time recovery) é caminho de evolução
  se a retenção de dados exigir RPO menor
- NFR-3 (Escalabilidade): autoscaling nativo Vercel/Supabase; **adição desta validação** — usar a
  connection string com pooler do Supabase (Supavisor, porta 6543) em vez de conexão direta ao
  Postgres, para evitar esgotamento de conexões sob concorrência em ambiente serverless
- NFR-4 (Segurança): TLS 1.3+ + AES-256 + bcrypt + rate limiting; modelo de criptografia realista
  já documentado (não E2EE literal)
- NFR-5 (Compatibilidade): navegadores/Android cobertos; limitação aceita do Web Speech API em
  Safari/Firefox já documentada na Categoria 4
- NFR-6 (Acessibilidade): WCAG 2.1 AA + dark mode já definidos no design system
- NFR-7 (Usabilidade): coberto pela especificação de UX, não é decisão de arquitetura
- NFR-8 (Manutenibilidade): cobertura ≥80% via Vitest; **adição desta validação** — incluir gate de
  cobertura explícito no `ci.yml` (falhar o CI se cobertura cair abaixo de 80%); CI/CD e rollback
  nativo do Vercel já cobertos

### Implementation Readiness Validation ✅

Todas as decisões críticas estão documentadas com tecnologia e versão (Next.js 16.2.10 LTS,
React 19, TypeScript 5.7+). Padrões de implementação são específicos o suficiente para que
diferentes sessões de Claude Code cheguem ao mesmo resultado. Estrutura do projeto é completa e
específica, não genérica.

### Gap Analysis Results

**Critical Gaps:** nenhum.

**Important Gaps (resolvidos nesta validação):**
- Versão do Next.js no scaffold estava desatualizada (`^15.0.0`) vs. atual estável (16.2.10 LTS) —
  resolução: bump para `^16.0.0`+ como parte da primeira história de implementação
- Connection pooling não estava especificado — resolução: usar connection string do Supavisor
  (porta 6543)
- Backup horário (NFR-2) incompatível com tier gratuito do Supabase — resolução: trade-off aceito
  conscientemente pelo usuário, documentado acima

**Nice-to-Have Gaps (deferidos, não bloqueantes):**
- Biblioteca de geração de PDF para FR-6 — decidir na história de implementação do resumo periódico
- `eslint-plugin-jsx-a11y` para reforçar WCAG AA — opcional, não bloqueia o MVP

### Validation Issues Addressed

Os 3 gaps importantes foram resolvidos diretamente nesta validação (ver acima) — dois por
documentação técnica direta (versão do Next.js, connection pooling), um por decisão explícita do
usuário (aceitar backup diário do tier gratuito, revisando a expectativa original do NFR-2).

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**
- Estratégia de memória do agente (camadas: sessão + sínteses + agregado) resolve o maior risco
  técnico identificado sem introduzir infraestrutura desnecessária (sem banco vetorial no MVP)
- Reaproveita o protótipo funcional já validado (`scripts/agent-test.ts`) em vez de descartá-lo
- Reaproveita o design system em CSS puro já construído, evitando retrabalho de UI
- Nenhuma decisão introduz complexidade que um solo dev não consiga manter em 3 meses

**Areas for Future Enhancement:**
- pgvector/RAG semântico sobre o histórico, se a memória em camadas se mostrar insuficiente
- Migração de transcrição para Whisper API, se a qualidade do Web Speech API não for suficiente
- Monitoramento externo (Sentry) e testes E2E (Playwright), pós-beta
- Upgrade para Supabase Pro (point-in-time recovery), se o RPO de 24h se mostrar arriscado demais

### Implementation Handoff

**AI Agent Guidelines:**
- Seguir todas as decisões arquiteturais exatamente como documentado neste arquivo
- Usar os padrões de implementação de forma consistente em todos os componentes
- Respeitar a estrutura e os limites do projeto definidos acima
- Consultar este documento para qualquer dúvida arquitetural antes de decidir por conta própria

**First Implementation Priority:**
Inicialização do projeto — `npx create-next-app@latest apps/web --typescript --app --no-tailwind
--eslint --src-dir --import-alias "@/*"` (com Next.js 16.x), seguida da limpeza do scaffold
(`apps/mobile`, `packages/ui`, `packages/types`) e da portabilidade de `scripts/agent-test.ts`
para `apps/web/src/lib/agent/`.
