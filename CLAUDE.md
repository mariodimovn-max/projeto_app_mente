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
- [x] Implementação — em review: Epic 1 / Story 1.7 (logout com confirmação): novo header mínimo em `apps/web/src/app/page.tsx` (Server Component assíncrono, só renderiza quando há sessão) com `LogoutButton` (`apps/web/src/app/LogoutButton.tsx`, client component) — diálogo de confirmação (`role="alertdialog"`, foco automático no "Cancelar", fecha com Esc) construído do zero via `useState`, já que não existia nenhum componente de dialog/modal no repo nem no design system. Nova Server Action `logout` (`apps/web/src/lib/actions/logout.ts`) chama `supabase.auth.signOut()` e só redireciona para `/` se a invalidação da sessão tiver sucesso. Como o produto ainda não tem menu/configurações nem app shell autenticado, o botão "Sair" ficou num header provisório na home — decisão sinalizada para revisão futura junto da navegação principal do Epic 4. Passou por code review (8 ângulos + verificação): corrigidos focus trap e nome acessível duplicado no diálogo, CTA "Começar sessão" contraditório para usuário já autenticado, e a segunda chamada a `getUser()` em `page.tsx` (agora `apps/web/src/proxy.ts` repassa o resultado via header `SESSION_USER_HEADER` em vez de cada página consultar o Supabase de novo). 107 testes passando; `tsc --noEmit`/`eslint` sem erros. Mesma limitação de ambiente das Stories 1.4–1.6: sem projeto Supabase real provisionado, fluxo validado via mocks.
- [x] Implementação — concluída e validada end-to-end: Epic 2 / Story 2.1 (enviar mensagem de texto e receber resposta em streaming): novas tabelas `sessions`/`messages` com RLS (`supabase/migrations/20260716195536_chat_schema.sql`), schema Zod compartilhado (`apps/web/src/lib/validation/message.ts`, 10–5000 caracteres), `apps/web/src/lib/agent/memory.ts` (monta histórico da sessão para a Anthropic API) e `apps/web/src/lib/agent/client.server.ts`. Único Route Handler do projeto implementado em `apps/web/src/app/api/chat/route.ts` (`runtime = "nodejs"`), que cria a sessão quando necessário, persiste a mensagem do usuário, faz streaming da resposta da Anthropic API (`claude-sonnet-5`, `thinking` desabilitado para latência baixa — escolhido com o usuário em vez do Opus 4.8 default do skill de API, por custo/latência) via `ReadableStream` bruto consumido por `fetch` no client (sem SDK/SSE no browser), e persiste a resposta completa do agente ao final antes de fechar o stream. UI nova em `apps/web/src/components/chat/` (`ChatWindow` com `useReducer` de estados `'idle'|'loading'|'streaming'|'error'`, `ChatComposer`, `MessageBubble`) e página `/chat`; retry de erro é sempre explícito (nunca automático). A adaptação de tom (`detectEmotionalState`) fica para a Story 2.2 — este Route Handler já usa `buildSystemPrompt` mas fixo em `"neutral"`. 135 testes passando; `tsc --noEmit`, `eslint` e `next build` sem erros. Validado manualmente pelo usuário com o projeto Supabase e a chave Anthropic reais: login → `/chat` → streaming da resposta funcionando ponta a ponta (a migration precisou ser aplicada manualmente via SQL Editor do Supabase — não havia projeto provisionado até esta história; erros de persistência da sessão/mensagem agora são logados via `console.error` para facilitar diagnóstico). `apps/web/.env.example` segue bloqueado por permissões do ambiente (não documenta `ANTHROPIC_API_KEY`), mas `.env.local` já está configurado.
- [x] Implementação — concluída e validada end-to-end: Epic 2 / Story 2.2 (adaptação de tom conforme estado emocional detectado): `apps/web/src/app/api/chat/route.ts` passou a chamar `analyzeEmotionalState`/`buildSystemPrompt` com o estado real da mensagem (antes fixo em `"neutral"`, decisão deliberada da Story 2.1). Nova função `analyzeEmotionalState` (`apps/web/src/lib/agent/emotional-state.ts`) calcula estado e intensidade (`"low"/"high"`, ≥3 sinais do estado vencedor = intenso) numa única passada; nova função `resolveMaxTokens` (`apps/web/src/lib/agent/prompts.ts`) adapta o orçamento de tokens da Anthropic API — 1024 padrão, 400 para melancolia intensa (`INTENSE_MELANCHOLY_MAX_TOKENS`, resposta curta e contida), 1200 para intensidade alta nos demais estados (engajamento reflexivo mais profundo); `buildSystemPrompt` ganhou um segundo parâmetro opcional de intensidade que reforça essa orientação por texto no próprio prompt. Passou por code review (8 ângulos + verificação): corrigido o risco de a resposta ser cortada pelo `max_tokens` sem detecção (agora logado via `stop_reason` em `console.warn`), eliminada a passada dupla de regex na detecção de intensidade, renomeada a constante que sugeria detecção de crise (responsabilidade da futura Story 2.5), reduzido o orçamento de tokens de engajamento profundo (1400→1200) por cautela com a NFR de latência, e simplificações menores (`Record` exaustivo em `resolveMaxTokens`, addendum de intensidade compartilhado entre estados não-melancólicos, `scripts/agent-test.ts` atualizado para refletir o novo comportamento). 154 testes passando; `tsc --noEmit`, `eslint` e `next build` sem erros. Validado manualmente pelo usuário (2026-07-18) numa conversa real em `/chat`: mensagens com melancolia intensa, neutras, ego inflado e confusão geraram respostas com tom e comprimento visivelmente distintos — incluindo a AC3 (perspectivas filosóficas integradas sem citar nomes), que não tinha cobertura automatizada própria.
- [x] Implementação — concluída: redesign visual "Aura" (Direção 1a do pacote de design `App de evolução pessoal.zip`, onboarding + chat) aplicado como novo design system global. Tokens de cor/fonte em `apps/web/src/styles/variables.css` substituídos pela paleta petróleo/teal noturna (`--color-bg #080f12`, `--color-surface #0e262c`, `--color-accent-1 #7fd0c8` etc.) e pelas fontes Newsreader/Instrument Sans/Space Mono (`next/font/google` em `apps/web/src/app/layout.tsx`) — como o design system é compartilhado, `/auth` (login, recuperação de senha) herdou a nova paleta automaticamente sem alteração de markup. Novo componente `apps/web/src/components/aura/Aura.tsx` (orbe que respira, CSS puro) reutilizado no onboarding (158px) e no chat (34px no header mobile, 120px na coluna desktop). Onboarding (`apps/web/src/app/page.tsx`) reskinado mantendo todo o conteúdo/copy exigido pelos testes (pilares, aviso de não-terapia, "Como usamos seus dados", CTA, aviso de risco). Chat: `MessageBubble` sem bolha para a IA (rótulo mono "a aura" + texto serifado) e pílula de vidro para o usuário; `ChatComposer` como barra de vidro única com FAB de envio; `ChatWindow` com layout responsivo via CSS (header compacto + aura mini no mobile, coluna lateral com aura grande e "respirando com você há X minutos" no desktop, breakpoint 960px) — lógica de streaming/retry/sessão inalterada. Decisão deliberada: o FAB de envio usa um ícone de seta (não microfone) e o placeholder do campo não menciona voz, já que a gravação/transcrição (Story 2.3) ainda não existe — reproduzir o mic do mockup teria sugerido uma capacidade que o app não tem (valor "Honestidade"). `apps/web/src/lib/a11y/contrast.test.ts` (WCAG AA) e os 154 testes existentes passam sem alteração; validado visualmente via Playwright headless (mobile 390px e desktop 1280px, onboarding/chat/login) antes da entrega. A cópia estática de tokens em `_bmad-output/planning-artifacts/design-system/variables.css` (usada só pelos wireframes legados pré-"Aura") foi deliberadamente **não** sincronizada — esses wireframes documentam uma iteração de design anterior e não foram recriados para a nova paleta.
- [x] Implementação — concluída: redesign visual "modelo único" (pacote `App de evolução pessoal.zip`, `design_handoff_onboarding_chat/`) consolidando as 3 direções exploradas — presença viva (Aura), medidor de profundidade e alternância voz⇄texto — na mesma interface de onboarding+chat. Nova mecânica de "profundidade" (`apps/web/src/lib/chat/depth.ts`): 0–12m, +2m por troca completa (usuário→resposta da aura), níveis Superfície(≤3)/Correntes(4–7)/Fundo(≥8) com frase de incentivo própria — tratado como recurso narrativo da sessão, não como o "sem gamification" do FR-7 (que é sobre o dashboard de evolução entre sessões; decisão confirmada com o usuário). Novo componente `apps/web/src/components/chat/DepthMeter.tsx` (coluna esquerda do chat, 270px): trilho vertical + aura (110px) que desce ao longo dele via `--depth-fraction` (CSS var, não pixels fixos do mock original) e leitura `−Xm`/selo de nível/hint na base; offsets de aura/marcadores ajustados em relação ao mockup original para não colidir em containers com altura real (o mock assumia uma janela fixa de 560px). Mobile: `ChatWindow`'s `mobileHeader` ganhou badge de profundidade + mini-barra horizontal, espelhando o desktop. `ChatComposer` ganhou o seletor segmentado Escrever/Falar do mock; o modo "Falar" (mic sálvia + waveform) existe visualmente mas fica **desabilitado** com aviso "Em breve" (mic com `disabled`, waveform estático/dessaturado, sem "ouvindo…") — decisão confirmada com o usuário para não repetir o problema já identificado na Story 2.1/redesign anterior (gravação real é a Story 2.3, ainda não implementada; fingir uma escuta ativa violaria o valor "Honestidade"). Onboarding (`apps/web/src/app/page.tsx`) reestruturado no layout de 2 colunas do mock (aura 230px + "Conheça você **melhor.**" + CTA "Começar a jornada" + botão-fantasma "Como usamos seus dados" + linha de privacidade), com pilares/aviso de risco imediato mantidos abaixo (conteúdo exigido pela Story 1.3/testes, fora do escopo do mock) — CTA fixo ao fim da hero não foi implementado (o mock assume uma única tela; aqui há conteúdo adicional obrigatório abaixo). Novos tokens sálvia (`--color-voice-*`) em `variables.css` para o modo voz. 164 testes passando (10 novos: `depth.test.ts` + toggle do `ChatComposer`); `tsc --noEmit`, `eslint` e `next build` sem erros; validado visualmente via Playwright headless (mobile 390px e desktop 1400px, onboarding/chat, incluindo modo Falar e profundidade em 0/6/12) através de uma rota de preview temporária (removida antes da entrega, sem tocar o gate de autenticação real).
- [x] Implementação — concluída: Epic 2 / Story 2.3 (gravar e transcrever mensagem por voz): novo hook `apps/web/src/lib/voice/useSpeechRecognition.ts` encapsula a Web Speech API do navegador (`SpeechRecognition`/`webkitSpeechRecognition`, sem custo/sem backend — decisão já registrada em `architecture.md`), com tipos ambiente próprios em `apps/web/src/types/speech-recognition.d.ts` (a lib DOM do TypeScript não cobre essa API). O modo "Falar" do `ChatComposer` (antes um placeholder desabilitado "Em breve") ganhou o fluxo real: tocar no microfone inicia a captura de um único enunciado (`continuous: false`) com badge "Gravando..." e waveform animada (AC1); ao finalizar, o composer volta automaticamente para o modo "Escrever" com o texto transcrito já preenchido no mesmo textarea reaproveitado — reviewed lá mesmo antes de enviar (AC2); o estado `text` é compartilhado entre os dois modos, então alternar entre eles nunca descarta rascunho (AC3); apenas a string transcrita chega ao backend, nunca áudio (AC4). Navegadores sem suporte mostram aviso e mantêm o modo "Escrever" como alternativa; erros (permissão negada, sem microfone, falha de rede etc.) mostram mensagem gentil com "Regravar"/"Continuar com texto", replicando a copy definida em `ux-patterns.md`. Passou por code review (3 camadas + triagem): o achado crítico cross-confirmado pelas 3 camadas foi que a primeira implementação usava `continuous: true` sem nunca chamar `stop()`, deixando o microfone captando em segundo plano mesmo depois da UI voltar para o modo texto — corrigido trocando para captura de enunciado único (o navegador finaliza sozinho) e reforçado com paradas explícitas ao trocar de aba ou quando o composer fica `disabled`; também corrigidos reentrância em `start()`, handlers não desconectados no unmount, `recognition.start()` podendo lançar exceção síncrona sem tratamento, mensagem de erro faltando para "sem microfone encontrado", e uma lacuna de acessibilidade (foco automático no textarea + aviso `role="status"` "Transcrição pronta — revise se quiser" ao concluir a transcrição, alinhado à copy do UX spec e ao NFR de WCAG 2.1 AA). Itens adiados (não bloqueantes, registrados em `_bmad-output/implementation-artifacts/deferred-work.md`): duplicação do mock de teste da Web Speech API entre os dois arquivos de teste, e normalização de espaços ao concatenar uma nova transcrição a texto já digitado (edição fina da transcrição é escopo da Story 2.4). 190 testes passando; `tsc --noEmit`, `eslint` e `next build` sem erros. Validação manual real da transcrição por voz não foi possível neste ambiente (a Web Speech API depende de um navegador de verdade com microfone e permissão do usuário) — fica para o usuário validar em `/chat` com Chrome.
- [x] Implementação — concluída: Epic 2 / Story 2.4 (editar transcrição antes de enviar): novo componente `TranscriptBlock` (`apps/web/src/components/chat/TranscriptBlock.tsx`) — o componente dedicado que a Story 2.3 tinha deliberadamente deferido para cá. Fluxo revisado: ao terminar a gravação, o `ChatComposer` não pula mais direto para o modo "Escrever" com o texto já mesclado; em vez disso guarda a transcrição bruta em `pendingTranscript` e renderiza o `TranscriptBlock` (ainda dentro do modo "Falar"), com foco automático no textarea, aviso `role="status"` "Transcrição pronta — revise se quiser" e hint "Toque qualquer palavra para corrigir" associada ao textarea via `aria-describedby` (copy do `ux-patterns.md`; a edição em si é feita num `<textarea>` nativo — tocar em qualquer palavra já posiciona o cursor lá — preferido a um `contenteditable` do wireframe legado por ser mais robusto em teclado virtual/leitor de tela). Duas ações: "Salvar transcrição" (mescla o texto — editado ou não — ao rascunho já digitado, se houver, limpa qualquer erro de envio anterior, e volta para o modo "Escrever" pronto para o "Enviar" normal) e "Descartar" (limpa a transcrição pendente sem tocar no que já estava digitado, devolvendo o foco ao botão de microfone). Como a versão final só chega ao `text` do composer depois do "Salvar", a AC4 (só o texto revisado é enviado) é garantida pelo mesmo caminho de envio já existente. Passou por code review (3 camadas, revisando 2.3+2.4 juntas a pedido do usuário): corrigidos o botão "Escrever" que não limpava a transcrição pendente (ficava órfã e reaparecia ao voltar para "Falar"), `TranscriptBlock` não propagava `disabled` (textarea/botões continuavam ativos com o composer ocupado), erro de envio de texto anterior não era limpo ao salvar uma transcrição, e adicionada cobertura de teste faltante para o comportamento de anexar transcrição ao rascunho já digitado. Itens adiados (registrados em `deferred-work.md`): botões de modo sem `disabled`, `title` perdido no botão de mic (ambos pré-existentes de stories anteriores), texto/botões novos abaixo do NFR de 14px (tensão real mas já é padrão pré-existente no componente — decisão de escala tipográfica maior), string de status duplicada em dois arquivos. 204 testes passando; `tsc --noEmit`, `eslint` e `next build` sem erros. Validação manual real da transcrição por voz não foi possível neste ambiente — fica para o usuário validar em `/chat` com Chrome.
- [ ] Implementação — próxima história: Epic 2 / Story 2.5 (fluxo de crise: resposta a sinais de risco severo)

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
