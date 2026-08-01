import type { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types/chat";
import type { HistorySessionSummary } from "@/types/history";
import type { SessionSynthesis } from "@/types/synthesis";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface SessionRow {
  id: string;
  created_at: string;
  marked: boolean;
}

interface SessionSynthesisSummaryRow {
  session_id: string;
  title: string;
  themes: string[];
}

// Busca sessões e sínteses em duas queries separadas (em vez de um embed do PostgREST)
// porque a relação sessions -> session_syntheses é 1:1 via índice único, não FK direta —
// embutir traria um array `session_syntheses: [...]` com formato incerto. Duas queries
// simples + merge em memória evitam essa ambiguidade.
export async function listSessionHistory(
  supabase: SupabaseServerClient,
  userId: string
): Promise<HistorySessionSummary[]> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, created_at, marked")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SessionRow[]>();

  if (sessionsError) {
    throw sessionsError;
  }

  const sessionRows = sessions ?? [];
  if (sessionRows.length === 0) {
    return [];
  }

  const { data: syntheses, error: synthesesError } = await supabase
    .from("session_syntheses")
    .select("session_id, title, themes")
    .in(
      "session_id",
      sessionRows.map((session) => session.id)
    )
    .returns<SessionSynthesisSummaryRow[]>();

  if (synthesesError) {
    throw synthesesError;
  }

  const synthesisBySessionId = new Map(
    (syntheses ?? []).map((synthesis) => [synthesis.session_id, synthesis])
  );

  return sessionRows.map((session) => {
    const synthesis = synthesisBySessionId.get(session.id) ?? null;
    return {
      id: session.id,
      createdAt: session.created_at,
      title: synthesis?.title ?? null,
      themes: synthesis?.themes ?? [],
      hasSynthesis: synthesis !== null,
      marked: session.marked,
    };
  });
}

export interface SessionDetail {
  id: string;
  createdAt: string;
  messages: ChatMessage[];
  synthesis: SessionSynthesis | null;
}

interface MessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface FullSynthesisRow {
  id: string;
  title: string;
  themes: string[];
  explored: string;
  patterns: string[];
  open_question: string;
  depth: number;
  created_at: string;
}

// Retorna null quando a sessão não existe ou não pertence ao usuário — RLS já impede a
// leitura de sessões alheias, mas o caller (a página de detalhe) precisa distinguir esse
// caso de "sessão sem mensagens" para decidir entre notFound() e uma tela vazia.
export async function getSessionDetail(
  supabase: SupabaseServerClient,
  userId: string,
  sessionId: string
): Promise<SessionDetail | null> {
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, created_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; created_at: string }>();

  if (sessionError) {
    throw sessionError;
  }
  if (!session) {
    return null;
  }

  const [messagesResult, synthesisResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .returns<MessageRow[]>(),
    supabase
      .from("session_syntheses")
      .select("id, title, themes, explored, patterns, open_question, depth, created_at")
      .eq("session_id", sessionId)
      .maybeSingle<FullSynthesisRow>(),
  ]);

  if (messagesResult.error) {
    throw messagesResult.error;
  }
  if (synthesisResult.error) {
    throw synthesisResult.error;
  }

  const messages: ChatMessage[] = (messagesResult.data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));

  const synthesisRow = synthesisResult.data;
  let synthesis: SessionSynthesis | null = null;
  if (synthesisRow) {
    const exchangeCount = messages.filter((message) => message.role === "user").length;
    const durationMinutes = Math.max(
      0,
      Math.round(
        (new Date(synthesisRow.created_at).getTime() - new Date(session.created_at).getTime()) /
          60000
      )
    );
    synthesis = {
      id: synthesisRow.id,
      title: synthesisRow.title,
      themes: synthesisRow.themes,
      explored: synthesisRow.explored,
      patterns: synthesisRow.patterns,
      openQuestion: synthesisRow.open_question,
      depth: synthesisRow.depth,
      durationMinutes,
      exchangeCount,
      createdAt: synthesisRow.created_at,
    };
  }

  return {
    id: session.id,
    createdAt: session.created_at,
    messages,
    synthesis,
  };
}
