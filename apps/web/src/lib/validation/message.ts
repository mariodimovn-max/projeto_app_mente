import { z } from "zod";

export const MIN_MESSAGE_LENGTH = 10;
export const MAX_MESSAGE_LENGTH = 5000;

export const messageContentSchema = z
  .string()
  .trim()
  .min(MIN_MESSAGE_LENGTH, `A mensagem precisa ter pelo menos ${MIN_MESSAGE_LENGTH} caracteres.`)
  .max(MAX_MESSAGE_LENGTH, `A mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);

export const chatRequestSchema = z.object({
  message: messageContentSchema,
  sessionId: z.string().uuid().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
