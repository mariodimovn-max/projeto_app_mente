---
name: dev-story
description: Conduz o ciclo COMPLETO de implementação de uma história BMAD, ponta a ponta — leitura dos Acceptance Criteria, implementação com a persona Dev do BMAD, checkpoint de commit, code review adversarial em contexto limpo (via /clear), testes automatizados, teste manual verificado item a item contra cada AC, e fechamento com push. Use quando o usuário digitar "/dev-story", disser "desenvolve a história X", "implementa a story X do início ao fim" ou pedir para tocar uma história do BMAD com checkpoint de commit e revisão inclusos. NÃO use para apenas iniciar/continuar a implementação sem esses checkpoints (isso é o bmad-dev-story) nem para revisar código que já foi escrito e commitado (isso é o bmad-code-review).
---

Você vai conduzir o ciclo completo de desenvolvimento da história indicada pelo usuário (nome ou caminho do arquivo da história). Se não vier explícito no pedido, pergunte antes de continuar.

Siga estas fases **na ordem**, sem pular etapas. Cada fase tem um objetivo específico — não misture as responsabilidades entre elas.

## Fase 1 — Preparação
- Leia a história indicada e liste os Acceptance Criteria (AC) de forma explícita, numerados.
- Confirme se há dependências ou pré-requisitos não resolvidos (outras histórias, schema de banco, variáveis de ambiente, etc.).
- Se algo estiver ambíguo ou faltando, pare e pergunte antes de prosseguir.

## Fase 2 — Desenvolvimento (persona Dev)
- Assuma a persona de desenvolvimento do BMAD (Amelia) e implemente a história.
- Ao final, resuma o que foi alterado (arquivos, principais decisões técnicas).
- **Não faça code review nem teste nesta fase.**

## Fase 3 — Checkpoint de commit
- Faça um commit local com uma mensagem descritiva referenciando a história (ex: `feat(story-X): implementa Y`).
- Não dê push ainda.

## Fase 4 — Code review em contexto limpo
- Antes de revisar, rode `/clear` (ou avise que está iniciando uma análise crítica independente, sem viés do que acabou de ser escrito).
- Revise o código gerado como se fosse um revisor externo: qualidade, aderência aos padrões do projeto (`CLAUDE.md`), possíveis bugs, edge cases não tratados.
- Liste os problemas encontrados, se houver, e corrija antes de prosseguir. Se corrigir algo, volte à Fase 3 (novo commit) antes de continuar.

## Fase 5 — Testes automatizados
- Rode lint, typecheck e os testes unitários/integração existentes no projeto.
- Corrija falhas antes de prosseguir.

## Fase 6 — Teste manual amarrado aos AC
- Suba a aplicação em localhost.
- Para cada Acceptance Criteria listado na Fase 1, verifique explicitamente se o comportamento observado atende ao critério. Reporte item por item (✅/❌), não um teste exploratório solto.
- Se algum AC falhar, volte à Fase 2 para corrigir.

## Fase 7 — Fechamento
- Atualize o status da história no BMAD para concluída.
- Avalie se algo dessa história merece entrar no `CLAUDE.md`. Só inclua se for:
  - uma convenção ou padrão novo que vai se repetir em outras histórias (ex: forma de nomear rotas, padrão de tratamento de erro);
  - uma decisão arquitetural que afeta histórias futuras (ex: escolha de biblioteca, estrutura de pastas);
  - uma armadilha ou gotcha que valeria a pena não repetir.
  Não inclua: detalhes específicos da história (isso já está no arquivo da própria história), explicações longas, ou histórico do que foi feito. Se decidir atualizar, adicione a informação de forma enxuta (1-3 linhas) na seção apropriada existente — não crie seções novas sem necessidade, e não deixe o arquivo crescer sem revisar se algo antigo já ficou obsoleto.
- Faça o commit final referenciando a história e dê push.
- Resuma o que foi entregue.

Ao final de cada fase, indique claramente em qual fase você está (ex: "**Fase 3 — Checkpoint de commit**") para facilitar o acompanhamento.
