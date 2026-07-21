import type { createClient } from "@/lib/supabase/server";

// A generous sanity ceiling, not a cost-driven ration — Sonnet 5 makes even a long, deep
// journaling session cost cents. This exists to catch anomalies (a runaway client loop,
// a script) rather than to cap how much a user reflects in a day. See Story 2.6.
export const DAILY_MESSAGE_LIMIT = 60;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function startOfTodayUtcIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

// Counts today's user-authored messages across all of the user's sessions, joining
// through `sessions` (messages has no user_id of its own) so the daily counter needs no
// dedicated table or reset job — "today" is always derived fresh from `created_at`.
export async function countUserMessagesToday(
  supabase: SupabaseServerClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("id, sessions!inner(user_id)", { count: "exact", head: true })
    .eq("sessions.user_id", userId)
    .eq("role", "user")
    .gte("created_at", startOfTodayUtcIso());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function hasReachedDailyMessageLimit(
  supabase: SupabaseServerClient,
  userId: string
): Promise<boolean> {
  const count = await countUserMessagesToday(supabase, userId);
  return count >= DAILY_MESSAGE_LIMIT;
}
