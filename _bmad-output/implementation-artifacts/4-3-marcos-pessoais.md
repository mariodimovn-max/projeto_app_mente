# Story 4.3: Marcos Pessoais

Status: planned

## Story

As a usuário com um objetivo de autoconhecimento específico,
I want definir um marco pessoal e acompanhar meu progresso nele,
so that eu tenha um foco de exploração ao longo do tempo.

## Acceptance Criteria

1. **Given** um usuário no dashboard, **when** ele criar um marco pessoal, **then** o marco é salvo e exibido na interface.
2. **Given** um marco salvo, **when** o sistema processar novas sessões, **then** o progresso é trackado com base em quantas vezes o tema do marco aparece em `user_patterns`.
3. **Given** um marco existente, **when** o usuário quiser, **then** ele consegue editá-lo ou removê-lo a qualquer momento.

## Tasks / Subtasks

- [ ] Implementar o cadastro e listagem de marcos pessoais.
- [ ] Calcular progresso a partir de `user_patterns`.
