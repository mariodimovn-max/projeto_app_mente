# Story 4.5: Gerar Resumo Mensal

Status: planned

## Story

As a usuário querendo entender meu último mês,
I want gerar um resumo mensal sob demanda,
so that eu veja padrões e tendências de longo prazo que uma semana não revela.

## Acceptance Criteria

1. **Given** um usuário com sessões no último mês, **when** ele clicar em “Gerar Resumo” e selecionar “Mês”, **then** uma Server Action gera um resumo com padrões de longo prazo, evolução e tendências.
2. **Given** o resumo mensal, **when** ele for mostrado, **then** ele usa o mesmo padrão visual do resumo semanal.
3. **Given** o contexto de longo prazo, **when** o resumo for criado, **then** ele usa os dados agregados e não depende do histórico bruto completo.

## Tasks / Subtasks

- [ ] Implementar a Server Action de resumo mensal.
- [ ] Reaproveitar o componente visual do resumo semanal.
