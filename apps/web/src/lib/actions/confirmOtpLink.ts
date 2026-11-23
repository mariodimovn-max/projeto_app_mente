"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_NEXT_PATH_BY_TYPE,
  FALLBACK_INVALID_REDIRECT,
  INVALID_REDIRECT_BY_TYPE,
  isOtpLinkType,
  resolveNextPath,
} from "@/lib/auth/otpLink";

// Consome o token de uso único do link de convite/recuperação. Roda só quando a pessoa toca no
// botão da página /auth/confirm (POST): prévias de link do WhatsApp e filtros de e-mail apenas
// fazem GET e não gastam o token (ver docs/wiki/auth.md).
export async function confirmOtpLink(formData: FormData): Promise<void> {
  const type = formData.get("type");
  const tokenHash = formData.get("token_hash");

  if (!isOtpLinkType(type)) {
    redirect(FALLBACK_INVALID_REDIRECT);
  }

  if (typeof tokenHash !== "string" || tokenHash === "") {
    redirect(INVALID_REDIRECT_BY_TYPE[type]);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    redirect(INVALID_REDIRECT_BY_TYPE[type]);
  }

  redirect(resolveNextPath(formData.get("next"), DEFAULT_NEXT_PATH_BY_TYPE[type]));
}
