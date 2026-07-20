# Story 2.3: Gravar e Transcrever Mensagem por Voz

Status: done

## Story

As a usuário que prefere falar a digitar,
I want gravar uma mensagem de voz e vê-la transcrita automaticamente,
so that eu consiga conversar mesmo cansado ou sem vontade de digitar.

## Acceptance Criteria

1. **Given** a tela de conversa com o componente `MicButton` visível, **when** o usuário tocar no botão de microfone, **then** a gravação inicia com badge “Gravando...” e animação de waveform.
2. **Given** a gravação finalizada, **when** a Web Speech API transcrever o áudio, **then** o texto aparece para revisão e envio.
3. **Given** o usuário em modo de composição, **when** ele alternar entre digitar e gravar, **then** o conteúdo já preenchido não é perdido.
4. **Given** o fluxo de transcrição, **when** a mensagem for enviada, **then** apenas o texto transcrito é enviado ao backend.

## Tasks / Subtasks

- [x] Implementar gravação de áudio com o componente de microfone.
- [x] Integrar transcrição via Web Speech API e fluxo de envio.

### Review Findings

- [x] [Review][Patch] Microfone continua gravando em segundo plano após a transcrição/troca de modo (continuous:true nunca se autodesliga) [apps/web/src/lib/voice/useSpeechRecognition.ts:63] — corrigido: `continuous: false` (captura de um único enunciado; o navegador finaliza sozinho)
- [x] [Review][Patch] `start()` do hook não se protege contra chamada reentrante enquanto já está gravando [apps/web/src/lib/voice/useSpeechRecognition.ts:57] — corrigido: guarda via `recognitionRef.current`, com verificação de identidade da instância em `onresult`/`onerror`/`onend` para ignorar callbacks tardios de instâncias já substituídas
- [x] [Review][Patch] Trocar para a aba "Escrever" durante a gravação não para o reconhecimento ativo [apps/web/src/components/chat/ChatComposer.tsx:69] — corrigido, mesmo tratamento aplicado quando o composer fica `disabled` em andamento
- [x] [Review][Patch] Cleanup do unmount não desconecta os handlers do `recognition` antes do `stop()` [apps/web/src/lib/voice/useSpeechRecognition.ts:51] — corrigido
- [x] [Review][Patch] `recognition.start()` pode lançar erro síncrono sem tratamento, travando o status em "recording" [apps/web/src/lib/voice/useSpeechRecognition.ts:91] — corrigido com try/catch
- [x] [Review][Patch] `ERROR_MESSAGES` não mapeia o código "audio-capture" (sem microfone encontrado) [apps/web/src/lib/voice/useSpeechRecognition.ts:19] — corrigido
- [x] [Review][Patch] Falta foco no textarea e aviso `aria-live` ao voltar para o modo texto após transcrição (lacuna de acessibilidade e de copy do ux-patterns.md) [apps/web/src/components/chat/ChatComposer.tsx:21] — corrigido: foco automático no textarea + status "Transcrição pronta — revise se quiser"
- [x] [Review][Defer] Duplicação do mock `MockSpeechRecognition`/`createResultList` entre os dois arquivos de teste [apps/web/src/components/chat/ChatComposer.test.tsx, apps/web/src/lib/voice/useSpeechRecognition.test.ts] — deferido, cosmético/não bloqueante, vale extrair num cleanup futuro
- [x] [Review][Defer] Espaços duplicados ao concatenar transcrição com texto já digitado [apps/web/src/components/chat/ChatComposer.tsx:22] — deferido, edição fina da transcrição é escopo da Story 2.4
