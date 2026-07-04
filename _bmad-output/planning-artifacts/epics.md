---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: [
  "_bmad-output/planning-artifacts/prd.md",
  "_bmad-output/planning-artifacts/architecture.md",
  "_bmad-output/planning-artifacts/ux-design-specification.md",
  "_bmad-output/planning-artifacts/ux-patterns.md",
  "_bmad-output/planning-artifacts/moodboard.md",
  "_bmad-output/planning-artifacts/design-system/variables.css",
  "_bmad-output/planning-artifacts/design-system/components/mic-button.html",
  "_bmad-output/planning-artifacts/design-system/components/synthesis-card.html",
  "_bmad-output/planning-artifacts/design-system/components/transcript-block.html",
  "_bmad-output/planning-artifacts/wireframes/onboarding.html",
  "_bmad-output/planning-artifacts/wireframes/recording.html",
  "_bmad-output/planning-artifacts/wireframes/synthesis.html",
  "_bmad-output/planning-artifacts/wireframes/insights.html"
]
---

# Aplicativo de Diário Digital para Bem-Estar Mental - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Aplicativo de Diário Digital
para Bem-Estar Mental, decomposing the requirements from the PRD, UX Design, design system,
wireframes, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Sistema de Autenticação e Gestão de Conta — criação de conta via email único + senha (com
confirmação por link de email), login, recuperação de senha via email, sessão persistente (24+
horas sem re-login), logout explícito com confirmação, deletar conta com confirmação (dados
criptografados destruídos permanentemente)

FR2: Interface de Conversação — campo de entrada de texto livre (min 10, max 5000 caracteres),
histórico de conversas em timeline vertical, mensagens do usuário e do agente visíveis em bolhas,
indicador visual de "agente está pensando/respondendo", timestamp em cada mensagem, rolagem de
histórico com lazy-load (se volume > 500 mensagens), botão para iniciar nova conversa

FR3: Agente IA com Adaptação Dinâmica — análise automática de estado emocional a partir de padrões
no texto (melancolia, confiança, confusão, raiva, etc.), integração de 4 perspectivas filosóficas
(Estoica, Jungiana, Freudiana, Budista) em um agente coeso, ajuste dinâmico de tom conforme estado
emocional detectado, tom de voz consistente (educado, respeitoso, nem pomposo nem coloquial),
comprimento de resposta adaptativo, perguntas-guia que abrem exploração

FR4: Acesso a Histórico para Detecção de Padrões — armazenamento seguro de 100% do histórico
(nunca deletado a menos que solicitado), recuperação rápida (<1s), índice/busca por tema ou data,
capacidade do agente de referenciar conversas anteriores, detecção automática de padrões (temas
recorrentes, emoções, gatilhos), avisos de privacidade antes de usar histórico para análise

FR5: Síntese de Insights ao Final de Sessão — síntese automática ao clicar "Encerrar sessão" ou
após 60+ min de inatividade, contendo (1) o que foi explorado, (2) padrões identificados, (3)
pergunta aberta para reflexão futura, usuário pode reagir com emoji ou comentário curto

FR6: Resumos Periódicos (Sob Demanda) — botão "Gerar Resumo", resumo de semana (top 5 tópicos,
emoções dominantes, progresso), resumo de mês (padrões de longo prazo, evolução, tendências),
resumos como texto + visualizações simples, exportação em PDF ou leitura in-app

FR7: Indicadores Básicos de Evolução — dashboard com dias consecutivos de uso, total de sessões
completadas, temas explorados (lista simples), tendência emocional gráfica (últimos 7 dias),
marcos pessoais definidos pelo usuário com progresso trackado, tudo sem gamification (sem badges,
estrelas, competição)

FR8: Segurança de Dados e Conformidade — criptografia em repouso (AES-256) e em trânsito
(TLS 1.3+), dados apenas no servidor (sem armazenamento local sensível), conformidade LGPD,
política de privacidade clara, exportação de dados em JSON a qualquer momento, deleção de conta
= destruição permanente e irreversível, audit trails para acesso a dados, sem venda de dados ou
rastreamento de terceiros

### NonFunctional Requirements

NFR1: Performance — carregamento da home < 2s em 4G, resposta do agente < 5s, busca de histórico
< 1s, geração de resumo < 10s, API response time (p95) < 200ms

NFR2: Disponibilidade e Confiabilidade — uptime ≥ 99.5%, taxa de crash ≤ 0.1% em produção, zero
perda de dados durante crashes, backup automático (revisado na Arquitetura: diário, não horário,
dado o tier gratuito do Supabase — trade-off aceito conscientemente para o MVP)

NFR3: Escalabilidade — arquitetura preparada para ≥ 10.000 usuários concorrentes (via autoscaling
nativo Vercel/Supabase), histórico de conversas cresce sem degradação

NFR4: Segurança — HTTPS obrigatório (TLS 1.3+), criptografia AES-256 em repouso, hashing bcrypt
para senhas, CORS policy estrita, rate limiting para login (máx 5 tentativas/5 min), prevenção
SQL injection (prepared statements) e XSS (sanitização de inputs), auditoria de segurança
independente a cada trimestre

NFR5: Compatibilidade — Web: Chrome ≥100, Firefox ≥97, Safari ≥15, Edge ≥100; Android: ≥10 (SDK
29), telas 4.5"–6.7", portrait e landscape

NFR6: Acessibilidade — WCAG 2.1 AA compliance, suporte a leitores de tela (ARIA labels), contraste
mínimo 4.5:1, tamanho de fonte ajustável (min 14px, max 24px), navegação por teclado completa,
suporte a dark mode

NFR7: Usabilidade — onboarding < 5 minutos (tutorial guiado), primeira conversa produz insight real
(não pode parecer vazio), help in-app acessível, idioma português claro

NFR8: Manutenibilidade — cobertura de testes ≥ 80%, documentação de arquitetura completa, CI/CD
pipeline automático (tests + deploy), logs estruturados para debugging, rollback automático em
caso de deploy com erros

### Additional Requirements

- **Starter template (impacta Epic 1 / Story 1):** `create-next-app@latest apps/web --typescript
  --app --no-tailwind --eslint --src-dir --import-alias "@/*"` (Next.js 16.x, App Router), sem
  herdar Tailwind/shadcn do exemplo oficial `with-supabase` — apenas o padrão `@supabase/ssr` é
  reutilizado como referência de auth SSR
- Limpeza do scaffold parcial já existente: remover `apps/mobile/`, `packages/ui/`,
  `packages/types/`; ajustar `tsconfig.json` (remover `packages/**` do `include`)
- Portar `scripts/agent-test.ts` (detecção de estado emocional + prompt das 4 perspectivas
  filosóficas) para `apps/web/src/lib/agent/` como base real da FR3
- Schema Postgres via Supabase: tabelas `sessions`, `messages`, `session_syntheses`,
  `user_patterns`, `audit_log` (migrations versionadas em `supabase/migrations/`)
- Estratégia de memória em camadas para o agente: mensagens da sessão atual + sínteses das últimas
  N sessões + agregado `user_patterns` pré-computado — sem RAG/banco vetorial no MVP
- Autenticação por convite via `supabase.auth.admin.inviteUserByEmail()` (admin-driven, sem
  formulário público de signup)
- Rate limiting de login nativo do Supabase Auth (NFR4)
- Rate limiting de custo: limite de mensagens/dia por usuário no endpoint de chat, para conter
  custo da API Anthropic
- Endpoint de chat: Route Handler `/api/chat`, runtime Node.js, streaming via `ReadableStream`
  (elimina risco de timeout de 30s do Edge Runtime)
- Mutações simples (encerrar sessão, gerar resumo, deletar conta, exportar dados): Server Actions
- Modelo de criptografia realista: em repouso (AES-256) + TLS em trânsito — não é E2EE literal
  (incompatível com um agente de IA que processa o texto em claro); a política de privacidade deve
  comunicar isso com precisão
- Connection pooling via Supavisor (porta 6543) para evitar esgotamento de conexões Postgres em
  ambiente serverless
- Transcrição de áudio via Web Speech API (client-side, sem custo) no MVP — limitação de suporte
  em Safari/Firefox aceita conscientemente; Whisper API é caminho de evolução
- PWA: `manifest.json` + service worker mínimo escrito à mão (instalável no Android, sem cache
  offline completo)
- CI: GitHub Actions rodando `typecheck` + Vitest + gate de cobertura (falhar se < 80%, NFR8)
- Deploy: Vercel (deploy automático em push para `main`, rollback nativo) + Supabase Cloud
- Formato de erro padronizado `{ error: { code, message } }`; nunca retry automático silencioso em
  envio de mensagem de chat ou falha de transcrição (evita duplicar custo de chamada à Anthropic)
- Trilha de auditoria: tabela `audit_log` para eventos sensíveis (login, export, delete)

### UX Design Requirements

UX-DR1: Onboarding em tela única com 3 pontos (Propósito / Privacidade / Não-é-terapia), CTA
"Começar sessão", link secundário "Como usamos seus dados", duração <2 minutos, aviso de crise
("Se estiver em risco imediato, ligue para os serviços de emergência locais") sempre visível

UX-DR2: Disclaimer breve de reforço antes de cada sessão (<10 segundos, linguagem natural
integrada à conversa, não aviso legal destacado)

UX-DR3: Fluxo de crise — se o usuário menciona pensamentos suicidas, abandono de medicação ou
crise severa, o agente oferece número de crise/recursos profissionais e deixa claro os limites do
app ("Você está em crise. Fale com profissional agora. Aqui é espaço para depois")

UX-DR4: Interface de chat single-column (max-width ~720–760px), bolhas de mensagem (usuário à
direita/destacado, agente à esquerda/neutro), espaçamento generoso (20–24px de ritmo vertical),
indicador de "pensando" com animação orgânica + copy reconfortante ("Estou pensando sobre o que
você trouxe...")

UX-DR5: Componente `MicButton` — FAB circular (56–72px), cor `--color-accent-1`, overlay de
waveform animado durante gravação, estado "Gravando..." com copy "Fale com calma. Estamos
captando suas palavras.", ação de cancelar/regravar acessível

UX-DR6: Componente `TranscriptBlock` — texto editável inline (`contenteditable` ou equivalente),
hint "Toque qualquer palavra para corrigir", CTA "Salvar transcrição"

UX-DR7: Alternância sem fricção entre entrada de texto e áudio na composição de mensagem — escolha
imediata (ícone de mic ou campo de texto), troca livre a qualquer momento

UX-DR8: Componente `SynthesisCard` — cabeçalho ("Resumo da sessão"/"Insight rápido"), chips
temáticos, lista de 2–3 pontos de insight, ação primária "Salvar insight", ação secundária
"Explorar mais", nota de contexto ("Este resumo reflete os temas que você trouxe hoje")

UX-DR9: Tela de Insights — cartão de síntese semanal com contagem (sessões/temas/padrões) e chips,
lista de cards de insight individuais (observação + explicação), timeline cronológica de sessões
recentes, nota de privacidade no rodapé

UX-DR10: Padrão de Histórico de Sessões — lista cronológica com cartões (data/hora, título gerado,
2–3 chips de tema, badge "síntese disponível", selo "Privado"), destaque "Última sessão" no item
mais recente, ações rápidas via swipe (Revisar/Marcar/Excluir), busca por palavra-chave ou tema

UX-DR11: Indicadores de estado do sistema — Gravando (badge fixo + animação de onda/pulso),
Transcrevendo (barra de progresso + troca para "Transcrição pronta — revise se quiser"), Sessão
concluída (cartão final + copy de transição), Erro/alerta (mensagem breve e gentil, nunca termos
técnicos, CTA de recuperação "Regravar"/"Continuar com texto")

UX-DR12: Navegação simples — barra inferior ou drawer com 2–3 ícones (Início/Histórico/Insights),
sem menu complexo; usuário pode navegar para histórico sem perder o estado da sessão em andamento

UX-DR13: Indicadores de privacidade visíveis — selo discreto ("Transcrições armazenadas...") no
chat, histórico e cards de síntese; link "Como seus dados são usados" acessível a partir dessas
telas; copy clara em telas de exclusão ("Excluir esta sessão e suas transcrições para sempre")

UX-DR14: Design tokens (já definidos em `design-system/variables.css`) — paleta dark tecnológica
(`--color-bg` #0C1118, `--color-surface` #151B25, `--color-accent-1` #4FD1CA, `--color-accent-2`
#6B95D6, `--color-cta` #7C63FF, `--color-error` #F1634D, `--color-success` #5EC3A5), tipografia
Inter (headings 600, body 400, base 16px, line-height 1.6) + Roboto Mono para timestamps/microcopy,
escala de espaçamento (`--space-xx` 8px a `--space-lg` 32px) — consolidar como tokens reais no
código (CSS custom properties), não reimplementar

UX-DR15: Acessibilidade aplicada aos componentes visuais — contraste ≥4.5:1 (usar tom escurecido
de accent-1 se necessário em texto pequeno, conforme nota do moodboard), ARIA labels em todos os
componentes interativos (mic button, transcript block, região de síntese `role="region"`),
navegação completa por teclado

UX-DR16: Componente `Chip` reutilizável (compacto, arredondado, legível) para temas/emoções,
usado consistentemente em síntese, insights e histórico

UX-DR17: Adaptação da abertura de sessão conforme o padrão de resposta do usuário (tímido vs.
desinibido) e conforme o número da sessão (primeira sessão ≠ sessões subsequentes) — sem template
único de abertura

### FR Coverage Map

FR1: Epic 1 — Autenticação, sessão e onboarding (deleção de conta no Epic 5)
FR2: Epic 2 — Interface de conversação
FR3: Epic 2 — Agente IA com adaptação dinâmica
FR4: Epic 3 — Acesso a histórico e detecção de padrões
FR5: Epic 3 — Síntese de insights ao final de sessão
FR6: Epic 4 — Resumos periódicos sob demanda
FR7: Epic 4 — Indicadores básicos de evolução
FR8: Epic 5 — Segurança de dados e conformidade LGPD

## Epic List

### Epic 1: Acesso Seguro ao Diário
Usuário convidado consegue entender o propósito do app, criar conta, fazer login e manter uma
sessão persistente — a base de tudo. Inclui a inicialização técnica do projeto (starter, limpeza
do scaffold, portabilidade do protótipo do agente) como primeira história.
**FRs covered:** FR1 (exceto deleção de conta, que fica no Epic 5 para evitar dividir a tela de
configurações em dois épicos)

### Epic 2: Conversa Reflexiva com o Agente Adaptativo
Usuário consegue ter uma conversa completa — por texto ou voz — com o agente, que detecta seu
estado emocional e adapta tom e perspectiva filosófica em tempo real. Inclui o fluxo de crise.
**FRs covered:** FR2, FR3

### Epic 3: Memória, Síntese e Histórico de Sessões
Ao encerrar uma sessão, o usuário recebe uma síntese significativa e pode revisitar sessões
passadas; o agente passa a lembrar e referenciar conversas anteriores, adaptando a abertura
conforme o histórico.
**FRs covered:** FR4, FR5

### Epic 4: Resumos Periódicos e Indicadores de Evolução
Usuário consegue solicitar resumos semanais/mensais e visualizar um dashboard simples de
progresso (dias consecutivos, temas, tendência emocional), sem gamification.
**FRs covered:** FR6, FR7

### Epic 5: Privacidade, Controle de Dados e Conformidade LGPD
Usuário pode exportar seus próprios dados, entender exatamente como são protegidos, e deletar sua
conta com destruição permanente garantida.
**FRs covered:** FR8 + deleção de conta (parte do FR1)

## Epic 1: Acesso Seguro ao Diário

Usuário convidado consegue entender o propósito do app, criar conta, fazer login e manter uma
sessão persistente — a base de tudo.

### Story 1.1: Inicialização do Projeto e Fundação Técnica

As a desenvolvedor solo,
I want o projeto inicializado com Next.js 16, App Router e TypeScript, seguindo a estrutura
definida na arquitetura, com o scaffold antigo removido e o protótipo do agente portado,
So that eu tenha uma base de código consistente para construir todas as funcionalidades seguintes.

**Acceptance Criteria:**

**Given** o repositório com o scaffold parcial existente (`package.json` raiz, `apps/mobile`,
`packages/ui`, `packages/types` vazios, `scripts/agent-test.ts`)
**When** o comando `create-next-app@latest apps/web --typescript --app --no-tailwind --eslint
--src-dir --import-alias "@/*"` é executado com Next.js 16.x
**Then** o app roda localmente via `npm run dev` sem erros
**And** `apps/mobile`, `packages/ui` e `packages/types` são removidos, e `tsconfig.json` não
referencia mais `packages/**`
**And** a lógica de `scripts/agent-test.ts` (detecção de estado emocional + prompts das 4
perspectivas filosóficas) está portada para `apps/web/src/lib/agent/`, com testes Vitest cobrindo
`detectEmotionalState`
**And** `npm run typecheck` passa sem erros

### Story 1.2: Fundação Visual e Acessibilidade

As a usuário,
I want que a interface use os tokens visuais do design system (cores, tipografia, espaçamento) em
modo escuro,
So that eu tenha uma experiência visual acolhedora e consistente desde a primeira tela.

**Acceptance Criteria:**

**Given** `design-system/variables.css` já definido na fase de UX
**When** o layout raiz do app (`apps/web/src/app/layout.tsx`) é implementado
**Then** as CSS custom properties de cores, tipografia e espaçamento são carregadas globalmente via
`apps/web/src/styles/variables.css`
**And** o app usa dark mode como padrão (fundo `#0C1118`, texto `#E7F1FF`)
**And** o contraste de texto/fundo atende no mínimo 4.5:1 (WCAG 2.1 AA — NFR6)
**And** a fonte base é ajustável entre 14px e 24px sem quebra de layout

### Story 1.3: Onboarding e Aviso de Não-Terapia

As a usuário convidado que abre o app pela primeira vez,
I want ver uma tela única explicando o propósito do app, a privacidade dos meus dados, e que isso
não é terapia,
So that eu entenda o que esperar antes de começar a usar.

**Acceptance Criteria:**

**Given** um usuário sem sessão ativa que abre o app pela primeira vez
**When** a tela de onboarding é exibida
**Then** ela mostra 3 pontos em uma única tela: Propósito, Privacidade, Começar (UX-DR1)
**And** exibe o aviso "Se estiver em risco imediato, ligue para os serviços de emergência locais"
de forma visível
**And** exibe um link "Como usamos seus dados" com explicação clara e não-legal
**And** o botão "Começar sessão" leva à tela de login/criação de conta
**And** a tela é lida em menos de 2 minutos (NFR7)

### Story 1.4: Aceitar Convite e Criar Conta

As a usuário convidado pelo administrador do beta,
I want receber um convite por email e definir minha senha para ativar minha conta,
So that eu consiga acessar o app com segurança sem um formulário público de cadastro.

**Acceptance Criteria:**

**Given** o administrador enviou um convite via `supabase.auth.admin.inviteUserByEmail()`
**When** o usuário convidado clica no link do email e define uma senha
**Then** a conta é criada e vinculada ao email convidado, sem exigir formulário público de signup
**And** não existe rota pública de criação de conta sem convite prévio
**And** a senha é armazenada com bcrypt pelo Supabase Auth (NFR4)
**And** o usuário é redirecionado para o onboarding ou chat após ativar a conta

### Story 1.5: Login com Sessão Persistente

As a usuário com conta ativa,
I want fazer login com email e senha e permanecer conectado por mais de 24 horas,
So that eu não precise reautenticar a cada visita ao app.

**Acceptance Criteria:**

**Given** um usuário com conta ativada
**When** ele insere email e senha corretos na tela de login
**Then** a sessão é criada via `@supabase/ssr` (cookie de sessão) e persiste por mais de 24 horas
**And** o `middleware.ts` renova o cookie de sessão automaticamente em cada requisição
**And** após 5 tentativas de login incorretas em 5 minutos, o rate limiting nativo do Supabase Auth
bloqueia novas tentativas (NFR4)
**And** mensagens de erro de login são gentis, sem expor se o email existe ou não

### Story 1.6: Recuperação de Senha

As a usuário que esqueceu sua senha,
I want solicitar uma redefinição de senha por email,
So that eu recupere o acesso à minha conta sem depender do administrador.

**Acceptance Criteria:**

**Given** um usuário com conta ativa que esqueceu a senha
**When** ele solicita "Esqueci minha senha" informando o email
**Then** um link de redefinição é enviado por email via Supabase Auth
**And** ao clicar no link, o usuário consegue definir uma nova senha
**And** a nova senha substitui a anterior imediatamente

### Story 1.7: Logout com Confirmação

As a usuário autenticado,
I want encerrar minha sessão explicitamente com uma confirmação,
So that eu tenha controle claro sobre quando saio da minha conta.

**Acceptance Criteria:**

**Given** um usuário autenticado navegando no app
**When** ele seleciona "Sair" no menu/configurações
**Then** uma confirmação é exibida antes de encerrar a sessão
**And** ao confirmar, o cookie de sessão é invalidado e o usuário é redirecionado para a tela de
login/onboarding
**And** ao cancelar, o usuário permanece na tela atual sem alteração de estado

## Epic 2: Conversa Reflexiva com o Agente Adaptativo

Usuário consegue ter uma conversa completa — por texto ou voz — com o agente, que detecta seu
estado emocional e adapta tom e perspectiva filosófica em tempo real.

### Story 2.1: Enviar Mensagem de Texto e Receber Resposta em Streaming

As a usuário autenticado,
I want enviar uma mensagem de texto para o agente e ver a resposta chegando em tempo real,
So that eu possa conversar de forma fluida sem esperar a resposta completa carregar.

**Acceptance Criteria:**

**Given** um usuário autenticado sem sessão de conversa ativa
**When** ele digita uma mensagem (10 a 5000 caracteres) e envia
**Then** uma nova sessão é criada na tabela `sessions`, e a mensagem é salva em `messages`
associada a ela
**And** a mensagem é enviada para o Route Handler `/api/chat` (runtime Node.js), que faz streaming
da resposta da Anthropic API via `ReadableStream`
**And** a resposta do agente aparece incrementalmente na tela conforme é gerada
**And** ao final do streaming, a resposta completa do agente também é salva em `messages`
**And** cada mensagem exibe um timestamp
**And** mensagens fora do intervalo de 10–5000 caracteres são rejeitadas com validação clara

### Story 2.2: Adaptação de Tom Conforme Estado Emocional Detectado

As a usuário conversando com o agente,
I want que o agente ajuste seu tom conforme meu estado emocional aparente,
So that eu me sinta genuinamente compreendido, não respondido de forma genérica.

**Acceptance Criteria:**

**Given** uma mensagem do usuário contendo sinais de melancolia, confiança excessiva, confusão ou
neutralidade
**When** o Route Handler processa a mensagem
**Then** `detectEmotionalState` (portado na Story 1.1) classifica o estado e seleciona o
`TONE_MAP` correspondente
**And** a resposta reflete o tom apropriado (reconfortante/reflexivo-provocador/estruturante/
equilibrado)
**And** o agente integra as 4 perspectivas filosóficas de forma orgânica, nunca citando-as
explicitamente por nome
**And** o comprimento da resposta se adapta (mais curta em sinais de crise/melancolia intensa,
mais longa em engajamento reflexivo)

### Story 2.3: Gravar e Transcrever Mensagem por Voz

As a usuário que prefere falar a digitar,
I want gravar uma mensagem de voz e vê-la transcrita automaticamente,
So that eu consiga conversar mesmo cansado ou sem vontade de digitar.

**Acceptance Criteria:**

**Given** a tela de conversa com o componente `MicButton` visível
**When** o usuário toca o botão de microfone
**Then** a gravação inicia, exibindo o badge "Gravando..." com animação de waveform e o texto
"Fale com calma. Estamos captando suas palavras."
**And** ao parar a gravação, a Web Speech API transcreve o áudio para texto no navegador
**And** o usuário pode alternar entre digitar e gravar a qualquer momento antes de enviar, sem
perder o que já foi feito
**And** nenhum arquivo de áudio é armazenado no servidor — apenas o texto transcrito é enviado

### Story 2.4: Editar Transcrição Antes de Enviar

As a usuário que acabou de gravar uma mensagem de voz,
I want revisar e corrigir a transcrição antes de enviá-la ao agente,
So that erros de reconhecimento de voz não distorçam o que eu quis dizer.

**Acceptance Criteria:**

**Given** uma transcrição de áudio gerada pela Web Speech API
**When** ela é exibida no componente `TranscriptBlock`
**Then** o texto é editável inline, com a dica "Toque qualquer palavra para corrigir"
**And** o usuário pode salvar a correção antes de enviar ("Salvar transcrição")
**And** apenas o texto final (editado ou não) é enviado ao endpoint de chat

### Story 2.5: Fluxo de Crise — Resposta a Sinais de Risco Severo

As a usuário que menciona uma crise severa (pensamentos suicidas, abandono de medicação),
I want que o agente reconheça a gravidade e me direcione a ajuda profissional,
So that eu não fique apenas em uma reflexão estruturada quando preciso de ajuda imediata.

**Acceptance Criteria:**

**Given** uma mensagem do usuário contendo sinais explícitos de crise severa
**When** o agente processa a mensagem
**Then** a resposta prioriza reconhecimento e direcionamento a recursos de crise/profissionais,
em vez do fluxo normal de perguntas reflexivas
**And** a resposta comunica claramente os limites do app ("Aqui é espaço para depois; agora,
busque ajuda")
**And** essa resposta nunca é bloqueada pelo limite diário de mensagens (Story 2.6) — sempre é
entregue

### Story 2.6: Limite Diário de Mensagens

As a desenvolvedor solo mantendo o custo da API sob controle,
I want limitar o número de mensagens que cada usuário pode enviar por dia,
So that o custo da API Anthropic não fique descontrolado sem orçamento definido.

**Acceptance Criteria:**

**Given** um usuário que já enviou N mensagens no dia corrente (limite configurável)
**When** ele tenta enviar mais uma mensagem além do limite
**Then** o envio é bloqueado com uma mensagem gentil explicando o limite e quando será renovado
**And** mensagens de fluxo de crise (Story 2.5) não são bloqueadas por esse limite
**And** o contador de mensagens reseta automaticamente a cada novo dia

### Story 2.7: Indicador de Resposta em Andamento e Recuperação de Erros

As a usuário aguardando ou enfrentando uma falha no envio,
I want ver um indicador claro de que o agente está pensando, e uma forma simples de tentar de novo
se algo falhar,
So that eu nunca fique sem saber o que está acontecendo ou perca minha mensagem.

**Acceptance Criteria:**

**Given** uma mensagem enviada e aguardando resposta do agente
**When** a requisição está em andamento
**Then** um indicador visual orgânico é exibido com a copy "Estou pensando sobre o que você
trouxe..."
**And** se o envio falhar, uma mensagem breve e gentil é exibida com um botão explícito de
"Tentar novamente"
**And** nunca há retry automático silencioso
**And** a mensagem original do usuário não é perdida em caso de falha

## Epic 3: Memória, Síntese e Histórico de Sessões

Ao encerrar uma sessão, o usuário recebe uma síntese significativa e pode revisitar sessões
passadas; o agente passa a lembrar e referenciar conversas anteriores, adaptando a abertura
conforme o histórico.

### Story 3.1: Encerrar Sessão e Gerar Síntese

As a usuário concluindo uma conversa,
I want receber uma síntese do que foi conversado ao encerrar a sessão (ou após 60 min de
inatividade),
So that eu saia com clareza sobre o que foi explorado, não apenas com uma conversa que "só acabou".

**Acceptance Criteria:**

**Given** uma sessão de conversa ativa com pelo menos uma troca de mensagens
**When** o usuário clica em "Encerrar sessão" OU 60 minutos se passam sem atividade
**Then** uma síntese é gerada via Server Action (`endSession.ts`), com uma chamada à Anthropic API
separada do fluxo de chat
**And** a síntese contém: (1) o que foi explorado, (2) padrões identificados na sessão, (3) uma
pergunta aberta para reflexão futura
**And** a síntese é salva na tabela `session_syntheses`, vinculada à sessão
**And** a síntese é exibida no componente `SynthesisCard` (chips temáticos + 2-3 bullets + ações
"Salvar insight"/"Explorar mais")
**And** o encerramento por inatividade acontece automaticamente em background, sem exigir ação do
usuário

### Story 3.2: Reagir à Síntese com Emoji ou Comentário

As a usuário que acabou de ler a síntese da sessão,
I want reagir com um emoji ou um comentário curto,
So that eu registre minha reação imediata sem esforço.

**Acceptance Criteria:**

**Given** uma síntese de sessão exibida no `SynthesisCard`
**When** o usuário seleciona um emoji de reação ou escreve um comentário curto
**Then** a reação é salva vinculada à síntese correspondente
**And** a interação é opcional — o usuário pode sair da tela sem reagir, sem bloqueio

### Story 3.3: Agregação de Padrões Longitudinais

As a desenvolvedor construindo a base para insights de longo prazo,
I want que temas, emoções e gatilhos recorrentes sejam agregados automaticamente após cada sessão,
So that o dashboard e os resumos periódicos leiam um agregado pronto, sem recalcular do zero.

**Acceptance Criteria:**

**Given** uma síntese de sessão recém-gerada (Story 3.1)
**When** o processo de encerramento de sessão é concluído
**Then** a tabela `user_patterns` é atualizada (não recriada) com os temas/emoções/gatilhos
identificados nessa sessão
**And** o agregado é incremental — reflete o acumulado histórico do usuário, não apenas a última
sessão
**And** um aviso de privacidade é exibido ao usuário na primeira vez que o histórico é usado para
essa análise (FR4)

### Story 3.4: Memória em Camadas — Agente Referencia Conversas Anteriores

As a usuário retornando para uma nova conversa,
I want que o agente lembre e referencie o que conversamos antes,
So that eu sinta continuidade real, não que cada sessão começa do zero.

**Acceptance Criteria:**

**Given** um usuário com pelo menos uma sessão anterior concluída (com síntese e `user_patterns`)
**When** ele inicia uma nova sessão de chat
**Then** o prompt enviado à Anthropic API inclui as sínteses das últimas N sessões (texto curto) e
o agregado `user_patterns`, além das mensagens da sessão atual
**And** o agente consegue referenciar explicitamente conversas anteriores (ex: "Há 3 semanas você
mencionava...")
**And** o histórico bruto de mensagens de sessões passadas NÃO é reenviado por completo no prompt
— apenas as sínteses resumidas, validando a estratégia de memória em camadas da arquitetura

### Story 3.5: Histórico de Sessões — Lista, Busca e Ações Rápidas

As a usuário querendo revisitar conversas passadas,
I want ver uma lista cronológica das minhas sessões com busca por tema ou data,
So that eu encontre rapidamente uma conversa específica sem rolar tudo manualmente.

**Acceptance Criteria:**

**Given** um usuário com uma ou mais sessões concluídas
**When** ele acessa a tela de Histórico
**Then** vê uma lista cronológica com cartões (data/hora, título gerado, 2-3 chips de tema, badge
"síntese disponível", selo "Privado"), com destaque "Última sessão" no item mais recente
**And** pode buscar sessões por palavra-chave ou tema, com resultado em menos de 1 segundo (NFR1)
**And** pode deslizar um cartão para ver ações rápidas: "Revisar", "Marcar" ou "Excluir" (com
confirmação)
**And** tocar em um cartão abre a sessão completa com sua síntese

### Story 3.6: Abertura Adaptativa Conforme Histórico da Sessão

As a usuário iniciando uma nova conversa,
I want que a abertura do agente varie conforme meu padrão de resposta e o número de sessões que já
tive,
So that a conversa não pareça um template genérico repetido todo dia.

**Acceptance Criteria:**

**Given** um usuário iniciando uma nova sessão
**When** for a primeira sessão do usuário
**Then** a abertura usa a pergunta-guia estruturada padrão ("Como você se sente hoje?")
**And** quando não for a primeira sessão, a abertura considera o `user_patterns` e o padrão de
resposta recente (respostas curtas → mais estímulo; respostas longas → mais espaço)
**And** a abertura nunca repete literalmente a mesma frase usada na sessão imediatamente anterior

## Epic 4: Resumos Periódicos e Indicadores de Evolução

Usuário consegue solicitar resumos semanais/mensais e visualizar um dashboard simples de
progresso, sem gamification.

### Story 4.1: Navegação Principal entre Início, Histórico e Insights

As a usuário navegando pelo app,
I want uma navegação simples entre as telas principais,
So that eu encontre facilmente onde revisar meu progresso sem me perder em menus complexos.

**Acceptance Criteria:**

**Given** um usuário autenticado em qualquer tela principal
**When** ele interage com a barra de navegação (2-3 ícones: Início, Histórico, Insights)
**Then** ele acessa cada tela sem perder o estado de uma sessão de conversa em andamento
**And** a navegação permanece visível e consistente em todas as telas principais

### Story 4.2: Dashboard de Indicadores de Evolução

As a usuário acompanhando meu progresso,
I want ver um resumo simples de dias consecutivos, sessões, temas e tendência emocional,
So that eu perceba minha evolução sem métricas de gamification.

**Acceptance Criteria:**

**Given** um usuário com pelo menos uma sessão concluída e `user_patterns` populado
**When** ele acessa a tela Início (dashboard)
**Then** vê: dias consecutivos de uso, total de sessões completadas, lista simples de temas
explorados, e um gráfico de tendência emocional dos últimos 7 dias
**And** os dados vêm do agregado `user_patterns` pré-computado, sem recalcular a partir de
`messages` bruto (NFR1: home <2s)
**And** nenhum elemento de gamification é exibido (sem badges, estrelas, pontuação, comparação)

### Story 4.3: Marcos Pessoais

As a usuário com um objetivo de autoconhecimento específico,
I want definir um marco pessoal e acompanhar meu progresso nele,
So that eu tenha um foco de exploração ao longo do tempo.

**Acceptance Criteria:**

**Given** um usuário no dashboard
**When** ele cria um marco pessoal (ex: "Quero entender meu relacionamento com dinheiro")
**Then** o marco é salvo e exibido no dashboard
**And** o progresso é trackado com base em quantas vezes o tema do marco aparece em
`user_patterns`
**And** o usuário pode editar ou remover um marco pessoal a qualquer momento

### Story 4.4: Gerar Resumo Semanal

As a usuário querendo entender minha semana,
I want gerar um resumo semanal sob demanda,
So that eu veja os principais temas e emoções da semana de forma consolidada.

**Acceptance Criteria:**

**Given** um usuário com sessões na última semana
**When** ele clica em "Gerar Resumo" e seleciona "Semana"
**Then** a Server Action `generateSummary.ts` produz um resumo com os top 5 tópicos, emoções
dominantes e progresso, em menos de 10 segundos (NFR1)
**And** o resumo é apresentado como texto + visualização simples (chips + linha do tempo), sem
gráficos complexos, na tela de Insights
**And** o resumo respeita privacidade — não expõe trechos sensíveis literais das conversas

### Story 4.5: Gerar Resumo Mensal

As a usuário querendo entender meu último mês,
I want gerar um resumo mensal sob demanda,
So that eu veja padrões e tendências de longo prazo que uma semana não revela.

**Acceptance Criteria:**

**Given** um usuário com sessões no último mês
**When** ele clica em "Gerar Resumo" e seleciona "Mês"
**Then** a Server Action `generateSummary.ts` produz um resumo com padrões de longo prazo,
evolução em autoconhecimento, e tendências (melhora/piora em áreas específicas)
**And** o resumo usa o mesmo padrão visual do resumo semanal (Story 4.4), reaproveitando o
componente

### Story 4.6: Exportar Resumo em PDF

As a usuário que quer guardar ou compartilhar um resumo,
I want exportar um resumo semanal ou mensal em PDF,
So that eu tenha um registro fora do app.

**Acceptance Criteria:**

**Given** um resumo semanal ou mensal já gerado
**When** o usuário seleciona "Exportar PDF"
**Then** um arquivo PDF é gerado com o conteúdo do resumo, formatado de forma legível
**And** o download inicia imediatamente sem etapas extras
**And** a biblioteca de geração de PDF é escolhida na implementação desta história (decisão
técnica deferida na arquitetura como detalhe de leaf, não bloqueante)

## Epic 5: Privacidade, Controle de Dados e Conformidade LGPD

Usuário pode exportar seus próprios dados, entender exatamente como são protegidos, e deletar sua
conta com destruição permanente garantida.

### Story 5.1: Exportar Dados em JSON

As a usuário que quer ter uma cópia dos meus dados,
I want exportar todos os meus dados em formato JSON a qualquer momento,
So that eu tenha controle total sobre minhas informações, conforme a LGPD.

**Acceptance Criteria:**

**Given** um usuário autenticado nas configurações da conta
**When** ele seleciona "Exportar meus dados"
**Then** a Server Action `exportData.ts` gera um arquivo JSON contendo todas as sessões,
mensagens, sínteses e agregados de padrões do usuário
**And** o download do arquivo é disponibilizado imediatamente
**And** a ação é registrada na tabela `audit_log`

### Story 5.2: Deletar Conta com Destruição Permanente

As a usuário que decide não usar mais o app,
I want deletar minha conta com a garantia de que meus dados são destruídos permanentemente,
So that eu tenha confiança total de que nada da minha vida íntima permanece armazenado.

**Acceptance Criteria:**

**Given** um usuário autenticado nas configurações da conta
**When** ele solicita "Excluir minha conta" e confirma explicitamente a ação (com aviso claro de
irreversibilidade)
**Then** a Server Action `deleteAccount.ts` remove permanentemente todas as sessões, mensagens,
sínteses e agregados de padrões do usuário do banco
**And** a conta de autenticação no Supabase Auth é removida
**And** a ação é registrada em `audit_log` antes da destruição dos dados
**And** não há forma de recuperar a conta ou os dados após a confirmação

### Story 5.3: Trilha de Auditoria para Eventos Sensíveis

As a desenvolvedor solo responsável por conformidade,
I want registrar automaticamente login, exportação e exclusão de dados,
So that exista uma trilha de auditoria para qualquer acesso sensível, conforme FR8.

**Acceptance Criteria:**

**Given** qualquer evento de login, exportação de dados (Story 5.1) ou exclusão de conta
(Story 5.2)
**When** o evento ocorre
**Then** um registro é criado em `audit_log` contendo usuário, ação e timestamp
**And** os registros de auditoria não são visíveis ou editáveis pelo próprio usuário através da UI

### Story 5.4: Política de Privacidade e Indicadores Visíveis

As a usuário preocupado com a segurança dos meus dados,
I want ver claramente como meus dados são protegidos e usados,
So that eu confie no app antes de compartilhar algo íntimo.

**Acceptance Criteria:**

**Given** qualquer tela onde dados sensíveis são exibidos (chat, histórico, síntese)
**When** o usuário visualiza a tela
**Then** um selo discreto de privacidade é visível ("Transcrições armazenadas com criptografia")
**And** um link "Como seus dados são usados" está acessível, levando a uma política de privacidade
que descreve com precisão o modelo real de criptografia (em repouso + trânsito, não E2EE literal)
**And** telas de exclusão (sessão ou conta) usam copy clara ("Excluir esta sessão e suas
transcrições para sempre")
