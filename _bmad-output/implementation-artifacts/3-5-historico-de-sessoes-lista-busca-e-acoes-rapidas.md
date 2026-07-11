# Story 3.5: Histórico de Sessões — Lista, Busca e Ações Rápidas

Status: planned

## Story

As a usuário querendo revisitar conversas passadas,
I want ver uma lista cronológica das minhas sessões com busca por tema ou data,
so that eu encontre rapidamente uma conversa específica sem rolar tudo manualmente.

## Acceptance Criteria

1. **Given** um usuário com uma ou mais sessões concluídas, **when** ele acessar a tela de Histórico, **then** ele vê uma lista cronológica com data/hora, título gerado, chips de tema, badge de síntese disponível e selo de privacidade.
2. **Given** a lista de sessões, **when** o usuário buscar por palavra-chave ou tema, **then** os resultados aparecem em menos de 1 segundo.
3. **Given** um cartão de sessão, **when** o usuário deslizar para as ações rápidas, **then** ele consegue revisar, marcar ou excluir a sessão com confirmação.
4. **Given** um cartão selecionado, **when** ele for aberto, **then** a sessão completa com síntese é exibida.

## Tasks / Subtasks

- [ ] Implementar a tela de histórico e lista cronológica.
- [ ] Adicionar busca e ações rápidas por sessão.
