# Story 1.6: Recuperação de Senha

Status: review

## Story

As a usuário que esqueceu sua senha,
I want solicitar uma redefinição de senha por email,
so that eu recupere o acesso à minha conta sem depender do administrador.

## Acceptance Criteria

1. **Given** um usuário com conta ativa que esqueceu a senha, **when** ele solicitar “Esqueci minha senha”, **then** um link de redefinição é enviado por email via Supabase Auth.
2. **Given** o link recebido por email, **when** o usuário clicar nele, **then** ele consegue definir uma nova senha.
3. **Given** a redefinição concluída, **when** a nova senha for salva, **then** ela substitui a anterior imediatamente.

## Tasks / Subtasks

- [x] Implementar o fluxo de esqueci minha senha.
- [x] Validar o fluxo completo de reset por email.

## Review Follow-ups (AI)

- [x] [AI-Review][High] Gate de sessão de `/auth/redefinir-senha` aceitava qualquer sessão autenticada, não só uma recém-verificada por link de recuperação — corrigido checando `amr` (authentication method reference) via `supabase.auth.getClaims()`.
- [x] [AI-Review][Med] Fallback de erro em `confirm/route.ts` mostrava a mensagem de "convite inválido" para links de recuperação malformados (token_hash ausente) — corrigido para usar a mensagem específica do `type` sempre que o `type` é reconhecido.
- [x] [AI-Review][Med] `setPassword` reutilizado pelo fluxo de recuperação mostrava a copy de "ativação de convite" em caso de erro — `setPassword` ganhou um parâmetro opcional de mensagem de erro (retrocompatível, Story 1.5 inalterada) e `RedefinirSenhaForm` passa uma mensagem própria.

## Dev Agent Record

### Implementation Plan

- **Solicitação (AC1):** nova página `/auth/esqueci-senha` com `EsqueciSenhaForm` (client component) chamando a Server Action `requestPasswordReset` (`apps/web/src/lib/actions/requestPasswordReset.ts`), que envolve `supabase.auth.resetPasswordForEmail(email)`. Segue a mesma diretriz de privacidade da 1.5: nunca revela se o e-mail existe — só retorna erro explícito no caso de rate limit (`status === 429`); qualquer outra resposta (sucesso ou "usuário não encontrado") leva à mesma mensagem genérica de sucesso na UI.
- **Link/confirmação (AC2):** `apps/web/src/app/auth/confirm/route.ts` (criado na Story 1.4 apenas para `type=invite`) passou a aceitar também `type=recovery`, com destino padrão próprio (`/auth/redefinir-senha`) e uma página de erro dedicada (`/auth?erro=link-invalido`) para não confundir com o erro de convite inválido. O template de e-mail "Reset Password" no dashboard do Supabase precisa ser configurado manualmente para apontar para `{SITE_URL}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/redefinir-senha` — mesmo padrão do convite documentado em `.env.example` (não foi possível editar esse arquivo nesta sessão: bloqueado pelas permissões do ambiente sandbox; ajuste manual necessário fora desta sessão).
- **Nova senha (AC3):** `/auth/redefinir-senha` reaproveita a Server Action `setPassword` (`supabase.auth.updateUser({ password })`) já existente da Story 1.4/1.5 — `verifyOtp({ type: "recovery" })` já deixa uma sessão ativa no cookie, então a troca de senha é imediata e não exige nenhuma action nova.
- Formulário de nova senha (`RedefinirSenhaForm`) duplica a validação de `DefinirSenhaForm` (senha ≥ 8 caracteres, confirmação) em vez de extrair uma abstração compartilhada — evita tocar em arquivos da Story 1.5 (ainda em review) e mantém cada tela de auth dona do seu próprio componente, seguindo o padrão já existente no diretório.

### Completion Notes

- 10 novos testes (form de solicitação, form de nova senha, páginas) + testes atualizados de `confirm/route.ts` (recovery) e `page.tsx` (mensagem de erro `link-invalido` e link "Esqueci minha senha"). Suite completa: 86 testes, todos passando. `tsc --noEmit` e `eslint` sem erros nos arquivos tocados.
- Não foi possível provisionar um projeto Supabase real neste ambiente (mesma limitação já registrada nas Stories 1.4/1.5): o fluxo foi validado via mocks de `supabase.auth.resetPasswordForEmail`/`verifyOtp`/`updateUser`, não contra um envio de e-mail real.

### Post-Review Fixes (AI code-review, 8 finder angles + 1-vote verify)

- ✅ Resolvido [High]: `/auth/redefinir-senha/page.tsx` inicialmente usava só `supabase.auth.getUser()` para o gate — provava que existia *alguma* sessão, mas não que ela veio de um link de recuperação recém-verificado (mesma fragilidade documentada em `definir-senha/page.tsx` desde a Story 1.4, nunca revisada após o login da 1.5). Como qualquer sessão de login comum (persistida por até ~400 dias) passaria no gate, um usuário já autenticado — ou qualquer um com acesso a uma sessão aberta em dispositivo compartilhado — conseguiria trocar a senha sem nunca ter clicado no link de recuperação. Corrigido trocando `getUser()` por `supabase.auth.getClaims()` e verificando se o `amr` (authentication method reference) da sessão contém o método `"recovery"` (suporta os dois formatos, `AMREntry[]` e `string[]` RFC-8176) — esse é o padrão oficial do Supabase para confirmar que a sessão realmente veio de um `verifyOtp({ type: "recovery" })`. `apps/web/src/app/auth/definir-senha/page.tsx` (Story 1.5, em review) não foi tocado — a mesma revisão nele fica registrada aqui como pendência para uma story futura, mas fora do escopo desta correção.
- ✅ Resolvido [Med]: em `confirm/route.ts`, quando `type=recovery` mas `token_hash` estava ausente/inválido, o fallback usava sempre a mensagem de "convite inválido" (`FALLBACK_INVALID_REDIRECT`), já que esse branch nunca consultava o mapa `INVALID_REDIRECT_BY_TYPE`. Corrigido reestruturando o `GET` para só cair no fallback genérico quando o `type` é desconhecido; com um `type` reconhecido (`invite`/`recovery`), a falha (token ausente ou `verifyOtp` com erro) sempre usa a mensagem específica desse `type`. Adicionado teste de regressão para `type=recovery` sem `token_hash`.
- ✅ Resolvido [Med]: `setPassword.ts` só tinha uma mensagem de erro fixa ("Não foi possível ativar sua conta agora"), escrita para o fluxo de ativação de convite (Story 1.4) e reaproveitada sem alteração pelo novo `RedefinirSenhaForm`, mostrando texto de "ativação" numa tela de redefinição de senha. Corrigido adicionando um segundo parâmetro opcional `errorMessage` a `setPassword` (com o texto antigo como default — comportamento de `DefinirSenhaForm`/Story 1.5 inalterado, testes existentes intactos) e fazendo `RedefinirSenhaForm` passar sua própria mensagem ("Não foi possível salvar sua nova senha agora").
- Achados de menor severidade do code-review (cobertura de teste para o combo `type=recovery` + `next` malicioso, tabelas de lookup em `confirm/route.ts` possivelmente sobre-engenheiradas para 2 casos, duplicação entre `RedefinirSenhaForm`/`DefinirSenhaForm`) não foram endereçados nesta rodada — usuário aprovou aplicar apenas os 3 achados de maior severidade.
- Suite completa após as correções: **90 testes passando** (4 novos: 1 em `confirm/route.test.ts`, 1 em `setPassword.test.ts`, 2 em `redefinir-senha/page.test.tsx`), `tsc --noEmit` e `eslint` sem erros.

## File List

- `apps/web/src/app/auth/confirm/route.ts` (modificado — suporte a `type=recovery`)
- `apps/web/src/app/auth/confirm/route.test.ts` (modificado)
- `apps/web/src/app/auth/page.tsx` (modificado — mensagem de erro `link-invalido` e link "Esqueci minha senha")
- `apps/web/src/app/auth/page.test.tsx` (modificado)
- `apps/web/src/app/auth/esqueci-senha/page.tsx` (novo)
- `apps/web/src/app/auth/esqueci-senha/page.test.tsx` (novo)
- `apps/web/src/app/auth/esqueci-senha/EsqueciSenhaForm.tsx` (novo)
- `apps/web/src/app/auth/esqueci-senha/EsqueciSenhaForm.test.tsx` (novo)
- `apps/web/src/app/auth/redefinir-senha/page.tsx` (novo)
- `apps/web/src/app/auth/redefinir-senha/page.test.tsx` (novo)
- `apps/web/src/app/auth/redefinir-senha/RedefinirSenhaForm.tsx` (novo; ajustado no review para enviar mensagem de erro própria)
- `apps/web/src/app/auth/redefinir-senha/RedefinirSenhaForm.test.tsx` (novo; ajustado no review)
- `apps/web/src/lib/actions/requestPasswordReset.ts` (novo)
- `apps/web/src/lib/actions/requestPasswordReset.test.ts` (novo)
- `apps/web/src/lib/actions/setPassword.ts` (modificado no review — parâmetro opcional `errorMessage`, retrocompatível)
- `apps/web/src/lib/actions/setPassword.test.ts` (modificado no review — novo teste do parâmetro)

## Change Log

- 2026-07-13: Implementado fluxo completo de recuperação de senha (solicitação por e-mail, link de confirmação `type=recovery`, definição da nova senha) — Story 1.6.
- 2026-07-13: Aplicadas 3 correções de code review (gate de sessão de `/auth/redefinir-senha` baseado em `amr`/recovery, mensagem de erro do `confirm/route.ts` correta por `type`, mensagem de erro de `setPassword` específica para o fluxo de redefinição) — 90 testes passando.
