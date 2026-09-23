# Índice de Decisões Arquiteturais (ADR)

> Decisões pontuais e cross-cutting tomadas durante a implementação, que divergem, refinam ou
> destacam algo do `architecture.md` original. Cada uma vale por si — leia a que for relevante ao
> tópico em questão, não a lista inteira.

| # | Título | Afeta |
|---|---|---|
| [0001](0001-criptografia-tls-aes-sem-e2ee.md) | Criptografia em trânsito (TLS) e em repouso (AES-256), não E2EE literal | Qualquer copy ou feature que mencione criptografia/privacidade |
| [0002](0002-jspdf-v4-por-cve.md) | jsPDF v4.x, nunca v2.5.x (CVE crítico) | Geração de PDF (resumos semanal/mensal) |
| [0003](0003-streak-timezone-fixo.md) | Agregações por "dia" usam America/Sao_Paulo fixo, não UTC nem por-usuário | Qualquer feature que agrupe dados por dia de calendário |
| [0004](0004-audit-log-sem-fk.md) | `audit_log.user_id` sem FK — sobrevive à exclusão da conta | Trilha de auditoria, exclusão de conta |
| [0005](0005-resumo-deterministico-sem-ia.md) | Resumos periódicos calculados deterministicamente, sem nova chamada à IA | Resumos semanal/mensal, qualquer feature futura de agregação de insights |

## Convenção

- Numeração sequencial, sem reuso.
- Uma decisão por arquivo; se uma decisão for revertida, criar uma nova ADR que a substitui e linkar
  as duas — nunca editar o registro histórico do porquê a decisão original foi tomada.
- Ao tomar uma decisão pontual nova durante uma história, criar a ADR e adicioná-la a esta tabela
  como parte da própria entrega (ver seção "Manutenção da documentação viva" em `CLAUDE.md`).
