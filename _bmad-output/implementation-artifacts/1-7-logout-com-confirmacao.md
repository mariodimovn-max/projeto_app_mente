# Story 1.7: Logout com Confirmação

Status: review

## Story

As a usuário autenticado,
I want encerrar minha sessão explicitamente com uma confirmação,
so that eu tenha controle claro sobre quando saio da minha conta.

## Acceptance Criteria

1. **Given** um usuário autenticado navegando no app, **when** ele selecionar “Sair” no menu ou configurações, **then** uma confirmação é exibida antes de encerrar a sessão.
2. **Given** a confirmação exibida, **when** o usuário confirmar, **then** a sessão é encerrada e ele é redirecionado para a tela de login/onboarding.
3. **Given** a confirmação exibida, **when** o usuário cancelar, **then** o estado atual é preservado sem alteração.

## Tasks / Subtasks

- [x] Implementar o fluxo de logout com confirmação.
- [x] Garantir a invalidação da sessão após confirmação.

## Dev Agent Record

### Implementation Plan

- **Ponto de entrada (AC1):** o projeto ainda não tem menu/configurações nem nenhum app shell autenticado (`layout.tsx` é só `<html><body>`, sem nav; `/` é a única página que serve tanto onboarding público quanto pós-login, já que `login`/`setPassword` redirecionam para `"/"`). Optei por um header mínimo e persistente (`apps/web/src/app/page.tsx`), renderizado como Server Component só quando `supabase.auth.getUser()` retorna um usuário — mesmo padrão de gate já usado em `auth/definir-senha/page.tsx`. Esse header é a infraestrutura que futuras stories de navegação (Epic 4) vão expandir; escopo desta story ficou deliberadamente restrito ao botão "Sair" (sem exibir e-mail nem menu, para não inventar UI além do pedido).
- **Confirmação (AC1/AC3):** `apps/web/src/app/LogoutButton.tsx` (client component, colocado ao lado de `page.tsx` — segue a convenção real do repo de colocar componentes junto da página que os usa, como `LoginForm.tsx` em `app/auth/`, não a árvore `components/` ainda inexistente do `architecture.md`). Não existe nenhum componente de dialog/modal no repo nem no design system, então construí um diálogo controlado por `useState` (sem `<dialog>` nativo — `HTMLDialogElement.showModal()` não é implementado pelo jsdom, o que quebraria os testes) com `role="alertdialog"`, `aria-modal`, foco automático no botão "Cancelar" ao abrir (evita confirmação acidental por Enter) e fechamento por Esc — atende ao NFR de acessibilidade WCAG 2.1 AA do projeto. Cancelar apenas fecha o diálogo (`setConfirming(false)`), sem chamar a Server Action — estado anterior preservado (AC3).
- **Invalidação de sessão e redirecionamento (AC2):** nova Server Action `apps/web/src/lib/actions/logout.ts`, mesmo formato de `login.ts`/`setPassword.ts` — usa `createClient()` de `@/lib/supabase/server` (client que grava cookies, ao contrário do client de Server Component) e chama `supabase.auth.signOut()`. Só chama `redirect("/")` quando `signOut()` não retorna erro — isso é o que garante a invalidação da sessão antes do redirecionamento (task 2), em vez de assumir sucesso silenciosamente. Redireciona para `"/"` (não `/auth`) por consistência com o padrão já estabelecido por `login.ts`/`setPassword.ts` (ambos redirecionam para `"/"`) e porque `"/"` é literalmente a tela de onboarding citada no AC — sem sessão, ela volta a mostrar o conteúdo público de onboarding com o CTA "Começar sessão" para `/auth`.
- Em caso de falha do `signOut()` (ex.: rede instável), o erro é exibido dentro do próprio diálogo (`role="alert"`, mesmo padrão visual de `--color-error` usado em `LoginForm`/`EsqueciSenhaForm`) sem fechar a confirmação, permitindo nova tentativa.

### Completion Notes

- 6 novos testes: `logout.test.ts` (Server Action — sucesso com `signOut`+`redirect`, e falha sem redirecionar) e `LogoutButton.test.tsx` (não mostra confirmação até clicar "Sair"; mostra `alertdialog` ao clicar; cancelar fecha sem chamar a action; confirmar chama a action; erro da action é exibido sem fechar o diálogo). `page.test.tsx` atualizado para o novo padrão de Server Component assíncrono (`const element = await HomePage(); render(element)`, mesmo padrão de `definir-senha/page.test.tsx`), com `LogoutButton` mockado e dois novos casos (header ausente sem sessão / presente com sessão).
- Suite completa: **99 testes passando**. `tsc --noEmit` e `eslint` sem erros nos arquivos tocados.
- Mesma limitação já registrada nas Stories 1.4–1.6: não foi possível provisionar um projeto Supabase real neste ambiente nem ler `.env.local` (bloqueado pelas permissões do sandbox), então o fluxo de `signOut()` foi validado via mocks, não contra uma sessão real. O fluxo de UI (abrir/cancelar/confirmar diálogo) não pôde ser verificado num navegador real por falta de sessão autenticada disponível neste ambiente — validado via testes automatizados (RTL) e leitura cuidadosa do código.
- Não criei um `app/settings/` nem um menu de navegação (fora do escopo da story e do MVP conforme `ux-patterns.md`, que recomenda evitar "menu complexo"); o botão "Sair" fica num header mínimo na home. Vale sinalizar ao PM/UX que a Story 1.7, como escrita, presume um "menu/configurações" que ainda não existe no produto — decisão de onde o logout deve viver a longo prazo (Epic 4) fica em aberto.

### Post-Review Fixes (AI code-review, 8 ângulos + 1-voto verify)

- ✅ Resolvido [Alto, a11y]: o diálogo de confirmação não tinha focus trap — Tab/Shift+Tab escapavam para o botão "Sair" original (ainda montado atrás do overlay) ou para o conteúdo da página, violando o NFR de WCAG 2.1 AA. Corrigido de duas formas complementares em `LogoutButton.tsx`: (1) o botão de disparo e o diálogo agora são mutuamente exclusivos (o componente retorna ou um ou outro, nunca os dois ao mesmo tempo), então o botão "Sair" original não existe mais no DOM enquanto o diálogo está aberto; (2) `handleDialogKeyDown` agora também intercepta Tab/Shift+Tab e faz o foco ciclar apenas entre "Cancelar" e "Sair" (confirmar) do próprio diálogo.
- ✅ Resolvido [Alto, a11y]: o botão de disparo e o botão de confirmação tinham o mesmo nome acessível "Sair" simultaneamente no DOM enquanto o diálogo estava aberto. Resolvido pela mesma mudança de renderização mutuamente exclusiva acima — só existe um "Sair" por vez.
- ✅ Resolvido [Médio]: um usuário já autenticado que caísse em "/" via `login`/`setPassword` via UI contraditória — o header com "Sair" e, logo abaixo, o CTA "Começar sessão" apontando para `/auth`. Corrigido em `page.tsx`: a área de ações agora mostra "Você já está conectado." em vez do CTA quando há sessão (o aviso de risco imediato continua sempre visível, por ser uma informação de segurança independente do estado de autenticação).
- ✅ Resolvido [Médio, eficiência/NFR]: `page.tsx` chamava `supabase.auth.getUser()` a cada requisição para "/", duplicando a chamada que `apps/web/src/proxy.ts` já faz para a mesma rota (o matcher do proxy cobre "/") e tirando a home — antes estática — da renderização estática do Next.js, na contramão do NFR "Carregamento home < 2s em 4G". Corrigido repassando o resultado do `getUser()` já feito em `proxy.ts` via um header interno de request (`SESSION_USER_HEADER`, mecanismo oficial `NextResponse.next({ request })` do Next — confirmado lendo `node_modules/next/dist/server/web/spec-extension/response.js` desta versão, não só por suposição); `page.tsx` agora só lê esse header via `headers()` em vez de instanciar um client Supabase e ir à rede de novo. Elimina a segunda ida à rede; a página continua dinâmica (ler `headers()` também é uma API dinâmica no modelo atual sem PPR), mas sem o round-trip duplicado ao Supabase Auth.
- ✅ Resolvido [Baixo, robustez]: `getUser()` em `page.tsx` não tinha tratamento de erro — uma falha do Supabase Auth derrubaria a única página que um visitante deslogado sempre consegue acessar. Corrigido envolvendo a leitura de sessão em try/catch (`hasAuthenticatedSession`), degradando para o conteúdo público de onboarding em vez de lançar exceção.
- ✅ Resolvido [Baixo, reuse]: `.errorMessage` em `LogoutButton.module.css` duplicava byte a byte a regra já existente em `auth/page.module.css`, apesar do mesmo arquivo já usar `composes` de `shared.module.css` para outro elemento. Corrigido extraindo `.errorMessage` para `apps/web/src/styles/shared.module.css` e fazendo os dois arquivos consumirem via `composes`.
- Não endereçado (achado de menor severidade, não-bloqueante): o diálogo de confirmação não foi extraído como componente reutilizável — a Story 5.2 (exclusão de conta) provavelmente vai precisar de UX de confirmação parecida. Decisão deliberada de não abstrair a partir de um único uso (`CLAUDE.md`: "Simplicidade de manutenção", evitar design para requisitos hipotéticos); revisitar quando a Story 5.2 for implementada.
- Testes novos/ajustados nesta rodada: `LogoutButton.test.tsx` (nome acessível único durante a confirmação, fechar com Escape, focus trap em Tab e Shift+Tab), `page.test.tsx` (reescrito para mockar `next/headers`/`@/proxy` em vez de `@/lib/supabase/server`, novo caso do CTA substituído), `proxy.test.ts` (header de sessão repassado com/sem usuário, cookies preservados após o repasse do header — e corrigido um vazamento de mock entre testes que só apareceu ao adicionar os novos casos: `createServerClientMock` não tinha sua implementação restaurada no `beforeEach`, só `mockClear()`, então um `mockImplementation` de um teste anterior sobrevivia para os seguintes).
- Suite completa após as correções: **107 testes passando** (11 novos/ajustados). `tsc --noEmit` e `eslint` sem erros.

## File List

- `apps/web/src/lib/actions/logout.ts` (novo)
- `apps/web/src/lib/actions/logout.test.ts` (novo)
- `apps/web/src/app/LogoutButton.tsx` (novo; ajustado no review — renderização mutuamente exclusiva entre botão e diálogo, focus trap em Tab/Shift+Tab)
- `apps/web/src/app/LogoutButton.module.css` (novo; ajustado no review — `.errorMessage` via `composes`)
- `apps/web/src/app/LogoutButton.test.tsx` (novo; ajustado no review — testes de nome acessível único, Escape e focus trap)
- `apps/web/src/app/page.tsx` (modificado — vira Server Component assíncrono; ajustado no review para ler sessão via header repassado pelo `proxy.ts` em vez de chamar Supabase diretamente, com try/catch e CTA condicional)
- `apps/web/src/app/page.module.css` (modificado — novo estilo `.appHeader`)
- `apps/web/src/app/page.test.tsx` (modificado — adaptado para Server Component assíncrono; ajustado no review para mockar `next/headers`/`@/proxy`)
- `apps/web/src/proxy.ts` (ajustado no review — repassa `getUser()` via header `SESSION_USER_HEADER` para os Server Components)
- `apps/web/src/proxy.test.ts` (ajustado no review — testes do header de sessão e correção de vazamento de mock entre testes)
- `apps/web/src/app/auth/page.module.css` (ajustado no review — `.errorMessage` via `composes`)
- `apps/web/src/styles/shared.module.css` (ajustado no review — novo `.errorMessage` compartilhado)

## Change Log

- 2026-07-15: Implementado fluxo completo de logout com confirmação (diálogo acessível `alertdialog`, Server Action `logout` com invalidação de sessão via `supabase.auth.signOut()` e redirecionamento condicionado ao sucesso) — Story 1.7. 99 testes passando.
- 2026-07-15: Aplicadas 6 correções de code review (focus trap e nome acessível único no diálogo, CTA contraditório para usuário autenticado, header de sessão repassado por `proxy.ts` em vez de segunda chamada a `getUser()`, tratamento de erro em `page.tsx`, `.errorMessage` compartilhado via `composes`) — 107 testes passando.
