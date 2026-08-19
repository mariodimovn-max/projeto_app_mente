"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GENERIC_ERROR = "Não foi possível excluir sua conta agora. Tente novamente em instantes.";

// Story 5.2: registra a auditoria (AC3) antes de destruir a conta — diferente do best-effort
// usado em export_data (Story 5.1), aqui a gravação bloqueia a exclusão se falhar, já que a
// ordem "audita, depois destrói" é o próprio critério de aceite, não um extra. Todas as tabelas
// com dados do usuário (sessions, messages, session_syntheses, session_synthesis_reactions,
// user_patterns, personal_milestones e o próprio audit_log) já têm ON DELETE CASCADE a partir
// de auth.users, então excluir o usuário no Auth (AC2) já destrói tudo em cascata (AC1) — não há
// delete explícito tabela a tabela. Isso inclui a própria linha de audit_log criada logo abaixo:
// ela é apagada junto pela cascata assim que a conta é destruída, consistente com "destruição
// permanente e irreversível" (AC4), mas significa que audit_log não sobrevive para consulta
// posterior — uma trilha de auditoria persistente fora do escopo do usuário é assunto da
// Story 5.3.
export async function deleteAccount(): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: GENERIC_ERROR };
  }

  try {
    const { error: auditError } = await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "delete_account",
    });

    if (auditError) {
      console.error("Falha ao registrar auditoria de exclusão de conta:", {
        message: auditError.message,
        code: auditError.code,
        details: auditError.details,
        hint: auditError.hint,
      });
      return { error: GENERIC_ERROR };
    }

    try {
      const admin = createAdminClient();
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        throw deleteError;
      }
    } catch (deleteAccountError) {
      console.error(
        "Falha ao excluir conta no Supabase Auth:",
        deleteAccountError instanceof Error
          ? { message: deleteAccountError.message, stack: deleteAccountError.stack }
          : deleteAccountError
      );
      // A auditoria acima já registrou a tentativa (AC3) antes de sabermos que a exclusão
      // falharia — grava um segundo registro para a trilha não ficar enganosa (parecendo que
      // a conta foi destruída quando não foi), já que audit_log só permite insert, nunca
      // update/delete, nem para o próprio dono.
      const { error: compensatingAuditError } = await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "delete_account_failed",
      });
      if (compensatingAuditError) {
        console.error(
          "Falha ao registrar auditoria de exclusão de conta que falhou:",
          compensatingAuditError
        );
      }
      return { error: GENERIC_ERROR };
    }
  } catch (error) {
    console.error(
      "Erro inesperado ao excluir conta:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_ERROR };
  }

  // A conta já não existe mais neste ponto — encerra a sessão local mesmo que o signOut
  // falhe ou rejeite (ex.: o refresh token já foi invalidado junto com o usuário), para não
  // deixar cookies de sessão "zumbis" no navegador nem travar o redirect abaixo.
  try {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Falha ao encerrar sessão local após excluir conta:", signOutError);
    }
  } catch (signOutException) {
    console.error("Erro inesperado ao encerrar sessão local após excluir conta:", signOutException);
  }

  redirect("/");
}
