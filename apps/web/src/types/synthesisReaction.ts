import type { SynthesisReactionEmoji } from "@/lib/synthesis/reactions";

export type SynthesisReactionInput =
  | { emoji: SynthesisReactionEmoji; comment?: undefined }
  | { comment: string; emoji?: undefined };
