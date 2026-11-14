# 0007 — Android via PWA instalável; TWA como evolução; Capacitor/React Native descartados

**Status:** aceita
**Contexto original:** Correct-course de 2026-11-13 (`_bmad-output/planning-artifacts/sprint-change-proposal-2026-11-13.md`), que criou o Epic 6

## Decisão

O app chega ao Android como **PWA instalável** (manifest + service worker mínimo escrito à mão,
sem `next-pwa`), conforme já previa o `architecture.md`. Não há app nativo nem publicação em loja
no MVP.

Regras que qualquer código futuro de PWA precisa respeitar:

- O service worker **só** guarda em cache a página offline e seus recursos estáticos. Nunca
  páginas autenticadas, respostas de `/api/chat`, Server Actions ou chamadas ao Supabase.
- Cada versão do service worker remove os caches das versões anteriores ao ativar, para que um
  deploy novo não deixe usuários presos em código antigo.
- O convite de instalação vive só em Configurações, sem banners nem pop-ups.
- O ícone é provisório (paleta Aura) e gerado num único ponto do código, para ser trocado pela
  arte final.

Se o beta mostrar necessidade de presença na Play Store, o caminho é empacotar **este mesmo PWA**
como **TWA** (Trusted Web Activity, via Bubblewrap ou PWABuilder), sem reescrever nada.

## Por quê

- **Capacitor** não serve: o app depende de Server Actions e Route Handlers, então não pode ser
  exportado como site estático. Um Capacitor apontando para a URL remota seria só um navegador
  embutido, e a Web Speech API (transcrição de voz, Story 2.3) **não está disponível no WebView do
  Android**.
- **React Native** reescreveria toda a UI, o que é desproporcional para um beta de 5 a 10
  pessoas e um desenvolvedor solo.
- **TWA já agora** custa conta de desenvolvedor Google Play (US$ 25), configuração de
  `assetlinks.json` e, para contas pessoais novas, teste fechado com cerca de 12 testadores por
  14 dias antes de publicar. Não há ganho para um beta por convite.
- **Cache restrito no service worker:** privacidade acima de tudo. Em um aparelho compartilhado,
  conteúdo de conversa em cache ficaria legível fora da sessão autenticada.

## Trade-off assumido

O app não aparece na Play Store, e os beta testers instalam pelo Chrome. Também não há uso
offline: sem conexão, o usuário vê só uma página explicando que as conversas precisam de internet.
Isso é coerente com o valor de honestidade (não criar a ilusão de uma capacidade que o app não tem).

## Onde isso aparece no código

Implementado pelas Stories 6.1 (instalável) e 6.2 (polimento mobile + convite de instalação). Os
arquivos esperados são `apps/web/src/app/manifest.ts`, `apps/web/public/sw.js`, os ícones em
`apps/web/src/app/` e a página `offline`. A wiki `docs/wiki/ui-e-navegacao.md` registra o estado
final ao concluir cada história.
