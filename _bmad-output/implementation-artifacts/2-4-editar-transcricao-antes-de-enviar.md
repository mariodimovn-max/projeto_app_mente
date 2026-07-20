# Story 2.4: Editar Transcrição Antes de Enviar

Status: done

## Story

As a usuário que acabou de gravar uma mensagem de voz,
I want revisar e corrigir a transcrição antes de enviá-la ao agente,
so that erros de reconhecimento de voz não distorçam o que eu quis dizer.

## Acceptance Criteria

1. **Given** uma transcrição de áudio gerada pela Web Speech API, **when** ela for exibida no componente `TranscriptBlock`, **then** o texto é editável inline.
2. **Given** o texto editável, **when** o usuário tocar em qualquer palavra para corrigir, **then** ele consegue ajustar o conteúdo antes do envio.
3. **Given** a transcrição revisada, **when** o usuário escolher “Salvar transcrição”, **then** a versão final é usada para envio ao chat.
4. **Given** a revisão concluída, **when** o usuário confirmar, **then** o texto final, editado ou não, é o único conteúdo enviado.

## Tasks / Subtasks

- [x] Implementar o componente de transcrição editável.
- [x] Garantir que a edição seja refletida antes do envio da mensagem.

### Review Findings

- [x] [Review][Patch] Botão "Escrever" não limpa `pendingTranscript` — a transcrição fica órfã e reaparece ao voltar para "Falar" [apps/web/src/components/chat/ChatComposer.tsx:100] — corrigido
- [x] [Review][Patch] `TranscriptBlock` não recebe/respeita `disabled` — textarea e botões continuam interativos com o composer ocupado [apps/web/src/components/chat/TranscriptBlock.tsx, apps/web/src/components/chat/ChatComposer.tsx:182] — corrigido, prop `disabled` adicionada
- [x] [Review][Patch] `handleSaveTranscript` não limpa um `error` de envio de texto anterior [apps/web/src/components/chat/ChatComposer.tsx:82] — corrigido
- [x] [Review][Patch] Dica do `TranscriptBlock` não associada ao textarea via `aria-describedby` [apps/web/src/components/chat/TranscriptBlock.tsx] — corrigido
- [x] [Review][Patch] "Descartar" não devolve o foco a lugar nenhum (cai para `<body>`) [apps/web/src/components/chat/ChatComposer.tsx] — corrigido: foco automático no botão de microfone
- [x] [Review][Patch] Falta teste para o comportamento de anexar transcrição ao rascunho já digitado ao salvar [apps/web/src/components/chat/ChatComposer.test.tsx] — corrigido, teste adicionado
- [x] [Review][Defer] Botões de modo ("Escrever"/"Falar") nunca recebem `disabled={disabled}` [apps/web/src/components/chat/ChatComposer.tsx] — deferido, pré-existente desde a Story 2.1
- [x] [Review][Defer] `title` do botão de microfone foi perdido (só `aria-label` cobre leitor de tela, não hover do mouse) [apps/web/src/components/chat/ChatComposer.tsx] — deferido, pré-existente desde a Story 2.3, cosmético
- [x] [Review][Defer] Texto/botões novos abaixo do NFR de fonte mínima de 14px (`.transcriptionStatus`, `.recordingBadge`, botões de ação) [apps/web/src/components/chat/ChatComposer.module.css] — deferido, tensão real com o NFR mas padrão já pré-existente no componente (`.counter` etc.); precisa de uma decisão de escala tipográfica do design system, não um patch pontual
- [x] [Review][Defer] String "Transcrição pronta — revise se quiser" duplicada em `ChatComposer.tsx` e `TranscriptBlock.tsx` [apps/web/src/components/chat/ChatComposer.tsx, apps/web/src/components/chat/TranscriptBlock.tsx] — deferido, cleanup cosmético futuro
