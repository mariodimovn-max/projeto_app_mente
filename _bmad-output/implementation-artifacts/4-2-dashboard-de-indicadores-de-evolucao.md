# Story 4.2: Dashboard de Indicadores de Evolução

Status: planned

## Story

As a usuário acompanhando meu progresso,
I want ver um resumo simples de dias consecutivos, sessões, temas e tendência emocional,
so that eu perceba minha evolução sem métricas de gamification.

## Acceptance Criteria

1. **Given** um usuário com pelo menos uma sessão concluída e `user_patterns` populado, **when** ele acessar a tela Início, **then** ele vê dias consecutivos de uso, total de sessões completadas, temas explorados e tendência emocional dos últimos 7 dias.
2. **Given** os dados de dashboard, **when** eles forem carregados, **then** eles vêm do agregado pré-computado e não exigem recalcular a partir das mensagens brutas.
3. **Given** a tela de evolução, **when** o usuário observar o conteúdo, **then** nenhum elemento de gamification é exibido.

## Tasks / Subtasks

- [ ] Implementar o dashboard de indicadores básicos.
- [ ] Carregar os dados do agregado `user_patterns`.
