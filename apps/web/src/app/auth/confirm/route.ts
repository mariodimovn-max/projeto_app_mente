import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT_PATH_BY_TYPE = {
  invite: "/auth/definir-senha",
  recovery: "/auth/redefinir-senha",
} as const;

const INVALID_REDIRECT_BY_TYPE: Record<SupportedType, string> = {
  invite: "/auth?erro=convite-invalido",
  recovery: "/auth?erro=link-invalido",
};

const FALLBACK_INVALID_REDIRECT = "/auth?erro=convite-invalido";

type SupportedType = keyof typeof DEFAULT_NEXT_PATH_BY_TYPE;

function isSupportedType(type: string | null): type is SupportedType {
  return type === "invite" || type === "recovery";
}

function resolveNextPath(next: string | null, fallback: string): string {
  // Só aceita caminhos internos (um único "/") — evita open redirect via
  // "next=@evil.com/..." ou "next=//evil.com" e o caso de "next=" vazio.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Type desconhecido/ausente: não há como saber qual mensagem de erro é a
  // mais apropriada, então usa o fallback genérico.
  if (!isSupportedType(type)) {
    return NextResponse.redirect(`${origin}${FALLBACK_INVALID_REDIRECT}`);
  }

  if (tokenHash) {
    const next = resolveNextPath(searchParams.get("next"), DEFAULT_NEXT_PATH_BY_TYPE[type]);
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Type reconhecido mas token_hash ausente/inválido: usa a mensagem de erro
  // específica do type (ex.: não confundir link de recuperação com convite).
  return NextResponse.redirect(`${origin}${INVALID_REDIRECT_BY_TYPE[type]}`);
}
