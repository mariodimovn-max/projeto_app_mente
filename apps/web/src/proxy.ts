import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Header interno usado para repassar aos Server Components o resultado do
// getUser() já feito aqui — evita que cada página precise chamar getUser()
// de novo e pague uma segunda ida à rede ao Supabase Auth na mesma
// requisição. Não é um mecanismo de autorização: só evita I/O redundante,
// a decisão de acesso continua 100% via RLS no Postgres.
export const SESSION_USER_HEADER = "x-app-session-user";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() dispara a renovação do token de sessão a cada request — não
  // remover mesmo quando só usamos o `user` para o header abaixo (padrão
  // oficial @supabase/ssr).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookiesToPreserve = response.cookies.getAll();
  request.headers.set(SESSION_USER_HEADER, user ? "1" : "0");
  response = NextResponse.next({ request });
  cookiesToPreserve.forEach((cookie) => response.cookies.set(cookie));

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
