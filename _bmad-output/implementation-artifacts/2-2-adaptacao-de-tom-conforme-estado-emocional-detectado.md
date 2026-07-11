# Story 2.2: Adaptação de Tom Conforme Estado Emocional Detectado

Status: planned

## Story

As a usuário conversando com o agente,
I want que o agente ajuste seu tom conforme meu estado emocional aparente,
so that eu me sinta genuinamente compreendido, não respondido de forma genérica.

## Acceptance Criteria

1. **Given** uma mensagem do usuário contendo sinais de melancolia, confiança excessiva, confusão ou neutralidade, **when** o Route Handler processar a mensagem, **then** o estado emocional é identificado pela lógica já portada.
2. **Given** o estado emocional detectado, **when** a resposta for gerada, **then** o tom reflete o perfil apropriado: reconfortante, reflexivo-provocador, estruturante ou equilibrado.
3. **Given** a resposta do agente, **when** ela for exibida, **then** ela integra as quatro perspectivas filosóficas de forma orgânica, sem citar os nomes explicitamente.
4. **Given** sinais de intensidade emocional, **when** a resposta for produzida, **then** o comprimento é adaptado para não parecer excessivo nem superficial.

## Tasks / Subtasks

- [ ] Integrar a detecção emocional ao fluxo de resposta.
- [ ] Ajustar o estilo de resposta com base no tom mapeado.
