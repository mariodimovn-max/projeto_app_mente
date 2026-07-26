# Trabalho adiado

## Deferred from: code review of 2-3-gravar-e-transcrever-mensagem-por-voz (2026-07-20)

- Duplicação do mock `MockSpeechRecognition`/`createResultList` entre `apps/web/src/components/chat/ChatComposer.test.tsx` e `apps/web/src/lib/voice/useSpeechRecognition.test.ts` — extrair para um utilitário de teste compartilhado num cleanup futuro.
- Espaços duplicados ao concatenar uma nova transcrição com texto já digitado no composer (`apps/web/src/components/chat/ChatComposer.tsx:22`) — a edição fina da transcrição antes do envio é escopo da Story 2.4 (Editar Transcrição Antes de Enviar).

## Deferred from: code review of 2-4-editar-transcricao-antes-de-enviar (2026-07-20)

- Botões de modo ("Escrever"/"Falar") nunca recebem `disabled={disabled}` — pré-existente desde a Story 2.1, fora do escopo desta story.
- `title` do botão de microfone foi perdido na Story 2.3 (só `aria-label` cobre leitor de tela, não hover do mouse) — cosmético.
- Texto/botões novos abaixo do NFR de fonte mínima de 14px (`.transcriptionStatus`, `.recordingBadge`, botões de ação de voz) — tensão real com o NFR, mas o padrão já existe no componente desde a Story 2.1 (`.counter` etc.); precisa de uma decisão de escala tipográfica do design system, não um patch pontual.
- String "Transcrição pronta — revise se quiser" hardcoded em dois arquivos (`ChatComposer.tsx` e `TranscriptBlock.tsx`) — extrair para uma constante compartilhada num cleanup futuro.

## Deferred from: code review of 2-7-indicador-de-resposta-em-andamento-e-recuperacao-de-erros (2026-07-23)

- Sem timeout/`AbortController` na requisição `/api/chat` — se a requisição nunca resolver, `status` fica em "loading" indefinidamente e o `ThinkingIndicator` gira para sempre, sem caminho de recuperação. Pré-existente desde a Story 2.1.
- Clique duplo em "Tentar novamente" ou um segundo envio concorrente não têm guarda explícita além do `disabled` do composer durante `isBusy`. Pré-existente desde a Story 2.1.
- Se o primeiro delta do streaming for só espaço em branco/quebra de linha (em vez de string vazia), `isAwaitingFirstToken` já considera o conteúdo "presente" e o indicador some antes da hora, deixando a bolha visivelmente em branco até o próximo chunk. Baixa probabilidade prática com o modelo atual (Claude Sonnet 5 não costuma abrir a resposta só com espaço); revisitar se streaming de outro provedor/modelo for adotado.

## Deferred from: code review of 3-1-encerrar-sessao-e-gerar-sintese (2026-07-25)

- `console.error` em `endSession.ts` loga objetos de erro crus do Supabase — mesmo padrão já usado em todo o restante do código (`route.ts`, `rate-limit.ts`); revisitar apenas se uma política de log/redação for adotada no projeto todo.
- `generateSessionSynthesis`/`anthropic.messages.parse` não recebe timeout/`AbortSignal` explícito — mesma lacuna já existe na chamada de streaming pré-existente em `/api/chat`, não introduzida por esta diff.
- A migration de `session_syntheses` não tem política de RLS de `update`/`delete` e depende do cascade de `sessions` para limpeza — mesmo formato das tabelas `sessions`/`messages` já existentes; a exclusão em cascata por deleção de conta (LGPD) é escopo explícito da Story 5.2, não desta.
- Depois que a síntese de uma sessão é exibida, não há forma na UI de iniciar uma nova sessão (composer e botão de encerrar desaparecem) — mesmo comportamento do app hoje em todo o resto (não existe um botão explícito de "novo chat" em lugar nenhum antes desta story; recarregar a página já é o reset de fato).
- `sessionIdRef.current` poderia teoricamente ser `null` com `hasCompletedExchange` verdadeiro, fazendo o encerramento (manual ou automático) silenciosamente não fazer nada — não é alcançável hoje, já que `/api/chat` sempre retorna o header `X-Session-Id` em todo caminho de sucesso; puramente defensivo.
- Se a resposta do agente vier vazia (stream sem nenhum chunk), `hasCompletedExchange` nunca fica verdadeiro e o encerramento automático por inatividade (AC4) nunca ativa para aquela sessão, sem explicação — espelha o tratamento já existente para respostas vazias desde a Story 2.7, não é uma lacuna nova desta diff.
- Existe uma janela estreita em que o cliente já mostra uma resposta completa do agente (via streaming) antes de sua inserção no banco ser confirmada; se essa inserção falhar depois, um clique em "Encerrar sessão" pode retornar "é preciso pelo menos uma troca de mensagens" mesmo o usuário tendo acabado de ver uma resposta completa na tela — raro e exigiria repensar como uma "troca completa" é verificada.
- `handleEndSession` não protege suas atualizações de estado contra o componente já ter desmontado durante a requisição — mesma lacuna (sem guarda) já existe em `sendMessage`, sem precedente de proteção em nenhum outro lugar do código.
- Se a única mensagem em `state.messages` for uma bolha vazia do assistente (filtrada por `visibleMessages`), o painel de histórico pode ficar em branco, sem o texto de estado vazio nem nenhuma bolha — lacuna pré-existente do filtro de bolhas vazias da Story 2.7, não tocada por esta diff.
- A síntese é exibida inline no `ChatWindow` (substituindo a área do composer), não numa página própria. O mockup real ("Aura - Sintese.dc.html") mostra a URL `seuespaco.app/sintese` na barra do navegador, sugerindo que a intenção original era uma rota dedicada (ex.: `/chat/[sessionId]/sintese`). Decisão do usuário: manter inline por ora e revisitar quando a Story 3.5 (Histórico de Sessões) for implementada, já que ela vai precisar de uma página para revisitar sínteses passadas de qualquer forma — construir a rota dedicada nessa hora evita duas soluções concorrentes.

## Deferred from: code review of 3-2-reagir-a-sintese-com-emoji-ou-comentario (2026-07-26)

- `SynthesisReactionDock` nunca busca uma reação já existente ao montar — remontar a tela sobrescreveria silenciosamente uma reação anterior sem indicar que ela existia. Não alcançável hoje: não existe rota para revisitar sínteses passadas antes da Story 3.5 (Histórico de Sessões).
- Sucesso do upsert/delete de reação é confiado só na ausência de erro do Postgres — uma política RLS que filtrasse a linha-alvo não erraria, só afetaria 0 linhas silenciosamente. Teórico e não alcançável hoje (nada no app revoga a posse de uma sessão depois de criada).
- O conjunto de emojis é duplicado entre a constante TypeScript (`SYNTHESIS_REACTION_EMOJI_KEYS`) e a check constraint SQL, sem fonte única de verdade. Aceitável para um enum fixo de 5 itens num MVP solo.
- A migration `session_synthesis_reactions` precisa ser aplicada manualmente no Supabase (Dashboard ou `supabase db push`) — nenhuma automação de deploy de schema existe neste projeto (mesma lacuna já registrada na Story 3.1).
- Uma única string genérica de erro cobre todos os modos de falha de `saveSynthesisReaction` (input inválido, não autenticado, não-dono, erro de banco) — indistinguíveis para quem chama. Mesmo padrão já estabelecido em `endSession.ts`.
