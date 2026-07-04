# Stack Research — Diário Digital para Bem-Estar Mental

**Data:** 2026-06-28  
**Autor:** Mario Dimov (com suporte Claude Code)  
**Status:** Insumo para decisão de arquitetura  
**Próximo passo:** Formalizar via processo `bmad-create-architecture`

---

## Contexto da análise

Constraints determinantes:
- Solo developer, MVP em 3 meses
- 5–10 usuários beta (beta fechado, sem Play Store)
- Velocidade de iteração > escalabilidade inicial
- Plataformas: Web + Android

Requisitos funcionais que impactam a stack:
- Autenticação (email + senha, beta fechado por convite)
- Conversação com LLM (Anthropic API, streaming)
- Memória persistente de conversas (histórico completo por usuário)
- Segurança e isolamento de dados por usuário (LGPD)

---

## Opção A — Next.js + Supabase (Web-first + PWA) ✅ Recomendada

```
Frontend:  Next.js (React) — Web responsiva + PWA instalável no Android
Backend:   Supabase (auth, Postgres, RLS, storage)
IA:        Anthropic API via Next.js API Routes
Deploy:    Vercel + Supabase Cloud
```

### Prós
- Uma única codebase — web responsiva vira PWA instalável no Android; zero React Native
- Supabase resolve 80% do backend — auth, banco Postgres, Row Level Security nativo para isolamento por usuário, backup automático
- Velocidade máxima de iteração — API Routes do Next.js sem servidor separado; um repositório, um deploy
- RLS é segurança by design — isolamento de dados por usuário a nível de banco, sem lógica de autorização manual
- Custo zero no MVP — Vercel free tier + Supabase free tier suportam 5-10 usuários beta
- Histórico de conversas simples — tabela `messages` no Postgres com full-text search nativo; sem vector DB no MVP

### Contras
- PWA no Android tem limitações — notificações push inconsistentes, não aparece na Play Store, instalação depende de prompt do Chrome
- Sem acesso offline — conversas precisam de conexão
- Streaming requer cuidado — Next.js Edge Functions têm timeout de 30s; respostas longas da Claude exigem streaming via `ReadableStream`

---

## Opção B — Next.js + Supabase + React Native (Expo)

```
Frontend Web:    Next.js (React)
Frontend Mobile: Expo (React Native) — app Android nativo
Backend:         Supabase (compartilhado)
IA:              Anthropic API via Next.js API Routes (proxy seguro)
Deploy:          Vercel + Supabase Cloud + APK direto
Shared code:     packages/ui e packages/types (monorepo)
```

### Prós
- App Android nativo — experiência superior ao PWA; notificações push reais; instalável via APK para beta fechado
- Compartilha lógica de negócio — hooks, types e chamadas Supabase são iguais em web e mobile
- Mais próximo do produto final — evita reescrever mobile depois se Play Store for objetivo

### Contras
- Duas codebases de UI — componentes React ≠ React Native; dobra o esforço por tela
- Expo adiciona complexidade — builds, EAS, debugging em device físico; ciclo de feedback mais lento
- Mais superfície de manutenção — para 1 dev em 3 meses, manter web + mobile sincronizados é arriscado

---

## Recomendação

**Opção A para o MVP**, por três razões diretamente ligadas às constraints do projeto:

1. **3 meses + solo dev** — a Opção B duplica a superfície de código de UI sem duplicar o valor entregue ao beta
2. **Beta fechado de 5-10 pessoas** — esses usuários podem instalar um PWA sem atrito; o problema de distribuição só importa em escala
3. **PWA no Chrome Android é suficiente para o caso de uso central** — conversação por texto funciona perfeitamente; os pontos fracos do PWA (notificações, offline) não são críticos para o MVP

### Caminho de evolução pós-MVP

Se após validação o app precisar de presença na Play Store ou notificações push robustas, a migração para Expo é gerenciável: o backend Supabase e a lógica de IA (Anthropic API) ficam intactos — apenas a camada de UI mobile seria reescrita.
