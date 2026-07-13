import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // Reutiliza uma única instância no browser — recriar o client a cada
  // chamada duplica listeners/timers internos do GoTrueClient.
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return browserClient;
}
