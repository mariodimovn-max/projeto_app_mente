# Story 2.7: Indicador de Resposta em Andamento e Recuperação de Erros

Status: planned

## Story

As a usuário aguardando ou enfrentando uma falha no envio,
I want ver um indicador claro de que o agente está pensando, e uma forma simples de tentar de novo se algo falhar,
so that eu nunca fique sem saber o que está acontecendo ou perca minha mensagem.

## Acceptance Criteria

1. **Given** uma mensagem enviada e aguardando resposta do agente, **when** a requisição estiver em andamento, **then** um indicador visual orgânico é exibido com a copy “Estou pensando sobre o que você trouxe...”.
2. **Given** uma falha no envio, **when** o usuário observar a interface, **then** uma mensagem breve e gentil é exibida com botão explícito de “Tentar novamente”.
3. **Given** a falha de requisição, **when** ela ocorrer, **then** não há retry automático silencioso.
4. **Given** uma mensagem original do usuário, **when** a requisição falhar, **then** a mensagem não é perdida e pode ser reprocessada.

## Tasks / Subtasks

- [ ] Implementar indicador de carregamento e estados de erro no chat.
- [ ] Garantir recuperação manual sem duplicação silenciosa.
