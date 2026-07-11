# Story 4.6: Exportar Resumo em PDF

Status: planned

## Story

As a usuário que quer guardar ou compartilhar um resumo,
I want exportar um resumo semanal ou mensal em PDF,
so that eu tenha um registro fora do app.

## Acceptance Criteria

1. **Given** um resumo semanal ou mensal já gerado, **when** o usuário selecionar “Exportar PDF”, **then** um arquivo PDF é gerado com o conteúdo formatado de forma legível.
2. **Given** o arquivo gerado, **when** o usuário confirmar a ação, **then** o download inicia imediatamente sem etapas extras.
3. **Given** a implementação da exportação, **when** ela for escolhida, **then** a biblioteca de geração de PDF é definida como parte da implementação da história.

## Tasks / Subtasks

- [ ] Implementar a exportação de resumo para PDF.
- [ ] Garantir download imediato e formatação legível.
