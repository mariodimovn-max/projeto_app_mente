# Story 2.4: Editar Transcrição Antes de Enviar

Status: planned

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

- [ ] Implementar o componente de transcrição editável.
- [ ] Garantir que a edição seja refletida antes do envio da mensagem.
