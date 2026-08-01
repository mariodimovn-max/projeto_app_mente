import { z } from "zod";

export const sessionSynthesisContentSchema = z.object({
  title: z.string().trim().min(1),
  themes: z.array(z.string().trim().min(1)).min(1).max(5),
  explored: z.string().trim().min(1),
  patterns: z.array(z.string().trim().min(1)).min(1).max(3),
  openQuestion: z.string().trim().min(1),
  // emotions/triggers (Story 3.3) alimentam o agregado `user_patterns` — não são
  // exibidos no SynthesisCard, só usados para a detecção de padrões longitudinais.
  emotions: z.array(z.string().trim().min(1)).min(1).max(3),
  triggers: z.array(z.string().trim().min(1)).max(3),
});

export type SessionSynthesisContent = z.infer<typeof sessionSynthesisContentSchema>;
