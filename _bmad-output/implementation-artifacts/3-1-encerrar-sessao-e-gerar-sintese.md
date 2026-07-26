# Story 3.1: Encerrar Sessão e Gerar Síntese

Status: done

## Story

As a usuário concluindo uma conversa,
I want receber uma síntese do que foi conversado ao encerrar a sessão (ou após 60 min de inatividade),
so that eu saia com clareza sobre o que foi explorado, não apenas com uma conversa que “só acabou”.

The generated synthesis should follow the visual layout defined in the file "Aura - Síntese.dc".

## Acceptance Criteria

1. **Given** uma sessão de conversa ativa com pelo menos uma troca de mensagens, **when** o usuário clicar em “Encerrar sessão” ou 60 minutos se passarem sem atividade, **then** uma síntese é gerada via Server Action separada do fluxo de chat.
2. **Given** a síntese gerada, **when** ela for criada, **then** ela contém o que foi explorado, padrões identificados e uma pergunta aberta para reflexão futura.
3. **Given** a síntese concluída, **when** o processo for encerrado, **then** ela é salva na tabela `session_syntheses` e exibida no componente `SynthesisCard`.
4. **Given** o encerramento por inatividade, **when** ocorrer, **then** ele acontece automaticamente em background sem exigir ação do usuário.

## Tasks / Subtasks

- [x] Implementar o fluxo de encerramento e geração de síntese.
- [x] Persistir a síntese e apresentá-la na UI.

## Dev Agent Record

### Implementation Plan

- Não foi encontrado o arquivo "Aura - Síntese.dc" citado na história em nenhum lugar do
  repositório (planning-artifacts, wireframes, design-system). Segui o wireframe/design system já
  existentes para o componente de síntese (`wireframes/synthesis.html`,
  `design-system/components/synthesis-card.*`) adaptados à paleta "Aura" atual do chat (mesmos
  tokens de `styles/variables.css` usados em `ChatWindow`/`DepthMeter`), em vez de bloquear a
  implementação pela ausência do arquivo — assumpção sinalizada aqui para validação posterior.
- Nova tabela `session_syntheses` (migration `20260725120000_session_syntheses.sql`), seguindo o
  padrão de nomenclatura e RLS já usado em `sessions`/`messages`: colunas `themes` (`text[]`),
  `explored`, `patterns`, `open_question`, FK única por `session_id` (uma síntese por sessão),
  políticas de select/insert restritas ao dono da sessão via join com `sessions`.
- Geração da síntese isolada em `lib/agent/synthesis.ts`, com uma chamada separada à Anthropic API
  (não reaproveita o Route Handler de streaming de `/api/chat`, conforme AC1). Usa
  `anthropic.messages.parse` com `output_config.format` (via `zodOutputFormat`) para forçar saída
  estruturada validada por schema Zod (`themes`, `explored`, `patterns`, `openQuestion`) — mais
  robusto que pedir JSON por prompt e fazer `JSON.parse` manual. Modelo `claude-sonnet-5` com
  `thinking: { type: "disabled" }`, mantendo consistência com o modelo já usado em `/api/chat`.
- Server Action `endSession(sessionId)` em `lib/actions/endSession.ts`: valida o `sessionId`
  (`zod`), confirma autenticação e posse da sessão (checagem explícita além da RLS, para falhar
  de forma clara em vez de silenciosamente ler zero linhas), reutiliza `buildConversationMessages`
  já existente para montar o histórico, valida que há "pelo menos uma troca de mensagens" (AC1: ao
  menos uma mensagem de cada papel) antes de gastar uma chamada à IA, gera a síntese e persiste em
  `session_syntheses`.
- `SynthesisCard` novo em `components/insights/` (caminho já previsto em `architecture.md`):
  chips temáticos, bullets com o que foi explorado + padrões identificados, a pergunta aberta em
  destaque, e (adicionado na revisão de código, ver Review Findings) as ações "Salvar
  insight"/"Explorar mais" do wireframe/`epics.md`, desabilitadas — ainda não existe schema/lógica
  para "salvar um insight", então elas ficam visíveis mas inertes até essa funcionalidade ser
  priorizada, em vez de sugerir uma capacidade que o app não tem.
- `ChatWindow` ganhou: botão "Encerrar sessão" (visível só após uma troca completa — resposta do
  agente com conteúdo real, conforme AC1), e um `useEffect` que reinicia um timer de 60 min
  (`INACTIVITY_TIMEOUT_MS`, exportado para uso nos testes) a cada nova mensagem e dispara o mesmo
  fluxo de encerramento em background quando expira, sem exigir ação do usuário (AC4). Ao
  encerrar com sucesso, a área do composer é substituída pelo `SynthesisCard`; falhas mostram um
  banner de erro sem esconder o composer (permitindo tentar de novo ou continuar a conversa).

### Completion Notes

- `lib/validation/synthesis.ts`: schema Zod do conteúdo da síntese, compartilhado entre a geração
  (validação da saída estruturada da IA) e o tipo usado no restante do app.
- `lib/agent/synthesis.ts` + teste: geração via `messages.parse`/`zodOutputFormat`, cobrindo o
  caminho de sucesso (parâmetros corretos enviados à API) e a falha quando a IA não retorna
  conteúdo interpretável.
- `lib/actions/endSession.ts` + teste (7 casos): UUID inválido, usuário não autenticado, sessão
  inexistente/não pertencente ao usuário, sessão sem troca completa de mensagens, sucesso (gera,
  salva e retorna a síntese mapeada), falha na geração pela IA, falha ao salvar no banco — todos
  retornando erro genérico e amigável, sem vazar detalhes técnicos.
- `components/insights/SynthesisCard.tsx` + `.module.css` + teste (3 casos): conteúdo exibido,
  ausência da lista de chips quando não há temas, região com rótulo acessível.
- `ChatWindow.tsx`/`.module.css` + testes (4 novos casos, 12 no total no arquivo): botão de
  encerrar ausente antes da primeira troca completa, encerramento manual exibindo a síntese,
  banner de erro mantendo o composer disponível, e encerramento automático por inatividade
  (usando fake timers do Vitest para simular os 60 minutos sem depender de tempo real).
- Suíte completa: 265 testes passando (37 arquivos). `npm run typecheck` e `npm run lint` sem
  erros.
- Após code review (3 camadas: Blind Hunter, Edge Case Hunter, Acceptance Auditor): 9 patches
  aplicados + 1 decisão do usuário resolvida como patch (botões desabilitados no `SynthesisCard`).
  Suíte final: 269 testes passando (37 arquivos), incluindo 2 novos testes de
  `endSession.test.ts` (conflito de unicidade → retorna síntese existente) e 2 novos testes de
  `SynthesisCard.test.tsx` (botões desabilitados; `key` estável com temas duplicados) e 1 novo
  teste de `ChatWindow.test.tsx` (timer de inatividade reinicia a cada nova mensagem).
  `npm run typecheck` e `npm run lint` sem erros. 9 achados de baixa prioridade, pré-existentes ou
  fora do escopo desta story, adiados para `deferred-work.md`.

### File List

- `supabase/migrations/20260725120000_session_syntheses.sql` (novo)
- `apps/web/src/lib/validation/synthesis.ts` (novo)
- `apps/web/src/lib/agent/synthesis.ts` (novo)
- `apps/web/src/lib/agent/synthesis.test.ts` (novo)
- `apps/web/src/lib/actions/endSession.ts` (novo)
- `apps/web/src/lib/actions/endSession.test.ts` (novo)
- `apps/web/src/types/synthesis.ts` (novo)
- `apps/web/src/components/insights/SynthesisCard.tsx` (novo)
- `apps/web/src/components/insights/SynthesisCard.module.css` (novo)
- `apps/web/src/components/insights/SynthesisCard.test.tsx` (novo)
- `apps/web/src/components/chat/ChatWindow.tsx` (modificado)
- `apps/web/src/components/chat/ChatWindow.module.css` (modificado)
- `apps/web/src/components/chat/ChatWindow.test.tsx` (modificado)
- `supabase/migrations/20260725220000_session_syntheses_title_depth_patterns.sql` (novo — redesenho para o layout real)
- `apps/web/src/components/insights/SessionRestedNotice.tsx` (novo)
- `apps/web/src/components/insights/SessionRestedNotice.module.css` (novo)
- `apps/web/src/components/insights/SessionRestedNotice.test.tsx` (novo)

### Change Log

- 2026-07-25: Implementado o fluxo completo de encerramento de sessão e geração de síntese
  (AC1-AC4): migration `session_syntheses`, geração via Anthropic API com saída estruturada,
  Server Action `endSession`, componente `SynthesisCard`, e integração no `ChatWindow` com botão
  manual e encerramento automático por inatividade de 60 minutos.
- 2026-07-25: Aplicadas 10 correções de code review (unhandled rejection travando o botão de
  encerrar; falta de `try/catch` em `endSession.ts`; encerramento não bloqueado durante envio em
  andamento; conflito de unicidade em chamadas concorrentes; banner de erro sobreposto à síntese;
  `endSessionError` não limpo em nova mensagem; `key` instável no `SynthesisCard`; falta de
  `aria-busy`; teste ausente do reinício do timer; e os botões "Salvar insight"/"Explorar mais"
  adicionados desabilitados por decisão do usuário). 9 achados de baixa severidade, pré-existentes
  ou fora do escopo, adiados para `deferred-work.md`.
- 2026-07-25: Corrigido bug encontrado na verificação manual em localhost — "Encerrar sessão"
  sempre falhava com "Não consegui gerar a síntese desta sessão agora" porque `generateSessionSynthesis`
  enviava a conversa real (que termina com a resposta do agente, role `assistant`) direto como
  `messages` para a Anthropic API. Modelos atuais rejeitam com 400 ("assistant message prefill —
  the conversation must end with a user message") qualquer lista de mensagens que não termine em
  `user`. Corrigido acrescentando uma instrução final do usuário ao final da conversa antes de
  chamar `messages.parse`. Novo teste de regressão em `synthesis.test.ts` cobrindo esse caso.
  Suíte final: 270 testes.
- 2026-07-25: Segundo bug encontrado na mesma verificação manual — depois do fix acima, o erro
  passou a ser "Could not find the table 'public.session_syntheses' in the schema cache"
  (`PGRST205`). Causa: a migration `20260725120000_session_syntheses.sql` existia no repositório
  mas nunca tinha sido aplicada no banco Supabase real do projeto (nenhum agente/CLI tem
  credenciais para rodar isso automaticamente). Resolvido rodando o SQL da migration manualmente
  no SQL Editor do Supabase Dashboard. Log de erro do `insertError` em `endSession.ts` também
  melhorado (agora extrai `message`/`code`/`details`/`hint` explicitamente em vez de logar o
  objeto de erro cru, que serializava mal em alguns handlers de log). **Nota para o próximo
  ambiente (staging/produção) ou para qualquer colaborador clonando o repo:** as migrations em
  `supabase/migrations/` precisam ser aplicadas manualmente (via Dashboard ou `supabase db push`
  com o projeto linkado) — não há automação de deploy de schema neste projeto ainda.
- 2026-07-25: **O usuário encontrou e enviou o arquivo "Aura - Sintese.dc.html" que faltava**
  (não estava commitado no repositório). Redesenho completo do `SynthesisCard` para seguir o
  layout real: título poético gerado pela IA (novo campo `title`), coluna com a aura em repouso
  + estatísticas da sessão (profundidade, duração, número de trocas), padrões exibidos como
  cartões individuais (campo `patterns` migrado de frase única para lista), pergunta aberta com
  "?" decorativo, e as ações corretas "Guardar no diário"/"Ver a conversa" (substituindo
  "Salvar insight"/"Explorar mais", que vieram de uma leitura equivocada do `epics.md` sem
  acesso ao arquivo real — ver achado de review abaixo, agora superado). Novo componente
  `SessionRestedNotice` para o encerramento por inatividade (AC4): em vez de revelar a síntese
  completa de uma vez, mostra primeiro um convite suave ("a sessão repousou... Ver a síntese"),
  só exibindo o conteúdo completo quando o usuário pedir — o encerramento manual continua
  revelando a síntese na hora. Nova migration adicionando `title`/`depth` e convertendo
  `patterns` para array. Suíte final: 273 testes.
- 2026-07-25: **Decisão adiada:** o mockup real mostra a síntese numa URL própria
  (`seuespaco.app/sintese`), sugerindo uma rota dedicada em vez do estado inline atual dentro do
  `ChatWindow`. Por ora mantemos inline — decisão do usuário — e revisitamos isso junto da Story
  3.5 (Histórico de Sessões), que vai precisar de uma página para revisitar sínteses passadas de
  qualquer forma. Registrado em `deferred-work.md`.

### Review Findings

- [x] [Review][Patch] `SynthesisCard` não tinha as ações "Salvar insight"/"Explorar mais" que `epics.md` especifica literalmente no AC da Story 3.1. **Decisão do usuário:** adicionar os dois botões visualmente (para bater com o wireframe/epics.md), mas desabilitados — sem lógica de "salvar"/"explorar" real, já que não existe schema/backend para isso ainda; a funcionalidade fica para quando for priorizada. [apps/web/src/components/insights/SynthesisCard.tsx] — corrigido nesta rodada: "Salvar insight"/"Explorar mais" adicionados com `disabled`. **Superado depois:** ao receber o arquivo de design real ("Aura - Sintese.dc.html"), descobrimos que os rótulos corretos são "Guardar no diário"/"Ver a conversa" — `epics.md` não batia com o design real. Os botões atuais usam os rótulos corretos, ainda desabilitados pelo mesmo motivo (sem schema/tela de destino ainda).
- [x] [Review][Patch] `handleEndSession` não tem `try/catch`/`finally` ao redor de `await endSession(sessionId)` — se a Server Action rejeitar (rede caindo, timeout, redeploy invalidando o action id), `isEndingRef.current` e `isEndingSession` nunca voltam a `false`, travando o botão em "Gerando síntese..." para sempre, sem erro visível e sem novo disparo do timer de inatividade. [apps/web/src/components/chat/ChatWindow.tsx:159-180] — corrigido: `try/catch/finally` adicionado, resetando os dois estados e mostrando erro em qualquer rejeição.
- [x] [Review][Patch] Em `endSession.ts`, a checagem de posse da sessão e a chamada a `buildConversationMessages` ficam fora de qualquer `try/catch` — uma falha de rede/Supabase nesse trecho lança uma exceção não tratada para fora da Server Action, em vez de retornar `{ error }` como o resto da função faz. [apps/web/src/lib/actions/endSession.ts:35-49] — corrigido: todo o corpo após a autenticação agora está dentro de um único `try/catch`.
- [x] [Review][Patch] O botão "Encerrar sessão" só é desabilitado por `isEndingSession`, não por `isBusy` — clicar nele (ou o timer de inatividade disparar) enquanto uma mensagem ainda está sendo enviada/streamada permite gerar uma síntese que inclui uma mensagem do usuário ainda sem resposta persistida. [apps/web/src/components/chat/ChatWindow.tsx:272-284] — corrigido: botão agora também desabilitado por `isBusy`, e `handleEndSession` retorna cedo se `isBusy`.
- [x] [Review][Patch] Chamadas concorrentes a `endSession` para a mesma sessão (duplo clique antes do `disabled` surtir efeito, ou o timer automático coincidindo com um clique manual) esbarram no índice único de `session_id` em `session_syntheses` e caem no erro genérico, em vez de retornar a síntese que já existe. [apps/web/src/lib/actions/endSession.ts:58-68; supabase/migrations/20260725120000_session_syntheses.sql] — corrigido: ao detectar violação de unicidade (código `23505`), busca e retorna a síntese já existente.
- [x] [Review][Patch] O banner de erro de envio de mensagem (`state.status === "error"`) não é condicionado a `!synthesis` — se uma sessão já exibe o `SynthesisCard` e uma ação não relacionada define `state.status` como `"error"`, o banner de "Tentar novamente" pode aparecer ao mesmo tempo que a síntese. [apps/web/src/components/chat/ChatWindow.tsx:251-258] — corrigido: banner agora condicionado também a `!synthesis`.
- [x] [Review][Patch] Enviar uma nova mensagem não limpa um `endSessionError` anterior — se "Encerrar sessão" falhou uma vez, o banner de erro correspondente permanece na tela mesmo que o usuário continue a conversa normalmente depois. [apps/web/src/components/chat/ChatWindow.tsx sendMessage/reducer] — corrigido: `sendMessage` limpa `endSessionError` no início do envio.
- [x] [Review][Patch] `SynthesisCard` usa a própria string do tema como `key` do React (`key={theme}`) — nada no schema Zod garante unicidade; temas duplicados retornados pela IA gerariam `key`s duplicadas e aviso/mau-render do React. [apps/web/src/components/insights/SynthesisCard.tsx:21] — corrigido: `key` agora combina tema + índice.
- [x] [Review][Patch] O botão "Encerrar sessão" troca o rótulo para "Gerando síntese..." enquanto `isEndingSession`, mas não tem `aria-busy`/`aria-live` — leitores de tela não são avisados da mudança de estado (o projeto tem NFR de WCAG 2.1 AA). [apps/web/src/components/chat/ChatWindow.tsx:274-283] — corrigido: `aria-busy={isEndingSession}` adicionado ao botão.
- [x] [Review][Patch] Nenhum teste confirma que o timer de inatividade de 60 minutos reinicia quando uma nova mensagem chega antes de expirar — o comentário no código afirma esse comportamento, mas ele não é verificado por nenhum teste desta diff. [apps/web/src/components/chat/ChatWindow.test.tsx] — corrigido: novo teste com fake timers confirmando o reinício.
- [x] [Review][Defer] `console.error` em `endSession.ts` loga objetos de erro crus do Supabase — mesmo padrão já usado em todo o restante do código (`route.ts`, `rate-limit.ts`); revisitar apenas se uma política de log/redação for adotada no projeto todo. [apps/web/src/lib/actions/endSession.ts:71,85] — deferred, consistente com padrão pré-existente
- [x] [Review][Defer] `generateSessionSynthesis`/`anthropic.messages.parse` não recebe timeout/`AbortSignal` explícito — mesma lacuna já existe na chamada de streaming pré-existente em `/api/chat`, não introduzida por esta diff. [apps/web/src/lib/agent/synthesis.ts] — deferred, pré-existente desde a Story 2.1
- [x] [Review][Defer] A migration de `session_syntheses` não tem política de RLS de `update`/`delete` e depende do cascade de `sessions` para limpeza — mesmo formato das tabelas `sessions`/`messages` já existentes; a exclusão em cascata por deleção de conta (LGPD) é escopo explícito da Story 5.2, não desta. [supabase/migrations/20260725120000_session_syntheses.sql] — deferred, fora do escopo desta story (Epic 5)
- [x] [Review][Defer] Depois que a síntese de uma sessão é exibida, não há forma na UI de iniciar uma nova sessão (composer e botão de encerrar desaparecem) — mesmo comportamento do app hoje em todo o resto (não existe um botão explícito de "novo chat" em lugar nenhum antes desta story; recarregar a página já é o reset de fato). [apps/web/src/components/chat/ChatWindow.tsx:260-286] — deferred, consistente com o padrão atual do app
- [x] [Review][Defer] `sessionIdRef.current` poderia teoricamente ser `null` com `hasCompletedExchange` verdadeiro, fazendo o encerramento (manual ou automático) silenciosamente não fazer nada — não é alcançável hoje, já que `/api/chat` sempre retorna o header `X-Session-Id` em todo caminho de sucesso; puramente defensivo. [apps/web/src/components/chat/ChatWindow.tsx:160-163] — deferred, não reproduzível com o contrato atual do servidor
- [x] [Review][Defer] Se a resposta do agente vier vazia (stream sem nenhum chunk), `hasCompletedExchange` nunca fica verdadeiro e o encerramento automático por inatividade (AC4) nunca ativa para aquela sessão, sem explicação — espelha o tratamento já existente para respostas vazias desde a Story 2.7 (já ocultadas da transcrição), não é uma lacuna nova desta diff. [apps/web/src/components/chat/ChatWindow.tsx:196-198] — deferred, comportamento pré-existente desde a Story 2.7
- [x] [Review][Defer] Existe uma janela estreita em que o cliente já mostra uma resposta completa do agente (via streaming) antes de sua inserção no banco ser confirmada; se essa inserção falhar depois, um clique em "Encerrar sessão" pode retornar "é preciso pelo menos uma troca de mensagens" mesmo o usuário tendo acabado de ver uma resposta completa na tela — raro (exige a inserção falhar logo após um streaming bem-sucedido) e exigiria repensar como uma "troca completa" é verificada. [apps/web/src/lib/actions/endSession.ts; apps/web/src/app/api/chat/route.ts:197-206] — deferred, caso raro que exigiria redesenho mais amplo
- [x] [Review][Defer] `handleEndSession` não protege suas atualizações de estado (`setIsEndingSession`, `setSynthesis`, etc.) contra o componente já ter desmontado durante a requisição — mesma lacuna (sem guarda) já existe em `sendMessage`, sem precedente de proteção em nenhum outro lugar do código. [apps/web/src/components/chat/ChatWindow.tsx:159-180] — deferred, consistente com padrão pré-existente
- [x] [Review][Defer] Se a única mensagem em `state.messages` for uma bolha vazia do assistente (filtrada por `visibleMessages`), o painel de histórico pode ficar em branco, sem o texto de estado vazio nem nenhuma bolha — lacuna pré-existente do filtro de bolhas vazias da Story 2.7, não tocada por esta diff. [apps/web/src/components/chat/ChatWindow.tsx:193,242-244] — deferred, pré-existente desde a Story 2.7
