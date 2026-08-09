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

## Deferred from: code review of 3-3-agregacao-de-padroes-longitudinais (2026-07-28)

- `updateUserPatterns` faz leitura → fusão em memória → upsert sem lock/token de concorrência — duas sessões do mesmo usuário terminando ao mesmo tempo (duas abas, ou automático coincidindo com manual em sessões diferentes) podem perder um incremento. Risco de baixa probabilidade para o volume de um beta fechado, já assumido explicitamente no Dev Agent Record; corrigir exigiria uma função SQL atômica, padrão ainda inexistente neste projeto.
- Sessões antigas (anteriores a esta story) não contribuem retroativamente para `user_patterns` — o agregado só passa a acumular a partir do próximo `endSession` depois do deploy. Fora do escopo do AC (fala em "sessão recém-gerada"), um script de backfill fica para quando o dashboard/resumos (Stories 3.4/4.2) tornarem isso visível.
- Falha na agregação (`updateUserPatterns`) é só logada via `console.error`, sem fila de retry nem alerta — uma falha transitória descarta silenciosamente a contribuição daquela sessão ao agregado. Consistente com a filosofia de tratamento de erro já usada em todo o projeto (Vercel logs nativos; Sentry é evolução pós-beta por `architecture.md`).
- As colunas `jsonb` de `user_patterns` não têm nenhuma restrição de formato no banco — dependem inteiramente da aplicação manter o formato `{ rótulo: contagem }`. Mesmo nível de confiança na aplicação já usado em `session_syntheses.themes` (`text[]` sem validação adicional no banco).
- Rótulos individuais de tema/emoção/gatilho não têm limite máximo de tamanho (só `min(1)` após trim). Lacuna pré-existente já presente em `themes`/`patterns` desde a Story 3.1, não introduzida por esta diff.

## Deferred from: code review of 3-4-memoria-em-camadas-agente-referencia-conversas-anteriores (2026-08-01)

- A memória em camadas (`buildMemoryContext`) é buscada a cada mensagem da sessão, não uma única vez por sessão — duas leituras extras ao Supabase (`session_syntheses`, `user_patterns`) por turno. Mesmo padrão já usado por `buildConversationMessages` (também refeito a cada mensagem); latência real é dominada pela chamada à Anthropic, não por essas duas leituras indexadas.
- O `Promise.all` interno de `buildMemoryContext` é tudo-ou-nada: uma falha transitória numa das duas leituras (sínteses ou agregado) descarta as duas, mesmo que a outra tivesse sucesso. Mesma granularidade de "melhor esforço" já usada em `updateUserPatterns` (Story 3.3, que também trata a agregação inteira como uma unidade).
- `getUserPatterns` lê os mapas jsonb completos de temas/emoções/gatilhos do usuário só para manter os 5 rótulos mais frequentes de cada categoria — sem paginação/limite no lado do banco. Mesmo padrão de leitura já usado pelo dashboard (arquitetura: "`user_patterns` é a única fonte de leitura do dashboard/insights").
- `formatSessionDate` corta o timestamp UTC bruto (`isoDate.slice(0, 10)`) sem converter para o fuso horário do usuário — uma sessão perto da meia-noite local pode aparecer com a data errada na memória do agente. Consistente com a convenção UTC-only já usada no resto do projeto (`lib/rate-limit.ts#startOfTodayUtcIso`); não há fuso horário do usuário armazenado em lugar nenhum ainda.

## Deferred from: code review of 3-5-historico-de-sessoes-lista-busca-e-acoes-rapidas (2026-08-01)

- Lista de sessões (`listSessionHistory`) não é paginada — busca e renderiza o histórico inteiro do usuário a cada visita à tela, sem `.limit()`/cursor. Fora de escopo para o volume de um beta fechado (5-10 usuários); revisitar se o histórico de algum usuário crescer o suficiente para tornar a query ou a lista perceptivelmente lentas.
- Excluir uma sessão (`deleteSession`) não reverte sua contribuição ao agregado `user_patterns` — temas, emoções e gatilhos daquela sessão continuam contados no agregado para sempre, mesmo depois de "excluir para sempre" a sessão. Reverter exigiria persistir emoções/gatilhos por sessão (hoje só existem efêmeros, dentro da chamada que gera a síntese — nunca gravados em `session_syntheses`) e uma função de decremento simétrica a `updateUserPatterns`, mudança de schema/escopo maior que esta story. A copy de confirmação de exclusão ("esta sessão e suas transcrições") é precisa sobre o que de fato é apagado — não promete zerar o agregado, que é um recurso à parte desde a Story 3.3.
- As policies novas da migration (`sessions_update_own`, `sessions_delete_own`) não são idempotentes — reaplicar o arquivo depois de uma aplicação parcial falha com "policy already exists". Mesmo padrão de toda migration já existente no projeto (nenhuma usa `drop policy if exists`); falha de forma clara e segura, não corrompe dados.
- Não há filtro ou visão dedicada para sessões "marcadas" — a ação só adiciona um selo visual na mesma lista cronológica única. Fora do escopo do AC3 (pede a ação "Marcar", não uma visão filtrada); revisitar se o uso real mostrar que marcar sem conseguir filtrar depois não é útil.

## Deferred from: code review of 3-6-abertura-adaptativa-conforme-historico-da-sessao (2026-08-02)

- Sem chave de desempate além de `created_at` ao ordenar `sessions`/`messages` em `buildSessionOpeningContext` — mesma limitação já existente em `buildConversationMessages`/`fetchRecentSyntheses` desde as Stories 3.1/3.4; revisitar apenas se inserts quase simultâneos se mostrarem um problema real.
- `buildSessionOpeningContext` busca o histórico completo de mensagens da sessão anterior sem `.limit()`, só para pegar a primeira mensagem do assistente e uma média — espelha o mesmo padrão já usado por `buildConversationMessages`, não é uma regressão nova desta diff.
- `.catch(() => null)` em `buildSessionOpeningContext` não distingue "falha transitória na consulta" de "não é abertura de sessão" — um erro passageiro no Supabase na primeira mensagem de um usuário derruba silenciosamente a instrução obrigatória da pergunta-guia padrão (AC1). Decisão explícita do usuário: manter o padrão best-effort (mesmo já usado em `memoryContext`), risco aceito dado o volume do beta fechado.

## Deferred from: code review of 4-2-dashboard-de-indicadores-de-evolucao (2026-08-09)

- Banner de erro dos indicadores de evolução (`app/page.tsx`, `styles.errorBanner`) não tem
  botão de "tentar novamente" — a única saída é o usuário atualizar a página manualmente. Mesmo
  padrão já usado no banner de erro do histórico de sessões (Story 3.5); revisitar se um padrão
  de retry for adotado em algum desses dois lugares, para manter consistência entre eles.
