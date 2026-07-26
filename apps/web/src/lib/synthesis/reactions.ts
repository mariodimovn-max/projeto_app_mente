// Definições compartilhadas entre a validação da Server Action (lib/actions/synthesisReaction.ts)
// e a UI do dock de reação (components/insights/SynthesisReactionDock.tsx), para não duplicar a
// lista de emojis em dois lugares. Chaves e glifos seguem o arquivo de design "Aura - Reação".
export const SYNTHESIS_REACTION_EMOJI_KEYS = ["onda", "gota", "bolha", "broto", "vela"] as const;

export type SynthesisReactionEmoji = (typeof SYNTHESIS_REACTION_EMOJI_KEYS)[number];

export const SYNTHESIS_REACTION_EMOJIS: ReadonlyArray<{
  key: SynthesisReactionEmoji;
  glyph: string;
  label: string;
  // Legenda curta visível sob o glifo — sem hover em touch/Android, o emoji sozinho não
  // comunica seu significado (decisão de revisão da Story 3.2, diverge do arquivo de
  // design original que só mostra o glifo).
  caption: string;
}> = [
  { key: "onda", glyph: "🌊", label: "Me moveu", caption: "moveu" },
  { key: "gota", glyph: "💧", label: "Me pegou fundo", caption: "fundo" },
  { key: "bolha", glyph: "🫧", label: "Aliviou", caption: "aliviou" },
  { key: "broto", glyph: "🌱", label: "Algo começou", caption: "começou" },
  { key: "vela", glyph: "🕯️", label: "Fica comigo", caption: "fica" },
];

export const SYNTHESIS_REACTION_COMMENT_MAX_LENGTH = 80;
