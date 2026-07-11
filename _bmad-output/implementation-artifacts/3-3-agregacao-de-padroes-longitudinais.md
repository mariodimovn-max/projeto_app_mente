# Story 3.3: Agregação de Padrões Longitudinais

Status: planned

## Story

As a desenvolvedor construindo a base para insights de longo prazo,
I want que temas, emoções e gatilhos recorrentes sejam agregados automaticamente após cada sessão,
so that o dashboard e os resumos periódicos leiam um agregado pronto, sem recalcular do zero.

## Acceptance Criteria

1. **Given** uma síntese de sessão recém-gerada, **when** o processo de encerramento de sessão for concluído, **then** a tabela `user_patterns` é atualizada com os temas, emoções e gatilhos identificados.
2. **Given** o agregado em andamento, **when** a sessão terminar, **then** o valor é incremental e incorpora o histórico acumulado do usuário.
3. **Given** o uso do histórico para análise, **when** for a primeira vez, **then** um aviso de privacidade é exibido ao usuário antes da análise.

## Tasks / Subtasks

- [ ] Implementar a atualização incremental de `user_patterns`.
- [ ] Garantir a exposição do aviso de privacidade na primeira análise.
