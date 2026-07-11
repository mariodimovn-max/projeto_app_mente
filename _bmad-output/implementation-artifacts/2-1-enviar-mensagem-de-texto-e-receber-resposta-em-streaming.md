# Story 2.1: Enviar Mensagem de Texto e Receber Resposta em Streaming

Status: planned

## Story

As a usuário autenticado,
I want enviar uma mensagem de texto para o agente e ver a resposta chegando em tempo real,
so that eu possa conversar de forma fluida sem esperar a resposta completa carregar.

## Acceptance Criteria

1. **Given** um usuário autenticado sem sessão de conversa ativa, **when** ele digitar uma mensagem entre 10 e 5000 caracteres e enviar, **then** uma nova sessão é criada e a mensagem é salva associada a ela.
2. **Given** a mensagem enviada, **when** ela for processada, **then** a requisição é enviada ao Route Handler `/api/chat` com runtime Node.js e a resposta do agente chega em streaming.
3. **Given** a resposta chegando em tempo real, **when** o usuário observar a interface, **then** a mensagem do agente aparece incrementalmente na tela.
4. **Given** o streaming concluído, **when** a resposta final for recebida, **then** ela é salva em `messages` e o histórico exibe timestamp para cada mensagem.
5. **Given** mensagens fora do intervalo permitido, **when** o usuário tentar enviar, **then** a interface rejeita com validação clara.

## Tasks / Subtasks

- [ ] Implementar o envio de mensagem e o fluxo de chat.
- [ ] Garantir streaming de resposta e persistência de mensagens.
