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
- [x] Epic 1 — Autenticação: Stories 1.1 a 1.7 concluídas (setup do repo, fundação visual/acessibilidade, onboarding, convite/criação de conta, login, recuperação de senha, logout)
- [x] Epic 2 — Conversação: completo (Stories 2.1 a 2.7 concluídas — chat com streaming, adaptação de tom por estado emocional, gravação e transcrição de voz, edição de transcrição antes de enviar, fluxo de crise com resposta fixa a sinais de risco severo, limite diário de mensagens, indicador de "pensando" e recuperação de erros com retry manual); inclui dois redesigns visuais aplicados sobre a base do chat/onboarding ("Aura" e depois o modelo único com medidor de profundidade)
- [x] Epic 3 — Memória, Síntese e Histórico de Sessões: Story 3.1 concluída (Encerrar Sessão e Gerar Síntese — status "done", revisada): geração de síntese via Anthropic API separada do chat, tabela `session_syntheses`, componente `SynthesisCard`, botão manual de encerrar sessão e encerramento automático por inatividade de 60 min. Story 3.2 concluída (Reagir à Síntese com Emoji ou Comentário — status "done", revisada): dock de reação (`SynthesisReactionDock`) embutido no `SynthesisCard`, emoji ou comentário curto mutuamente exclusivos, tabela `session_synthesis_reactions` (RLS, upsert por síntese). Story 3.3 concluída (Agregação de Padrões Longitudinais — status "done", revisada): tabela `user_patterns` (agregado incremental de temas/emoções/gatilhos por usuário, mapas jsonb de contagem, RLS), síntese estendida para gerar `emotions`/`triggers`, `endSession` atualizando o agregado ao final de cada sessão (best-effort, sem duplicar contagem em chamadas concorrentes), aviso de privacidade (`PatternPrivacyNotice`) na primeira análise, exibido tanto no encerramento manual quanto no automático — **duas migrations novas (`session_synthesis_reactions`, `user_patterns`), precisam ser aplicadas manualmente no Supabase, ver nota de Story 3.1**. Story 3.4 concluída (Memória em Camadas — status "done", revisada): `lib/agent/memory.ts` ganhou `fetchRecentSyntheses`/`formatMemoryContext`/`buildMemoryContext`, que juntam as últimas 5 sínteses de sessões anteriores com o agregado `user_patterns` (via novo `getUserPatterns`) num bloco de texto compacto; `/api/chat` injeta esse bloco no prompt do agente (`buildSystemPrompt` ganhou um parâmetro `memoryContext`), best-effort e fora do fluxo de crise — sem reenviar histórico bruto de outras sessões e sem migration nova. Story 3.5 concluída (Histórico de Sessões — Lista, Busca e Ações Rápidas — status "done", revisada): nova rota `/historico` (lista cronológica com busca local por palavra-chave/tema, cartões com data/hora, título, chips de tema, badge de síntese, selo "Privado" e destaque "Última sessão") e `/historico/[sessionId]` (sessão completa + `SynthesisCard`); ações rápidas Revisar/Marcar/Excluir reveladas por swipe ou por um botão acessível "⋯"; link para o Histórico adicionado no cabeçalho autenticado da landing (nav completa fica para a Story 4.1) — **uma migration nova (`session_history_actions`, adiciona `sessions.marked` e as policies de update/delete que faltavam), precisa ser aplicada manualmente no Supabase, ver nota de Story 3.1**. Story 3.6 concluída (Abertura Adaptativa Conforme Histórico da Sessão — status "done", revisada): novo `buildSessionOpeningContext` em `lib/agent/memory.ts` decide se é a primeira sessão do usuário (consulta a `sessions`, sem migration nova) e, quando não é, recupera a frase de abertura da sessão imediatamente anterior, o padrão de resposta recente (curto/longo) e os temas mais recorrentes de `user_patterns`; `buildSystemPrompt` ganhou um 4º parâmetro `openingContext` que instrui o agente a usar a pergunta-guia padrão verbatim na primeira sessão, ou a calibrar estímulo/espaço/temas e nunca repetir a frase da sessão anterior nas subsequentes; `/api/chat` busca esse contexto sempre que o assistente ainda não respondeu na sessão (resiliente a retry), best-effort e fora do fluxo de crise.
- [x] Epic 4 — Resumos Periódicos e Indicadores de Evolução: Story 4.1 concluída (Navegação Principal entre Início, Histórico e Insights — status "done", revisada): novo componente `PrimaryNav` (barra fixa com Início/Histórico/Insights, estado ativo via `usePathname`), nova rota `/insights` (placeholder — dashboard real fica para as Stories 4.2/4.4/4.5), nav integrada às 4 telas principais (`/`, `/chat`, `/historico`, `/insights`) com espaçamento reservado (`--nav-height`, incluindo `env(safe-area-inset-bottom)`) para não cobrir conteúdo; link avulso "Histórico" do cabeçalho da Home (Story 3.5) removido por ficar redundante. A revisão de código (Blind Hunter + Edge Case Hunter + Acceptance Auditor) pegou uma violação real do AC1 antes do merge: sair de `/chat` pela nav e voltar não retomava a sessão em andamento (`ChatWindow` remontava vazio e criava uma sessão nova, órfã) — corrigido com `sessionId` ativo guardado em `sessionStorage` e retomado via nova Server Action `resumeSession` ao montar; mais 4 patches menores de CSS/consistência também corrigidos na mesma passada — sem migration nova.
- [x] Story 4.2 concluída (Dashboard de Indicadores de Evolução — status "done", revisada): novo `lib/dashboard/dashboard.ts` (`getDashboardData`, `computeStreakDays`) e componente `DashboardStats`, integrados à Home `/` — usuários autenticados veem dias consecutivos, sessões concluídas e temas explorados no lugar do hero de onboarding (que continua intacto para visitantes anônimos); sessões concluídas e temas vêm do agregado `user_patterns`, streak vem de `sessions.created_at` (dia de calendário decidido em `America/Sao_Paulo` fixo, não UTC — não há timezone por usuário salvo em lugar nenhum ainda; qualquer feature futura que agrupe algo por "dia" deve considerar o mesmo fuso, não `toISOString().slice(0,10)`). Gráfico de "tendência emocional dos últimos 7 dias" (parte do AC1 original) foi adiado por decisão do usuário: não há hoje dado de emoção com granularidade diária (nem em `user_patterns`, agregado só acumula totais; nem em `session_syntheses`, que não persiste as emoções que a síntese já calcula por sessão) — exigiria migration nova, ver nota de escopo na história. Sem migration nova nesta entrega.
- [x] Story 4.3 concluída (Marcos Pessoais — implementada, teste manual em navegador pendente do usuário após aplicar a migration): novo `lib/milestones/milestones.ts` (`getPersonalMilestones`, `normalizeThemeLabel`) e Server Actions em `lib/actions/personalMilestones.ts` (`createPersonalMilestone`/`updatePersonalMilestone`/`deletePersonalMilestone`), tabela `personal_milestones` (RLS por dono) e componentes `PersonalMilestones`/`PersonalMilestoneCard` integrados abaixo do `DashboardStats` na Home. Cada marco tem um título livre (o que o usuário quer explorar) e um `theme` curto separado, normalizado (trim + lowercase) para casar com as chaves de `user_patterns.themes` — o progresso não é uma coluna persistida, é sempre recalculado na leitura E também devolvido pelas próprias Server Actions de criar/editar (para refletir na hora contagem que o tema já tinha antes de virar marco, em vez de assumir 0 até o próximo reload). **Uma migration nova (`personal_milestones`), precisa ser aplicada manualmente no Supabase, ver nota de Story 3.1**.
- [x] Story 4.4 concluída (Gerar Resumo Semanal — implementada, teste manual em navegador com dado real pendente do usuário após aplicar a migration): novo `lib/summaries/weeklySummary.ts` (`getWeeklySummaryData`) e Server Action `lib/actions/generateSummary.ts` (`generateWeeklySummary`), componente `WeeklySummaryCard` integrado em `/insights` com um botão único "Gerar resumo da semana" (sem seletor Semana/Mês ainda — só faz sentido quando a Story 4.5 existir). O resumo é **calculado deterministicamente** a partir de `session_syntheses` (temas/emoções já abstraídos pela síntese por sessão, nunca mensagens brutas), sem nova chamada à IA — mais rápido, mais barato e mantém privacidade por construção. Isso exigiu persistir `emotions`/`triggers` por sessão em `session_syntheses` (antes só existiam efêmeros, agregados direto em `user_patterns`); sessões sintetizadas antes da migration mostrarão "Emoções dominantes" vazio para sempre, sem backfill possível. **Gotcha real encontrado no code review**: `created_at` retornado pelo Postgres/PostgREST não usa o mesmo formato de `Date.prototype.toISOString()` do JS (ex.: sufixo `+00:00` em vez de `Z`) — comparar essas strings diretamente (`>=`/`<`) classifica linhas incorretamente mesmo representando o mesmo instante; qualquer split de período em memória (como o da Story 4.5) deve comparar por `new Date(x).getTime()`, nunca por string. **Uma migration nova (`session_syntheses_emotions_triggers`), precisa ser aplicada manualmente no Supabase, ver nota de Story 3.1**.
- [x] Story 4.5 concluída (Gerar Resumo Mensal — status "done", revisada): novo `lib/summaries/monthlySummary.ts` (`getMonthlySummaryData`, janela rolante de 30 dias, mesma estratégia determinística da 4.4) e `generateMonthlySummary` em `lib/actions/generateSummary.ts`; o componente virou `SummaryCard` (renomeado de `WeeklySummaryCard`), com um seletor Semana/Mês que decide qual Server Action chamar, reaproveitando o mesmo cartão visual. **Gotcha de spec encontrado no code review**: a story-file resume o AC1 como "padrões de longo prazo, evolução e tendências", mas `epics.md` é mais explícito ("evolução em autoconhecimento e tendências de melhora/piora em áreas específicas") — a primeira implementação só copiava a lógica semanal numa janela maior, sem sinal de tendência nenhum; ao revisar uma história com AC resumido na story-file, vale conferir a redação completa em `epics.md` antes de considerar o critério atendido. Corrigido anotando cada chip de tema/emoção com a direção frente ao período anterior (alta/queda/novo/estável), linguagem neutra por ser espelho não-prescritivo. Sem migration nova (reaproveita `session_syntheses.emotions/triggers` da 4.4).
- [x] Story 4.6 concluída (Exportar Resumo em PDF — status "done", teste manual em navegador pendente do usuário): novo `lib/pdf/summaryPdf.ts` (`buildSummaryPdf`/`downloadSummaryPdf`, jsPDF) e botão "Exportar PDF" no `SummaryCard`, gerando o PDF 100% client-side a partir do "view model" já formatado na tela (mesmas strings de data/tendência exibidas, nunca recalculadas) — sem round-trip ao servidor, download dispara na hora. Biblioteca escolhida (AC3): jsPDF, na v4.2.1 — a v2.5.x tem CVE crítico (RCE/PDF injection) resolvido via dompurify/canvg só como dependência opcional na v4; confirmar sempre `npm audit` ao trocar a versão. Sem migration nova. Epic 4 completo.
- [x] Epic 5 — LGPD e Encerramento: Story 5.1 concluída (Exportar Dados em JSON — status "done", teste manual em navegador pendente do usuário): nova rota `/configuracoes` (não existia — telas de "conta/configurações" ficaram pendentes desde a Story 1.7) com o botão "Exportar meus dados", link adicionado no cabeçalho autenticado da Home. Server Action `exportUserData` (`lib/actions/exportData.ts`) monta um payload aninhado (sessões → mensagens + síntese) e o agregado `user_patterns`, retornado para o client; download é 100% client-side (`lib/export/downloadJson.ts`, Blob + `<a download>`), mesmo padrão Server Action-retorna-dados + geração-no-client da Story 4.6. **Cap de linhas em queries que buscam "todo o histórico do usuário" precisa ordenar mais-recente-primeiro antes do `.limit()`, nunca ascendente** — achado real da revisão de código: ordenar ascendente e cortar descarta os dados mais recentes, não os mais antigos, o oposto do que se espera de uma exportação "completa"; vale para qualquer future feature que pagine/capeie histórico do usuário. **Nova tabela `audit_log`** (id, user_id, action, metadata, created_at; RLS só com insert própria, sem select/update/delete — usuário não deve conseguir ler a própria trilha, requisito já previsto para a Story 5.3) criada como pré-requisito do AC3, já que a Story 5.3 (trilha de auditoria completa) ainda não existe; o insert é best-effort (não bloqueia o download se falhar). **Uma migration nova (`audit_log`), precisa ser aplicada manualmente no Supabase, ver nota de Story 3.1**. Story 5.2 concluída (Deletar Conta com Destruição Permanente — status "done", revisada; teste manual em navegador/Supabase real pendente do usuário, ver nota abaixo): botão "Excluir minha conta" em `/configuracoes` (mesmo card do `ExportDataButton`, com diálogo de confirmação acessível no padrão do `LogoutButton`). Server Action `deleteAccount` (`lib/actions/deleteAccount.ts`) grava em `audit_log` **de forma bloqueante** (ao contrário do best-effort da Story 5.1 — aqui a ordem "audita, depois destrói" é o próprio AC) e só então chama `admin.auth.admin.deleteUser`; todas as tabelas de dados do usuário já tinham `ON DELETE CASCADE` a partir de `auth.users`, então não há delete explícito tabela a tabela — a própria linha de `audit_log` da exclusão também é destruída pela cascata (decisão consciente: destruição total é consistente com AC4/LGPD, uma trilha persistente fica para a Story 5.3). **Novo `lib/supabase/admin.ts`**, primeiro client do projeto com a `service_role` key (necessário para qualquer operação futura em `auth.admin.*`) — guardado com `typeof window` para nunca rodar no browser. **Requer a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` (sem prefixo `NEXT_PUBLIC_`), que precisa ser configurada manualmente em `.env.local` (e no ambiente de produção) — não existia no projeto antes desta história**, mesma categoria de passo manual das migrations (ver nota de Story 3.1). Story 5.3 concluída (Trilha de Auditoria para Eventos Sensíveis — status "done", revisada; teste manual em navegador com dado real pendente do usuário após aplicar a migration): `login.ts` passou a gravar `audit_log` (best-effort, mesmo padrão de `exportData.ts`) — export (5.1) e exclusão (5.2) já gravavam antes desta história, então o único gap real era o login. **Achado real da revisão de código**: `audit_log.user_id` tinha `on delete cascade` a partir de `auth.users`, então excluir a conta apagava junto o próprio registro de auditoria do evento `delete_account` — exatamente o evento em que a trilha mais precisa sobreviver; a FK foi removida (linha vira um uuid solto, sem integridade referencial, decisão consciente confirmada com o usuário) e, como o nome da constraint pode divergir em bancos aplicados manualmente, a migration busca o nome real via `information_schema` em vez de hardcodar `audit_log_user_id_fkey`. **Uma migration nova (`audit_log_survives_account_deletion`), precisa ser aplicada manualmente no Supabase, ver nota de Story 3.1**. Story 5.4 concluída (Política de Privacidade e Indicadores Visíveis — status "done", revisada; teste manual em navegador pendente do usuário, ver nota abaixo): novo componente `PrivacySeal` (selo discreto + link "Como seus dados são usados") integrado a `ChatWindow`, `/historico`, `/historico/[sessionId]` e `/insights`, e nova rota pública `/privacidade` (sem checagem de auth) com a política completa. **Achado real da revisão de código (dois revisores independentes)**: a primeira versão da política negava criptografia ponta-a-ponta literal e, na frase seguinte, reusava "ponta a ponta" para descrever TLS+repouso ("criptografia de ponta a ponta na infraestrutura") — contradição corrigida para "criptografia em trânsito (TLS) e em repouso (AES-256)". A copy segue o modelo real documentado em `architecture.md` (TLS 1.3+ em trânsito + AES-256 em repouso, nunca E2EE literal); `ux-patterns.md` ainda tem a copy desatualizada "armazenadas localmente" (dados ficam no Supabase Cloud, não local) — **ao usar `ux-patterns.md` como referência de copy de privacidade, prevalece `architecture.md`/`epics.md`, que são mais recentes e tecnicamente precisos**. AC3 (telas de exclusão) já estava satisfeito pelas Stories 3.5/5.2, sem alteração. Sem migration nova. Epic 5 completo.

> Detalhes de implementação de cada história (arquivos alterados, decisões tomadas, achados de code review) ficam no histórico do git, não aqui.

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
