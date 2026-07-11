# Story 4.4: Gerar Resumo Semanal

Status: planned

## Story

As a usuário querendo entender minha semana,
I want gerar um resumo semanal sob demanda,
so that eu veja os principais temas e emoções da semana de forma consolidada.

## Acceptance Criteria

1. **Given** um usuário com sessões na última semana, **when** ele clicar em “Gerar Resumo” e selecionar “Semana”, **then** uma Server Action gera um resumo com os top 5 tópicos, emoções dominantes e progresso.
2. **Given** o resumo gerado, **when** ele for exibido na tela de Insights, **then** ele aparece como texto e visualização simples, sem gráficos complexos.
3. **Given** o conteúdo do resumo, **when** ele for mostrado, **then** ele respeita privacidade e não expõe trechos literais sensíveis das conversas.

## Tasks / Subtasks

- [ ] Implementar a Server Action de resumo semanal.
- [ ] Apresentar o resumo na tela de Insights com o visual definido.
