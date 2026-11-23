# 0009: Link de convite/recuperação só consome o token com um clique (POST), nunca ao abrir (GET)

**Status:** aceita
**Contexto original:** primeiros convites do beta, 2026-11-23

## Decisão

Abrir `/auth/confirm?token_hash=...&type=...` **não** consome o token de uso único. A página só
mostra o botão "Ativar meu convite" (ou "Continuar", na recuperação). O `verifyOtp` roda na Server
Action `confirmOtpLink`, disparada pelo envio do formulário (POST).

- Formato do link inalterado: `scripts/invite-beta.ts --link` e os templates em
  `supabase/templates/*.html` continuam apontando para o mesmo endereço.
- Regras compartilhadas (types aceitos, destinos, proteção contra open redirect do `next`) ficam
  em `apps/web/src/lib/auth/otpLink.ts`.
- **Nenhuma rota pública deve consumir um token de uso único num GET.** Isso vale para qualquer
  link futuro do mesmo tipo (confirmação de e-mail, troca de e-mail, magic link).

## Por quê

No primeiro convite enviado pelo WhatsApp, o link foi gasto cerca de 1 minuto depois de gerado,
sem que a testadora tocasse nele. A conta apareceu como confirmada no Supabase, e ela recebeu
"convite inválido". Quem gastou o link foi a **prévia de link do WhatsApp**: o aplicativo abre a URL
assim que ela é colada, para montar o cartão de prévia.

Filtros de e-mail corporativo (como o Safe Links do Microsoft 365) fazem o mesmo. A rota antiga
(`route.ts`) chamava `verifyOtp` direto no GET, então qualquer robô que abrisse o link queimava o
convite e ficava com a sessão.

Esses robôs fazem GET e não enviam formulários. Exigir o clique é a mitigação que o próprio
Supabase recomenda para esse problema.

## Limite conhecido

O link padrão do Supabase (`.../auth/v1/verify?...`, que redireciona para `/auth/callback`; ver
[ADR 0006](0006-fluxo-implicito-templates-email-free-tier.md)) é verificado **no servidor do
Supabase**, no GET. Esse link continua vulnerável a prévias e filtros. Por isso, para convites, o
caminho recomendado é `invite-beta.ts --link`, que aponta para `/auth/confirm`.
