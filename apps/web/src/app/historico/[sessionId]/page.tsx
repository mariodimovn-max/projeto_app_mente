import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { SESSION_USER_HEADER } from "@/proxy";
import { createClient } from "@/lib/supabase/server";
import { getSessionDetail, type SessionDetail } from "@/lib/history/sessions";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SynthesisCard } from "@/components/insights/SynthesisCard";
import styles from "./page.module.css";

interface SessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Abre a sessão completa com sua síntese a partir de um cartão do Histórico (Story 3.5,
// AC4). Sem síntese (sessão nunca encerrada), mostra só a conversa.
export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const headerList = await headers();
  const isAuthenticated = headerList.get(SESSION_USER_HEADER) === "1";
  if (!isAuthenticated) {
    redirect("/auth");
  }

  const { sessionId } = await params;
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  let detail: SessionDetail | null = null;
  let loadError: string | null = null;
  try {
    detail = await getSessionDetail(supabase, user.id, sessionId);
  } catch (error) {
    console.error(
      "Erro ao carregar sessão do histórico:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    loadError = "Não consegui carregar essa sessão agora. Tente novamente em instantes.";
  }

  if (loadError) {
    return (
      <main className={styles.main}>
        <Link href="/historico" className={styles.backLink}>
          ← Histórico
        </Link>
        <p className={styles.errorBanner} role="alert">
          {loadError}
        </p>
      </main>
    );
  }

  if (!detail) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <Link href="/historico" className={styles.backLink}>
        ← Histórico
      </Link>

      <div className={styles.messages} aria-label="Conversa desta sessão">
        {detail.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {detail.synthesis && <SynthesisCard synthesis={detail.synthesis} />}
    </main>
  );
}
