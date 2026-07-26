import { z } from "zod";

export const sessionSynthesisContentSchema = z.object({
  title: z.string().trim().min(1),
  themes: z.array(z.string().trim().min(1)).min(1).max(5),
  explored: z.string().trim().min(1),
  patterns: z.array(z.string().trim().min(1)).min(1).max(3),
  openQuestion: z.string().trim().min(1),
});

export type SessionSynthesisContent = z.infer<typeof sessionSynthesisContentSchema>;
