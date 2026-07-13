import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT_PATH = "/auth/definir-senha";
const INVALID_INVITE_REDIRECT = "/auth?erro=convite-invalido";

function resolveNextPath(next: string | null): string {
  // Só aceita caminhos internos (um único "/") — evita open redirect via
  // "next=@evil.com/..." ou "next=//evil.com" e o caso de "next=" vazio.
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return DEFAULT_NEXT_PATH;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = resolveNextPath(searchParams.get("next"));

  if (tokenHash && type === "invite") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${INVALID_INVITE_REDIRECT}`);
}
