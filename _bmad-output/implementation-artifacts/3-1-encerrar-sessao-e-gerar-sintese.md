# Story 3.1: Encerrar Sessão e Gerar Síntese

Status: planned

## Story

As a usuário concluindo uma conversa,
I want receber uma síntese do que foi conversado ao encerrar a sessão (ou após 60 min de inatividade),
so that eu saia com clareza sobre o que foi explorado, não apenas com uma conversa que “só acabou”.

## Acceptance Criteria

1. **Given** uma sessão de conversa ativa com pelo menos uma troca de mensagens, **when** o usuário clicar em “Encerrar sessão” ou 60 minutos se passarem sem atividade, **then** uma síntese é gerada via Server Action separada do fluxo de chat.
2. **Given** a síntese gerada, **when** ela for criada, **then** ela contém o que foi explorado, padrões identificados e uma pergunta aberta para reflexão futura.
3. **Given** a síntese concluída, **when** o processo for encerrado, **then** ela é salva na tabela `session_syntheses` e exibida no componente `SynthesisCard`.
4. **Given** o encerramento por inatividade, **when** ocorrer, **then** ele acontece automaticamente em background sem exigir ação do usuário.

## Tasks / Subtasks

- [ ] Implementar o fluxo de encerramento e geração de síntese.
- [ ] Persistir a síntese e apresentá-la na UI.
