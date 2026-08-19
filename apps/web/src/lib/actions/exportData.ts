"use server";

import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Não consegui exportar seus dados agora. Tente novamente.";

// Cobre bem mais sessões do que qualquer usuário do beta fechado deveria acumular — mesma
// salvaguarda contra volume anômalo usada em lib/dashboard/dashboard.ts e
// lib/summaries/weeklySummary.ts, não um teto real.
const SESSIONS_ROW_CAP = 3000;

interface SessionRow {
  id: string;
  created_at: string;
  marked: boolean;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface SynthesisRow {
  session_id: string;
  title: string;
  themes: string[] | null;
  explored: string;
  patterns: string[] | null;
  open_question: string;
  depth: number;
  emotions: string[] | null;
  triggers: string[] | null;
  created_at: string;
}

interface UserPatternsRow {
  themes: Record<string, number> | null;
  emotions: Record<string, number> | null;
  triggers: Record<string, number> | null;
  session_count: number | null;
  updated_at: string;
}

export interface ExportedMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface ExportedSynthesis {
  title: string;
  themes: string[];
  explored: string;
  patterns: string[];
  openQuestion: string;
  depth: number;
  emotions: string[];
  triggers: string[];
  createdAt: string;
}

export interface ExportedSession {
  id: string;
  createdAt: string;
  marked: boolean;
  messages: ExportedMessage[];
  synthesis: ExportedSynthesis | null;
}

export interface ExportedUserPatterns {
  themes: Record<string, number>;
  emotions: Record<string, number>;
  triggers: Record<string, number>;
  sessionCount: number;
  updatedAt: string;
}

export interface ExportDataPayload {
  exportedAt: string;
  user: { id: string; email: string | null };
  sessions: ExportedSession[];
  patterns: ExportedUserPatterns | null;
}

// Story 5.1 (AC1): exporta sessões, mensagens, sínteses e o agregado de padrões do próprio
// usuário como um objeto serializável — sem gerar o arquivo no servidor (isso é feito no
// client, ver lib/export/downloadJson.ts, mesmo padrão de Server Action + geração client-side
// já usado para o PDF de resumo na Story 4.6).
export async function exportUserData(): Promise<
  { data: ExportDataPayload } | { error: string }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: GENERIC_ERROR };
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, created_at, marked")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(SESSIONS_ROW_CAP)
      .returns<SessionRow[]>();

    if (sessionsError) {
      throw sessionsError;
    }

    const sessionIds = (sessions ?? []).map((session) => session.id);

    const [messagesResult, synthesesResult, patternsResult] = await Promise.all([
      sessionIds.length === 0
        ? { data: [] as MessageRow[], error: null }
        : supabase
            .from("messages")
            .select("id, session_id, role, content, created_at")
            .in("session_id", sessionIds)
            .order("created_at", { ascending: true })
            .returns<MessageRow[]>(),
      sessionIds.length === 0
        ? { data: [] as SynthesisRow[], error: null }
        : supabase
            .from("session_syntheses")
            .select(
              "session_id, title, themes, explored, patterns, open_question, depth, emotions, triggers, created_at"
            )
            .in("session_id", sessionIds)
            .returns<SynthesisRow[]>(),
      supabase
        .from("user_patterns")
        .select("themes, emotions, triggers, session_count, updated_at")
        .eq("user_id", user.id)
        .maybeSingle<UserPatternsRow>(),
    ]);

    if (messagesResult.error) {
      throw messagesResult.error;
    }
    if (synthesesResult.error) {
      throw synthesesResult.error;
    }
    if (patternsResult.error) {
      throw patternsResult.error;
    }

    const messagesBySession = new Map<string, ExportedMessage[]>();
    for (const message of messagesResult.data ?? []) {
      const list = messagesBySession.get(message.session_id) ?? [];
      list.push({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
      });
      messagesBySession.set(message.session_id, list);
    }

    const synthesisBySession = new Map<string, ExportedSynthesis>();
    for (const synthesis of synthesesResult.data ?? []) {
      synthesisBySession.set(synthesis.session_id, {
        title: synthesis.title,
        themes: synthesis.themes ?? [],
        explored: synthesis.explored,
        patterns: synthesis.patterns ?? [],
        openQuestion: synthesis.open_question,
        depth: synthesis.depth,
        emotions: synthesis.emotions ?? [],
        triggers: synthesis.triggers ?? [],
        createdAt: synthesis.created_at,
      });
    }

    const exportedSessions: ExportedSession[] = (sessions ?? []).map((session) => ({
      id: session.id,
      createdAt: session.created_at,
      marked: session.marked,
      messages: messagesBySession.get(session.id) ?? [],
      synthesis: synthesisBySession.get(session.id) ?? null,
    }));

    const patternsData = patternsResult.data;
    const patterns: ExportedUserPatterns | null = patternsData
      ? {
          themes: patternsData.themes ?? {},
          emotions: patternsData.emotions ?? {},
          triggers: patternsData.triggers ?? {},
          sessionCount: patternsData.session_count ?? 0,
          updatedAt: patternsData.updated_at,
        }
      : null;

    // Best-effort (mesmo padrão de updateUserPatterns/buildMemoryContext): a exportação já
    // foi montada com sucesso, então uma falha ao gravar a trilha de auditoria não deve
    // impedir o usuário de baixar seus próprios dados — só fica registrada no log do servidor.
    const { error: auditError } = await supabase.from("audit_log").insert({
      user_id: user.id,
      action: "export_data",
    });

    if (auditError) {
      console.error("Erro ao registrar auditoria de exportação de dados:", {
        message: auditError.message,
        code: auditError.code,
        details: auditError.details,
        hint: auditError.hint,
      });
    }

    return {
      data: {
        exportedAt: new Date().toISOString(),
        user: { id: user.id, email: user.email ?? null },
        sessions: exportedSessions,
        patterns,
      },
    };
  } catch (error) {
    console.error(
      "Erro ao exportar dados do usuário:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return { error: GENERIC_ERROR };
  }
}
