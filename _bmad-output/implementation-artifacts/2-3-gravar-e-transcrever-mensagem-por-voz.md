# Story 2.3: Gravar e Transcrever Mensagem por Voz

Status: planned

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

- [ ] Implementar gravação de áudio com o componente de microfone.
- [ ] Integrar transcrição via Web Speech API e fluxo de envio.
