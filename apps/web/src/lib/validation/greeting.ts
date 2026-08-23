import { z } from "zod";

export const dailyGreetingContentSchema = z.object({
  message: z.string().trim().min(1),
});

export type DailyGreetingContent = z.infer<typeof dailyGreetingContentSchema>;
