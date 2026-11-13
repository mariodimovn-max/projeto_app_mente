// Convida beta testers via Supabase Auth Admin (auth.admin.inviteUserByEmail), o mesmo mecanismo
// do botão "Invite user" do dashboard. Uso, a partir de apps/web:
//
//   node --env-file=.env.local scripts/invite-beta.ts email1@exemplo.com [email2@exemplo.com ...]
//
// Com --link, em vez de enviar e-mail, gera (generateLink) e imprime um link de ativação direto
// em /auth/confirm?token_hash=...&type=invite, para mandar por outro canal ou usar na hora. Útil
// quando o e-mail padrão do Supabase está no limite de envios por hora, ou quando o provedor de
// e-mail "visita" o link antes do usuário e queima o token de uso único.
//
// Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do ambiente (nunca imprime a chave).
// O e-mail usa o template padrão do Supabase ({{ .ConfirmationURL }}): após validar o token, o
// Supabase redireciona para {host}/auth/callback com a sessão no fragmento, e essa página segue
// para /auth/definir-senha (ver ADR 0006). O host padrão é http://localhost:3000; para outro
// ambiente (ex.: produção) passe --redirect-to=https://seu-dominio — ele precisa constar em
// additional_redirect_urls (supabase/config.toml).
import { createClient } from "@supabase/supabase-js";

const DEFAULT_REDIRECT_HOST = "http://localhost:3000";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY. Rode com --env-file=.env.local."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const redirectArg = args.find((arg) => arg.startsWith("--redirect-to="));
const redirectHost = (redirectArg?.slice("--redirect-to=".length) || DEFAULT_REDIRECT_HOST).replace(
  /\/+$/,
  ""
);
const redirectTo = `${redirectHost}/auth/callback?next=/auth/definir-senha`;
const linkOnly = args.includes("--link");
const emails = args.filter((arg) => !arg.startsWith("--"));

if (emails.length === 0) {
  console.error("Informe ao menos um e-mail para convidar.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failures = 0;

for (const email of emails) {
  if (linkOnly) {
    // Usuário já existente (convite anterior validado, mas sem senha definida): "invite" é
    // recusado pelo Supabase, então cai para um link de recuperação, que também leva a uma tela
    // de definir senha (/auth/redefinir-senha).
    let link = await admin.auth.admin.generateLink({ type: "invite", email });
    let type: "invite" | "recovery" = "invite";

    if (link.error?.message.includes("already been registered")) {
      link = await admin.auth.admin.generateLink({ type: "recovery", email });
      type = "recovery";
    }

    if (link.error) {
      failures += 1;
      console.error(`✗ ${email}: ${link.error.message}`);
      continue;
    }

    const activationLink = `${redirectHost}/auth/confirm?token_hash=${link.data.properties.hashed_token}&type=${type}`;
    console.log(
      `✓ ${email}: link de ${type === "invite" ? "ativação" : "definição de senha (conta já existia)"} — uso único, expira conforme otp_expiry:\n  ${activationLink}`
    );
    continue;
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (error) {
    failures += 1;
    console.error(`✗ ${email}: ${error.message}`);
    continue;
  }

  console.log(`✓ ${email}: convite enviado (user id ${data.user.id})`);
}

// exitCode em vez de process.exit(): no Windows, encerrar à força com o client HTTP do Supabase
// ainda aberto dispara uma assertion do libuv ("UV_HANDLE_CLOSING") depois do envio.
process.exitCode = failures > 0 ? 1 : 0;
