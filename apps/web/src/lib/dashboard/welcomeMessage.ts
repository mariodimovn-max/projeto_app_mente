import type { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/agent/client.server";
import { generateDailyGreeting } from "@/lib/agent/greeting";
import { getDailyGreetingState, saveDailyGreeting } from "@/lib/patterns/userPatterns";
import { todayDayKey } from "@/lib/dashboard/date";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Nunca deixa a Home sem mensagem por causa de uma IA lenta — best-effort, com um teto
// bem abaixo da meta de resposta do agente de chat (NFR: <5s), já que isto é só um
// complemento decorativo da saudação, não o conteúdo principal da tela.
const GENERATION_TIMEOUT_MS = 4000;

// Mensagem usada quando a IA falha, demora demais, ou o usuário ainda não tem nenhuma
// sessão sintetizada (nada para refletir ainda) — mantém o mesmo tom acolhedor do resto
// do onboarding em vez de deixar a lateral da Aura vazia.
const FALLBACK_MESSAGE =
  "Você não precisa mergulhar hoje. Só quisemos te mostrar o caminho que já percorreu.";

// Mensagem de boas-vindas da lateral da Aura na Home (fora do fluxo de crise, best-effort
// como o resto da memória do agente — ver lib/agent/memory.ts). Gerada por IA no máximo
// 1x por dia por usuário (cache em user_patterns.daily_greeting) para não pagar
// latência/custo de IA a cada carregamento da Home nem soar repetitiva de um dia para o
// outro. Usuários sem nenhuma sessão sintetizada ainda recebem a mensagem estática — não
// há histórico algum para refletir, e evita gastar uma chamada à IA sem propósito.
export async function getWelcomeMessage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<string> {
  let state;
  try {
    state = await getDailyGreetingState(supabase, userId);
  } catch (error) {
    console.error(
      "Erro ao ler o cache da mensagem de boas-vindas:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return FALLBACK_MESSAGE;
  }

  if (!state || state.sessionCount === 0) {
    return FALLBACK_MESSAGE;
  }

  const todayKey = todayDayKey();
  if (state.cachedMessage && state.cachedDate === todayKey) {
    return state.cachedMessage;
  }

  try {
    const { message } = await generateDailyGreeting(
      getAnthropicClient(),
      { topTheme: state.topTheme, previousMessage: state.cachedMessage },
      { timeoutMs: GENERATION_TIMEOUT_MS }
    );

    try {
      await saveDailyGreeting(supabase, userId, message, todayKey);
    } catch (saveError) {
      // Best-effort: a mensagem gerada ainda vale para esta requisição, só não fica
      // guardada para a próxima visita do dia (que vai gerar de novo).
      console.error(
        "Erro ao salvar o cache da mensagem de boas-vindas:",
        saveError instanceof Error ? { message: saveError.message, stack: saveError.stack } : saveError
      );
    }

    return message;
  } catch (error) {
    console.error(
      "Erro ao gerar a mensagem de boas-vindas do dia:",
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
    return state.cachedMessage ?? FALLBACK_MESSAGE;
  }
}
