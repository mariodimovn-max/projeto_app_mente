---
titulo: LGPD, Exportação, Exclusão e Auditoria
epico: 5
status: completo
ultima_atualizacao: 2026-09-22
depende_de: [auth, conversa-e-memoria]
relacionado: []
decisoes: [0001-criptografia-tls-aes-sem-e2ee, 0004-audit-log-sem-fk]
tags: [lgpd, export, delete, auditoria, privacidade]
---

# LGPD, Exportação, Exclusão e Auditoria (Epic 5)

## O que faz

FR-8 completo: exportação de dados, deleção irreversível de conta, trilha de auditoria e política de
privacidade visível.

- **5.1 — Exportar Dados em JSON:** nova rota `/configuracoes`. Server Action `exportUserData`
  monta um payload aninhado (sessões → mensagens + síntese) + o agregado `user_patterns`; download
  100% client-side (Blob + `<a download>`). Criou a tabela `audit_log` (insert-only via RLS — o
  usuário não consegue ler a própria trilha) como pré-requisito do AC3, antes da Story 5.3 existir de
  fato; insert é best-effort (não bloqueia o download se falhar).
- **5.2 — Deletar Conta com Destruição Permanente:** botão "Excluir minha conta" em
  `/configuracoes`. Server Action `deleteAccount` grava em `audit_log` **de forma bloqueante** (a
  ordem "audita, depois destrói" é o próprio critério de aceite) e só então chama
  `admin.auth.admin.deleteUser`. Todas as tabelas de dados do usuário têm `ON DELETE CASCADE` a
  partir de `auth.users`, então não há delete explícito tabela a tabela. Criou `lib/supabase/admin.ts`
  — primeiro client do projeto com a `service_role` key, guardado com `typeof window` para nunca
  rodar no browser.
- **5.3 — Trilha de Auditoria para Eventos Sensíveis:** `login.ts` passou a gravar `audit_log`
  também (export e exclusão já gravavam). Corrigiu o problema descrito em
  [0004](../adr/0004-audit-log-sem-fk.md).
- **5.4 — Política de Privacidade e Indicadores Visíveis:** `PrivacySeal` (selo discreto + link
  "Como seus dados são usados") integrado a `ChatWindow`, `/historico`, `/historico/[sessionId]` e
  `/insights`; nova rota pública `/privacidade` (sem checagem de auth). Ver
  [0001](../adr/0001-criptografia-tls-aes-sem-e2ee.md) para a correção de copy sobre criptografia.

## Onde está no código

- `apps/web/src/lib/actions/exportData.ts`, `deleteAccount.ts`, `login.ts`
- `apps/web/src/lib/export/downloadJson.ts`
- `apps/web/src/lib/supabase/admin.ts`
- `apps/web/src/app/configuracoes/`, `apps/web/src/app/privacidade/`
- `apps/web/src/components/privacy/`, `apps/web/src/components/settings/`

## Decisões e padrões

- **Cap de linhas em queries de "todo o histórico do usuário" deve ordenar mais-recente-primeiro
  antes do `.limit()`, nunca ascendente.** Ordenar ascendente e cortar descarta os dados mais
  recentes, não os mais antigos — o oposto do esperado de uma exportação "completa" (achado real da
  revisão de código da Story 5.1). Vale para qualquer feature futura que pagine/capeie histórico do
  usuário.
- Export é best-effort na escrita de `audit_log`; exclusão de conta é bloqueante — a diferença é
  proposital (export pode falhar sem consequência de compliance; exclusão precisa da ordem
  "audita antes de destruir" garantida).

## Pendências

Ver [pendencias-manuais.md](pendencias-manuais.md) — variável de ambiente
`SUPABASE_SERVICE_ROLE_KEY` e migrations de `audit_log` e
`audit_log_survives_account_deletion` precisam ser configuradas/aplicadas manualmente; testes
manuais em navegador/Supabase real pendentes do usuário (Stories 5.1, 5.2, 5.3, 5.4).
