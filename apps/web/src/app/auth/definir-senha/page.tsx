import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DefinirSenhaForm } from "./DefinirSenhaForm";
import styles from "../page.module.css";

export default async function DefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Nota (Story 1.5): este gate só confirma que existe uma sessão ativa, não
  // que ela veio de uma verificação de convite recém-concluída. Hoje isso é
  // seguro porque login ainda não existe — nenhuma outra forma de obter
  // sessão. Quando a 1.5 implementar login, revisar se um usuário já
  // autenticado deveria conseguir chegar aqui livremente.
  if (!user) {
    redirect("/auth?erro=convite-invalido");
  }

  return (
    <main className={styles.main}>
      <section className={`${styles.card} container`} aria-labelledby="definir-senha-title">
        <p className={styles.eyebrow}>Ativação de convite</p>
        <h1 id="definir-senha-title" className={styles.title}>
          Defina sua senha
        </h1>
        <p className={styles.subtitle}>
          Este é o último passo para ativar sua conta ({user.email}). Escolha
          uma senha segura para acessar o app.
        </p>

        <DefinirSenhaForm />
      </section>
    </main>
  );
}
