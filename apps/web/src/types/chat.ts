export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export type ChatStatus = "idle" | "loading" | "streaming" | "error";
