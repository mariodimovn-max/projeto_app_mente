# Índice da Wiki do Projeto

> Mapa de tópicos para orientação rápida — leia o arquivo relevante ao que você vai mexer, não a
> wiki inteira. Cada arquivo tem um cabeçalho (frontmatter) com `status`, `depende_de`,
> `relacionado` e `decisoes`, que apontam para outros tópicos e para `docs/adr/`.

| Tópico | Épico | Status | Quando consultar |
|---|---|---|---|
| [auth.md](auth.md) | 1 | completo | Mexendo em login, convite, sessão, RLS de autenticação |
| [conversa-e-memoria.md](conversa-e-memoria.md) | 2, 3 | completo | Chat, streaming, tom emocional, síntese, memória entre sessões, histórico |
| [insights-e-resumos.md](insights-e-resumos.md) | 4 | completo | Dashboard de indicadores, marcos pessoais, resumos semanal/mensal, PDF |
| [lgpd-e-privacidade.md](lgpd-e-privacidade.md) | 5 | completo | Exportação de dados, exclusão de conta, auditoria, política de privacidade |
| [ui-e-navegacao.md](ui-e-navegacao.md) | 4 + ajuste fora do sprint | completo | Navegação principal, layout da Home, saudação gerada por IA |
| [pendencias-manuais.md](pendencias-manuais.md) | transversal | em andamento | Antes de aplicar/verificar migrations, env vars, CI, runbooks de deploy |

## Como isso se relaciona com o resto da documentação

- `_bmad-output/planning-artifacts/` — planejamento **anterior** à implementação (PRD, UX,
  arquitetura, épicos). Fonte de verdade para *o que deveria ser construído*.
- `docs/adr/` — decisões pontuais e cross-cutting tomadas **durante** a implementação, que
  divergem ou refinam algo do planejamento original. Ver [docs/adr/index.md](../adr/index.md).
- `docs/wiki/` (este diretório) — estado atual **consolidado por tópico**, o que foi de fato
  construído e por quê. Substitui a leitura da seção "Estado atual" do `CLAUDE.md`, que agora só
  mantém uma lista curta apontando para cá.

## Convenção de manutenção

Ver a seção "Manutenção da documentação viva" em `CLAUDE.md` — atualizar o arquivo de tópico
correspondente (ou criar uma ADR) é parte da entrega de qualquer história ou decisão, não uma tarefa
separada.
