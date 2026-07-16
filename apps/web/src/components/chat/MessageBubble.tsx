import type { ChatMessage } from "@/types/chat";
import styles from "./MessageBubble.module.css";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.agent}`}>
      <p className={styles.content}>{message.content}</p>
      <time className={styles.timestamp} dateTime={message.createdAt}>
        {formatTimestamp(message.createdAt)}
      </time>
    </div>
  );
}
