import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import type { createClient } from "@/lib/supabase/server";

export interface MessageRow {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function buildConversationMessages(
  supabase: SupabaseServerClient,
  sessionId: string
): Promise<MessageParam[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    role: row.role,
    content: row.content,
  }));
}
