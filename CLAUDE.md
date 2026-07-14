# CLAUDE.md — Diário Digital para Bem-Estar Mental

> Arquivo de contexto permanente do projeto. Leia este arquivo no início de cada sessão antes de qualquer implementação.

---

## O que é este projeto

Aplicativo de diário digital que funciona como **espelho reflexivo** — não terapêutico, não prescritivo. Facilita autoconhecimento através de conversação estruturada com IA, detecção de padrões emocionais e insights baseados no histórico do próprio usuário.

**Visão:** "Tecnologia para tocar a alma e despertar a mente."

**Autor:** Mario Dimov  
**Versão PRD:** 2.0 (junho/2026)  
**Timeline MVP:** 3 meses (alvo: setembro/2026)

---

## Contexto de desenvolvimento

- **Solo developer** com suporte de IA (Claude Code)
- **Objetivo imediato:** Protótipo funcional para validação de conceito (5–10 usuários beta)
- **Prioridade:** Velocidade de iteração > production-readiness
- **Modelo de acesso:** Beta fechado, gratuito, apenas convidados

---

## Stack (definida — ver `_bmad-output/planning-artifacts/architecture.md`)

- **Frontend/Backend:** Next.js 16 (App Router, runtime Node.js), TypeScript, React 19 — app único em `apps/web`, sem monorepo/mobile separado
- **Estilização:** CSS puro (custom properties), sem Tailwind — reaproveita o design system já construído
- **Backend/BaaS:** Supabase (Postgres + Auth + RLS + Supavisor pooler)
- **IA/LLM:** Anthropic API (Claude), streaming via Route Handler dedicado (`/api/chat`)
- **Testes:** Vitest + React Testing Library
- **Deploy:** Vercel + Supabase Cloud
- **Transcrição de áudio:** Web Speech API (client-side) no MVP; Whisper API é caminho de evolução

**Critério de escolha:** Simples, rápido de iterar, gerenciável por 1 pessoa; decisões completas incluem estratégia de memória do agente, autenticação por convite, rate limiting de custo e modelo de criptografia — ver documento de arquitetura para detalhes e rationale.

---

## Plataformas do MVP

| Plataforma | Detalhes |
|---|---|
| Web | Responsiva — Chrome ≥100, Firefox ≥97, Safari ≥15, Edge ≥100 |
| Android | Android ≥10 (SDK 29), telas 4.5"–6.7", portrait e landscape |

---

## Funcionalidades do MVP

### FR-1: Autenticação
- Email + senha com confirmação
- Beta fechado: apenas convidados podem criar conta
- Rate limiting: máx 5 tentativas de login por 5 min

### FR-2: Conversação Inteligente
- Interface de diálogo com histórico visível na sessão
- Agente inicia com pergunta-guia estruturada
- Adaptação dinâmica de tom conforme estado emocional detectado:
  - Baixa autoestima → reconfortante
  - Ego inflado → reflexivo/provocador
  - Neutro → equilibrado
- Perspectivas filosóficas integradas: Estoica, Jungiana, Freudiana, Budista

### FR-3: Memória Persistente
- Histórico completo de conversas armazenado
- Agente acessa histórico para detectar padrões longitudinais
- Pode referenciar conversas anteriores explicitamente

### FR-4: Detecção de Padrões
- Análise de temas recorrentes, emoções e gatilhos
- Aviso de privacidade antes de usar histórico para análise

### FR-5: Síntese ao Final da Sessão
- Gerada ao clicar "Encerrar sessão" ou após 60 min de inatividade
- Contém: (1) o que foi explorado, (2) padrões identificados, (3) pergunta aberta
- Usuário pode reagir com emoji ou comentário curto

### FR-6: Resumos Periódicos (Sob Demanda)
- Resumo de semana: top 5 tópicos, emoções dominantes, progresso
- Resumo de mês: padrões de longo prazo, tendências
- Exportação em PDF

### FR-7: Indicadores de Evolução
- Dashboard: dias consecutivos, sessões, temas explorados, tendência emocional 7 dias
- Marcos pessoais definidos pelo usuário
- Sem gamification (sem badges, estrelas, pontos)

### FR-8: Segurança e LGPD
- HTTPS obrigatório (TLS 1.3+)
- AES-256 em repouso, E2EE para conversas
- Bcrypt para senhas
- Export de dados em JSON a qualquer momento
- Deleção de conta = destruição permanente e irreversível
- 100% conformidade LGPD

---

## Fora do MVP (não implementar agora)

- ❌ Compartilhamento com psicólogos
- ❌ Comunidades anônimas
- ❌ Integração com wearables
- ❌ Múltiplos agentes com escolha
- ❌ Gamification / sistema de pontos
- ❌ Consulta com profissionais pagos

---

## NFRs críticos para decisões de código

| Requisito | Meta |
|---|---|
| Carregamento home | < 2s em 4G |
| Resposta do agente | < 5s |
| Uptime | ≥ 99.5% |
| Crash rate | ≤ 0.1% |
| Cobertura de testes | ≥ 80% |
| Acessibilidade | WCAG 2.1 AA |
| Fonte mínima | 14px |
| Dark mode | Obrigatório |

---

## Valores que devem guiar decisões técnicas

1. **Privacidade acima de tudo** — nenhuma decisão técnica pode comprometer dados do usuário
2. **Honestidade** — não criar ilusão de capacidades que o app não tem
3. **Profundidade > escala** — qualidade da experiência para poucos > volume para muitos
4. **Simplicidade de manutenção** — solo dev, código legível e testável

---

## Estado atual do projeto

- [x] PRD completo (v2.0)
- [x] Design UX — especificação + design system + wireframes completos
- [x] Arquitetura técnica — completa e validada (`_bmad-output/planning-artifacts/architecture.md`)
- [x] Épicos e histórias — 5 épicos, 30 histórias, validados (`_bmad-output/planning-artifacts/epics.md`)
- [x] Setup do repositório — Story 1.1 concluída: `apps/web` inicializado com Next.js 16, scaffold antigo (`apps/mobile`/`packages/*`) removido, lógica do agente portada para `apps/web/src/lib/agent/`
- [x] Fundação visual e acessibilidade — Story 1.2 concluída (em review): tokens do design system carregados globalmente via `apps/web/src/styles/variables.css`, dark mode fixo, contraste validado automaticamente (`apps/web/src/lib/a11y/contrast.ts`)
- [x] Implementação — concluída: Epic 1 / Story 1.3 (onboarding e aviso de não-terapia)
- [x] Implementação — em review: Epic 1 / Story 1.4 (aceitar convite e criar conta): clients Supabase (`apps/web/src/lib/supabase/`), fluxo `/auth/confirm` + `/auth/definir-senha` via `supabase.auth.verifyOtp`/`updateUser`, aba pública "Criar conta" removida de `/auth`. Dependências `@supabase/ssr`/`@supabase/supabase-js` adicionadas; `.env.example` documenta as variáveis necessárias — nenhum projeto Supabase real provisionado ainda neste ambiente.
- [x] Implementação — em review: Epic 1 / Story 1.5 (login com sessão persistente): `LoginForm` habilitado chamando a Server Action `login` (`apps/web/src/lib/actions/login.ts`, `supabase.auth.signInWithPassword`) — redireciona para `/` no sucesso; em erro, nunca revela se o e-mail existe (mensagem genérica de credenciais inválidas, ou mensagem de rate limit gentil quando `error.status === 429`, apoiada no rate limiting nativo do Supabase Auth de 5 tentativas/5min). `apps/web/src/proxy.ts` criado (convenção `proxy.ts` do Next.js 16, substituindo `middleware.ts`) implementando o padrão oficial `@supabase/ssr` de renovação do cookie de sessão a cada request; cookie de refresh do Supabase dura 400 dias por padrão, superando o requisito de 24h.
- [x] Implementação — em review: Epic 1 / Story 1.6 (recuperação de senha): `/auth/esqueci-senha` (nova Server Action `requestPasswordReset`, `apps/web/src/lib/actions/requestPasswordReset.ts`, chamando `supabase.auth.resetPasswordForEmail` — nunca revela se o e-mail existe, só distingue rate limit) e `/auth/redefinir-senha` (reaproveita a Server Action `setPassword` da Story 1.4, agora com parâmetro opcional `errorMessage` para copy específica do fluxo). `apps/web/src/app/auth/confirm/route.ts` passou a aceitar `type=recovery` além de `type=invite`, com destino e página de erro (`/auth?erro=link-invalido`) próprios. Passou por code review (8 agentes + verificação): corrigidos o gate de sessão de `/auth/redefinir-senha` (agora exige `amr` com método `"recovery"` via `supabase.auth.getClaims()`, não apenas qualquer sessão autenticada), a mensagem de erro do fallback de `confirm/route.ts` (não mostra mais texto de convite para links de recuperação malformados) e a copy de erro de `setPassword` no fluxo de redefinição. 90 testes passando. O template "Reset Password" no dashboard do Supabase ainda precisa ser configurado manualmente (mesmo padrão do convite) — não foi possível editar `.env.example` nesta sessão por restrição de permissões do ambiente.
- [ ] Implementação — próxima história: Epic 1 / Story 1.7 (logout com confirmação)

---

## Documentação de referência

```
_bmad-output/
└── planning-artifacts/
    ├── prd.md                  ✅ completo
    ├── ux-*.md                 🔄 em andamento
    ├── architecture.md         ✅ completo
    └── stories/                ⏳ pendente
```

---

## Instrução para o Claude Code

Antes de implementar qualquer coisa:
1. Leia este arquivo
2. Verifique se a stack já foi definida em `_bmad-output/planning-artifacts/architecture.md`
3. Confirme se o UX da funcionalidade está disponível em `_bmad-output/planning-artifacts/` (arquivos com prefixo `ux-`)
4. Siga os valores e NFRs acima em todas as decisões

> Atualizar a seção "Estado atual" a cada entrega relevante.
