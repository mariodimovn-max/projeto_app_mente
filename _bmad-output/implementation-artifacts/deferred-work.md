# Trabalho adiado

## Deferred from: code review of 2-3-gravar-e-transcrever-mensagem-por-voz (2026-07-20)

- Duplicação do mock `MockSpeechRecognition`/`createResultList` entre `apps/web/src/components/chat/ChatComposer.test.tsx` e `apps/web/src/lib/voice/useSpeechRecognition.test.ts` — extrair para um utilitário de teste compartilhado num cleanup futuro.
- Espaços duplicados ao concatenar uma nova transcrição com texto já digitado no composer (`apps/web/src/components/chat/ChatComposer.tsx:22`) — a edição fina da transcrição antes do envio é escopo da Story 2.4 (Editar Transcrição Antes de Enviar).

## Deferred from: code review of 2-4-editar-transcricao-antes-de-enviar (2026-07-20)

- Botões de modo ("Escrever"/"Falar") nunca recebem `disabled={disabled}` — pré-existente desde a Story 2.1, fora do escopo desta story.
- `title` do botão de microfone foi perdido na Story 2.3 (só `aria-label` cobre leitor de tela, não hover do mouse) — cosmético.
- Texto/botões novos abaixo do NFR de fonte mínima de 14px (`.transcriptionStatus`, `.recordingBadge`, botões de ação de voz) — tensão real com o NFR, mas o padrão já existe no componente desde a Story 2.1 (`.counter` etc.); precisa de uma decisão de escala tipográfica do design system, não um patch pontual.
- String "Transcrição pronta — revise se quiser" hardcoded em dois arquivos (`ChatComposer.tsx` e `TranscriptBlock.tsx`) — extrair para uma constante compartilhada num cleanup futuro.
