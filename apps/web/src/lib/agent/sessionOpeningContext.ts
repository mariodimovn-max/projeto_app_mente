// Tipos puros (sem imports), propositalmente separados de memory.ts: prompts.ts precisa
// desta forma para montar a abertura adaptativa (Story 3.6), mas prompts.ts também é
// importado transitivamente por scripts/agent-test.ts sob o tsconfig.json da raiz, que não
// resolve o alias "@/*" nem tipos DOM. Se este tipo morasse em memory.ts, o typecheck da
// raiz arrastaria as importações de Supabase/DOM de memory.ts e quebraria.
export type ResponsePattern = "curto" | "longo" | null;

export interface SessionOpeningContext {
  isFirstSession: boolean;
  previousOpeningPhrase: string | null;
  responsePattern: ResponsePattern;
  topThemes: string[];
}
